import { AudioLibrary, AudioUploader } from '@/features/audio'
import { Card, PageHeader } from '@/shared/ui'
import styles from './pages.module.css'

export function AudioPage() {
  return (
    <>
      <PageHeader
        title="Audio kutubxona"
        description="Avto-qo'ng'iroqda ijro etiladigan ovozli xabarlar"
      />
      <div className={styles.stack}>
        <Card title="Yangi audio yuklash">
          <AudioUploader />
        </Card>
        <Card title="Yuklangan audiolar">
          <AudioLibrary />
        </Card>
      </div>
    </>
  )
}
