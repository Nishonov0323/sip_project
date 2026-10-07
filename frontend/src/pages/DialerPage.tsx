import { ActiveCalls, Dialer } from '@/features/calls'
import { PageHeader } from '@/shared/ui'
import styles from './pages.module.css'

export function DialerPage() {
  return (
    <>
      <PageHeader title="Qo'ng'iroq" description="Ichki raqamdan qo'ng'iroq boshlash" />
      <div className={styles.split}>
        <Dialer />
        <ActiveCalls />
      </div>
    </>
  )
}
