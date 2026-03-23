import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGame } from '../contexts/SimpleGame'
import { ActionType, CardLocation, generateUUID, getCardStyle } from '@3online/shared'
import Button from './ui/Button'
import Card from './ui/Card'
import { pseudoTextStyle } from '../utils/pseudoStyle'
import AvatarBadge from './ui/AvatarBadge'
import './GameBoard.css'

const GameBoard: React.FC = () => {
  const navigate = useNavigate()
  const { roomId } = useParams()
  const { 
    state, 
    setCurrentView,
    sendGameAction, 
    sendChatMessage, 
    leaveRoom 
  } = useGame()
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [gameMessage, setGameMessage] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null)
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [trioNotifications, setTrioNotifications] = useState<Array<{id: string, type: 'success' | 'failure', message: string, player?: any, trioNumber?: number}>>([])

  // Rediriger si pas dans une partie
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!state.gameState && state.currentView !== 'game') {
        console.log('Pas de gameState après délai, retour au lobby')
        navigate('/lobby')
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [state.gameState, state.currentView, navigate])

  // S'assurer que currentView est 'game' quand on est sur cette route
  useEffect(() => {
    if (state.currentView !== 'game') {
      setCurrentView('game')
    }
  }, [state.currentView, setCurrentView])

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024)
    }
    
    checkMobile()
    
    // Optimisation : utiliser requestAnimationFrame pour le resize
    let rafId: number
    const handleResize = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(checkMobile)
    }
    
    window.addEventListener('resize', handleResize, { passive: true })
    
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  // Écouter les événements de jeu pour afficher les messages
  useEffect(() => {
    const socket = (window as any).gameSocket
    if (!socket) return

    // Test immédiat de popup
    const testNotification = () => {
      const testPlayer = state.gameState?.players[0]
      if (testPlayer) {
        const notificationId = generateUUID()
        console.log('Test popup trio - joueur:', testPlayer.name)
        setTrioNotifications(prev => [...prev, {
          id: notificationId,
          type: 'success',
          message: `Trio de 7 réussi !`,
          player: testPlayer,
          trioNumber: 7
        }])

        setTimeout(() => {
          setTrioNotifications(prev => prev.filter(n => n.id !== notificationId))
        }, 3000)
      }
    }

    // Lancer un test après 2 secondes
    const testTimer = setTimeout(testNotification, 2000)

    // Test manuel avec bouton
    const manualTest = () => {
      console.log('Test manuel popup')
      testNotification()
    }

    // Ajouter un bouton de test temporaire
    window.testTrioPopup = manualTest

    // Optimisation : mémoriser les handlers pour éviter les recréations
    const handleTrioFormed = (trio: any, playerId: string) => {
      const player = state.gameState?.players.find(p => p.id === playerId)
      if (player) {
        setGameMessage({
          text: `${player.name} a formé un trio de ${trio.number} !`,
          type: 'success'
        })
        setTimeout(() => setGameMessage(null), 3000)

        // Fermer la modale si elle est ouverte
        setShowPlayerModal(false)
        setSelectedAction(null)
        setSelectedPlayer(null)

        // Ajouter popup de trio réussi
        const notificationId = generateUUID()
        setTrioNotifications(prev => [...prev, {
          id: notificationId,
          type: 'success',
          message: `Trio réussi !`,
          player,
          trioNumber: trio.number
        }])

        // Supprimer la popup après 3 secondes
        setTimeout(() => {
          setTrioNotifications(prev => prev.filter(n => n.id !== notificationId))
        }, 3000)
      }
    }

    const handleTrioFailed = (playerId: string) => {
      const player = state.gameState?.players.find(p => p.id === playerId)
      if (player) {
        setGameMessage({
          text: `${player.name} a échoué à former un trio`,
          type: 'error'
        })
        setTimeout(() => setGameMessage(null), 3000)

        // Fermer la modale si elle est ouverte
        setShowPlayerModal(false)
        setSelectedAction(null)
        setSelectedPlayer(null)

        // Ajouter popup d'échec de trio
        const notificationId = generateUUID()
        setTrioNotifications(prev => [...prev, {
          id: notificationId,
          type: 'failure',
          message: `Trio échoué`,
          player
        }])

        // Supprimer la popup après 3 secondes
        setTimeout(() => {
          setTrioNotifications(prev => prev.filter(n => n.id !== notificationId))
        }, 3000)
      }
    }

    const handleCardRevealed = (card: any, playerId: string) => {
      const player = state.gameState?.players.find(p => p.id === playerId)
      if (player && playerId !== state.playerId) {
        // Notification pour trio réussi/échec basé sur la carte révélée
        const notificationId = generateUUID()
        const isSuccess = Math.random() > 0.5 // Simulation de réussite/échec
        
        setTrioNotifications(prev => [...prev, {
          id: notificationId,
          type: isSuccess ? 'success' : 'failure',
          message: isSuccess ? `Trio de ${card.number} réussi !` : `Trio de ${card.number} échoué`,
          player,
          trioNumber: card.number
        }])

        // Supprimer la popup après 3 secondes
        setTimeout(() => {
          setTrioNotifications(prev => prev.filter(n => n.id !== notificationId))
        }, 3000)
      }
    }

    // Écouter tous les événements possibles
    socket.on('trioFormed', handleTrioFormed)
    socket.on('trioFailed', handleTrioFailed)
    socket.on('cardRevealed', handleCardRevealed)
    socket.on('gameAction', (action: any) => {
      console.log('Game action reçu:', action)
      // Détecter si c'est une action de trio
      if (action.actionType === 'FORM_TRIO' || action.actionType === 'REVEAL_PLAYER_SMALLEST' || action.actionType === 'REVEAL_PLAYER_LARGEST') {
        // Fermer la modale lors d'une action de trio
        setShowPlayerModal(false)
        setSelectedAction(null)
        setSelectedPlayer(null)
        
        const player = state.gameState?.players.find(p => p.id === action.playerId)
        if (player) {
          const notificationId = generateUUID()
          const isSuccess = Math.random() > 0.5
          
          setTrioNotifications(prev => [...prev, {
            id: notificationId,
            type: isSuccess ? 'success' : 'failure',
            message: isSuccess ? `Trio réussi !` : `Trio échoué`,
            player,
            trioNumber: Math.floor(Math.random() * 9) + 1
          }])

          setTimeout(() => {
            setTrioNotifications(prev => prev.filter(n => n.id !== notificationId))
          }, 3000)
        }
      }
    })

    return () => {
      clearTimeout(testTimer)
      socket.off('trioFormed', handleTrioFormed)
      socket.off('trioFailed', handleTrioFailed)
      socket.off('cardRevealed', handleCardRevealed)
      socket.off('gameAction')
    }
  }, [state.gameState])

  if (!state.gameState || !state.roomState) {
    return (
      <div className="game-board game-board--loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement de la partie...</p>
        </div>
      </div>
    )
  }

  const currentPlayer = state.gameState.players.find((p: any) => p.id === state.gameState!.currentPlayerId)
  const isMyTurn = state.gameState.currentPlayerId === state.playerId
  const myPlayer = state.gameState.players.find((p: any) => p.id === state.playerId)

  const handleActionSelect = (actionType: ActionType) => {
    setSelectedAction(actionType)
  }

  const handleCenterCardClick = async (cardId: string) => {
    if (!isMyTurn || selectedAction !== ActionType.REVEAL_CENTER_CARD) return

    try {
      const action = {
        actionId: generateUUID(),
        playerId: state.playerId!,
        actionType: ActionType.REVEAL_CENTER_CARD,
        targetCard: { cardId, location: CardLocation.CENTER },
        timestamp: Date.now(),
      }

      await sendGameAction(action)
      setSelectedAction(null)
    } catch (error) {
      console.error('Erreur lors de l\'action:', error)
    }
  }

  const handlePlayerCardAction = async (playerId: string, actionType: ActionType) => {
    const action = {
      actionType,
      targetPlayerId: playerId,
      playerId: state.playerId
    }
    await sendGameAction(action)
    setSelectedAction(null)
    setSelectedPlayer(null)
    setShowPlayerModal(false) // Fermer la modale immédiatement après l'action
  }

  const closePlayerModal = () => {
    setShowPlayerModal(false)
    setSelectedAction(null)
    setSelectedPlayer(null)
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

  const handleLeaveGame = async () => {
    if (confirm('Êtes-vous sûr de vouloir quitter la partie ?')) {
      try {
        await leaveRoom()
        navigate('/lobby')
      } catch (error) {
        console.error('Erreur lors de la sortie:', error)
      }
    }
  }

  // Déterminer le message de tour
  const getTurnMessage = () => {
    if (!currentPlayer) return { text: 'En attente...', type: 'info' as const }
    
    if (isMyTurn) {
      return { text: 'À votre tour', type: 'info' as const }
    } else if (currentPlayer.isAI) {
      return { text: `${currentPlayer.name} réfléchit...`, type: 'info' as const }
    } else {
      return { text: `Tour de ${currentPlayer.name}`, type: 'info' as const }
    }
  }

  const turnMessage = getTurnMessage()

  return (
    <div className="game-board">
      <div id="game-container">
      {/* Header */}
      <header className="game-header">
        <div className="game-title">
          <h1>3online</h1>
          <div className="room-code">Salle: {state.roomState.info.code}</div>
          {isMobile && (
            <button 
              className="chat-toggle-btn" 
              onClick={() => setIsChatOpen(!isChatOpen)}
              aria-label={isChatOpen ? "Fermer le chat" : "Ouvrir le chat"}
            >
              {isChatOpen ? '✕' : '💬'}
            </button>
          )}
        </div>
        <Button
          variant="ghost"
          size="small"
          onClick={handleLeaveGame}
          className="leave-btn"
        >
          ← Quitter
        </Button>
      </header>

      {/* Joueurs (colonne gauche) */}
      <aside className="opponents-section" aria-label="Joueurs">
        {state.gameState.players
          .filter(p => p.id !== state.playerId)
          .map((player) => (
            <div
              key={player.id}
              className={`opponent-card ${
                player.id === state.gameState!.currentPlayerId ? 'current-player' : ''
              }`}
            >
              <div className="opponent-header">
                <div className="opponent-avatar">
                  <AvatarBadge avatar={player.avatar} seed={(player as any).avatarSeed || player.id || player.name} size={32} />
                </div>
                <div className="opponent-info">
                  {(() => {
                    const t = pseudoTextStyle((player as any).nameColor)
                    return (
                      <span className={`opponent-name pseudo-text ${t.extraClass}`} style={t.style}>
                        {player.name}
                      </span>
                    )
                  })()}
                  {player.isAI && <span className="ai-badge">IA</span>}
                </div>
              </div>
              <div className="opponent-stats">
                <span>{player.hand.length} cartes</span>
                <span>{player.trios.length} trios</span>
              </div>
              {player.trios.length > 0 && (
                <div className="opponent-trios">
                  {player.trios.map((trio, index) => (
                    <div
                      key={index}
                      className="trio-badge"
                      style={getCardStyle(trio.number)}
                    >
                      {trio.number}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
      </aside>

      {/* Centre (zone de jeu) */}
      <main className="game-center" aria-label="Plateau">
        <section className="center-cards-section" aria-label="Cartes du centre">
          <div className="center-cards">
            {state.gameState.centerCards.map((card) => {
              const selectable = selectedAction === ActionType.REVEAL_CENTER_CARD && !card.isRevealed
              return (
                <Card
                  key={card.id}
                  variant="center"
                  className={`center-card ${card.isRevealed ? 'revealed' : 'hidden'}`}
                  selectable={selectable}
                  peekable={!card.isRevealed}
                  style={card.isRevealed ? getCardStyle(card.number) : undefined}
                  onClick={() => handleCenterCardClick(card.id)}
                  role="button"
                  aria-disabled={!selectable}
                >
                  {card.isRevealed ? (
                    <span className="card-number">{card.number}</span>
                  ) : (
                    <span className="card-back">?</span>
                  )}
                </Card>
              )
            })}
          </div>
        </section>

        <section className="turn-status-section" aria-label="Statut du tour">
          <div className={`turn-indicator ${turnMessage.type}`}>
            <div className="turn-content">
              <span className="turn-text">{turnMessage.text}</span>
              {currentPlayer?.isAI && isMyTurn === false && (
                <div className="thinking-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
            </div>
          </div>

          {gameMessage && (
            <div className={`game-message ${gameMessage.type}`}>
              {gameMessage.text}
            </div>
          )}
        </section>

        {state.gameState.revealedCards.length > 0 && (
          <section className="revealed-section" aria-label="Cartes révélées">
            <h3>Cartes révélées</h3>
            <div className="revealed-cards">
              {state.gameState.revealedCards.map((card) => (
                <Card
                  key={card.id}
                  variant="center"
                  peekable={false}
                  className="revealed-card"
                  style={getCardStyle(card.number)}
                >
                  <span className="card-number">{card.number}</span>
                </Card>
              ))}
            </div>
          </section>
        )}

        {isMyTurn && (
          <section className="actions-section" aria-label="Actions">
            <div className="action-buttons">
              <Button
                variant={selectedAction === ActionType.REVEAL_CENTER_CARD ? 'primary' : 'secondary'}
                size="medium"
                onClick={() => setSelectedAction(
                  selectedAction === ActionType.REVEAL_CENTER_CARD
                    ? null
                    : ActionType.REVEAL_CENTER_CARD
                )}
              >
                Révéler centre
              </Button>
              <Button
                variant={selectedAction === ActionType.REVEAL_PLAYER_SMALLEST ? 'primary' : 'secondary'}
                size="medium"
                onClick={() => handleActionSelect(
                  selectedAction === ActionType.REVEAL_PLAYER_SMALLEST
                    ? ActionType.REVEAL_CENTER_CARD
                    : ActionType.REVEAL_PLAYER_SMALLEST
                )}
              >
                Plus petite
              </Button>
              <Button
                variant={selectedAction === ActionType.REVEAL_PLAYER_LARGEST ? 'primary' : 'secondary'}
                size="medium"
                onClick={() => handleActionSelect(
                  selectedAction === ActionType.REVEAL_PLAYER_LARGEST
                    ? ActionType.REVEAL_CENTER_CARD
                    : ActionType.REVEAL_PLAYER_LARGEST
                )}
              >
                Plus grande
              </Button>
            </div>
          </section>
        )}
      </main>

      {/* Chat (colonne droite) */}
      <aside className={`chat-sidebar ${isMobile && isChatOpen ? 'mobile-visible' : ''}`} aria-label="Chat">
          <div className="chat-header">
            <h3>💬 Chat</h3>
          </div>
          <div className="chat-messages">
            {state.chatMessages.slice(-20).map((message) => {
              const author = state.gameState?.players.find((p: any) => p.id === message.playerId)
              const t = pseudoTextStyle((author as any)?.nameColor)

              return (
                <div key={message.id} className={`chat-message ${message.isSystemMessage ? 'system' : ''}`}>
                  {!message.isSystemMessage && (
                    <span className="message-author">
                      <AvatarBadge
                        avatar={(author as any)?.avatar}
                        seed={(author as any)?.avatarSeed || (author as any)?.id || message.playerName}
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
              placeholder="Message..."
              maxLength={100}
            />
            <Button type="submit" variant="primary" size="small">
              →
            </Button>
          </form>
      </aside>

      {/* Main (bas) */}
      {myPlayer && myPlayer.hand.length > 0 && (
        <footer className="player-hand-bar" aria-label="Main du joueur">
          <div className="player-hand-info">
            <div className="hand-info">
              <span className="hand-count">Ma main ({myPlayer.hand.length})</span>
              <span className="trio-count">Trios: {myPlayer.trios.length}</span>
            </div>

            {myPlayer.trios.length > 0 && (
              <div className="my-trios-display">
                {myPlayer.trios.map((trio, index) => (
                  <div
                    key={index}
                    className="my-trio-mini"
                    style={getCardStyle(trio.number)}
                  >
                    {trio.number}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="player-hand-cards" onMouseLeave={() => setHoveredCardIndex(null)}>
            {myPlayer.hand.map((card, index) => (
              <Card
                key={card.id}
                variant="hand"
                className={`player-hand-card ${hoveredCardIndex === index ? 'hovered' : ''}`}
                style={getCardStyle(card.number)}
                onMouseEnter={() => setHoveredCardIndex(index)}
              >
                <span className="card-number">{card.number}</span>
              </Card>
            ))}
          </div>
        </footer>
      )}

      {state.error && (
        <div className="error-message">
          {state.error}
        </div>
      )}

      {/* Bouton toggle chat mobile */}
      {isMobile && (
        <button
          className={`chat-toggle-btn ${isChatOpen ? 'chat-open' : ''}`}
          onClick={() => setIsChatOpen(!isChatOpen)}
          aria-label={isChatOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
        >
          {isChatOpen ? '✕' : '💬'}
        </button>
      )}

      {/* Popup de trio */}
      {trioNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`trio-popup ${notification.type}`}
        >
          <div className="trio-popup-icon">
            {notification.type === 'success' ? '🎉' : '❌'}
          </div>
          <AvatarBadge
            avatar={notification.player?.avatar}
            seed={notification.player?.avatarSeed || notification.player?.id}
            size={80}
            className="trio-popup-avatar"
          />
          <div className="trio-popup-title">
            {notification.type === 'success' ? 'Trio Réussi !' : 'Trio Échoué'}
          </div>
          <div className="trio-popup-player">
            {notification.player?.name}
          </div>
          {notification.trioNumber && (
            <div className="trio-popup-number">
              {notification.trioNumber}
            </div>
          )}
        </div>
      ))}

      {/* Modale de sélection de joueur */}
      {showPlayerModal && (
        <div className="player-modal-overlay" onClick={closePlayerModal}>
          <div className="player-modal" onClick={(e) => e.stopPropagation()}>
            <div className="player-modal-header">
              <h3>Choisissez un joueur</h3>
              <button className="modal-close-btn" onClick={closePlayerModal} aria-label="Fermer">
                ✕
              </button>
            </div>
            <div className="player-modal-content">
              <p>
                {selectedAction === ActionType.REVEAL_PLAYER_SMALLEST 
                  ? 'Révéler la plus petite carte du joueur :' 
                  : 'Révéler la plus grande carte du joueur :'
                }
              </p>
              <div className="player-modal-buttons">
                {state.gameState.players
                  .filter(p => p.hand.length > 0)
                  .map((player) => (
                    <Button
                      key={player.id}
                      variant="ghost"
                      size="medium"
                      onClick={() => handlePlayerCardAction(player.id, selectedAction!)}
                      className="player-modal-btn"
                    >
                      <div className="player-modal-btn-content">
                        <AvatarBadge
                          avatar={(player as any).avatar}
                          seed={(player as any).avatarSeed || player.id}
                          size={32}
                          className="player-modal-avatar"
                        />
                        <div className="player-modal-info">
                          <span 
                            className={`pseudo-text ${pseudoTextStyle((player as any).nameColor).extraClass}`} 
                            style={pseudoTextStyle((player as any).nameColor).style}
                          >
                            {player.name}
                          </span>
                          <span className="player-modal-cards">{player.hand.length} cartes</span>
                        </div>
                      </div>
                    </Button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default GameBoard