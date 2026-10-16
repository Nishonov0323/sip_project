import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { campaignKeys, campaignsApi } from '../api/campaigns.api'
import type { CreateCampaignRequest } from '../types'

// Asosiy yangilanish WebSocket orqali keladi (`campaign_updated`); polling — zaxira.
const POLL_MS = 3000

export function useCampaigns() {
  return useQuery({
    queryKey: campaignKeys.all,
    queryFn: campaignsApi.list,
    refetchInterval: (q) => (q.state.data?.some((c) => c.status === 'running') ? POLL_MS : false),
  })
}

export function useCampaign(id: number) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => campaignsApi.get(id),
    refetchInterval: (q) => (q.state.data?.status === 'running' ? POLL_MS : false),
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCampaignRequest) => campaignsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campaignKeys.all }),
  })
}

export function useCancelCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => campaignsApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campaignKeys.all }),
  })
}
