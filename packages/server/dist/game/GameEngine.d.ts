/**
 * Moteur de jeu principal pour 3online
 * Implémente la logique de base du jeu Trio
 */
import { GameState, Player, GameAction, ActionResult, UUID } from '@3online/shared';
export declare class GameEngine {
    private gameStates;
    /**
     * Initialise une nouvelle partie
     */
    initializeGame(gameId: UUID, roomId: UUID, players: Player[]): GameState;
    /**
     * Distribue les cartes selon le nombre de joueurs
     */
    private distributeCards;
    /**
     * Traite une révélation de carte
     */
    processCardReveal(gameId: UUID, playerId: UUID, action: GameAction): ActionResult;
    /**
     * Révèle une carte selon l'action
     */
    private revealCard;
    /**
     * Révèle une carte du centre
     */
    private revealCenterCard;
    /**
     * Révèle la plus petite ou plus grande carte d'un joueur
     */
    private revealPlayerCard;
    /**
     * Traite la logique du tour après révélation
     */
    private processTurn;
    /**
     * Gère la formation d'un trio
     */
    private handleTrioFormed;
    /**
     * Gère la fin du tour
     */
    private handleTurnEnd;
    /**
     * Remet les cartes révélées à leur place d'origine
     */
    private hideRevealedCards;
    /**
     * Valide une action de jeu
     */
    validateAction(gameState: GameState, playerId: UUID, action: GameAction): ActionResult;
    /**
     * Valide la révélation d'une carte du centre
     */
    private validateCenterCardReveal;
    /**
     * Valide la révélation d'une carte de joueur
     */
    private validatePlayerCardReveal;
    /**
     * Obtient l'état actuel du jeu
     */
    getCurrentGameState(gameId: UUID): GameState | null;
    /**
     * Obtient les actions valides pour un joueur
     */
    getValidActions(gameId: UUID, playerId: UUID): GameAction[];
    /**
     * Supprime un état de jeu (nettoyage)
     */
    removeGameState(gameId: UUID): void;
}
