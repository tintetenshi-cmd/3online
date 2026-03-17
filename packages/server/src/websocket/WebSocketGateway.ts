/**
 * Passerelle WebSocket pour la communication temps réel
 * Gère les connexions, événements et diffusion des messages
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
  GameState,
  GameAction,
  ActionResult,
  ChatMessage,
  RoomState,
  ConnectionStatus,
  generateUUID,
} from '@3online/shared';

import { RoomManager } from '../room/RoomManager.js';
import { GameEngine } from '../game/GameEngine.js';
import { AIEngine } from '../ai/AIEngine.js';

export class WebSocketGateway {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
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

    // Initialiser Socket.IO
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: (origin, callback) => {
          // Certains environnements n'envoient pas d'Origin (ex: outils locaux)
          if (!origin) return callback(null, true);

          const isLocal =
            /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
          const isConfigured = origin === clientUrl;

          return callback(null, isLocal || isConfigured);
        },
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
  }

  /**
   * Configure les gestionnaires d'événements
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connecté: ${socket.id}`);
      
      // Initialiser les données du socket
      socket.data = {
        isAuthenticated: false,
        connectionTime: Date.now(),
      };

      this.setupSocketHandlers(socket);
    });
  }

  /**
   * Configure les gestionnaires pour un socket spécifique
   */
  private setupSocketHandlers(socket: Socket): void {
    // Gestion des salles
    socket.on('createRoom', async (playerName, avatar, avatarSeed, nameColor, settings, callback) => {
      try {
        const playerId = generateUUID(); // Générer un vrai UUID
        
        const player: Player = {
          id: playerId, // Utiliser l'UUID généré
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
        
        // Authentifier le socket
        socket.data.playerId = playerId; // Utiliser l'UUID généré
        socket.data.roomId = roomInfo.id;
        socket.data.playerName = playerName;
        socket.data.isAuthenticated = true;

        // Rejoindre la room Socket.IO
        await socket.join(roomInfo.id);
        
        // Enregistrer la connexion avec l'UUID
        this.connectedPlayers.set(playerId, socket);

        callback({ success: true, roomInfo, playerId });
      } catch (error) {
        callback({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Erreur lors de la création de la salle' 
        });
      }
    });

    socket.on('joinRoom', async (roomCode, playerName, avatar, avatarSeed, nameColor, callback) => {
      try {
        const playerId = generateUUID(); // Générer un vrai UUID
        
        const player: Player = {
          id: playerId, // Utiliser l'UUID généré
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
          // Authentifier le socket
          socket.data.playerId = playerId; // Utiliser l'UUID généré
          socket.data.roomId = result.roomState.info.id;
          socket.data.playerName = playerName;
          socket.data.isAuthenticated = true;

          // Rejoindre la room Socket.IO
          await socket.join(result.roomState.info.id);
          
          // Enregistrer la connexion avec l'UUID
          this.connectedPlayers.set(playerId, socket);

          // Notifier les autres joueurs
          this.broadcastToRoom(result.roomState.info.id, 'playerJoined', player);
          this.broadcastToRoom(result.roomState.info.id, 'roomUpdated', result.roomState);
          
          // Ajouter le playerId à la réponse
          (result as any).playerId = playerId;
        }

        callback(result);
      } catch (error) {
        callback({ 
          success: false, 
          message: error instanceof Error ? error.message : 'Erreur lors de la jointure' 
        });
      }
    });

    socket.on('leaveRoom', async (roomId, callback) => {
      try {
        const playerId = socket.data.playerId;
        if (!playerId) {
          callback({ success: false, message: 'Joueur non authentifié' });
          return;
        }

        const result = this.roomManager.leaveRoom(roomId, playerId);
        
        if (result.success) {
          // Quitter la room Socket.IO
          await socket.leave(roomId);
          
          // Nettoyer les données
          this.connectedPlayers.delete(playerId);
          socket.data.playerId = undefined;
          socket.data.roomId = undefined;
          socket.data.isAuthenticated = false;

          // Notifier les autres joueurs
          this.broadcastToRoom(roomId, 'playerLeft', playerId, socket.data.playerName || 'Joueur');
          
          if (result.roomState) {
            this.broadcastToRoom(roomId, 'roomUpdated', result.roomState);
          }
        }

        callback(result);
      } catch (error) {
        callback({ 
          success: false, 
          message: error instanceof Error ? error.message : 'Erreur lors de la sortie' 
        });
      }
    });

    socket.on('startGame', async (roomId, callback) => {
      try {
        const playerId = socket.data.playerId;
        if (!playerId) {
          callback({ success: false, message: 'Joueur non authentifié' });
          return;
        }

        const startResult = this.roomManager.startGame(roomId, playerId);
        
        if (startResult.success) {
          // Initialiser le jeu
          const roomState = this.roomManager.getRoomState(roomId);
          if (roomState) {
            // Utiliser le roomId comme gameId pour simplifier
            const gameId = roomId;
            const gameState = this.gameEngine.initializeGame(gameId, roomId, roomState.players);
            
            console.log(`Jeu initialisé avec gameId: ${gameId}`);
            
            // Notifier tous les joueurs
            this.broadcastToRoom(roomId, 'gameStarted', gameState);
            this.broadcastToRoom(roomId, 'roomUpdated', roomState);
            
            // Traiter le premier tour si c'est une IA
            await this.processAITurnIfNeeded(gameState);
          }
        }

        callback(startResult);
      } catch (error) {
        callback({ 
          success: false, 
          message: error instanceof Error ? error.message : 'Erreur lors du démarrage' 
        });
      }
    });

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
          error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout de l\'IA' 
        });
      }
    });

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
          error: error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'IA' 
        });
      }
    });

    // Actions de jeu
    socket.on('playerAction', async (roomId, action, callback) => {
      try {
        const playerId = socket.data.playerId;
        if (!playerId) {
          callback({ success: false, message: 'Joueur non authentifié' });
          return;
        }

        // Traiter l'action via le moteur de jeu
        // Utiliser le roomId comme gameId
        const gameState = this.gameEngine.getCurrentGameState(roomId);
        if (!gameState) {
          console.log(`Partie non trouvée pour roomId: ${roomId}`);
          callback({ success: false, message: 'Partie non trouvée' });
          return;
        }

        console.log(`Action reçue de ${playerId} dans la partie ${roomId}:`, action.actionType);

        const result = this.gameEngine.processCardReveal(gameState.gameId, playerId, action);
        
        if (result.success && result.newGameState) {
          // Diffuser les mises à jour
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

          // Traiter le tour de l'IA si nécessaire
          await this.processAITurnIfNeeded(result.newGameState);
        }

        callback(result);
      } catch (error) {
        callback({ 
          success: false, 
          message: error instanceof Error ? error.message : 'Erreur lors de l\'action' 
        });
      }
    });

    // Chat
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
          callback({ success: false, error: 'Impossible d\'envoyer le message' });
        }
      } catch (error) {
        callback({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi' 
        });
      }
    });

    // Reconnexion
    socket.on('reconnect', async (roomId, playerId, token, callback) => {
      try {
        // Vérifier le token (implémentation simplifiée)
        const roomState = this.roomManager.getRoomState(roomId);
        if (!roomState) {
          callback({ success: false, error: 'Salle non trouvée' });
          return;
        }

        const player = roomState.players.find(p => p.id === playerId);
        if (!player) {
          callback({ success: false, error: 'Joueur non trouvé' });
          return;
        }

        // Réauthentifier le socket
        socket.data.playerId = playerId;
        socket.data.roomId = roomId;
        socket.data.playerName = player.name;
        socket.data.isAuthenticated = true;

        // Rejoindre la room
        await socket.join(roomId);
        
        // Mettre à jour le statut de connexion
        this.roomManager.updatePlayerConnectionStatus(playerId, ConnectionStatus.CONNECTED);
        this.connectedPlayers.set(playerId, socket);

        // Notifier la reconnexion
        this.broadcastToRoom(roomId, 'playerReconnected', playerId, player.name);

        callback({ success: true, roomState });
      } catch (error) {
        callback({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Erreur lors de la reconnexion' 
        });
      }
    });

    // Déconnexion
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  /**
   * Gère la déconnexion d'un socket
   */
  private handleDisconnection(socket: Socket): void {
    console.log(`Client déconnecté: ${socket.id}`);
    
    const playerId = socket.data.playerId;
    const roomId = socket.data.roomId;
    const playerName = socket.data.playerName;

    if (playerId && roomId) {
      // Mettre à jour le statut de connexion
      this.roomManager.updatePlayerConnectionStatus(playerId, ConnectionStatus.DISCONNECTED);
      this.connectedPlayers.delete(playerId);

      // Notifier la déconnexion
      this.broadcastToRoom(roomId, 'playerDisconnected', playerId, playerName || 'Joueur');

      // Programmer la suppression du joueur après un délai
      setTimeout(() => {
        const roomState = this.roomManager.getRoomState(roomId);
        if (roomState) {
          const player = roomState.players.find(p => p.id === playerId);
          if (player && player.connectionStatus === ConnectionStatus.DISCONNECTED) {
            // Le joueur ne s'est pas reconnecté, le retirer de la salle
            this.roomManager.leaveRoom(roomId, playerId);
            this.broadcastToRoom(roomId, 'playerLeft', playerId, playerName || 'Joueur');
          }
        }
      }, 30000); // 30 secondes
    }
  }

  /**
   * Diffuse un événement à tous les joueurs d'une salle
   */
  public broadcastToRoom<T extends keyof ServerToClientEvents>(
    roomId: UUID,
    event: T,
    ...args: Parameters<ServerToClientEvents[T]>
  ): void {
    this.io.to(roomId).emit(event, ...args);
  }

  /**
   * Envoie un événement à un joueur spécifique
   */
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

  /**
   * Traite le tour d'une IA si nécessaire
   */
  private async processAITurnIfNeeded(gameState: GameState): Promise<void> {
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
    
    console.log(`Vérification tour IA - Joueur actuel: ${currentPlayer?.name}, isAI: ${currentPlayer?.isAI}, gameStatus: ${gameState.gameStatus}`);
    
    if (currentPlayer?.isAI && gameState.gameStatus === 'ACTIVE') {
      console.log(`Tour IA détecté pour ${currentPlayer.name}`);
      try {
        // Obtenir les actions disponibles
        const availableActions = this.gameEngine.getValidActions(gameState.gameId, currentPlayer.id);
        console.log(`Actions disponibles pour l'IA: ${availableActions.length}`);
        
        if (availableActions.length > 0) {
          console.log(`L'IA ${currentPlayer.name} va prendre une décision...`);
          
          // Faire prendre une décision à l'IA
          const decision = await this.aiEngine.makeDecision(gameState, currentPlayer as any, {
            availableActions,
          });

          console.log(`Décision prise par l'IA: ${decision.action.actionType}`);

          // Délai pour simuler la réflexion basé sur la difficulté et la décision
          const thinkingTime = this.calculateAIThinkingTime(currentPlayer as any, decision);
          
          // Notifier que l'IA réfléchit
          (this as any).broadcastToRoom(gameState.roomId, 'aiThinking', {
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            thinkingTime: thinkingTime
          });

          // Attendre le temps de réflexion
          await new Promise(resolve => setTimeout(resolve, thinkingTime));

          // Exécuter l'action de l'IA
          const result = this.gameEngine.processCardReveal(gameState.gameId, currentPlayer.id, decision.action);
          
          console.log(`Résultat de l'action IA: ${result.success}`);
          
          if (result.success && result.newGameState) {
            // Diffuser les résultats de l'action IA
            (this as any).broadcastToRoom(gameState.roomId, 'aiAction', {
              playerId: currentPlayer.id,
              playerName: currentPlayer.name,
              action: decision.action,
              confidence: decision.confidence,
              reasoning: decision.reasoning
            });
            
            this.broadcastToRoom(gameState.roomId, 'gameStateUpdated', result.newGameState);
            
            if (result.revealedCard) {
              this.broadcastToRoom(gameState.roomId, 'cardRevealed', result.revealedCard, currentPlayer.id);
            }
            
            if (result.trioFormed) {
              this.broadcastToRoom(gameState.roomId, 'trioFormed', result.trioFormed, currentPlayer.id);
            }
            
            // Notifier l'échec de trio si le tour se termine sans trio
            if (result.newGameState.currentPlayerId !== currentPlayer.id && !result.trioFormed) {
              this.broadcastToRoom(gameState.roomId, 'trioFailed', currentPlayer.id);
            }
            
            if (result.victoryResult?.hasWon) {
              this.broadcastToRoom(gameState.roomId, 'gameEnded', result.victoryResult);
            } else {
              // Vérifier si le tour a changé
              if (result.newGameState.currentPlayerId !== currentPlayer.id) {
                this.broadcastToRoom(gameState.roomId, 'turnChanged', result.newGameState.currentPlayerId);
              }
              
              // Récursion pour traiter le prochain tour IA si nécessaire
              // (que ce soit le même joueur IA qui continue ou un autre joueur IA)
              await this.processAITurnIfNeeded(result.newGameState);
            }
          } else {
            console.error(`Échec de l'action IA: ${result.message}`);
          }
        } else {
          console.log(`Aucune action disponible pour l'IA ${currentPlayer.name}`);
        }
      } catch (error) {
        console.error('Erreur lors du traitement du tour IA:', error);
        // En cas d'erreur, passer au joueur suivant
        // Cette logique devrait être implémentée dans le GameEngine
      }
    } else {
      console.log(`Pas de tour IA nécessaire - currentPlayer: ${currentPlayer?.name}, isAI: ${currentPlayer?.isAI}, gameStatus: ${gameState.gameStatus}`);
    }
  }

  private calculateAIThinkingTime(aiPlayer: any, decision: any): number {
    const baseTimes: Record<string, { min: number; max: number }> = {
      EASY: { min: 800, max: 2000 },
      MEDIUM: { min: 1200, max: 3000 },
      HARD: { min: 1500, max: 4000 }
    };

    const difficulty = aiPlayer.aiDifficulty || 'MEDIUM';
    const timeRange = baseTimes[difficulty] || baseTimes.MEDIUM;
    
    // Temps de base selon la difficulté
    let thinkingTime = timeRange.min + Math.random() * (timeRange.max - timeRange.min);
    
    // Ajuster selon la confiance de la décision
    if (decision.confidence < 0.5) {
      thinkingTime *= 1.5; // Plus de temps si incertain
    } else if (decision.confidence > 0.8) {
      thinkingTime *= 0.7; // Moins de temps si très confiant
    }
    
    return Math.round(thinkingTime);
  }

  /**
   * Obtient les statistiques de connexion
   */
  public getConnectionStats(): {
    totalConnections: number;
    authenticatedPlayers: number;
    roomsWithPlayers: number;
  } {
    const totalConnections = this.io.sockets.sockets.size;
    const authenticatedPlayers = this.connectedPlayers.size;
    const roomsWithPlayers = new Set(
      Array.from(this.connectedPlayers.values())
        .map(socket => socket.data.roomId)
        .filter(Boolean)
    ).size;

    return {
      totalConnections,
      authenticatedPlayers,
      roomsWithPlayers,
    };
  }

  /**
   * Nettoie les connexions inactives
   */
  public cleanup(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 heure

    for (const [playerId, socket] of this.connectedPlayers.entries()) {
      if (socket.data.connectionTime && (now - socket.data.connectionTime) > maxAge) {
        socket.disconnect(true);
        this.connectedPlayers.delete(playerId);
      }
    }
  }
}