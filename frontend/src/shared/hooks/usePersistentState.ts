import { useCallback, useState } from 'react'

/** localStorage bilan sinxron state. Storage ishlamasa oddiy state sifatida ishlaydi. */
export function usePersistentState(key: string, initial: string) {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(key) ?? initial
    } catch {
      return initial
    }
  })

  const update = useCallback(
    (next: string) => {
      setValue(next)
      try {
        localStorage.setItem(key, next)
      } catch {
        /* storage mavjud emas */
      }
    },
    [key],
  )

  return [value, update] as const
}
