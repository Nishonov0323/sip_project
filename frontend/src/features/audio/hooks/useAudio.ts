import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { audioApi, audioKeys } from '../api/audio.api'

export function useAudioFiles() {
  return useQuery({ queryKey: audioKeys.all, queryFn: audioApi.list })
}

export function useUploadAudio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => audioApi.upload(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: audioKeys.all }),
  })
}

export function useDeleteAudio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => audioApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: audioKeys.all }),
  })
}
