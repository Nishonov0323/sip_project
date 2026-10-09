import { useCallEvents, type LiveCall } from '@/features/realtime'
import { useElapsed } from '@/shared/hooks/useElapsed'
import { formatDuration } from '@/shared/lib/format'
import { Badge, Card, EmptyState, ErrorMessage, Icon, IconButton } from '@/shared/ui'
import { useHangupCall } from '../hooks/useCalls'
import { STATUS_ICONS, STATUS_LABELS, STATUS_TONES } from '../lib/callStatus'
import { CallParty } from './CallParty'
import styles from './ActiveCalls.module.css'

function Equalizer() {
  return (
    <span className={styles.eq} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}

function ActiveCallRow({
  call,
  onHangup,
  disabled,
}: {
  call: LiveCall
  onHangup: (channelId: string) => void
  disabled: boolean
}) {
  // Suhbat vaqti javob berilgandan, jiringlash vaqti boshlanishidan hisoblanadi.
  const elapsed = useElapsed(call.answeredAt ?? call.startedAt)
  const ringing = call.status === 'ringing'

  return (
    <li className={`${styles.row} ${ringing ? styles.ringing : styles.answered}`}>
      <CallParty number={call.caller} pulse={ringing} />
      <Icon name="arrowRight" size={16} className={styles.arrow} />
      <CallParty number={call.callee} />
      <div className={styles.meta}>
        {call.kind === 'playback' && (
          <Badge tone="info" icon="music">
            {call.audioName || 'Avto'}
          </Badge>
        )}
        {!ringing && <Equalizer />}
        <Badge tone={STATUS_TONES[call.status]} icon={STATUS_ICONS[call.status]}>
          {STATUS_LABELS[call.status]}
        </Badge>
        <time className={styles.timer}>{formatDuration(elapsed)}</time>
        <IconButton
          icon="phoneOff"
          label="Qo'ng'iroqni uzish"
          tone="danger"
          disabled={disabled}
          onClick={() => onHangup(call.channelId)}
        />
      </div>
    </li>
  )
}

export function ActiveCalls() {
  const { liveCalls } = useCallEvents()
  const hangup = useHangupCall()

  return (
    <Card
      title="Faol qo'ng'iroqlar"
      actions={liveCalls.length > 0 && <span className={styles.count}>{liveCalls.length}</span>}
    >
      {liveCalls.length === 0 ? (
        <EmptyState icon="phoneCall">Hozir faol qo'ng'iroq yo'q</EmptyState>
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
