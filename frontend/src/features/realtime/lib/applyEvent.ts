import type { LiveCall, SipEvent } from '../types'

export type LiveCallMap = Record<string, LiveCall>

/** SIP hodisasini jonli qo'ng'iroqlar ro'yxatiga qo'llaydi (sof funksiya). */
export function applyEvent(calls: LiveCallMap, event: SipEvent): LiveCallMap {
  const { [event.channel_id]: existing, ...rest } = calls

  switch (event.type) {
    case 'call_started':
      return {
        ...calls,
        [event.channel_id]: {
          channelId: event.channel_id,
          caller: event.caller,
          callee: event.callee,
          status: 'ringing',
          startedAt: event.timestamp,
          answeredAt: null,
        },
      }
    case 'call_answered':
      return {
        ...calls,
        [event.channel_id]: {
          channelId: event.channel_id,
          caller: event.caller,
          callee: event.callee,
          startedAt: existing?.startedAt ?? event.timestamp,
          status: 'answered',
          answeredAt: event.timestamp,
        },
      }
    case 'call_ended':
      return rest
  }
}
