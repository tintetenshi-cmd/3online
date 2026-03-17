// Événements WebSocket pour la communication client-serveur

// Événements de connexion et authentification
export const CONNECTION_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  SET_PLAYER_INFO: 'set_player_info',
  PLAYER_AUTHENTICATED: 'player_authenticated',
  ERROR: 'error'
} as const;

// Événements de gestion des salles
export const ROOM_EVENTS = {
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  ROOM_LEFT: 'room_left',
  ROOM_UPDATED: 'room_updated',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  ADD_AI_PLAYER: 'add_ai_player',
  REMOVE_AI_PLAYER: 'remove_ai_player'
} as const;

// Événements de jeu
export const GAME_EVENTS = {
  START_GAME: 'start_game',
  GAME_STARTED: 'game_started',
  GAME_STATE_UPDATE: 'game_state_update',
  REVEAL_CARD: 'reveal_card',
  CARD_REVEALED: 'card_revealed',
  TRIO_FORMED: 'trio_formed',
  TURN_ENDED: 'turn_ended',
  GAME_ENDED: 'game_ended',
  VICTORY: 'victory',
  INVALID_ACTION: 'invalid_action'
} as const;

// Événements de chat
export const CHAT_EVENTS = {
  SEND_MESSAGE: 'send_message',
  MESSAGE_RECEIVED: 'message_received',
  SYSTEM_MESSAGE: 'system_message'
} as const;

// Union de tous les événements
export const ALL_EVENTS = {
  ...CONNECTION_EVENTS,
  ...ROOM_EVENTS,
  ...GAME_EVENTS,
  ...CHAT_EVENTS
} as const;

// Types pour TypeScript
export type ConnectionEvent = typeof CONNECTION_EVENTS[keyof typeof CONNECTION_EVENTS];
export type RoomEvent = typeof ROOM_EVENTS[keyof typeof ROOM_EVENTS];
export type GameEvent = typeof GAME_EVENTS[keyof typeof GAME_EVENTS];
export type ChatEvent = typeof CHAT_EVENTS[keyof typeof CHAT_EVENTS];
export type SocketEvent = typeof ALL_EVENTS[keyof typeof ALL_EVENTS];