export interface Vector {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  name?: string;
  isVirus?: boolean;
  isFood?: boolean;
  target?: Vector; // For bots
  speed?: number;
}

export enum GamePhase {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export interface GameState {
  phase: GamePhase;
  score: number;
  leaderboard: { name: string; score: number }[];
  playerStats: {
    maxMass: number;
    timeAlive: number;
    cellsEaten: number;
  };
}

export interface Camera {
  x: number;
  y: number;
  scale: number;
}