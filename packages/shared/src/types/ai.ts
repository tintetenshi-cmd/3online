/**
 * Types pour le moteur IA
 */

import { UUID, GameState, GameAction, Card, Player, AIDifficulty } from './core.js';

// Analyse de l'état de jeu par l'IA
export interface GameAnalysis {
  knownCards: Map<UUID, number>; // cartes dont on connaît la valeur
  playerHandSizes: Map<UUID, number>; // taille des mains des joueurs
  possibleTrios: number[]; // numéros pour lesquels on peut former un trio
  opponentThreats: Map<UUID, number>; // joueurs proches de la victoire
  centerCardsRemaining: number;
  turnsSinceLastTrio: number;
}

// Mémoire de l'IA
export interface AIMemory {
  revealedCards: Map<UUID, Card>; // toutes les cartes révélées
  playerActions: Map<UUID, GameAction[]>; // historique des actions par joueur
  trioAttempts: GameAction[][]; // tentatives de trios précédentes
  lastGameState: GameState;
  confidence: Map<UUID, number>; // confiance sur la position des cartes
}

// Stratégie de l'IA
export interface AIStrategy {
  name: string;
  difficulty: AIDifficulty;
  aggressiveness: number; // 0-1, tendance à prendre des risques
  memory: number; // 0-1, capacité à retenir les informations
  bluffing: number; // 0-1, tendance à faire des actions trompeuses
  patience: number; // 0-1, tendance à attendre vs agir rapidement
}

// Joueur IA
export interface AIPlayer extends Player {
  isAI: true;
  aiDifficulty: AIDifficulty;
  strategy: AIStrategy;
  memory: AIMemory;
  thinkingTime: number; // temps de réflexion simulé en ms
}

// Options pour la prise de décision IA
export interface DecisionOptions {
  availableActions: GameAction[];
  timeLimit?: number; // limite de temps pour la décision
  randomSeed?: number; // pour la reproductibilité
}

// Résultat de la prise de décision IA
export interface DecisionResult {
  action: GameAction;
  confidence: number; // 0-1, confiance dans la décision
  reasoning?: string; // explication de la décision (debug)
  thinkingTime: number; // temps de réflexion utilisé
}

// Configuration des niveaux de difficulté
export const AI_DIFFICULTY_CONFIGS: Record<AIDifficulty, AIStrategy> = {
  [AIDifficulty.EASY]: {
    name: 'Débutant',
    difficulty: AIDifficulty.EASY,
    aggressiveness: 0.3,
    memory: 0.4,
    bluffing: 0.1,
    patience: 0.2,
  },
  [AIDifficulty.MEDIUM]: {
    name: 'Intermédiaire',
    difficulty: AIDifficulty.MEDIUM,
    aggressiveness: 0.6,
    memory: 0.7,
    bluffing: 0.3,
    patience: 0.5,
  },
  [AIDifficulty.HARD]: {
    name: 'Expert',
    difficulty: AIDifficulty.HARD,
    aggressiveness: 0.8,
    memory: 0.9,
    bluffing: 0.5,
    patience: 0.8,
  },
};

// Types pour les heuristiques IA
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