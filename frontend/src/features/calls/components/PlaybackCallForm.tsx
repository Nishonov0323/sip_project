import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAudioFiles } from '@/features/audio'
import { formatDuration } from '@/shared/lib/format'
import { isValidNumber, sanitizeNumber } from '@/shared/lib/validation'
import { Button, Card, EmptyState, ErrorMessage } from '@/shared/ui'
import { useStartPlaybackCall } from '../hooks/useCalls'
import styles from './PlaybackCallForm.module.css'

export function PlaybackCallForm({ initialAudioId }: { initialAudioId?: number }) {
  const { data: audios = [] } = useAudioFiles()
  const [chosen, setChosen] = useState<number | null>(initialAudioId ?? null)
  const [to, setTo] = useState('')
  const start = useStartPlaybackCall()

  // Tanlangan audio o'chirilgan bo'lsa yoki hech narsa tanlanmagan bo'lsa — birinchisi.
  const audioId = audios.some((a) => a.id === chosen) ? chosen : (audios[0]?.id ?? null)
  const canCall = audioId !== null && isValidNumber(to)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (audioId === null || !canCall) return
    start.mutate({ to_number: to, audio_id: audioId }, { onSuccess: () => setTo('') })
  }

  if (audios.length === 0) {
    return (
      <Card title="Avto-qo'ng'iroq">
        <EmptyState icon="music">Avval audio yuklang</EmptyState>
        <p className={styles.center}>
          <Link to="/audio">Audio kutubxonaga o‘tish →</Link>
        </p>
      </Card>
    )
  }

  return (
    <Card title="Avto-qo'ng'iroq">
      <form onSubmit={submit} className={styles.form}>
        <p className={styles.intro}>
          Raqam javob bergach tanlangan audio ijro etiladi, so‘ng odamning javobi yozib olinadi va
          tarixda tinglash mumkin bo‘ladi.
        </p>

        <label className={styles.field}>
          <span>Ijro etiladigan audio</span>
          <select value={audioId ?? ''} onChange={(e) => setChosen(Number(e.target.value))}>
            {audios.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatDuration(a.duration_seconds)})
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Qaysi raqamga</span>
          <input
            value={to}
            onChange={(e) => setTo(sanitizeNumber(e.target.value))}
            placeholder="Masalan, 1002"
            inputMode="tel"
            maxLength={32}
          />
        </label>

        <Button variant="success" icon="phoneCall" disabled={!canCall} loading={start.isPending}>
          Avto-qo'ng'iroq boshlash
        </Button>
        {start.isSuccess && (
          <p className={styles.ok}>Qo‘ng‘iroq boshlandi — jarayonni “Faol qo‘ng‘iroqlar” da kuzating</p>
        )}
      </form>
      <ErrorMessage error={start.error} />
    </Card>
  )
}
