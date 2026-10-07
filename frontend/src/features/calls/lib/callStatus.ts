import type { Tone } from '@/shared/ui'
import type { Call } from '../types'

export type DisplayStatus = 'ringing' | 'answered' | 'completed' | 'missed'

/** `ended` holatidagi qo'ng'iroq hech qachon javob berilmagan bo'lsa — javobsiz (missed). */
export function getDisplayStatus(call: Pick<Call, 'status' | 'answered_at'>): DisplayStatus {
  if (call.status === 'ended') return call.answered_at ? 'completed' : 'missed'
  return call.status
}

export const STATUS_LABELS: Record<DisplayStatus, string> = {
  ringing: "Jiringlamoqda",
  answered: 'Suhbatda',
  completed: 'Yakunlangan',
  missed: 'Javobsiz',
}

export const STATUS_TONES: Record<DisplayStatus, Tone> = {
  ringing: 'warning',
  answered: 'info',
  completed: 'success',
  missed: 'danger',
}
