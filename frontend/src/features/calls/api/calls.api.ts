import { http } from '@/shared/api/http'
import type { Call, OriginateRequest } from '../types'

export const callKeys = {
  all: ['calls'] as const,
  history: (limit: number, offset: number) => ['calls', 'history', { limit, offset }] as const,
}

export const callsApi = {
  originate: (data: OriginateRequest) =>
    http<{ channel_id: string }>('/calls/originate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  hangup: (channelId: string) =>
    http<void>(`/calls/${encodeURIComponent(channelId)}/hangup`, { method: 'POST' }),
  history: (limit: number, offset: number) =>
    http<Call[]>(`/calls?limit=${limit}&offset=${offset}`),
}
