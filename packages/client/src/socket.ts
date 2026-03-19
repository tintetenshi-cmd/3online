import { io, Socket } from 'socket.io-client'

const SERVER_URL =
  (import.meta as any).env?.VITE_SERVER_URL ||
  ((import.meta as any).env?.PROD ? window.location.origin : 'http://localhost:3001')

// Instance unique — créée une seule fois, jamais recréée
export const socket: Socket = io(SERVER_URL, {
  transports: ['polling', 'websocket'],
  timeout: 20000,
  reconnectionAttempts: 3,
  reconnectionDelay: 3000,
  reconnectionDelayMax: 15000,
  autoConnect: false, // connexion manuelle
})
