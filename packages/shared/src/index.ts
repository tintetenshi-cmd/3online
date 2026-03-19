// Core types
export * from './types/core.js';

// Utils
export * from './utils/validation.js';
export * from './utils/helpers.js';
export * from './utils/cardColors.js';
export * from './utils/constants.js';

// VALUES (enums utilisables comme valeurs)
export { 
  AI_DIFFICULTY_CONFIGS, 
  AvatarType, AIDifficulty, ConnectionStatus, GameStatus, RoomStatus, 
  TurnResultType, GameMode, ActionType, CardLocation 
} from './types/core.js';

// TYPES (interfaces/types)
export type { 
  ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData,
  UUID, Player, GameState, GameAction, ActionResult, ChatMessage, RoomState,
  JoinResult, LeaveResult, StartResult, AIStrategy, DecisionResult, ActionScore,
  Card, TurnResult, VictoryResult, RoomInfo, RoomSettings, TurnPhase
} from './types/core.js';
