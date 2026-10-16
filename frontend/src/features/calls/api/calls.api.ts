import { env } from '@/config/env'
import { http } from '@/shared/api/http'
import type { Call, CallFilters, OriginateRequest, PlaybackRequest } from '../types'

export const callKeys = {
  all: ['calls'] as const,
  history: (limit: number, offset: number, filters?: CallFilters) =>
    ['calls', 'history', { limit, offset, filters }] as const,
}

function historyQuery(limit: number, offset: number, f?: CallFilters): string {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  if (f) {
    if (f.q.trim()) params.set('q', f.q.trim())
    if (f.status) params.set('status', f.status)
    if (f.kind) params.set('kind', f.kind)
    if (f.recording) params.set('has_recording', f.recording === 'yes' ? 'true' : 'false')
    // Kun chegaralari brauzerning mahalliy vaqtida hisoblanadi
    if (f.dateFrom) params.set('created_from', new Date(`${f.dateFrom}T00:00:00`).toISOString())
    if (f.dateTo) {
      const end = new Date(`${f.dateTo}T00:00:00`)
      end.setDate(end.getDate() + 1)
      params.set('created_before', end.toISOString())
    }
  }
  return params.toString()
}

export const recordingUrl = (callId: number) => `${env.apiUrl}/calls/${callId}/recording`

export const callsApi = {
  originate: (data: OriginateRequest) =>
    http<{ channel_id: string }>('/calls/originate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  playback: (data: PlaybackRequest) =>
    http<{ channel_id: string }>('/calls/playback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  hangup: (channelId: string) =>
    http<void>(`/calls/${encodeURIComponent(channelId)}/hangup`, { method: 'POST' }),
  history: (limit: number, offset: number, filters?: CallFilters) =>
    http<Call[]>(`/calls?${historyQuery(limit, offset, filters)}`),
  transcribe: (callId: number) => http<Call>(`/calls/${callId}/transcribe`, { method: 'POST' }),
}
