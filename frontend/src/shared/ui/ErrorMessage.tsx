import styles from './ErrorMessage.module.css'

export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null
  const message = error instanceof Error ? error.message : "Noma'lum xatolik"
  return (
    <p className={styles.error} role="alert">
      {message}
    </p>
  )
}
