/**
 * Fonctions utilitaires pour le jeu 3online
 */
import { v4 as uuidv4 } from 'uuid';
import { CardLocation, VictoryCondition, ConnectionStatus, TurnPhase, GameStatus, } from '../types/core.js';
import { GAME_CONSTANTS } from '../constants/game.js';
// Génération d'UUID
export function generateUUID() {
    return uuidv4();
}
// Génération de code de salle
export function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
// Mélange d'un tableau (Fisher-Yates)
export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
// Création d'un deck complet de cartes
export function createFullDeck() {
    const deck = [];
    for (let number = GAME_CONSTANTS.MIN_CARD_NUMBER; number <= GAME_CONSTANTS.MAX_CARD_NUMBER; number++) {
        for (let copy = 0; copy < GAME_CONSTANTS.CARDS_PER_NUMBER; copy++) {
            deck.push({
                id: generateUUID(),
                number,
                isRevealed: false,
                location: CardLocation.CENTER,
            });
        }
    }
    return shuffleArray(deck);
}
// Tri d'une main de cartes par numéro
export function sortHand(hand) {
    return [...hand].sort((a, b) => a.number - b.number);
}
// Obtenir le nombre de cartes par joueur selon le nombre de joueurs
export function getCardsPerPlayer(playerCount) {
    return GAME_CONSTANTS.CARDS_PER_PLAYER[playerCount] || 0;
}
// Vérifier si trois cartes forment un trio valide
export function isValidTrio(cards) {
    if (cards.length !== GAME_CONSTANTS.TRIO_SIZE) {
        return false;
    }
    const firstNumber = cards[0].number;
    return cards.every(card => card.number === firstNumber);
}
// Créer un trio à partir de cartes
export function createTrio(cards) {
    if (!isValidTrio(cards)) {
        return null;
    }
    return {
        id: generateUUID(),
        number: cards[0].number,
        cards: cards,
        formedAt: Date.now(),
    };
}
// Vérifier les conditions de victoire
export function checkVictoryConditions(player) {
    const trioCount = player.trios.length;
    // Condition 1: Trio de 7 (victoire immédiate)
    for (const trio of player.trios) {
        if (trio.number === GAME_CONSTANTS.VICTORY_CONDITIONS.TRIO_SEVEN) {
            return {
                hasWon: true,
                condition: VictoryCondition.TRIO_SEVEN,
                evidence: trio,
                winnerId: player.id,
            };
        }
    }
    // Condition 2: 3 trios quelconques
    if (trioCount >= GAME_CONSTANTS.VICTORY_CONDITIONS.THREE_TRIOS) {
        return {
            hasWon: true,
            condition: VictoryCondition.THREE_TRIOS,
            evidence: player.trios,
            winnerId: player.id,
        };
    }
    // Condition 3: 2 trios liés (numéros consécutifs)
    if (trioCount >= GAME_CONSTANTS.VICTORY_CONDITIONS.LINKED_TRIOS) {
        for (let i = 0; i < trioCount - 1; i++) {
            for (let j = i + 1; j < trioCount; j++) {
                const trio1 = player.trios[i];
                const trio2 = player.trios[j];
                if (Math.abs(trio1.number - trio2.number) === 1) {
                    return {
                        hasWon: true,
                        condition: VictoryCondition.LINKED_TRIOS,
                        evidence: [trio1, trio2],
                        winnerId: player.id,
                    };
                }
            }
        }
    }
    // Aucune condition de victoire remplie
    return {
        hasWon: false,
        condition: VictoryCondition.NONE,
    };
}
// Obtenir la plus petite carte d'une main
export function getSmallestCard(hand) {
    if (hand.length === 0)
        return null;
    const sortedHand = sortHand(hand);
    return sortedHand[0];
}
// Obtenir la plus grande carte d'une main
export function getLargestCard(hand) {
    if (hand.length === 0)
        return null;
    const sortedHand = sortHand(hand);
    return sortedHand[sortedHand.length - 1];
}
// Vérifier si on a au moins 2 cartes de numéros différents (fin de tour)
export function hasTwoDifferentNumbers(numbers) {
    if (numbers.length < 2)
        return false;
    const uniqueNumbers = new Set(numbers);
    return uniqueNumbers.size >= 2;
}
// Vérifier si deux numéros consécutifs sont différents
export function hasTwoConsecutiveDifferentNumbers(numbers) {
    for (let i = 0; i < numbers.length - 1; i++) {
        if (numbers[i] !== numbers[i + 1]) {
            return true;
        }
    }
    return false;
}
// Extraire les numéros des cartes révélées
export function extractNumbers(cards) {
    return cards.map(card => card.number);
}
// Vérifier si tous les numéros sont identiques
export function allSameNumber(numbers) {
    if (numbers.length === 0)
        return true;
    const firstNumber = numbers[0];
    return numbers.every(num => num === firstNumber);
}
// Obtenir le joueur suivant dans l'ordre
export function getNextPlayer(gameState) {
    const currentIndex = gameState.players.findIndex(p => p.id === gameState.currentPlayerId);
    if (currentIndex === -1)
        return null;
    const nextIndex = (currentIndex + 1) % gameState.players.length;
    return gameState.players[nextIndex];
}
// Créer un joueur de base
export function createPlayer(name, avatar, isAI = false) {
    return {
        id: generateUUID(),
        name,
        avatar,
        hand: [],
        trios: [],
        isAI,
        connectionStatus: ConnectionStatus.CONNECTED,
        score: {
            trios: 0,
            victories: 0,
        },
    };
}
// Calculer le temps de réflexion pour l'IA
export function calculateAIDelay(difficulty) {
    const baseTime = GAME_CONSTANTS.DEFAULT_THINKING_TIME[difficulty];
    // Ajouter une variation aléatoire de ±30%
    const variation = baseTime * 0.3;
    return baseTime + (Math.random() - 0.5) * 2 * variation;
}
// Vérifier si un joueur est connecté
export function isPlayerConnected(player) {
    return player.connectionStatus === ConnectionStatus.CONNECTED;
}
// Obtenir les joueurs connectés
export function getConnectedPlayers(players) {
    return players.filter(isPlayerConnected);
}
// Formater un timestamp en heure lisible
export function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
}
// Calculer le score d'un joueur
export function calculatePlayerScore(player) {
    return player.trios.length;
}
// Vérifier si une carte peut être révélée
export function canRevealCard(card) {
    return !card.isRevealed;
}
// Obtenir les cartes disponibles pour révélation au centre
export function getRevealableCenterCards(centerCards) {
    return centerCards.filter(canRevealCard);
}
// Créer un état de jeu initial
export function createInitialGameState(gameId, roomId, players) {
    return {
        gameId,
        roomId,
        players,
        centerCards: [],
        currentPlayerId: players[0]?.id || '',
        turnPhase: TurnPhase.WAITING_FOR_ACTION,
        revealedCards: [],
        gameStatus: GameStatus.WAITING,
        startTime: Date.now(),
        lastActionTime: Date.now(),
        turnHistory: [],
    };
}
