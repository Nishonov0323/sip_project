import { Fragment, useState } from 'react'
import { formatDateTime, formatDuration } from '@/shared/lib/format'
import { Badge, EmptyState, Icon } from '@/shared/ui'
import { getDisplayStatus, STATUS_ICONS, STATUS_LABELS, STATUS_TONES } from '../lib/callStatus'
import type { Call } from '../types'
import { CallDetails } from './CallDetails'
import { CallParty } from './CallParty'
import styles from './CallHistoryTable.module.css'

export function CallHistoryTable({ calls }: { calls: Call[] }) {
  const [openId, setOpenId] = useState<number | null>(null)

  if (calls.length === 0) {
    return <EmptyState icon="clock">Qo'ng'iroqlar tarixi hozircha bo'sh</EmptyState>
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Qo'ng'iroq</th>
            <th>Holat</th>
            <th>Davomiyligi</th>
            <th>Vaqt</th>
            <th>Yozuv</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => {
            const status = getDisplayStatus(call)
            const open = openId === call.id
            return (
              <Fragment key={call.id}>
                <tr
                  className={`${styles.row} ${open ? styles.open : ''}`}
                  onClick={() => setOpenId(open ? null : call.id)}
                  aria-expanded={open}
                >
                  <td>
                    <div className={styles.parties}>
                      <CallParty number={call.caller} size={34} />
                      <Icon name="arrowRight" size={14} className={styles.arrow} />
                      <CallParty number={call.callee} size={34} />
                    </div>
                  </td>
                  <td>
                    <div className={styles.badges}>
                      <Badge tone={STATUS_TONES[status]} icon={STATUS_ICONS[status]}>
                        {STATUS_LABELS[status]}
                      </Badge>
                      {call.kind === 'playback' && <Badge tone="info">Avto</Badge>}
                    </div>
                  </td>
                  <td className={styles.num}>
                    {call.answered_at ? formatDuration(call.duration_seconds) : '—'}
                  </td>
                  <td className={styles.time}>{formatDateTime(call.created_at)}</td>
                  <td>
                    <div className={styles.rec}>
                      {call.has_recording && <Icon name="mic" size={16} className={styles.recOn} />}
                      {call.transcript_status === 'done' && (
                        <Icon name="fileText" size={16} className={styles.recOn} />
                      )}
                      <Icon
                        name="chevronDown"
                        size={16}
                        className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
                      />
                    </div>
                  </td>
                </tr>
                {open && (
                  <tr className={styles.detailsRow}>
                    <td colSpan={5}>
                      <CallDetails call={call} />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
