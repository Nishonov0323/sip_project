import { useRef, useState, type DragEvent } from 'react'
import { ErrorMessage, Icon } from '@/shared/ui'
import { useUploadAudio } from '../hooks/useAudio'
import styles from './Audio.module.css'

const ACCEPT = '.wav,.mp3,.ogg,.m4a,.aac,.flac,.webm,.opus,audio/*'

export function AudioUploader() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const upload = useUploadAudio()

  const uploadAll = async (files: File[]) => {
    if (files.length === 0) return
    setError(null)
    setProgress({ done: 0, total: files.length })
    for (const [i, file] of files.entries()) {
      try {
        await upload.mutateAsync(file)
      } catch (err) {
        setError(new Error(`${file.name}: ${err instanceof Error ? err.message : 'xatolik'}`))
      }
      setProgress({ done: i + 1, total: files.length })
    }
    setProgress(null)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void uploadAll([...e.dataTransfer.files])
  }

  const busy = progress !== null

  return (
    <>
      <div
        className={`${styles.drop} ${dragging ? styles.dragging : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !busy && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      >
        <span className={styles.dropIcon}>
          <Icon name="upload" size={26} />
        </span>
        <strong>
          {busy ? `Yuklanmoqda... ${progress.done}/${progress.total}` : 'Audio faylni shu yerga tashlang'}
        </strong>
        <span className={styles.hint}>
          yoki tanlash uchun bosing · WAV, MP3, OGG, M4A, FLAC · avtomatik 8 kHz mono WAV ga o‘tkaziladi
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            void uploadAll([...(e.target.files ?? [])])
            e.target.value = ''
          }}
        />
      </div>
      <ErrorMessage error={error} />
    </>
  )
}
