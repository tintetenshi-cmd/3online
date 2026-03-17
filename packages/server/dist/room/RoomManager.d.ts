/**
 * Gestionnaire des salles de jeu pour 3online
 * Gère la création, jointure, et gestion des salles
 */
import { UUID, Player, RoomInfo, RoomState, RoomSettings, JoinResult, LeaveResult, StartResult, ChatMessage, ConnectionStatus } from '@3online/shared';
export declare class RoomManager {
    private rooms;
    private roomCodes;
    private playerRooms;
    /**
     * Crée une nouvelle salle
     */
    createRoom(hostPlayer: Player, settings: RoomSettings): RoomInfo;
    /**
     * Fait rejoindre un joueur à une salle
     */
    joinRoom(roomCode: string, player: Player): JoinResult;
    /**
     * Fait quitter un joueur d'une salle
     */
    leaveRoom(roomId: UUID, playerId: UUID): LeaveResult;
    /**
     * Démarre une partie dans une salle
     */
    startGame(roomId: UUID, hostId: UUID): StartResult;
    /**
     * Ajoute un joueur IA à une salle
     */
    addAIPlayer(roomId: UUID, difficulty: import('@3online/shared').AIDifficulty): Player;
    /**
     * Retire un joueur IA d'une salle
     */
    removeAIPlayer(roomId: UUID, playerId: UUID): boolean;
    /**
     * Obtient l'état d'une salle
     */
    getRoomState(roomId: UUID): RoomState | null;
    /**
     * Obtient l'état d'une salle par son code
     */
    getRoomStateByCode(roomCode: string): RoomState | null;
    /**
     * Ajoute un message de chat à une salle
     */
    addChatMessage(roomId: UUID, playerId: UUID, content: string): ChatMessage | null;
    /**
     * Met à jour le statut de connexion d'un joueur
     */
    updatePlayerConnectionStatus(playerId: UUID, status: ConnectionStatus): void;
    /**
     * Obtient la salle d'un joueur
     */
    getPlayerRoom(playerId: UUID): RoomState | null;
    /**
     * Génère un code de salle unique
     */
    private generateUniqueRoomCode;
    /**
     * Génère un nom unique pour une IA
     */
    private generateAIName;
    /**
     * Obtient les avatars disponibles
     */
    private getAvailableAvatars;
    /**
     * Ajoute un message système à une salle
     */
    private addSystemMessage;
    /**
     * Génère un token pour un joueur dans une salle
     */
    private generatePlayerToken;
    /**
     * Nettoie les salles vides ou inactives
     */
    cleanup(): void;
    /**
     * Obtient les statistiques des salles
     */
    getStats(): {
        totalRooms: number;
        activeRooms: number;
        totalPlayers: number;
        averagePlayersPerRoom: number;
    };
}
