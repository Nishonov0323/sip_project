import { createContext } from 'react'
import type { ConnectionStatus, LiveCall } from './types'

export interface CallEventsValue {
  liveCalls: LiveCall[]
  connection: ConnectionStatus
}

export const CallEventsContext = createContext<CallEventsValue | null>(null)
