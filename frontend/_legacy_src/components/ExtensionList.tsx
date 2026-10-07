import { useState } from 'react'
import { extensionsApi } from '../api/extensions'
import type { Extension } from '../types'

interface Props {
  extensions: Extension[]
  onChange: () => void
}

export function ExtensionList({ extensions, onChange }: Props) {
  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await extensionsApi.create(number, name)
      setNumber('')
      setName('')
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik')
    }
  }

  const remove = async (id: number) => {
    await extensionsApi.remove(id)
    onChange()
  }

  return (
    <section className="card">
      <h2>Raqamlar (extensions)</h2>
      <form onSubmit={add} className="row">
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="1001"
          pattern="[0-9*#+]{2,32}"
          required
        />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ism" required />
        <button>Qo'shish</button>
      </form>
      {error && <p className="error">{error}</p>}
      <ul className="list">
        {extensions.map((x) => (
          <li key={x.id}>
            <span>
              <b>{x.number}</b> — {x.display_name}
            </span>
            <button className="danger" onClick={() => remove(x.id)}>
              O'chirish
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
