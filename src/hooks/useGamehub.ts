/**
 * React Query data hooks — centralized queryKeys + useQuery/useMutation wrappers.
 * Modeled on fitpal's useFitpal.ts. All hooks require a logged-in uid (passed
 * from useAppContext). Mutations invalidate the right keys.
 */
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { accountsLib } from '@/libs/accounts';
import { gamesLib } from '@/libs/games';
import { providersLib } from '@/libs/providers';
import { ratingsLib } from '@/libs/ratings';
import { reputationLib } from '@/libs/reputation';
import { profilesLib } from '@/libs/profiles';
import { friendsLib } from '@/libs/friends';
import { sharesLib } from '@/libs/shares';
import { communityLib } from '@/libs/community';
import { publicGamesLib } from '@/libs/publicGames';
import type { PageCursor } from '@/libs/db';
import type {
  Account,
  AccountFormData,
  FriendRequest,
  Friendship,
  Game,
  Provider,
  ProviderFormData,
  ProviderRating,
  ReputationPost,
  SharedAccountDoc,
  UserProfile,
} from '@/domain/types';

export const queryKeys = {
  accounts: (uid: string) => ['accounts', uid] as const,
  providers: ['providers'] as const,
  provider: (id: string) => ['provider', id] as const,
  ratings: (providerId: string) => ['ratings', providerId] as const,
  reputation: (providerId: string) => ['reputation', providerId] as const,
  profile: (uid: string) => ['profile', uid] as const,
  friends: (uid: string) => ['friends', uid] as const,
  friendRequests: (uid: string) => ['friendRequests', uid] as const,
  sharedAccounts: (uid: string) => ['sharedAccounts', uid] as const,
  community: ['community', 'profiles'] as const,
  communityProfile: (ownerUid: string) => ['communityProfile', ownerUid] as const,
  communityGames: (ownerUid: string) => ['communityGames', ownerUid] as const,
};

/* ---------------- accounts ---------------- */

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
    mutationFn: ({ id, form }: { id: string; form: AccountFormData }) =>
      accountsLib.update(uid, id, form),
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

/* ---------------- games ---------------- */

export function useGames(uid: string | undefined, accountId: string | undefined) {
  return useQuery<Game[]>({
    queryKey: ['games', uid, accountId],
    queryFn: () => gamesLib.getAll(uid!, accountId!),
    enabled: Boolean(uid && accountId),
  });
}

export function useCreateGame(uid: string, accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ title, imageFile }: { title: string; imageFile: File | null }) =>
      gamesLib.create(uid, accountId, title, imageFile),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts(uid) });
      qc.invalidateQueries({ queryKey: ['games', uid, accountId] });
    },
  });
}

export function useDeleteGame(uid: string, accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (game: Game) => gamesLib.delete(uid, accountId, game),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts(uid) });
      qc.invalidateQueries({ queryKey: ['games', uid, accountId] });
    },
  });
}

/* ---------------- providers ---------------- */

export function useProviders() {
  return useQuery<Provider[]>({
    queryKey: queryKeys.providers,
    queryFn: () => providersLib.getAll(),
    refetchOnWindowFocus: false,
  });
}

export function useProvider(id: string | undefined) {
  return useQuery<Provider | undefined>({
    queryKey: id ? queryKeys.provider(id) : ['provider', 'none'],
    queryFn: () => providersLib.getById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateProvider(uid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: ProviderFormData) => providersLib.create(uid, form),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.providers }),
  });
}

export function useUpdateProvider(uid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, form, existing }: { id: string; form: ProviderFormData; existing?: Provider }) =>
      providersLib.update(uid, id, form, existing),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.providers });
      qc.invalidateQueries({ queryKey: queryKeys.provider(vars.id) });
    },
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: Provider) => providersLib.delete(provider),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.providers }),
  });
}

/* ---------------- ratings ---------------- */

export function useRatings(providerId: string | undefined) {
  return useQuery<ProviderRating[]>({
    queryKey: providerId ? queryKeys.ratings(providerId) : ['ratings', 'none'],
    queryFn: () => ratingsLib.list(providerId!),
    enabled: Boolean(providerId),
  });
}

export function useUpsertRating(uid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      providerId,
      rating,
      review,
    }: {
      providerId: string;
      rating: number;
      review?: string | null;
    }) => ratingsLib.upsert(providerId, uid, rating, review),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: queryKeys.ratings(vars.providerId) }),
  });
}

/* ---------------- reputation ---------------- */

export function useReputation(providerId: string | undefined) {
  return useQuery<ReputationPost[]>({
    queryKey: providerId ? queryKeys.reputation(providerId) : ['reputation', 'none'],
    queryFn: () => reputationLib.list(providerId!),
    enabled: Boolean(providerId),
  });
}

