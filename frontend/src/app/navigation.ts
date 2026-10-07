export interface NavItem {
  to: string
  label: string
  icon: string
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Bosh sahifa', icon: '▦' },
  { to: '/dialer', label: "Qo'ng'iroq", icon: '☎' },
  { to: '/history', label: 'Tarix', icon: '◷' },
  { to: '/extensions', label: 'Raqamlar', icon: '☰' },
]
