import { useState, type FormEvent } from 'react'
import { ErrorMessage, Icon } from '@/shared/ui'
import { useCreateGroup, useDeleteGroup } from '../hooks/useContacts'
import type { ContactGroup } from '../types'
import styles from './Contacts.module.css'

interface Props {
  groups: ContactGroup[]
  selected: number[]
  onChange: (ids: number[]) => void
}

/** Guruhlar (kategoriyalar): bosib filtrlanadi, bir nechtasini tanlash mumkin. */
export function GroupChips({ groups, selected, onChange }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const create = useCreateGroup()
  const remove = useDeleteGroup()

  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    create.mutate(name.trim(), {
      onSuccess: () => {
        setName('')
        setAdding(false)
      },
    })
  }

  const confirmRemove = (group: ContactGroup) => {
    const msg = `"${group.name}" guruhi o'chirilsinmi? Kontaktlar o'chmaydi, faqat guruhsiz qoladi.`
    if (!window.confirm(msg)) return
    remove.mutate(group.id, { onSuccess: () => onChange(selected.filter((x) => x !== group.id)) })
  }

  return (
    <div>
      <div className={styles.chips} role="group" aria-label="Guruhlar">
        <button
          type="button"
          className={`${styles.chip} ${selected.length === 0 ? styles.chipOn : ''}`}
          onClick={() => onChange([])}
        >
          Hammasi
        </button>
        {groups.map((g) => {
          const on = selected.includes(g.id)
          return (
            <span key={g.id} className={`${styles.chip} ${on ? styles.chipOn : ''}`}>
              <button
                type="button"
                className={styles.chipMain}
                onClick={() => toggle(g.id)}
                aria-pressed={on}
              >
                {g.name} <em>{g.contact_count}</em>
              </button>
              <button
                type="button"
                className={styles.chipX}
                onClick={() => confirmRemove(g)}
                aria-label={`${g.name} guruhini o'chirish`}
                title="Guruhni o'chirish"
              >
                <Icon name="x" size={12} />
              </button>
            </span>
          )
        })}
        {adding ? (
          <form onSubmit={submit} className={styles.chipForm}>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
              placeholder="Guruh nomi"
              maxLength={64}
              aria-label="Yangi guruh nomi"
            />
            <button
              type="submit"
              className={styles.chipOk}
              aria-label="Saqlash"
              disabled={create.isPending}
            >
              <Icon name="check" size={14} />
            </button>
          </form>
        ) : (
          <button
            type="button"
            className={`${styles.chip} ${styles.chipAdd}`}
            onClick={() => setAdding(true)}
          >
            <Icon name="plus" size={14} /> Guruh
          </button>
        )}
      </div>
      <ErrorMessage error={create.error ?? remove.error} />
    </div>
  )
}
