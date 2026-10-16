import { Link, useParams } from 'react-router-dom'
import { CampaignDetailView } from '@/features/campaigns'
import { Icon, PageHeader } from '@/shared/ui'
import { NotFoundPage } from './NotFoundPage'

export function CampaignDetailPage() {
  const id = Number(useParams().id)
  if (!Number.isInteger(id)) return <NotFoundPage />

  return (
    <>
      <PageHeader
        title="Ommaviy qo'ng'iroq"
        actions={
          <Link to="/campaigns">
            <Icon name="chevronLeft" size={16} /> Barcha ommaviy qo‘ng‘iroqlar
          </Link>
        }
      />
      <CampaignDetailView id={id} />
    </>
  )
}
