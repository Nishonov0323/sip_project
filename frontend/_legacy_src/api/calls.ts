import type { Call } from '../types'
import { http } from './http'

export const callsApi = {
  originate: (from_extension: string, to_number: string) =>
    http<{ channel_id: string }>('/calls/originate', {
      method: 'POST',
      body: JSON.stringify({ from_extension, to_number }),
    }),
  hangup: (channelId: string) => http<void>(`/calls/${channelId}/hangup`, { method: 'POST' }),
  history: (limit = 50, offset = 0) => http<Call[]>(`/calls?limit=${limit}&offset=${offset}`),
}
