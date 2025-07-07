import { GameState, PlayerSymbol } from "./dataTypes";

const SCORE_TO_WIN = 3;

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

     public resetRoundState() {
        this.board.fill(PlayerSymbol.None);
        this.currentTurn = PlayerSymbol.X;
        this.currentGameState = (Object.keys(this.players).length == 2) ? GameState.Active : GameState.WaitingForPlayers;
        console.log(`[ROOM ${this.id}] Game state reseted.`);
    }

    public resetGameScoresAndPlayers() {
        this.resetRoundState();
        this.players = {};
        this.playerSockets = {};
        this.scores = {
            [PlayerSymbol.X]: 0,
            [PlayerSymbol.O]: 0  
        };
        this.currentGameState = GameState.WaitingForPlayers;
        console.log(`[ROOM ${this.id}] Full game state reseted.`);
    }

    private checkWin(): PlayerSymbol | null {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] !== PlayerSymbol.None &&
                this.board[a] === this.board[b] &&
                this.board[a] === this.board[c]) {
                return this.board[a];   
            }
        }
        return null;
    }

    private checkDraw(): boolean{
        return this.board.every(cell => cell !== PlayerSymbol.None);
    }

    public checkOverallWin(): PlayerSymbol | null{
        if (this.scores[PlayerSymbol.X]! >= SCORE_TO_WIN) {
            return PlayerSymbol.X;
        }
        if (this.scores[PlayerSymbol.O]! >= SCORE_TO_WIN) {
            return PlayerSymbol.O;
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
