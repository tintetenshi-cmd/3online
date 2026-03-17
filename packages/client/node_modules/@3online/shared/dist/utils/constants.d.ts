/**
 * Constantes pour le jeu 3online
 */
export declare const GAME_CONSTANTS: {
    readonly TOTAL_CARDS: 36;
    readonly CARDS_PER_NUMBER: 3;
    readonly MIN_CARD_NUMBER: 1;
    readonly MAX_CARD_NUMBER: 12;
    readonly TRIO_SIZE: 3;
    readonly MIN_PLAYERS: 2;
    readonly MAX_PLAYERS: 6;
    readonly CARDS_PER_PLAYER: {
        readonly 2: 15;
        readonly 3: 9;
        readonly 4: 7;
        readonly 5: 6;
        readonly 6: 5;
    };
    readonly VICTORY_CONDITIONS: {
        readonly TRIO_SEVEN: 7;
        readonly THREE_TRIOS: 3;
        readonly LINKED_TRIOS: 2;
    };
    readonly DEFAULT_THINKING_TIME: {
        readonly EASY: 1000;
        readonly MEDIUM: 1500;
        readonly HARD: 2000;
    };
    readonly RECONNECTION_TIMEOUT: 30000;
    readonly ACTION_TIMEOUT: 300;
};
export declare const ERROR_MESSAGES: {
    readonly INVALID_CARD_NUMBER: "Le numéro de carte doit être entre 1 et 12";
    readonly INVALID_CARD_LOCATION: "Emplacement de carte invalide";
    readonly CARD_NOT_FOUND: "Carte non trouvée";
    readonly CARD_ALREADY_REVEALED: "Cette carte est déjà révélée";
    readonly INVALID_PLAYER_NAME: "Le nom du joueur doit être non-vide et unique";
    readonly PLAYER_NOT_FOUND: "Joueur non trouvé";
    readonly INVALID_HAND_SIZE: "Taille de main invalide pour ce nombre de joueurs";
    readonly DUPLICATE_PLAYER_NAME: "Ce nom de joueur est déjà utilisé";
    readonly ROOM_NOT_FOUND: "Salle non trouvée";
    readonly ROOM_FULL: "La salle est pleine";
    readonly INVALID_ROOM_CODE: "Code de salle invalide";
    readonly NOT_ROOM_HOST: "Seul l'hôte peut effectuer cette action";
    readonly GAME_ALREADY_STARTED: "La partie a déjà commencé";
    readonly NOT_ENOUGH_PLAYERS: "Pas assez de joueurs pour commencer";
    readonly INVALID_ACTION: "Action invalide";
    readonly NOT_PLAYER_TURN: "Ce n'est pas votre tour";
    readonly INVALID_TARGET: "Cible invalide pour cette action";
    readonly ACTION_NOT_ALLOWED: "Cette action n'est pas autorisée";
    readonly INVALID_GAME_STATE: "État de jeu invalide";
    readonly GAME_NOT_ACTIVE: "La partie n'est pas active";
    readonly INCONSISTENT_CARD_COUNT: "Nombre de cartes incohérent";
    readonly INVALID_TRIO: "Trio invalide - les cartes doivent avoir le même numéro";
    readonly INTERNAL_ERROR: "Erreur interne du serveur";
    readonly CONNECTION_ERROR: "Erreur de connexion";
    readonly TIMEOUT_ERROR: "Délai d'attente dépassé";
};
export declare const SUCCESS_MESSAGES: {
    readonly ROOM_CREATED: "Salle créée avec succès";
    readonly PLAYER_JOINED: "Joueur rejoint avec succès";
    readonly GAME_STARTED: "Partie démarrée";
    readonly TRIO_FORMED: "Trio formé !";
    readonly VICTORY: "Victoire !";
    readonly CARD_REVEALED: "Carte révélée";
};
export declare const AVATAR_CONFIG: {
    readonly GENERATED: {
        readonly name: "Généré";
        readonly icon: "🃏";
    };
    readonly AVATAR_1: {
        readonly name: "Disquette";
        readonly icon: "💾";
    };
    readonly AVATAR_2: {
        readonly name: "Alien";
        readonly icon: "👽";
    };
    readonly AVATAR_3: {
        readonly name: "Robot";
        readonly icon: "🤖";
    };
    readonly AVATAR_4: {
        readonly name: "Fantôme";
        readonly icon: "👻";
    };
    readonly AVATAR_5: {
        readonly name: "Étoile";
        readonly icon: "⭐";
    };
    readonly AVATAR_6: {
        readonly name: "Diamant";
        readonly icon: "💎";
    };
    readonly AVATAR_7: {
        readonly name: "Renard";
        readonly icon: "🦊";
    };
    readonly AVATAR_8: {
        readonly name: "Hibou";
        readonly icon: "🦉";
    };
    readonly AVATAR_9: {
        readonly name: "Poulpe";
        readonly icon: "🐙";
    };
    readonly AVATAR_10: {
        readonly name: "Planète";
        readonly icon: "🪐";
    };
    readonly AVATAR_11: {
        readonly name: "Cerveau";
        readonly icon: "🧠";
    };
    readonly AVATAR_12: {
        readonly name: "Puzzle";
        readonly icon: "🧩";
    };
};
