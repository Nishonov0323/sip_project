import { useCallback, useEffect, useState } from 'react'
import { callsApi } from '../api/calls'
import { extensionsApi } from '../api/extensions'
import { ActiveCalls } from '../components/ActiveCalls'
import { CallHistory } from '../components/CallHistory'
import { Dialer } from '../components/Dialer'
import { ExtensionList } from '../components/ExtensionList'
import { useCallEvents } from '../hooks/useCallEvents'
import type { Call, Extension } from '../types'

export function DashboardPage() {
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [history, setHistory] = useState<Call[]>([])

  const loadExtensions = useCallback(() => {
    extensionsApi.list().then(setExtensions).catch(console.error)
  }, [])
  const loadHistory = useCallback(() => {
    callsApi.history().then(setHistory).catch(console.error)
  }, [])

  const { liveCalls, connected } = useCallEvents(loadHistory)

  useEffect(() => {
    loadExtensions()
    loadHistory()
  }, [loadExtensions, loadHistory])

  return (
    <main className="container">
      <header className="header">
        <h1>SIP Telefoniya</h1>
        <span className={`status ${connected ? 'on' : 'off'}`}>
          {connected ? 'Jonli ulanish' : 'Uzilgan'}
        </span>
      </header>
      <div className="grid">
        <Dialer extensions={extensions} />
        <ActiveCalls calls={liveCalls} />
        <ExtensionList extensions={extensions} onChange={loadExtensions} />
        <CallHistory calls={history} />
      </div>
    </main>
  )
}
