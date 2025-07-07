import { DisconnectReason, Socket } from "socket.io";
import { createRoom, getRoom, Room, rooms } from "./room";
import { ErrorDto, GameState, GameStateUpdateDto, PlayerAssignedDto, PlayerDisconnectedDto, PlayerSymbol, RoomJoinedDto } from "./dataTypes";
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

export function assignPlayerToRoom(socket: Socket) {
    let targetRoom: Room | undefined;
    let roomIdToJoin: string | undefined;

    for (const id in rooms) {
        const room = rooms[id];
        if (Object.keys(room.players).length === 1 && room.currentGameState === GameState.WaitingForPlayers) {
            targetRoom = room;
            roomIdToJoin = id;
            console.log(`[SERVER] A room '${roomIdToJoin}' for player ${socket.id} found.`);
            break;
        }
    }

    if (!targetRoom) {
        targetRoom = createRoom();
        roomIdToJoin = targetRoom.id;
        console.log(`[SERVER] A new room '${roomIdToJoin}' for player ${socket.id} created.`);
    }

    if (targetRoom && roomIdToJoin) {
        socket.join(roomIdToJoin);
        socketRoomMap[socket.id] = roomIdToJoin;

        const assignedSymbol = targetRoom.addPlayer(socket.id);
        if (assignedSymbol) {
            socket.emit("playerAssigned", { symbol: assignedSymbol } as PlayerAssignedDto);
            socket.emit("roomJoined", { roomId: roomIdToJoin } as RoomJoinedDto);
            console.log(`[SERVER] Player ${socket.id} assigned ${assignedSymbol} joined to room ${roomIdToJoin}.`);

            if (Object.keys(targetRoom.players).length === 2) {
                targetRoom.currentGameState = GameState.Active;
                io.to(roomIdToJoin).emit("gameReady", "Game started!");
                emitFullGameStateUpdate(roomIdToJoin);
                console.log(`[SERVER] [ROOM '${roomIdToJoin}'] Game started. Two players ready.`);
            } else {
                emitFullGameStateUpdate(roomIdToJoin);
            }
        } else {
            socket.emit("error", { message: "A problem happend when joining player to the room" } as ErrorDto);
            console.error(`[SERVER] Problem when joining player to room ${roomIdToJoin} for ${socket.id}`);
        }
    } else {
        socket.emit("error", { message: "Internal error: Room for joining didn't find/create" } as ErrorDto);
        console.log("[SERVER] Internal error: Room for joining didn't find/create");
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
