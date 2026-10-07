import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  loading,
  disabled,
  className,
  children,
  ...rest
}: Props) {
  const cls = [styles.button, styles[variant], className].filter(Boolean).join(' ')
  return (
    <button {...rest} className={cls} disabled={disabled || loading}>
      {loading ? '...' : children}
    </button>
  )
}
