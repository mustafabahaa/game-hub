import { Avatar, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { ArrowRight, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { useCommunity } from '@/hooks/useGamehub';
import type { CommunityProfile } from '@/domain/types';
import { CommunityGameTile } from './CommunityGameTile';

export function CommunityPage() {
  const navigate = useNavigate();
  const community = useCommunity();
  const profiles = community.data?.pages.flatMap((page) => page.profiles) ?? [];

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'flex-end' }} gap={1} sx={{ mb: 3.5 }}>
        <Box>
          <Typography variant="h1">Community</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Games shared by players across GameHub.
          </Typography>
        </Box>
        {profiles.length > 0 && <Typography variant="body2" color="text.secondary">{profiles.length} {profiles.length === 1 ? 'player' : 'players'} loaded</Typography>}
      </Stack>

      {community.isLoading && (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}><CircularProgress /></Box>
      )}

      {community.isError && (
        <EmptyState
          icon={<UsersRound size={22} />}
          title="Couldn’t load the community"
          description="Check your connection and try again."
          action={<Button variant="outlined" onClick={() => community.refetch()}>Try again</Button>}
          sx={{ my: 2 }}
        />
      )}

      {!community.isLoading && !community.isError && profiles.length === 0 && (
        <EmptyState
          icon={<UsersRound size={22} />}
          title="No public games yet"
          description={community.hasNextPage ? 'There are no shared games among these players yet.' : 'When players share games from their vault, you’ll find them here.'}
          sx={{ my: 2 }}
        />
      )}

      <Stack>
        {profiles.map((profile) => (
          <ProfileSection
            key={profile.ownerUid}
            profile={profile}
            onViewAll={() => navigate(`/community/${profile.ownerUid}`)}
          />
        ))}
      </Stack>

      {community.hasNextPage && (
        <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
          <Button variant="outlined" onClick={() => community.fetchNextPage()} disabled={community.isFetchingNextPage}>
            {community.isFetchingNextPage ? <CircularProgress size={18} color="inherit" /> : 'Load more players'}
          </Button>
        </Stack>
      )}
      {community.isFetchNextPageError && <Typography color="error" role="alert" sx={{ mt: 2 }}>Couldn’t load more players. Please try again.</Typography>}
    </Box>
  );
}

function ProfileSection({ profile, onViewAll }: { profile: CommunityProfile; onViewAll: () => void }) {
  const name = profile.ownerDisplayName || profile.ownerUsername;
  return (
    <Box component="section" sx={{ py: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={1.5}>
        <Stack direction="row" alignItems="center" spacing={1.75} sx={{ minWidth: 0 }}>
          <Avatar src={profile.ownerAvatarUrl ?? undefined} alt={name} sx={{ width: 52, height: 52, flexShrink: 0 }}>
            {profile.ownerUsername[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }} noWrap>{name}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              @{profile.ownerUsername}{profile.ownerBio ? ` · ${profile.ownerBio}` : ''}
            </Typography>
          </Box>
        </Stack>
        {profile.hasMoreGames && (
          <Button variant="text" endIcon={<ArrowRight size={17} />} onClick={onViewAll} sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
            View all games
          </Button>
        )}
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(6, minmax(0, 1fr))' }, gap: { xs: 1.25, sm: 1.75 }, mt: 2.25, ml: { xs: 0, sm: '68px' } }}>
        {profile.games.map((game) => <CommunityGameTile key={game.gameId} title={game.title} imageUrl={game.imageUrl} />)}
      </Box>
    </Box>
  );
}
