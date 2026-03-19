import { ReactNode, useState, createContext, useContext, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface PlayerInfo {
  name: string
  avatar: string
  avatarSeed?: string
  nameColor: string
}

interface GameContextType {
  playerInfo: PlayerInfo | null
  currentView: 'menu' | 'lobby' | 'game' | 'rules'
  isLoading: boolean
  error: string | null
  setPlayerInfo: (info: PlayerInfo) => void
  setCurrentView: (view: 'menu' | 'lobby' | 'game' | 'rules') => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  state: {
    playerInfo: PlayerInfo | null
    currentView: 'menu' | 'lobby' | 'game' | 'rules'
    isLoading: boolean
    error: string | null
    isConnected: boolean
    playerId: string | null
    roomState: any
    gameState: any
    chatMessages: any[]
    isInGame: boolean
  }
  connectSocket: () => void
  createRoom: (settings?: any) => Promise<void>
  joinRoom: (roomCode: string) => Promise<void>
  leaveRoom: () => Promise<void>
  startGame: () => Promise<void>
  sendChatMessage: (message: string) => Promise<void>
  addAIPlayer: (difficulty: string) => Promise<void>
  removeAIPlayer: (playerId: string) => Promise<void>
  sendGameAction: (action: any) => Promise<void>
}

const GameContext = createContext<GameContextType | null>(null)

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame must be used within a GameProvider')
  return context
}

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const getStoredPlayerInfo = (): PlayerInfo | null => {
    try {
      const stored = localStorage.getItem('3online-player')
      if (!stored) return null
      const parsed = JSON.parse(stored)
      return {
        name: parsed.name,
        avatar: parsed.avatar,
        avatarSeed: parsed.avatarSeed,
        nameColor: parsed.nameColor || '#E9D5FF',
      }
    } catch {
      return null
    }
  }

  const [playerInfo, setPlayerInfoState] = useState<PlayerInfo | null>(getStoredPlayerInfo())
  const [currentView, setCurrentViewState] = useState<'menu' | 'lobby' | 'game' | 'rules'>('menu')
  const [isLoading, setIsLoadingState] = useState(false)
  const [error, setErrorState] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [roomState, setRoomState] = useState<any>(null)
  const [gameState, setGameState] = useState<any>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)

  // ← Empêche les doubles connexions (React StrictMode monte 2x)
  const isConnecting = useRef(false)
  const socketRef = useRef<Socket | null>(null)

  const setPlayerInfo = (info: PlayerInfo) => {
    setPlayerInfoState(info)
    localStorage.setItem('3online-player', JSON.stringify(info))
  }
  const setCurrentView = (view: 'menu' | 'lobby' | 'game' | 'rules') => setCurrentViewState(view)
  const setLoading = (loading: boolean) => setIsLoadingState(loading)
  const setError = (error: string | null) => setErrorState(error)

  const connectSocket = () => {
    // Bloquer si déjà en cours de connexion ou déjà connecté
    if (isConnecting.current) return
    if (socketRef.current?.connected) {
      setIsConnected(true)
      return
    }

    isConnecting.current = true
    console.log('Connexion au serveur WebSocket...')

    const serverUrl =
      (import.meta as any).env?.VITE_SERVER_URL ||
      ((import.meta as any).env?.PROD ? window.location.origin : 'http://localhost:3001')

    // Nettoyer l'ancien socket si existant
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    const newSocket = io(serverUrl, {
      transports: ['polling', 'websocket'], // polling en premier sur Render
      timeout: 20000,
      reconnectionAttempts: 3,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 15000,
    })

    socketRef.current = newSocket

    newSocket.on('connect', () => {
      console.log('Connecté au serveur !')
      setIsConnected(true)
      setError(null)
      isConnecting.current = false
    })

    newSocket.on('disconnect', () => {
      console.log('Déconnecté du serveur')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (err) => {
      console.error('Erreur WebSocket:', err.message)
      setError('Erreur de connexion au serveur')
      setIsConnected(false)
      isConnecting.current = false
    })

    newSocket.on('reconnect_failed', () => {
      console.error('Échec reconnexion après 3 tentatives')
      setError('Serveur inaccessible. Rechargez la page.')
      newSocket.disconnect()
      isConnecting.current = false
    })

    newSocket.on('roomUpdated', (rs) => setRoomState(rs))

    newSocket.on('playerJoined', (player) => {
      console.log('Joueur rejoint:', player.name)
    })

    newSocket.on('playerLeft', (_pid, playerName) => {
      console.log('Joueur parti:', playerName)
    })

    newSocket.on('gameStarted', (gs) => {
      console.log('Partie démarrée !', gs)
      setGameState(gs)
      setCurrentView('game')
    })

    newSocket.on('chatMessage', (chatMessage) => {
      setRoomState((prev: any) => {
        if (!prev) return prev
        return { ...prev, chatMessages: [...prev.chatMessages, chatMessage] }
      })
    })

    newSocket.on('aiPlayerAdded', (aiPlayer) => {
      console.log('IA ajoutée:', aiPlayer.name)
    })

    newSocket.on('aiPlayerRemoved', (_pid) => {
      console.log('IA supprimée')
    })

    newSocket.on('aiThinking', (data) => {
      console.log(`${data.playerName} réfléchit...`)
    })

    newSocket.on('aiAction', (data) => {
      console.log(`${data.playerName} a joué:`, data.action)
    })

    newSocket.on('gameStateUpdated', (newGs) => {
      setGameState(newGs)
    })

    newSocket.on('cardRevealed', (card, revealedBy) => {
      console.log('Carte révélée:', card, 'par', revealedBy)
    })

    newSocket.on('trioFormed', (trio, pid) => {
      console.log('Trio formé:', trio, 'par', pid)
    })

    newSocket.on('trioFailed', (pid) => {
      console.log('Échec trio:', pid)
    })

    newSocket.on('turnChanged', (newCurrentPlayerId) => {
      console.log('Tour:', newCurrentPlayerId)
    })

    newSocket.on('gameEnded', (victoryResult) => {
      console.log('Partie terminée:', victoryResult)
    })

    newSocket.on('error', (message) => {
      console.error('Erreur serveur:', message)
    })

    setSocket(newSocket)
    ;(window as any).gameSocket = newSocket
  }

  // ← Nettoyage uniquement au démontage — tableau vide obligatoire
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  const createRoom = async (settings?: any) => {
    if (!socket?.connected) throw new Error('Non connecté au serveur')
    if (!playerInfo) throw new Error('Informations du joueur manquantes')

    return new Promise<void>((resolve, reject) => {
      const roomSettings = settings || {
        maxPlayers: 4,
        gameMode: 'SIMPLE' as const,
        allowAI: true,
        isPrivate: false,
      }
      socket.emit('createRoom', playerInfo.name, playerInfo.avatar as any, playerInfo.avatarSeed || '', playerInfo.nameColor, roomSettings, (response) => {
        if (response.success && response.roomInfo && response.playerId) {
          console.log('Salle créée:', response.roomInfo.code)
          setPlayerId(response.playerId)
          setRoomState({
            info: response.roomInfo,
            players: [{
              id: response.playerId,
              name: playerInfo.name,
              avatar: playerInfo.avatar,
              avatarSeed: playerInfo.avatarSeed,
              nameColor: playerInfo.nameColor,
              isHost: true,
              hand: [],
              trios: [],
              isAI: false,
              connectionStatus: 'CONNECTED',
              score: { trios: 0, victories: 0 },
            }],
            chatMessages: [],
          })
          resolve()
        } else {
          reject(new Error(response.error || 'Erreur inconnue'))
        }
      })
    })
  }

  const joinRoom = async (roomCode: string) => {
    if (!socket?.connected) throw new Error('Non connecté au serveur')
    if (!playerInfo) throw new Error('Informations du joueur manquantes')

    return new Promise<void>((resolve, reject) => {
      socket.emit('joinRoom', roomCode, playerInfo.name, playerInfo.avatar as any, playerInfo.avatarSeed || '', playerInfo.nameColor, (response) => {
        if (response.success && response.roomState && response.playerId) {
          setPlayerId(response.playerId)
          setRoomState(response.roomState)
          resolve()
        } else {
          reject(new Error(response.error || 'Erreur inconnue'))
        }
      })
    })
  }

  const leaveRoom = async () => {
    if (!socket?.connected) throw new Error('Non connecté au serveur')
    if (!roomState) throw new Error('Aucune salle active')

    return new Promise<void>((resolve, reject) => {
      socket.emit('leaveRoom', roomState.info.id, (response) => {
        if (response.success) {
          setRoomState(null)
          setPlayerId(null)
          setGameState(null)
          resolve()
        } else {
          reject(new Error(response.message || 'Erreur inconnue'))
        }
      })
    })
  }

  const startGame = async () => {
    if (!socket?.connected) throw new Error('Non connecté au serveur')
    if (!roomState) throw new Error('Aucune salle active')

    return new Promise<void>((resolve, reject) => {
      socket.emit('startGame', roomState.info.id, (response) => {
        if (response.success) resolve()
        else reject(new Error(response.message || 'Erreur inconnue'))
      })
    })
  }

  const sendChatMessage = async (message: string) => {
    if (!socket?.connected) throw new Error('Non connecté au serveur')
    if (!roomState) throw new Error('Aucune salle active')

    return new Promise<void>((resolve, reject) => {
      socket.emit('sendChatMessage', roomState.info.id, message, (response) => {
        if (response.success) resolve()
        else reject(new Error(response.error || 'Erreur inconnue'))
      })
    })
  }

  const addAIPlayer = async (difficulty: string) => {
    if (!socket?.connected) throw new Error('Non connecté au serveur')
    if (!roomState) throw new Error('Aucune salle active')

    return new Promise<void>((resolve, reject) => {
      socket.emit('addAIPlayer', roomState.info.id, difficulty, (response) => {
        if (response.success) resolve()
        else reject(new Error(response.error || 'Erreur inconnue'))
      })
    })
  }

  const removeAIPlayer = async (pid: string) => {
    if (!socket?.connected) throw new Error('Non connecté au serveur')
    if (!roomState) throw new Error('Aucune salle active')

    return new Promise<void>((resolve, reject) => {
      socket.emit('removeAIPlayer', roomState.info.id, pid, (response) => {
        if (response.success) resolve()
        else reject(new Error(response.error || 'Erreur inconnue'))
      })
    })
  }

  const sendGameAction = async (action: any) => {
    if (!socket?.connected) throw new Error('Non connecté au serveur')
    if (!roomState) throw new Error('Aucune salle active')

    return new Promise<void>((resolve, reject) => {
      socket.emit('playerAction', roomState.info.id, action, (response) => {
        if (response.success) resolve()
        else reject(new Error(response.message || 'Erreur inconnue'))
      })
    })
  }

  return (
    <GameContext.Provider value={{
      playerInfo, currentView, isLoading, error,
      setPlayerInfo, setCurrentView, setLoading, setError,
      state: {
        playerInfo, currentView, isLoading, error,
        isConnected, playerId, roomState, gameState,
        chatMessages: roomState?.chatMessages || [],
        isInGame: gameState !== null && currentView === 'game',
      },
      connectSocket, createRoom, joinRoom, leaveRoom,
      startGame, sendChatMessage, addAIPlayer, removeAIPlayer, sendGameAction,
    }}>
      {children}
    </GameContext.Provider>
  )
}
