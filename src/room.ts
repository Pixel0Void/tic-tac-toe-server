import { GameState, PlayerSymbol } from "./dataTypes";

export class Room {
    public id: string;
    public board: PlayerSymbol[];
    public players: { [id: string]: PlayerSymbol };
    public playerSockets: { [symbol: string]: string };
    public currentTurn: PlayerSymbol;
    public currentGameState: GameState;
    public scores: { [key in PlayerSymbol]?: number };

    constructor() {
        this.id = crypto.randomUUID();
        this.board = Array(9).fill(PlayerSymbol.None);
        this.players = {};
        this.playerSockets = {};
        this.currentTurn = PlayerSymbol.X;
        this.currentGameState = GameState.WaitingForPlayers;
        this.scores = {
            [PlayerSymbol.X]: 0,
            [PlayerSymbol.O]: 0
        };
        console.log(`[Room] Room ${this.id} created.`);
    }

    public addPlayer(socketId: string): PlayerSymbol | null {
        const connectedPlayers = Object.keys(this.players).length;
        if (connectedPlayers < 2) {
            const symbol = connectedPlayers === 0 ? PlayerSymbol.X : PlayerSymbol.O;
            this.players[socketId] = symbol;
            this.playerSockets[symbol] = socketId;
            console.log(`[ROOM ${this.id}] Player ${socketId} assigned ${symbol} added.`);
            if (connectedPlayers + 1 === 2) {
                this.currentGameState = GameState.Active;
                console.log(`[ROOM ${this.id}] Game activated.`);
            }
            return symbol;
        }
        return null;
    }

    public removePlayer(socketId: string): PlayerSymbol | null {
        const symbol = this.players[socketId];
        if (symbol) {
            delete this.players[socketId];
            delete this.playerSockets[symbol];
            console.log(`[ROOM ${this.id}] Player ${symbol} (${socketId}) deleted.`);
            if (Object.keys(this.players).length === 0) {
                deleteRoom(this.id);
            }
            return symbol;
        }
        return null;
    }
}

export const rooms: { [id: string]: Room } = {};

export function getRoom(roomId: string): Room | undefined {
    return rooms[roomId];
}

export function createRoom(): Room {
    const newRoom = new Room();
    if (rooms[newRoom.id]) {
        throw new Error(`Room ${newRoom.id} already exists.`);
    }
    rooms[newRoom.id] = newRoom;
    return newRoom;
}

export function deleteRoom(roomId: string) : boolean {
    if (rooms[roomId]) {
        delete rooms[roomId];
        console.log(`[SERVER] Room ${roomId} deleted.`);
        return true;
    }
    return false;
}
