/**
 * Moteur de jeu principal pour 3online
 * Implémente la logique de base du jeu Trio
 */
import { TurnResultType, ActionType, CardLocation, GameStatus, TurnPhase, } from '@3online/shared';
import { createFullDeck, getCardsPerPlayer, sortHand, generateUUID, checkVictoryConditions, getSmallestCard, getLargestCard, extractNumbers, allSameNumber, hasTwoConsecutiveDifferentNumbers, createTrio, getNextPlayer, createInitialGameState, } from '@3online/shared';
import { validateGameAction } from '@3online/shared';
export class GameEngine {
    gameStates = new Map();
    /**
     * Initialise une nouvelle partie
     */
    initializeGame(gameId, roomId, players) {
        // Créer l'état de jeu initial
        const gameState = {
            ...createInitialGameState(gameId, roomId, players),
            gameStatus: GameStatus.ACTIVE,
            turnPhase: TurnPhase.WAITING_FOR_ACTION,
        };
        // Distribuer les cartes
        const distribution = this.distributeCards(players);
        gameState.players = distribution.players;
        gameState.centerCards = distribution.centerCards;
        // Choisir le premier joueur (aléatoire)
        const randomIndex = Math.floor(Math.random() * players.length);
        gameState.currentPlayerId = players[randomIndex].id;
        // Sauvegarder l'état
        this.gameStates.set(gameId, gameState);
        return gameState;
    }
    /**
     * Distribue les cartes selon le nombre de joueurs
     */
    distributeCards(players) {
        const playerCount = players.length;
        const cardsPerPlayer = getCardsPerPlayer(playerCount);
        // Créer et mélanger le deck
        const deck = createFullDeck();
        let cardIndex = 0;
        // Distribuer aux joueurs
        const updatedPlayers = players.map(player => {
            const hand = [];
            for (let i = 0; i < cardsPerPlayer; i++) {
                const card = deck[cardIndex];
                card.location = CardLocation.PLAYER_HAND;
                hand.push(card);
                cardIndex++;
            }
            return {
                ...player,
                hand: sortHand(hand),
            };
        });
        // Cartes restantes au centre
        const centerCards = deck.slice(cardIndex).map(card => ({
            ...card,
            location: CardLocation.CENTER,
        }));
        return { players: updatedPlayers, centerCards };
    }
    /**
     * Traite une révélation de carte
     */
    processCardReveal(gameId, playerId, action) {
        const gameState = this.gameStates.get(gameId);
        if (!gameState) {
            return { success: false, message: 'Partie non trouvée' };
        }
        // Valider l'action
        const validation = this.validateAction(gameState, playerId, action);
        if (!validation.success) {
            return validation;
        }
        try {
            // Révéler la carte selon le type d'action
            const revealResult = this.revealCard(gameState, action);
            if (!revealResult.success) {
                return revealResult;
            }
            // Traiter le tour
            const turnResult = this.processTurn(gameState, playerId);
            // Mettre à jour l'état
            gameState.lastActionTime = Date.now();
            gameState.turnHistory.push(action);
            return {
                success: true,
                newGameState: gameState,
                revealedCard: revealResult.revealedCard,
                trioFormed: turnResult.trio,
                victoryResult: turnResult.victoryResult,
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Erreur lors du traitement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
            };
        }
    }
    /**
     * Révèle une carte selon l'action
     */
    revealCard(gameState, action) {
        let targetCard = null;
        switch (action.actionType) {
            case ActionType.REVEAL_CENTER_CARD:
                targetCard = this.revealCenterCard(gameState, action);
                break;
            case ActionType.REVEAL_PLAYER_SMALLEST:
                targetCard = this.revealPlayerCard(gameState, action, 'smallest');
                break;
            case ActionType.REVEAL_PLAYER_LARGEST:
                targetCard = this.revealPlayerCard(gameState, action, 'largest');
                break;
            default:
                return { success: false, message: 'Type d\'action non supporté' };
        }
        if (!targetCard) {
            return { success: false, message: 'Impossible de révéler la carte' };
        }
        // Marquer la carte comme révélée
        targetCard.isRevealed = true;
        targetCard.revealedBy = action.playerId;
        targetCard.revealOrder = gameState.revealedCards.length + 1;
        // Ajouter aux cartes révélées du tour
        gameState.revealedCards.push(targetCard);
        return { success: true, revealedCard: targetCard };
    }
    /**
     * Révèle une carte du centre
     */
    revealCenterCard(gameState, action) {
        if (!action.targetCard?.cardId)
            return null;
        const card = gameState.centerCards.find(c => c.id === action.targetCard.cardId);
        if (!card || card.isRevealed)
            return null;
        return card;
    }
    /**
     * Révèle la plus petite ou plus grande carte d'un joueur
     */
    revealPlayerCard(gameState, action, type) {
        if (!action.targetPlayer)
            return null;
        const targetPlayer = gameState.players.find(p => p.id === action.targetPlayer);
        if (!targetPlayer || targetPlayer.hand.length === 0)
            return null;
        const card = type === 'smallest'
            ? getSmallestCard(targetPlayer.hand)
            : getLargestCard(targetPlayer.hand);
        if (!card)
            return null;
        // Retirer la carte de la main du joueur
        targetPlayer.hand = targetPlayer.hand.filter(c => c.id !== card.id);
        return card;
    }
    /**
     * Traite la logique du tour après révélation
     */
    processTurn(gameState, playerId) {
        const revealedNumbers = extractNumbers(gameState.revealedCards);
        // Vérifier si un trio est formé
        if (allSameNumber(revealedNumbers) && revealedNumbers.length === 3) {
            return this.handleTrioFormed(gameState, playerId);
        }
        // Vérifier si le tour doit se terminer
        if (hasTwoConsecutiveDifferentNumbers(revealedNumbers)) {
            return this.handleTurnEnd(gameState);
        }
        // Continuer le tour
        gameState.turnPhase = TurnPhase.WAITING_FOR_ACTION;
        return { type: TurnResultType.CONTINUE_TURN };
    }
    /**
     * Gère la formation d'un trio
     */
    handleTrioFormed(gameState, playerId) {
        const player = gameState.players.find(p => p.id === playerId);
        if (!player) {
            return { type: TurnResultType.TURN_END };
        }
        // Créer le trio
        const trio = createTrio(gameState.revealedCards);
        if (!trio) {
            return { type: TurnResultType.TURN_END };
        }
        // Ajouter le trio au joueur
        player.trios.push(trio);
        player.score.trios = player.trios.length;
        // Marquer les cartes comme étant dans un trio
        for (const card of trio.cards) {
            card.location = CardLocation.TRIO_PILE;
        }
        // Vider les cartes révélées
        gameState.revealedCards = [];
        gameState.turnPhase = TurnPhase.TRIO_FORMED;
        // Vérifier les conditions de victoire
        const victoryResult = checkVictoryConditions(player);
        if (victoryResult.hasWon) {
            gameState.gameStatus = GameStatus.FINISHED;
            gameState.winner = playerId;
            return {
                type: TurnResultType.VICTORY,
                trio,
                victoryResult,
            };
        }
        // Le joueur continue son tour
        gameState.turnPhase = TurnPhase.WAITING_FOR_ACTION;
        return {
            type: TurnResultType.TRIO_SUCCESS,
            trio,
        };
    }
    /**
     * Gère la fin du tour
     */
    handleTurnEnd(gameState) {
        // Remettre les cartes révélées à leur place
        this.hideRevealedCards(gameState);
        // Passer au joueur suivant
        const nextPlayer = getNextPlayer(gameState);
        if (nextPlayer) {
            gameState.currentPlayerId = nextPlayer.id;
        }
        gameState.turnPhase = TurnPhase.TURN_ENDED;
        // Préparer le prochain tour
        setTimeout(() => {
            gameState.turnPhase = TurnPhase.WAITING_FOR_ACTION;
        }, 1000);
        return { type: TurnResultType.TURN_END };
    }
    /**
     * Remet les cartes révélées à leur place d'origine
     */
    hideRevealedCards(gameState) {
        for (const card of gameState.revealedCards) {
            card.isRevealed = false;
            card.revealedBy = undefined;
            card.revealOrder = undefined;
            // Remettre la carte à sa place d'origine
            if (card.location === CardLocation.CENTER) {
                // La carte reste au centre
                continue;
            }
            else {
                // Remettre la carte dans la main du joueur qui l'a révélée
                const originalPlayer = gameState.players.find(p => p.id === card.revealedBy);
                if (originalPlayer) {
                    card.location = CardLocation.PLAYER_HAND;
                    originalPlayer.hand.push(card);
                    originalPlayer.hand = sortHand(originalPlayer.hand);
                }
            }
        }
        gameState.revealedCards = [];
    }
    /**
     * Valide une action de jeu
     */
    validateAction(gameState, playerId, action) {
        // Validation de base de l'action
        const actionValidation = validateGameAction(action);
        if (!actionValidation.isValid) {
            return { success: false, message: actionValidation.errors.join(', ') };
        }
        // Vérifier que c'est le tour du joueur
        if (gameState.currentPlayerId !== playerId) {
            return { success: false, message: 'Ce n\'est pas votre tour' };
        }
        // Vérifier que le jeu est actif
        if (gameState.gameStatus !== GameStatus.ACTIVE) {
            return { success: false, message: 'La partie n\'est pas active' };
        }
        // Vérifier que le joueur peut agir
        if (gameState.turnPhase !== TurnPhase.WAITING_FOR_ACTION) {
            return { success: false, message: 'Action non autorisée dans cette phase' };
        }
        // Validations spécifiques selon le type d'action
        switch (action.actionType) {
            case ActionType.REVEAL_CENTER_CARD:
                return this.validateCenterCardReveal(gameState, action);
            case ActionType.REVEAL_PLAYER_SMALLEST:
            case ActionType.REVEAL_PLAYER_LARGEST:
                return this.validatePlayerCardReveal(gameState, action);
            default:
                return { success: false, message: 'Type d\'action non supporté' };
        }
    }
    /**
     * Valide la révélation d'une carte du centre
     */
    validateCenterCardReveal(gameState, action) {
        if (!action.targetCard?.cardId) {
            return { success: false, message: 'Carte cible manquante' };
        }
        const card = gameState.centerCards.find(c => c.id === action.targetCard.cardId);
        if (!card) {
            return { success: false, message: 'Carte non trouvée au centre' };
        }
        if (card.isRevealed) {
            return { success: false, message: 'Cette carte est déjà révélée' };
        }
        return { success: true };
    }
    /**
     * Valide la révélation d'une carte de joueur
     */
    validatePlayerCardReveal(gameState, action) {
        if (!action.targetPlayer) {
            return { success: false, message: 'Joueur cible manquant' };
        }
        const targetPlayer = gameState.players.find(p => p.id === action.targetPlayer);
        if (!targetPlayer) {
            return { success: false, message: 'Joueur cible non trouvé' };
        }
        if (targetPlayer.hand.length === 0) {
            return { success: false, message: 'Ce joueur n\'a plus de cartes' };
        }
        return { success: true };
    }
    /**
     * Obtient l'état actuel du jeu
     */
    getCurrentGameState(gameId) {
        return this.gameStates.get(gameId) || null;
    }
    /**
     * Obtient les actions valides pour un joueur
     */
    getValidActions(gameId, playerId) {
        const gameState = this.gameStates.get(gameId);
        if (!gameState || gameState.currentPlayerId !== playerId) {
            return [];
        }
        const actions = [];
        const baseAction = {
            actionId: generateUUID(),
            playerId,
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
     * Supprime un état de jeu (nettoyage)
     */
    removeGameState(gameId) {
        this.gameStates.delete(gameId);
    }
}
