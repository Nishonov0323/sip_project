import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { env } from '@/config/env'
import { CallEventsContext } from '../context'
import { applyEvent, type LiveCallMap } from '../lib/applyEvent'
import type { ConnectionStatus, SipEvent } from '../types'

const MAX_RETRY_DELAY_MS = 15_000

interface Props {
  /** Har bir SIP hodisasida chaqiriladi (masalan, so'rovlarni yangilash uchun). */
  onEvent?: (event: SipEvent) => void
  children: ReactNode
}

/** Backend WebSocket orqali jonli qo'ng'iroq hodisalarini kuzatadi (exponential backoff bilan qayta ulanadi). */
export function CallEventsProvider({ onEvent, children }: Props) {
  const [calls, setCalls] = useState<LiveCallMap>({})
  const [connection, setConnection] = useState<ConnectionStatus>('connecting')
  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    let ws: WebSocket | null = null
    let timer: number | undefined
    let stopped = false
    let attempt = 0

    const connect = () => {
      setConnection('connecting')
      ws = new WebSocket(env.wsUrl)
      ws.onopen = () => {
        attempt = 0
        setConnection('open')
      }
      ws.onclose = () => {
        if (stopped) return
        setConnection('closed')
        const delay = Math.min(1000 * 2 ** attempt, MAX_RETRY_DELAY_MS)
        attempt += 1
        timer = window.setTimeout(connect, delay)
      }
      ws.onmessage = (msg) => {
        let event: SipEvent
        try {
          event = JSON.parse(msg.data)
        } catch {
          return
        }
        setCalls((prev) => applyEvent(prev, event))
        onEventRef.current?.(event)
      }
    }

    connect()
    return () => {
      stopped = true
      window.clearTimeout(timer)
      ws?.close()
    }
  }, [])

  const value = useMemo(() => ({ liveCalls: Object.values(calls), connection }), [calls, connection])

  return <CallEventsContext.Provider value={value}>{children}</CallEventsContext.Provider>
}
