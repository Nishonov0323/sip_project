import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

interface Props {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: Props) {
  return (
    <header className={styles.header}>
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions}
    </header>
  )
}
