import { Link } from 'react-router-dom'
import { formatDateTime, formatDuration } from '@/shared/lib/format'
import { AudioPlayer, EmptyState, ErrorMessage, Icon, IconButton, Skeleton } from '@/shared/ui'
import { audioFileUrl } from '../api/audio.api'
import { useAudioFiles, useDeleteAudio } from '../hooks/useAudio'
import type { AudioFile } from '../types'
import styles from './Audio.module.css'

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`

export function AudioLibrary() {
  const { data, isLoading, error } = useAudioFiles()
  const remove = useDeleteAudio()

  const confirmRemove = (audio: AudioFile) => {
    if (window.confirm(`"${audio.name}" o'chirilsinmi?`)) remove.mutate(audio.id)
  }

  if (isLoading) return <Skeleton rows={2} />
  if (error) return <ErrorMessage error={error} />
  if (!data?.length) return <EmptyState icon="music">Hali audio yuklanmagan</EmptyState>

  return (
    <>
      <ul className={styles.list}>
        {data.map((audio) => (
          <li key={audio.id} className={styles.item}>
            <span className={styles.chip}>
              <Icon name="music" size={20} />
            </span>
            <div className={styles.info}>
              <strong>{audio.name}</strong>
              <small>
                {formatDuration(audio.duration_seconds)} · {formatSize(audio.size_bytes)} ·{' '}
                {formatDateTime(audio.created_at)}
              </small>
            </div>
            <div className={styles.player}>
              <AudioPlayer key={audio.id} src={audioFileUrl(audio.id)} downloadName={`${audio.name}.wav`} />
            </div>
            <Link to={`/dialer?tab=auto&audio=${audio.id}`} className={styles.useLink}>
              <Icon name="phoneCall" size={16} /> Qo‘ng‘iroqda
            </Link>
            <IconButton
              icon="trash"
              label="O'chirish"
              tone="danger"
              disabled={remove.isPending}
              onClick={() => confirmRemove(audio)}
            />
          </li>
        ))}
      </ul>
      <ErrorMessage error={remove.error} />
    </>
  )
}
