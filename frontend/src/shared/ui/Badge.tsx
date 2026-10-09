import type { ReactNode } from 'react'
import styles from './Badge.module.css'
import { Icon, type IconName } from './Icon'

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

interface Props {
  tone?: Tone
  icon?: IconName
  children: ReactNode
}

export function Badge({ tone = 'neutral', icon, children }: Props) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  )
}
