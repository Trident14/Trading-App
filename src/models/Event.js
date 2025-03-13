import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    eventId: { type: String, required: true, unique: true, index: true }, 
    name: { type: String, required: true },
    date: { type: Date, required: true },
    odds: { type: Object, required: true },
    scores: { type: Object, default: {} },
    status: { type: String, enum: ["upcoming", "ongoing", "completed"], default: "upcoming" },
    winner: { type: String, default: null }
});

const Event = mongoose.model("Event", eventSchema);
export default Event;
