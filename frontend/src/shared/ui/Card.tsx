import type { ReactNode } from 'react'
import styles from './Card.module.css'

interface Props {
  title?: string
  actions?: ReactNode
  children: ReactNode
}

export function Card({ title, actions, children }: Props) {
  return (
    <section className={styles.card}>
      {(title || actions) && (
        <header className={styles.header}>
          {title && <h2>{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  )
}
