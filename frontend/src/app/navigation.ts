import type { IconName } from '@/shared/ui'

export interface NavItem {
  to: string
  label: string
  icon: IconName
  /** Menyuning pastki qismiga ajratib qo'yiladi (sozlama xarakteridagi bo'lim). */
  secondary?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Bosh sahifa', icon: 'dashboard' },
  { to: '/dialer', label: "Qo'ng'iroq", icon: 'phone' },
  { to: '/audio', label: 'Audio', icon: 'music' },
  { to: '/contacts', label: 'Kontaktlar', icon: 'book' },
  { to: '/campaigns', label: 'Ommaviy qo‘ng‘iroqlar', icon: 'megaphone' },
  { to: '/history', label: 'Tarix', icon: 'clock' },
  { to: '/extensions', label: 'SIP hisoblar', icon: 'users', secondary: true },
]
