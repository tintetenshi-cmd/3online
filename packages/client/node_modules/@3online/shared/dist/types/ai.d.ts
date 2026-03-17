/**
 * Types pour le moteur IA
 */
import { UUID, GameState, GameAction, Card, Player, AIDifficulty } from './core.js';
export interface GameAnalysis {
    knownCards: Map<UUID, number>;
    playerHandSizes: Map<UUID, number>;
    possibleTrios: number[];
    opponentThreats: Map<UUID, number>;
    centerCardsRemaining: number;
    turnsSinceLastTrio: number;
}
export interface AIMemory {
    revealedCards: Map<UUID, Card>;
    playerActions: Map<UUID, GameAction[]>;
    trioAttempts: GameAction[][];
    lastGameState: GameState;
    confidence: Map<UUID, number>;
}
export interface AIStrategy {
    name: string;
    difficulty: AIDifficulty;
    aggressiveness: number;
    memory: number;
    bluffing: number;
    patience: number;
}
export interface AIPlayer extends Player {
    isAI: true;
    aiDifficulty: AIDifficulty;
    strategy: AIStrategy;
    memory: AIMemory;
    thinkingTime: number;
}
export interface DecisionOptions {
    availableActions: GameAction[];
    timeLimit?: number;
    randomSeed?: number;
}
export interface DecisionResult {
    action: GameAction;
    confidence: number;
    reasoning?: string;
    thinkingTime: number;
}
export declare const AI_DIFFICULTY_CONFIGS: Record<AIDifficulty, AIStrategy>;
export interface ActionScore {
    action: GameAction;
    score: number;
    factors: {
        trioCompletion: number;
        informationGain: number;
        riskAssessment: number;
        opponentDisruption: number;
    };
}
