import type { Extension } from '../types'
import { http } from './http'

export const extensionsApi = {
  list: () => http<Extension[]>('/extensions'),
  create: (number: string, display_name: string) =>
    http<Extension>('/extensions', {
      method: 'POST',
      body: JSON.stringify({ number, display_name }),
    }),
  remove: (id: number) => http<void>(`/extensions/${id}`, { method: 'DELETE' }),
}
