import type { ButtonHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon'
import styles from './IconButton.module.css'

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName
  label: string
  tone?: 'neutral' | 'danger'
}

export function IconButton({ icon, label, tone = 'neutral', className, ...rest }: Props) {
  const cls = [styles.button, styles[tone], className].filter(Boolean).join(' ')
  return (
    <button {...rest} className={cls} aria-label={label} title={label}>
      <Icon name={icon} size={18} />
    </button>
  )
}
