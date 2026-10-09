import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'
import { Icon, type IconName } from './Icon'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'ghost'
  icon?: IconName
  loading?: boolean
}

export function Button({
  variant = 'primary',
  icon,
  loading,
  disabled,
  className,
  children,
  ...rest
}: Props) {
  const cls = [styles.button, styles[variant], className].filter(Boolean).join(' ')
  return (
    <button {...rest} className={cls} disabled={disabled || loading}>
      {loading ? <span className={styles.spinner} /> : icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  )
}
