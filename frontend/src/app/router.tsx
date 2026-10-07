import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/shared/layout/AppLayout'
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
      { path: 'history', element: <HistoryPage /> },
      { path: 'extensions', element: <ExtensionsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
