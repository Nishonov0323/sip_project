import { useCallEvents } from '@/features/realtime'
import { formatDuration } from '@/shared/lib/format'
import { Icon, type IconName } from '@/shared/ui'
import { useCallHistory } from '../hooks/useCalls'
import { computeTodayStats } from '../lib/stats'
import styles from './CallStatsGrid.module.css'

type StatTone = 'info' | 'primary' | 'success' | 'danger' | 'neutral'

interface StatProps {
  label: string
  value: string | number
  icon: IconName
  tone: StatTone
}

function Stat({ label, value, icon, tone }: StatProps) {
  return (
    <div className={styles.stat}>
      <span className={`${styles.chip} ${styles[tone]}`}>
        <Icon name={icon} size={20} />
      </span>
      <div>
        <span className={styles.label}>{label}</span>
        <strong className={styles.value}>{value}</strong>
      </div>
    </div>
  )
}

export function CallStatsGrid() {
  const { liveCalls } = useCallEvents()
  const { data = [] } = useCallHistory(200, 0)
  const stats = computeTodayStats(data)

  return (
    <div className={styles.grid}>
      <Stat label="Faol qo'ng'iroqlar" value={liveCalls.length} icon="activity" tone="info" />
      <Stat label="Bugun jami" value={stats.total} icon="phone" tone="primary" />
      <Stat label="Javob berilgan" value={stats.answered} icon="phoneOutgoing" tone="success" />
      <Stat label="Javobsiz" value={stats.missed} icon="phoneMissed" tone="danger" />
      <Stat
        label="O'rtacha davomiylik"
        value={formatDuration(stats.avgDurationSeconds)}
        icon="clock"
        tone="neutral"
      />
    </div>
  )
}
