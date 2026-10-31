import { useMemo, useState } from 'react';
import {
  Box, Typography, TextField, InputAdornment, Button, Stack, Avatar, Card, CardActionArea,
  CardContent, Pagination, Skeleton,
} from '@mui/material';
import { Search, Plus, Star, MessageSquare, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProviders, useRatings, useReputation } from '@/hooks/useGamehub';
import { ProviderModal } from '@/components/ProviderModal';
import { EmptyState } from '@/components/EmptyState';
import type { Provider } from '@/domain/types';

const PAGE_SIZE = 8;

export function ProvidersPage() {
  const navigate = useNavigate();
  const { data: providers, isLoading } = useProviders();
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h1">Providers</Typography>
          <Typography variant="body2" sx={{ mt: 0.75 }}>{providers?.length ?? 0} providers · rated by the community</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setEditProvider(undefined); setModalOpen(true); }}>
          Add Provider
        </Button>
      </Stack>

      <TextField
        fullWidth value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search providers…"
        sx={{ mb: 3.5 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} color="action" /></InputAdornment> }}
      />

      {isLoading && <ProviderGrid>{Array.from({ length: 6 }).map((_, i) => <ProviderCardSkeleton key={i} />)}</ProviderGrid>}

      {!isLoading && filtered.length === 0 && (
        providers?.length ? (
          <EmptyState icon={<Search size={21} />} title="No matching providers" description="Try a different search." sx={{ py: 3 }} />
        ) : (
          <EmptyState
            icon={<Gamepad2 size={21} />}
            title="No providers yet"
            description="Add a provider you trust to keep contact details and community feedback together."
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
          <Pagination count={pageCount} page={page} onChange={(_, nextPage) => setPage(nextPage)} color="standard" aria-label="Provider pages" />
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
  const { data: ratings } = useRatings(provider.id);
  const { data: reputation } = useReputation(provider.id);

  const avgRating = useMemo(() => {
    const r = ratings ?? [];
    return r.length === 0 ? null : r.reduce((s, x) => s + x.rating, 0) / r.length;
  }, [ratings]);

  return (
    <Card sx={{ overflow: 'hidden', height: '100%' }}>
      <CardActionArea onClick={onView} sx={{ display: 'flex', height: '100%', flexDirection: 'column', alignItems: 'stretch' }}>
        <Box sx={{ width: '100%', height: { xs: 220, sm: 240, lg: 260 }, flex: '0 0 auto', display: 'grid', placeItems: 'center', bgcolor: 'action.hover', p: 2, boxSizing: 'border-box' }}>
          {provider.photoUrl ? <Box component="img" src={provider.photoUrl} alt={`${provider.name} logo`} sx={{ display: 'block', width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: { xs: 188, sm: 208, lg: 228 }, objectFit: 'contain', objectPosition: 'center', borderRadius: 2.5 }} /> : <Avatar sx={{ width: 92, height: 92, fontSize: 36, fontWeight: 700, bgcolor: 'background.paper', color: 'text.primary' }}>{provider.name[0]?.toUpperCase()}</Avatar>}
        </Box>
        <CardContent sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', flex: 1, gap: .75 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>{provider.name}</Typography>
          {provider.website ? <Typography variant="body2" color="text.secondary" noWrap>{provider.website.replace(/^https?:\/\//, '')}</Typography> : <Typography variant="body2" color="text.secondary">No website listed</Typography>}
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: .5 }}>
            <Stack direction="row" spacing={.5} alignItems="center"><Star size={16} /><Typography variant="body2">{avgRating === null ? 'Not rated' : avgRating.toFixed(1)}</Typography></Stack>
            <Stack direction="row" spacing={.5} alignItems="center"><MessageSquare size={16} /><Typography variant="body2">{(reputation ?? []).length} {(reputation ?? []).length === 1 ? 'review' : 'reviews'}</Typography></Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function ProviderCardSkeleton() {
  return (
    <Card aria-hidden="true" sx={{ overflow: 'hidden', height: '100%' }}>
      <Box sx={{ width: '100%', height: { xs: 220, sm: 240, lg: 260 }, display: 'grid', placeItems: 'center', bgcolor: 'action.hover' }}>
        <Skeleton variant="rounded" animation="wave" width={92} height={92} sx={{ borderRadius: 2.5, bgcolor: 'action.selected' }} />
      </Box>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Skeleton variant="text" animation="wave" width="65%" height={28} />
        <Skeleton variant="text" animation="wave" width="48%" height={20} />
        <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
          <Skeleton variant="text" animation="wave" width={64} height={20} />
          <Skeleton variant="text" animation="wave" width={84} height={20} />
        </Stack>
      </CardContent>
    </Card>
  );
}
