import { useId, useMemo, useState, type ReactElement } from 'react';
import {
  Box, Typography, TextField, InputAdornment, Button, Stack, Avatar, Divider, CardActionArea,
  Pagination, Skeleton, PageHeader, IconButton, Tooltip, Collapse, Menu, MenuItem, Paper, useMediaQuery, useTheme,
} from '@monochrome-ui/design-system';
import { SearchIcon as Search, AddIcon as Plus, GamepadIcon as Gamepad2, GlobeIcon, WhatsAppIcon, MessengerIcon, InstagramIcon, FacebookIcon, ChevronDownIcon, TuneIcon } from '@/components/AppIcon';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '@/hooks/useAppContext';
import { useAccounts, useProviders } from '@/hooks/useGamehub';
import { ProviderModal } from '@/components/ProviderModal';
import { EmptyState } from '@/components/EmptyState';
import type { Game, Provider } from '@/domain/types';
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

type ProviderGame = Pick<Game, 'id' | 'title' | 'imageUrl'> & { accountId: string };

export function ProvidersPage() {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const { data: providers, isLoading } = useProviders(user?.uid);
  const { data: accounts } = useAccounts(user?.uid);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [channelFilter, setChannelFilter] = useState<ProviderContactChannel | 'all'>('all');
  const [withGamesOnly, setWithGamesOnly] = useState(false);
  const [filterAnchor, setFilterAnchor] = useState<{ element: HTMLElement; kind: 'contact' | 'games' } | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<string>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<Provider | undefined>();

  const gamesByProvider = useMemo(() => {
    const grouped = new Map<string, ProviderGame[]>();
    for (const account of accounts ?? []) {
      for (const game of account.games ?? []) {
        const providerId = game.providerId || account.providerId;
        if (!providerId) continue;
        const entry = { id: game.id, title: game.title, imageUrl: game.imageUrl, accountId: account.id };
        const games = grouped.get(providerId);
        if (games) games.push(entry);
        else grouped.set(providerId, [entry]);
      }
    }
    return grouped;
  }, [accounts]);
  const filtered = useMemo(() => {
    const list = providers ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((provider) => (!q || provider.name.toLowerCase().includes(q))
      && (channelFilter === 'all' || getProviderContactHref(provider, channelFilter) !== null)
      && (!withGamesOnly || gamesByProvider.has(provider.id)));
  }, [providers, search, channelFilter, withGamesOnly, gamesByProvider]);
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const visibleProviders = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const contactLabel = CONTACT_CHANNELS.find(({ channel }) => channel === channelFilter)?.label ?? 'Any contact';
  const gamesLabel = withGamesOnly ? 'With my games' : 'All providers';
  const closeFilters = () => setFilterAnchor(null);
  const applyFilter = () => {
    setPage(1);
    closeFilters();
  };

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Providers"
        subtitle={`${providers?.length ?? 0} saved providers`}
        action={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setEditProvider(undefined); setModalOpen(true); }}>Add Provider</Button>}
      />

      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: { xs: 2, md: 3 }, mb: 2.5 }}>
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 320px' }, minWidth: 0 }}>
          <TextField
            fullWidth size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search providers…"
            slotProps={{
              htmlInput: { 'aria-label': 'Search providers' },
              input: { startAdornment: <InputAdornment position="start"><Search size={18} color="action" /></InputAdornment> },
            }}
          />
        </Box>
        <Stack role="group" aria-label="Provider filters" direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
          <Button size="small" variant="adornmentAction" startIcon={<TuneIcon size={16} />} endIcon={<ChevronDownIcon size={12} />}
            aria-haspopup="menu" aria-expanded={filterAnchor?.kind === 'contact'} aria-label={`Contact method, ${contactLabel}`}
            onClick={(event) => setFilterAnchor({ element: event.currentTarget, kind: 'contact' })}>
            {contactLabel}
          </Button>
          <Button size="small" variant="adornmentAction" startIcon={<Gamepad2 size={16} />} endIcon={<ChevronDownIcon size={12} />}
            aria-haspopup="menu" aria-expanded={filterAnchor?.kind === 'games'} aria-label={`Game ownership, ${gamesLabel}`}
            onClick={(event) => setFilterAnchor({ element: event.currentTarget, kind: 'games' })}>
            {gamesLabel}
          </Button>
        </Stack>
      </Stack>

      <Menu anchorEl={filterAnchor?.element} open={filterAnchor?.kind === 'contact'} onClose={closeFilters}
        slotProps={{ list: { 'aria-label': 'Contact method' } }}>
        <MenuItem selected={channelFilter === 'all'} onClick={() => { setChannelFilter('all'); applyFilter(); }}>Any contact</MenuItem>
        {CONTACT_CHANNELS.filter(({ channel }) => providers?.some((provider) => getProviderContactHref(provider, channel))).map(({ channel, label }) => (
          <MenuItem key={channel} selected={channelFilter === channel} onClick={() => { setChannelFilter(channel); applyFilter(); }}>{label}</MenuItem>
        ))}
      </Menu>
      <Menu anchorEl={filterAnchor?.element} open={filterAnchor?.kind === 'games'} onClose={closeFilters}
        slotProps={{ list: { 'aria-label': 'Game ownership' } }}>
        <MenuItem selected={!withGamesOnly} onClick={() => { setWithGamesOnly(false); applyFilter(); }}>All providers</MenuItem>
        <MenuItem selected={withGamesOnly} onClick={() => { setWithGamesOnly(true); applyFilter(); }}>With my games</MenuItem>
      </Menu>

      {isLoading && <ProviderGrid>{SKELETON_KEYS.map((i) => <ProviderRowSkeleton key={i} />)}</ProviderGrid>}

      {!isLoading && filtered.length === 0 && (
        providers?.length ? (
          <EmptyState icon={<Search size={21} />} title="No matching providers" description="Try a different search or filter." sx={{ py: 3 }} />
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
          <ProviderRow key={p.id} provider={p} games={gamesByProvider.get(p.id) ?? []}
            expanded={expandedProvider === p.id}
            onToggleGames={() => setExpandedProvider(expandedProvider === p.id ? undefined : p.id)}
            onView={() => navigate(`/providers/${p.id}`)} />
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

function ProviderGrid({ children }: { children: ReactElement[] }) {
  const { breakpoints } = useTheme();
  const columns = useMediaQuery(breakpoints.up('md')) ? 2 : 1;
  const providersByColumn = Array.from({ length: columns }, () => [] as ReactElement[]);
  children.forEach((row, index) => providersByColumn[index % columns].push(row));

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, alignItems: 'start', gap: 2 }}>
      {providersByColumn.map((rows, index) => (
        <Stack key={index} spacing={1.5}>{rows}</Stack>
      ))}
    </Box>
  );
}

