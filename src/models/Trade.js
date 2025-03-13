import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserTrading", required: true },
    eventId: { type: String, required: true },
    selectedTeam: { type: String, required: true },
    betAmount: { type: Number, required: true },
    odds: { type: Number, required: true },
    status: { type: String, enum: ["pending", "won", "lost"], default: "pending" }
}, { timestamps: true });

export default mongoose.model("Trade", tradeSchema);