export function useCreateReputationPost(uid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      providerId,
      title,
      body,
      proofLink,
    }: {
      providerId: string;
      title: string;
      body?: string | null;
      proofLink?: string | null;
    }) => reputationLib.create(providerId, uid, title, body, proofLink),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: queryKeys.reputation(vars.providerId) }),
  });
}

/* ---------------- profile ---------------- */

export function useProfile(uid: string | undefined) {
  return useQuery<UserProfile | undefined>({
    queryKey: uid ? queryKeys.profile(uid) : ['profile', 'none'],
    queryFn: () => profilesLib.get(uid!),
    enabled: Boolean(uid),
  });
}

/** Ensure a public profile doc exists (idempotent upsert). */
export function useEnsureProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, partial }: { uid: string; partial: Partial<UserProfile> }) =>
      profilesLib.ensure(uid, partial),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: queryKeys.profile(vars.uid) }),
  });
}

export function useUpdateProfile(uid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (partial: Partial<UserProfile>) => profilesLib.update(uid, partial),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profile(uid) }),
  });
}

/* ---------------- friends ---------------- */

export function useFriendRequests(uid: string | undefined) {
  return useQuery<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>({
    queryKey: uid ? queryKeys.friendRequests(uid) : ['friendRequests', 'none'],
    queryFn: async () => ({
      incoming: await friendsLib.listIncoming(uid!),
      outgoing: await friendsLib.listOutgoing(uid!),
    }),
    enabled: Boolean(uid),
  });
}

export function useFriends(uid: string | undefined) {
  return useQuery<Friendship[]>({
    queryKey: uid ? queryKeys.friends(uid) : ['friends', 'none'],
    queryFn: async () => {
      const uids = await friendsLib.listFriendUids(uid!);
      const profiles = await profilesLib.getMany(uids);
      const profileByUid = new Map(profiles.map((p) => [p.uid, p]));
      return uids.map((friendUid) => ({
        friendUid,
        friendProfile: profileByUid.get(friendUid),
        createdAt: new Date(0).toISOString(),
      }));
    },
    enabled: Boolean(uid),
  });
}

export function useSendFriendRequest(uid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (receiverId: string) => friendsLib.send(uid, receiverId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.friendRequests(uid) }),
  });
}

export function useRespondFriendRequest(uid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ request, status }: { request: FriendRequest; status: 'accepted' | 'rejected' }) =>
      friendsLib.respond(request, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.friendRequests(uid) });
      qc.invalidateQueries({ queryKey: queryKeys.friends(uid) });
    },
  });
}

export function useCancelFriendRequest(uid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: FriendRequest) => friendsLib.cancel(request),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.friendRequests(uid) }),
  });
}

export function useRemoveFriend(uid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendUid: string) => friendsLib.removeFriend(uid, friendUid),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.friends(uid) }),
  });
}

/* ---------------- account shares ---------------- */

export function useSharedAccounts(uid: string | undefined) {
  return useQuery<SharedAccountDoc[]>({
    queryKey: uid ? queryKeys.sharedAccounts(uid) : ['sharedAccounts', 'none'],
    queryFn: () => sharesLib.listReceived(uid!),
    enabled: Boolean(uid),
  });
}

export function useShareAccount(uid: string, displayName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      account,
      recipientId,
      canViewPassword,
      canViewOtp,
    }: {
      account: Account;
      recipientId: string;
      canViewPassword: boolean;
      canViewOtp: boolean;
    }) => sharesLib.share(account, uid, displayName, recipientId, canViewPassword, canViewOtp),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sharedAccounts(uid) }),
  });
}

/* ---------------- community ---------------- */

export function useCommunity() {
  return useInfiniteQuery({
    queryKey: queryKeys.community,
    queryFn: ({ pageParam }) => communityLib.getProfilesPage(pageParam),
    initialPageParam: null as PageCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchOnWindowFocus: false,
  });
}

export function useCommunityProfile(ownerUid: string | undefined) {
  return useQuery<UserProfile | undefined>({
    queryKey: ownerUid ? queryKeys.communityProfile(ownerUid) : ['communityProfile', 'none'],
    queryFn: () => communityLib.getProfile(ownerUid!),
    enabled: Boolean(ownerUid),
    refetchOnWindowFocus: false,
  });
}

export function useCommunityGames(ownerUid: string | undefined) {
  return useInfiniteQuery({
    queryKey: ownerUid ? queryKeys.communityGames(ownerUid) : ['communityGames', 'none'],
    queryFn: ({ pageParam }) => communityLib.getGamesPage(ownerUid!, pageParam),
    initialPageParam: null as PageCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(ownerUid),
    refetchOnWindowFocus: false,
  });
}

/* Re-export for pages that need to write the public-game mirror directly. */
export { publicGamesLib };

/** Type helper for pages that pass query options through. */
export type { UseQueryOptions };
