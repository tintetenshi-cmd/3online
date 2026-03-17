import React, { useState } from 'react'
import { AvatarType } from '@3online/shared'
import Button from './ui/Button'
import AvatarBadge from './ui/AvatarBadge'
import './PlayerSetup.css'

interface PlayerSetupProps {
  onComplete: (name: string, avatar: AvatarType, avatarSeed: string, nameColor: string) => void
  onCancel?: () => void
  initialName?: string
  initialAvatar?: AvatarType
  initialAvatarSeed?: string
  initialNameColor?: string
}

const AVATARS = [
  { id: AvatarType.GENERATED, name: 'Généré', emoji: '🃏' },
  { id: AvatarType.AVATAR_1, name: 'Disquette', emoji: '💾' },
  { id: AvatarType.AVATAR_2, name: 'Alien', emoji: '👽' },
  { id: AvatarType.AVATAR_3, name: 'Robot', emoji: '🤖' },
  { id: AvatarType.AVATAR_4, name: 'Fantôme', emoji: '👻' },
  { id: AvatarType.AVATAR_5, name: 'Étoile', emoji: '⭐' },
  { id: AvatarType.AVATAR_6, name: 'Diamant', emoji: '💎' },
  { id: AvatarType.AVATAR_7, name: 'Renard', emoji: '🦊' },
  { id: AvatarType.AVATAR_8, name: 'Hibou', emoji: '🦉' },
  { id: AvatarType.AVATAR_9, name: 'Poulpe', emoji: '🐙' },
  { id: AvatarType.AVATAR_10, name: 'Planète', emoji: '🪐' },
  { id: AvatarType.AVATAR_11, name: 'Cerveau', emoji: '🧠' },
  { id: AvatarType.AVATAR_12, name: 'Puzzle', emoji: '🧩' },
]

const NAME_STYLES: Array<{ id: string; label: string; value: string }> = [
  // Solides (pastel)
  { id: 'lavender', label: 'Lavender', value: '#E9D5FF' },
  { id: 'violet', label: 'Violet', value: '#C4B5FD' },
  { id: 'blue', label: 'Bleu', value: '#93C5FD' },
  { id: 'sky', label: 'Ciel', value: '#DBEAFE' },
  { id: 'pink', label: 'Rose', value: '#FBCFE8' },
  { id: 'amber', label: 'Ambre', value: '#FDE68A' },
  { id: 'mint', label: 'Menthe', value: '#A7F3D0' },
  { id: 'white', label: 'Blanc', value: '#FFFFFF' },

  // Gradients (modernes, lisibles)
  { id: 'g1', label: 'Violet → Bleu', value: 'linear-gradient(90deg, #C4B5FD, #93C5FD)' },
  { id: 'g2', label: 'Lavande → Ciel', value: 'linear-gradient(90deg, #E9D5FF, #DBEAFE)' },
  { id: 'g3', label: 'Rose → Lavande', value: 'linear-gradient(90deg, #FBCFE8, #E9D5FF)' },
  { id: 'g4', label: 'Menthe → Ciel', value: 'linear-gradient(90deg, #A7F3D0, #DBEAFE)' },
  { id: 'g5', label: 'Ambre → Rose', value: 'linear-gradient(90deg, #FDE68A, #FBCFE8)' },
  { id: 'g6', label: 'Violet → Rose', value: 'linear-gradient(90deg, #C4B5FD, #FBCFE8)' },
  { id: 'g7', label: 'Bleu → Menthe', value: 'linear-gradient(90deg, #93C5FD, #A7F3D0)' },
  { id: 'g8', label: 'Ciel → Violet', value: 'linear-gradient(90deg, #DBEAFE, #C4B5FD)' },
  { id: 'g9', label: 'Rose → Bleu', value: 'linear-gradient(90deg, #FBCFE8, #93C5FD)' },
  { id: 'g10', label: 'Lavande → Menthe', value: 'linear-gradient(90deg, #E9D5FF, #A7F3D0)' },
  { id: 'g11', label: 'Violet deep', value: 'linear-gradient(90deg, #A78BFA, #C4B5FD)' },
  { id: 'g12', label: 'Indigo → Sky', value: 'linear-gradient(90deg, #818CF8, #93C5FD)' },
  { id: 'g13', label: 'Rose → Menthe', value: 'linear-gradient(90deg, #FBCFE8, #A7F3D0)' },
  { id: 'g14', label: 'Ambre → Ciel', value: 'linear-gradient(90deg, #FDE68A, #DBEAFE)' },
  { id: 'g15', label: 'Menthe → Lavande', value: 'linear-gradient(90deg, #A7F3D0, #E9D5FF)' },
  { id: 'g16', label: 'Ciel → Rose', value: 'linear-gradient(90deg, #DBEAFE, #FBCFE8)' },
  { id: 'g17', label: 'Indigo → Lavande', value: 'linear-gradient(90deg, #818CF8, #E9D5FF)' },
  { id: 'g18', label: 'Violet → Ciel', value: 'linear-gradient(90deg, #A78BFA, #DBEAFE)' },
  { id: 'g19', label: 'Violet → Menthe', value: 'linear-gradient(90deg, #C4B5FD, #A7F3D0)' },
  { id: 'g20', label: 'Rose → Ambre', value: 'linear-gradient(90deg, #FBCFE8, #FDE68A)' },
]

