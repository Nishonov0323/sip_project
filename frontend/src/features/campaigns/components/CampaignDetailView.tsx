import { Fragment, useState } from 'react'
import { recordingUrl, useTranscribeCall } from '@/features/calls'
import { formatDateTime, formatDuration } from '@/shared/lib/format'
import {
  AudioPlayer,
  Avatar,
  Badge,
  Button,
  Card,
  ErrorMessage,
  Icon,
  Skeleton,
} from '@/shared/ui'
import { useCampaign, useCancelCampaign } from '../hooks/useCampaigns'
import {
  CAMPAIGN_LABELS,
  CAMPAIGN_TONES,
  TARGET_ICONS,
  TARGET_LABELS,
  TARGET_TONES,
} from '../lib/status'
import type { CampaignTarget } from '../types'
import { ProgressBar } from './ProgressBar'
import styles from './Campaigns.module.css'

function TargetDetails({ target }: { target: CampaignTarget }) {
  const transcribe = useTranscribeCall()

  if (target.error) return <p className={styles.errorText}>{target.error}</p>
  if (!target.call_id || !target.has_recording) {
    return <p className={styles.muted}>Yozuv yo‘q.</p>
  }

  return (
    <div className={styles.details}>
      <AudioPlayer
        key={target.call_id}
        src={recordingUrl(target.call_id)}
        downloadName={`${target.full_name}-${target.call_id}.wav`}
      />
      {target.transcript ? (
        <blockquote className={styles.transcript}>{target.transcript}</blockquote>
      ) : (
        <div className={styles.transcribe}>
          <Button
            variant="ghost"
            icon="fileText"
            loading={transcribe.isPending}
            onClick={() => transcribe.mutate(target.call_id!)}
          >
            Matnga o‘tkazish
          </Button>
          <ErrorMessage error={transcribe.error} />
        </div>
      )}
    </div>
  )
}

export function CampaignDetailView({ id }: { id: number }) {
  const { data: campaign, isLoading, error } = useCampaign(id)
  const cancel = useCancelCampaign()
  const [openId, setOpenId] = useState<number | null>(null)

  if (isLoading) return <Skeleton rows={4} />
  if (error || !campaign) return <ErrorMessage error={error ?? new Error('Ommaviy qo‘ng‘iroq topilmadi')} />

  const running = campaign.status === 'running'
  const failed = campaign.targets.filter((t) => t.status === 'failed').length
  const noAnswer = campaign.targets.filter((t) => t.status === 'no_answer').length

  const confirmCancel = () => {
    if (window.confirm('Qolgan qo‘ng‘iroqlar bekor qilinsinmi? Davom etayotganlari uziladi.')) {
      cancel.mutate(campaign.id)
    }
  }

  return (
    <div className={styles.page}>
      <Card>
        <div className={styles.head}>
          <div>
            <h2 className={styles.title}>{campaign.name}</h2>
            <p className={styles.muted}>
              <Icon name="music" size={14} /> {campaign.audio_name} ·{' '}
              {formatDateTime(campaign.created_at)}
            </p>
          </div>
          <div className={styles.headEnd}>
            <Badge tone={CAMPAIGN_TONES[campaign.status]}>{CAMPAIGN_LABELS[campaign.status]}</Badge>
            {running && (
              <Button variant="danger" icon="phoneOff" loading={cancel.isPending} onClick={confirmCancel}>
                To‘xtatish
              </Button>
            )}
          </div>
        </div>
        <ProgressBar done={campaign.done} total={campaign.total} />
        <dl className={styles.stats}>
          <div>
            <dt>Jami</dt>
            <dd>{campaign.total}</dd>
          </div>
          <div>
            <dt>Yakunlangan</dt>
            <dd>{campaign.done}</dd>
          </div>
          <div>
            <dt>Eshitdi</dt>
            <dd className={styles.ok}>{campaign.answered}</dd>
          </div>
          <div>
            <dt>Javob bermadi</dt>
            <dd>{noAnswer}</dd>
          </div>
          <div>
            <dt>Xatolik</dt>
            <dd className={failed ? styles.bad : ''}>{failed}</dd>
          </div>
        </dl>
        <ErrorMessage error={cancel.error} />
      </Card>

      <Card title="Qabul qiluvchilar">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Kontakt</th>
                <th>Holat</th>
                <th>Davomiyligi</th>
                <th aria-label="Yozuv" />
              </tr>
            </thead>
            <tbody>
              {campaign.targets.map((t) => {
                const expandable = t.has_recording || t.error
                const open = openId === t.id
                return (
                  <Fragment key={t.id}>
                    <tr
                      className={`${expandable ? styles.clickable : ''} ${open ? styles.open : ''}`}
                      onClick={() => expandable && setOpenId(open ? null : t.id)}
                    >
                      <td>
                        <div className={styles.person}>
                          <Avatar label={t.full_name} seed={t.phone} size={34} pulse={t.status === 'calling'} />
                          <div>
                            <strong>{t.full_name}</strong>
                            <small>{t.phone}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge tone={TARGET_TONES[t.status]} icon={TARGET_ICONS[t.status]}>
                          {TARGET_LABELS[t.status]}
                        </Badge>
                      </td>
                      <td className={styles.num}>
                        {t.status === 'answered' ? formatDuration(t.duration_seconds) : '—'}
                      </td>
                      <td>
                        <div className={styles.rec}>
                        {t.has_recording && <Icon name="mic" size={16} />}
                        {t.transcript && <Icon name="fileText" size={16} />}
                        {expandable && (
                          <Icon
                            name="chevronDown"
                            size={16}
                            className={open ? styles.chevronOpen : styles.chevron}
                          />
                        )}
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr className={styles.detailsRow}>
                        <td colSpan={4}>
                          <TargetDetails target={t} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
