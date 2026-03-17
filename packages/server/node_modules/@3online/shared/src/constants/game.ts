// Constantes du jeu Trio
export const GAME_CONSTANTS = {
  // Nombre total de cartes dans le jeu
  TOTAL_CARDS: 36,
  
  // Nombre d'exemplaires par numéro (1-12)
  CARDS_PER_NUMBER: 3,
  
  // Plage des numéros de cartes
  MIN_CARD_NUMBER: 1,
  MAX_CARD_NUMBER: 12,
  
  // Nombre de cartes pour former un trio
  TRIO_SIZE: 3,
  
  // Conditions de victoire
  VICTORY_CONDITIONS: {
    THREE_TRIOS: 3,
    LINKED_TRIOS: 2,
    TRIO_SEVEN: 7
  },
  
  // Distribution des cartes selon le nombre de joueurs
  CARDS_PER_PLAYER: {
    2: 15, // Mode spécial 2 joueurs
    3: 9,
    4: 7,
    5: 6,
    6: 5
  } as const,
  
  // Limites de joueurs
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,
  
  // Délais et timeouts
  TIMEOUTS: {
    TURN_TIMEOUT: 60000, // 1 minute par tour
    RECONNECTION_GRACE: 30000, // 30 secondes pour se reconnecter
    AI_THINKING_MIN: 1000, // Délai minimum IA (1 seconde)
    AI_THINKING_MAX: 3000, // Délai maximum IA (3 secondes)
  },
  
  // Temps de réflexion par difficulté IA
  DEFAULT_THINKING_TIME: {
    EASY: 1500,
    MEDIUM: 2000,
    HARD: 2500,
  } as const,
} as const;

// Types dérivés des constantes
export type PlayerCount = keyof typeof GAME_CONSTANTS.CARDS_PER_PLAYER;
export type CardNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;