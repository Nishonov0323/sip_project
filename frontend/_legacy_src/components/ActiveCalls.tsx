import { callsApi } from '../api/calls'
import type { LiveCall } from '../types'

interface Props {
  calls: LiveCall[]
}

export function ActiveCalls({ calls }: Props) {
  return (
    <section className="card">
      <h2>Faol qo'ng'iroqlar</h2>
      {calls.length === 0 ? (
        <p className="muted">Hozircha yo'q</p>
      ) : (
        <ul className="list">
          {calls.map((c) => (
            <li key={c.channel_id}>
              <span>
                {c.caller} → {c.callee}
              </span>
              <span className={`badge ${c.status}`}>{c.status}</span>
              <button className="danger" onClick={() => callsApi.hangup(c.channel_id)}>
                Uzish
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
