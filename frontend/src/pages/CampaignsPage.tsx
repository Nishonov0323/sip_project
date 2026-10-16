import { Link } from 'react-router-dom'
import { CampaignList } from '@/features/campaigns'
import { Button, Card, PageHeader } from '@/shared/ui'

export function CampaignsPage() {
  return (
    <>
      <PageHeader
        title="Ommaviy qo'ng'iroqlar"
        description="Bir audio ko'p odamga eshittirilgan qo'ng'iroqlar va natijalari"
        actions={
          <Link to="/contacts">
            <Button icon="book" type="button">
              Kontaktlarni tanlash
            </Button>
          </Link>
        }
      />
      <Card>
        <CampaignList />
      </Card>
    </>
  )
}
