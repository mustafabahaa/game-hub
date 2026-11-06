import { useMemo, useState } from 'react';
import {
  Box, Typography, TextField, InputAdornment, Button, Stack, Avatar, Divider, CardActionArea,
  Pagination, Skeleton, PageHeader, Chip, IconButton, Tooltip,
} from '@monochrome-ui/design-system';
import { SearchIcon as Search, AddIcon as Plus, GamepadIcon as Gamepad2, GlobeIcon, WhatsAppIcon, MessengerIcon, InstagramIcon, FacebookIcon } from '@/components/AppIcon';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/hooks/useAppContext';
import { useProviders } from '@/hooks/useGamehub';
import { ProviderModal } from '@/components/ProviderModal';
import { EmptyState } from '@/components/EmptyState';
import type { Provider } from '@/domain/types';
import { getProviderContactHref, type ProviderContactChannel } from '@/libs/providerLinks';

const PAGE_SIZE = 12;
const SKELETON_KEYS = [0, 1, 2, 3, 4, 5];
const CONTACT_CHANNELS: { channel: ProviderContactChannel; label: string }[] = [
  { channel: 'whatsapp', label: 'WhatsApp' },
  { channel: 'messenger', label: 'Messenger' },
  { channel: 'instagram', label: 'Instagram' },
  { channel: 'facebook', label: 'Facebook' },
  { channel: 'website', label: 'Website' },
];

export function ProvidersPage() {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const { data: providers, isLoading } = useProviders(user?.uid);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [channelFilter, setChannelFilter] = useState<ProviderContactChannel | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<Provider | undefined>();

  const filtered = useMemo(() => {
    const list = providers ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((provider) => (!q || provider.name.toLowerCase().includes(q)) && (channelFilter === 'all' || getProviderContactHref(provider, channelFilter) !== null));
  }, [providers, search, channelFilter]);
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const visibleProviders = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Providers"
        subtitle={`${providers?.length ?? 0} saved providers`}
        action={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setEditProvider(undefined); setModalOpen(true); }}>Add Provider</Button>}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} gap={1.5} sx={{ mt: { xs: 2, md: 3 }, mb: 2.5 }}>
      <TextField
        value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search providers…"
        sx={{ width: { xs: '100%', md: 360 }, flexShrink: 0 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} color="action" /></InputAdornment> } }}
      />
      <Stack direction="row" gap={0.75} useFlexGap flexWrap="wrap" role="group" aria-label="Filter providers by contact method">
        <Chip label="All" onClick={() => { setChannelFilter('all'); setPage(1); }} variant={channelFilter === 'all' ? 'filterSelected' : 'filter'} />
        {CONTACT_CHANNELS.filter(({ channel }) => providers?.some((provider) => getProviderContactHref(provider, channel))).map(({ channel, label }) => (
          <Chip key={channel} label={label} onClick={() => { setChannelFilter(channel); setPage(1); }} variant={channelFilter === channel ? 'filterSelected' : 'filter'} />
        ))}
      </Stack>
      </Stack>

      {isLoading && <ProviderGrid>{SKELETON_KEYS.map((i) => <ProviderRowSkeleton key={i} />)}</ProviderGrid>}

      {!isLoading && filtered.length === 0 && (
        providers?.length ? (
          <EmptyState icon={<Search size={21} />} title="No matching providers" description="Try a different search or contact filter." sx={{ py: 3 }} />
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
          <ProviderRow key={p.id} provider={p} onView={() => navigate(`/providers/${p.id}`)} />
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
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: { xs: 1.5, sm: 2 } }}>{children}</Box>;
}

interface ProviderCardProps {
  provider: Provider;
  onView: () => void;
}

function ProviderRow({ provider, onView }: ProviderCardProps) {
  const contactItems = CONTACT_CHANNELS.flatMap(({ channel, label }) => {
    const href = getProviderContactHref(provider, channel);
    if (!href) return [];
    const Icon = channel === 'website' ? GlobeIcon : channel === 'whatsapp' ? WhatsAppIcon : channel === 'messenger' ? MessengerIcon : channel === 'instagram' ? InstagramIcon : FacebookIcon;
    return [{ channel, label, href, Icon }];
  });
  return (
    <Box component="article" sx={{ minWidth: 0 }}>
      <Stack direction="row" alignItems="center" gap={1.5} sx={{ minWidth: 0, py: 1.5 }}>
        <Avatar
          src={provider.photoUrl || undefined}
          alt={`${provider.name} logo`}
          variant="mediaFallbackCompact"
          sx={{ width: 48, height: 48, flex: '0 0 auto' }}
        >{provider.name[0]?.toUpperCase()}</Avatar>
        <CardActionArea onClick={onView} sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
          <Stack>
            <Typography variant="itemTitle" noWrap>{provider.name}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{contactItems.length ? `${contactItems.length} contact options` : 'No contact details'}</Typography>
          </Stack>
        </CardActionArea>
        {contactItems.length > 0 && <Stack direction="row" gap={0.5} sx={{ flexShrink: 0 }}>
          {contactItems.map(({ channel, label, href, Icon }) => <Tooltip key={channel} title={label}>
            <IconButton component="a" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} for ${provider.name}`} size="small" variant="quietAction" sx={{ width: 36, height: 36 }} onClick={(event) => event.stopPropagation()}>
              <Icon size={21} />
            </IconButton>
          </Tooltip>)}
        </Stack>}
      </Stack>
      <Divider />
    </Box>
  );
}

function ProviderRowSkeleton() {
  return (
    <Stack direction="row" alignItems="center" gap={1.5} sx={{ py: 1.5 }} aria-hidden="true">
      <Skeleton variant="circular" animation="wave" width={48} height={48} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Skeleton variant="text" animation="wave" width="65%" height={28} />
        <Skeleton variant="text" animation="wave" width="48%" height={20} />
      </Box>
    </Stack>
  );
}
