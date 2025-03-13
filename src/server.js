import http from "http";
import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initWebSocket } from "./services/socketService.js";
import { startScoreUpdates } from "./utils/scoreUpdater.js";


dotenv.config();
const server = http.createServer(app);

// Initialize WebSockets correctly
const io = initWebSocket(server);

// Connect to MongoDB
connectDB();



const PORT = process.env.PORT || 4090;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    startScoreUpdates(); 
});
export { io };