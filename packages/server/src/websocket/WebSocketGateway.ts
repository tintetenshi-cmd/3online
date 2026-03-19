/**
 * Passerelle WebSocket pour la communication temps réel
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  UUID,
  Player,
  GameStatus,
  RoomStatus,
  ConnectionStatus,
} from '@3online/shared';

import { RoomManager } from '../room/RoomManager.js';
import { GameEngine } from '../game/GameEngine.js';
import { AIEngine } from '../ai/AIEngine.js';

// ── Types locaux (fallback si non exportés par shared) ────────────

interface GameAction {
  actionType: string;
  [key: string]: unknown;
}

interface ActionResult {
  success: boolean;
  message?: string;
  newGameState?: GameState;
  revealedCard?: unknown;
  trioFormed?: unknown;
  victoryResult?: { hasWon: boolean; [key: string]: unknown };
}

interface ChatMessage {
  id: string;
  playerId: UUID;
  message: string;
  timestamp: number;
}

interface GameState {
  gameId: string;
  roomId: string;
  players: Player[];
  currentPlayerId: UUID;
  gameStatus: GameStatus | string;
  [key: string]: unknown;
}

type AIPlayer = {
  id: UUID;
  name: string;
  avatar: string;
  avatarSeed: string;
  nameColor: string;
  hand: unknown[];
  trios: unknown[];
  isAI: boolean;
  connectionStatus: ConnectionStatus;
  score: { trios: number; victories: number };
  aiDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
};

interface AIDecision {
  action: GameAction;
  confidence: number;
  reasoning?: string;
}

// ── Utilitaire UUID natif (pas besoin de shared) ──────────────────

function generateUUID(): UUID {
  return crypto.randomUUID() as UUID;
}

// ─────────────────────────────────────────────────────────────────

export class WebSocketGateway {
  private io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;
  private roomManager: RoomManager;
  private gameEngine: GameEngine;
  private aiEngine: AIEngine;
  private connectedPlayers: Map<UUID, Socket> = new Map();

  constructor(
    httpServer: HTTPServer,
    roomManager: RoomManager,
    gameEngine: GameEngine,
    aiEngine: AIEngine
  ) {
    this.roomManager = roomManager;
    this.gameEngine = gameEngine;
    this.aiEngine = aiEngine;

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          const isLocal =
            /^http:\/\/localhost:\d+$/.test(origin) ||
            /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
          const isConfigured = origin === clientUrl;
          return callback(null, isLocal || isConfigured);
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connecté: ${socket.id}`);
      socket.data = {
        isAuthenticated: false,
        connectionTime: Date.now(),
      };
      this.setupSocketHandlers(socket);
    });
  }

  private setupSocketHandlers(socket: Socket): void {
    // ── createRoom ────────────────────────────────────────────────
    socket.on('createRoom', async (playerName, avatar, avatarSeed, nameColor, settings, callback) => {
      try {
        const playerId = generateUUID();

        const player: Player = {
          id: playerId,
          name: playerName,
          avatar,
          avatarSeed,
          nameColor,
          hand: [],
          trios: [],
          isAI: false,
          connectionStatus: ConnectionStatus.CONNECTED,
          score: { trios: 0, victories: 0 },
        };

        const roomInfo = this.roomManager.createRoom(player, settings);

        socket.data.playerId = playerId;
        socket.data.roomId = roomInfo.id;
        socket.data.playerName = playerName;
        socket.data.isAuthenticated = true;

        await socket.join(roomInfo.id);
        this.connectedPlayers.set(playerId, socket);

        callback({ success: true, roomInfo, playerId });
      } catch (error) {
        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Erreur lors de la création de la salle',
        });
      }
    });

    // ── joinRoom ──────────────────────────────────────────────────
    socket.on('joinRoom', async (roomCode, playerName, avatar, avatarSeed, nameColor, callback) => {
      try {
        const playerId = generateUUID();

        const player: Player = {
          id: playerId,
          name: playerName,
          avatar,
          avatarSeed,
          nameColor,
          hand: [],
          trios: [],
          isAI: false,
          connectionStatus: ConnectionStatus.CONNECTED,
          score: { trios: 0, victories: 0 },
        };

        const result = this.roomManager.joinRoom(roomCode, player);

        if (result.success && result.roomState) {
          socket.data.playerId = playerId;
          socket.data.roomId = result.roomState.info.id;
          socket.data.playerName = playerName;
          socket.data.isAuthenticated = true;

          await socket.join(result.roomState.info.id);
          this.connectedPlayers.set(playerId, socket);

          this.broadcastToRoom(result.roomState.info.id, 'playerJoined', player);
          this.broadcastToRoom(result.roomState.info.id, 'roomUpdated', result.roomState);

          const responseWithId = result as typeof result & { playerId: UUID };
          responseWithId.playerId = playerId;

          callback(responseWithId);
          return;
        }

        callback(result);
      } catch (error) {
        callback({
          success: false,
          message: error instanceof Error ? error.message : 'Erreur lors de la jointure',
        });
      }
    });

    // ── leaveRoom ─────────────────────────────────────────────────
    socket.on('leaveRoom', async (roomId, callback) => {
      try {
        const playerId = socket.data.playerId;
        if (!playerId) {
          callback({ success: false, message: 'Joueur non authentifié' });
          return;
        }

        const result = this.roomManager.leaveRoom(roomId, playerId);

        if (result.success) {
          await socket.leave(roomId);
          this.connectedPlayers.delete(playerId);
          socket.data.playerId = undefined;
          socket.data.roomId = undefined;
          socket.data.isAuthenticated = false;

          this.broadcastToRoom(roomId, 'playerLeft', playerId, socket.data.playerName ?? 'Joueur');

          if (result.roomState) {
            this.broadcastToRoom(roomId, 'roomUpdated', result.roomState);
          }
        }

        callback(result);
      } catch (error) {
        callback({
          success: false,
          message: error instanceof Error ? error.message : 'Erreur lors de la sortie',
        });
      }
    });

    // ── startGame ─────────────────────────────────────────────────
    socket.on('startGame', async (roomId, callback) => {
      try {
        const playerId = socket.data.playerId;
        if (!playerId) {
          callback({ success: false, message: 'Joueur non authentifié' });
          return;
        }

        const startResult = this.roomManager.startGame(roomId, playerId);

        if (startResult.success) {
          const roomState = this.roomManager.getRoomState(roomId);
          if (roomState) {
            const gameState = this.gameEngine.initializeGame(roomId, roomId, roomState.players);
            console.log(`Jeu initialisé avec gameId: ${roomId}`);

            this.broadcastToRoom(roomId, 'gameStarted', gameState);
            this.broadcastToRoom(roomId, 'roomUpdated', roomState);

            await this.processAITurnIfNeeded(gameState);
          }
        }

        callback(startResult);
      } catch (error) {
        callback({
          success: false,
          message: error instanceof Error ? error.message : 'Erreur lors du démarrage',
        });
      }
    });

    // ── addAIPlayer ───────────────────────────────────────────────
    socket.on('addAIPlayer', async (roomId, difficulty, callback) => {
      try {
        const aiPlayer = this.roomManager.addAIPlayer(roomId, difficulty);
        const roomState = this.roomManager.getRoomState(roomId);

        if (roomState) {
          this.broadcastToRoom(roomId, 'aiPlayerAdded', aiPlayer);
          this.broadcastToRoom(roomId, 'roomUpdated', roomState);
        }

        callback({ success: true, player: aiPlayer });
      } catch (error) {
        callback({
          success: false,
          error: error instanceof Error ? error.message : "Erreur lors de l'ajout de l'IA",
        });
      }
    });

    // ── removeAIPlayer ────────────────────────────────────────────
    socket.on('removeAIPlayer', async (roomId, playerId, callback) => {
      try {
        const success = this.roomManager.removeAIPlayer(roomId, playerId);

        if (success) {
          const roomState = this.roomManager.getRoomState(roomId);
          this.broadcastToRoom(roomId, 'aiPlayerRemoved', playerId);
          if (roomState) {
            this.broadcastToRoom(roomId, 'roomUpdated', roomState);
          }
        }

        callback({ success });
      } catch (error) {
        callback({
          success: false,
          error: error instanceof Error ? error.message : "Erreur lors de la suppression de l'IA",
        });
      }
    });

    // ── playerAction ──────────────────────────────────────────────
    socket.on('playerAction', async (roomId, action, callback) => {
      try {
        const playerId = socket.data.playerId;
        if (!playerId) {
          callback({ success: false, message: 'Joueur non authentifié' });
          return;
        }

        const gameState = this.gameEngine.getCurrentGameState(roomId);
        if (!gameState) {
          callback({ success: false, message: 'Partie non trouvée' });
          return;
        }

        console.log(`Action reçue de ${playerId} dans la partie ${roomId}:`, action.actionType);

        const result = this.gameEngine.processCardReveal(gameState.gameId, playerId, action);

        if (result.success && result.newGameState) {
          this.broadcastToRoom(roomId, 'gameStateUpdated', result.newGameState);

          if (result.revealedCard) {
            this.broadcastToRoom(roomId, 'cardRevealed', result.revealedCard, playerId);
          }
          if (result.trioFormed) {
            this.broadcastToRoom(roomId, 'trioFormed', result.trioFormed, playerId);
          }
          if (result.victoryResult?.hasWon) {
            this.broadcastToRoom(roomId, 'gameEnded', result.victoryResult);
          } else if (result.newGameState.currentPlayerId !== playerId) {
            this.broadcastToRoom(roomId, 'turnChanged', result.newGameState.currentPlayerId);
          }

          await this.processAITurnIfNeeded(result.newGameState);
        }

        callback(result);
      } catch (error) {
        callback({
          success: false,
          message: error instanceof Error ? error.message : "Erreur lors de l'action",
        });
      }
    });

    // ── sendChatMessage ───────────────────────────────────────────
    socket.on('sendChatMessage', async (roomId, message, callback) => {
      try {
        const playerId = socket.data.playerId;
        if (!playerId) {
          callback({ success: false, error: 'Joueur non authentifié' });
          return;
        }

        const chatMessage = this.roomManager.addChatMessage(roomId, playerId, message);

        if (chatMessage) {
          this.broadcastToRoom(roomId, 'chatMessage', chatMessage);
          callback({ success: true });
        } else {
          callback({ success: false, error: "Impossible d'envoyer le message" });
        }
      } catch (error) {
        callback({
          success: false,
          error: error instanceof Error ? error.message : "Erreur lors de l'envoi",
        });
      }
    });

    // ── reconnect ─────────────────────────────────────────────────
    socket.on('reconnect', async (roomId, playerId, token, callback) => {
      try {
        const roomState = this.roomManager.getRoomState(roomId);
        if (!roomState) {
          callback({ success: false, error: 'Salle non trouvée' });
          return;
        }

        const player = roomState.players.find((p: Player) => p.id === playerId);
        if (!player) {
          callback({ success: false, error: 'Joueur non trouvé' });
          return;
        }

        socket.data.playerId = playerId;
        socket.data.roomId = roomId;
        socket.data.playerName = player.name;
        socket.data.isAuthenticated = true;

        await socket.join(roomId);
        this.roomManager.updatePlayerConnectionStatus(playerId, ConnectionStatus.CONNECTED);
        this.connectedPlayers.set(playerId, socket);

        this.broadcastToRoom(roomId, 'playerReconnected', playerId, player.name);

        callback({ success: true, roomState });
      } catch (error) {
        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Erreur lors de la reconnexion',
        });
      }
    });

    // ── disconnect ────────────────────────────────────────────────
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  private handleDisconnection(socket: Socket): void {
    console.log(`Client déconnecté: ${socket.id}`);

    const playerId = socket.data.playerId;
    const roomId = socket.data.roomId;
    const playerName = socket.data.playerName;

    if (playerId && roomId) {
      this.roomManager.updatePlayerConnectionStatus(playerId, ConnectionStatus.DISCONNECTED);
      this.connectedPlayers.delete(playerId);

      this.broadcastToRoom(roomId, 'playerDisconnected', playerId, playerName ?? 'Joueur');

      setTimeout(() => {
        const roomState = this.roomManager.getRoomState(roomId);
        if (roomState) {
          const player = roomState.players.find((p: Player) => p.id === playerId);
          if (player?.connectionStatus === ConnectionStatus.DISCONNECTED) {
            this.roomManager.leaveRoom(roomId, playerId);
            this.broadcastToRoom(roomId, 'playerLeft', playerId, playerName ?? 'Joueur');
          }
        }
      }, 30_000);
    }
  }

  public broadcastToRoom<T extends keyof ServerToClientEvents>(
    roomId: UUID,
    event: T,
    ...args: Parameters<ServerToClientEvents[T]>
  ): void {
    this.io.to(roomId).emit(event, ...args);
  }

  public sendToPlayer<T extends keyof ServerToClientEvents>(
    playerId: UUID,
    event: T,
    ...args: Parameters<ServerToClientEvents[T]>
  ): void {
    const socket = this.connectedPlayers.get(playerId);
    if (socket) {
      socket.emit(event, ...args);
    }
  }

  private async processAITurnIfNeeded(gameState: GameState): Promise<void> {
    const currentPlayer = gameState.players.find(
      (p: Player) => p.id === gameState.currentPlayerId
    ) as AIPlayer | undefined;

    console.log(
      `Vérification tour IA - Joueur actuel: ${currentPlayer?.name}, ` +
        `isAI: ${currentPlayer?.isAI}, gameStatus: ${gameState.gameStatus}`
    );

    if (currentPlayer?.isAI && gameState.gameStatus === 'ACTIVE') {
      try {
        const availableActions = this.gameEngine.getValidActions(
          gameState.gameId,
          currentPlayer.id
        );

        if (availableActions.length > 0) {
          const decision: AIDecision = await this.aiEngine.makeDecision(
            gameState,
            currentPlayer,
            { availableActions }
          );

          const thinkingTime = this.calculateAIThinkingTime(currentPlayer, decision);

          this.broadcastToRoom(gameState.roomId, 'aiThinking', {
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            thinkingTime,
          });

          await new Promise<void>((resolve) => setTimeout(resolve, thinkingTime));

          const result = this.gameEngine.processCardReveal(
            gameState.gameId,
            currentPlayer.id,
            decision.action
          );

          if (result.success && result.newGameState) {
            this.broadcastToRoom(gameState.roomId, 'aiAction', {
              playerId: currentPlayer.id,
              playerName: currentPlayer.name,
              action: decision.action,
              confidence: decision.confidence,
              reasoning: decision.reasoning,
            });

            this.broadcastToRoom(gameState.roomId, 'gameStateUpdated', result.newGameState);

            if (result.revealedCard) {
              this.broadcastToRoom(gameState.roomId, 'cardRevealed', result.revealedCard, currentPlayer.id);
            }
            if (result.trioFormed) {
              this.broadcastToRoom(gameState.roomId, 'trioFormed', result.trioFormed, currentPlayer.id);
            }
            if (result.newGameState.currentPlayerId !== currentPlayer.id && !result.trioFormed) {
              this.broadcastToRoom(gameState.roomId, 'trioFailed', currentPlayer.id);
            }

            if (result.victoryResult?.hasWon) {
              this.broadcastToRoom(gameState.roomId, 'gameEnded', result.victoryResult);
            } else {
              if (result.newGameState.currentPlayerId !== currentPlayer.id) {
                this.broadcastToRoom(gameState.roomId, 'turnChanged', result.newGameState.currentPlayerId);
              }
              await this.processAITurnIfNeeded(result.newGameState);
            }
          } else {
            console.error(`Échec de l'action IA: ${result.message}`);
          }
        }
      } catch (error) {
        console.error('Erreur lors du traitement du tour IA:', error);
      }
    }
  }

  private calculateAIThinkingTime(aiPlayer: AIPlayer, decision: AIDecision): number {
    const baseTimes: Record<string, { min: number; max: number }> = {
      EASY: { min: 800, max: 2000 },
      MEDIUM: { min: 1200, max: 3000 },
      HARD: { min: 1500, max: 4000 },
    };

    const difficulty = aiPlayer.aiDifficulty ?? 'MEDIUM';
    const timeRange = baseTimes[difficulty] ?? baseTimes['MEDIUM'];
    let thinkingTime = timeRange.min + Math.random() * (timeRange.max - timeRange.min);

    if (decision.confidence < 0.5) thinkingTime *= 1.5;
    else if (decision.confidence > 0.8) thinkingTime *= 0.7;

    return Math.round(thinkingTime);
  }

  public getConnectionStats(): {
    totalConnections: number;
    authenticatedPlayers: number;
    roomsWithPlayers: number;
  } {
    return {
      totalConnections: this.io.sockets.sockets.size,
      authenticatedPlayers: this.connectedPlayers.size,
      roomsWithPlayers: new Set(
        Array.from(this.connectedPlayers.values())
          .map((s) => s.data.roomId)
          .filter((id): id is string => Boolean(id))
      ).size,
    };
  }

  public cleanup(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000;

    for (const [playerId, socket] of this.connectedPlayers.entries()) {
      if (socket.data.connectionTime && now - socket.data.connectionTime > maxAge) {
        socket.disconnect(true);
        this.connectedPlayers.delete(playerId);
      }
    }
  }
}
