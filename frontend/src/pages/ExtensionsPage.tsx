import { ExtensionForm, ExtensionGrid } from '@/features/extensions'
import { Card, PageHeader } from '@/shared/ui'
import styles from './pages.module.css'

export function ExtensionsPage() {
  return (
    <>
      <PageHeader title="Raqamlar" description="Ichki SIP raqamlar (extensions) boshqaruvi" />
      <div className={styles.stack}>
        <Card title="Yangi raqam">
          <ExtensionForm />
        </Card>
        <Card title="Barcha raqamlar">
          <ExtensionGrid />
        </Card>
      </div>
    </>
  )
}
