import Event from "../models/Event.js";
import { io } from "../server.js";
import logger from "../utils/logger.js"; // Import logger

const getRandomIncrement = (sport) => {
    switch (sport) {
        case "Football": return Math.random() < 0.3 ? 1 : 0;
        case "Basketball": return Math.floor(Math.random() * 3);
        case "Tennis": return Math.random() < 0.5 ? 1 : 0;
        case "Cricket": return Math.floor(Math.random() * 7);
        default: return 0;
    }
};

const getDynamicOdds = (team1, team2, score1, score2) => {
    const baseOdd = 1.2;
    const maxOdd = 3.0;
    const diff = score1 - score2;

    const odds1 = (diff > 0 ? baseOdd + (maxOdd - baseOdd) * (1 / (diff + 2)) :
        maxOdd - (maxOdd - baseOdd) * (1 / (-diff + 2))).toFixed(2);
    const odds2 = (diff < 0 ? baseOdd + (maxOdd - baseOdd) * (1 / (-diff + 2)) :
        maxOdd - (maxOdd - baseOdd) * (1 / (diff + 2))).toFixed(2);

    return { [team1]: odds1, [team2]: odds2 };
};

//  Update Scores and Notify Users
export const updateScores = async (req, res) => {
    try {
        const { eventId } = req.query;

        if (!eventId) {
            logger.warn("Missing eventId in request");
            return res.status(400).json({ error: "Event ID is required" });
        }

        const event = await Event.findOne({ eventId });
        if (!event) {
            logger.warn(`Event not found: ${eventId}`);
            return res.status(404).json({ error: "Event not found" });
        }

        if (event.status === "completed") {
            logger.info(`Attempted to update completed event: ${eventId}`);
            return res.status(400).json({ error: "Event is already completed" });
        }

        const teams = Object.keys(event.scores);
        const scoringTeam = Math.random() < 0.5 ? teams[0] : teams[1];

        // Generate a random score increment
        const increment = getRandomIncrement(event.name);
        event.scores[scoringTeam] += increment;
        event.markModified("scores");

        // Update odds
        event.odds = getDynamicOdds(teams[0], teams[1], event.scores[teams[0]], event.scores[teams[1]]);
        event.markModified("odds");

        // Randomly decide if the match should end
        const shouldEndMatch = Math.random() < 0.15;
        let winner = null;

        if (shouldEndMatch) {
            winner = event.scores[teams[0]] === event.scores[teams[1]]
                ? teams[Math.floor(Math.random() * 2)]
                : event.scores[teams[0]] > event.scores[teams[1]]
                    ? teams[0]
                    : teams[1];

            event.winner = winner;
            event.status = "completed";
            event.markModified("winner");
            event.markModified("status");
            logger.info(`Event ${eventId} completed. Winner: ${winner}`);
        }

        await event.save();

        // ✅ Emit event updates
        io.to(eventId).emit("eventUpdate", {
            message: shouldEndMatch ? `🏆 Match Ended! Winner: ${winner}` : "🔄 Scores Updated",
            eventId,
            scores: event.scores,
            odds: event.odds,
            winner: shouldEndMatch ? event.winner : null,
            status: event.status
        });

        logger.info(`Scores updated for event ${eventId}: ${JSON.stringify(event.scores)}`);

        res.json({
            message: shouldEndMatch ? "Match ended" : "Scores updated",
            scores: event.scores,
            odds: event.odds,
            winner: shouldEndMatch ? event.winner : null,
            status: event.status
        });
    } catch (error) {
        logger.error(`Error updating scores: ${error.message}`);
        res.status(500).json({ error: "Error updating scores" });
    }
};

// Update Event Status and Notify Users
export const updateEventStatus = async (req, res) => {
    try {
        const { eventId, status } = req.query;

        if (!eventId || !status) {
            logger.warn("Missing eventId or status in request");
            return res.status(400).json({ error: "Event ID and status are required" });
        }

        const validStatuses = ["upcoming", "ongoing", "completed"];
        if (!validStatuses.includes(status)) {
            logger.warn(`Invalid event status update attempt: ${status}`);
            return res.status(400).json({ error: "Invalid event status" });
        }

        const event = await Event.findOne({ eventId });
        if (!event) {
            logger.warn(`Event not found: ${eventId}`);
            return res.status(404).json({ error: "Event not found" });
        }
        if(event.status === "completed"){
            return res.status(400).json({ error: "Event is already completed" });
        }

        event.status = status;

        let winner = null;
        if (status === "completed") {
            const teams = Object.keys(event.scores);
            const score1 = event.scores[teams[0]];
            const score2 = event.scores[teams[1]];

            if (score1 > score2) {
                event.winner = teams[0];
            } else if (score1 < score2) {
                event.winner = teams[1];
            } else {
                event.winner = "draw";
            }

            winner = event.winner;
            logger.info(`Event ${eventId} marked as completed. Winner: ${winner}`);
        }

        await event.save();

        // Notify subscribers via WebSocket
        io.to(eventId).emit("eventUpdate", {
            message: `Event status updated to ${status}`,
            eventId,
            status,
            winner: winner || "Not decided"
        });

        logger.info(`Event ${eventId} status updated to ${status}`);

        res.json({ message: `Event status updated to ${status}`, winner: winner || "Not decided" });
    } catch (error) {
        logger.error(`Error updating event status: ${error.message}`);
        res.status(500).json({ error: "Error updating event status" });
    }
};
