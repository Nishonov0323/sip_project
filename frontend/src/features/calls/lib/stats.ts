import { isToday } from '@/shared/lib/format'
import type { Call } from '../types'

export interface CallStats {
  total: number
  answered: number
  missed: number
  avgDurationSeconds: number
}

/** Bugungi qo'ng'iroqlar bo'yicha statistika. */
export function computeTodayStats(calls: Call[]): CallStats {
  const today = calls.filter((c) => isToday(c.created_at))
  const finished = today.filter((c) => c.status === 'ended')
  const answered = finished.filter((c) => c.answered_at)
  const totalDuration = answered.reduce((sum, c) => sum + c.duration_seconds, 0)

  return {
    total: today.length,
    answered: answered.length,
    missed: finished.length - answered.length,
    avgDurationSeconds: answered.length ? Math.round(totalDuration / answered.length) : 0,
  }
}
