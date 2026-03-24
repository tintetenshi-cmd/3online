import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGame } from '../contexts/SimpleGame'
import { GameMode, AIDifficulty } from '@3online/shared'
import Button from './ui/Button'
import PlayerSetup from './PlayerSetup'
import { pseudoTextStyle } from '../utils/pseudoStyle'
import AvatarBadge from './ui/AvatarBadge'
import './GameLobby.css'

const GameLobby: React.FC = () => {
  const navigate = useNavigate()
  const { roomCode: urlRoomCode } = useParams()
  const {
    state,
    connectSocket,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    sendChatMessage,
    addAIPlayer,
    removeAIPlayer,
  } = useGame()

  const [mode, setMode] = useState<'create' | 'join' | 'ai' | 'lobby'>('create')
  const [roomCode, setRoomCode] = useState(urlRoomCode || '')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [allowAI, setAllowAI] = useState(true)
  const [chatMessage, setChatMessage] = useState('')
  const [showPlayerSetup, setShowPlayerSetup] = useState(!state.playerInfo)
  const [showAIMenu, setShowAIMenu] = useState(false)

  const hasConnected = useRef(false)

  // ── Connexion unique au montage ──────────────────────────────
  useEffect(() => {
    if (!hasConnected.current && state.playerInfo) {
      hasConnected.current = true
      connectSocket()
    }
  }, []) // ← tableau vide — jamais retriggé

  // ── Rejoindre via URL une fois connecté ──────────────────────
  useEffect(() => {
    if (urlRoomCode && state.isConnected && !state.roomState) {
      handleJoinRoom(urlRoomCode)
    }
  }, [state.isConnected]) // ← uniquement quand la connexion s'établit

  // ── Redirection vers la partie ───────────────────────────────
  useEffect(() => {
    if (state.gameState && state.roomState) {
      navigate(`/game/${state.roomState.info.id}`)
    }
  }, [state.gameState])

  const handlePlayerSetupComplete = () => setShowPlayerSetup(false)

  const handleCreateRoom = async () => {
    try {
      await createRoom({
        maxPlayers,
        gameMode: GameMode.SIMPLE,
        allowAI,
        isPrivate: false,
      })
      setMode('lobby')
    } catch (error) {
      console.error('Erreur création salle:', error)
    }
  }

  const handleJoinRoom = async (code?: string) => {
    try {
      const codeToJoin = code || roomCode
      if (!codeToJoin) return
      await joinRoom(codeToJoin)
      setMode('lobby')
    } catch (error) {
      console.error('Erreur jointure:', error)
    }
  }

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom()
      setMode('create')
      navigate('/lobby')
    } catch (error) {
      console.error('Erreur sortie:', error)
    }
  }

  const handleStartGame = async () => {
    try {
      await startGame()
    } catch (error) {
      console.error('Erreur démarrage:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim()) return
    try {
      await sendChatMessage(chatMessage.trim())
      setChatMessage('')
    } catch (error) {
      console.error('Erreur envoi message:', error)
    }
  }

  const handleAddAI = async (difficulty: AIDifficulty) => {
    try {
      await addAIPlayer(difficulty)
      setShowAIMenu(false)
    } catch (error) {
      console.error('Erreur ajout IA:', error)
    }
  }

  const handleRemoveAI = async (playerId: string) => {
    try {
      await removeAIPlayer(playerId)
    } catch (error) {
      console.error('Erreur suppression IA:', error)
    }
  }

  const isHost = state.roomState?.info.hostId === state.playerId
  const canStart = state.roomState && state.roomState.players.length >= 2

  if (showPlayerSetup) {
    return (
      <PlayerSetup
        onComplete={handlePlayerSetupComplete}
        onCancel={() => navigate('/')}
        initialName={state.playerInfo?.name || ''}
        initialAvatar={(state.playerInfo?.avatar as any) || undefined}
        initialAvatarSeed={state.playerInfo?.avatarSeed || ''}
        initialNameColor={state.playerInfo?.nameColor || '#E9D5FF'}
      />
    )
  }

  if (!state.isConnected) {
    return (
      <div className="lobby lobby--loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Connexion au serveur...</p>
          {state.error && <p className="error-message">{state.error}</p>}
        </div>
      </div>
    )
  }

  if (mode === 'lobby' && state.roomState) {
    return (
      <div className="lobby">
        <div className="lobby__container">
          <header className="lobby__header">
            <div className="room-info">
              <h1>Salle {state.roomState.info.code}</h1>
              <p>{state.roomState.players.length}/{state.roomState.info.settings.maxPlayers} joueurs</p>
            </div>
            <Button variant="ghost" onClick={handleLeaveRoom}>Quitter</Button>
          </header>

          <div className="lobby__content">
            <div className="lobby__players">
              <h2>Joueurs</h2>
              <div className="players-list">
                {state.roomState.players.map((player: any) => (
                  <div key={player.id} className="player-item">
                    <div className="player-avatar">
                      <AvatarBadge avatar={player.avatar} seed={player.avatarSeed || player.id || player.name} size={34} />
                    </div>
                    <div className="player-details">
                      {(() => {
                        const t = pseudoTextStyle(player.nameColor)
                        return (
                          <span className={`player-name pseudo-text ${t.extraClass}`} style={t.style}>
                            {player.name}
                          </span>
                        )
                      })()}
                      {player.isHost && <span className="host-badge">Hôte</span>}
                      {player.isAI && <span className="ai-badge">IA {player.aiDifficulty || 'MEDIUM'}</span>}
                    </div>
                    <div className="player-status">
                      <span className={`status-dot status-dot--${player.connectionStatus}`} />
                      {isHost && player.isAI && (
                        <Button variant="ghost" size="small" onClick={() => handleRemoveAI(player.id)} className="remove-ai-btn">
                          ✕
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {isHost && (
                <div className="host-actions">
                  {!showAIMenu ? (
                    <Button
                      variant="secondary"
                      size="small"
                      disabled={state.roomState.players.length >= state.roomState.info.settings.maxPlayers || !state.roomState.info.settings.allowAI}
                      onClick={() => setShowAIMenu(true)}
                    >
                      Ajouter IA
                    </Button>
                  ) : (
                    <div className="ai-difficulty-menu">
                      <p>Choisir la difficulté :</p>
                      <div className="ai-buttons">
                        <Button variant="secondary" size="small" onClick={() => handleAddAI(AIDifficulty.EASY)}>Facile</Button>
                        <Button variant="secondary" size="small" onClick={() => handleAddAI(AIDifficulty.MEDIUM)}>Moyen</Button>
                        <Button variant="secondary" size="small" onClick={() => handleAddAI(AIDifficulty.HARD)}>Difficile</Button>
                        <Button variant="ghost" size="small" onClick={() => setShowAIMenu(false)}>Annuler</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lobby__chat">
              <h2>Chat</h2>
              <div className="chat-messages">
                {state.chatMessages.map((message: any) => {
                  // Pour les messages système, playerId = 'system', donc on cherche dans playerName
                  let author = null
                  let displayName = message.playerName || 'Système'
                  
                  if (!message.isSystemMessage) {
                    // Messages de joueurs : chercher le joueur par son ID
                    author = state.roomState?.players.find((p: any) => p.id === message.playerId)
                    displayName = author?.name || message.playerName || 'Joueur inconnu'
                  } else if (message.playerId !== 'system') {
                    // Messages système avec un playerId spécifique (ex: révélations de cartes)
                    author = state.roomState?.players.find((p: any) => p.id === message.playerId)
                    if (author) {
                      displayName = author.name
                    }
                  }
                  
                  const t = pseudoTextStyle(author?.nameColor)
                  
                  return (
                    <div key={message.id} className={`chat-message ${message.isSystemMessage ? 'system' : ''}`}>
                      <span className="message-author">
                        <AvatarBadge 
                          avatar={author?.avatar} 
                          seed={author?.avatarSeed || author?.id || message.playerName || 'system'} 
                          size={22} 
                          className="message-avatar" 
                        />
                        <span className={`message-author-name pseudo-text ${t.extraClass}`} style={t.style}>
                          {displayName}:
                        </span>
                      </span>
                      <span className="message-content">{message.message || message.content}</span>
                    </div>
                  )
                })}
              </div>
              <form onSubmit={handleSendMessage} className="chat-input">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Tapez votre message..."
                  maxLength={200}
                />
                <Button type="submit" variant="primary" size="small">Envoyer</Button>
              </form>
            </div>
          </div>

          <div className="lobby__actions">
            {isHost && (
              <Button variant="primary" size="large" onClick={handleStartGame} disabled={!canStart || state.isLoading} loading={state.isLoading}>
                Démarrer la partie
              </Button>
            )}
            {!isHost && <p className="waiting-message">En attente que l'hôte démarre la partie...</p>}
          </div>

          {state.error && <div className="error-message">{state.error}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="lobby">
      <div className="lobby__container">
        <header className="lobby__header">
          <Button variant="ghost" onClick={() => navigate('/')}>← Retour</Button>
          <h1>Rejoindre une partie</h1>
        </header>

        <div className="lobby__modes">
          <div className="mode-card">
            <h2>Héberger une partie</h2>
            <p>Créez une nouvelle salle et invitez vos amis</p>
            <div className="settings">
              <div className="setting">
                <label>Nombre de joueurs max</label>
                <select value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))}>
                  <option value={2}>2 joueurs</option>
                  <option value={3}>3 joueurs</option>
                  <option value={4}>4 joueurs</option>
                  <option value={5}>5 joueurs</option>
                  <option value={6}>6 joueurs</option>
                </select>
              </div>
              <div className="setting">
                <label>
                  <input type="checkbox" checked={allowAI} onChange={(e) => setAllowAI(e.target.checked)} />
                  Autoriser les IA
                </label>
              </div>
            </div>
            <Button variant="primary" onClick={handleCreateRoom} disabled={state.isLoading} loading={state.isLoading}>
              Créer la salle
            </Button>
          </div>

          <div className="mode-card">
            <h2>Rejoindre une salle</h2>
            <p>Entrez le code d'une salle existante</p>
            <div className="join-form">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Code de la salle"
                maxLength={6}
              />
              <Button variant="primary" onClick={() => handleJoinRoom()} disabled={!roomCode || state.isLoading} loading={state.isLoading}>
                Rejoindre
              </Button>
            </div>
          </div>
        </div>

        {state.error && <div className="error-message">{state.error}</div>}
      </div>
    </div>
  )
}

export default GameLobby
