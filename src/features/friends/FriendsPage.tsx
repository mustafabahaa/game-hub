import { useEffect, useState } from 'react';
import {
  Avatar, Box, Button, CircularProgress, Divider, InputAdornment, Stack, TextField, Typography,
} from '@mui/material';
import { Search, UserPlus } from 'lucide-react';
import { useAppContext } from '@/hooks/useAppContext';
import {
  useFriends, useFriendRequests, useSendFriendRequest, useRespondFriendRequest,
  useCancelFriendRequest, useRemoveFriend,
} from '@/hooks/useGamehub';
import { profilesLib } from '@/libs/profiles';
import type { FriendRequest, UserProfile } from '@/domain/types';
import { EmptyState } from '@/components/EmptyState';

const EMPTY_REQUESTS: FriendRequest[] = [];
const EMPTY_FRIENDS: NonNullable<ReturnType<typeof useFriends>['data']> = [];

export function FriendsPage() {
  const { user } = useAppContext();
  const uid = user?.uid ?? '';
  const { data: friends, isLoading: friendsLoading } = useFriends(uid);
  const { data: requests, isLoading: requestsLoading } = useFriendRequests(uid);
  const respond = useRespondFriendRequest(uid);
  const cancel = useCancelFriendRequest(uid);
  const removeFriend = useRemoveFriend(uid);

  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [requestProfiles, setRequestProfiles] = useState<Record<string, UserProfile>>({});
  const sendRequest = useSendFriendRequest(uid);

  const incoming = requests?.incoming ?? EMPTY_REQUESTS;
  const outgoing = requests?.outgoing ?? EMPTY_REQUESTS;
  const friendList = friends ?? EMPTY_FRIENDS;
  const friendsCount = friends?.length ?? 0;

  useEffect(() => {
    let active = true;
    const ids = [...new Set([...incoming.map((r) => r.senderId), ...outgoing.map((r) => r.receiverId)])];
    if (ids.length === 0) {
      setRequestProfiles({});
      return () => { active = false; };
    }
    profilesLib.getMany(ids).then((profiles) => {
      if (active) setRequestProfiles(Object.fromEntries(profiles.map((profile) => [profile.uid, profile])));
    }).catch(() => {
      if (active) setRequestProfiles({});
    });
    return () => { active = false; };
  }, [incoming, outgoing]);

  useEffect(() => {
    const query = search.trim();
    let active = true;
    if (!query) {
      setResults([]);
      setHasSearched(false);
      setSearching(false);
      setSearchFailed(false);
      return () => { active = false; };
    }
    setHasSearched(true);
    setSearching(true);
    setSearchFailed(false);
    const timer = window.setTimeout(() => {
      profilesLib.search(query, uid).then((profiles) => {
        if (!active) return;
        const friendIds = new Set(friendList.map((friend) => friend.friendUid));
        const pendingIds = new Set(outgoing.map((request) => request.receiverId));
        setResults(profiles.filter((profile) => !friendIds.has(profile.uid) && !pendingIds.has(profile.uid)));
      }).catch(() => {
        if (active) {
          setResults([]);
          setSearchFailed(true);
        }
      }).finally(() => {
        if (active) setSearching(false);
      });
    }, 300);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search, uid, friendList, outgoing]);

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'flex-end' }} gap={1} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h1">Friends</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Find players, manage requests, and keep your circle close.
          </Typography>
        </Box>
        {!friendsLoading && <Typography variant="body2" color="text.secondary">{friendsCount} {friendsCount === 1 ? 'friend' : 'friends'}</Typography>}
      </Stack>

      <Box component="section" aria-labelledby="find-players-heading" sx={{ mb: 4 }}>
        <Typography id="find-players-heading" variant="h5" sx={{ mb: 0.75 }}>Find players</Typography>
        <TextField
          fullWidth
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search players by username or name…"
          inputProps={{ 'aria-label': 'Search players by username or display name' }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} color="action" /></InputAdornment> }}
        />

        {hasSearched && (
          <Box sx={{ mt: 2 }}>
            {searching ? <CircularProgress size={22} /> : results.length > 0 ? (
              <Stack divider={<Divider flexItem />}>
                {results.map((profile) => (
                  <ProfileRow key={profile.uid} profile={profile}>
                    <Button
                      variant="outlined"
                      startIcon={<UserPlus size={16} />}
                      disabled={sendRequest.isPending}
                      onClick={() => sendRequest.mutate(profile.uid, { onSuccess: () => setResults((current) => current.filter((item) => item.uid !== profile.uid)) })}
                    >
                      Add friend
                    </Button>
                  </ProfileRow>
                ))}
              </Stack>
            ) : (
              <EmptyState
                icon={<Search size={21} />}
                title={searchFailed ? 'Could not search players' : 'No players found'}
                description={searchFailed ? 'Check your connection and try again.' : 'Try a different username or display name.'}
                sx={{ py: 2 }}
              />
            )}
          </Box>
        )}
      </Box>

      {requestsLoading ? (
        <Stack alignItems="flex-start" sx={{ py: 3 }}><CircularProgress size={24} /></Stack>
      ) : (
        <>
          {incoming.length > 0 && (
            <Section title="Friend requests" count={incoming.length} description="Players who want to connect with you.">
              <Stack divider={<Divider flexItem />}>
                {incoming.map((request) => (
                  <ProfileRow key={request.id} profile={requestProfiles[request.senderId]} fallbackId={request.senderId}>
                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" onClick={() => respond.mutate({ request, status: 'accepted' })} disabled={respond.isPending}>Accept</Button>
                      <Button variant="text" onClick={() => respond.mutate({ request, status: 'rejected' })} disabled={respond.isPending}>Decline</Button>
                    </Stack>
                  </ProfileRow>
                ))}
              </Stack>
            </Section>
          )}

          {outgoing.length > 0 && (
            <Section title="Sent requests" count={outgoing.length} description="Requests waiting for a reply.">
              <Stack divider={<Divider flexItem />}>
                {outgoing.map((request) => (
                  <ProfileRow key={request.id} profile={requestProfiles[request.receiverId]} fallbackId={request.receiverId}>
                    <Button variant="text" onClick={() => cancel.mutate(request)} disabled={cancel.isPending}>Cancel request</Button>
                  </ProfileRow>
                ))}
              </Stack>
            </Section>
          )}
        </>
      )}

      <Section title="Your friends" count={friendsCount} description="The players in your circle.">
        {friendsLoading ? <CircularProgress size={24} /> : friendsCount > 0 ? (
          <Stack divider={<Divider flexItem />}>
            {friendList.map((friend) => (
              <ProfileRow key={friend.friendUid} profile={friend.friendProfile} fallbackId={friend.friendUid}>
                <Button variant="text" color="inherit" onClick={() => removeFriend.mutate(friend.friendUid)} disabled={removeFriend.isPending}>
                  Remove
                </Button>
              </ProfileRow>
            ))}
          </Stack>
        ) : (
          <EmptyState
            icon={<UserPlus size={21} />}
            title="No friends yet"
            description="Find someone by username or display name and send a friend request to get started."
            sx={{ py: 2 }}
          />
        )}
      </Section>
    </Box>
  );
}

