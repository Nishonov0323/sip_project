import { formatDateTime } from '@/shared/lib/format'
import { Avatar, EmptyState, ErrorMessage, IconButton, Skeleton } from '@/shared/ui'
import { useDeleteExtension, useExtensions } from '../hooks/useExtensions'
import type { Extension } from '../types'
import styles from './Extensions.module.css'

export function ExtensionGrid() {
  const { data, isLoading, error } = useExtensions()
  const remove = useDeleteExtension()

  const confirmRemove = (ext: Extension) => {
    if (window.confirm(`${ext.number} (${ext.display_name}) o'chirilsinmi?`)) {
      remove.mutate(ext.id)
    }
  }

  if (isLoading) return <Skeleton rows={3} />
  if (error) return <ErrorMessage error={error} />
  if (!data?.length) return <EmptyState icon="users">Hozircha raqamlar yo'q</EmptyState>

  return (
    <>
      <ul className={styles.grid}>
        {data.map((ext) => (
          <li key={ext.id} className={styles.item}>
            <Avatar label={ext.display_name} seed={ext.number} size={46} />
            <div className={styles.info}>
              <strong>{ext.display_name}</strong>
              <span className={styles.number}>{ext.number}</span>
              <small>{formatDateTime(ext.created_at)}</small>
            </div>
            <IconButton
              icon="trash"
              label="O'chirish"
              tone="danger"
              disabled={remove.isPending}
              onClick={() => confirmRemove(ext)}
            />
          </li>
        ))}
      </ul>
      <ErrorMessage error={remove.error} />
    </>
  )
}
