/**
 * Types pour le moteur IA
 */
import { AIDifficulty } from './core.js';
// Configuration des niveaux de difficulté
export const AI_DIFFICULTY_CONFIGS = {
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
