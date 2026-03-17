/**
 * Types pour les événements WebSocket
 */

import {
  UUID,
  GameState,
  Player,
  GameAction,
  ActionResult,
  Card,
  Trio,
  VictoryResult,
} from './core.js';
import { RoomState, ChatMessage, RoomInfo } from './room.js';

// Événements client vers serveur
export interface ClientToServerEvents {
  // Gestion des salles
  createRoom: (
    playerName: string,
    avatar: import('./core.js').AvatarType,
    avatarSeed: string,
    nameColor: string,
    settings: import('./room.js').RoomSettings,
    callback: (response: { success: boolean; roomInfo?: RoomInfo; error?: string }) => void
  ) => void;

  joinRoom: (
    roomCode: string,
    playerName: string,
    avatar: import('./core.js').AvatarType,
    avatarSeed: string,
    nameColor: string,
    callback: (response: import('./room.js').JoinResult) => void
  ) => void;

  leaveRoom: (
    roomId: UUID,
    callback: (response: import('./room.js').LeaveResult) => void
  ) => void;

  startGame: (
    roomId: UUID,
    callback: (response: import('./room.js').StartResult) => void
  ) => void;

  addAIPlayer: (
    roomId: UUID,
    difficulty: import('./core.js').AIDifficulty,
    callback: (response: { success: boolean; player?: Player; error?: string }) => void
  ) => void;

  removeAIPlayer: (
    roomId: UUID,
    playerId: UUID,
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;

  // Actions de jeu
  playerAction: (
    roomId: UUID,
    action: GameAction,
    callback: (response: ActionResult) => void
  ) => void;

  // Chat
  sendChatMessage: (
    roomId: UUID,
    message: string,
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;

  // Reconnexion
  reconnect: (
    roomId: UUID,
    playerId: UUID,
    token: string,
    callback: (response: { success: boolean; roomState?: RoomState; error?: string }) => void
  ) => void;
}

// Événements serveur vers client
export interface ServerToClientEvents {
  // Mises à jour de salle
  roomUpdated: (roomState: RoomState) => void;
  playerJoined: (player: Player) => void;
  playerLeft: (playerId: UUID, playerName: string) => void;
  playerReconnected: (playerId: UUID, playerName: string) => void;
  playerDisconnected: (playerId: UUID, playerName: string) => void;

  // Mises à jour de jeu
  gameStarted: (gameState: GameState) => void;
  gameStateUpdated: (gameState: GameState) => void;
  cardRevealed: (card: Card, revealedBy: UUID) => void;
  trioFormed: (trio: Trio, playerId: UUID) => void;
  turnChanged: (newCurrentPlayerId: UUID) => void;
  gameEnded: (victoryResult: VictoryResult) => void;

  // Chat
  chatMessage: (message: ChatMessage) => void;

  // Erreurs et notifications
  error: (message: string, code?: string) => void;
  notification: (message: string, type: 'info' | 'warning' | 'success') => void;

  // IA
  aiPlayerAdded: (player: Player) => void;
  aiPlayerRemoved: (playerId: UUID) => void;
  aiThinking: (data: { playerId: UUID; playerName: string; thinkingTime: number }) => void;
  aiAction: (data: { playerId: UUID; playerName: string; action: GameAction; confidence: number; reasoning?: string }) => void;
}

// Événements inter-serveur (pour extension future)
export interface InterServerEvents {
  ping: () => void;
}

// Données de socket
export interface SocketData {
  playerId?: UUID;
  roomId?: UUID;
  playerName?: string;
  isAuthenticated: boolean;
  connectionTime: number;
}