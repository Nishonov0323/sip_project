import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { extensionKeys, extensionsApi } from '../api/extensions.api'
import type { ExtensionCreate } from '../types'

export function useExtensions() {
  return useQuery({ queryKey: extensionKeys.all, queryFn: extensionsApi.list })
}

export function useCreateExtension() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ExtensionCreate) => extensionsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: extensionKeys.all }),
  })
}

export function useDeleteExtension() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => extensionsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: extensionKeys.all }),
  })
}
