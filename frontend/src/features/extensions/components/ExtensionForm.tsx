import { useState, type FormEvent } from 'react'
import { NUMBER_PATTERN_ATTR } from '@/shared/lib/validation'
import { Button, ErrorMessage } from '@/shared/ui'
import { useCreateExtension } from '../hooks/useExtensions'
import styles from './Extensions.module.css'

export function ExtensionForm() {
  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const create = useCreateExtension()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate(
      { number, display_name: name.trim() },
      {
        onSuccess: () => {
          setNumber('')
          setName('')
        },
      },
    )
  }

  return (
    <>
      <form onSubmit={submit} className={styles.form}>
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Raqam (1001)"
          pattern={NUMBER_PATTERN_ATTR}
          aria-label="Raqam"
          required
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ism"
          maxLength={128}
          aria-label="Ism"
          required
        />
        <Button loading={create.isPending}>Qo'shish</Button>
      </form>
      <ErrorMessage error={create.error} />
    </>
  )
}
