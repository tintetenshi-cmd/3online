// Types
export * from './types/core.js';

// Utilitaires
export * from './utils/validation.js';
export * from './utils/helpers.js';
export * from './utils/cardColors.js';
export * from './utils/constants.js';

// EXPORTS EXPLICITES manquants
export { AI_DIFFICULTY_CONFIGS } from './types/core.js';
export type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from './types/core.js';
export type { AIStrategy, AIDifficulty } from './types/core.js';
