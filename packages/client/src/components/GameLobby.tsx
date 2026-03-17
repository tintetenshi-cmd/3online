import React, { useState, useEffect } from 'react'
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
    removeAIPlayer
  } = useGame()

  const [mode, setMode] = useState<'create' | 'join' | 'ai' | 'lobby'>('create')
  const [roomCode, setRoomCode] = useState(urlRoomCode || '')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [allowAI, setAllowAI] = useState(true)
  const [chatMessage, setChatMessage] = useState('')
  const [showPlayerSetup, setShowPlayerSetup] = useState(false)
  const [showAIMenu, setShowAIMenu] = useState(false)

  // Vérifier si le joueur est configuré
  useEffect(() => {
    if (!state.playerInfo) {
      setShowPlayerSetup(true)
    }
  }, [state.playerInfo])

  // Se connecter automatiquement
  useEffect(() => {
    if (state.playerInfo && !state.isConnected) {
      connectSocket()
    }
  }, [state.playerInfo, state.isConnected, connectSocket])

  // Rejoindre automatiquement si code dans l'URL
  useEffect(() => {
    if (urlRoomCode && state.isConnected && state.playerInfo && !state.roomState) {
      handleJoinRoom(urlRoomCode)
    }
  }, [urlRoomCode, state.isConnected, state.playerInfo, state.roomState])

  // Rediriger vers le jeu si la partie commence
  useEffect(() => {
    if (state.gameState && state.roomState) {
      navigate(`/game/${state.roomState.info.id}`)
    }
  }, [state.gameState, state.roomState, navigate])

  const handlePlayerSetupComplete = (name: string, avatar: string, avatarSeed: string, nameColor: string) => {
    // Stocké dans le contexte via PlayerSetup/MainMenu (ou directement ici si besoin)
    // On ferme simplement la modale: les infos sont déjà sauvegardées côté contexte.
    setShowPlayerSetup(false)
  }

  const handleCreateRoom = async () => {
    try {
      const settings = {
        maxPlayers,
        gameMode: GameMode.SIMPLE,
        allowAI,
        isPrivate: false,
      }

      await createRoom(settings)
      setMode('lobby')
    } catch (error) {
      console.error('Erreur lors de la création de la salle:', error)
    }
  }

  const handleJoinRoom = async (code?: string) => {
    try {
      const codeToJoin = code || roomCode
      if (!codeToJoin) return

      await joinRoom(codeToJoin)
      setMode('lobby')
    } catch (error) {
      console.error('Erreur lors de la jointure:', error)
    }
  }

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom()
      setMode('create')
      navigate('/lobby')
    } catch (error) {
      console.error('Erreur lors de la sortie:', error)
    }
  }

  const handleStartGame = async () => {
    try {
      await startGame()
    } catch (error) {
      console.error('Erreur lors du démarrage:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim()) return

    try {
      await sendChatMessage(chatMessage.trim())
      setChatMessage('')
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
    }
  }

  const handleAddAI = async (difficulty: AIDifficulty) => {
    try {
      await addAIPlayer(difficulty)
      setShowAIMenu(false)
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'IA:', error)
    }
  }

  const handleRemoveAI = async (playerId: string) => {
    try {
      await removeAIPlayer(playerId)
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'IA:', error)
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
        </div>
      </div>
    )
  }

  if (mode === 'lobby' && state.roomState) {
    return (
      <div className="lobby">
        <div className="lobby__container">
          {/* Header de la salle */}
          <header className="lobby__header">
            <div className="room-info">
              <h1>Salle {state.roomState.info.code}</h1>
              <p>{state.roomState.players.length}/{state.roomState.info.settings.maxPlayers} joueurs</p>
            </div>
            <Button
              variant="ghost"
              onClick={handleLeaveRoom}
            >
              Quitter
            </Button>
          </header>

          <div className="lobby__content">
            {/* Liste des joueurs */}
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
                      {player.isAI && (
                        <span className="ai-badge">
                          IA {player.aiDifficulty || 'MEDIUM'}
                        </span>
                      )}
                    </div>
                    <div className="player-status">
                      <span className={`status-dot status-dot--${player.connectionStatus}`} />
                      {isHost && player.isAI && (
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => handleRemoveAI(player.id)}
                          className="remove-ai-btn"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions de l'hôte */}
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
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleAddAI(AIDifficulty.EASY)}
                        >
                          Facile
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleAddAI(AIDifficulty.MEDIUM)}
                        >
                          Moyen
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleAddAI(AIDifficulty.HARD)}
                        >
                          Difficile
                        </Button>
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => setShowAIMenu(false)}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat */}
            <div className="lobby__chat">
              <h2>Chat</h2>
              <div className="chat-messages">
                {state.chatMessages.map((message) => {
                  const author = state.roomState.players.find((p: any) => p.id === message.playerId)
                  const t = pseudoTextStyle(author?.nameColor)

                  return (
                    <div key={message.id} className={`chat-message ${message.isSystemMessage ? 'system' : ''}`}>
                      {!message.isSystemMessage && (
                        <span className="message-author">
                          <AvatarBadge
                            avatar={author?.avatar}
                            seed={author?.avatarSeed || author?.id || message.playerName}
                            size={22}
                            className="message-avatar"
                          />
                          <span className={`message-author-name pseudo-text ${t.extraClass}`} style={t.style}>
                            {message.playerName}:
                          </span>
                        </span>
                      )}
                      <span className="message-content">{message.content}</span>
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
                <Button type="submit" variant="primary" size="small">
                  Envoyer
                </Button>
              </form>
            </div>
          </div>

          {/* Actions */}
          <div className="lobby__actions">
            {isHost && (
              <Button
                variant="primary"
                size="large"
                onClick={handleStartGame}
                disabled={!canStart || state.isLoading}
                loading={state.isLoading}
              >
                Démarrer la partie
              </Button>
            )}
            {!isHost && (
              <p className="waiting-message">
                En attente que l'hôte démarre la partie...
              </p>
            )}
          </div>

          {state.error && (
            <div className="error-message">
              {state.error}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="lobby">
      <div className="lobby__container">
        <header className="lobby__header">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
          >
            ← Retour
          </Button>
          <h1>Rejoindre une partie</h1>
        </header>

        <div className="lobby__modes">
          <div className="mode-card">
            <h2>Héberger une partie</h2>
            <p>Créez une nouvelle salle et invitez vos amis</p>
            
            <div className="settings">
              <div className="setting">
                <label>Nombre de joueurs max</label>
                <select 
                  value={maxPlayers} 
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                >
                  <option value={2}>2 joueurs</option>
                  <option value={3}>3 joueurs</option>
                  <option value={4}>4 joueurs</option>
                  <option value={5}>5 joueurs</option>
                  <option value={6}>6 joueurs</option>
                </select>
              </div>
              
              <div className="setting">
                <label>
                  <input
                    type="checkbox"
                    checked={allowAI}
                    onChange={(e) => setAllowAI(e.target.checked)}
                  />
                  Autoriser les IA
                </label>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleCreateRoom}
              disabled={state.isLoading}
              loading={state.isLoading}
            >
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
              <Button
                variant="primary"
                onClick={() => handleJoinRoom()}
                disabled={!roomCode || state.isLoading}
                loading={state.isLoading}
              >
                Rejoindre
              </Button>
            </div>
          </div>

        </div>

        {state.error && (
          <div className="error-message">
            {state.error}
          </div>
        )}
      </div>
    </div>
  )
}

export default GameLobby