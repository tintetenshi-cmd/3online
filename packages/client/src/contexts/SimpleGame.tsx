import { ReactNode, useState, createContext, useContext, useEffect } from 'react'
import { socket } from '../socket'

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
  const [roomState, setRoomState] = useState<any>(null)
  const [gameState, setGameState] = useState<any>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)

  // ── Listeners socket — montés UNE SEULE FOIS ─────────────────
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connecté au serveur !')
      setIsConnected(true)
      setErrorState(null)
    })

    socket.on('disconnect', () => {
      console.log('Déconnecté du serveur')
      setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.error('Erreur WebSocket:', err.message)
      setErrorState('Erreur de connexion au serveur')
      setIsConnected(false)
    })

    socket.on('reconnect_failed', () => {
      console.error('Échec reconnexion après 3 tentatives')
      setErrorState('Serveur inaccessible. Rechargez la page.')
    })

    socket.on('roomUpdated', (rs) => setRoomState(rs))

    socket.on('playerJoined', (player) => {
      console.log('Joueur rejoint:', player.name)
    })

    socket.on('playerLeft', (_pid, playerName) => {
      console.log('Joueur parti:', playerName)
    })

    socket.on('gameStarted', (gs) => {
      console.log('Partie démarrée !', gs)
      setGameState(gs)
      setCurrentViewState('game')
    })

    socket.on('chatMessage', (msg) => {
      setRoomState((prev: any) => {
        if (!prev) return prev
        return { ...prev, chatMessages: [...prev.chatMessages, msg] }
      })
    })

    socket.on('aiPlayerAdded', (p) => console.log('IA ajoutée:', p.name))
    socket.on('aiPlayerRemoved', () => console.log('IA supprimée'))
    socket.on('aiThinking', (d) => console.log(`${d.playerName} réfléchit...`))
    socket.on('aiAction', (d) => console.log(`${d.playerName} a joué:`, d.action))
    socket.on('gameStateUpdated', (gs) => setGameState(gs))

    socket.on('cardRevealed', (card, by) => {
      console.log('Carte révélée:', card, 'par', by)
    })

    socket.on('trioFormed', (trio, pid) => {
      console.log('Trio formé:', trio, 'par', pid)
    })

    socket.on('trioFailed', (pid) => {
      console.log('Échec trio:', pid)
    })

    socket.on('turnChanged', (pid) => {
      console.log('Tour:', pid)
    })

    socket.on('gameEnded', (r) => {
      console.log('Partie terminée:', r)
    })

    socket.on('error', (msg) => {
      console.error('Erreur serveur:', msg)
    })

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, []) // ← JAMAIS de dépendances

  const setPlayerInfo = (info: PlayerInfo) => {
    setPlayerInfoState(info)
    localStorage.setItem('3online-player', JSON.stringify(info))
  }
  const setCurrentView = (view: 'menu' | 'lobby' | 'game' | 'rules') => setCurrentViewState(view)
  const setLoading = (loading: boolean) => setIsLoadingState(loading)
  const setError = (err: string | null) => setErrorState(err)

  // ── Connexion — appel unique, socket singleton ────────────────
  const connectSocket = () => {
    if (socket.connected) {
      setIsConnected(true)
      return
    }
    console.log('Connexion au serveur WebSocket...')
    socket.connect()
  }

  const createRoom = async (settings?: any) => {
    if (!socket.connected) throw new Error('Non connecté au serveur')
    if (!playerInfo) throw new Error('Informations du joueur manquantes')

    return new Promise<void>((resolve, reject) => {
      const roomSettings = settings || {
        maxPlayers: 4,
        gameMode: 'SIMPLE' as const,
        allowAI: true,
        isPrivate: false,
      }
      socket.emit('createRoom', playerInfo.name, playerInfo.avatar as any, playerInfo.avatarSeed || '', playerInfo.nameColor, roomSettings, (response: any) => {
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
    if (!socket.connected) throw new Error('Non connecté au serveur')
    if (!playerInfo) throw new Error('Informations du joueur manquantes')

    return new Promise<void>((resolve, reject) => {
      socket.emit('joinRoom', roomCode, playerInfo.name, playerInfo.avatar as any, playerInfo.avatarSeed || '', playerInfo.nameColor, (response: any) => {
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
    if (!socket.connected) throw new Error('Non connecté au serveur')
    if (!roomState) throw new Error('Aucune salle active')

    return new Promise<void>((resolve, reject) => {
      socket.emit('leaveRoom', roomState.info.id, (response: any) => {
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
    if (!socket.connected) throw new Error('Non connecté au serveur')
    if (!roomState) throw new Error('Aucune salle active')

    return new Promise<void>((resolve, reject) => {
      socket.emit('startGame', roomState.info.id, (response: any) => {
        if (response.success) resolve()
        else reject(new Error(response.message || 'Erreur inconnue'))
      })
    })
  }

  const sendChatMessage = async (message: string) => {
    if (!socket.connected) throw new Error('Non connecté au serveur')
    if (!roomState) throw new Error('Aucune salle active')

    return new Promise<void>((resolve, reject) => {
      socket.emit('sendChatMessage', roomState.info.id, message, (response: any) => {
        if (response.success) resolve()
        else reject(new Error(response.error || 'Erreur inconnue'))
      })
    })
  }

  const addAIPlayer = async (difficulty: string) => {
    if (!socket.connected) throw new Error('Non connecté au serveur')
    if (!roomState) throw new Error('Aucune salle active')

    return new Promise<void>((resolve, reject) => {
      socket.emit('addAIPlayer', roomState.info.id, difficulty, (response: any) => {
        if (response.success) resolve()
        else reject(new Error(response.error || 'Erreur inconnue'))
      })
    })
  }

  const removeAIPlayer = async (pid: string) => {
    if (!socket.connected) throw new Error('Non connecté au serveur')
    if (!roomState) throw new Error('Aucune salle active')

    return new Promise<void>((resolve, reject) => {
      socket.emit('removeAIPlayer', roomState.info.id, pid, (response: any) => {
        if (response.success) resolve()
        else reject(new Error(response.error || 'Erreur inconnue'))
      })
    })
  }

  const sendGameAction = async (action: any) => {
    if (!socket.connected) throw new Error('Non connecté au serveur')
    if (!roomState) throw new Error('Aucune salle active')

    return new Promise<void>((resolve, reject) => {
      socket.emit('playerAction', roomState.info.id, action, (response: any) => {
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
