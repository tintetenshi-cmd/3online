import { io } from 'socket.io-client'

const SERVER_URL = (import.meta as any).env?.VITE_SERVER_URL
  ?? ((import.meta as any).env?.PROD
    ? window.location.origin
    : 'http://localhost:3001')

// Module ES singleton — évalué UNE SEULE FOIS par Vite
// Pas besoin de window[key], le module lui-même est le singleton
export const socket = io(SERVER_URL, {
  transports: ['websocket'],
  timeout: 30000,
  reconnectionAttempts: 5,
  reconnectionDelay: 5000,
  reconnectionDelayMax: 30000,
  randomizationFactor: 0.5,
  autoConnect: false,
})
