import styles from './SegmentedControl.module.css'
import { Icon, type IconName } from './Icon'

interface Option<T extends string> {
  value: T
  label: string
  icon?: IconName
}

interface Props<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div className={styles.control} role="tablist">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={opt.value === value}
          className={`${styles.option} ${opt.value === value ? styles.active : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon && <Icon name={opt.icon} size={16} />}
          {opt.label}
        </button>
      ))}
    </div>
  )
}
