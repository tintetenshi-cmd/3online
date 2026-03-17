/**
 * Gestionnaire des salles de jeu pour 3online
 * Gère la création, jointure, et gestion des salles
 */
import { RoomStatus, AvatarType, ConnectionStatus, AI_DIFFICULTY_CONFIGS, } from '@3online/shared';
import { generateUUID, generateRoomCode, createPlayer, } from '@3online/shared';
import { validateRoomSettings, validateRoomInfo } from '@3online/shared';
export class RoomManager {
    rooms = new Map();
    roomCodes = new Map();
    playerRooms = new Map(); // playerId -> roomId
    // Noms de bots rigolos (100+) - évite les doublons dans une salle
    static BOT_NAMES = [
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
    // Couleurs/gradients de pseudo pour bots (compatibles client: linear-gradient(...) ou hex)
    static BOT_NAME_STYLES = [
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
    pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
    /**
     * Crée une nouvelle salle
     */
    createRoom(hostPlayer, settings) {
        // Valider les paramètres
        const settingsValidation = validateRoomSettings(settings);
        if (!settingsValidation.isValid) {
            throw new Error(`Paramètres invalides: ${settingsValidation.errors.join(', ')}`);
        }
        // Générer les identifiants
        const roomId = generateUUID();
        const roomCode = this.generateUniqueRoomCode();
        // Créer les informations de la salle
        const roomInfo = {
            id: roomId,
            code: roomCode,
            hostId: hostPlayer.id,
            settings,
            status: RoomStatus.WAITING,
            createdAt: Date.now(),
        };
        // Valider les informations de la salle
        const roomValidation = validateRoomInfo(roomInfo);
        if (!roomValidation.isValid) {
            throw new Error(`Salle invalide: ${roomValidation.errors.join(', ')}`);
        }
        // Marquer le joueur comme hôte
        const host = { ...hostPlayer, isHost: true };
        // Créer l'état de la salle
        const roomState = {
            info: roomInfo,
            players: [host],
            chatMessages: [],
        };
        // Sauvegarder la salle
        this.rooms.set(roomId, roomState);
        this.roomCodes.set(roomCode, roomId);
        this.playerRooms.set(hostPlayer.id, roomId);
        // Message de bienvenue
        this.addSystemMessage(roomId, `${hostPlayer.name} a créé la salle`);
        return roomInfo;
    }
    /**
     * Fait rejoindre un joueur à une salle
     */
    joinRoom(roomCode, player) {
        // Trouver la salle par son code
        const roomId = this.roomCodes.get(roomCode);
        if (!roomId) {
            return { success: false, message: 'Code de salle invalide' };
        }
        const roomState = this.rooms.get(roomId);
        if (!roomState) {
            return { success: false, message: 'Salle non trouvée' };
        }
        // Vérifier que la salle n'est pas pleine
        if (roomState.players.length >= roomState.info.settings.maxPlayers) {
            return { success: false, message: 'La salle est pleine' };
        }
        // Vérifier que le nom n'est pas déjà utilisé
        if (roomState.players.some(p => p.name === player.name)) {
            return { success: false, message: 'Ce nom est déjà utilisé dans cette salle' };
        }
        // Vérifier que le joueur n'est pas déjà dans une autre salle
        const existingRoomId = this.playerRooms.get(player.id);
        if (existingRoomId && existingRoomId !== roomId) {
            return { success: false, message: 'Vous êtes déjà dans une autre salle' };
        }
        // Vérifier que la partie n'a pas déjà commencé
        if (roomState.info.status === RoomStatus.IN_GAME) {
            return { success: false, message: 'La partie a déjà commencé' };
        }
        // Ajouter le joueur à la salle
        roomState.players.push(player);
        this.playerRooms.set(player.id, roomId);
        // Message d'annonce
        this.addSystemMessage(roomId, `${player.name} a rejoint la salle`);
        return {
            success: true,
            roomState,
            playerToken: this.generatePlayerToken(player.id, roomId),
            playerId: player.id,
        };
    }
    /**
     * Fait quitter un joueur d'une salle
     */
    leaveRoom(roomId, playerId) {
        const roomState = this.rooms.get(roomId);
        if (!roomState) {
            return { success: false, message: 'Salle non trouvée' };
        }
        const playerIndex = roomState.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            return { success: false, message: 'Joueur non trouvé dans cette salle' };
        }
        const player = roomState.players[playerIndex];
        const playerName = player.name;
        // Retirer le joueur de la salle
        roomState.players.splice(playerIndex, 1);
        this.playerRooms.delete(playerId);
        // Message d'annonce
        this.addSystemMessage(roomId, `${playerName} a quitté la salle`);
        // Si c'était l'hôte et qu'il reste des joueurs, transférer l'hôte
        if (player.isHost && roomState.players.length > 0) {
            const newHost = roomState.players[0];
            newHost.isHost = true;
            roomState.info.hostId = newHost.id;
            this.addSystemMessage(roomId, `${newHost.name} est maintenant l'hôte`);
        }
        // Si la salle est vide, la supprimer
        if (roomState.players.length === 0) {
            this.roomCodes.delete(roomState.info.code);
            this.rooms.delete(roomId);
            return { success: true, message: 'Salle supprimée' };
        }
        return { success: true, roomState };
    }
    /**
     * Démarre une partie dans une salle
     */
    startGame(roomId, hostId) {
        const roomState = this.rooms.get(roomId);
        if (!roomState) {
            return { success: false, message: 'Salle non trouvée' };
        }
        // Vérifier que c'est l'hôte qui demande
        if (roomState.info.hostId !== hostId) {
            return { success: false, message: 'Seul l\'hôte peut démarrer la partie' };
        }
        // Vérifier qu'il y a assez de joueurs
        if (roomState.players.length < 2) {
            return { success: false, message: 'Il faut au moins 2 joueurs pour commencer' };
        }
        // Vérifier que la partie n'a pas déjà commencé
        if (roomState.info.status === RoomStatus.IN_GAME) {
            return { success: false, message: 'La partie a déjà commencé' };
        }
        // Changer le statut de la salle
        roomState.info.status = RoomStatus.IN_GAME;
        // Message d'annonce
        this.addSystemMessage(roomId, 'La partie commence !');
        return { success: true };
    }
    /**
     * Ajoute un joueur IA à une salle
     */
    addAIPlayer(roomId, difficulty) {
        const roomState = this.rooms.get(roomId);
        if (!roomState) {
            throw new Error('Salle non trouvée');
        }
        if (roomState.players.length >= roomState.info.settings.maxPlayers) {
            throw new Error('La salle est pleine');
        }
        if (!roomState.info.settings.allowAI) {
            throw new Error('Les IA ne sont pas autorisées dans cette salle');
        }
        // Générer un nom unique pour l'IA
        const aiName = this.generateAIName(roomState.players);
        // Choisir un avatar disponible
        const availableAvatars = this.getAvailableAvatars(roomState.players);
        const aiAvatar = (availableAvatars.length > 0 ? this.pickRandom(availableAvatars) : AvatarType.AVATAR_3);
        // Couleur/gradient de pseudo aléatoire
        const aiNameColor = this.pickRandom(RoomManager.BOT_NAME_STYLES);
        // Créer le joueur IA avec sa stratégie
        const aiPlayer = {
            ...createPlayer(aiName, aiAvatar, true),
            aiDifficulty: difficulty,
            strategy: AI_DIFFICULTY_CONFIGS[difficulty],
            nameColor: aiNameColor,
        }; // Cast temporaire pour éviter les erreurs de type
        // Ajouter à la salle
        roomState.players.push(aiPlayer);
        this.playerRooms.set(aiPlayer.id, roomId);
        // Message d'annonce
        this.addSystemMessage(roomId, `${aiName} (IA ${difficulty}) a rejoint la salle`);
        return aiPlayer;
    }
    /**
     * Retire un joueur IA d'une salle
     */
    removeAIPlayer(roomId, playerId) {
        const roomState = this.rooms.get(roomId);
        if (!roomState) {
            return false;
        }
        const playerIndex = roomState.players.findIndex(p => p.id === playerId && p.isAI);
        if (playerIndex === -1) {
            return false;
        }
        const aiPlayer = roomState.players[playerIndex];
        roomState.players.splice(playerIndex, 1);
        this.playerRooms.delete(playerId);
        // Message d'annonce
        this.addSystemMessage(roomId, `${aiPlayer.name} (IA) a quitté la salle`);
        return true;
    }
    /**
     * Obtient l'état d'une salle
     */
    getRoomState(roomId) {
        return this.rooms.get(roomId) || null;
    }
    /**
     * Obtient l'état d'une salle par son code
     */
    getRoomStateByCode(roomCode) {
        const roomId = this.roomCodes.get(roomCode);
        return roomId ? this.getRoomState(roomId) : null;
    }
    /**
     * Ajoute un message de chat à une salle
     */
    addChatMessage(roomId, playerId, content) {
        const roomState = this.rooms.get(roomId);
        if (!roomState) {
            return null;
        }
        const player = roomState.players.find(p => p.id === playerId);
        if (!player) {
            return null;
        }
        const message = {
            id: generateUUID(),
            roomId,
            playerId,
            playerName: player.name,
            content: content.trim(),
            timestamp: Date.now(),
            isSystemMessage: false,
        };
        roomState.chatMessages.push(message);
        // Limiter l'historique des messages (garder les 100 derniers)
        if (roomState.chatMessages.length > 100) {
            roomState.chatMessages = roomState.chatMessages.slice(-100);
        }
        return message;
    }
    /**
     * Met à jour le statut de connexion d'un joueur
     */
    updatePlayerConnectionStatus(playerId, status) {
        const roomId = this.playerRooms.get(playerId);
        if (!roomId)
            return;
        const roomState = this.rooms.get(roomId);
        if (!roomState)
            return;
        const player = roomState.players.find(p => p.id === playerId);
        if (!player)
            return;
        const oldStatus = player.connectionStatus;
        player.connectionStatus = status;
        // Messages d'annonce pour les changements de statut
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
    /**
     * Obtient la salle d'un joueur
     */
    getPlayerRoom(playerId) {
        const roomId = this.playerRooms.get(playerId);
        return roomId ? this.getRoomState(roomId) : null;
    }
    /**
     * Génère un code de salle unique
     */
    generateUniqueRoomCode() {
        let code;
        do {
            code = generateRoomCode();
        } while (this.roomCodes.has(code));
        return code;
    }
    /**
     * Génère un nom unique pour une IA
     */
    generateAIName(existingPlayers) {
        const used = new Set(existingPlayers.map(p => p.name));
        const pool = RoomManager.BOT_NAMES.filter(n => !used.has(n));
        if (pool.length > 0)
            return this.pickRandom(pool);
        // Fallback si (très improbable) tous pris
        let counter = 1;
        let name;
        do {
            name = `Bot-${counter}`;
            counter++;
        } while (used.has(name));
        return name;
    }
    /**
     * Obtient les avatars disponibles
     */
    getAvailableAvatars(existingPlayers) {
        const usedAvatars = new Set(existingPlayers.map(p => p.avatar));
        return Object.values(AvatarType).filter(avatar => !usedAvatars.has(avatar));
    }
    /**
     * Ajoute un message système à une salle
     */
    addSystemMessage(roomId, content) {
        const roomState = this.rooms.get(roomId);
        if (!roomState)
            return;
        const message = {
            id: generateUUID(),
            roomId,
            content,
            timestamp: Date.now(),
            isSystemMessage: true,
        };
        roomState.chatMessages.push(message);
    }
    /**
     * Génère un token pour un joueur dans une salle
     */
    generatePlayerToken(playerId, roomId) {
        // Simple token basé sur les IDs et timestamp
        // En production, utiliser une méthode plus sécurisée
        const data = `${playerId}:${roomId}:${Date.now()}`;
        return Buffer.from(data).toString('base64');
    }
    /**
     * Nettoie les salles vides ou inactives
     */
    cleanup() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 heures
        for (const [roomId, roomState] of this.rooms.entries()) {
            // Supprimer les salles vides ou très anciennes
            if (roomState.players.length === 0 || (now - roomState.info.createdAt) > maxAge) {
                this.roomCodes.delete(roomState.info.code);
                this.rooms.delete(roomId);
                // Nettoyer les références des joueurs
                for (const player of roomState.players) {
                    this.playerRooms.delete(player.id);
                }
            }
        }
    }
    /**
     * Obtient les statistiques des salles
     */
    getStats() {
        const totalRooms = this.rooms.size;
        const activeRooms = Array.from(this.rooms.values()).filter(room => room.info.status === RoomStatus.IN_GAME).length;
        const totalPlayers = Array.from(this.rooms.values()).reduce((sum, room) => sum + room.players.length, 0);
        const averagePlayersPerRoom = totalRooms > 0 ? totalPlayers / totalRooms : 0;
        return {
            totalRooms,
            activeRooms,
            totalPlayers,
            averagePlayersPerRoom: Math.round(averagePlayersPerRoom * 100) / 100,
        };
    }
}
