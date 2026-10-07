import { useContext } from 'react'
import { CallEventsContext } from './context'

export function useCallEvents() {
  const value = useContext(CallEventsContext)
  if (!value) throw new Error('useCallEvents faqat CallEventsProvider ichida ishlaydi')
  return value
}
