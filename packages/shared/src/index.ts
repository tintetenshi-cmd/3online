// packages/shared/src/index.ts

// Tout depuis core (types + enums + interfaces)
export * from './types/core.js';

// Utils
export * from './utils/validation.js';
export * from './utils/helpers.js';
export * from './utils/cardColors.js';
export * from './utils/constants.js';

// Re-export explicite des enums comme valeurs runtime
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
  VictoryCondition,
} from './types/core.js';

// PAS de bloc export type {} vide — le export * au-dessus suffit
