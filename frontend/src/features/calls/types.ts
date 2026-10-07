export type CallStatus = 'ringing' | 'answered' | 'ended'

/** Backend `CallRead` sxemasi. */
export interface Call {
  id: number
  channel_id: string
  caller: string
  callee: string
  status: CallStatus
  created_at: string
  answered_at: string | null
  ended_at: string | null
  duration_seconds: number
}

export interface OriginateRequest {
  from_extension: string
  to_number: string
}
