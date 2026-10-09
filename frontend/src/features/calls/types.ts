export type CallStatus = 'ringing' | 'answered' | 'ended'
export type CallKind = 'call' | 'playback'
export type TranscriptStatus = 'none' | 'pending' | 'done' | 'failed'

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
  kind: CallKind
  audio_name: string | null
  has_recording: boolean
  transcript: string | null
  transcript_status: TranscriptStatus
}

export interface OriginateRequest {
  from_extension: string
  to_number: string
}

export interface PlaybackRequest {
  to_number: string
  audio_id: number
}
