/**
 * Moteur IA pour les joueurs virtuels de 3online
 */

import {
  GameState,
  GameAction,
  Player,
  Card,
  ActionType,
  AIDifficulty,
  UUID,
  CardLocation,
  AIPlayer,
  AIMemory,
  AIStrategy,
  GameAnalysis,
  DecisionOptions,
  DecisionResult,
  ActionScore,
  AI_DIFFICULTY_CONFIGS,
  TrioAttempt,
} from '@3online/shared';

import {
  generateUUID,
  calculateAIDelay,
  getSmallestCard,
  getLargestCard,
  checkVictoryConditions,
} from '../utils/sharedUtils.js';

export class AIEngine {
  private aiMemories: Map<UUID, AIMemory> = new Map();

  public async makeDecision(
    gameState: GameState,
    aiPlayer: AIPlayer,
    options: DecisionOptions = {}
  ): Promise<DecisionResult> {
    const startTime = Date.now();

    const analysis = this.analyzeGameState(gameState, aiPlayer);
    const memory = this.getOrCreateMemory(aiPlayer.id, gameState);
    this.updateMemory(aiPlayer, gameState, memory);

    const availableActions = options.availableActions || this.getAvailableActions(gameState, aiPlayer);

    if (availableActions.length === 0) {
      throw new Error("Aucune action disponible pour l'IA");
    }

    const actionScores = this.evaluateActions(gameState, aiPlayer, availableActions, analysis, memory);
    const selectedAction = this.selectAction(actionScores, aiPlayer.strategy);
    const thinkingTime = this.calculateThinkingTime(aiPlayer, analysis);

    if (thinkingTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, thinkingTime));
    }

    return {
      action: selectedAction,
      confidence: this.calculateConfidence(actionScores, selectedAction),
      reasoning: this.generateReasoning(selectedAction, analysis),
      thinkingTime: Date.now() - startTime,
    };
  }

  public updateMemory(aiPlayer: AIPlayer, gameState: GameState, memory?: AIMemory): void {
    const aiMemory = memory || this.getOrCreateMemory(aiPlayer.id, gameState);

    for (const card of gameState.revealedCards) {
      aiMemory.revealedCards.set(card.id, { ...card });
    }

    const lastAction = gameState.turnHistory[gameState.turnHistory.length - 1];
    if (lastAction) {
      const playerActions = aiMemory.playerActions.get(lastAction.playerId) || [];
      playerActions.push(lastAction);
      aiMemory.playerActions.set(lastAction.playerId, playerActions);
    }

    aiMemory.lastGameState = { ...gameState };
    this.aiMemories.set(aiPlayer.id, aiMemory);
  }

  public setDifficulty(aiPlayer: AIPlayer, level: AIDifficulty): void {
    aiPlayer.aiDifficulty = level;
    aiPlayer.strategy = { ...AI_DIFFICULTY_CONFIGS[level] };
  }

  public analyzeGameState(gameState: GameState, aiPlayer: AIPlayer): GameAnalysis {
    const memory = this.getOrCreateMemory(aiPlayer.id, gameState);

    const knownCards = new Map<UUID, number>();
    for (const [cardId, card] of memory.revealedCards) {
      knownCards.set(cardId, card.number);
    }

    const playerHandSizes = new Map<UUID, number>();
    for (const player of gameState.players) {
      playerHandSizes.set(player.id, player.hand.length);
    }

    const cardCounts = new Map<number, number>();
    for (const card of memory.revealedCards.values()) {
      cardCounts.set(card.number, (cardCounts.get(card.number) || 0) + 1);
    }

    const possibleTrios = Array.from(cardCounts.entries())
      .filter(([, count]) => count === 2)
      .map(([number]) => number);

    const opponentThreats = new Map<UUID, number>();
    for (const player of gameState.players) {
      if (player.id !== aiPlayer.id) {
        const victoryResult = checkVictoryConditions(player);
        let threatLevel = 0;
        if (player.trios.length >= 2) threatLevel += 3;
        if (player.trios.some((trio) => trio.number === 7)) threatLevel += 5;
        if (victoryResult.hasWon) threatLevel = 10;
        opponentThreats.set(player.id, threatLevel);
      }
    }

    return {
      knownCards,
      playerHandSizes,
      possibleTrios,
      opponentThreats,
      centerCardsRemaining: gameState.centerCards.filter((c) => !c.isRevealed).length,
      turnsSinceLastTrio: this.calculateTurnsSinceLastTrio(gameState),
    };
  }

  private getAvailableActions(gameState: GameState, aiPlayer: AIPlayer): GameAction[] {
    const actions: GameAction[] = [];
    const base = { playerId: aiPlayer.id, timestamp: Date.now() };

    for (const card of gameState.centerCards) {
      if (!card.isRevealed) {
        actions.push({
          ...base,
          actionId: generateUUID(),
          actionType: ActionType.REVEAL_CENTER_CARD,
          targetCard: { cardId: card.id, location: CardLocation.CENTER },
        });
      }
    }

    for (const player of gameState.players) {
      if (player.hand.length > 0) {
        actions.push({
          ...base,
          actionId: generateUUID(),
          actionType: ActionType.REVEAL_PLAYER_SMALLEST,
          targetPlayer: player.id,
        });
        actions.push({
          ...base,
          actionId: generateUUID(),
          actionType: ActionType.REVEAL_PLAYER_LARGEST,
          targetPlayer: player.id,
        });
      }
    }

    return actions;
  }

  private evaluateActions(
    gameState: GameState,
    aiPlayer: AIPlayer,
    actions: GameAction[],
    analysis: GameAnalysis,
    memory: AIMemory
  ): ActionScore[] {
    return actions.map((action) => ({
      action,
      score: this.calculateActionScore(action, gameState, aiPlayer, analysis, memory),
      factors: this.calculateActionFactors(action, gameState, aiPlayer, analysis, memory),
    }));
  }

  private calculateActionScore(
    action: GameAction,
    gameState: GameState,
    aiPlayer: AIPlayer,
    analysis: GameAnalysis,
    memory: AIMemory
  ): number {
    const factors = this.calculateActionFactors(action, gameState, aiPlayer, analysis, memory);
    const strategy = aiPlayer.strategy;

    let score = 0;
    score += factors.trioCompletion * 10;
    score += factors.informationGain * strategy.aggressiveness * 3;
    score += factors.riskAssessment * (1 - strategy.aggressiveness) * 2;
    score += factors.opponentDisruption * strategy.aggressiveness * 4;

    const noise = (1 - strategy.memory) * (Math.random() - 0.5) * 2;
    score += noise;

    return Math.max(0, score);
  }

  private calculateActionFactors(
    action: GameAction,
    gameState: GameState,
    aiPlayer: AIPlayer,
    analysis: GameAnalysis,
    memory: AIMemory
  ): ActionScore['factors'] {
    const revealedNumbers = gameState.revealedCards.map((c) => c.number);
    let trioCompletion = 0;

    if (revealedNumbers.length === 2 && revealedNumbers[0] === revealedNumbers[1]) {
      trioCompletion = this.estimateTrioCompletionChance(action, revealedNumbers[0], analysis);
    }

    return {
      trioCompletion,
      informationGain: this.estimateInformationGain(action, gameState, analysis),
      riskAssessment: this.assessActionRisk(action, gameState, aiPlayer, analysis),
      opponentDisruption: this.estimateOpponentDisruption(action, gameState, analysis),
    };
  }

  private selectAction(actionScores: ActionScore[], strategy: AIStrategy): GameAction {
    actionScores.sort((a, b) => b.score - a.score);

    // Déduire la difficulté depuis les valeurs de la stratégie
    const difficulty = this.inferDifficulty(strategy);

    switch (difficulty) {
      case AIDifficulty.EASY: {
        if (Math.random() < 0.3) {
          return actionScores[Math.floor(Math.random() * actionScores.length)].action;
        }
        const topCount = Math.max(1, Math.floor(actionScores.length * 0.5));
        const topActions = actionScores.slice(0, topCount);
        return topActions[Math.floor(Math.random() * topActions.length)].action;
      }

      case AIDifficulty.MEDIUM: {
        if (Math.random() < 0.1) {
          const pool = actionScores.slice(1, Math.max(2, Math.floor(actionScores.length * 0.7)));
          if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)].action;
        }
        const topCount = Math.max(1, Math.floor(actionScores.length * strategy.patience));
        return this.weightedSelection(actionScores.slice(0, topCount));
      }

      case AIDifficulty.HARD: {
        if (Math.random() < 0.05) {
          return this.weightedSelection(actionScores.slice(0, Math.min(3, actionScores.length)));
        }
        return actionScores[0].action;
      }

      default: {
        const topCount = Math.max(1, Math.floor(actionScores.length * strategy.patience));
        return this.weightedSelection(actionScores.slice(0, topCount));
      }
    }
  }

  // Déduit AIDifficulty depuis les valeurs numériques de la stratégie
  private inferDifficulty(strategy: AIStrategy): AIDifficulty {
    if (strategy.memory >= 0.9) return AIDifficulty.HARD;
    if (strategy.memory >= 0.6) return AIDifficulty.MEDIUM;
    return AIDifficulty.EASY;
  }

  private weightedSelection(actionScores: ActionScore[]): GameAction {
    const totalScore = actionScores.reduce((sum, as) => sum + Math.max(0.1, as.score), 0);
    let random = Math.random() * totalScore;

    for (const actionScore of actionScores) {
      random -= Math.max(0.1, actionScore.score);
      if (random <= 0) return actionScore.action;
    }

    return actionScores[0].action;
  }

  private calculateThinkingTime(aiPlayer: AIPlayer, analysis: GameAnalysis): number {
    const baseTime = calculateAIDelay(aiPlayer.aiDifficulty);
    let complexity = 1;
    if (analysis.possibleTrios.length > 0) complexity += 0.5;
    if (analysis.opponentThreats.size > 0) complexity += 0.3;
    if (analysis.centerCardsRemaining < 5) complexity += 0.2;
    return Math.floor(baseTime * complexity);
  }

  private calculateConfidence(actionScores: ActionScore[], selectedAction: GameAction): number {
    if (actionScores.length === 0) return 0;
    const selected = actionScores.find((as) => as.action.actionId === selectedAction.actionId);
    if (!selected) return 0;
    const max = Math.max(...actionScores.map((as) => as.score));
    const min = Math.min(...actionScores.map((as) => as.score));
    if (max === min) return 1;
    return (selected.score - min) / (max - min);
  }

  private generateReasoning(action: GameAction, analysis: GameAnalysis): string {
    switch (action.actionType) {
      case ActionType.REVEAL_CENTER_CARD:
        return "Révélation d'une carte du centre pour obtenir de nouvelles informations";
      case ActionType.REVEAL_PLAYER_SMALLEST:
        return "Révélation de la plus petite carte d'un adversaire";
      case ActionType.REVEAL_PLAYER_LARGEST:
        return "Révélation de la plus grande carte d'un adversaire";
      default:
        return 'Action par défaut';
    }
  }

  private getOrCreateMemory(aiId: UUID, gameState: GameState): AIMemory {
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

  private estimateTrioCompletionChance(
    action: GameAction,
    targetNumber: number,
    analysis: GameAnalysis
  ): number {
    if (action.actionType === ActionType.REVEAL_CENTER_CARD) return 0.3;
    if (
      action.actionType === ActionType.REVEAL_PLAYER_SMALLEST ||
      action.actionType === ActionType.REVEAL_PLAYER_LARGEST
    )
      return 0.2;
    return 0;
  }

  private estimateInformationGain(
    action: GameAction,
    gameState: GameState,
    analysis: GameAnalysis
  ): number {
    const unknown = gameState.centerCards.filter((c) => !c.isRevealed).length;
    return gameState.centerCards.length > 0 ? unknown / gameState.centerCards.length : 0;
  }

  private assessActionRisk(
    action: GameAction,
    gameState: GameState,
    aiPlayer: AIPlayer,
    analysis: GameAnalysis
  ): number {
    return action.targetPlayer === aiPlayer.id ? 0.8 : 0.3;
  }

  private estimateOpponentDisruption(
    action: GameAction,
    gameState: GameState,
    analysis: GameAnalysis
  ): number {
    if (action.targetPlayer && analysis.opponentThreats.has(action.targetPlayer)) {
      return (analysis.opponentThreats.get(action.targetPlayer) ?? 0) / 10;
    }
    return 0;
  }

  private calculateTurnsSinceLastTrio(gameState: GameState): number {
    return Math.min(gameState.turnHistory.length, 10);
  }

  public cleanup(): void {
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const [aiId, memory] of this.aiMemories.entries()) {
      if (memory.lastGameState.lastActionTime < cutoff) {
        this.aiMemories.delete(aiId);
      }
    }
  }
}
