import express from "express";
import { placeTrade, getUserTrades, settleTrades } from "../controllers/tradeController.js";
import {protect, protectAdmin} from "../middleware/authMiddleware.js";

const tradeRouter = express.Router();

// User places a trade
tradeRouter.post("/", protect, placeTrade);

// Get user trades
tradeRouter.get("/", protect, getUserTrades);

// Admin settles trades
tradeRouter.post("/settle", protectAdmin, settleTrades);

export default tradeRouter;
