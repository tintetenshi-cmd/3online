// Core types
export * from './types/core.js';

// Utils
export * from './utils/validation.js';
export * from './utils/helpers.js';
export * from './utils/cardColors.js';
export * from './utils/constants.js';

// VALUES (enums)
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
    TurnPhase          // ← ici, comme valeur
  } from './types/core.js';
  
  // TYPES (interfaces/types)
  export type {
    // ... pas TurnPhase ici
  } from './types/core.js';
  