/**
 * Gestionnaire des salles de jeu pour 3online
 */

// Types uniquement depuis @3online/shared
import {
  UUID, Player, RoomInfo, RoomState, RoomSettings, RoomStatus,
  JoinResult, LeaveResult, StartResult, ChatMessage, GameMode,
  AvatarType, ConnectionStatus, AI_DIFFICULTY_CONFIGS, AIStrategy, AIDifficulty,
} from '@3online/shared';

// Utils depuis sharedUtils
import {
  generateUUID, generateRoomCode, createPlayer,
  validateRoomSettings, validateRoomInfo,
} from '../utils/sharedUtils.js';

export class RoomManager {
  private rooms: Map<UUID, RoomState> = new Map();
  private roomCodes: Map<string, UUID> = new Map();
  private playerRooms: Map<UUID, UUID> = new Map();

  private static readonly BOT_NAMES: string[] = [
    'Clippy.exe', 'Excelorciste', 'BugBiscotte', 'Caféine404', 'PixelPoulpe', 'SaucisseQuantique',
    'MarmotteBinaire', 'CrayonFurtif', 'GrenouillePDF', 'ChaussetteSQL', 'PapierTigre', 'LaserBaguette',
    'TromboneNinja', 'CookieKarma', 'PoussinRegex', 'BananeTLS', 'SablierCosmique', 'LutinCache',
    'PingouinNoScope', 'BeurreCrypté', 'ChouFleurAPI', 'PandaParfait', 'TracteurUDP', 'KebabKernel',
    'CactusCompile', 'RavioliRouter', 'DodoDocker', 'MoucheMiddleware', 'MoineauMongo', 'BiscuitBit',
    'ChatGPTuile', 'CarotteCSS', 'CyborgBoulon', 'GaufreGiga', 'MétéoreMemo', 'PlumeProxy',
    'SphinxSocket', 'TortueThread', 'LamaLambda', 'RatonRuntime', 'SardineServer', 'OrageORM',
    'TetrisToken', 'VortexVite', 'MoustacheMutex', 'BulleBackend', 'FéeFrontend', 'PingPongPacket',
    'NébuleuseNPM', 'BaguetteBabel', 'QuicheQueue', 'BureauByte', 'GlitchGourmand', 'ChimèreCache',
    'ChocoChecksum', 'ZèbreZeroDay', 'WaffleWebSocket', 'HibouHMR', 'SushiSession', 'CrêpeCrypto',
    'FloconFirewall', 'BisonBitrate', 'KoalaKubernetes', 'PigeonPayload', 'SorbetSocket', 'NimbusNode',
    'TapiocaType', 'RizReactif', 'MangoMiddleware', 'PoulardeProtocol', 'GnomeGit', 'MielMerge',
    'OctetOignon', 'GobelinsGraph', 'RêveurRoute', 'BricoleurBuild', 'SpriteStack', 'NounoursNginx',
    'CoccinelleCI', 'PoupéeProxy', 'MarmeladeMap', 'CobaltCallback', 'BriqueBrowser', 'CapybaraCache',
    'MédusaModule', 'SilexSyntax', 'DinoDiff', 'RêneRequest', 'TruffeTLS', 'PistachePatch',
    'KiwixKey', 'RumbaRouter', 'BourdonBundle', 'GrimoireGraphQL', 'SalsaSocket', 'RacletteReact',
    'PoneyPacket', 'GlaçonGzip', 'NoisetteNAT', 'ChimieChunk', 'BouleBash', 'ChouetteChangelog',
  ];

  private static readonly BOT_NAME_STYLES: string[] = [
    '#E9D5FF', '#C4B5FD', '#93C5FD', '#DBEAFE', '#FBCFE8', '#FDE68A', '#A7F3D0', '#FFFFFF',
    'linear-gradient(90deg, #C4B5FD, #93C5FD)',
    'linear-gradient(90deg, #E9D5FF, #DBEAFE)',
    'linear-gradient(90deg, #FBCFE8, #E9D5FF)',
    'linear-gradient(90deg, #A7F3D0, #DBEAFE)',
    'linear-gradient(90deg, #FDE68A, #FBCFE8)',
    'linear-gradient(90deg, #C4B5FD, #FBCFE8)',
    'linear-gradient(90deg, #93C5FD, #A7F3D0)',
    'linear-gradient(90deg, #DBEAFE, #C4B5FD)',
    'linear-gradient(90deg, #FBCFE8, #93C5FD)',
    'linear-gradient(90deg, #E9D5FF, #A7F3D0)',
    'linear-gradient(90deg, #A78BFA, #C4B5FD)',
    'linear-gradient(90deg, #818CF8, #93C5FD)',
  ];

