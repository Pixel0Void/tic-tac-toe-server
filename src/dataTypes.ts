export enum PlayerSymbol {
    None = 0,
    X = 1,
    O = 2
}

export enum GameState {
    WaitingForPlayers = 0,
    Active = 1,
    X_Wins = 2,
    O_Wins = 3,
    Draw = 4,
    GameOver = 5
}

export interface GameStateUpdateDto {
    board: PlayerSymbol[];
    scores: { X: number; O: number; }
    currentTurn: PlayerSymbol;
    gameState: GameState;
    roomId: string;
    playersCount: number;
}

export interface PlayerAssignedDto{
    symbol: PlayerSymbol;
}

export interface RoomJoinedDto{
    roomId: string;
}

export enum ProcessMoveType {
    win,
    draw,
    continue
}

export interface MakeMoveDto {
    index: number;
}

export interface ProcessMoveResult {
    type: ProcessMoveType;
    winner?: PlayerSymbol;
    overallWinner?: PlayerSymbol;
}

export interface GameOverDto{
    message: string;
    gameOver: boolean;
    winner: PlayerSymbol;
}

export interface PlayerDisconnectedDto{
    message: string;
}

export interface ErrorDto{
    message: string;
}