interface ProviderCardProps {
  provider: Provider;
  games: ProviderGame[];
  expanded: boolean;
  onToggleGames: () => void;
  onView: () => void;
}

function ProviderRow({ provider, games, expanded, onToggleGames, onView }: ProviderCardProps) {
  const gamesId = useId();
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
        <Stack justifyContent="center" alignItems="flex-start" sx={{ minWidth: 0, minHeight: 56, flex: 1 }}>
          <CardActionArea onClick={onView} sx={{ minWidth: 0, textAlign: 'left' }}>
            <Typography variant="itemTitle" noWrap>{provider.name}</Typography>
            {games.length === 0 && <Typography variant="body2" color="text.secondary" noWrap>
              {contactItems.length ? `${contactItems.length} contact options` : 'No contact details'}
            </Typography>}
          </CardActionArea>
          {games.length > 0 && <Button size="small" variant="adornmentAction"
            endIcon={<ChevronDownIcon size={12} style={{ transform: expanded ? 'rotate(180deg)' : undefined }} />}
            aria-expanded={expanded} aria-controls={gamesId} aria-label={`My games at ${provider.name}, ${games.length}`}
            onClick={onToggleGames} sx={{ px: 0.25 }}>
            {games.length} {games.length === 1 ? 'game' : 'games'}
          </Button>}
        </Stack>
        {contactItems.length > 0 && <Stack direction="row" gap={0.5} sx={{ flexShrink: 0 }}>
          {contactItems.map(({ channel, label, href, Icon }) => <Tooltip key={channel} title={label}>
            <IconButton component="a" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} for ${provider.name}`}
              size="small" color="inherit" variant="utilityAction" sx={{ width: { xs: 30, sm: 34 }, height: { xs: 30, sm: 34 }, p: 0 }}>
              <Icon size={17} variant="Bold" />
            </IconButton>
          </Tooltip>)}
        </Stack>}
      </Stack>
      {games.length > 0 && (
        <Collapse id={gamesId} in={expanded} mountOnEnter>
          <Stack component="ul" spacing={0.5} aria-label={`My games at ${provider.name}`} sx={{ m: 0, p: 0, pl: 7.5, pb: 1.5 }}>
            {games.map((game) => (
              <Box key={`${game.accountId}/${game.id}`} component="li" sx={{ display: 'block' }}>
                <CardActionArea component={Link} to={`/accounts/${game.accountId}`} sx={{ p: 0.75 }}>
                  <Stack direction="row" alignItems="center" spacing={1.25}>
                    {game.imageUrl
                      ? <Paper component="img" variant="mediaThumbnail" src={game.imageUrl} alt="" loading="lazy"
                          sx={{ width: 32, height: 44, flexShrink: 0 }} />
                      : <Paper variant="mediaSurface" sx={{ width: 32, height: 44, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                          <Gamepad2 size={16} />
                        </Paper>}
                    <Typography variant="itemTitle">{game.title}</Typography>
                  </Stack>
                </CardActionArea>
              </Box>
            ))}
          </Stack>
        </Collapse>
      )}
      <Divider />
    </Box>
  );
}

function ProviderRowSkeleton() {
  return (
    <Stack direction="row" alignItems="center" gap={1.5} sx={{ minHeight: 80, py: 1.5 }} aria-hidden="true">
      <Skeleton variant="circular" animation="wave" width={48} height={48} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Skeleton variant="text" animation="wave" width="65%" height={28} />
        <Skeleton variant="text" animation="wave" width="48%" height={20} />
      </Box>
    </Stack>
  );
}
