import React from 'react'

export function isGradient(value?: string) {
  return !!value && value.includes('gradient(')
}

export function pseudoTextStyle(value?: string): { extraClass: string; style: React.CSSProperties } {
  if (!value) return { extraClass: '', style: {} }

  if (isGradient(value)) {
    return {
      extraClass: 'pseudo-text--gradient',
      style: {
        backgroundImage: value,
      },
    }
  }

  return {
    extraClass: '',
    style: { color: value },
  }
}

