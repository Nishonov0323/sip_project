import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/shared/layout/AppLayout'
import { AudioPage } from '@/pages/AudioPage'
import { CampaignDetailPage } from '@/pages/CampaignDetailPage'
import { CampaignsPage } from '@/pages/CampaignsPage'
import { ContactsPage } from '@/pages/ContactsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DialerPage } from '@/pages/DialerPage'
import { ExtensionsPage } from '@/pages/ExtensionsPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dialer', element: <DialerPage /> },
      { path: 'audio', element: <AudioPage /> },
      { path: 'contacts', element: <ContactsPage /> },
      { path: 'campaigns', element: <CampaignsPage /> },
      { path: 'campaigns/:id', element: <CampaignDetailPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'extensions', element: <ExtensionsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
