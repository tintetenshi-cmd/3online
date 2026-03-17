import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../contexts/SimpleGame'
import PlayerSetup from './PlayerSetup'
import Button from './ui/Button'
import './MainMenu.css'

import { pseudoTextStyle } from '../utils/pseudoStyle'
import AvatarBadge from './ui/AvatarBadge'

const MainMenu: React.FC = () => {
  const navigate = useNavigate()
  const { playerInfo, setPlayerInfo } = useGame()
  const [showPlayerSetup, setShowPlayerSetup] = useState(!playerInfo)

  const handlePlayerSetupComplete = (name: string, avatar: string, avatarSeed: string, nameColor: string) => {
    setPlayerInfo({ name, avatar, avatarSeed, nameColor })
    setShowPlayerSetup(false)
  }

  const handlePlay = () => {
    if (!playerInfo) {
      setShowPlayerSetup(true)
      return
    }
    navigate('/lobby')
  }

  const handleRules = () => {
    navigate('/rules')
  }

  if (showPlayerSetup) {
    return (
      <PlayerSetup
        onComplete={handlePlayerSetupComplete}
        onCancel={() => setShowPlayerSetup(false)}
        initialName={playerInfo?.name || ''}
        initialAvatar={(playerInfo?.avatar as any) || undefined}
        initialAvatarSeed={playerInfo?.avatarSeed || ''}
        initialNameColor={playerInfo?.nameColor || '#E9D5FF'}
      />
    )
  }

  return (
    <div className="main-menu">
      <div className="main-menu__container">
        {/* Header avec titre */}
        <header className="main-menu__header">
          <h1 className="main-menu__title">
            <span className="title-3">3</span>
            <span className="title-online">online</span>
          </h1>
          <p className="main-menu__subtitle">
            Jeu de cartes multijoueur inspiré de Trio
          </p>
        </header>

        {/* Informations du joueur */}
        {playerInfo && (
          <div className="main-menu__player-info">
            <div className="player-card">
              <div className="player-avatar">
                <AvatarBadge
                  avatar={playerInfo.avatar}
                  seed={playerInfo.avatarSeed || playerInfo.name}
                  size={56}
                  className="avatar-badge--menu"
                  title="Avatar"
                />
              </div>
              <div className="player-details">
                {(() => {
                  const t = pseudoTextStyle(playerInfo.nameColor)
                  return (
                    <h3 className={`pseudo-text ${t.extraClass}`} style={t.style}>
                      {playerInfo.name}
                    </h3>
                  )
                })()}
                <button 
                  className="change-player-btn"
                  onClick={() => setShowPlayerSetup(true)}
                >
                  Changer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Menu principal */}
        <nav className="main-menu__nav">
          <Button
            variant="primary"
            size="large"
            onClick={handlePlay}
            className="main-menu__button"
          >
            <span className="button-icon">🎮</span>
            Jouer
          </Button>

          <Button
            variant="secondary"
            size="large"
            onClick={handleRules}
            className="main-menu__button"
          >
            <span className="button-icon">📖</span>
            Règles
          </Button>
        </nav>

        {/* Footer */}
        <footer className="main-menu__footer">
          <p>Version 1.0.0 • Inspiré de Trio (Cocktail Games)</p>
        </footer>
      </div>

      {/* Particules d'arrière-plan */}
      <div className="background-particles">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 20}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default MainMenu