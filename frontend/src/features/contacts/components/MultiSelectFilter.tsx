import { Icon } from '@/shared/ui'
import styles from './Contacts.module.css'

interface Props {
  label: string
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
}

/** Ko'p tanlanadigan ochiladigan filtr (kasblar uchun). */
export function MultiSelectFilter({ label, options, selected, onChange }: Props) {
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])

  return (
    <details className={styles.multi}>
      <summary className={selected.length ? styles.multiOn : ''}>
        <Icon name="filter" size={15} />
        {label}
        {selected.length > 0 && <b>{selected.length}</b>}
        <Icon name="chevronDown" size={14} />
      </summary>
      <div className={styles.multiMenu}>
        {options.length === 0 && <p className={styles.menuEmpty}>Hozircha kasblar yo'q</p>}
        {options.map((option) => (
          <label key={option} className={styles.menuItem}>
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggle(option)}
            />
            {option}
          </label>
        ))}
        {selected.length > 0 && (
          <button type="button" className={styles.menuClear} onClick={() => onChange([])}>
            Tozalash
          </button>
        )}
      </div>
    </details>
  )
}
