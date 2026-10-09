import { formatDateTime } from '@/shared/lib/format'
import { Button, EmptyState, ErrorMessage } from '@/shared/ui'
import { useDeleteExtension, useExtensions } from '../hooks/useExtensions'
import type { Extension } from '../types'
import styles from './Extensions.module.css'

export function ExtensionTable() {
  const { data, isLoading, error } = useExtensions()
  const remove = useDeleteExtension()

  const confirmRemove = (ext: Extension) => {
    if (window.confirm(`${ext.number} (${ext.display_name}) o'chirilsinmi?`)) {
      remove.mutate(ext.id)
    }
  }

  if (isLoading) return <EmptyState>Yuklanmoqda...</EmptyState>
  if (error) return <ErrorMessage error={error} />
  if (!data?.length) return <EmptyState>Hozircha raqamlar yo'q</EmptyState>

  return (
    <>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Raqam</th>
            <th>Ism</th>
            <th>Qo'shilgan</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.map((ext) => (
            <tr key={ext.id}>
              <td>
                <b>{ext.number}</b>
              </td>
              <td>{ext.display_name}</td>
              <td>{formatDateTime(ext.created_at)}</td>
              <td className={styles.actions}>
                <Button
                  variant="ghost"
                  disabled={remove.isPending}
                  onClick={() => confirmRemove(ext)}
                >
                  O'chirish
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ErrorMessage error={remove.error} />
    </>
  )
}
