import { Link } from 'react-router-dom'
import { PageHeader } from '@/shared/ui'

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Sahifa topilmadi" description="Bunday manzil mavjud emas." />
      <Link to="/">← Bosh sahifaga qaytish</Link>
    </>
  )
}
