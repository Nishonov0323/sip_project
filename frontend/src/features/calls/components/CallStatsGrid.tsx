import { formatDuration } from '@/shared/lib/format'
import { useCallHistory } from '../hooks/useCalls'
import { computeTodayStats } from '../lib/stats'
import { useCallEvents } from '@/features/realtime'
import styles from './CallStatsGrid.module.css'

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.label}>{label}</span>
      <strong className={`${styles.value} ${tone ? styles[tone] : ''}`}>{value}</strong>
    </div>
  )
}

export function CallStatsGrid() {
  const { liveCalls } = useCallEvents()
  const { data = [] } = useCallHistory(200, 0)
  const stats = computeTodayStats(data)

  return (
    <div className={styles.grid}>
      <Stat label="Faol qo'ng'iroqlar" value={liveCalls.length} tone="info" />
      <Stat label="Bugun jami" value={stats.total} />
      <Stat label="Javob berilgan" value={stats.answered} tone="success" />
      <Stat label="Javobsiz" value={stats.missed} tone="danger" />
      <Stat label="O'rtacha davomiylik" value={formatDuration(stats.avgDurationSeconds)} />
    </div>
  )
}
