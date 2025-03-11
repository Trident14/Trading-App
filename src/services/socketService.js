import { Server } from "socket.io";

export const initWebSocket = (server) => {
    const io = new Server(server, { cors: { origin: "*" } });

    io.on("connection", (socket) => {
        console.log("🔌 WebSocket Connected:", socket.id);

        socket.on("subscribeToEvent", (eventId) => {
            socket.join(eventId);
            console.log(`Subscribed to event: ${eventId}`);
        });

        socket.on("disconnect", () => {
            console.log("❌ WebSocket Disconnected:", socket.id);
        });
    });

    return io;
};
