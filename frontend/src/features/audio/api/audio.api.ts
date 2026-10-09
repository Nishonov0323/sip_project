import { env } from '@/config/env'
import { http } from '@/shared/api/http'
import type { AudioFile } from '../types'

export const audioKeys = {
  all: ['audio'] as const,
}

export const audioFileUrl = (id: number) => `${env.apiUrl}/audio/${id}/file`

export const audioApi = {
  list: () => http<AudioFile[]>('/audio'),
  upload: (file: File, name?: string) => {
    const body = new FormData()
    body.append('file', file)
    if (name) body.append('name', name)
    return http<AudioFile>('/audio', { method: 'POST', body })
  },
  remove: (id: number) => http<void>(`/audio/${id}`, { method: 'DELETE' }),
}
