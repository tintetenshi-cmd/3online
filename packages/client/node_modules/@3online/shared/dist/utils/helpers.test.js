import { describe, it, expect } from 'vitest';
import { generateUUID, generateRoomCode, createFullDeck, isValidTrio, checkVictoryConditions, getCardsPerPlayer, } from './helpers.js';
import { GAME_CONSTANTS } from '../constants/game.js';
import { AvatarType, ConnectionStatus, VictoryCondition } from '../types/core.js';
describe('Helpers', () => {
    describe('generateUUID', () => {
        it('should generate valid UUIDs', () => {
            const uuid1 = generateUUID();
            const uuid2 = generateUUID();
            expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
            expect(uuid2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
            expect(uuid1).not.toBe(uuid2);
        });
    });
    describe('generateRoomCode', () => {
        it('should generate 6-character room codes', () => {
            const code = generateRoomCode();
            expect(code).toHaveLength(6);
            expect(code).toMatch(/^[A-Z0-9]{6}$/);
        });
        it('should generate unique codes', () => {
            const codes = new Set();
            for (let i = 0; i < 100; i++) {
                codes.add(generateRoomCode());
            }
            expect(codes.size).toBe(100);
        });
    });
    describe('createFullDeck', () => {
        it('should create a deck with correct number of cards', () => {
            const deck = createFullDeck();
            expect(deck).toHaveLength(GAME_CONSTANTS.TOTAL_CARDS);
        });
        it('should have 3 cards of each number', () => {
            const deck = createFullDeck();
            const counts = new Map();
            deck.forEach(card => {
                counts.set(card.number, (counts.get(card.number) || 0) + 1);
            });
            for (let i = 1; i <= 12; i++) {
                expect(counts.get(i)).toBe(3);
            }
        });
    });
    describe('getCardsPerPlayer', () => {
        it('should return correct card distribution', () => {
            expect(getCardsPerPlayer(2)).toBe(15);
            expect(getCardsPerPlayer(3)).toBe(9);
            expect(getCardsPerPlayer(4)).toBe(7);
            expect(getCardsPerPlayer(5)).toBe(6);
            expect(getCardsPerPlayer(6)).toBe(5);
        });
    });
    describe('isValidTrio', () => {
        it('should validate correct trios', () => {
            const cards = [
                { id: '1', number: 5, isRevealed: true, location: 'TRIO_PILE' },
                { id: '2', number: 5, isRevealed: true, location: 'TRIO_PILE' },
                { id: '3', number: 5, isRevealed: true, location: 'TRIO_PILE' },
            ];
            expect(isValidTrio(cards)).toBe(true);
        });
        it('should reject invalid trios', () => {
            const cards = [
                { id: '1', number: 5, isRevealed: true, location: 'TRIO_PILE' },
                { id: '2', number: 6, isRevealed: true, location: 'TRIO_PILE' },
                { id: '3', number: 5, isRevealed: true, location: 'TRIO_PILE' },
            ];
            expect(isValidTrio(cards)).toBe(false);
        });
    });
    describe('checkVictoryConditions', () => {
        const createPlayer = (trios) => ({
            id: generateUUID(),
            name: 'Test Player',
            avatar: AvatarType.AVATAR_1,
            hand: [],
            trios: trios.map(number => ({
                id: generateUUID(),
                number,
                cards: [],
                playerId: 'test',
                formedAt: Date.now(),
            })),
            isAI: false,
            connectionStatus: ConnectionStatus.CONNECTED,
            score: { trios: trios.length, victories: 0 },
        });
        it('should detect trio of 7 victory', () => {
            const player = createPlayer([7]);
            const result = checkVictoryConditions(player);
            expect(result.hasWon).toBe(true);
            expect(result.condition).toBe(VictoryCondition.TRIO_SEVEN);
        });
        it('should detect three trios victory', () => {
            const player = createPlayer([1, 2, 3]);
            const result = checkVictoryConditions(player);
            expect(result.hasWon).toBe(true);
            expect(result.condition).toBe(VictoryCondition.THREE_TRIOS);
        });
        it('should detect linked trios victory', () => {
            const player = createPlayer([5, 6]);
            const result = checkVictoryConditions(player);
            expect(result.hasWon).toBe(true);
            expect(result.condition).toBe(VictoryCondition.LINKED_TRIOS);
        });
        it('should not detect victory with insufficient trios', () => {
            const player = createPlayer([1]);
            const result = checkVictoryConditions(player);
            expect(result.hasWon).toBe(false);
            expect(result.condition).toBe(VictoryCondition.NONE);
        });
    });
});
