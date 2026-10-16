import type { IconName, Tone } from '@/shared/ui'
import type { CampaignStatus, TargetStatus } from '../types'

export const CAMPAIGN_LABELS: Record<CampaignStatus, string> = {
  running: 'Davom etmoqda',
  finished: 'Tugadi',
  cancelled: 'Bekor qilindi',
  interrupted: 'To‘xtab qoldi',
}

export const CAMPAIGN_TONES: Record<CampaignStatus, Tone> = {
  running: 'info',
  finished: 'success',
  cancelled: 'neutral',
  interrupted: 'warning',
}

export const TARGET_LABELS: Record<TargetStatus, string> = {
  pending: 'Navbatda',
  calling: 'Qo‘ng‘iroq qilinmoqda',
  answered: 'Eshitdi',
  no_answer: 'Javob bermadi',
  failed: 'Xatolik',
  cancelled: 'Bekor qilindi',
}

export const TARGET_TONES: Record<TargetStatus, Tone> = {
  pending: 'neutral',
  calling: 'info',
  answered: 'success',
  no_answer: 'warning',
  failed: 'danger',
  cancelled: 'neutral',
}

export const TARGET_ICONS: Record<TargetStatus, IconName> = {
  pending: 'clock',
  calling: 'phoneCall',
  answered: 'check',
  no_answer: 'phoneMissed',
  failed: 'phoneOff',
  cancelled: 'x',
}
