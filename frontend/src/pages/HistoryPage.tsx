import { useState } from 'react'
import { CallHistoryTable, useCallHistory } from '@/features/calls'
import { Button, Card, ErrorMessage, PageHeader } from '@/shared/ui'
import styles from './pages.module.css'

const PAGE_SIZE = 20

export function HistoryPage() {
  const [page, setPage] = useState(0)
  const { data = [], isLoading, error } = useCallHistory(PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <PageHeader title="Qo'ng'iroqlar tarixi" description="Barcha kiruvchi va chiquvchi qo'ng'iroqlar" />
      <Card>
        {isLoading ? <p className={styles.muted}>Yuklanmoqda...</p> : <CallHistoryTable calls={data} />}
        <ErrorMessage error={error} />
        <div className={styles.pager}>
          <Button variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            ← Oldingi
          </Button>
          <span className={styles.muted}>{page + 1}-sahifa</span>
          <Button
            variant="ghost"
            disabled={data.length < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
          >
            Keyingi →
          </Button>
        </div>
      </Card>
    </>
  )
}
