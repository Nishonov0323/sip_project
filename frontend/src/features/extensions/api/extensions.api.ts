import { http } from '@/shared/api/http'
import type { Extension, ExtensionCreate } from '../types'

export const extensionKeys = {
  all: ['extensions'] as const,
}

export const extensionsApi = {
  list: () => http<Extension[]>('/extensions'),
  create: (data: ExtensionCreate) =>
    http<Extension>('/extensions', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id: number) => http<void>(`/extensions/${id}`, { method: 'DELETE' }),
}
