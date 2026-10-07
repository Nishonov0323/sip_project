import styles from './EmptyState.module.css'

export function EmptyState({ children }: { children: string }) {
  return <p className={styles.empty}>{children}</p>
}
