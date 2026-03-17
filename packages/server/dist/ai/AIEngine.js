/**
 * Moteur IA pour les joueurs virtuels de 3online
 * Implémente différents niveaux de difficulté et stratégies
 */
import { ActionType, AIDifficulty, CardLocation, } from '@3online/shared';
import { AI_DIFFICULTY_CONFIGS, } from '@3online/shared';
import { generateUUID, calculateAIDelay, checkVictoryConditions, } from '@3online/shared';
export class AIEngine {
    aiMemories = new Map();
    /**
     * Fait prendre une décision à une IA
     */
    async makeDecision(gameState, aiPlayer, options = {}) {
        const startTime = Date.now();
        // Analyser l'état de jeu
        const analysis = this.analyzeGameState(gameState, aiPlayer);
        // Obtenir ou créer la mémoire de l'IA
        const memory = this.getOrCreateMemory(aiPlayer.id, gameState);
        // Mettre à jour la mémoire avec les nouvelles informations
        this.updateMemory(aiPlayer, gameState, memory);
        // Obtenir les actions disponibles
        const availableActions = options.availableActions || this.getAvailableActions(gameState, aiPlayer);
        if (availableActions.length === 0) {
            throw new Error('Aucune action disponible pour l\'IA');
        }
        // Évaluer chaque action selon la stratégie de l'IA
        const actionScores = this.evaluateActions(gameState, aiPlayer, availableActions, analysis, memory);
        // Choisir la meilleure action selon le niveau de difficulté
        const selectedAction = this.selectAction(actionScores, aiPlayer.strategy);
        // Calculer le temps de réflexion
        const thinkingTime = this.calculateThinkingTime(aiPlayer, analysis);
        // Simuler le temps de réflexion
        if (thinkingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, thinkingTime));
        }
        const totalTime = Date.now() - startTime;
        return {
            action: selectedAction,
            confidence: this.calculateConfidence(actionScores, selectedAction),
            reasoning: this.generateReasoning(selectedAction, analysis),
            thinkingTime: totalTime,
        };
    }
    /**
     * Met à jour la mémoire d'une IA avec une carte révélée
     */
    updateMemory(aiPlayer, gameState, memory) {
        const aiMemory = memory || this.getOrCreateMemory(aiPlayer.id, gameState);
        // Mémoriser toutes les cartes révélées
        for (const card of gameState.revealedCards) {
            aiMemory.revealedCards.set(card.id, { ...card });
        }
        // Mémoriser les actions des joueurs
        const lastAction = gameState.turnHistory[gameState.turnHistory.length - 1];
        if (lastAction) {
            const playerActions = aiMemory.playerActions.get(lastAction.playerId) || [];
            playerActions.push(lastAction);
            aiMemory.playerActions.set(lastAction.playerId, playerActions);
        }
        // Sauvegarder l'état de jeu
        aiMemory.lastGameState = { ...gameState };
        this.aiMemories.set(aiPlayer.id, aiMemory);
    }
    /**
     * Configure la difficulté d'une IA
     */
    setDifficulty(aiPlayer, level) {
        aiPlayer.aiDifficulty = level;
        aiPlayer.strategy = { ...AI_DIFFICULTY_CONFIGS[level] };
    }
    /**
     * Analyse l'état de jeu pour l'IA
     */
    analyzeGameState(gameState, aiPlayer) {
        const memory = this.getOrCreateMemory(aiPlayer.id, gameState);
        // Cartes connues (révélées précédemment)
        const knownCards = new Map();
        for (const [cardId, card] of memory.revealedCards) {
            knownCards.set(cardId, card.number);
        }
        // Tailles des mains des joueurs
        const playerHandSizes = new Map();
        for (const player of gameState.players) {
            playerHandSizes.set(player.id, player.hand.length);
        }
        // Trios possibles (numéros pour lesquels on a déjà 2 cartes)
        const cardCounts = new Map();
        for (const card of memory.revealedCards.values()) {
            cardCounts.set(card.number, (cardCounts.get(card.number) || 0) + 1);
        }
        const possibleTrios = Array.from(cardCounts.entries())
            .filter(([_, count]) => count === 2)
            .map(([number, _]) => number);
        // Menaces des adversaires (joueurs proches de la victoire)
        const opponentThreats = new Map();
        for (const player of gameState.players) {
            if (player.id !== aiPlayer.id) {
                const victoryResult = checkVictoryConditions(player);
                let threatLevel = 0;
                if (player.trios.length >= 2)
                    threatLevel += 3;
                if (player.trios.some(trio => trio.number === 7))
                    threatLevel += 5;
                if (victoryResult.hasWon)
                    threatLevel = 10;
                opponentThreats.set(player.id, threatLevel);
            }
        }
        return {
            knownCards,
            playerHandSizes,
            possibleTrios,
            opponentThreats,
            centerCardsRemaining: gameState.centerCards.filter(c => !c.isRevealed).length,
            turnsSinceLastTrio: this.calculateTurnsSinceLastTrio(gameState),
        };
    }
    /**
     * Obtient les actions disponibles pour une IA
     */
    getAvailableActions(gameState, aiPlayer) {
        const actions = [];
        const baseAction = {
            actionId: generateUUID(),
            playerId: aiPlayer.id,
            timestamp: Date.now(),
        };
        // Actions de révélation du centre
        for (const card of gameState.centerCards) {
            if (!card.isRevealed) {
                actions.push({
                    ...baseAction,
                    actionId: generateUUID(),
                    actionType: ActionType.REVEAL_CENTER_CARD,
                    targetCard: { cardId: card.id, location: CardLocation.CENTER },
                });
            }
        }
        // Actions de révélation des cartes des joueurs
        for (const player of gameState.players) {
            if (player.hand.length > 0) {
                actions.push({
                    ...baseAction,
                    actionId: generateUUID(),
                    actionType: ActionType.REVEAL_PLAYER_SMALLEST,
                    targetPlayer: player.id,
                });
                actions.push({
                    ...baseAction,
                    actionId: generateUUID(),
                    actionType: ActionType.REVEAL_PLAYER_LARGEST,
                    targetPlayer: player.id,
                });
            }
        }
        return actions;
    }
    /**
     * Évalue toutes les actions possibles
     */
    evaluateActions(gameState, aiPlayer, actions, analysis, memory) {
        return actions.map(action => ({
            action,
            score: this.calculateActionScore(action, gameState, aiPlayer, analysis, memory),
            factors: this.calculateActionFactors(action, gameState, aiPlayer, analysis, memory),
        }));
    }
    /**
     * Calcule le score d'une action
     */
    calculateActionScore(action, gameState, aiPlayer, analysis, memory) {
        const factors = this.calculateActionFactors(action, gameState, aiPlayer, analysis, memory);
        const strategy = aiPlayer.strategy;
        // Pondérer les facteurs selon la stratégie
        let score = 0;
        score += factors.trioCompletion * 10; // Priorité maximale pour compléter un trio
        score += factors.informationGain * strategy.aggressiveness * 3;
        score += factors.riskAssessment * (1 - strategy.aggressiveness) * 2;
        score += factors.opponentDisruption * strategy.aggressiveness * 4;
        // Ajouter du bruit selon le niveau de difficulté
        const noise = (1 - strategy.memory) * (Math.random() - 0.5) * 2;
        score += noise;
        return Math.max(0, score);
    }
    /**
     * Calcule les facteurs d'évaluation d'une action
     */
    calculateActionFactors(action, gameState, aiPlayer, analysis, memory) {
        let trioCompletion = 0;
        let informationGain = 0;
        let riskAssessment = 0;
        let opponentDisruption = 0;
        // Facteur de complétion de trio
        const revealedNumbers = gameState.revealedCards.map(c => c.number);
        if (revealedNumbers.length === 2 && revealedNumbers[0] === revealedNumbers[1]) {
            // On a déjà 2 cartes identiques, chercher la 3ème
            const targetNumber = revealedNumbers[0];
            trioCompletion = this.estimateTrioCompletionChance(action, targetNumber, analysis);
        }
        // Facteur de gain d'information
        informationGain = this.estimateInformationGain(action, gameState, analysis);
        // Facteur d'évaluation des risques
        riskAssessment = this.assessActionRisk(action, gameState, aiPlayer, analysis);
        // Facteur de perturbation des adversaires
        opponentDisruption = this.estimateOpponentDisruption(action, gameState, analysis);
        return {
            trioCompletion,
            informationGain,
            riskAssessment,
            opponentDisruption,
        };
    }
    /**
     * Sélectionne une action selon la stratégie
     */
    selectAction(actionScores, strategy) {
        // Trier par score décroissant
        actionScores.sort((a, b) => b.score - a.score);
        // Ajuster la sélection selon la difficulté
        const difficulty = strategy.difficulty || 'MEDIUM';
        switch (difficulty) {
            case AIDifficulty.EASY:
                // IA facile : fait parfois des erreurs, choisit aléatoirement parmi toutes les actions
                if (Math.random() < 0.3) {
                    // 30% de chance de faire une action complètement aléatoire
                    return actionScores[Math.floor(Math.random() * actionScores.length)].action;
                }
                // Sinon, choisir parmi les 50% meilleures actions
                const easyTopCount = Math.max(1, Math.floor(actionScores.length * 0.5));
                const easyTopActions = actionScores.slice(0, easyTopCount);
                return easyTopActions[Math.floor(Math.random() * easyTopActions.length)].action;
            case AIDifficulty.MEDIUM:
                // IA moyenne : choisit généralement bien mais avec quelques erreurs
                if (Math.random() < 0.1) {
                    // 10% de chance de faire une action sous-optimale
                    const mediumCount = Math.max(2, Math.floor(actionScores.length * 0.7));
                    const mediumActions = actionScores.slice(1, mediumCount); // Exclure la meilleure
                    if (mediumActions.length > 0) {
                        return mediumActions[Math.floor(Math.random() * mediumActions.length)].action;
                    }
                }
                // Sinon, sélection pondérée parmi les meilleures actions
                const mediumTopCount = Math.max(1, Math.floor(actionScores.length * strategy.patience));
                const mediumTopActions = actionScores.slice(0, mediumTopCount);
                return this.weightedSelection(mediumTopActions);
            case AIDifficulty.HARD:
                // IA difficile : joue presque toujours optimalement
                if (Math.random() < 0.05) {
                    // 5% de chance seulement de ne pas choisir la meilleure action
                    const hardTopCount = Math.min(3, actionScores.length);
                    const hardTopActions = actionScores.slice(0, hardTopCount);
                    return this.weightedSelection(hardTopActions);
                }
                // 95% du temps, choisir la meilleure action
                return actionScores[0].action;
            default:
                // Fallback vers le comportement original
                const topActionsCount = Math.max(1, Math.floor(actionScores.length * strategy.patience));
                const topActions = actionScores.slice(0, topActionsCount);
                return this.weightedSelection(topActions);
        }
    }
    weightedSelection(actionScores) {
        // Sélection pondérée par le score
        const totalScore = actionScores.reduce((sum, as) => sum + Math.max(0.1, as.score), 0);
        let random = Math.random() * totalScore;
        for (const actionScore of actionScores) {
            random -= Math.max(0.1, actionScore.score);
            if (random <= 0) {
                return actionScore.action;
            }
        }
        // Fallback: retourner la meilleure action
        return actionScores[0].action;
    }
    /**
     * Calcule le temps de réflexion de l'IA
     */
    calculateThinkingTime(aiPlayer, analysis) {
        const baseTime = calculateAIDelay(aiPlayer.aiDifficulty);
        // Ajuster selon la complexité de la situation
        let complexity = 1;
        if (analysis.possibleTrios.length > 0)
            complexity += 0.5;
        if (analysis.opponentThreats.size > 0)
            complexity += 0.3;
        if (analysis.centerCardsRemaining < 5)
            complexity += 0.2;
        return Math.floor(baseTime * complexity);
    }
    /**
     * Calcule la confiance dans une décision
     */
    calculateConfidence(actionScores, selectedAction) {
        if (actionScores.length === 0)
            return 0;
        const selectedScore = actionScores.find(as => as.action.actionId === selectedAction.actionId);
        if (!selectedScore)
            return 0;
        const maxScore = Math.max(...actionScores.map(as => as.score));
        const minScore = Math.min(...actionScores.map(as => as.score));
        if (maxScore === minScore)
            return 1;
        return (selectedScore.score - minScore) / (maxScore - minScore);
    }
    /**
     * Génère une explication de la décision (pour debug)
     */
    generateReasoning(action, analysis) {
        switch (action.actionType) {
            case ActionType.REVEAL_CENTER_CARD:
                return 'Révélation d\'une carte du centre pour obtenir de nouvelles informations';
            case ActionType.REVEAL_PLAYER_SMALLEST:
                return `Révélation de la plus petite carte d'un adversaire`;
            case ActionType.REVEAL_PLAYER_LARGEST:
                return `Révélation de la plus grande carte d'un adversaire`;
            default:
                return 'Action par défaut';
        }
    }
    /**
     * Obtient ou crée la mémoire d'une IA
     */
    getOrCreateMemory(aiId, gameState) {
        let memory = this.aiMemories.get(aiId);
        if (!memory) {
            memory = {
                revealedCards: new Map(),
                playerActions: new Map(),
                trioAttempts: [],
                lastGameState: gameState,
                confidence: new Map(),
            };
            this.aiMemories.set(aiId, memory);
        }
        return memory;
    }
    /**
     * Estime la chance de compléter un trio
     */
    estimateTrioCompletionChance(action, targetNumber, analysis) {
        // Logique simplifiée - à améliorer
        if (action.actionType === ActionType.REVEAL_CENTER_CARD) {
            return 0.3; // Chance moyenne au centre
        }
        if (action.actionType === ActionType.REVEAL_PLAYER_SMALLEST ||
            action.actionType === ActionType.REVEAL_PLAYER_LARGEST) {
            return 0.2; // Chance plus faible chez les adversaires
        }
        return 0;
    }
    /**
     * Estime le gain d'information d'une action
     */
    estimateInformationGain(action, gameState, analysis) {
        // Plus il reste de cartes inconnues, plus le gain potentiel est élevé
        const unknownCards = gameState.centerCards.filter(c => !c.isRevealed).length;
        return unknownCards / gameState.centerCards.length;
    }
    /**
     * Évalue les risques d'une action
     */
    assessActionRisk(action, gameState, aiPlayer, analysis) {
        // Risque plus élevé si on révèle nos propres cartes
        if (action.targetPlayer === aiPlayer.id) {
            return 0.8;
        }
        // Risque modéré pour les autres actions
        return 0.3;
    }
    /**
     * Estime la perturbation causée aux adversaires
     */
    estimateOpponentDisruption(action, gameState, analysis) {
        if (action.targetPlayer && analysis.opponentThreats.has(action.targetPlayer)) {
            const threatLevel = analysis.opponentThreats.get(action.targetPlayer) || 0;
            return threatLevel / 10; // Normaliser entre 0 et 1
        }
        return 0;
    }
    /**
     * Calcule le nombre de tours depuis le dernier trio
     */
    calculateTurnsSinceLastTrio(gameState) {
        // Logique simplifiée - compter les actions depuis le dernier trio
        let turns = 0;
        for (let i = gameState.turnHistory.length - 1; i >= 0; i--) {
            turns++;
            // Si on trouve une action qui a mené à un trio, s'arrêter
            // (cette logique devrait être améliorée avec plus de contexte)
            if (turns > 10)
                break; // Limite arbitraire
        }
        return turns;
    }
    /**
     * Nettoie la mémoire des IA (pour éviter les fuites mémoire)
     */
    cleanup() {
        // Garder seulement les mémoires récentes
        const cutoff = Date.now() - (60 * 60 * 1000); // 1 heure
        for (const [aiId, memory] of this.aiMemories.entries()) {
            if (memory.lastGameState.lastActionTime < cutoff) {
                this.aiMemories.delete(aiId);
            }
        }
    }
}
