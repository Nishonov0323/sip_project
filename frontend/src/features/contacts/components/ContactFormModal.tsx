import { useState, type FormEvent } from 'react'
import { Button, ErrorMessage, Modal } from '@/shared/ui'
import { useCreateContact, useUpdateContact } from '../hooks/useContacts'
import type { Contact, ContactGroup } from '../types'
import styles from './Contacts.module.css'

interface Props {
  /** `null` — yopiq, `'new'` — yangi kontakt, aks holda tahrirlanayotgan kontakt. */
  contact: Contact | 'new' | null
  groups: ContactGroup[]
  professions: string[]
  onClose: () => void
}

export function ContactFormModal({ contact, groups, professions, onClose }: Props) {
  return (
    <Modal
      open={contact !== null}
      title={contact === 'new' ? 'Yangi kontakt' : 'Kontaktni tahrirlash'}
      onClose={onClose}
    >
      {contact !== null && (
        <ContactForm
          key={contact === 'new' ? 'new' : contact.id}
          contact={contact === 'new' ? null : contact}
          groups={groups}
          professions={professions}
          onClose={onClose}
        />
      )}
    </Modal>
  )
}

interface FormProps extends Omit<Props, 'contact'> {
  contact: Contact | null
}

function ContactForm({ contact, groups, professions, onClose }: FormProps) {
  const [name, setName] = useState(contact?.full_name ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [profession, setProfession] = useState(contact?.profession ?? '')
  const [groupId, setGroupId] = useState(contact?.group_id ? String(contact.group_id) : '')
  const create = useCreateContact()
  const update = useUpdateContact()
  const mutation = contact ? update : create

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const data = {
      full_name: name.trim(),
      phone: phone.trim(),
      profession: profession.trim() || null,
      group_id: groupId ? Number(groupId) : null,
    }
    const options = { onSuccess: onClose }
    if (contact) update.mutate({ id: contact.id, data }, options)
    else create.mutate(data, options)
  }

  return (
    <form onSubmit={submit} className={styles.form}>
      <label className="field">
        <span>Ism familiya</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={128}
          required
          autoFocus
        />
      </label>
      <label className="field">
        <span>Telefon raqami</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+998901234567"
          required
        />
      </label>
      <label className="field">
        <span>Guruh</span>
        <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          <option value="">Guruhsiz</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Kasbi</span>
        <input
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
          list="profession-options"
          maxLength={96}
          placeholder="Masalan, o'qituvchi"
        />
        <datalist id="profession-options">
          {professions.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </label>
      <ErrorMessage error={mutation.error} />
      <div className={styles.formActions}>
        <Button type="button" variant="ghost" onClick={onClose}>
          Bekor qilish
        </Button>
        <Button icon="check" loading={mutation.isPending}>
          Saqlash
        </Button>
      </div>
    </form>
  )
}
