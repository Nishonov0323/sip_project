import { useEffect, useState } from 'react'

interface Waveform {
  peaks: number[] | null
  duration: number
  loading: boolean
}

const cache = new Map<string, { peaks: number[]; duration: number }>()

function computePeaks(data: Float32Array, bars: number): number[] {
  const block = Math.max(1, Math.floor(data.length / bars))
  const peaks: number[] = []
  for (let i = 0; i < bars; i++) {
    let max = 0
    for (let j = i * block; j < Math.min(data.length, (i + 1) * block); j++) {
      max = Math.max(max, Math.abs(data[j]))
    }
    peaks.push(max)
  }
  const top = Math.max(...peaks, 0.0001)
  return peaks.map((p) => p / top)
}

/**
 * Audio faylni yuklab, to'lqin shakli (peaks) ni hisoblaydi.
 * Har bir `src` uchun alohida komponent (key={src}) ishlatilishi kutiladi.
 */
export function useWaveform(src: string, bars = 72): Waveform {
  const [state, setState] = useState<Waveform>(() => {
    const cached = cache.get(src)
    return cached ? { ...cached, loading: false } : { peaks: null, duration: 0, loading: true }
  })

  useEffect(() => {
    if (cache.has(src)) return
    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch(src)
        if (!res.ok) throw new Error(String(res.status))
        const ctx = new AudioContext()
        try {
          const buffer = await ctx.decodeAudioData(await res.arrayBuffer())
          const entry = { peaks: computePeaks(buffer.getChannelData(0), bars), duration: buffer.duration }
          cache.set(src, entry)
          if (!cancelled) setState({ ...entry, loading: false })
        } finally {
          void ctx.close()
        }
      } catch {
        // Bo'sh yoki o'qib bo'lmaydigan audio — pleer oddiy rejimda ishlaydi.
        if (!cancelled) setState({ peaks: null, duration: 0, loading: false })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [src, bars])

  return state
}
