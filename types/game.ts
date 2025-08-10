export interface Player {
  id: string; // userName
  name: string;
  role: Role;
  isAlive: boolean;
  connected: boolean;
  isHost: boolean;
}

export interface GameRoom {
  roomCode: string;
  players: Map<string, Player>; // username -> Player object
  gameState: GameState;
  currentPhase: GamePhase;
  hostId: string;
  settings: GameSettings;
  dayCount: number; // tracking for no. of days
  votes: Map<string, string>; // playerId -> targetPlayerId
}

export interface GameSettings {
  roles: RoleCount[];
  dayTime: number; // in seconds
  nightTime: number; // in seconds
}

export enum Role {
  VILLAGER = 'villager',
  WEREWOLF = 'werewolf',
  SEER = 'seer',
  DOCTOR = 'doctor',
  WITCH = 'witch',
  DRUNK = 'drunk',

  WAITING = 'waiting' // Used for players who are not assigned a role yet
}

type RoleCount = {
    [key in Role]: number;
};

export enum GameState {
  WAITING = 'waiting',
  STARTING = 'starting',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished'
}

export enum GamePhase {
  LOBBY = 'lobby',
  NIGHT = 'night',
  DAY = 'day',
  GAME_OVER = 'game_over'
}
