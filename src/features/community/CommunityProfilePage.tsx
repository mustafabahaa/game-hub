import { Avatar, Box, Button, CircularProgress, Divider, Stack, Typography } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { useCommunityGames, useCommunityProfile } from '@/hooks/useGamehub';
import { CommunityGameTile } from './CommunityGameTile';

export function CommunityProfilePage() {
  const { ownerUid } = useParams<{ ownerUid: string }>();
  const navigate = useNavigate();
  const profileQuery = useCommunityProfile(ownerUid);
  const gamesQuery = useCommunityGames(ownerUid);
  const games = gamesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const profile = profileQuery.data;
  const name = profile?.displayName || profile?.username || 'Player';

  if (profileQuery.isLoading || gamesQuery.isLoading) {
    return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '45vh' }}><CircularProgress /></Box>;
  }

  if (profileQuery.isError) {
    return (
      <EmptyState
        icon={<ArrowLeft size={20} />}
        title="Couldn’t load this player"
        description="Check your connection and try again."
        action={<Button variant="outlined" onClick={() => profileQuery.refetch()}>Try again</Button>}
      />
    );
  }

  if (!profile) {
    return (
      <Box sx={{ width: '100%' }}>
        <Button startIcon={<ArrowLeft size={17} />} onClick={() => navigate('/community')} sx={{ mb: 2 }}>Back to community</Button>
        <EmptyState icon={<ArrowLeft size={20} />} title="Player not found" description="This profile may no longer be available." />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Button startIcon={<ArrowLeft size={17} />} onClick={() => navigate('/community')} sx={{ mb: 2.5 }}>Back to community</Button>

      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Avatar src={profile.avatarUrl ?? undefined} alt={name} sx={{ width: 72, height: 72, flexShrink: 0, fontSize: 24, fontWeight: 700 }}>
          {profile.username[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h2">{name}</Typography>
          <Typography variant="body2" color="text.secondary">@{profile.username}</Typography>
          {profile.bio && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{profile.bio}</Typography>}
        </Box>
      </Stack>

      <Divider />
      <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 3, mb: 0.5 }}>
        <Typography variant="h5">Shared games</Typography>
        <Typography variant="body2" color="text.secondary">{games.length} loaded</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Games this player has shared with the community.</Typography>

      {gamesQuery.isError && games.length === 0 ? (
        <EmptyState
          icon={<ArrowLeft size={20} />}
          title="Couldn’t load shared games"
          description="Check your connection and try again."
          action={<Button variant="outlined" onClick={() => gamesQuery.refetch()}>Try again</Button>}
          sx={{ mt: 2 }}
        />
      ) : games.length > 0 ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))', xl: 'repeat(6, minmax(0, 1fr))' }, gap: { xs: 1.5, sm: 2.5 } }}>
          {games.map((game) => <CommunityGameTile key={game.gameId} title={game.title} imageUrl={game.imageUrl} />)}
        </Box>
      ) : (
        <EmptyState icon={<ArrowLeft size={20} />} title="No shared games" description="This player hasn’t shared any games yet." sx={{ mt: 2 }} />
      )}

      {gamesQuery.hasNextPage && (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <Button variant="outlined" onClick={() => gamesQuery.fetchNextPage()} disabled={gamesQuery.isFetchingNextPage}>
            {gamesQuery.isFetchingNextPage ? <CircularProgress size={18} color="inherit" /> : 'Load more games'}
          </Button>
        </Stack>
      )}
      {gamesQuery.isFetchNextPageError && <Typography color="error" role="alert" sx={{ mt: 2 }}>Couldn’t load more games. Please try again.</Typography>}
    </Box>
  );
}
