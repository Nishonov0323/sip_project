import { useEffect, useRef, useState } from 'react'
import { env } from '../config/env'
import type { LiveCall, SipEvent } from '../types'

/** Backend WebSocket orqali jonli qo'ng'iroq hodisalarini kuzatadi (avto-reconnect). */
export function useCallEvents(onEnded?: () => void) {
  const [liveCalls, setLiveCalls] = useState<Record<string, LiveCall>>({})
  const [connected, setConnected] = useState(false)
  const onEndedRef = useRef(onEnded)
  onEndedRef.current = onEnded

  useEffect(() => {
    let ws: WebSocket | null = null
    let timer: number | undefined
    let stopped = false

    const connect = () => {
      ws = new WebSocket(env.wsUrl)
      ws.onopen = () => setConnected(true)
      ws.onclose = () => {
        setConnected(false)
        if (!stopped) timer = window.setTimeout(connect, 2000)
      }
      ws.onmessage = (msg) => {
        const event: SipEvent = JSON.parse(msg.data)
        setLiveCalls((prev) => {
          const next = { ...prev }
          if (event.type === 'call_ended') {
            delete next[event.channel_id]
          } else {
            next[event.channel_id] = {
              channel_id: event.channel_id,
              caller: event.caller,
              callee: event.callee,
              status: event.type === 'call_answered' ? 'answered' : 'ringing',
            }
          }
          return next
        })
        if (event.type === 'call_ended') onEndedRef.current?.()
      }
    }

    connect()
    return () => {
      stopped = true
      window.clearTimeout(timer)
      ws?.close()
    }
  }, [])

  return { liveCalls: Object.values(liveCalls), connected }
}
