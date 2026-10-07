export type SipEventType = 'call_started' | 'call_answered' | 'call_ended'

/** Backend `SipEvent.to_dict()` formati. */
export interface SipEvent {
  type: SipEventType
  channel_id: string
  caller: string
  callee: string
  timestamp: string
}

export interface LiveCall {
  channelId: string
  caller: string
  callee: string
  status: 'ringing' | 'answered'
  startedAt: string
  answeredAt: string | null
}

export type ConnectionStatus = 'connecting' | 'open' | 'closed'
