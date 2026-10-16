import { http } from '@/shared/api/http'
import type {
  Contact,
  ContactFilter,
  ContactGroup,
  ContactInput,
  ContactPage,
  ImportResult,
} from '../types'

export const contactKeys = {
  all: ['contacts'] as const,
  list: (filter: ContactFilter, limit: number, offset: number) =>
    ['contacts', 'list', filter, limit, offset] as const,
  groups: ['contacts', 'groups'] as const,
  professions: ['contacts', 'professions'] as const,
}

function query(filter: ContactFilter, limit: number, offset: number): string {
  const params = new URLSearchParams()
  if (filter.q.trim()) params.set('q', filter.q.trim())
  filter.groupIds.forEach((id) => params.append('group_id', String(id)))
  filter.professions.forEach((p) => params.append('profession', p))
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  return params.toString()
}

const json = (method: string, data: unknown): RequestInit => ({
  method,
  body: JSON.stringify(data),
})

export const contactsApi = {
  list: (filter: ContactFilter, limit: number, offset: number) =>
    http<ContactPage>(`/contacts?${query(filter, limit, offset)}`),
  professions: () => http<string[]>('/contacts/professions'),
  create: (data: ContactInput) => http<Contact>('/contacts', json('POST', data)),
  update: (id: number, data: Partial<ContactInput>) =>
    http<Contact>(`/contacts/${id}`, json('PATCH', data)),
  remove: (id: number) => http<void>(`/contacts/${id}`, { method: 'DELETE' }),
  assignGroup: (contactIds: number[], groupId: number | null) =>
    http<{ updated: number }>(
      '/contacts/assign-group',
      json('POST', { contact_ids: contactIds, group_id: groupId }),
    ),
  importCsv: (file: File) => {
    const body = new FormData()
    body.append('file', file)
    return http<ImportResult>('/contacts/import', { method: 'POST', body })
  },

  groups: () => http<ContactGroup[]>('/contact-groups'),
  createGroup: (name: string) => http<ContactGroup>('/contact-groups', json('POST', { name })),
  removeGroup: (id: number) => http<void>(`/contact-groups/${id}`, { method: 'DELETE' }),
}
