import type { IconName } from '@/shared/ui'

export interface NavItem {
  to: string
  label: string
  icon: IconName
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Bosh sahifa', icon: 'dashboard' },
  { to: '/dialer', label: "Qo'ng'iroq", icon: 'phone' },
  { to: '/audio', label: 'Audio', icon: 'music' },
  { to: '/history', label: 'Tarix', icon: 'clock' },
  { to: '/extensions', label: 'Raqamlar', icon: 'users' },
]
