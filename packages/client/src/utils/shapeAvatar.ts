function hashToUint32(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hsl(h: number, s: number, l: number, a: number = 1): string {
  const hh = ((h % 360) + 360) % 360
  return `hsla(${hh} ${s}% ${l}% / ${a})`
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function generatedShapeAvatarSvg(seed: string, size: number = 128): string {
  const s = (seed || '3online').trim()
  const rng = mulberry32(hashToUint32(s))

  // Palette néon flashy (violet/rose/bleu/menthe) stable mais très variée
  const baseHue = 245 + Math.floor((rng() - 0.5) * 120) // ~185-305
  const hue2 = baseHue + 55 + Math.floor(rng() * 60)
  const hue3 = baseHue - 45 - Math.floor(rng() * 50)
  const sat = clamp(78 + Math.floor(rng() * 18), 78, 96)
  const sat2 = clamp(82 + Math.floor(rng() * 16), 82, 98)

  const bgA = hsl(baseHue, sat, 62, 1)
  const bgB = hsl(hue2, sat2, 56, 1)
  const bgC = hsl(hue3, sat2, 60, 1)
  const neon1 = hsl(baseHue + 18, 98, 70, 0.92)
  const neon2 = hsl(hue2 + 8, 98, 68, 0.86)
  const neon3 = hsl(hue3 + 12, 98, 72, 0.78)
  const ink = 'rgba(7, 9, 20, 0.28)'

  const view = 100
  const shapes: string[] = []
  const defs: string[] = []

  const id = Math.floor(rng() * 1e9).toString(36)
  defs.push(`
    <linearGradient id="g-${id}" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${bgA}"/>
      <stop offset="0.55" stop-color="${bgB}"/>
      <stop offset="1" stop-color="${bgC}"/>
    </linearGradient>
    <radialGradient id="rg-${id}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(28 26) rotate(45) scale(90)">
      <stop offset="0" stop-color="rgba(255,255,255,0.80)"/>
      <stop offset="0.35" stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <filter id="glow-${id}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="2.8" result="b"/>
      <feColorMatrix in="b" type="matrix" values="
        1 0 0 0 0
        0 1 0 0 0
        0 0 1 0 0
        0 0 0 0.65 0" result="g"/>
      <feMerge>
        <feMergeNode in="g"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="soft-${id}" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="0.9"/>
    </filter>
  `.trim())

  // Background: gradient + highlight
  shapes.push(
    `<rect x="0" y="0" width="${view}" height="${view}" rx="50" fill="url(#g-${id})"/>`,
    `<rect x="0" y="0" width="${view}" height="${view}" rx="50" fill="url(#rg-${id})" opacity="0.75"/>`
  )

  // Big glow orbs
  const orbCount = 5 + Math.floor(rng() * 4)
  const orbColors = [neon1, neon2, neon3]
  for (let i = 0; i < orbCount; i++) {
    const cx = 10 + rng() * 80
    const cy = 10 + rng() * 80
    const r = 9 + rng() * 22
    const fill = orbColors[Math.floor(rng() * orbColors.length)]
    const op = 0.16 + rng() * 0.28
    shapes.push(
      `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" opacity="${op.toFixed(
        2
      )}" filter="url(#soft-${id})"/>`
    )
  }

  // Blobs (overlapping circles)
  const blobCount = 4 + Math.floor(rng() * 4)
  for (let i = 0; i < blobCount; i++) {
    const cx = 18 + rng() * 64
    const cy = 18 + rng() * 64
    const r = 10 + rng() * 20
    const fill = rng() < 0.33 ? neon1 : rng() < 0.66 ? neon2 : neon3
    const op = 0.18 + rng() * 0.26
    shapes.push(
      `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" opacity="${op.toFixed(
        2
      )}"/>`
    )
  }

  // Multiple polygons with glow
  const polyCount = 2 + Math.floor(rng() * 3)
  for (let p = 0; p < polyCount; p++) {
    const points: string[] = []
    const polySides = 3 + Math.floor(rng() * 4) // 3-6
    for (let i = 0; i < polySides; i++) {
      points.push(`${(10 + rng() * 80).toFixed(1)},${(10 + rng() * 80).toFixed(1)}`)
    }
    const fill = rng() < 0.5 ? neon1 : neon2
    const op = 0.10 + rng() * 0.16
    shapes.push(`<polygon points="${points.join(' ')}" fill="${fill}" opacity="${op.toFixed(2)}" filter="url(#glow-${id})"/>`)
  }

  // Orbital rings
  const ringCount = 2 + Math.floor(rng() * 3)
  for (let i = 0; i < ringCount; i++) {
    const cx = 50 + (rng() - 0.5) * 18
    const cy = 50 + (rng() - 0.5) * 18
    const r = 22 + rng() * 26
    const w = 1.4 + rng() * 2.2
    const op = 0.14 + rng() * 0.18
    const stroke = rng() < 0.5 ? neon2 : neon3
    shapes.push(
      `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="${stroke}" stroke-width="${w.toFixed(
        2
      )}" opacity="${op.toFixed(2)}" filter="url(#glow-${id})"/>`
    )
  }

  // Neon streaks / stripes
  const stripeCount = 10 + Math.floor(rng() * 10)
  for (let i = 0; i < stripeCount; i++) {
    const x1 = -10 + rng() * 30
    const y1 = 5 + rng() * 90
    const x2 = 110 - rng() * 30
    const y2 = 5 + rng() * 90
    const w = 1.2 + rng() * 2.6
    const op = 0.06 + rng() * 0.10
    const stroke = rng() < 0.35 ? neon1 : rng() < 0.7 ? neon2 : ink
    const filt = stroke === ink ? '' : ` filter="url(#glow-${id})"`
    shapes.push(`<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${stroke}" stroke-width="${w.toFixed(
      2
    )}" stroke-linecap="round" opacity="${op.toFixed(2)}"${filt}/>`)
  }

  // Sparkles / stars
  const sparkleCount = 10 + Math.floor(rng() * 10)
  for (let i = 0; i < sparkleCount; i++) {
    const cx = 18 + rng() * 64
    const cy = 18 + rng() * 64
    const r = 0.8 + rng() * 2.6
    const op = 0.25 + rng() * 0.65
    const fill = rng() < 0.7 ? 'rgba(255,255,255,0.95)' : neon1
    const filt = fill.includes('rgba') ? '' : ` filter="url(#glow-${id})"`
    shapes.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" opacity="${op.toFixed(2)}"${filt}/>`)
  }

  // Emoji + signe (déterministes)
  const EMOJIS = [
    '🃏', '🎴', '✨', '⭐', '🌙', '🪐', '🌈', '🔥', '💎', '🧊', '⚡', '🍀', '🦊', '🐙', '🦉', '🧠', '👑',
    '🎭', '🧪', '🧿', '🍓', '🍇', '🍉', '🍋', '🍍', '🥝', '🍒', '🍪', '🧁', '🍬', '🍭', '🍫', '😈',
    '🤖', '👽', '👻', '🦄', '🐲', '🐸', '🐼', '🦝', '🦦', '🦈', '🐳',
  ]
  const SIGNS = ['✦', '✧', '✷', '✹', '✪', '✶', '✸', '✺', '✖', '✚', '✚', '✱', '✲', '✳', '⟡', '⌁', '❖', '⟁', '⟠', '☄', '☾']
  const centerEmoji = EMOJIS[Math.floor(rng() * EMOJIS.length)]
  const sign = SIGNS[Math.floor(rng() * SIGNS.length)]

  // Text overlay (SVG). Note: emoji rendering depends on OS fonts, but works well on Windows.
  // Add subtle shadow by duplicating text with darker fill.
  const emojiY = 58

  // Signe: position aléatoire "safe" + couleur flashy contrastée (hue opposée au fond)
  const signX = 18 + rng() * 64
  const signY = 18 + rng() * 40
  const signHue = baseHue + 160 + Math.floor(rng() * 80) // loin du fond
  const signColor = hsl(signHue, 98, 74, 0.98)
  const signGlow = hsl(signHue, 98, 66, 0.7)
  shapes.push(
    // signe (petit) avec glow + outline pour lisibilité
    `<text x="${signX.toFixed(1)}" y="${signY.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="900" fill="${signGlow}" opacity="0.95" filter="url(#glow-${id})">${sign}</text>`,
    `<text x="${signX.toFixed(1)}" y="${(signY - 0.4).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="900" fill="${signColor}" stroke="rgba(0,0,0,0.28)" stroke-width="1.4" paint-order="stroke fill">${sign}</text>`,
    // emoji (très gros) avec léger relief
    `<text x="50" y="${emojiY}" text-anchor="middle" dominant-baseline="middle" font-size="48" font-weight="900" fill="rgba(0,0,0,0.24)">${centerEmoji}</text>`,
    `<text x="50" y="${emojiY - 0.9}" text-anchor="middle" dominant-baseline="middle" font-size="48" font-weight="900" fill="rgba(255,255,255,0.98)">${centerEmoji}</text>`
  )

  // Wrap in svg
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${view} ${view}" fill="none">
  <defs>
    ${defs.join('\n    ')}
  </defs>
  ${shapes.join('\n  ')}
</svg>`.trim()
}

