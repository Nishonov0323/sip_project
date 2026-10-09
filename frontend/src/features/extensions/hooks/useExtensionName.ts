import { useMemo } from 'react'
import { useExtensions } from './useExtensions'

/** Raqam bo'yicha extension nomini topadi (masalan, "1001" → "User 1001"). */
export function useExtensionName() {
  const { data } = useExtensions()
  const names = useMemo(() => new Map((data ?? []).map((e) => [e.number, e.display_name])), [data])
  return (number: string) => names.get(number)
}
