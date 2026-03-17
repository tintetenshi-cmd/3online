/**
 * Constantes pour le jeu 3online
 */
// Constantes de jeu
export const GAME_CONSTANTS = {
    // Cartes
    TOTAL_CARDS: 36,
    CARDS_PER_NUMBER: 3,
    MIN_CARD_NUMBER: 1,
    MAX_CARD_NUMBER: 12,
    TRIO_SIZE: 3,
    // Joueurs
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 6,
    // Distribution des cartes selon le nombre de joueurs
    CARDS_PER_PLAYER: {
        2: 15, // Mode spécial 2 joueurs
        3: 9,
        4: 7,
        5: 6,
        6: 5,
    },
    // Conditions de victoire
    VICTORY_CONDITIONS: {
        TRIO_SEVEN: 7,
        THREE_TRIOS: 3,
        LINKED_TRIOS: 2,
    },
    // Temps
    DEFAULT_THINKING_TIME: {
        EASY: 1000, // 1 seconde
        MEDIUM: 1500, // 1.5 secondes
        HARD: 2000, // 2 secondes
    },
    RECONNECTION_TIMEOUT: 30000, // 30 secondes
    ACTION_TIMEOUT: 300, // 300ms pour les actions
};
// Messages d'erreur
export const ERROR_MESSAGES = {
    // Validation des cartes
    INVALID_CARD_NUMBER: 'Le numéro de carte doit être entre 1 et 12',
    INVALID_CARD_LOCATION: 'Emplacement de carte invalide',
    CARD_NOT_FOUND: 'Carte non trouvée',
    CARD_ALREADY_REVEALED: 'Cette carte est déjà révélée',
    // Validation des joueurs
    INVALID_PLAYER_NAME: 'Le nom du joueur doit être non-vide et unique',
    PLAYER_NOT_FOUND: 'Joueur non trouvé',
    INVALID_HAND_SIZE: 'Taille de main invalide pour ce nombre de joueurs',
    DUPLICATE_PLAYER_NAME: 'Ce nom de joueur est déjà utilisé',
    // Validation des salles
    ROOM_NOT_FOUND: 'Salle non trouvée',
    ROOM_FULL: 'La salle est pleine',
    INVALID_ROOM_CODE: 'Code de salle invalide',
    NOT_ROOM_HOST: 'Seul l\'hôte peut effectuer cette action',
    GAME_ALREADY_STARTED: 'La partie a déjà commencé',
    NOT_ENOUGH_PLAYERS: 'Pas assez de joueurs pour commencer',
    // Validation des actions
    INVALID_ACTION: 'Action invalide',
    NOT_PLAYER_TURN: 'Ce n\'est pas votre tour',
    INVALID_TARGET: 'Cible invalide pour cette action',
    ACTION_NOT_ALLOWED: 'Cette action n\'est pas autorisée',
    // Validation de l'état de jeu
    INVALID_GAME_STATE: 'État de jeu invalide',
    GAME_NOT_ACTIVE: 'La partie n\'est pas active',
    INCONSISTENT_CARD_COUNT: 'Nombre de cartes incohérent',
    INVALID_TRIO: 'Trio invalide - les cartes doivent avoir le même numéro',
    // Erreurs système
    INTERNAL_ERROR: 'Erreur interne du serveur',
    CONNECTION_ERROR: 'Erreur de connexion',
    TIMEOUT_ERROR: 'Délai d\'attente dépassé',
};
// Messages de succès
export const SUCCESS_MESSAGES = {
    ROOM_CREATED: 'Salle créée avec succès',
    PLAYER_JOINED: 'Joueur rejoint avec succès',
    GAME_STARTED: 'Partie démarrée',
    TRIO_FORMED: 'Trio formé !',
    VICTORY: 'Victoire !',
    CARD_REVEALED: 'Carte révélée',
};
// Configuration des avatars
export const AVATAR_CONFIG = {
    GENERATED: { name: 'Généré', icon: '🃏' },
    AVATAR_1: { name: 'Disquette', icon: '💾' },
    AVATAR_2: { name: 'Alien', icon: '👽' },
    AVATAR_3: { name: 'Robot', icon: '🤖' },
    AVATAR_4: { name: 'Fantôme', icon: '👻' },
    AVATAR_5: { name: 'Étoile', icon: '⭐' },
    AVATAR_6: { name: 'Diamant', icon: '💎' },
    AVATAR_7: { name: 'Renard', icon: '🦊' },
    AVATAR_8: { name: 'Hibou', icon: '🦉' },
    AVATAR_9: { name: 'Poulpe', icon: '🐙' },
    AVATAR_10: { name: 'Planète', icon: '🪐' },
    AVATAR_11: { name: 'Cerveau', icon: '🧠' },
    AVATAR_12: { name: 'Puzzle', icon: '🧩' },
};
