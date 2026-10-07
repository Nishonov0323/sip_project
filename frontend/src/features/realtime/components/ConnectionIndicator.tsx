import { useCallEvents } from '../useCallEvents'
import type { ConnectionStatus } from '../types'
import styles from './ConnectionIndicator.module.css'

const LABELS: Record<ConnectionStatus, string> = {
  connecting: 'Ulanmoqda...',
  open: 'Jonli ulanish',
  closed: 'Uzilgan',
}

export function ConnectionIndicator() {
  const { connection } = useCallEvents()
  return (
    <span className={`${styles.indicator} ${styles[connection]}`} role="status">
      <i className={styles.dot} />
      {LABELS[connection]}
    </span>
  )
}
