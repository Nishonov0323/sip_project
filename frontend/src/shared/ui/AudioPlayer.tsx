import { useRef, useState } from 'react'
import { useWaveform } from '@/shared/hooks/useWaveform'
import { formatDuration } from '@/shared/lib/format'
import styles from './AudioPlayer.module.css'
import { Icon } from './Icon'

interface Props {
  src: string
  downloadName?: string
}

/** Maxsus audio pleer: play/pause, to'lqin shakli (bosib o'tkazish mumkin), vaqt va yuklab olish. */
export function AudioPlayer({ src, downloadName }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [metaDuration, setMetaDuration] = useState(0)
  const wave = useWaveform(src)

  const duration = Number.isFinite(metaDuration) && metaDuration > 0 ? metaDuration : wave.duration
  const progress = duration > 0 ? Math.min(1, current / duration) : 0
  const silent = !wave.loading && !wave.peaks // bo'sh yoki o'qib bo'lmadi

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) void audio.play().catch(() => setPlaying(false))
    else audio.pause()
  }

  const seek = (ratio: number) => {
    const audio = audioRef.current
    if (!audio || duration <= 0) return
    audio.currentTime = ratio * duration
    setCurrent(audio.currentTime)
  }

  return (
    <div className={styles.player}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => setMetaDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setCurrent(0)
        }}
      />

      <button
        type="button"
        className={styles.play}
        onClick={toggle}
        aria-label={playing ? 'To‘xtatish' : 'Tinglash'}
      >
        <Icon name={playing ? 'pause' : 'play'} size={18} />
      </button>

      <div
        className={styles.wave}
        role="slider"
        aria-label="Audio joylashuvi"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(current)}
        tabIndex={0}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          seek((e.clientX - rect.left) / rect.width)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') seek(Math.min(1, progress + 0.05))
          if (e.key === 'ArrowLeft') seek(Math.max(0, progress - 0.05))
        }}
      >
        {wave.peaks ? (
          wave.peaks.map((peak, i) => (
            <i
              key={i}
              className={i / wave.peaks!.length < progress ? styles.done : undefined}
              style={{ height: `${Math.max(8, peak * 100)}%` }}
            />
          ))
        ) : (
          <>
            <span className={styles.line} />
            <span className={styles.fill} style={{ width: `${progress * 100}%` }} />
          </>
        )}
      </div>

      <span className={styles.time}>
        {formatDuration(current)} / {formatDuration(duration)}
      </span>
      {silent && duration === 0 && <span className={styles.note}>ovoz yo‘q</span>}

      <a className={styles.download} href={src} download={downloadName} aria-label="Yuklab olish">
        <Icon name="download" size={17} />
      </a>
    </div>
  )
}
