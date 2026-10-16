export type CampaignStatus = 'running' | 'finished' | 'cancelled' | 'interrupted'
export type TargetStatus = 'pending' | 'calling' | 'answered' | 'no_answer' | 'failed' | 'cancelled'

/** Backend `CampaignRead`. */
export interface Campaign {
  id: number
  name: string
  audio_name: string
  status: CampaignStatus
  created_at: string
  total: number
  done: number
  answered: number
}

/** Backend `TargetRead`. */
export interface CampaignTarget {
  id: number
  contact_id: number | null
  full_name: string
  phone: string
  status: TargetStatus
  channel_id: string | null
  error: string | null
  call_id: number | null
  has_recording: boolean
  transcript: string | null
  duration_seconds: number
}

export interface CampaignDetail extends Campaign {
  targets: CampaignTarget[]
}

/** Kimlarga qo'ng'iroq qilinadi: aniq kontaktlar yoki filtr bo'yicha hammasi. */
export interface Recipients {
  count: number
  contactIds?: number[]
  filter?: { q: string | null; group_ids: number[]; professions: string[] }
}

export interface CreateCampaignRequest {
  audio_id: number
  name?: string
  contact_ids?: number[]
  filter?: Recipients['filter']
}
