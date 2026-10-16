import { useEffect, useMemo, useState } from 'react'
import { Button, Card, ErrorMessage, Icon, Skeleton } from '@/shared/ui'
import {
  useAssignGroup,
  useContacts,
  useDeleteContact,
  useGroups,
  useProfessions,
} from '../hooks/useContacts'
import { EMPTY_FILTER, type CallTarget, type Contact, type ContactFilter } from '../types'
import { ContactFormModal } from './ContactFormModal'
import { ContactTable } from './ContactTable'
import { GroupChips } from './GroupChips'
import { ImportModal } from './ImportModal'
import { MultiSelectFilter } from './MultiSelectFilter'
import styles from './Contacts.module.css'

const PAGE_SIZE = 50

interface Selection {
  ids: Set<number>
  /** `true` — filtrga mos BARCHA kontaktlar (boshqa sahifalardagilar ham) tanlangan. */
  allMatching: boolean
}

const NO_SELECTION: Selection = { ids: new Set(), allMatching: false }

function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms)
    return () => window.clearTimeout(t)
  }, [value, ms])
  return debounced
}

interface Props {
  /** "Qo'ng'iroq qilish" bosilganda: kimlarga qo'ng'iroq qilinishini xabar qiladi. */
  onCall: (target: CallTarget) => void
}

