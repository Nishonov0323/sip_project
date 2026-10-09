import { useExtensionName } from '@/features/extensions'
import { Avatar } from '@/shared/ui'
import styles from './CallParty.module.css'

interface Props {
  number: string
  pulse?: boolean
  size?: number
}

/** Qo'ng'iroq ishtirokchisi: avatar + (mavjud bo'lsa) ism + raqam. */
export function CallParty({ number, pulse, size = 40 }: Props) {
  const nameOf = useExtensionName()
  const name = nameOf(number)

  return (
    <div className={styles.party}>
      <Avatar label={name ?? number} seed={number} size={size} pulse={pulse} />
      <div className={styles.text}>
        <strong>{name ?? (number || "Noma'lum")}</strong>
        {name && <span>{number}</span>}
      </div>
    </div>
  )
}
