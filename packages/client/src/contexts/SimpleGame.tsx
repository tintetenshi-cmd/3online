import { ReactNode, useState, createContext, useContext, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

// Types
interface PlayerInfo {
  name: string
  avatar: string
  avatarSeed?: string
  nameColor: string
}

interface GameState {
  playerInfo: PlayerInfo | null
  currentView: 'menu' | 'lobby' | 'game' | 'rules'
  isLoading: boolean
  error: string | null
}

interface GameContextType {
  // Propriétés directes (pour MainMenu)
  playerInfo: PlayerInfo | null
  currentView: 'menu' | 'lobby' | 'game' | 'rules'
  isLoading: boolean
  error: string | null
  setPlayerInfo: (info: PlayerInfo) => void
  setCurrentView: (view: 'menu' | 'lobby' | 'game' | 'rules') => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Objet state (pour GameLobby/GameBoard)
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
  
  // Fonctions (pour GameLobby/GameBoard)
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

// Contexte
const GameContext = createContext<GameContextType | null>(null)

// Hook
export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

// Provider
export const GameProvider = ({ children }: { children: ReactNode }) => {
  // Fonction pour récupérer les données du localStorage
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

  const setPlayerInfo = (info: PlayerInfo) => {
    setPlayerInfoState(info)
    // Sauvegarder dans localStorage
    localStorage.setItem('3online-player', JSON.stringify(info))
  }

  const setCurrentView = (view: 'menu' | 'lobby' | 'game' | 'rules') => {
    setCurrentViewState(view)
  }

  const setLoading = (loading: boolean) => {
    setIsLoadingState(loading)
  }

  const setError = (error: string | null) => {
    setErrorState(error)
  }

  // Fonction de connexion WebSocket
  const connectSocket = () => {
    if (socket && socket.connected) {
      setIsConnected(true)
      return
    }

    console.log('Connexion au serveur WebSocket...')
    const newSocket = io('http://localhost:3001')
    
    newSocket.on('connect', () => {
      console.log('Connecté au serveur !')
      setIsConnected(true)
      setError(null)
    })

    newSocket.on('disconnect', () => {
      console.log('Déconnecté du serveur')
      setIsConnected(false)
    })

    newSocket.on('error', (error) => {
      console.error('Erreur WebSocket:', error)
      setError('Erreur de connexion au serveur')
      setIsConnected(false)
    })

    // Événements de salle
    newSocket.on('roomUpdated', (roomState) => {
      console.log('Salle mise à jour:', roomState)
      setRoomState(roomState)
    })

    newSocket.on('playerJoined', (player) => {
      console.log('Joueur rejoint:', player.name)
      // La mise à jour sera gérée par roomUpdated
    })

    newSocket.on('playerLeft', (playerId, playerName) => {
      console.log('Joueur parti:', playerName)
      // La mise à jour sera gérée par roomUpdated
    })

    newSocket.on('gameStarted', (gameState) => {
      console.log('Partie démarrée !', gameState)
      console.log('Joueur actuel:', gameState.currentPlayerId)
      console.log('Mon ID:', playerId)
      console.log('Cartes au centre:', gameState.centerCards?.length)
      console.log('Joueurs:', gameState.players?.map(p => ({ id: p.id, name: p.name, cartes: p.hand?.length })))
      setGameState(gameState)
      setCurrentView('game')
    })

    newSocket.on('chatMessage', (chatMessage) => {
      console.log('Nouveau message chat:', chatMessage)
      setRoomState((prevState: any) => {
        if (!prevState) return prevState
        return {
          ...prevState,
          chatMessages: [...prevState.chatMessages, chatMessage]
        }
      })
    })

    newSocket.on('aiPlayerAdded', (aiPlayer) => {
      console.log('IA ajoutée:', aiPlayer.name)
      // La mise à jour sera gérée par roomUpdated
    })

    newSocket.on('aiPlayerRemoved', (playerId) => {
      console.log('IA supprimée:', playerId)
      // La mise à jour sera gérée par roomUpdated
    })

    newSocket.on('aiThinking', (data) => {
      console.log(`${data.playerName} réfléchit...`)
      // TODO: Afficher une indication visuelle que l'IA réfléchit
    })

    newSocket.on('aiAction', (data) => {
      console.log(`${data.playerName} a joué:`, data.action)
      if (data.reasoning) {
        console.log('Raisonnement:', data.reasoning)
      }
      // TODO: Afficher l'action de l'IA avec une animation
    })

    newSocket.on('gameStateUpdated', (newGameState) => {
      console.log('État de jeu mis à jour:', newGameState)
      setGameState(newGameState)
    })

    newSocket.on('cardRevealed', (card, revealedBy) => {
      console.log('Carte révélée:', card, 'par', revealedBy)
      // La mise à jour sera gérée par gameStateUpdated
    })

    newSocket.on('trioFormed', (trio, playerId) => {
      console.log('Trio formé:', trio, 'par', playerId)
      // La mise à jour sera gérée par gameStateUpdated
    })

    newSocket.on('trioFailed', (playerId) => {
      console.log('Échec de trio pour:', playerId)
      // TODO: Afficher message d'échec
    })

    newSocket.on('turnChanged', (newCurrentPlayerId) => {
      console.log('Changement de tour:', newCurrentPlayerId)
      // La mise à jour sera gérée par gameStateUpdated
    })

    newSocket.on('gameEnded', (victoryResult) => {
      console.log('Partie terminée:', victoryResult)
      // TODO: Afficher l'écran de fin de partie
    })

    setSocket(newSocket)
    
    // Exposer le socket globalement pour les composants
    ;(window as any).gameSocket = newSocket
  }

  // Nettoyage de la connexion
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [socket])

  // Autres fonctions (implémentation réelle)
  const createRoom = async (settings?: any) => {
    if (!socket || !socket.connected) {
      throw new Error('Non connecté au serveur')
    }
    
    if (!playerInfo) {
      throw new Error('Informations du joueur manquantes')
    }

    console.log('Création d\'une nouvelle salle...')
    
    return new Promise<void>((resolve, reject) => {
      // Utiliser les paramètres fournis ou des valeurs par défaut
      const roomSettings = settings || {
        maxPlayers: 4,
        gameMode: 'SIMPLE' as const,
        allowAI: true,
        isPrivate: false,
      }

      socket.emit('createRoom', 
        playerInfo.name, 
        playerInfo.avatar as any, // Cast temporaire
        playerInfo.avatarSeed || '',
        playerInfo.nameColor,
        roomSettings, 
        (response) => {
          if (response.success && response.roomInfo && response.playerId) {
            console.log('Salle créée avec succès:', response.roomInfo.code)
            
            // Stocker le playerId reçu du serveur
            setPlayerId(response.playerId)
            
            // Créer un état de salle basique avec le vrai playerId
            const newRoomState = {
              info: response.roomInfo,
              players: [{
                id: response.playerId, // Utiliser le vrai ID du serveur
                name: playerInfo.name,
                avatar: playerInfo.avatar,
                avatarSeed: playerInfo.avatarSeed,
                nameColor: playerInfo.nameColor,
                isHost: true,
                hand: [],
                trios: [],
                isAI: false,
                connectionStatus: 'CONNECTED',
                score: { trios: 0, victories: 0 }
              }],
              chatMessages: []
            }
            
            setRoomState(newRoomState)
            resolve()
          } else {
            console.error('Erreur création salle:', response.error)
            reject(new Error(response.error || 'Erreur inconnue'))
          }
        }
      )
    })
  }

  const joinRoom = async (roomCode: string) => {
    if (!socket || !socket.connected) {
      throw new Error('Non connecté au serveur')
    }
    
    if (!playerInfo) {
      throw new Error('Informations du joueur manquantes')
    }

    console.log('Rejoindre la salle:', roomCode)
    
    return new Promise<void>((resolve, reject) => {
      socket.emit('joinRoom', 
        roomCode,
        playerInfo.name, 
        playerInfo.avatar as any, // Cast temporaire
        playerInfo.avatarSeed || '',
        playerInfo.nameColor,
        (response) => {
          if (response.success && response.roomState && response.playerId) {
            console.log('Salle rejointe avec succès')
            
            // Stocker le playerId reçu du serveur
            setPlayerId(response.playerId)
            
            // Mettre à jour l'état avec les infos de la salle
            setRoomState(response.roomState)
            resolve()
          } else {
            console.error('Erreur rejoindre salle:', response.error)
            reject(new Error(response.error || 'Erreur inconnue'))
          }
        }
      )
    })
  }

  const leaveRoom = async () => {
    if (!socket || !socket.connected) {
      throw new Error('Non connecté au serveur')
    }
    
    if (!roomState) {
      throw new Error('Aucune salle active')
    }

    console.log('Quitter la salle...')
    
    return new Promise<void>((resolve, reject) => {
      socket.emit('leaveRoom', roomState.info.id, (response) => {
        if (response.success) {
          console.log('Salle quittée avec succès')
          setRoomState(null)
          setPlayerId(null)
          setGameState(null)
          resolve()
        } else {
          console.error('Erreur quitter salle:', response.message)
          reject(new Error(response.message || 'Erreur inconnue'))
        }
      })
    })
  }

  const startGame = async () => {
    if (!socket || !socket.connected) {
      throw new Error('Non connecté au serveur')
    }
    
    if (!roomState) {
      throw new Error('Aucune salle active')
    }

    console.log('Démarrage de la partie...')
    
    return new Promise<void>((resolve, reject) => {
      socket.emit('startGame', roomState.info.id, (response) => {
        if (response.success) {
          console.log('Partie démarrée avec succès')
          resolve()
        } else {
          console.error('Erreur démarrage partie:', response.message)
          reject(new Error(response.message || 'Erreur inconnue'))
        }
      })
    })
  }

  const sendChatMessage = async (message: string) => {
    if (!socket || !socket.connected) {
      throw new Error('Non connecté au serveur')
    }
    
    if (!roomState) {
      throw new Error('Aucune salle active')
    }

    console.log('Envoi message chat:', message)
    
    return new Promise<void>((resolve, reject) => {
      socket.emit('sendChatMessage', roomState.info.id, message, (response) => {
        if (response.success) {
          console.log('Message envoyé avec succès')
          resolve()
        } else {
          console.error('Erreur envoi message:', response.error)
          reject(new Error(response.error || 'Erreur inconnue'))
        }
      })
    })
  }

  const addAIPlayer = async (difficulty: string) => {
    if (!socket || !socket.connected) {
      throw new Error('Non connecté au serveur')
    }
    
    if (!roomState) {
      throw new Error('Aucune salle active')
    }

    console.log('Ajout IA avec difficulté:', difficulty)
    
    return new Promise<void>((resolve, reject) => {
      socket.emit('addAIPlayer', roomState.info.id, difficulty, (response) => {
        if (response.success) {
          console.log('IA ajoutée avec succès:', response.player.name)
          resolve()
        } else {
          console.error('Erreur ajout IA:', response.error)
          reject(new Error(response.error || 'Erreur inconnue'))
        }
      })
    })
  }

  const removeAIPlayer = async (playerId: string) => {
    if (!socket || !socket.connected) {
      throw new Error('Non connecté au serveur')
    }
    
    if (!roomState) {
      throw new Error('Aucune salle active')
    }

    console.log('Suppression IA:', playerId)
    
    return new Promise<void>((resolve, reject) => {
      socket.emit('removeAIPlayer', roomState.info.id, playerId, (response) => {
        if (response.success) {
          console.log('IA supprimée avec succès')
          resolve()
        } else {
          console.error('Erreur suppression IA:', response.error)
          reject(new Error(response.error || 'Erreur inconnue'))
        }
      })
    })
  }

  const sendGameAction = async (action: any) => {
    if (!socket || !socket.connected) {
      throw new Error('Non connecté au serveur')
    }
    
    if (!roomState) {
      throw new Error('Aucune salle active')
    }

    console.log('Envoi action de jeu:', action)
    
    return new Promise<void>((resolve, reject) => {
      socket.emit('playerAction', roomState.info.id, action, (response) => {
        if (response.success) {
          console.log('Action envoyée avec succès')
          resolve()
        } else {
          console.error('Erreur action jeu:', response.message)
          reject(new Error(response.message || 'Erreur inconnue'))
        }
      })
    })
  }

  const value: GameContextType = {
    // Propriétés directes pour MainMenu
    playerInfo,
    currentView,
    isLoading,
    error,
    setPlayerInfo,
    setCurrentView,
    setLoading,
    setError,
    
    // Objet state pour GameLobby/GameBoard
    state: {
      playerInfo,
      currentView,
      isLoading,
      error,
      isConnected,
      playerId,
      roomState,
      gameState: gameState,
      chatMessages: roomState?.chatMessages || [],
      isInGame: gameState !== null && currentView === 'game',
    },
    
    // Fonctions pour GameLobby/GameBoard
    connectSocket,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    sendChatMessage,
    addAIPlayer,
    removeAIPlayer,
    sendGameAction,
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}