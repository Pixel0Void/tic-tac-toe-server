import { DisconnectReason, Socket } from "socket.io";
import { getRoom } from "./room";
import { GameStateUpdateDto, PlayerDisconnectedDto, PlayerSymbol } from "./dataTypes";
import { io } from "./index";

const socketRoomMap: { [socketId: string]: string } = {};

function emitFullGameStateUpdate(roomId: string) {
    const room = getRoom(roomId);
    if (room) {
        const gameStateData: GameStateUpdateDto = {
            board: room.board,
            scores: { X: room.scores[PlayerSymbol.X]!, O: room.scores[PlayerSymbol.O]! },
            currentTurn: room.currentTurn,
            gameState: room.currentGameState,
            roomId: room.id,
            playersCount: Object.keys(room.players).length
        };
        io.to(roomId).emit("gameStateUpdate", gameStateData);
        console.log(`[SERVER] [ROOM '${roomId}'] Full game state sent`);
    }
}

export function disconnection(socket: Socket, reason: DisconnectReason) {
    console.log(`[SERVER] User disconnected: ${socket.id}, reason: ${reason}`);
    const roomId = socketRoomMap[socket.id];
    if (roomId) {
        const room = getRoom(roomId);
        if (room) {
            let playerSymbol = room.removePlayer(socket.id);
            console.log(`[SERVER] Player ${playerSymbol || "Unknown"} (${socket.id}) left from room '${roomId}'`);
            delete socketRoomMap[socket.id];

            if (Object.keys(room.players).length > 0) {
                const otherSocketId = Object.values(room.playerSockets)[0];
                io.to(roomId).emit("playerDisconnected", { message: `The game ended. Your opponent diconnnected.` } as PlayerDisconnectedDto);
                playerSymbol = room.removePlayer(otherSocketId);
                console.log(`[SERVER] Player ${playerSymbol || "Unknown"} (${otherSocketId}) left from room '${roomId}'`);
                delete socketRoomMap[otherSocketId];
            }
        }
    }
}
