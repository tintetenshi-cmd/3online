/**
 * Types de base pour le jeu 3online
 */

// Énumérations de base
export enum CardLocation {
  CENTER = 'CENTER',
  PLAYER_HAND = 'PLAYER_HAND',
  TRIO_PILE = 'TRIO_PILE',
}

export enum ActionType {
  REVEAL_CENTER_CARD = 'REVEAL_CENTER_CARD',
  REVEAL_PLAYER_SMALLEST = 'REVEAL_PLAYER_SMALLEST',
  REVEAL_PLAYER_LARGEST = 'REVEAL_PLAYER_LARGEST',
  END_TURN = 'END_TURN',
}

export enum GameStatus {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
  PAUSED = 'PAUSED',
}

export enum TurnPhase {
  WAITING_FOR_ACTION = 'WAITING_FOR_ACTION',
  REVEALING_CARDS = 'REVEALING_CARDS',
  TRIO_FORMED = 'TRIO_FORMED',
  TURN_ENDED = 'TURN_ENDED',
}

export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
}

export enum AIDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum AvatarType {
  GENERATED = 'GENERATED',
  AVATAR_1 = 'AVATAR_1',
  AVATAR_2 = 'AVATAR_2',
  AVATAR_3 = 'AVATAR_3',
  AVATAR_4 = 'AVATAR_4',
  AVATAR_5 = 'AVATAR_5',
  AVATAR_6 = 'AVATAR_6',
  AVATAR_7 = 'AVATAR_7',
  AVATAR_8 = 'AVATAR_8',
  AVATAR_9 = 'AVATAR_9',
  AVATAR_10 = 'AVATAR_10',
  AVATAR_11 = 'AVATAR_11',
  AVATAR_12 = 'AVATAR_12',
}

export enum VictoryCondition {
  NONE = 'NONE',
  TRIO_SEVEN = 'TRIO_SEVEN',
  THREE_TRIOS = 'THREE_TRIOS',
  LINKED_TRIOS = 'LINKED_TRIOS',
}

// Types de base
export type UUID = string;
export type Timestamp = number;

// Interface pour les cartes
export interface Card {
  id: UUID;
  number: number; // 1-12
  isRevealed: boolean;
  location: CardLocation;
  revealedBy?: UUID;
  revealOrder?: number;
}

// Interface pour les trios
export interface Trio {
  id: UUID;
  number: number;
  cards: [Card, Card, Card];
  formedAt: Timestamp;
}

// Interface pour les scores des joueurs
export interface PlayerScore {
  trios: number;
  victories: number;
}

// Interface pour les joueurs
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

// Interface pour les actions de jeu
export interface GameAction {
  actionId: UUID;
  playerId: UUID;
  actionType: ActionType;
  targetCard?: CardReference;
  targetPlayer?: UUID;
  timestamp: Timestamp;
  isValid?: boolean;
}

// Référence vers une carte
export interface CardReference {
  cardId?: UUID;
  location: CardLocation;
  playerId?: UUID;
  position?: number;
}

// Résultat d'une action
export interface ActionResult {
  success: boolean;
  message?: string;
  newGameState?: GameState;
  revealedCard?: Card;
  trioFormed?: Trio;
  victoryResult?: VictoryResult;
}

// Résultat de vérification de victoire
export interface VictoryResult {
  hasWon: boolean;
  condition: VictoryCondition;
  evidence?: Trio | Trio[];
  winnerId?: UUID;
}

// État principal du jeu
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

// Types pour les résultats de tour
export enum TurnResultType {
  VICTORY = 'VICTORY',
  TRIO_SUCCESS = 'TRIO_SUCCESS',
  TURN_END = 'TURN_END',
  CONTINUE_TURN = 'CONTINUE_TURN',
}

export interface TurnResult {
  type: TurnResultType;
  trio?: Trio;
  victoryResult?: VictoryResult;
  message?: string;
}
// Types pour les salles de jeu
export enum GameMode {
  SIMPLE = 'SIMPLE',
  PICANTE = 'PICANTE',
  TEAM = 'TEAM',
}

