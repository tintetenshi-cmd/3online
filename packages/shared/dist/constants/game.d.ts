export declare const GAME_CONSTANTS: {
    readonly TOTAL_CARDS: 36;
    readonly CARDS_PER_NUMBER: 3;
    readonly MIN_CARD_NUMBER: 1;
    readonly MAX_CARD_NUMBER: 12;
    readonly TRIO_SIZE: 3;
    readonly VICTORY_CONDITIONS: {
        readonly THREE_TRIOS: 3;
        readonly LINKED_TRIOS: 2;
        readonly TRIO_SEVEN: 7;
    };
    readonly CARDS_PER_PLAYER: {
        readonly 2: 15;
        readonly 3: 9;
        readonly 4: 7;
        readonly 5: 6;
        readonly 6: 5;
    };
    readonly MIN_PLAYERS: 2;
    readonly MAX_PLAYERS: 6;
    readonly TIMEOUTS: {
        readonly TURN_TIMEOUT: 60000;
        readonly RECONNECTION_GRACE: 30000;
        readonly AI_THINKING_MIN: 1000;
        readonly AI_THINKING_MAX: 3000;
    };
    readonly DEFAULT_THINKING_TIME: {
        readonly EASY: 1500;
        readonly MEDIUM: 2000;
        readonly HARD: 2500;
    };
};
export type PlayerCount = keyof typeof GAME_CONSTANTS.CARDS_PER_PLAYER;
export type CardNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
