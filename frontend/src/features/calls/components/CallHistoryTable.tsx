import { formatDateTime, formatDuration } from '@/shared/lib/format'
import { Badge, EmptyState } from '@/shared/ui'
import { getDisplayStatus, STATUS_LABELS, STATUS_TONES } from '../lib/callStatus'
import type { Call } from '../types'
import styles from './CallHistoryTable.module.css'

export function CallHistoryTable({ calls }: { calls: Call[] }) {
  if (calls.length === 0) return <EmptyState>Qo'ng'iroqlar tarixi bo'sh</EmptyState>

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Kimdan</th>
            <th>Kimga</th>
            <th>Holat</th>
            <th>Davomiyligi</th>
            <th>Vaqt</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => {
            const status = getDisplayStatus(call)
            return (
              <tr key={call.id}>
                <td>{call.caller || '—'}</td>
                <td>{call.callee || '—'}</td>
                <td>
                  <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
                </td>
                <td className={styles.num}>
                  {call.answered_at ? formatDuration(call.duration_seconds) : '—'}
                </td>
                <td>{formatDateTime(call.created_at)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
