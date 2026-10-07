import type { Call } from '../types'

interface Props {
  calls: Call[]
}

export function CallHistory({ calls }: Props) {
  return (
    <section className="card">
      <h2>Qo'ng'iroqlar tarixi</h2>
      {calls.length === 0 ? (
        <p className="muted">Tarix bo'sh</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Kimdan</th>
              <th>Kimga</th>
              <th>Holat</th>
              <th>Davomiyligi</th>
              <th>Vaqt</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <tr key={c.id}>
                <td>{c.caller}</td>
                <td>{c.callee}</td>
                <td>
                  <span className={`badge ${c.status}`}>{c.status}</span>
                </td>
                <td>{c.duration_seconds}s</td>
                <td>{new Date(c.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
