import { useState } from 'react'
import {
  CallHistoryTable,
  EMPTY_FILTERS,
  HistoryFilters,
  isFiltered,
  useCallHistory,
  type CallFilters,
} from '@/features/calls'
import { Button, Card, ErrorMessage, Icon, PageHeader, Skeleton } from '@/shared/ui'
import styles from './pages.module.css'

const PAGE_SIZE = 20

export function HistoryPage() {
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<CallFilters>(EMPTY_FILTERS)
  const { data = [], isLoading, error } = useCallHistory(PAGE_SIZE, page * PAGE_SIZE, filters)

  // Filtr o'zgarsa, birinchi sahifadan boshlanadi
  const changeFilters = (next: CallFilters) => {
    setFilters(next)
    setPage(0)
  }

  return (
    <>
      <PageHeader
        title="Qo'ng'iroqlar tarixi"
        description="Barcha kiruvchi va chiquvchi qo'ng'iroqlar"
      />
      <Card>
        <HistoryFilters value={filters} onChange={changeFilters} />
        {isLoading ? (
          <Skeleton rows={5} />
        ) : (
          <CallHistoryTable
            calls={data}
            emptyText={isFiltered(filters) ? 'Filtrga mos qo‘ng‘iroq topilmadi' : undefined}
          />
        )}
        <ErrorMessage error={error} />
        <div className={styles.pager}>
          <Button
            variant="ghost"
            icon="chevronLeft"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Oldingi
          </Button>
          <span className={styles.muted}>{page + 1}-sahifa</span>
          <Button
            variant="ghost"
            disabled={data.length < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
          >
            Keyingi
            <Icon name="chevronRight" size={18} />
          </Button>
        </div>
      </Card>
    </>
  )
}
