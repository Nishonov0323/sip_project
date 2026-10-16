import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contactKeys, contactsApi } from '../api/contacts.api'
import type { ContactFilter, ContactInput } from '../types'

export function useContacts(filter: ContactFilter, limit: number, offset: number) {
  return useQuery({
    queryKey: contactKeys.list(filter, limit, offset),
    queryFn: () => contactsApi.list(filter, limit, offset),
    placeholderData: keepPreviousData,
  })
}

export function useGroups() {
  return useQuery({ queryKey: contactKeys.groups, queryFn: contactsApi.groups })
}

export function useProfessions() {
  return useQuery({ queryKey: contactKeys.professions, queryFn: contactsApi.professions })
}

/** Kontakt, guruh yoki import o'zgarsa: ro'yxat, guruh sanoqlari va kasblar yangilanadi. */
function useInvalidatingMutation<TVars, TData>(fn: (vars: TVars) => Promise<TData>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactKeys.all }),
  })
}

export const useCreateContact = () =>
  useInvalidatingMutation((data: ContactInput) => contactsApi.create(data))

export const useUpdateContact = () =>
  useInvalidatingMutation(({ id, data }: { id: number; data: Partial<ContactInput> }) =>
    contactsApi.update(id, data),
  )

export const useDeleteContact = () => useInvalidatingMutation((id: number) => contactsApi.remove(id))

export const useAssignGroup = () =>
  useInvalidatingMutation(({ ids, groupId }: { ids: number[]; groupId: number | null }) =>
    contactsApi.assignGroup(ids, groupId),
  )

export const useImportContacts = () =>
  useInvalidatingMutation((file: File) => contactsApi.importCsv(file))

export const useCreateGroup = () =>
  useInvalidatingMutation((name: string) => contactsApi.createGroup(name))

export const useDeleteGroup = () =>
  useInvalidatingMutation((id: number) => contactsApi.removeGroup(id))
