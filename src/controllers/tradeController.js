
import mongoose from "mongoose";
import Trade from "../models/Trade.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import { io } from "../server.js";
import logger from "../utils/logger.js";

// Place a Trade (Bet)
export const placeTrade = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { eventId, selectedTeam, betAmount } = req.body;
        const userId = req.user._id;

        logger.info(`User ${userId} is attempting to place a trade on event ${eventId} for ${selectedTeam} with amount ${betAmount}`);

        // Fetch user and event within the transaction
        const [user, event] = await Promise.all([
            User.findById(userId).session(session),
            Event.findOne({ eventId }).session(session)
        ]);

        if (!user) {
            logger.warn(`User not found: ${userId}`);
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "User not found" });
        }

        if (!event) {
            logger.warn(`Event not found: ${eventId}`);
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "Event not found" });
        }

        if (event.status !== "upcoming") {
            logger.warn(`Betting attempted on non-upcoming event: ${eventId}`);
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "Bets can only be placed on upcoming events" });
        }

        if (user.balance < betAmount) {
            logger.warn(`User ${userId} has insufficient balance for trade.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "Insufficient balance" });
        }

        const odds = event.odds[selectedTeam];
        if (!odds) {
            logger.warn(`Invalid team selection or odds missing: ${selectedTeam}`);
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "Invalid team selection or odds missing" });
        }

        // Deduct balance atomically
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId, balance: { $gte: betAmount } }, // Ensure balance is still sufficient
            { $inc: { balance: -betAmount } },
            { session, new: true }
        );

        if (!updatedUser) {
            logger.warn(`Race condition detected! User ${userId} balance insufficient.`);
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "Insufficient balance" });
        }

        // Check if the user already has a trade on the same event and team
        let trade = await Trade.findOne({ userId, eventId, selectedTeam }).session(session);

        if (trade) {
            await Trade.updateOne({ _id: trade._id }, { $inc: { betAmount } }).session(session);
            logger.info(`Trade updated for user ${userId} on event ${eventId}`);
        } else {
            trade = new Trade({ userId, eventId, selectedTeam, betAmount, odds, status: "pending" });
            await trade.save({ session });
            logger.info(`New trade placed by user ${userId} on event ${eventId}`);
        }

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        // Emit WebSocket event
        io.to(eventId).emit("subscribed", { message: `User ${userId} subscribed to ${eventId}` });

        res.status(201).json({ message: "Trade placed successfully", trade });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.error(`Error placing trade: ${error.message}`, { stack: error.stack });
        res.status(500).json({ error: "Internal server error" });
    }
};


// Admin: Settle Trades
export const settleTrades = async (req, res) => {
    try {
        const { eventId } = req.body;

        logger.info(`Admin initiating trade settlement for event ${eventId}`);

        // Fetch event details
        const event = await Event.findOne({ eventId });
        if (!event) {
            logger.warn(`Event not found during settlement: ${eventId}`);
            return res.status(404).json({ error: "Event not found" });
        }

        if (event.status !== "completed") {
            logger.warn(`Settlement attempted on non-completed event: ${eventId}`);
            return res.status(400).json({ error: "Trades can only be settled for completed events" });
        }

        const winner = event.winner;

        // ✅ Handle Draw Outcome
        if (!winner || winner === "draw") {
            logger.info(`Event ${eventId} ended in a draw. Refunding bets.`);

            const bulkRefunds = trades.map(trade => ({
                updateOne: {
                    filter: { _id: trade.userId },
                    update: { $inc: { balance: trade.betAmount } }
                }
            }));

            await User.bulkWrite(bulkRefunds);

            await Trade.updateMany(
                { eventId, status: "pending" },
                { $set: { status: "refunded" } }
            );

            // Emit draw result via WebSocket
            io.to(eventId).emit("tradeResult", {
                eventId,
                message: `⚖️ Event ${eventId} ended in a draw! Bets have been refunded.`,
                winner: "draw"
            });

            // Cleanup WebSocket room
            setTimeout(() => {
                io.socketsLeave(eventId);
            }, 2000);

            return res.json({ message: "Event ended in a draw. Bets refunded." });
        }

        // ✅ Regular Settlement for Non-Draw Cases
        const trades = await Trade.find({ eventId, status: "pending" });

        if (trades.length === 0) {
            logger.info(`No pending trades to settle for event ${eventId}`);
            return res.json({ message: "No pending trades to settle for this event" });
        }

        const bulkUserUpdates = [];
        const bulkTradeUpdates = [];

        for (const trade of trades) {
            let tradeStatus = "lost";
            let payout = 0;

            if (trade.selectedTeam === winner) {
                payout = trade.betAmount * trade.odds;
                bulkUserUpdates.push({
                    updateOne: {
                        filter: { _id: trade.userId },
                        update: { $inc: { balance: payout } }
                    }
                });
                tradeStatus = "won";
            }

            bulkTradeUpdates.push({
                updateOne: {
                    filter: { _id: trade._id },
                    update: { status: tradeStatus }
                }
            });
        }

        await Promise.all([
            User.bulkWrite(bulkUserUpdates),
            Trade.bulkWrite(bulkTradeUpdates)
        ]);

        logger.info(`Trades settled successfully for event ${eventId}. Winner: ${winner}`);

        // Emit settlement notification
        io.to(eventId).emit("tradeResult", {
            eventId,
            message: `✅ Trades settled for event ${eventId}! Winner: ${winner}`,
            winner
        });

        // Cleanup WebSocket room
        setTimeout(() => {
            io.socketsLeave(eventId);
        }, 2000);

        res.json({ message: "Trades settled successfully", winner });
    } catch (error) {
        logger.error(`Error settling trades: ${error.message}`, { stack: error.stack });
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get User Trades
export const getUserTrades = async (req, res) => {
    try {
        const userId = req.user._id;
        logger.info(`Fetching trades for user ${userId}`);

        const trades = await Trade.find({ userId }).populate("eventId", "name date status").lean();

        logger.info(`Retrieved ${trades.length} trades for user ${userId}`);
        res.json(trades);
    } catch (error) {
        logger.error(`Error retrieving trades: ${error.message}`, { stack: error.stack });
        res.status(500).json({ error: "Internal server error" });
    }
};
