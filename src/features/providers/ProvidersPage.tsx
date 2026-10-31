import { useMemo, useState } from 'react';
import {
  Box, Typography, TextField, InputAdornment, Button, Stack, Avatar, Card, CardActionArea, Paper,
  CardContent, Pagination, Skeleton, PageHeader,
} from '@monochrome-ui/design-system';
import { SearchIcon as Search, AddIcon as Plus, GamepadIcon as Gamepad2 } from '@/components/AppIcon';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/hooks/useAppContext';
import { useProviders } from '@/hooks/useGamehub';
import { ProviderModal } from '@/components/ProviderModal';
import { EmptyState } from '@/components/EmptyState';
import type { Provider } from '@/domain/types';

const PAGE_SIZE = 8;
const SKELETON_KEYS = [0, 1, 2, 3, 4, 5];

export function ProvidersPage() {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const { data: providers, isLoading } = useProviders(user?.uid);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<Provider | undefined>();

  const filtered = useMemo(() => {
    const list = providers ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((p) => p.name.toLowerCase().includes(q));
  }, [providers, search]);
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const visibleProviders = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Providers"
        subtitle={`${providers?.length ?? 0} saved providers`}
        action={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setEditProvider(undefined); setModalOpen(true); }}>Add Provider</Button>}
      />

      <TextField
        fullWidth value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search providers…"
        sx={{ mb: 3.5 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} color="action" /></InputAdornment> } }}
      />

      {isLoading && <ProviderGrid>{SKELETON_KEYS.map((i) => <ProviderCardSkeleton key={i} />)}</ProviderGrid>}

      {!isLoading && filtered.length === 0 && (
        providers?.length ? (
          <EmptyState icon={<Search size={21} />} title="No matching providers" description="Try a different search." sx={{ py: 3 }} />
        ) : (
          <EmptyState
            icon={<Gamepad2 size={21} />}
            title="No providers yet"
            description="Keep the stores you use and their contact details together."
            action={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setEditProvider(undefined); setModalOpen(true); }}>Add provider</Button>}
            sx={{ py: 3 }}
          />
        )
      )}

      {!isLoading && filtered.length > 0 && <>
        <ProviderGrid>
        {visibleProviders.map((p) => (
          <ProviderCard key={p.id} provider={p} onView={() => navigate(`/providers/${p.id}`)} />
        ))}
        </ProviderGrid>
        {pageCount > 1 && <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" gap={1.5} sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} providers</Typography>
          <Pagination count={pageCount} page={page} onChange={(event, nextPage) => { void event; setPage(nextPage); }} color="standard" aria-label="Provider pages" />
        </Stack>}
      </>}

      <ProviderModal open={modalOpen} provider={editProvider} onClose={() => setModalOpen(false)} />
    </Box>
  );
}

function ProviderGrid({ children }: { children: React.ReactNode }) {
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 2, sm: 2.5 } }}>{children}</Box>;
}

interface ProviderCardProps {
  provider: Provider;
  onView: () => void;
}

function ProviderCard({ provider, onView }: ProviderCardProps) {
  return (
    <Card sx={{ overflow: 'hidden', height: '100%' }}>
      <CardActionArea onClick={onView} sx={{ display: 'flex', height: '100%', flexDirection: 'column', alignItems: 'stretch' }}>
        <Paper variant="mediaFrame" sx={{ height: { xs: 220, sm: 240, lg: 260 }, flex: '0 0 auto' }}>
          {provider.photoUrl ? <Paper component="img" variant="mediaSurface" src={provider.photoUrl} alt={`${provider.name} logo`} sx={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: { xs: 188, sm: 208, lg: 228 }, objectPosition: 'center' }} /> : <Avatar variant="mediaFallbackCompact">{provider.name[0]?.toUpperCase()}</Avatar>}
        </Paper>
        <CardContent sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', flex: 1, gap: .75 }}>
          <Typography variant="itemTitle" noWrap>{provider.name}</Typography>
          {provider.website ? <Typography variant="body2" color="text.secondary" noWrap>{provider.website.replace(/^https?:\/\//, '')}</Typography> : <Typography variant="body2" color="text.secondary">No website listed</Typography>}
          {provider.notes && <Typography variant="bodyNote" color="text.secondary" sx={{ mt: .5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{provider.notes}</Typography>}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function ProviderCardSkeleton() {
  return (
    <Card aria-hidden="true" sx={{ overflow: 'hidden', height: '100%' }}>
      <Paper variant="mediaFrame" sx={{ height: { xs: 220, sm: 240, lg: 260 } }}>
        <Skeleton variant="rounded" animation="wave" width={92} height={92} />
      </Paper>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Skeleton variant="text" animation="wave" width="65%" height={28} />
        <Skeleton variant="text" animation="wave" width="48%" height={20} />
        <Skeleton variant="text" animation="wave" width="86%" height={20} />
      </CardContent>
    </Card>
  );
}
