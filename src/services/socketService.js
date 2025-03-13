import { Server } from "socket.io";

export const initWebSocket = (server) => {
    const io = new Server(server, { cors: { origin: "*" } });

    io.on("connection", (socket) => {
        console.log("🔌 WebSocket Connected:", socket.id);

        // Subscribe user to an event room when they place a bet
        socket.on("subscribeToEvent", (eventId) => {
            socket.join(eventId);
            console.log(`📢 User ${socket.id} subscribed to event: ${eventId}`);
        });

        // Unsubscribe on disconnect
        socket.on("disconnect", () => {
            console.log("❌ WebSocket Disconnected:", socket.id);
        });
    });

    return io;
};
