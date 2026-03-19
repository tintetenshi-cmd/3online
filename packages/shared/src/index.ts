// Types + enums depuis core
export * from './types/core.js';

// Utils helpers
export {
  generateUUID,
  generateRoomCode,
  shuffleArray,
  createFullDeck,
  sortHand,
  getCardsPerPlayer,
  isValidTrio,
  createTrio,
  checkVictoryConditions,
  getSmallestCard,
  getLargestCard,
  hasTwoDifferentNumbers,
  hasTwoConsecutiveDifferentNumbers,
  extractNumbers,
  allSameNumber,
  getNextPlayer,
  createPlayer,
  calculateAIDelay,
  isPlayerConnected,
  getConnectedPlayers,
  formatTime,
  calculatePlayerScore,
  canRevealCard,
  getRevealableCenterCards,
  createInitialGameState,
} from './utils/helpers.js';

// Utils validation
export {
  isValidUUID,
  validateCard,
  validateTrio,
  validatePlayer,
  validateGameAction,
  validateGameState,
  validateRoomSettings,
  validateRoomInfo,
  validateCardIntegrity,
} from './utils/validation.js';

export type { ValidationResult } from './utils/validation.js';

// Utils extras
export * from './utils/cardColors.js';
export * from './utils/constants.js';
