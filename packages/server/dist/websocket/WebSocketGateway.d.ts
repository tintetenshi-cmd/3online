/**
 * Passerelle WebSocket pour la communication temps réel
 * Gère les connexions, événements et diffusion des messages
 */
import { Server as HTTPServer } from 'http';
import { ServerToClientEvents, UUID } from '@3online/shared';
import { RoomManager } from '../room/RoomManager.js';
import { GameEngine } from '../game/GameEngine.js';
import { AIEngine } from '../ai/AIEngine.js';
export declare class WebSocketGateway {
    private io;
    private roomManager;
    private gameEngine;
    private aiEngine;
    private connectedPlayers;
    constructor(httpServer: HTTPServer, roomManager: RoomManager, gameEngine: GameEngine, aiEngine: AIEngine);
    /**
     * Configure les gestionnaires d'événements
     */
    private setupEventHandlers;
    /**
     * Configure les gestionnaires pour un socket spécifique
     */
    private setupSocketHandlers;
    /**
     * Gère la déconnexion d'un socket
     */
    private handleDisconnection;
    /**
     * Diffuse un événement à tous les joueurs d'une salle
     */
    broadcastToRoom<T extends keyof ServerToClientEvents>(roomId: UUID, event: T, ...args: Parameters<ServerToClientEvents[T]>): void;
    /**
     * Envoie un événement à un joueur spécifique
     */
    sendToPlayer<T extends keyof ServerToClientEvents>(playerId: UUID, event: T, ...args: Parameters<ServerToClientEvents[T]>): void;
    /**
     * Traite le tour d'une IA si nécessaire
     */
    private processAITurnIfNeeded;
    private calculateAIThinkingTime;
    /**
     * Obtient les statistiques de connexion
     */
    getConnectionStats(): {
        totalConnections: number;
        authenticatedPlayers: number;
        roomsWithPlayers: number;
    };
    /**
     * Nettoie les connexions inactives
     */
    cleanup(): void;
}