  private pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  public createRoom(hostPlayer: Player, settings: RoomSettings): RoomInfo {
    const settingsValidation = validateRoomSettings(settings);
    if (!settingsValidation.isValid) {
      throw new Error(`Paramètres invalides: ${settingsValidation.errors.join(', ')}`);
    }

    const roomId = generateUUID();
    const roomCode = this.generateUniqueRoomCode();

    const roomInfo: RoomInfo = {
      id: roomId,
      code: roomCode,
      hostId: hostPlayer.id,
      settings,
      status: RoomStatus.WAITING,
      createdAt: Date.now(),
    };

    const roomValidation = validateRoomInfo(roomInfo);
    if (!roomValidation.isValid) {
      throw new Error(`Salle invalide: ${roomValidation.errors.join(', ')}`);
    }

    const host: Player = { ...hostPlayer, isHost: true };

    const roomState: RoomState = {
      info: roomInfo,
      players: [host],
      chatMessages: [],
    };

    this.rooms.set(roomId, roomState);
    this.roomCodes.set(roomCode, roomId);
    this.playerRooms.set(hostPlayer.id, roomId);

    this.addSystemMessage(roomId, `${hostPlayer.name} a créé la salle`);

    return roomInfo;
  }

  public joinRoom(roomCode: string, player: Player): JoinResult {
    const roomId = this.roomCodes.get(roomCode);
    if (!roomId) {
      return { success: false, message: 'Code de salle invalide' };
    }

    const roomState = this.rooms.get(roomId);
    if (!roomState) {
      return { success: false, message: 'Salle non trouvée' };
    }

    if (roomState.players.length >= roomState.info.settings.maxPlayers) {
      return { success: false, message: 'La salle est pleine' };
    }

    if (roomState.players.some((p: Player) => p.name === player.name)) {
      return { success: false, message: 'Ce nom est déjà utilisé dans cette salle' };
    }

    const existingRoomId = this.playerRooms.get(player.id);
    if (existingRoomId && existingRoomId !== roomId) {
      return { success: false, message: 'Vous êtes déjà dans une autre salle' };
    }

    if (roomState.info.status === RoomStatus.IN_GAME) {
      return { success: false, message: 'La partie a déjà commencé' };
    }

    roomState.players.push(player);
    this.playerRooms.set(player.id, roomId);

    this.addSystemMessage(roomId, `${player.name} a rejoint la salle`);

    return {
      success: true,
      roomState,
      playerToken: this.generatePlayerToken(player.id, roomId),
    };
  }

  public leaveRoom(roomId: UUID, playerId: UUID): LeaveResult {
    const roomState = this.rooms.get(roomId);
    if (!roomState) {
      return { success: false, message: 'Salle non trouvée' };
    }

    const playerIndex = roomState.players.findIndex((p: Player) => p.id === playerId);
    if (playerIndex === -1) {
      return { success: false, message: 'Joueur non trouvé dans cette salle' };
    }

    const player = roomState.players[playerIndex];
    const playerName = player.name;

    roomState.players.splice(playerIndex, 1);
    this.playerRooms.delete(playerId);

    this.addSystemMessage(roomId, `${playerName} a quitté la salle`);

    if (player.isHost && roomState.players.length > 0) {
      const newHost = roomState.players[0];
      newHost.isHost = true;
      roomState.info.hostId = newHost.id;
      this.addSystemMessage(roomId, `${newHost.name} est maintenant l'hôte`);
    }

    if (roomState.players.length === 0) {
      this.roomCodes.delete(roomState.info.code);
      this.rooms.delete(roomId);
      return { success: true, message: 'Salle supprimée' };
    }

    return { success: true, roomState };
  }

  public startGame(roomId: UUID, hostId: UUID): StartResult {
    const roomState = this.rooms.get(roomId);
    if (!roomState) {
      return { success: false, message: 'Salle non trouvée' };
    }

    if (roomState.info.hostId !== hostId) {
      return { success: false, message: "Seul l'hôte peut démarrer la partie" };
    }

    if (roomState.players.length < 2) {
      return { success: false, message: 'Il faut au moins 2 joueurs pour commencer' };
    }

    if (roomState.info.status === RoomStatus.IN_GAME) {
      return { success: false, message: 'La partie a déjà commencé' };
    }

    roomState.info.status = RoomStatus.IN_GAME;
    this.addSystemMessage(roomId, 'La partie commence !');

    return { success: true };
  }

  public addAIPlayer(roomId: UUID, difficulty: AIDifficulty): Player {
    const roomState = this.rooms.get(roomId);
    if (!roomState) throw new Error('Salle non trouvée');
    if (roomState.players.length >= roomState.info.settings.maxPlayers) throw new Error('La salle est pleine');
    if (!roomState.info.settings.allowAI) throw new Error('Les IA ne sont pas autorisées dans cette salle');

    const aiName = this.generateAIName(roomState.players);
    const availableAvatars = this.getAvailableAvatars(roomState.players);
    const aiAvatar = availableAvatars.length > 0
      ? this.pickRandom(availableAvatars)
      : AvatarType.AVATAR_3;
    const aiNameColor = this.pickRandom(RoomManager.BOT_NAME_STYLES);

    // createPlayer(name, avatar, isAI) — signature de shared/helpers.ts
    const base = createPlayer(aiName, aiAvatar, true);

    const aiPlayer: Player = {
      ...base,
      nameColor: aiNameColor,
      aiDifficulty: difficulty,
    };

    roomState.players.push(aiPlayer);
    this.playerRooms.set(aiPlayer.id, roomId);

    this.addSystemMessage(roomId, `${aiName} (IA ${difficulty}) a rejoint la salle`);

    return aiPlayer;
  }

