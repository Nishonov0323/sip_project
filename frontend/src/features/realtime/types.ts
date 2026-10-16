export type SipEventType =
  | 'call_started'
  | 'call_answered'
  | 'call_ended'
  | 'recording_ready'
  | 'transcript_updated'
  | 'campaign_updated'

/** Backend `SipEvent.to_dict()` formati (transcript_updated'da faqat type va channel_id bor). */
export interface SipEvent {
  type: SipEventType
  channel_id: string
  caller: string
  callee: string
  kind?: 'call' | 'playback'
  audio_name?: string
  timestamp: string
}

export interface LiveCall {
  channelId: string
  caller: string
  callee: string
  kind: 'call' | 'playback'
  audioName: string
  status: 'ringing' | 'answered'
  startedAt: string
  answeredAt: string | null
}

export type ConnectionStatus = 'connecting' | 'open' | 'closed'
