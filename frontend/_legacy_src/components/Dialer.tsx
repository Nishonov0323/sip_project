import { useState } from 'react'
import { callsApi } from '../api/calls'
import type { Extension } from '../types'

interface Props {
  extensions: Extension[]
}

export function Dialer({ extensions }: Props) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await callsApi.originate(from || extensions[0]?.number, to)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <h2>Qo'ng'iroq qilish</h2>
      <form onSubmit={submit} className="row">
        <select value={from} onChange={(e) => setFrom(e.target.value)} required>
          <option value="" disabled>
            Kimdan
          </option>
          {extensions.map((x) => (
            <option key={x.id} value={x.number}>
              {x.number} — {x.display_name}
            </option>
          ))}
        </select>
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Kimga (raqam)"
          pattern="[0-9*#+]{2,32}"
          required
        />
        <button disabled={busy}>{busy ? '...' : "Qo'ng'iroq"}</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  )
}
