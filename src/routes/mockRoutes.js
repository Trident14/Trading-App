import express from "express";
import { getEvents } from "../controllers/mockController.js";

const mockRouter = express.Router();

mockRouter.get("/events", getEvents);
// mockRouter.get("/mockOdds", getOdds);
// mockRouter.get("/mockScores", getScores);

export default mockRouter;
