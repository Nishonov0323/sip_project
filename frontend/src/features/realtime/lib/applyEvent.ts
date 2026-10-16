import type { LiveCall, SipEvent } from '../types'

export type LiveCallMap = Record<string, LiveCall>

/** SIP hodisasini jonli qo'ng'iroqlar ro'yxatiga qo'llaydi (sof funksiya). */
export function applyEvent(calls: LiveCallMap, event: SipEvent): LiveCallMap {
  const { [event.channel_id]: existing, ...rest } = calls

  if (event.type === 'campaign_updated') return calls

  switch (event.type) {
    case 'call_started':
    case 'call_answered': {
      const answered = event.type === 'call_answered'
      return {
        ...calls,
        [event.channel_id]: {
          channelId: event.channel_id,
          caller: event.caller,
          callee: event.callee,
          kind: event.kind ?? existing?.kind ?? 'call',
          audioName: event.audio_name ?? existing?.audioName ?? '',
          status: answered ? 'answered' : 'ringing',
          startedAt: existing?.startedAt ?? event.timestamp,
          answeredAt: answered ? event.timestamp : null,
        },
      }
    }
    case 'call_ended':
      return rest
    default:
      // recording_ready, transcript_updated — jonli ro'yxatga ta'sir qilmaydi
      return calls
  }
}
