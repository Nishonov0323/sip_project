import { Link } from 'react-router-dom'
import { ActiveCalls, CallHistoryTable, CallStatsGrid, useCallHistory } from '@/features/calls'
import { formatLongDate } from '@/shared/lib/format'
import { Card, Icon, PageHeader } from '@/shared/ui'
import styles from './pages.module.css'

const today = formatLongDate(new Date())

export function DashboardPage() {
  const { data = [] } = useCallHistory(8, 0)

  return (
    <>
      <PageHeader title="Bosh sahifa" description={`Telefoniya holati · ${today}`} />
      <div className={styles.stack}>
        <CallStatsGrid />
        <ActiveCalls />
        <Card
          title="So'nggi qo'ng'iroqlar"
          actions={
            <Link to="/history" className={styles.more}>
              Barchasi <Icon name="arrowRight" size={15} />
            </Link>
          }
        >
          <CallHistoryTable calls={data} />
        </Card>
      </div>
    </>
  )
}
