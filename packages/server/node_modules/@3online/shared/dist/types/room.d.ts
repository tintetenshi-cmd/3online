/**
 * Types pour la gestion des salles de jeu
 */
import { UUID, Player, GameState, Timestamp } from './core.js';
export declare enum RoomStatus {
    WAITING = "WAITING",
    IN_GAME = "IN_GAME",
    FINISHED = "FINISHED"
}
export declare enum GameMode {
    SIMPLE = "SIMPLE",
    PICANTE = "PICANTE",// Pour extension future
    TEAM = "TEAM"
}
export interface RoomSettings {
    maxPlayers: number;
    gameMode: GameMode;
    allowAI: boolean;
    isPrivate: boolean;
    aiDifficulty?: import('./core.js').AIDifficulty;
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
    gameState?: GameState;
    chatMessages: ChatMessage[];
}
export interface JoinResult {
    success: boolean;
    message?: string;
    roomState?: RoomState;
    playerToken?: string;
    playerId?: UUID;
}
export interface LeaveResult {
    success: boolean;
    message?: string;
    roomState?: RoomState;
}
export interface StartResult {
    success: boolean;
    message?: string;
    gameState?: GameState;
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
export interface CardDistribution {
    players: Player[];
    centerCards: import('./core.js').Card[];
    totalCards: number;
}
