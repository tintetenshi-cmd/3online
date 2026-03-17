import React from 'react'
import { AvatarType } from '@3online/shared'
import { getAvatarEmoji } from '../../utils/avatar'
import { generatedShapeAvatarSvg } from '../../utils/shapeAvatar'
import './AvatarBadge.css'

type AvatarBadgeProps = {
  avatar?: string
  seed?: string
  size?: number
  className?: string
  title?: string
}

export default function AvatarBadge({
  avatar,
  seed = '',
  size = 28,
  className = '',
  title,
}: AvatarBadgeProps) {
  const isGenerated = avatar === AvatarType.GENERATED
  const style = { ['--avatar-size' as any]: `${size}px` } as React.CSSProperties

  if (isGenerated) {
    const svg = generatedShapeAvatarSvg(seed || '3online', Math.max(128, Math.round(size * 4)))
    return (
      <span
        className={`avatar-badge avatar-badge--generated ${className}`.trim()}
        style={style}
        title={title}
        aria-label={title}
      >
        <span
          className="avatar-badge__svg"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </span>
    )
  }

  return (
    <span
      className={`avatar-badge avatar-badge--emoji ${className}`.trim()}
      style={style}
      title={title}
      aria-label={title}
    >
      <span className="avatar-badge__emoji" aria-hidden="true">
        {getAvatarEmoji(avatar || '')}
      </span>
    </span>
  )
}

