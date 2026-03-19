// packages/server/src/utils/sharedUtils.ts
export {
  generateUUID,
  generateRoomCode,
  createPlayer,
  shuffleArray,
  createFullDeck,
  sortHand,
  getCardsPerPlayer,
  createTrio,
  isValidTrio,
  checkVictoryConditions,
  getSmallestCard,
  getLargestCard,
  hasTwoDifferentNumbers,
  hasTwoConsecutiveDifferentNumbers,
  extractNumbers,
  allSameNumber,
  getNextPlayer,
  createInitialGameState,
  calculateAIDelay,
} from '@3online/shared';

export {
  validateCard,
  validateTrio,
  validatePlayer,
  validateGameAction,
  validateGameState,
  validateRoomSettings,
  validateRoomInfo,
  validateCardIntegrity,
  isValidUUID,
} from '@3online/shared';
