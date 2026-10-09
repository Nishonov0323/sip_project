import styles from './Skeleton.module.css'

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className={styles.wrapper} aria-busy="true" aria-label="Yuklanmoqda">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.row} />
      ))}
    </div>
  )
}
