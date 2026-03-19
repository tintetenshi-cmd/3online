import { io, Socket } from 'socket.io-client'

const SERVER_URL =
  (import.meta as any).env?.VITE_SERVER_URL ||
  ((import.meta as any).env?.PROD
    ? window.location.origin
    : 'http://localhost:3001')

const SOCKET_KEY = '__app_socket_singleton__'

if (!(window as any)[SOCKET_KEY]) {
  ;(window as any)[SOCKET_KEY] = io(SERVER_URL, {
    // websocket only → PAS de polling XHR → pas d'ERR_INSUFFICIENT_RESOURCES
    transports: ['websocket'],
    timeout: 30000,
    reconnectionAttempts: 5,
    reconnectionDelay: 5000,       // ← attend 5s entre chaque tentative
    reconnectionDelayMax: 30000,   // ← max 30s entre tentatives
    randomizationFactor: 0.5,
    autoConnect: false,
  })
}

export const socket: Socket = (window as any)[SOCKET_KEY]
