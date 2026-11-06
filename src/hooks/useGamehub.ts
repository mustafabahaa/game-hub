/** React Query hooks for the private GameHub vault and its provider directory. */
import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { accountsLib } from '@/libs/accounts';
import { gamesLib } from '@/libs/games';
import { providersLib } from '@/libs/providers';
import type { Account, AccountFormData, Game, GameFormData, Provider, ProviderFormData } from '@/domain/types';

export const queryKeys = {
  accounts: (uid: string) => ['accounts', uid] as const,
  providers: (uid: string) => ['providers', uid] as const,
  provider: (uid: string, id: string) => ['provider', uid, id] as const,
};

export function useAccounts(uid: string | undefined) {
  return useQuery<Account[]>({
    queryKey: uid ? queryKeys.accounts(uid) : ['accounts', 'none'],
    queryFn: () => accountsLib.getAll(uid!),
    enabled: Boolean(uid),
    refetchOnWindowFocus: false,
  });
}

export function useCreateAccount(uid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: AccountFormData) => accountsLib.create(uid, form),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts(uid) }),
  });
}

export function useUpdateAccount(uid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, form }: { id: string; form: AccountFormData }) => accountsLib.update(uid, id, form),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts(uid) }),
  });
}

export function useDeleteAccount(uid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (account: Account) => accountsLib.delete(uid, account),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts(uid) }),
  });
}

export function useCreateGame(uid: string, accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ form, imageFile }: { form: GameFormData; imageFile: File | null }) => gamesLib.create(uid, accountId, form, imageFile),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts(uid) }),
  });
}

export function useUpdateGame(uid: string, accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gameId, form }: { gameId: string; form: Partial<GameFormData> }) => gamesLib.update(uid, accountId, gameId, form),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts(uid) }),
  });
}

export function useDeleteGame(uid: string, accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (game: Game) => gamesLib.delete(uid, accountId, game),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts(uid) }),
  });
}

export function useProviders(uid: string | undefined) {
  return useQuery<Provider[]>({ queryKey: uid ? queryKeys.providers(uid) : ['providers', 'none'], queryFn: () => providersLib.getAll(uid!), enabled: Boolean(uid), refetchOnWindowFocus: false });
}

export function useProvider(uid: string | undefined, id: string | undefined) {
  return useQuery<Provider | undefined>({
    queryKey: uid && id ? queryKeys.provider(uid, id) : ['provider', 'none'],
    queryFn: () => providersLib.getById(uid!, id!),
    enabled: Boolean(uid && id),
  });
}

export function useCreateProvider(uid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: ProviderFormData) => providersLib.create(uid, form),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.providers(uid) }),
  });
}

export function useUpdateProvider(uid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, form, existing }: { id: string; form: ProviderFormData; existing?: Provider }) => providersLib.update(uid, id, form, existing),
    onSuccess: (...[, vars]) => {
      qc.invalidateQueries({ queryKey: queryKeys.providers(uid) });
      qc.invalidateQueries({ queryKey: queryKeys.provider(uid, vars.id) });
    },
  });
}

export function useDeleteProvider(uid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: Provider) => providersLib.delete(provider),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.providers(uid) }),
  });
}

/** Type helper for pages that pass query options through. */
export type { UseQueryOptions };
