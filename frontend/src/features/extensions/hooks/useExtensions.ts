import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { extensionKeys, extensionsApi } from '../api/extensions.api'
import type { ExtensionCreate } from '../types'

export function useExtensions() {
  // Online holati o'zgarib turadi — vaqti-vaqti bilan yangilanadi
  return useQuery({
    queryKey: extensionKeys.all,
    queryFn: extensionsApi.list,
    refetchInterval: 10_000,
  })
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

export function useResetExtensionPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => extensionsApi.resetPassword(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: extensionKeys.all }),
  })
}
