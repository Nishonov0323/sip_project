import type { CSSProperties } from 'react'
import styles from './Avatar.module.css'

function initials(label: string): string {
  const text = label.trim()
  if (!text) return '?'
  if (/^[\d*#+]+$/.test(text)) return text.slice(-2)
  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function hueOf(seed: string): number {
  // FNV-1a: yaqin raqamlar (1001/1002) ham ancha farqli rang olishi uchun.
  let hash = 2166136261
  for (const ch of seed) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619)
  return (hash >>> 0) % 360
}

interface Props {
  label: string
  /** Rang shu qiymatdan hosil bo'ladi (odatda raqamning o'zi). */
  seed?: string
  size?: number
  pulse?: boolean
}

export function Avatar({ label, seed = label, size = 40, pulse }: Props) {
  const style = { '--h': hueOf(seed), '--size': `${size}px` } as CSSProperties
  return (
    <span className={`${styles.avatar} ${pulse ? styles.pulse : ''}`} style={style}>
      {initials(label)}
    </span>
  )
}
