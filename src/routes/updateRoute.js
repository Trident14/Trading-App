import express from "express";
import { updateScores, updateEventStatus } from "../controllers/updateController.js";
import {protectAdmin} from "../middleware/authMiddleware.js";

const tradeRouter = express.Router();

// User places a trade
tradeRouter.post("/",protectAdmin, updateScores);

// Get user trades
tradeRouter.get("/",protectAdmin,updateEventStatus);


export default tradeRouter;
