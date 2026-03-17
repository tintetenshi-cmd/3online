/**
 * Fonctions utilitaires pour le jeu 3online
 */
import { Card, Player, GameState, Trio, AvatarType, UUID, VictoryResult } from '../types/core.js';
export declare function generateUUID(): UUID;
export declare function generateRoomCode(): string;
export declare function shuffleArray<T>(array: T[]): T[];
export declare function createFullDeck(): Card[];
export declare function sortHand(hand: Card[]): Card[];
export declare function getCardsPerPlayer(playerCount: number): number;
export declare function isValidTrio(cards: Card[]): boolean;
export declare function createTrio(cards: Card[]): Trio | null;
export declare function checkVictoryConditions(player: Player): VictoryResult;
export declare function getSmallestCard(hand: Card[]): Card | null;
export declare function getLargestCard(hand: Card[]): Card | null;
export declare function hasTwoDifferentNumbers(numbers: number[]): boolean;
export declare function hasTwoConsecutiveDifferentNumbers(numbers: number[]): boolean;
export declare function extractNumbers(cards: Card[]): number[];
export declare function allSameNumber(numbers: number[]): boolean;
export declare function getNextPlayer(gameState: GameState): Player | null;
export declare function createPlayer(name: string, avatar: AvatarType, isAI?: boolean): Player;
export declare function calculateAIDelay(difficulty: import('../types/core.js').AIDifficulty): number;
export declare function isPlayerConnected(player: Player): boolean;
export declare function getConnectedPlayers(players: Player[]): Player[];
export declare function formatTime(timestamp: number): string;
export declare function calculatePlayerScore(player: Player): number;
export declare function canRevealCard(card: Card): boolean;
export declare function getRevealableCenterCards(centerCards: Card[]): Card[];
export declare function createInitialGameState(gameId: UUID, roomId: UUID, players: Player[]): GameState;
