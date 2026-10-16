import { ExtensionForm, ExtensionGrid } from '@/features/extensions'
import { Card, PageHeader } from '@/shared/ui'
import styles from './pages.module.css'

export function ExtensionsPage() {
  return (
    <>
      <PageHeader title="SIP hisoblar" description="Telefon yoki softphone ulanadigan ichki raqamlar (extensions)" />
      <div className={styles.stack}>
        <Card title="Yangi hisob">
          <ExtensionForm />
        </Card>
        <Card title="Barcha hisoblar">
          <ExtensionGrid />
        </Card>
      </div>
    </>
  )
}
