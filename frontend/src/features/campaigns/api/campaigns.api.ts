import { http } from '@/shared/api/http'
import type { Campaign, CampaignDetail, CreateCampaignRequest } from '../types'

export const campaignKeys = {
  all: ['campaigns'] as const,
  detail: (id: number) => ['campaigns', 'detail', id] as const,
}

export const campaignsApi = {
  list: () => http<Campaign[]>('/campaigns'),
  get: (id: number) => http<CampaignDetail>(`/campaigns/${id}`),
  create: (data: CreateCampaignRequest) =>
    http<Campaign>('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  cancel: (id: number) => http<Campaign>(`/campaigns/${id}/cancel`, { method: 'POST' }),
}