function Section({ title, count, description, children }: { title: string; count: number; description: string; children: React.ReactNode }) {
  return (
    <Box component="section" sx={{ py: 3, borderTop: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 0.5 }}>
        <Typography variant="h5">{title}</Typography>
        <Typography variant="body2" color="text.secondary">{count}</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{description}</Typography>
      {children}
    </Box>
  );
}

function ProfileRow({ profile, fallbackId, children }: { profile?: UserProfile; fallbackId?: string; children: React.ReactNode }) {
  const title = profile?.displayName || profile?.username || 'Player';
  const subtitle = profile?.username ? `@${profile.username}` : fallbackId ? `Player · ${fallbackId.slice(0, 8)}` : undefined;
  const initials = (profile?.displayName || profile?.username || fallbackId || 'P')[0]?.toUpperCase();
  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 1.75 }}>
      <Avatar src={profile?.avatarUrl ?? undefined} alt={title} sx={{ width: 48, height: 48, bgcolor: 'action.selected', color: 'text.primary', fontWeight: 700 }}>{initials}</Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body1" sx={{ fontWeight: 650 }} noWrap>{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" noWrap>{subtitle}</Typography>}
        {profile?.bio && <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>{profile.bio}</Typography>}
      </Box>
      <Box sx={{ flexShrink: 0 }}>{children}</Box>
    </Stack>
  );
}
