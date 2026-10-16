/** Backend `GroupRead`. */
export interface ContactGroup {
  id: number
  name: string
  contact_count: number
}

/** Backend `ContactRead`. */
export interface Contact {
  id: number
  full_name: string
  phone: string
  profession: string | null
  group_id: number | null
  group_name: string | null
  created_at: string
}

export interface ContactPage {
  items: Contact[]
  total: number
}

export interface ContactInput {
  full_name: string
  phone: string
  profession: string | null
  group_id: number | null
}

export interface ImportResult {
  created: number
  updated: number
  skipped: number
  errors: string[]
}

/** Ro'yxat filtri: shartlar birga (AND) qo'llanadi, ichida (guruh/kasb) esa "yoki". */
export interface ContactFilter {
  q: string
  groupIds: number[]
  professions: string[]
}

export const EMPTY_FILTER: ContactFilter = { q: '', groupIds: [], professions: [] }

/** "Qo'ng'iroq qilish" bosilganda uzatiladi: aniq tanlanganlar yoki filtrga mos hammasi. */
export interface CallTarget {
  count: number
  contactIds?: number[]
  filter?: { q: string | null; group_ids: number[]; professions: string[] }
}
