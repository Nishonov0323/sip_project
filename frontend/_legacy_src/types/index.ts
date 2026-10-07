export type CallStatus = 'ringing' | 'answered' | 'ended'

export interface Extension {
  id: number
  number: string
  display_name: string
  created_at: string
}

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

export type SipEventType = 'call_started' | 'call_answered' | 'call_ended'

export interface SipEvent {
  type: SipEventType
  channel_id: string
  caller: string
  callee: string
  timestamp: string
}

export interface LiveCall {
  channel_id: string
  caller: string
  callee: string
  status: CallStatus
}