const PlayerSetup: React.FC<PlayerSetupProps> = ({
  onComplete,
  onCancel,
  initialName = '',
  initialAvatar = AvatarType.AVATAR_1,
  initialAvatarSeed = '',
  initialNameColor = '#E9D5FF',
}) => {
  const [name, setName] = useState(initialName)
  const [selectedAvatar, setSelectedAvatar] = useState(initialAvatar)
  const [avatarSeed, setAvatarSeed] = useState(initialAvatarSeed)
  const [nameColor, setNameColor] = useState(initialNameColor)
  const [nameError, setNameError] = useState('')

  const isGenerated = selectedAvatar === AvatarType.GENERATED

  const generateSeed = () => {
    const base = (name || '3online').trim().slice(0, 20).replace(/\s+/g, '-')
    const rand = Math.random().toString(36).slice(2, 10)
    setAvatarSeed(`${base}-${rand}`)
  }

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setNameError('Le nom est requis')
      return false
    }
    if (value.trim().length < 2) {
      setNameError('Le nom doit contenir au moins 2 caractères')
      return false
    }
    if (value.trim().length > 20) {
      setNameError('Le nom ne peut pas dépasser 20 caractères')
      return false
    }
    if (!/^[a-zA-Z0-9À-ÿ\s-_]+$/.test(value.trim())) {
      setNameError('Le nom contient des caractères non autorisés')
      return false
    }
    setNameError('')
    return true
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    if (nameError) {
      validateName(value)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateName(name)) {
      const seedToSend = isGenerated ? (avatarSeed || name.trim()) : ''
      onComplete(name.trim(), selectedAvatar, seedToSend, nameColor)
    }
  }

  return (
    <div className="player-setup">
      <div className="player-setup__overlay" onClick={onCancel} />
      
      <div className={`player-setup__panel-row ${isGenerated ? 'player-setup__panel-row--with-preview' : ''}`}>
        <div className="player-setup__modal">
          <div className="player-setup__header">
            <h2>Configuration du joueur</h2>
            <p>Choisissez votre nom et votre avatar</p>
          </div>

          <form onSubmit={handleSubmit} className="player-setup__form">
            {/* Nom du joueur */}
            <div className="form-group">
              <label htmlFor="player-name" className="form-label">
                Nom du joueur
              </label>
              <input
                id="player-name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Entrez votre nom..."
                className={`form-input ${nameError ? 'form-input--error' : ''}`}
                maxLength={20}
                autoFocus
              />
              {nameError && <div className="form-error">{nameError}</div>}
            </div>

            {/* Sélection d'avatar */}
            <div className="form-group">
              <label className="form-label">Avatar</label>
              <div className="avatar-grid">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    className={`avatar-option ${selectedAvatar === avatar.id ? 'avatar-option--selected' : ''}`}
                    onClick={() => {
                      setSelectedAvatar(avatar.id)
                      if (avatar.id !== AvatarType.GENERATED) setAvatarSeed('')
                      if (avatar.id === AvatarType.GENERATED && !avatarSeed) generateSeed()
                    }}
                    title={avatar.name}
                  >
                    <span className="avatar-emoji">{avatar.emoji}</span>
                    <span className="avatar-name">{avatar.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Couleur du pseudo */}
            <div className="form-group">
              <label className="form-label">Couleur du pseudo</label>
              <div className="name-color-row">
                <div className="name-color-swatches" role="list">
                  {NAME_STYLES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`color-swatch ${nameColor === s.value ? 'color-swatch--selected' : ''}`}
                      style={
                        s.value.includes('gradient(')
                          ? ({ backgroundImage: s.value } as React.CSSProperties)
                          : ({ backgroundColor: s.value } as React.CSSProperties)
                      }
                      onClick={() => setNameColor(s.value)}
                      title={s.label}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  className="color-picker"
                  value={nameColor}
                  onChange={(e) => setNameColor(e.target.value)}
                  aria-label="Choisir une couleur"
                />
              </div>
              <div className="name-preview">
                Aperçu:{' '}
                <span
                  className={nameColor.includes('gradient(') ? 'pseudo-text pseudo-text--gradient' : 'pseudo-text'}
                  style={{
                    ...(nameColor.includes('gradient(')
                      ? ({ backgroundImage: nameColor } as React.CSSProperties)
                      : ({ color: nameColor } as React.CSSProperties)),
                    fontWeight: 700,
                  }}
                >
                  {name.trim() || 'Votre pseudo'}
                </span>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="player-setup__actions">
              {onCancel && (
                <Button type="button" variant="ghost" onClick={onCancel}>
                  Annuler
                </Button>
              )}
              <Button type="submit" variant="primary" disabled={!name.trim() || !!nameError}>
                Confirmer
              </Button>
            </div>
          </form>
        </div>

        {isGenerated && (
          <aside className="player-setup__preview player-setup__preview--outside" aria-label="Génération d'avatar">
            <div className="player-setup__preview-header">
              <span>Génération</span>
              <Button type="button" variant="secondary" size="small" onClick={generateSeed}>
                Générer
              </Button>
            </div>
            <div className="player-setup__preview-body">
              <AvatarBadge avatar={AvatarType.GENERATED} seed={avatarSeed || '🃏'} size={140} />
              <div className="player-setup__preview-seed">{avatarSeed || '—'}</div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

export default PlayerSetup