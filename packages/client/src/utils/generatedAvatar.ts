import { createAvatar } from '@dicebear/core'
import { create, meta } from '@dicebear/avataaars'

function hashSeed(input: string): string {
  // djb2-ish: stable, fast, good enough for prefixing ids
  let h = 5381
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}

function prefixSvgIds(svg: string, prefix: string): string {
  // Prefix ids & references to avoid collisions between multiple inline SVG instances
  // Handles: id="x", url(#x), href="#x", xlink:href="#x"
  const idRe = /\bid="([^"]+)"/g
  const urlRe = /url\(#([^)]+)\)/g
  const hrefRe = /\b(href|xlink:href)="#([^"]+)"/g

  const map = new Map<string, string>()
  let m: RegExpExecArray | null
  while ((m = idRe.exec(svg))) {
    const id = m[1]
    if (!map.has(id)) map.set(id, `${prefix}-${id}`)
  }

  let out = svg
  for (const [from, to] of map) {
    out = out.replaceAll(`id="${from}"`, `id="${to}"`)
  }

  out = out.replace(urlRe, (_full, id) => `url(#${map.get(id) || `${prefix}-${id}`})`)
  out = out.replace(hrefRe, (_full, attr, id) => `${attr}="#${map.get(id) || `${prefix}-${id}`}"`)
  return out
}

export function generatedAvatarSvg(seed: string, size: number = 128): string {
  const normalizedSeed = seed || '3online'
  const raw = createAvatar({ create, meta }, {
    seed: seed || '3online',
    size,
    // Évite le "style circle" qui peut créer un disque sombre en fond
    style: ['default'],
  }).toString()

  return prefixSvgIds(raw, `a${hashSeed(normalizedSeed)}`)
}

