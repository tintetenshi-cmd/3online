/**
 * Fonctions de validation pour les modèles de données
 */
import { Card, Player, GameState, GameAction, Trio, RoomSettings, RoomInfo } from '../types/core.js';
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
export declare function isValidUUID(uuid: string): boolean;
export declare function validateCard(card: Card): ValidationResult;
export declare function validateTrio(trio: Trio): ValidationResult;
export declare function validatePlayer(player: Player): ValidationResult;
export declare function validateGameAction(action: GameAction): ValidationResult;
export declare function validateGameState(gameState: GameState): ValidationResult;
export declare function validateRoomSettings(settings: RoomSettings): ValidationResult;
export declare function validateRoomInfo(roomInfo: RoomInfo): ValidationResult;
export declare function validateCardIntegrity(gameState: GameState): ValidationResult;
