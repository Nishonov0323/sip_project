import { useElapsed } from '@/shared/hooks/useElapsed'
import { formatDuration } from '@/shared/lib/format'
import { Badge, Button, Card, EmptyState, ErrorMessage } from '@/shared/ui'
import { useCallEvents, type LiveCall } from '@/features/realtime'
import { useHangupCall } from '../hooks/useCalls'
import { STATUS_LABELS, STATUS_TONES } from '../lib/callStatus'
import styles from './ActiveCalls.module.css'

function ActiveCallRow({ call, onHangup, disabled }: {
  call: LiveCall
  onHangup: (channelId: string) => void
  disabled: boolean
}) {
  // Suhbat vaqti javob berilgandan, jiringlash vaqti boshlanishidan hisoblanadi.
  const elapsed = useElapsed(call.answeredAt ?? call.startedAt)

  return (
    <li className={styles.row}>
      <div className={styles.parties}>
        <b>{call.caller || 'Noma’lum'}</b>
        <span className={styles.arrow}>→</span>
        <b>{call.callee}</b>
      </div>
      <Badge tone={STATUS_TONES[call.status]}>{STATUS_LABELS[call.status]}</Badge>
      <time className={styles.timer}>{formatDuration(elapsed)}</time>
      <Button variant="danger" disabled={disabled} onClick={() => onHangup(call.channelId)}>
        Uzish
      </Button>
    </li>
  )
}

export function ActiveCalls() {
  const { liveCalls } = useCallEvents()
  const hangup = useHangupCall()

  return (
    <Card title={`Faol qo'ng'iroqlar (${liveCalls.length})`}>
      {liveCalls.length === 0 ? (
        <EmptyState>Hozir faol qo'ng'iroq yo'q</EmptyState>
      ) : (
        <ul className={styles.list}>
          {liveCalls.map((call) => (
            <ActiveCallRow
              key={call.channelId}
              call={call}
              onHangup={hangup.mutate}
              disabled={hangup.isPending}
            />
          ))}
        </ul>
      )}
      <ErrorMessage error={hangup.error} />
    </Card>
  )
}
