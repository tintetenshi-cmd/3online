import React from 'react'
import { useTheme } from '../contexts/ThemeContext'
import Button from './ui/Button'

type Props = {
  className?: string
}

const WorkModeToggle: React.FC<Props> = ({ className = '' }) => {
  const { mode, toggle } = useTheme()

  return (
    <Button
      variant="ghost"
      size="small"
      onClick={toggle}
      className={className}
      aria-pressed={mode === 'work'}
      title={mode === 'work' ? 'Revenir au thème normal' : 'Activer le mode travail'}
      aria-label={mode === 'work' ? 'Mode normal' : 'Mode travail'}
    >
      <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
        {mode === 'work' ? '🕹️' : '💼'}
      </span>
    </Button>
  )
}

export default WorkModeToggle

