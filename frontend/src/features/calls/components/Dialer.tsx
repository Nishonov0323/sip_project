import { useState, type FormEvent } from 'react'
import { usePersistentState } from '@/shared/hooks/usePersistentState'
import { isValidNumber, sanitizeNumber } from '@/shared/lib/validation'
import { Button, Card, ErrorMessage } from '@/shared/ui'
import { useExtensions } from '@/features/extensions'
import { useOriginateCall } from '../hooks/useCalls'
import styles from './Dialer.module.css'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']

export function Dialer() {
  const { data: extensions = [] } = useExtensions()
  const [storedFrom, setFrom] = usePersistentState('dialer.from', '')
  const [to, setTo] = useState('')
  const originate = useOriginateCall()

  // Saqlangan raqam o'chirilgan bo'lsa, birinchi mavjud raqamga tushamiz.
  const from = extensions.some((x) => x.number === storedFrom)
    ? storedFrom
    : (extensions[0]?.number ?? '')
  const canCall = Boolean(from) && isValidNumber(to)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canCall) return
    originate.mutate(
      { from_extension: from, to_number: to },
      { onSuccess: () => setTo('') },
    )
  }

  return (
    <Card title="Qo'ng'iroq qilish">
      <form onSubmit={submit} className={styles.dialer}>
        <label className={styles.field}>
          <span>Qaysi raqamdan</span>
          <select value={from} onChange={(e) => setFrom(e.target.value)} required>
            {extensions.length === 0 && <option value="">Raqamlar yo'q</option>}
            {extensions.map((x) => (
              <option key={x.id} value={x.number}>
                {x.number} — {x.display_name}
              </option>
            ))}
          </select>
        </label>

        <input
          className={styles.display}
          value={to}
          onChange={(e) => setTo(sanitizeNumber(e.target.value))}
          placeholder="Raqamni kiriting"
          inputMode="tel"
          maxLength={32}
          aria-label="Chaqiriladigan raqam"
        />

        <div className={styles.pad}>
          {KEYS.map((key) => (
            <button
              type="button"
              key={key}
              className={styles.key}
              onClick={() => setTo((prev) => (prev + key).slice(0, 32))}
            >
              {key}
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            disabled={!to}
            onClick={() => setTo((prev) => prev.slice(0, -1))}
          >
            ⌫
          </Button>
          <Button className={styles.call} disabled={!canCall} loading={originate.isPending}>
            Qo'ng'iroq
          </Button>
        </div>
      </form>
      <ErrorMessage error={originate.error} />
    </Card>
  )
}
