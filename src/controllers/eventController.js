import Event from "../models/Event.js";
import axios from "axios";
import logger from "../utils/logger.js"; // Import the logger

// Fetch and Store Mock Events
export const fetchAndStoreMockEvents = async (req, res) => {
    try {
        logger.info("Fetching mock events from external API...");
        const response = await axios.get("http://localhost:4090/mock/events");

        if (!response.data || !response.data.id) {
            logger.error("Invalid response from mock API:", { data: response.data });
            return res.status(500).json({ error: "Invalid response from mock API" });
        }

        const event = response.data;

        const newEvent = {
            eventId: event.id,
            name: event.sport_title,
            date: event.commence_time,
            odds: event.bookmakers?.[0]?.odds || {}, // Extract odds from first bookmaker
            scores: event.scores || {},
            status: "upcoming"
        };

        // Insert into MongoDB or update existing event
        await Event.updateOne(
            { eventId: newEvent.eventId },
            { $set: newEvent },
            { upsert: true }
        );

        logger.info(`Mock event stored successfully: ${event.sport_title} (${event.id})`);
        res.json({ message: "Mock event stored successfully", event: newEvent });
    } catch (error) {
        logger.error("Error fetching mock event:", { message: error.message, stack: error.stack });
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get All Stored Events
export const allEvents = async (req, res) => {
    try {
        logger.info("Retrieving all stored events...");
        const events = await Event.find().lean(); // Use lean() for performance boost
        logger.info(`Retrieved ${events.length} events successfully.`);
        res.json(events);
    } catch (error) {
        logger.error("Error retrieving events:", { message: error.message, stack: error.stack });
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get Score by Event Name or ID
export const getScoreByEvent = async (req, res) => {
    try {
        const { eventName } = req.query;

        if (!eventName) {
            logger.warn("Event name is required but missing in request.");
            return res.status(400).json({ error: "Event name is required" });
        }

        logger.info(`Retrieving score for event: ${eventName}`);
        const event = await Event.findOne({ name: eventName }).lean();

        if (!event) {
            logger.warn(`Event not found: ${eventName}`);
            return res.status(404).json({ error: "Event not found" });
        }

        logger.info(`Score retrieved for event: ${eventName}`);
        res.json({ eventId: event.eventId, name: event.name, score: event.scores });
    } catch (error) {
        logger.error("Error retrieving event score:", { message: error.message, stack: error.stack });
        res.status(500).json({ error: "Internal server error" });
    }
};
