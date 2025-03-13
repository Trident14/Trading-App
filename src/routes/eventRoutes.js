import express from "express";
import { fetchAndStoreMockEvents, getScoreByEvent,allEvents } from "../controllers/eventController.js";

const eventRouter = express.Router();

eventRouter.get("/fetch-events", fetchAndStoreMockEvents);
eventRouter.get("/all", allEvents);
eventRouter.get("/scores", getScoreByEvent);
export default eventRouter;
