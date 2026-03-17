/**
 * Fonctions de validation pour les modèles de données
 */

import {
  Card,
  Player,
  GameState,
  GameAction,
  Trio,
  CardLocation,
  ActionType,
  GameStatus,
  UUID,
  RoomSettings,
  RoomInfo,
} from '../types/core.js';
import { GAME_CONSTANTS } from '../constants/game.js';

// Messages d'erreur
const ERROR_MESSAGES = {
  INVALID_CARD_NUMBER: 'Numéro de carte invalide',
  INVALID_CARD_LOCATION: 'Emplacement de carte invalide',
  INVALID_TRIO: 'Trio invalide - les cartes doivent avoir le même numéro',
  INVALID_PLAYER_NAME: 'Nom de joueur invalide',
  INCONSISTENT_CARD_COUNT: 'Nombre total de cartes incohérent',
} as const;

// Résultat de validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Utilitaire pour créer un résultat de validation
function createValidationResult(isValid: boolean, errors: string[] = []): ValidationResult {
  return { isValid, errors };
}

// Validation d'UUID
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validation des cartes
export function validateCard(card: Card): ValidationResult {
  const errors: string[] = [];

  if (!isValidUUID(card.id)) {
    errors.push('ID de carte invalide');
  }

  if (card.number < GAME_CONSTANTS.MIN_CARD_NUMBER || card.number > GAME_CONSTANTS.MAX_CARD_NUMBER) {
    errors.push(ERROR_MESSAGES.INVALID_CARD_NUMBER);
  }

  if (!Object.values(CardLocation).includes(card.location)) {
    errors.push(ERROR_MESSAGES.INVALID_CARD_LOCATION);
  }

  if (card.isRevealed && card.revealedBy && !isValidUUID(card.revealedBy)) {
    errors.push('ID du révélateur invalide');
  }

  return createValidationResult(errors.length === 0, errors);
}

// Validation des trios
export function validateTrio(trio: Trio): ValidationResult {
  const errors: string[] = [];

  if (!isValidUUID(trio.id)) {
    errors.push('ID de trio invalide');
  }

  if (trio.cards.length !== GAME_CONSTANTS.TRIO_SIZE) {
    errors.push(`Un trio doit contenir exactement ${GAME_CONSTANTS.TRIO_SIZE} cartes`);
  }

  // Vérifier que toutes les cartes ont le même numéro
  const firstCardNumber = trio.cards[0]?.number;
  if (!trio.cards.every(card => card.number === firstCardNumber)) {
    errors.push(ERROR_MESSAGES.INVALID_TRIO);
  }

  // Vérifier que le numéro du trio correspond aux cartes
  if (trio.number !== firstCardNumber) {
    errors.push('Le numéro du trio ne correspond pas aux cartes');
  }

  // Valider chaque carte du trio
  for (const card of trio.cards) {
    const cardValidation = validateCard(card);
    if (!cardValidation.isValid) {
      errors.push(...cardValidation.errors);
    }
  }

  return createValidationResult(errors.length === 0, errors);
}

// Validation des joueurs
export function validatePlayer(player: Player): ValidationResult {
  const errors: string[] = [];

  if (!isValidUUID(player.id)) {
    errors.push('ID de joueur invalide');
  }

  if (!player.name || player.name.trim().length === 0) {
    errors.push(ERROR_MESSAGES.INVALID_PLAYER_NAME);
  }

  if (player.name.length > 20) {
    errors.push('Le nom du joueur ne peut pas dépasser 20 caractères');
  }

  // Valider les cartes en main
  for (const card of player.hand) {
    const cardValidation = validateCard(card);
    if (!cardValidation.isValid) {
      errors.push(...cardValidation.errors);
    }
  }

  // Valider les trios
  for (const trio of player.trios) {
    const trioValidation = validateTrio(trio);
    if (!trioValidation.isValid) {
      errors.push(...trioValidation.errors);
    }
  }

  return createValidationResult(errors.length === 0, errors);
}

// Validation des actions de jeu
export function validateGameAction(action: GameAction): ValidationResult {
  const errors: string[] = [];

  if (!isValidUUID(action.actionId)) {
    errors.push('ID d\'action invalide');
  }

  if (!isValidUUID(action.playerId)) {
    errors.push('ID de joueur invalide');
  }

  if (!Object.values(ActionType).includes(action.actionType)) {
    errors.push('Type d\'action invalide');
  }

  if (action.timestamp <= 0) {
    errors.push('Timestamp invalide');
  }

  // Validation spécifique selon le type d'action
  switch (action.actionType) {
    case ActionType.REVEAL_CENTER_CARD:
      if (!action.targetCard || action.targetCard.location !== CardLocation.CENTER) {
        errors.push('Carte cible invalide pour révélation du centre');
      }
      break;

    case ActionType.REVEAL_PLAYER_SMALLEST:
    case ActionType.REVEAL_PLAYER_LARGEST:
      if (!action.targetPlayer || !isValidUUID(action.targetPlayer)) {
        errors.push('Joueur cible invalide');
      }
      break;

    case ActionType.END_TURN:
      // Pas de validation supplémentaire nécessaire
      break;
  }

  return createValidationResult(errors.length === 0, errors);
}

