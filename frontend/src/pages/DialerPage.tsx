import { useSearchParams } from 'react-router-dom'
import { ActiveCalls, Dialer, PlaybackCallForm } from '@/features/calls'
import { PageHeader, SegmentedControl } from '@/shared/ui'
import styles from './pages.module.css'

type Tab = 'call' | 'auto'

export function DialerPage() {
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'auto' ? 'auto' : 'call'
  const audioParam = Number(params.get('audio'))

  return (
    <>
      <PageHeader
        title="Qo'ng'iroq"
        description="Ichki raqamdan qo'ng'iroq yoki audio bilan avto-qo'ng'iroq"
        actions={
          <SegmentedControl<Tab>
            value={tab}
            onChange={(next) => setParams(next === 'auto' ? { tab: 'auto' } : {})}
            options={[
              { value: 'call', label: "Oddiy qo'ng'iroq", icon: 'phone' },
              { value: 'auto', label: "Avto-qo'ng'iroq", icon: 'music' },
            ]}
          />
        }
      />
      <div className={styles.split}>
        {tab === 'call' ? (
          <Dialer />
        ) : (
          <PlaybackCallForm initialAudioId={audioParam > 0 ? audioParam : undefined} />
        )}
        <ActiveCalls />
      </div>
    </>
  )
}
