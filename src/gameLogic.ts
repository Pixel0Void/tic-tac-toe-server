import { DisconnectReason, Socket } from "socket.io";

import {
    createRoom,
    deleteRoom,
    getRoom,
    Room,
    rooms
} from "./room";

import {
    ErrorDto, GameOverDto,
    GameState, GameStateUpdateDto,
    MakeMoveDto, PlayerAssignedDto,
    PlayerDisconnectedDto, PlayerSymbol,
    ProcessMoveType, RoomJoinedDto
} from "./dataTypes";

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

export function makeMove(socket:Socket, data: MakeMoveDto) {
    const index = data.index;
        
    const roomId = socketRoomMap[socket.id];
    if (!roomId) {
        socket.emit("error", { message: "You are not in any room." } as ErrorDto);
        return;
    }

    const room = getRoom(roomId);
    if (!room) {
        socket.emit("error", { message: "Your room didn't find." } as ErrorDto);
        return;
    }

    console.log(`[SERVER] [ROOM '${roomId}'] Received 'makeMove' from ${socket.id} for cell ${index}`);

    const moveResult = room.makeMove(socket.id, index);
    if (!moveResult.success) {
        socket.emit("error", { message: moveResult.message || "Unknown error in move" } as ErrorDto);
        return;
    }

    const gameOutcome = room.processMoveResult();
    switch (gameOutcome.type) {
        case ProcessMoveType.win:
            room.currentGameState = (gameOutcome.overallWinner) ? GameState.GameOver : ((gameOutcome.winner === PlayerSymbol.X) ? GameState.X_Wins : GameState.O_Wins);
            if (gameOutcome.overallWinner) {
                io.to(roomId).emit("gameOver", { message: "Game ended.", gameOver: true, winner: gameOutcome.overallWinner } as GameOverDto);
                console.log(`[SERVER] [ROOM '${roomId}'] The game ended. Winner: ${gameOutcome.overallWinner}`);
                io.to(roomId).emit("resetGame");
                io.to(roomId).socketsLeave(roomId);
                deleteRoom(roomId);
            } else {
                io.to(roomId).emit("gameOver", { message: "Round ended.", gameOver: false, winner: gameOutcome.winner } as GameOverDto);
                console.log(`[SERVER] [ROOM '${roomId}'] Round ended. Winner: ${gameOutcome.winner}. Scores: X: ${room.scores[PlayerSymbol.X]}, O: ${room.scores[PlayerSymbol.O]}`);
                room.resetRoundState();
                emitFullGameStateUpdate(roomId);
            }
            break;
        case ProcessMoveType.draw:
            room.currentGameState = GameState.Draw;
            io.to(roomId).emit("gameOver", { message: "draw", gameOver: false, winner: PlayerSymbol.None } as GameOverDto);
            console.log(`[SERVER] [ROOM '${roomId}'] Draw!`);
            room.resetRoundState();
            emitFullGameStateUpdate(roomId);
            break;
        case ProcessMoveType.continue:
            emitFullGameStateUpdate(roomId);
            break;
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