// Validation de l'état de jeu
export function validateGameState(gameState: GameState): ValidationResult {
  const errors: string[] = [];

  if (!isValidUUID(gameState.gameId)) {
    errors.push('ID de jeu invalide');
  }

  if (!isValidUUID(gameState.roomId)) {
    errors.push('ID de salle invalide');
  }

  if (gameState.players.length < GAME_CONSTANTS.MIN_PLAYERS || 
      gameState.players.length > GAME_CONSTANTS.MAX_PLAYERS) {
    errors.push(`Nombre de joueurs invalide (${GAME_CONSTANTS.MIN_PLAYERS}-${GAME_CONSTANTS.MAX_PLAYERS})`);
  }

  if (!isValidUUID(gameState.currentPlayerId)) {
    errors.push('ID du joueur actuel invalide');
  }

  if (!Object.values(GameStatus).includes(gameState.gameStatus)) {
    errors.push('Statut de jeu invalide');
  }

  // Vérifier que le joueur actuel existe
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
  if (!currentPlayer) {
    errors.push('Le joueur actuel n\'existe pas dans la liste des joueurs');
  }

  // Valider chaque joueur
  for (const player of gameState.players) {
    const playerValidation = validatePlayer(player);
    if (!playerValidation.isValid) {
      errors.push(...playerValidation.errors);
    }
  }

  // Valider les cartes du centre
  for (const card of gameState.centerCards) {
    const cardValidation = validateCard(card);
    if (!cardValidation.isValid) {
      errors.push(...cardValidation.errors);
    }
  }

  // Valider les cartes révélées
  for (const card of gameState.revealedCards) {
    const cardValidation = validateCard(card);
    if (!cardValidation.isValid) {
      errors.push(...cardValidation.errors);
    }
  }

  return createValidationResult(errors.length === 0, errors);
}

// Validation des paramètres de salle
export function validateRoomSettings(settings: RoomSettings): ValidationResult {
  const errors: string[] = [];

  if (settings.maxPlayers < GAME_CONSTANTS.MIN_PLAYERS || 
      settings.maxPlayers > GAME_CONSTANTS.MAX_PLAYERS) {
    errors.push(`Nombre maximum de joueurs invalide (${GAME_CONSTANTS.MIN_PLAYERS}-${GAME_CONSTANTS.MAX_PLAYERS})`);
  }

  return createValidationResult(errors.length === 0, errors);
}

// Validation des informations de salle
export function validateRoomInfo(roomInfo: RoomInfo): ValidationResult {
  const errors: string[] = [];

  if (!isValidUUID(roomInfo.id)) {
    errors.push('ID de salle invalide');
  }

  if (!roomInfo.code || roomInfo.code.length < 4) {
    errors.push('Code de salle invalide');
  }

  if (!isValidUUID(roomInfo.hostId)) {
    errors.push('ID d\'hôte invalide');
  }

  const settingsValidation = validateRoomSettings(roomInfo.settings);
  if (!settingsValidation.isValid) {
    errors.push(...settingsValidation.errors);
  }

  return createValidationResult(errors.length === 0, errors);
}

// Validation de l'intégrité des cartes (Propriété 1)
export function validateCardIntegrity(gameState: GameState): ValidationResult {
  const errors: string[] = [];
  const cardCounts = new Map<number, number>();

  // Compter toutes les cartes dans le jeu
  const allCards: Card[] = [
    ...gameState.centerCards,
    ...gameState.players.flatMap(p => p.hand),
    ...gameState.players.flatMap(p => p.trios.flatMap(t => t.cards)),
    ...gameState.revealedCards,
  ];

  // Compter les cartes par numéro
  for (const card of allCards) {
    cardCounts.set(card.number, (cardCounts.get(card.number) || 0) + 1);
  }

  // Vérifier qu'il y a exactement 3 exemplaires de chaque numéro
  for (let number = GAME_CONSTANTS.MIN_CARD_NUMBER; number <= GAME_CONSTANTS.MAX_CARD_NUMBER; number++) {
    const count = cardCounts.get(number) || 0;
    if (count !== GAME_CONSTANTS.CARDS_PER_NUMBER) {
      errors.push(`Nombre incorrect de cartes ${number}: ${count} au lieu de ${GAME_CONSTANTS.CARDS_PER_NUMBER}`);
    }
  }

  // Vérifier le nombre total de cartes
  if (allCards.length !== GAME_CONSTANTS.TOTAL_CARDS) {
    errors.push(ERROR_MESSAGES.INCONSISTENT_CARD_COUNT);
  }

  return createValidationResult(errors.length === 0, errors);
}