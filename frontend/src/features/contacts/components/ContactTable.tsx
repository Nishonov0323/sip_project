import { Avatar, Badge, EmptyState, IconButton } from '@/shared/ui'
import type { Contact } from '../types'
import styles from './Contacts.module.css'

interface Props {
  contacts: Contact[]
  isSelected: (id: number) => boolean
  onToggle: (id: number) => void
  allOnPageSelected: boolean
  onTogglePage: () => void
  onEdit: (contact: Contact) => void
  onDelete: (contact: Contact) => void
}

export function ContactTable({
  contacts,
  isSelected,
  onToggle,
  allOnPageSelected,
  onTogglePage,
  onEdit,
  onDelete,
}: Props) {
  if (contacts.length === 0) {
    return <EmptyState icon="book">Filtrga mos kontakt topilmadi</EmptyState>
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.check}>
              <input
                type="checkbox"
                checked={allOnPageSelected}
                onChange={onTogglePage}
                aria-label="Sahifadagi hammasini tanlash"
              />
            </th>
            <th>Kontakt</th>
            <th>Telefon</th>
            <th>Guruh</th>
            <th>Kasbi</th>
            <th aria-label="Amallar" />
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => {
            const selected = isSelected(c.id)
            return (
              <tr
                key={c.id}
                className={selected ? styles.selected : ''}
                onClick={() => onToggle(c.id)}
              >
                <td className={styles.check} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggle(c.id)}
                    aria-label={`${c.full_name} ni tanlash`}
                  />
                </td>
                <td>
                  <div className={styles.person}>
                    <Avatar label={c.full_name} seed={c.phone} size={36} />
                    <strong>{c.full_name}</strong>
                  </div>
                </td>
                <td className={styles.phone}>{c.phone}</td>
                <td>{c.group_name ? <Badge tone="info">{c.group_name}</Badge> : <span className={styles.dash}>—</span>}</td>
                <td>{c.profession ?? <span className={styles.dash}>—</span>}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className={styles.rowActions}>
                    <IconButton icon="edit" label="Tahrirlash" onClick={() => onEdit(c)} />
                    <IconButton
                      icon="trash"
                      label="O'chirish"
                      tone="danger"
                      onClick={() => onDelete(c)}
                    />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
