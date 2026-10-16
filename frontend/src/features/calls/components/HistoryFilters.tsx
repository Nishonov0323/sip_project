import { useEffect, useState } from 'react'
import { Button, Icon } from '@/shared/ui'
import { STATUS_LABELS } from '../lib/callStatus'
import { EMPTY_FILTERS, type CallFilters } from '../types'
import styles from './HistoryFilters.module.css'

interface Props {
  value: CallFilters
  onChange: (value: CallFilters) => void
}

const STATUS_OPTIONS = ['completed', 'missed', 'answered', 'ringing'] as const

export function isFiltered(f: CallFilters): boolean {
  return (Object.keys(EMPTY_FILTERS) as (keyof CallFilters)[]).some((k) => f[k] !== EMPTY_FILTERS[k])
}

/** Tarix uchun qidiruv va filtrlar. Qidiruv matni yozib bo'lingach (300 ms) qo'llanadi. */
export function HistoryFilters({ value, onChange }: Props) {
  const [text, setText] = useState(value.q)

  useEffect(() => setText(value.q), [value.q])

  useEffect(() => {
    if (text === value.q) return
    const timer = setTimeout(() => onChange({ ...value, q: text }), 300)
    return () => clearTimeout(timer)
  }, [text, value, onChange])

  const set = <K extends keyof CallFilters>(key: K, v: CallFilters[K]) =>
    onChange({ ...value, [key]: v })

  return (
    <div className={styles.bar}>
      <label className={styles.search}>
        <Icon name="search" size={16} />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Raqam, audio nomi yoki matn bo'yicha qidirish"
          aria-label="Qidirish"
        />
      </label>

      <select
        value={value.status}
        onChange={(e) => set('status', e.target.value as CallFilters['status'])}
        aria-label="Holat"
      >
        <option value="">Barcha holatlar</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        value={value.kind}
        onChange={(e) => set('kind', e.target.value as CallFilters['kind'])}
        aria-label="Turi"
      >
        <option value="">Barcha turlar</option>
        <option value="call">Oddiy</option>
        <option value="playback">Avto (audio)</option>
      </select>

      <select
        value={value.recording}
        onChange={(e) => set('recording', e.target.value as CallFilters['recording'])}
        aria-label="Yozuv"
      >
        <option value="">Yozuv: farqi yo'q</option>
        <option value="yes">Yozuvi bor</option>
        <option value="no">Yozuvi yo'q</option>
      </select>

      <label className={styles.date}>
        <span>Dan</span>
        <input
          type="date"
          value={value.dateFrom}
          max={value.dateTo || undefined}
          onChange={(e) => set('dateFrom', e.target.value)}
        />
      </label>
      <label className={styles.date}>
        <span>Gacha</span>
        <input
          type="date"
          value={value.dateTo}
          min={value.dateFrom || undefined}
          onChange={(e) => set('dateTo', e.target.value)}
        />
      </label>

      {isFiltered(value) && (
        <Button variant="ghost" icon="x" onClick={() => onChange(EMPTY_FILTERS)}>
          Tozalash
        </Button>
      )}
    </div>
  )
}
