import { Icon, type IconName } from './Icon'
import styles from './EmptyState.module.css'

interface Props {
  children: string
  icon?: IconName
}

export function EmptyState({ children, icon = 'phone' }: Props) {
  return (
    <div className={styles.empty}>
      <span className={styles.icon}>
        <Icon name={icon} size={22} />
      </span>
      <p>{children}</p>
    </div>
  )
}
