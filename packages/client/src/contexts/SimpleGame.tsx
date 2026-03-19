import { ReactNode, useState, createContext, useContext, useEffect, useCallback } from 'react'

// SimpleGame.tsx — LIGNE 1, remplace l'import
import { io } from 'socket.io-client'

// Juste avant GameProvider, hors du composant
const SERVER_URL = (import.meta as any).env?.VITE_SERVER_URL
  ?? window.location.origin

const socket = io(SERVER_URL, {
  transports: ['websocket'],
  upgrade: false,
  rememberUpgrade: false,
  timeout: 30000,
  reconnectionAttempts: 5,
  reconnectionDelay: 5000,
  reconnectionDelayMax: 30000,
  autoConnect: false,
})


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
  const [isConnected, setIsConnected] = useState(socket.connected) // ← init depuis socket réel
  const [roomState, setRoomState] = useState<any>(null)
  const [gameState, setGameState] = useState<any>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)

  // ── Listeners socket — montés UNE SEULE FOIS ─────────────────
  useEffect(() => {
    // Si déjà connecté au montage (HMR / StrictMode)
    if (socket.connected) setIsConnected(true)

    const onConnect = () => {
      console.log('Connecté au serveur !')
      setIsConnected(true)
      setErrorState(null)
    }
    const onDisconnect = () => {
      console.log('Déconnecté du serveur')
      setIsConnected(false)
    }
    const onConnectError = (err: Error) => {
      console.error('Erreur WebSocket:', err.message)
      setErrorState('Erreur de connexion au serveur')
      setIsConnected(false)
    }
    const onReconnectFailed = () => {
      console.error('Échec reconnexion après 3 tentatives')
      setErrorState('Serveur inaccessible. Rechargez la page.')
    }
    const onRoomUpdated = (rs: any) => setRoomState(rs)
    const onPlayerJoined = (player: any) => console.log('Joueur rejoint:', player.name)
    const onPlayerLeft = (_pid: any, playerName: string) => console.log('Joueur parti:', playerName)
    const onGameStarted = (gs: any) => {
      console.log('Partie démarrée !', gs)
      setGameState(gs)
      setCurrentViewState('game')
    }
    const onChatMessage = (msg: any) => {
      setRoomState((prev: any) => {
        if (!prev) return prev
        return { ...prev, chatMessages: [...(prev.chatMessages || []), msg] }
      })
    }
    const onGameStateUpdated = (gs: any) => setGameState(gs)
    const onError = (msg: any) => console.error('Erreur serveur:', msg)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('reconnect_failed', onReconnectFailed)
    socket.on('roomUpdated', onRoomUpdated)
    socket.on('playerJoined', onPlayerJoined)
    socket.on('playerLeft', onPlayerLeft)
    socket.on('gameStarted', onGameStarted)
    socket.on('chatMessage', onChatMessage)
    socket.on('aiPlayerAdded', (p: any) => console.log('IA ajoutée:', p.name))
    socket.on('aiPlayerRemoved', () => console.log('IA supprimée'))
    socket.on('aiThinking', (d: any) => console.log(`${d.playerName} réfléchit...`))
    socket.on('aiAction', (d: any) => console.log(`joué:`, d))
    socket.on('gameStateUpdated', onGameStateUpdated)
    socket.on('cardRevealed', (card: any, by: any) => console.log('Carte révélée:', card, 'par', by))
    socket.on('trioFormed', (trio: any, pid: any) => console.log('Trio formé:', trio, 'par', pid))
    socket.on('trioFailed', (pid: any) => console.log('Échec trio:', pid))
    socket.on('turnChanged', (pid: any) => console.log('Tour:', pid))
    socket.on('gameEnded', (r: any) => console.log('Partie terminée:', r))
    socket.on('error', onError)

    // ← Nettoyage propre — retire uniquement les listeners, ne déconnecte PAS
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.off('reconnect_failed', onReconnectFailed)
      socket.off('roomUpdated', onRoomUpdated)
      socket.off('playerJoined', onPlayerJoined)
      socket.off('playerLeft', onPlayerLeft)
      socket.off('gameStarted', onGameStarted)
      socket.off('chatMessage', onChatMessage)
      socket.off('gameStateUpdated', onGameStateUpdated)
      socket.off('error', onError)
    }
  }, []) // ← tableau vide, jamais retriggé

  const setPlayerInfo = (info: PlayerInfo) => {
    setPlayerInfoState(info)
    localStorage.setItem('3online-player', JSON.stringify(info))
  }
  const setCurrentView = (view: 'menu' | 'lobby' | 'game' | 'rules') => setCurrentViewState(view)
  const setLoading = (loading: boolean) => setIsLoadingState(loading)
  const setError = (err: string | null) => setErrorState(err)

  // ── connectSocket — useCallback pour référence stable ────────
  const connectSocket = useCallback(() => {
    if (socket.connected) {
      setIsConnected(true)
      return
    }
    // Guard contre double appel simultané
    if (socket.active) {
      console.log('Connexion déjà en cours...')
      return
    }
    console.log('Connexion au serveur WebSocket...')
    socket.connect()
  }, []) // ← jamais recréé

  const createRoom = useCallback(async (settings?: any) => {
    if (!socket.connected) throw new Error('Non connecté au serveur')
    if (!playerInfo) throw new Error('Informations du joueur manquantes')

    return new Promise<void>((resolve, reject) => {
      const roomSettings = settings || {
        maxPlayers: 4,
        gameMode: 'SIMPLE' as const,
        allowAI: true,
        isPrivate: false,
      }
      socket.emit(
        'createRoom',
        playerInfo.name,
        playerInfo.avatar as any,
        playerInfo.avatarSeed || '',
        playerInfo.nameColor,
        roomSettings,
        (response: any) => {
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
        }
      )
    })
  }, [playerInfo])

  const joinRoom = useCallback(async (roomCode: string) => {
    if (!socket.connected) throw new Error('Non connecté au serveur')
    if (!playerInfo) throw new Error('Informations du joueur manquantes')

    return new Promise<void>((resolve, reject) => {
      socket.emit(
        'joinRoom',
        roomCode,
        playerInfo.name,
        playerInfo.avatar as any,
        playerInfo.avatarSeed || '',
        playerInfo.nameColor,
        (response: any) => {
          if (response.success && response.roomState && response.playerId) {
            setPlayerId(response.playerId)
            setRoomState(response.roomState)
            resolve()
          } else {
            reject(new Error(response.error || response.message || 'Erreur inconnue'))
          }
        }
      )
    })
  }, [playerInfo])

  const leaveRoom = useCallback(async () => {
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
  }, [roomState])

  const startGame = useCallback(async () => {
    if (!socket.connected) throw new Error('Non connecté au serveur')
    if (!roomState) throw new Error('Aucune salle active')

    return new Promise<void>((resolve, reject) => {
      socket.emit('startGame', roomState.info.id, (response: any) => {
        if (response.success) resolve()
        else reject(new Error(response.message || 'Erreur inconnue'))
      })
    })
  }, [roomState])

  const sendChatMessage = useCallback(async (message: string) => {
    if (!socket.connected) throw new Error('Non connecté au serveur')
    if (!roomState) throw new Error('Aucune salle active')

    return new Promise<void>((resolve, reject) => {
      socket.emit('sendChatMessage', roomState.info.id, message, (response: any) => {
        if (response.success) resolve()
        else reject(new Error(response.error || 'Erreur inconnue'))
      })
    })
  }, [roomState])

  const addAIPlayer = useCallback(async (difficulty: string) => {
    if (!socket.connected) throw new Error('Non connecté au serveur')
    if (!roomState) throw new Error('Aucune salle active')

    return new Promise<void>((resolve, reject) => {
      socket.emit('addAIPlayer', roomState.info.id, difficulty, (response: any) => {
        if (response.success) resolve()
        else reject(new Error(response.error || 'Erreur inconnue'))
      })
    })
  }, [roomState])

  const removeAIPlayer = useCallback(async (pid: string) => {
    if (!socket.connected) throw new Error('Non connecté au serveur')
    if (!roomState) throw new Error('Aucune salle active')

    return new Promise<void>((resolve, reject) => {
      socket.emit('removeAIPlayer', roomState.info.id, pid, (response: any) => {
        if (response.success) resolve()
        else reject(new Error(response.error || 'Erreur inconnue'))
      })
    })
  }, [roomState])

  const sendGameAction = useCallback(async (action: any) => {
    if (!socket.connected) throw new Error('Non connecté au serveur')
    if (!roomState) throw new Error('Aucune salle active')

    return new Promise<void>((resolve, reject) => {
      socket.emit('playerAction', roomState.info.id, action, (response: any) => {
        if (response.success) resolve()
        else reject(new Error(response.message || 'Erreur inconnue'))
      })
    })
  }, [roomState])

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
