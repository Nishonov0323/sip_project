import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { callKeys, callsApi } from '../api/calls.api'
import type { OriginateRequest, PlaybackRequest } from '../types'

export function useCallHistory(limit = 50, offset = 0) {
  return useQuery({
    queryKey: callKeys.history(limit, offset),
    queryFn: () => callsApi.history(limit, offset),
    placeholderData: keepPreviousData,
  })
}

export function useOriginateCall() {
  return useMutation({ mutationFn: (data: OriginateRequest) => callsApi.originate(data) })
}

export function useStartPlaybackCall() {
  return useMutation({ mutationFn: (data: PlaybackRequest) => callsApi.playback(data) })
}

export function useHangupCall() {
  return useMutation({ mutationFn: (channelId: string) => callsApi.hangup(channelId) })
}

export function useTranscribeCall() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (callId: number) => callsApi.transcribe(callId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: callKeys.all }),
  })
}
