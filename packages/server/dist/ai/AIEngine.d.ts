/**
 * Moteur IA pour les joueurs virtuels de 3online
 * Implémente différents niveaux de difficulté et stratégies
 */
import { GameState, AIDifficulty } from '@3online/shared';
import { AIPlayer, AIMemory, GameAnalysis, DecisionOptions, DecisionResult } from '@3online/shared';
export declare class AIEngine {
    private aiMemories;
    /**
     * Fait prendre une décision à une IA
     */
    makeDecision(gameState: GameState, aiPlayer: AIPlayer, options?: DecisionOptions): Promise<DecisionResult>;
    /**
     * Met à jour la mémoire d'une IA avec une carte révélée
     */
    updateMemory(aiPlayer: AIPlayer, gameState: GameState, memory?: AIMemory): void;
    /**
     * Configure la difficulté d'une IA
     */
    setDifficulty(aiPlayer: AIPlayer, level: AIDifficulty): void;
    /**
     * Analyse l'état de jeu pour l'IA
     */
    analyzeGameState(gameState: GameState, aiPlayer: AIPlayer): GameAnalysis;
    /**
     * Obtient les actions disponibles pour une IA
     */
    private getAvailableActions;
    /**
     * Évalue toutes les actions possibles
     */
    private evaluateActions;
    /**
     * Calcule le score d'une action
     */
    private calculateActionScore;
    /**
     * Calcule les facteurs d'évaluation d'une action
     */
    private calculateActionFactors;
    /**
     * Sélectionne une action selon la stratégie
     */
    private selectAction;
    private weightedSelection;
    /**
     * Calcule le temps de réflexion de l'IA
     */
    private calculateThinkingTime;
    /**
     * Calcule la confiance dans une décision
     */
    private calculateConfidence;
    /**
     * Génère une explication de la décision (pour debug)
     */
    private generateReasoning;
    /**
     * Obtient ou crée la mémoire d'une IA
     */
    private getOrCreateMemory;
    /**
     * Estime la chance de compléter un trio
     */
    private estimateTrioCompletionChance;
    /**
     * Estime le gain d'information d'une action
     */
    private estimateInformationGain;
    /**
     * Évalue les risques d'une action
     */
    private assessActionRisk;
    /**
     * Estime la perturbation causée aux adversaires
     */
    private estimateOpponentDisruption;
    /**
     * Calcule le nombre de tours depuis le dernier trio
     */
    private calculateTurnsSinceLastTrio;
    /**
     * Nettoie la mémoire des IA (pour éviter les fuites mémoire)
     */
    cleanup(): void;
}
