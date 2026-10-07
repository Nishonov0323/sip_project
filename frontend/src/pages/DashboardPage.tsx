import { Link } from 'react-router-dom'
import { ActiveCalls, CallHistoryTable, CallStatsGrid, useCallHistory } from '@/features/calls'
import { Card, PageHeader } from '@/shared/ui'
import styles from './pages.module.css'

export function DashboardPage() {
  const { data = [] } = useCallHistory(8, 0)

  return (
    <>
      <PageHeader title="Bosh sahifa" description="Telefoniya holati va bugungi ko'rsatkichlar" />
      <div className={styles.stack}>
        <CallStatsGrid />
        <ActiveCalls />
        <Card
          title="So'nggi qo'ng'iroqlar"
          actions={<Link to="/history">Barchasi →</Link>}
        >
          <CallHistoryTable calls={data} />
        </Card>
      </div>
    </>
  )
}
