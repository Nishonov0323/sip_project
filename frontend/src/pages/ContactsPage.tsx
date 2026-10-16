import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LaunchCampaignModal, type Recipients } from '@/features/campaigns'
import { ContactsBrowser } from '@/features/contacts'
import { Button, PageHeader } from '@/shared/ui'

export function ContactsPage() {
  const [recipients, setRecipients] = useState<Recipients | null>(null)

  return (
    <>
      <PageHeader
        title="Kontaktlar"
        description="Guruh va kasb bo'yicha saralang, kerakli odamlarni belgilab, audio bilan qo'ng'iroq qiling"
        actions={
          <Link to="/campaigns">
            <Button variant="ghost" icon="megaphone" type="button">
              Ommaviy qo'ng'iroqlar
            </Button>
          </Link>
        }
      />
      <ContactsBrowser onCall={setRecipients} />
      <LaunchCampaignModal recipients={recipients} onClose={() => setRecipients(null)} />
    </>
  )
}
