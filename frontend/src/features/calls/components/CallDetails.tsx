import { AudioPlayer, Button, ErrorMessage, Icon } from '@/shared/ui'
import { recordingUrl } from '../api/calls.api'
import { useTranscribeCall } from '../hooks/useCalls'
import type { Call } from '../types'
import styles from './CallDetails.module.css'

function Transcript({ call }: { call: Call }) {
  const transcribe = useTranscribeCall()
  const pending = call.transcript_status === 'pending' || transcribe.isPending

  if (pending) {
    return (
      <p className={styles.pending}>
        <span className={styles.spinner} /> Matnga o‘tkazilmoqda...
      </p>
    )
  }

  if (call.transcript_status === 'done') {
    return call.transcript ? (
      <blockquote className={styles.text}>{call.transcript}</blockquote>
    ) : (
      <p className={styles.muted}>Yozuvda gap topilmadi.</p>
    )
  }

  return (
    <div className={styles.action}>
      <p className={styles.muted}>
        {call.transcript_status === 'failed'
          ? 'Matnga o‘tkazishda xatolik yuz berdi.'
          : 'Hali matnga o‘tkazilmagan.'}
      </p>
      <Button variant="ghost" icon="fileText" onClick={() => transcribe.mutate(call.id)}>
        {call.transcript_status === 'failed' ? 'Qayta urinish' : 'Matnga o‘tkazish'}
      </Button>
      <ErrorMessage error={transcribe.error} />
    </div>
  )
}

/** Tarix qatori ochilganda: yozuv pleeri va transkripsiya. */
export function CallDetails({ call }: { call: Call }) {
  return (
    <div className={styles.details}>
      {call.kind === 'playback' && call.audio_name && (
        <p className={styles.meta}>
          <Icon name="music" size={15} /> Ijro etilgan audio: <b>{call.audio_name}</b>
        </p>
      )}

      <section>
        <h4>
          <Icon name="mic" size={15} /> Suhbat yozuvi
        </h4>
        {call.has_recording ? (
          <AudioPlayer
            key={call.id}
            src={recordingUrl(call.id)}
            downloadName={`qongiroq-${call.id}.wav`}
          />
        ) : (
          <p className={styles.muted}>
            {call.status === 'ended' ? 'Bu qo‘ng‘iroq uchun yozuv yo‘q.' : 'Yozuv qo‘ng‘iroq tugagach paydo bo‘ladi.'}
          </p>
        )}
      </section>

      {call.has_recording && (
        <section>
          <h4>
            <Icon name="fileText" size={15} /> Matn (transkripsiya)
          </h4>
          <Transcript call={call} />
        </section>
      )}
    </div>
  )
}
