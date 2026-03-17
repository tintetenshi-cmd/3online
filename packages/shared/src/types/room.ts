/**
 * Types pour la gestion des salles de jeu
 */

import { UUID, Player, GameState, Timestamp } from './core.js';

// Énumérations pour les salles
export enum RoomStatus {
  WAITING = 'WAITING',
  IN_GAME = 'IN_GAME',
  FINISHED = 'FINISHED',
}

export enum GameMode {
  SIMPLE = 'SIMPLE',
  PICANTE = 'PICANTE', // Pour extension future
  TEAM = 'TEAM', // Pour extension future
}

// Configuration d'une salle
export interface RoomSettings {
  maxPlayers: number; // 2-6
  gameMode: GameMode;
  allowAI: boolean;
  isPrivate: boolean;
  aiDifficulty?: import('./core.js').AIDifficulty;
}

// Informations sur une salle
export interface RoomInfo {
  id: UUID;
  code: string; // Code partageable
  hostId: UUID;
  settings: RoomSettings;
  status: RoomStatus;
  createdAt: Timestamp;
}

// État complet d'une salle
export interface RoomState {
  info: RoomInfo;
  players: Player[];
  gameState?: GameState;
  chatMessages: ChatMessage[];
}

// Résultats d'opérations sur les salles
export interface JoinResult {
  success: boolean;
  message?: string;
  roomState?: RoomState;
  playerToken?: string;
  playerId?: UUID;
}

export interface LeaveResult {
  success: boolean;
  message?: string;
  roomState?: RoomState;
}

export interface StartResult {
  success: boolean;
  message?: string;
  gameState?: GameState;
}

// Messages de chat
export interface ChatMessage {
  id: UUID;
  roomId: UUID;
  playerId?: UUID; // undefined pour les messages système
  playerName?: string;
  content: string;
  timestamp: Timestamp;
  isSystemMessage: boolean;
}

// Distribution des cartes
export interface CardDistribution {
  players: Player[];
  centerCards: import('./core.js').Card[];
  totalCards: number;
}