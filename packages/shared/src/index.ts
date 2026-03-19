// Core types
export * from './types/core.js';

// Utils
export * from './utils/validation.js';
export * from './utils/helpers.js';
export * from './utils/cardColors.js';
export * from './utils/constants.js';

// VALUES (enums & objets runtime)
export {
  AI_DIFFICULTY_CONFIGS,
  AvatarType,
  AIDifficulty,
  ConnectionStatus,
  GameStatus,
  RoomStatus,
  TurnResultType,
  GameMode,
  ActionType,
  CardLocation,
  TurnPhase,
} from './types/core.js';

// TYPES (interfaces/type aliases) — à compléter avec ce qui est dans core.ts
export type {
  UUID,
  Player,
  ChatMessage,
  GameAction,
  ActionResult,
  AIStrategy,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  // + tous les autres types utilisés dans server/client
} from './types/core.js';
