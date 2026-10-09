import { useState, type FormEvent } from 'react'
import { useExtensions } from '@/features/extensions'
import { usePersistentState } from '@/shared/hooks/usePersistentState'
import { isValidNumber, sanitizeNumber } from '@/shared/lib/validation'
import { Button, Card, ErrorMessage, Icon } from '@/shared/ui'
import { useOriginateCall } from '../hooks/useCalls'
import styles from './Dialer.module.css'

const KEYS: Array<[digit: string, letters: string]> = [
  ['1', ''],
  ['2', 'ABC'],
  ['3', 'DEF'],
  ['4', 'GHI'],
  ['5', 'JKL'],
  ['6', 'MNO'],
  ['7', 'PQRS'],
  ['8', 'TUV'],
  ['9', 'WXYZ'],
  ['*', ''],
  ['0', '+'],
  ['#', ''],
]

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

  const press = (key: string) => setTo((prev) => (prev + key).slice(0, 32))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canCall) return
    originate.mutate({ from_extension: from, to_number: to }, { onSuccess: () => setTo('') })
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

        <div className={styles.screen}>
          <input
            className={styles.display}
            value={to}
            onChange={(e) => setTo(sanitizeNumber(e.target.value))}
            placeholder="Raqamni kiriting"
            inputMode="tel"
            maxLength={32}
            aria-label="Chaqiriladigan raqam"
          />
          <button
            type="button"
            className={styles.erase}
            disabled={!to}
            onClick={() => setTo((prev) => prev.slice(0, -1))}
            aria-label="Oxirgi belgini o'chirish"
          >
            <Icon name="backspace" size={20} />
          </button>
        </div>

        <div className={styles.pad}>
          {KEYS.map(([digit, letters]) => (
            <button type="button" key={digit} className={styles.key} onClick={() => press(digit)}>
              <span className={styles.digit}>{digit}</span>
              <span className={styles.letters}>{letters}</span>
            </button>
          ))}
        </div>

        <Button
          variant="success"
          icon="phone"
          className={styles.call}
          disabled={!canCall}
          loading={originate.isPending}
        >
          Qo'ng'iroq qilish
        </Button>

        {originate.isSuccess && <p className={styles.ok}>Qo'ng'iroq boshlandi — telefoningizni ko'taring</p>}
      </form>
      <ErrorMessage error={originate.error} />
    </Card>
  )
}
