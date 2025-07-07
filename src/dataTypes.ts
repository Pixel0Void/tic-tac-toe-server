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

export enum ProcessMoveType {
    win,
    draw,
    continue
}

export interface ProcessMoveResult {
    type: ProcessMoveType;
    winner?: PlayerSymbol;
    overallWinner?: PlayerSymbol;
}
