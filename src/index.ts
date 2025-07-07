import { createServer } from "http";
import { Server } from "socket.io";
import { assignPlayerToRoom, disconnection } from "./gameLogic";

const httpServer = createServer();

export const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingInterval: 10000,
    pingTimeout: 5000
});

io.on("connection", (socket) => {
    console.log(`[SERVER] User connected: ${socket.id}`);

    socket.on("disconnect", (reason) => {
        disconnection(socket, reason);
    });

    socket.on("findMatch", () => {
        assignPlayerToRoom(socket);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`listening on port: ${PORT}`);
    console.log(`link (for test): http://localhost:${PORT}`);
});
