import { io, Socket } from 'socket.io-client'

const SERVER_URL =
  (import.meta as any).env?.VITE_SERVER_URL ||
  ((import.meta as any).env?.PROD
    ? window.location.origin
    : 'http://localhost:3001')

// Clé globale → survit aux HMR, StrictMode, re-imports
const SOCKET_KEY = '__app_socket_singleton__'

if (!(window as any)[SOCKET_KEY]) {
  ;(window as any)[SOCKET_KEY] = io(SERVER_URL, {
    transports: ['polling', 'websocket'],
    timeout: 20000,
    reconnectionAttempts: 3,
    reconnectionDelay: 3000,
    reconnectionDelayMax: 15000,
    autoConnect: false,
  })
}

export const socket: Socket = (window as any)[SOCKET_KEY]