  public removeAIPlayer(roomId: UUID, playerId: UUID): boolean {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return false;

    const playerIndex = roomState.players.findIndex(
      (p: Player) => p.id === playerId && p.isAI
    );
    if (playerIndex === -1) return false;

    const aiPlayer = roomState.players[playerIndex];
    roomState.players.splice(playerIndex, 1);
    this.playerRooms.delete(playerId);

    this.addSystemMessage(roomId, `${aiPlayer.name} (IA) a quitté la salle`);

    return true;
  }

  public getRoomState(roomId: UUID): RoomState | null {
    return this.rooms.get(roomId) ?? null;
  }

  public getRoomStateByCode(roomCode: string): RoomState | null {
    const roomId = this.roomCodes.get(roomCode);
    return roomId ? this.getRoomState(roomId) : null;
  }

  public addChatMessage(roomId: UUID, playerId: UUID, content: string): ChatMessage | null {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return null;

    const player = roomState.players.find((p: Player) => p.id === playerId);
    if (!player) return null;

    const message: ChatMessage = {
      id: generateUUID(),
      roomId,
      playerId,
      playerName: player.name,
      content: content.trim(),
      timestamp: Date.now(),
      isSystemMessage: false,
    };

    roomState.chatMessages.push(message);

    if (roomState.chatMessages.length > 100) {
      roomState.chatMessages = roomState.chatMessages.slice(-100);
    }

    return message;
  }

  public updatePlayerConnectionStatus(playerId: UUID, status: ConnectionStatus): void {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;

    const roomState = this.rooms.get(roomId);
    if (!roomState) return;

    const player = roomState.players.find((p: Player) => p.id === playerId);
    if (!player) return;

    const oldStatus = player.connectionStatus;
    player.connectionStatus = status;

    if (oldStatus !== status) {
      switch (status) {
        case ConnectionStatus.CONNECTED:
          if (oldStatus === ConnectionStatus.DISCONNECTED) {
            this.addSystemMessage(roomId, `${player.name} s'est reconnecté`);
          }
          break;
        case ConnectionStatus.DISCONNECTED:
          this.addSystemMessage(roomId, `${player.name} s'est déconnecté`);
          break;
        case ConnectionStatus.RECONNECTING:
          this.addSystemMessage(roomId, `${player.name} tente de se reconnecter...`);
          break;
      }
    }
  }

  public getPlayerRoom(playerId: UUID): RoomState | null {
    const roomId = this.playerRooms.get(playerId);
    return roomId ? this.getRoomState(roomId) : null;
  }

  private generateUniqueRoomCode(): string {
    let code: string;
    do {
      code = generateRoomCode();
    } while (this.roomCodes.has(code));
    return code;
  }

  private generateAIName(existingPlayers: Player[]): string {
    const used = new Set(existingPlayers.map((p: Player) => p.name));
    const pool = RoomManager.BOT_NAMES.filter((n) => !used.has(n));
    if (pool.length > 0) return this.pickRandom(pool);

    let counter = 1;
    let name: string;
    do { name = `Bot-${counter++}`; } while (used.has(name));
    return name;
  }

  private getAvailableAvatars(existingPlayers: Player[]): AvatarType[] {
    const usedAvatars = new Set(existingPlayers.map((p: Player) => p.avatar));
    return Object.values(AvatarType).filter((avatar) => !usedAvatars.has(avatar));
  }

  private addSystemMessage(roomId: UUID, content: string): void {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return;

    const message: ChatMessage = {
      id: generateUUID(),
      roomId,
      content,
      timestamp: Date.now(),
      isSystemMessage: true,
    };

    roomState.chatMessages.push(message);
  }

  private generatePlayerToken(playerId: UUID, roomId: UUID): string {
    return Buffer.from(`${playerId}:${roomId}:${Date.now()}`).toString('base64');
  }

  public cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000;

    for (const [roomId, roomState] of this.rooms.entries()) {
      if (roomState.players.length === 0 || now - roomState.info.createdAt > maxAge) {
        this.roomCodes.delete(roomState.info.code);
        for (const player of roomState.players) {
          this.playerRooms.delete(player.id);
        }
        this.rooms.delete(roomId);
      }
    }
  }

  public getStats(): {
    totalRooms: number;
    activeRooms: number;
    totalPlayers: number;
    averagePlayersPerRoom: number;
  } {
    const totalRooms = this.rooms.size;
    const activeRooms = Array.from(this.rooms.values()).filter(
      (room) => room.info.status === RoomStatus.IN_GAME
    ).length;
    const totalPlayers = Array.from(this.rooms.values()).reduce(
      (sum, room) => sum + room.players.length,
      0
    );

    return {
      totalRooms,
      activeRooms,
      totalPlayers,
      averagePlayersPerRoom: totalRooms > 0
        ? Math.round((totalPlayers / totalRooms) * 100) / 100
        : 0,
    };
  }
}
