import React, { createContext, useContext, useReducer, ReactNode } from 'react'

// Types simples
interface PlayerInfo {
  name: string
  avatar: string
}

interface GameState {
  playerInfo: PlayerInfo | null
  currentView: 'menu' | 'lobby' | 'game' | 'rules'
  isLoading: boolean
  error: string | null
}

// Actions
type GameAction =
  | { type: 'SET_PLAYER_INFO'; payload: PlayerInfo }
  | { type: 'SET_CURRENT_VIEW'; payload: GameState['currentView'] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

// État initial
const initialState: GameState = {
  playerInfo: null,
  currentView: 'menu',
  isLoading: false,
  error: null,
}

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PLAYER_INFO':
      return { ...state, playerInfo: action.payload }
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    default:
      return state
  }
}

// Contexte
const GameContext = createContext<{
  state: GameState
  dispatch: React.Dispatch<GameAction>
} | null>(null)

// Hook personnalisé - EXPORT PRINCIPAL
export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  
  const { state, dispatch } = context
  
  return {
    playerInfo: state.playerInfo,
    currentView: state.currentView,
    isLoading: state.isLoading,
    error: state.error,
    setPlayerInfo: (playerInfo: PlayerInfo) => dispatch({ type: 'SET_PLAYER_INFO', payload: playerInfo }),
    setCurrentView: (view: GameState['currentView']) => dispatch({ type: 'SET_CURRENT_VIEW', payload: view }),
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
  }
}

// Provider - EXPORT PRINCIPAL
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}