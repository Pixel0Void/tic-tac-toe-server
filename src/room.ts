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
}
