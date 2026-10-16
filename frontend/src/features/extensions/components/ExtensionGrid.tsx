import { useState } from 'react'
import { formatDateTime } from '@/shared/lib/format'
import { Avatar, Badge, EmptyState, ErrorMessage, IconButton, Skeleton } from '@/shared/ui'
import {
  useDeleteExtension,
  useExtensions,
  useResetExtensionPassword,
} from '../hooks/useExtensions'
import type { Extension } from '../types'
import styles from './Extensions.module.css'

const SIP_SERVER = `${window.location.hostname}:5060`

function Password({ value }: { value: string }) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setVisible(true) // clipboard ruxsat berilmasa — foydalanuvchi qo'lda ko'chirsin
    }
  }

  return (
    <div className={styles.secret}>
      <code>{visible ? value : '••••••••••'}</code>
      <IconButton
        icon={visible ? 'eyeOff' : 'eye'}
        label={visible ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
        onClick={() => setVisible((v) => !v)}
      />
      <IconButton icon={copied ? 'check' : 'copy'} label="Nusxalash" onClick={copy} />
    </div>
  )
}

export function ExtensionGrid() {
  const { data, isLoading, error } = useExtensions()
  const remove = useDeleteExtension()
  const reset = useResetExtensionPassword()

  const confirmRemove = (ext: Extension) => {
    if (window.confirm(`${ext.number} (${ext.display_name}) o'chirilsinmi?`)) {
      remove.mutate(ext.id)
    }
  }

  const confirmReset = (ext: Extension) => {
    if (
      window.confirm(`${ext.number} uchun yangi parol yaratilsinmi? Telefondagi eski parol ishlamay qoladi.`)
    ) {
      reset.mutate(ext.id)
    }
  }

  if (isLoading) return <Skeleton rows={3} />
  if (error) return <ErrorMessage error={error} />
  if (!data?.length) return <EmptyState icon="users">Hozircha SIP hisoblar yo'q</EmptyState>

  return (
    <>
      <p className={styles.hint}>
        Telefon yoki softphone (Zoiper, Linphone…) ulash uchun: server <b>{SIP_SERVER}</b>, login —
        raqamning o‘zi, parol — quyidagi parol.
      </p>
      <ul className={styles.grid}>
        {data.map((ext) => (
          <li key={ext.id} className={styles.item}>
            <Avatar label={ext.display_name} seed={ext.number} size={46} />
            <div className={styles.info}>
              <strong>{ext.display_name}</strong>
              <span className={styles.number}>
                {ext.number}{' '}
                <Badge tone={ext.online ? 'success' : 'neutral'}>
                  {ext.online ? 'Online' : 'Offlayn'}
                </Badge>
              </span>
              <Password value={ext.password} />
              <small>{formatDateTime(ext.created_at)}</small>
            </div>
            <div className={styles.actions}>
              <IconButton
                icon="refresh"
                label="Yangi parol"
                disabled={reset.isPending}
                onClick={() => confirmReset(ext)}
              />
              <IconButton
                icon="trash"
                label="O'chirish"
                tone="danger"
                disabled={remove.isPending}
                onClick={() => confirmRemove(ext)}
              />
            </div>
          </li>
        ))}
      </ul>
      <ErrorMessage error={remove.error ?? reset.error} />
    </>
  )
}
