// Types CORE
export * from './types/core.js';

// Utilitaires
export * from './utils/validation.js';
export * from './utils/helpers.js';
export * from './utils/cardColors.js';
export * from './utils/constants.js';

// TOUS les exports explicites nécessaires
export { AI_DIFFICULTY_CONFIGS } from './types/core.js';
export type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData,
  AIStrategy, 
  AIDifficulty,
  UUID, 
  Player, 
  GameState, 
  GameAction, 
  ActionResult, 
  ChatMessage, 
  RoomState, 
  ConnectionStatus,
  JoinResult,
  LeaveResult,
  StartResult,
  GameMode,
  AvatarType
} from './types/core.js';