export function ContactsBrowser({ onCall }: Props) {
  const [filter, setFilter] = useState<ContactFilter>(EMPTY_FILTER)
  const [page, setPage] = useState(0)
  const [selection, setSelection] = useState<Selection>(NO_SELECTION)
  const [editing, setEditing] = useState<Contact | 'new' | null>(null)
  const [importing, setImporting] = useState(false)
  const [assignTo, setAssignTo] = useState('')

  const debouncedQ = useDebounced(filter.q)
  const queryFilter = useMemo(() => ({ ...filter, q: debouncedQ }), [filter, debouncedQ])

  const contacts = useContacts(queryFilter, PAGE_SIZE, page * PAGE_SIZE)
  const groups = useGroups()
  const professions = useProfessions()
  const remove = useDeleteContact()
  const assign = useAssignGroup()

  const items = contacts.data?.items ?? []
  const total = contacts.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Filtr o'zgarsa: birinchi sahifaga qaytamiz va tanlov bekor bo'ladi.
  const changeFilter = (patch: Partial<ContactFilter>) => {
    setFilter((f) => ({ ...f, ...patch }))
    setPage(0)
    setSelection(NO_SELECTION)
  }

  const count = selection.allMatching ? total : selection.ids.size
  const isSelected = (id: number) => selection.allMatching || selection.ids.has(id)
  const allOnPageSelected = items.length > 0 && items.every((c) => isSelected(c.id))

  const toggle = (id: number) =>
    setSelection((s) => {
      // "Hammasi" rejimida bitta kontaktni olib tashlasak, aniq ro'yxatga o'tamiz.
      const ids = s.allMatching ? new Set(items.map((c) => c.id)) : new Set(s.ids)
      if (ids.has(id)) ids.delete(id)
      else ids.add(id)
      return { ids, allMatching: false }
    })

  const togglePage = () =>
    setSelection((s) => {
      const ids = s.allMatching ? new Set<number>() : new Set(s.ids)
      for (const c of items) {
        if (allOnPageSelected) ids.delete(c.id)
        else ids.add(c.id)
      }
      return { ids, allMatching: false }
    })

  const confirmDelete = (contact: Contact) => {
    if (window.confirm(`${contact.full_name} o'chirilsinmi?`)) {
      remove.mutate(contact.id, {
        onSuccess: () =>
          setSelection((s) => {
            const ids = new Set(s.ids)
            ids.delete(contact.id)
            return { ids, allMatching: false }
          }),
      })
    }
  }

  const startCall = () => {
    if (selection.allMatching) {
      onCall({
        count: total,
        filter: {
          q: queryFilter.q.trim() || null,
          group_ids: queryFilter.groupIds,
          professions: queryFilter.professions,
        },
      })
    } else {
      onCall({ count: selection.ids.size, contactIds: [...selection.ids] })
    }
  }

  const applyGroup = () => {
    if (assignTo === '' || selection.allMatching) return
    const groupId = assignTo === 'none' ? null : Number(assignTo)
    assign.mutate(
      { ids: [...selection.ids], groupId },
      { onSuccess: () => setAssignTo('') },
    )
  }

  const hasFilter = filter.q || filter.groupIds.length > 0 || filter.professions.length > 0
  const showSelectAllBanner =
    allOnPageSelected && !selection.allMatching && total > items.length

  return (
    <Card>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Icon name="search" size={17} />
          <input
            value={filter.q}
            onChange={(e) => changeFilter({ q: e.target.value })}
            placeholder="Ism yoki telefon bo'yicha qidirish"
            aria-label="Qidirish"
          />
        </label>
        <MultiSelectFilter
          label="Kasb"
          options={professions.data ?? []}
          selected={filter.professions}
          onChange={(professions) => changeFilter({ professions })}
        />
        <div className={styles.toolbarEnd}>
          <Button variant="ghost" icon="upload" onClick={() => setImporting(true)}>
            CSV import
          </Button>
          <Button icon="plus" onClick={() => setEditing('new')}>
            Kontakt
          </Button>
        </div>
      </div>

      <GroupChips
        groups={groups.data ?? []}
        selected={filter.groupIds}
        onChange={(groupIds) => changeFilter({ groupIds })}
      />

      {count > 0 && (
        <div className={styles.selectionBar} role="status">
          <strong>{count} ta tanlandi</strong>
          {!selection.allMatching && (
            <span className={styles.assign}>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                aria-label="Guruhga o'tkazish"
              >
                <option value="">Guruhga o'tkazish...</option>
                <option value="none">Guruhsiz</option>
                {groups.data?.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                icon="check"
                disabled={assignTo === ''}
                loading={assign.isPending}
                onClick={applyGroup}
              >
                Qo'llash
              </Button>
            </span>
          )}
          <span className={styles.selectionEnd}>
            <Button variant="ghost" onClick={() => setSelection(NO_SELECTION)}>
              Bekor qilish
            </Button>
            <Button variant="success" icon="megaphone" onClick={startCall}>
              Audio bilan qo'ng'iroq
            </Button>
          </span>
        </div>
      )}

      {showSelectAllBanner && (
        <p className={styles.banner}>
          Shu sahifadagi {items.length} ta kontakt tanlandi.{' '}
          <button
            type="button"
            onClick={() => setSelection({ ids: new Set(), allMatching: true })}
          >
            {hasFilter ? `Filtrga mos barcha ${total} tasini tanlash` : `Barcha ${total} tasini tanlash`}
          </button>
        </p>
      )}
      {selection.allMatching && (
        <p className={styles.banner}>
          {hasFilter ? 'Filtrga mos' : 'Barcha'} {total} ta kontakt tanlandi.{' '}
          <button type="button" onClick={() => setSelection(NO_SELECTION)}>
            Tanlovni bekor qilish
          </button>
        </p>
      )}

      {contacts.isLoading ? (
        <Skeleton rows={6} />
      ) : (
        <ContactTable
          contacts={items}
          isSelected={isSelected}
          onToggle={toggle}
          allOnPageSelected={allOnPageSelected}
          onTogglePage={togglePage}
          onEdit={setEditing}
          onDelete={confirmDelete}
        />
      )}
      <ErrorMessage error={contacts.error ?? remove.error ?? assign.error} />

      <div className={styles.pager}>
        <span className={styles.muted}>Jami: {total} ta kontakt</span>
        {pages > 1 && (
          <span className={styles.pagerButtons}>
            <Button
              variant="ghost"
              icon="chevronLeft"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Oldingi
            </Button>
            <span className={styles.muted}>
              {page + 1} / {pages}
            </span>
            <Button variant="ghost" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>
              Keyingi
              <Icon name="chevronRight" size={18} />
            </Button>
          </span>
        )}
      </div>

      <ContactFormModal
        contact={editing}
        groups={groups.data ?? []}
        professions={professions.data ?? []}
        onClose={() => setEditing(null)}
      />
      <ImportModal open={importing} onClose={() => setImporting(false)} />
    </Card>
  )
}
