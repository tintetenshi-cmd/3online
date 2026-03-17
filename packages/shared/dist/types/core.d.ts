/**
 * Types de base pour le jeu 3online
 */
export declare enum CardLocation {
    CENTER = "CENTER",
    PLAYER_HAND = "PLAYER_HAND",
    TRIO_PILE = "TRIO_PILE"
}
export declare enum ActionType {
    REVEAL_CENTER_CARD = "REVEAL_CENTER_CARD",
    REVEAL_PLAYER_SMALLEST = "REVEAL_PLAYER_SMALLEST",
    REVEAL_PLAYER_LARGEST = "REVEAL_PLAYER_LARGEST",
    END_TURN = "END_TURN"
}
export declare enum GameStatus {
    WAITING = "WAITING",
    ACTIVE = "ACTIVE",
    FINISHED = "FINISHED",
    PAUSED = "PAUSED"
}
export declare enum TurnPhase {
    WAITING_FOR_ACTION = "WAITING_FOR_ACTION",
    REVEALING_CARDS = "REVEALING_CARDS",
    TRIO_FORMED = "TRIO_FORMED",
    TURN_ENDED = "TURN_ENDED"
}
export declare enum ConnectionStatus {
    CONNECTED = "CONNECTED",
    DISCONNECTED = "DISCONNECTED",
    RECONNECTING = "RECONNECTING"
}
export declare enum AIDifficulty {
    EASY = "EASY",
    MEDIUM = "MEDIUM",
    HARD = "HARD"
}
export declare enum AvatarType {
    GENERATED = "GENERATED",
    AVATAR_1 = "AVATAR_1",
    AVATAR_2 = "AVATAR_2",
    AVATAR_3 = "AVATAR_3",
    AVATAR_4 = "AVATAR_4",
    AVATAR_5 = "AVATAR_5",
    AVATAR_6 = "AVATAR_6",
    AVATAR_7 = "AVATAR_7",
    AVATAR_8 = "AVATAR_8",
    AVATAR_9 = "AVATAR_9",
    AVATAR_10 = "AVATAR_10",
    AVATAR_11 = "AVATAR_11",
    AVATAR_12 = "AVATAR_12"
}
export declare enum VictoryCondition {
    NONE = "NONE",
    TRIO_SEVEN = "TRIO_SEVEN",
    THREE_TRIOS = "THREE_TRIOS",
    LINKED_TRIOS = "LINKED_TRIOS"
}
export type UUID = string;
export type Timestamp = number;
export interface Card {
    id: UUID;
    number: number;
    isRevealed: boolean;
    location: CardLocation;
    revealedBy?: UUID;
    revealOrder?: number;
}
export interface Trio {
    id: UUID;
    number: number;
    cards: [Card, Card, Card];
    formedAt: Timestamp;
}
export interface PlayerScore {
    trios: number;
    victories: number;
}
export interface Player {
    id: UUID;
    name: string;
    avatar: AvatarType;
    avatarSeed?: string;
    nameColor?: string;
    hand: Card[];
    trios: Trio[];
    isAI: boolean;
    aiDifficulty?: AIDifficulty;
    connectionStatus: ConnectionStatus;
    score: PlayerScore;
    isHost?: boolean;
}
export interface GameAction {
    actionId: UUID;
    playerId: UUID;
    actionType: ActionType;
    targetCard?: CardReference;
    targetPlayer?: UUID;
    timestamp: Timestamp;
    isValid?: boolean;
}
export interface CardReference {
    cardId?: UUID;
    location: CardLocation;
    playerId?: UUID;
    position?: number;
}
export interface ActionResult {
    success: boolean;
    message?: string;
    newGameState?: GameState;
    revealedCard?: Card;
    trioFormed?: Trio;
    victoryResult?: VictoryResult;
}
export interface VictoryResult {
    hasWon: boolean;
    condition: VictoryCondition;
    evidence?: Trio | Trio[];
    winnerId?: UUID;
}
export interface GameState {
    gameId: UUID;
    roomId: UUID;
    players: Player[];
    centerCards: Card[];
    currentPlayerId: UUID;
    turnPhase: TurnPhase;
    revealedCards: Card[];
    gameStatus: GameStatus;
    startTime: Timestamp;
    lastActionTime: Timestamp;
    winner?: UUID;
    turnHistory: GameAction[];
}
export declare enum TurnResultType {
    VICTORY = "VICTORY",
    TRIO_SUCCESS = "TRIO_SUCCESS",
    TURN_END = "TURN_END",
    CONTINUE_TURN = "CONTINUE_TURN"
}
export interface TurnResult {
    type: TurnResultType;
    trio?: Trio;
    victoryResult?: VictoryResult;
    message?: string;
}
export declare enum GameMode {
    SIMPLE = "SIMPLE",
    PICANTE = "PICANTE",
    TEAM = "TEAM"
}
export declare enum RoomStatus {
    WAITING = "WAITING",
    IN_GAME = "IN_GAME",
    FINISHED = "FINISHED"
}
export interface RoomSettings {
    maxPlayers: number;
    gameMode: GameMode;
    allowAI: boolean;
    isPrivate: boolean;
}
export interface RoomInfo {
    id: UUID;
    code: string;
    hostId: UUID;
    settings: RoomSettings;
    status: RoomStatus;
    createdAt: Timestamp;
}
export interface RoomState {
    info: RoomInfo;
    players: Player[];
    chatMessages: ChatMessage[];
}
export interface ChatMessage {
    id: UUID;
    roomId: UUID;
    playerId?: UUID;
    playerName?: string;
    content: string;
    timestamp: Timestamp;
    isSystemMessage: boolean;
}
export interface JoinResult {
    success: boolean;
    message?: string;
    roomState?: RoomState;
    playerToken?: string;
}
export interface LeaveResult {
    success: boolean;
    message?: string;
    roomState?: RoomState;
}
export interface StartResult {
    success: boolean;
    message?: string;
}
export interface AIStrategy {
    aggressiveness: number;
    patience: number;
    memory: number;
    riskTolerance: number;
}
export interface AIPlayer extends Player {
    isAI: true;
    aiDifficulty: AIDifficulty;
    strategy: AIStrategy;
}
export interface AIMemory {
    revealedCards: Map<UUID, Card>;
    playerActions: Map<UUID, GameAction[]>;
    trioAttempts: TrioAttempt[];
    lastGameState: GameState;
    confidence: Map<string, number>;
}
export interface TrioAttempt {
    playerId: UUID;
    targetNumber: number;
    cardsRevealed: Card[];
    success: boolean;
    timestamp: Timestamp;
}
export interface GameAnalysis {
    knownCards: Map<UUID, number>;
    playerHandSizes: Map<UUID, number>;
    possibleTrios: number[];
    opponentThreats: Map<UUID, number>;
    centerCardsRemaining: number;
    turnsSinceLastTrio: number;
}
export interface DecisionOptions {
    availableActions?: GameAction[];
    timeLimit?: number;
}
export interface DecisionResult {
    action: GameAction;
    confidence: number;
    reasoning: string;
    thinkingTime: number;
}
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
export declare const AI_DIFFICULTY_CONFIGS: Record<AIDifficulty, AIStrategy>;
export interface ClientToServerEvents {
    createRoom: (playerName: string, avatar: AvatarType, settings: RoomSettings, callback: (response: {
        success: boolean;
        roomInfo?: RoomInfo;
        error?: string;
    }) => void) => void;
    joinRoom: (roomCode: string, playerName: string, avatar: AvatarType, callback: (response: JoinResult) => void) => void;
    leaveRoom: (roomId: UUID, callback: (response: LeaveResult) => void) => void;
    startGame: (roomId: UUID, callback: (response: StartResult) => void) => void;
    addAIPlayer: (roomId: UUID, difficulty: AIDifficulty, callback: (response: {
        success: boolean;
        player?: Player;
        error?: string;
    }) => void) => void;
    removeAIPlayer: (roomId: UUID, playerId: UUID, callback: (response: {
        success: boolean;
        error?: string;
    }) => void) => void;
    playerAction: (roomId: UUID, action: GameAction, callback: (response: ActionResult) => void) => void;
    sendChatMessage: (roomId: UUID, message: string, callback: (response: {
        success: boolean;
        error?: string;
    }) => void) => void;
    reconnect: (roomId: UUID, playerId: UUID, token: string, callback: (response: {
        success: boolean;
        roomState?: RoomState;
        error?: string;
    }) => void) => void;
}
export interface ServerToClientEvents {
    roomUpdated: (roomState: RoomState) => void;
    playerJoined: (player: Player) => void;
    playerLeft: (playerId: UUID, playerName: string) => void;
    playerDisconnected: (playerId: UUID, playerName: string) => void;
    playerReconnected: (playerId: UUID, playerName: string) => void;
    aiPlayerAdded: (player: Player) => void;
    aiPlayerRemoved: (playerId: UUID) => void;
    gameStarted: (gameState: GameState) => void;
    gameStateUpdated: (gameState: GameState) => void;
    cardRevealed: (card: Card, playerId: UUID) => void;
    trioFormed: (trio: Trio, playerId: UUID) => void;
    turnChanged: (newPlayerId: UUID) => void;
    gameEnded: (result: VictoryResult) => void;
    aiAction: (action: GameAction, result: ActionResult) => void;
    chatMessage: (message: ChatMessage) => void;
    error: (message: string) => void;
}
export interface InterServerEvents {
}
export interface SocketData {
    playerId?: UUID;
    roomId?: UUID;
    playerName?: string;
    isAuthenticated: boolean;
    connectionTime: number;
}
