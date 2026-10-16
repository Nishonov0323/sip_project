import { Link } from 'react-router-dom'
import { formatDateTime } from '@/shared/lib/format'
import { Badge, EmptyState, ErrorMessage, Icon, Skeleton } from '@/shared/ui'
import { useCampaigns } from '../hooks/useCampaigns'
import { CAMPAIGN_LABELS, CAMPAIGN_TONES } from '../lib/status'
import { ProgressBar } from './ProgressBar'
import styles from './Campaigns.module.css'

export function CampaignList() {
  const { data, isLoading, error } = useCampaigns()

  if (isLoading) return <Skeleton rows={3} />
  if (error) return <ErrorMessage error={error} />
  if (!data?.length) {
    return (
      <EmptyState icon="megaphone">
        Hali ommaviy qo‘ng‘iroq yo‘q. Kontaktlar sahifasida odamlarni belgilab boshlang.
      </EmptyState>
    )
  }

  return (
    <ul className={styles.list}>
      {data.map((c) => (
        <li key={c.id}>
          <Link to={`/campaigns/${c.id}`} className={styles.item}>
            <span className={styles.icon}>
              <Icon name="megaphone" size={20} />
            </span>
            <div className={styles.itemInfo}>
              <strong>{c.name}</strong>
              <small>
                <Icon name="music" size={13} /> {c.audio_name} · {formatDateTime(c.created_at)}
              </small>
            </div>
            <div className={styles.itemProgress}>
              <ProgressBar done={c.done} total={c.total} />
              <small>
                {c.done}/{c.total} · eshitdi: {c.answered}
              </small>
            </div>
            <Badge tone={CAMPAIGN_TONES[c.status]}>{CAMPAIGN_LABELS[c.status]}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  )
}
