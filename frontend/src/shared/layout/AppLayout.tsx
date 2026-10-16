import { NavLink, Outlet } from 'react-router-dom'
import { NAV_ITEMS } from '@/app/navigation'
import { ConnectionIndicator } from '@/features/realtime'
import { useTheme } from '@/shared/hooks/useTheme'
import { Icon, IconButton } from '@/shared/ui'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const { theme, toggle } = useTheme()

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <Icon name="phoneCall" size={18} />
          </span>
          <span>
            SIP <b>Telefoniya</b>
          </span>
        </div>

        <nav className={styles.nav} aria-label="Asosiy menyu">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''} ${item.secondary ? styles.secondary : ''}`}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.status}>
            <ConnectionIndicator />
          </div>
          <IconButton
            icon={theme === 'dark' ? 'sun' : 'moon'}
            label={theme === 'dark' ? 'Yorug‘ rejim' : 'Qorong‘i rejim'}
            onClick={toggle}
          />
        </div>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