export enum RoomStatus {
  WAITING = 'WAITING',
  IN_GAME = 'IN_GAME',
  FINISHED = 'FINISHED',
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

// Types pour le chat
export interface ChatMessage {
  id: UUID;
  roomId: UUID;
  playerId?: UUID;
  playerName?: string;
  content: string;
  timestamp: Timestamp;
  isSystemMessage: boolean;
}

// Résultats d'opérations
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

// Types pour l'IA
export interface AIStrategy {
  aggressiveness: number; // 0-1
  patience: number; // 0-1
  memory: number; // 0-1
  riskTolerance: number; // 0-1
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

// Configuration IA par difficulté
export const AI_DIFFICULTY_CONFIGS: Record<AIDifficulty, AIStrategy> = {
  [AIDifficulty.EASY]: {
    aggressiveness: 0.3,
    patience: 0.2,
    memory: 0.4,
    riskTolerance: 0.7,
  },
  [AIDifficulty.MEDIUM]: {
    aggressiveness: 0.6,
    patience: 0.5,
    memory: 0.7,
    riskTolerance: 0.4,
  },
  [AIDifficulty.HARD]: {
    aggressiveness: 0.8,
    patience: 0.8,
    memory: 0.95,
    riskTolerance: 0.2,
  },
};

// Types pour WebSocket
export interface ClientToServerEvents {
  // Gestion des salles
  createRoom: (
    playerName: string,
    avatar: AvatarType,
    settings: RoomSettings,
    callback: (response: { success: boolean; roomInfo?: RoomInfo; error?: string }) => void
  ) => void;

  joinRoom: (
    roomCode: string,
    playerName: string,
    avatar: AvatarType,
    callback: (response: JoinResult) => void
  ) => void;

  leaveRoom: (
    roomId: UUID,
    callback: (response: LeaveResult) => void
  ) => void;

  startGame: (
    roomId: UUID,
    callback: (response: StartResult) => void
  ) => void;

  addAIPlayer: (
    roomId: UUID,
    difficulty: AIDifficulty,
    callback: (response: { success: boolean; player?: Player; error?: string }) => void
  ) => void;

  removeAIPlayer: (
    roomId: UUID,
    playerId: UUID,
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;

  // Actions de jeu
  playerAction: (
    roomId: UUID,
    action: GameAction,
    callback: (response: ActionResult) => void
  ) => void;

  // Chat
  sendChatMessage: (
    roomId: UUID,
    message: string,
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;

  // Reconnexion
  reconnect: (
    roomId: UUID,
    playerId: UUID,
    token: string,
    callback: (response: { success: boolean; roomState?: RoomState; error?: string }) => void
  ) => void;
}

export interface ServerToClientEvents {
  // Événements de salle
  roomUpdated: (roomState: RoomState) => void;
  playerJoined: (player: Player) => void;
  playerLeft: (playerId: UUID, playerName: string) => void;
  playerDisconnected: (playerId: UUID, playerName: string) => void;
  playerReconnected: (playerId: UUID, playerName: string) => void;

  // Événements d'IA
  aiPlayerAdded: (player: Player) => void;
  aiPlayerRemoved: (playerId: UUID) => void;

  // Événements de jeu
  gameStarted: (gameState: GameState) => void;
  gameStateUpdated: (gameState: GameState) => void;
  cardRevealed: (card: Card, playerId: UUID) => void;
  trioFormed: (trio: Trio, playerId: UUID) => void;
  turnChanged: (newPlayerId: UUID) => void;
  gameEnded: (result: VictoryResult) => void;

  // Actions IA
  aiAction: (action: GameAction, result: ActionResult) => void;

  // Chat
  chatMessage: (message: ChatMessage) => void;

  // Erreurs
  error: (message: string) => void;
}

export interface InterServerEvents {
  // Pour les communications entre serveurs (clustering)
}

export interface SocketData {
  playerId?: UUID;
  roomId?: UUID;
  playerName?: string;
  isAuthenticated: boolean;
  connectionTime: number;
}