import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { audioFileUrl, useAudioFiles } from '@/features/audio'
import { formatDateTime, formatDuration } from '@/shared/lib/format'
import { AudioPlayer, Button, ErrorMessage, Icon, Modal } from '@/shared/ui'
import { useCreateCampaign } from '../hooks/useCampaigns'
import type { Recipients } from '../types'
import styles from './Campaigns.module.css'

interface Props {
  /** `null` — yopiq. */
  recipients: Recipients | null
  onClose: () => void
}

export function LaunchCampaignModal({ recipients, onClose }: Props) {
  return (
    <Modal open={recipients !== null} title="Ommaviy qo‘ng‘iroq" onClose={onClose}>
      {recipients && <LaunchForm recipients={recipients} onClose={onClose} />}
    </Modal>
  )
}

function LaunchForm({ recipients, onClose }: { recipients: Recipients; onClose: () => void }) {
  const navigate = useNavigate()
  const audio = useAudioFiles()
  const create = useCreateCampaign()
  const [audioId, setAudioId] = useState('')
  const [name, setName] = useState('')

  const selected = audio.data?.find((a) => String(a.id) === audioId)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!selected) return
    create.mutate(
      {
        audio_id: selected.id,
        name: name.trim() || `${selected.name} — ${formatDateTime(new Date().toISOString())}`,
        contact_ids: recipients.contactIds,
        filter: recipients.filter,
      },
      {
        onSuccess: (campaign) => {
          onClose()
          navigate(`/campaigns/${campaign.id}`)
        },
      },
    )
  }

  if (audio.data && audio.data.length === 0) {
    return (
      <p className={styles.noAudio}>
        <Icon name="music" size={18} /> Avval audio yuklang.{' '}
        <Link to="/audio">Audio sahifasiga o‘tish</Link>
      </p>
    )
  }

  return (
    <form onSubmit={submit} className={styles.launch}>
      <p className={styles.summary}>
        <Icon name="users" size={18} />
        <span>
          <b>{recipients.count} ta</b> kontaktga ketma-ket qo‘ng‘iroq qilinadi. Javob berganlarga
          audio eshittiriladi va ularning javobi yozib olinadi.
        </span>
      </p>

      <label className="field">
        <span>Audio</span>
        <select value={audioId} onChange={(e) => setAudioId(e.target.value)} required autoFocus>
          <option value="">Audioni tanlang...</option>
          {audio.data?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({formatDuration(a.duration_seconds)})
            </option>
          ))}
        </select>
      </label>

      {selected && <AudioPlayer key={selected.id} src={audioFileUrl(selected.id)} />}

      <label className="field">
        <span>Nomi (ixtiyoriy)</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={128}
          placeholder="Masalan, Oktyabr tabrigi"
        />
      </label>

      <ErrorMessage error={create.error ?? audio.error} />
      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onClose}>
          Bekor qilish
        </Button>
        <Button variant="success" icon="phoneCall" loading={create.isPending} disabled={!selected}>
          Qo‘ng‘iroqni boshlash
        </Button>
      </div>
    </form>
  )
}
