import { useRef } from 'react'
import { Button, ErrorMessage, Icon, Modal } from '@/shared/ui'
import { useImportContacts } from '../hooks/useContacts'
import styles from './Contacts.module.css'

const SAMPLE = [
  'ism,telefon,guruh,kasb',
  'Karim Aliyev,+998901234567,Nafaqadagilar,O\'qituvchi',
  'Dilnoza Karimova,+998931112233,Xodimlar,Shifokor',
].join('\n')

function downloadSample() {
  const blob = new Blob(['﻿' + SAMPLE], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'kontaktlar-namuna.csv'
  a.click()
  URL.revokeObjectURL(url)
}

interface Props {
  open: boolean
  onClose: () => void
}

export function ImportModal({ open, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const importer = useImportContacts()
  const result = importer.data

  const close = () => {
    importer.reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      title="CSV fayldan import"
      onClose={close}
      footer={
        <Button variant="ghost" onClick={close}>
          Yopish
        </Button>
      }
    >
      <p className={styles.hint}>
        Birinchi qator sarlavha bo'lishi kerak: <code>ism</code>, <code>telefon</code> majburiy,{' '}
        <code>guruh</code> va <code>kasb</code> ixtiyoriy. Yangi guruhlar avtomatik yaratiladi,
        raqami bor kontaktlar yangilanadi. Excel'dan "CSV UTF-8" qilib saqlang.
      </p>
      <div className={styles.importActions}>
        <Button
          icon="upload"
          loading={importer.isPending}
          onClick={() => inputRef.current?.click()}
        >
          CSV tanlash
        </Button>
        <Button variant="ghost" icon="download" onClick={downloadSample}>
          Namuna fayl
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) importer.mutate(file)
            e.target.value = ''
          }}
        />
      </div>
      <ErrorMessage error={importer.error} />
      {result && (
        <div className={styles.importResult} role="status">
          <p>
            <Icon name="check" size={16} /> Yangi: <b>{result.created}</b> · Yangilandi:{' '}
            <b>{result.updated}</b> · O'tkazib yuborildi: <b>{result.skipped}</b>
          </p>
          {result.errors.length > 0 && (
            <ul>
              {result.errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  )
}
