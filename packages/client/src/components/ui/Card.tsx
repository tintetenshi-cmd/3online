import React from 'react'
import './Card.css'

type CardVariant = 'center' | 'hand'

type Props = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant
  peekable?: boolean
  selectable?: boolean
  disabled?: boolean
}

const Card: React.FC<Props> = ({
  variant = 'center',
  peekable = true,
  selectable = false,
  disabled = false,
  className = '',
  children,
  ...props
}) => {
  const classes = [
    'card',
    `card--${variant}`,
    peekable && 'card--peekable',
    selectable && 'card--selectable',
    disabled && 'card--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...props}>
      <div className="card__inner">{children}</div>
    </div>
  )
}

export default Card

