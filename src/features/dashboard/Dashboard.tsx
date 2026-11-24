import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { Stack, Box, Typography, TextField, InputAdornment, Button, Paper, PageHeader, Menu, MenuItem, useMediaQuery, useTheme } from '@monochrome-ui/design-system';
import { AddIcon as Plus, SearchIcon as Search, GamepadIcon as Gamepad2, MonitorIcon as Monitor, PlayStationIcon, XboxIcon, SortIcon, TuneIcon, ChevronDownIcon } from '@/components/AppIcon';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '@/hooks/useAppContext';
import { useAccounts, useDeleteAccount, useProviders } from '@/hooks/useGamehub';
import { AccountCard, AccountCardSkeleton } from '@/components/AccountCard';
import { AccountModal } from '@/components/AccountModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Account, Platform } from '@/domain/types';
import { getAccountInfoFields } from '@/domain/accountInfo';

const PLATFORMS: Platform[] = ['PlayStation', 'Xbox', 'PC'];
const PLATFORM_ICONS = { PlayStation: PlayStationIcon, Xbox: XboxIcon, PC: Monitor };
const SKELETON_KEYS = [0, 1, 2, 3, 4, 5];
const CARD_GAP = 12;
const PLATFORM_STORAGE_KEY = 'gamehub.vault.platform';
type SortOption = 'recent' | 'name-asc' | 'name-desc';

function getSavedPlatform(): Platform {
  try {
    const saved = window.localStorage.getItem(PLATFORM_STORAGE_KEY);
    return PLATFORMS.includes(saved as Platform) ? saved as Platform : 'PlayStation';
  } catch {
    return 'PlayStation';
  }
}

export function Dashboard() {
  const { breakpoints } = useTheme();
  const atLeastSmall = useMediaQuery(breakpoints.up('sm'));
  const atLeastMedium = useMediaQuery(breakpoints.up('md'));
  const atLeastLarge = useMediaQuery(breakpoints.up('lg'));
  const atLeastExtraLarge = useMediaQuery(breakpoints.up('xl'));
  const columns = atLeastExtraLarge ? 6 : atLeastLarge ? 5 : atLeastMedium ? 4 : atLeastSmall ? 2 : 1;
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAppContext();
  const uid = user?.uid;
  const { data: accounts, isLoading } = useAccounts(uid);
  const { data: providers } = useProviders(uid);
  const deleteAccount = useDeleteAccount(uid ?? '');

  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState<Platform>(getSavedPlatform);
  const [platformAnchor, setPlatformAnchor] = useState<HTMLElement | null>(null);
  const [sort, setSort] = useState<SortOption>('recent');
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);
  const [storeAnchor, setStoreAnchor] = useState<HTMLElement | null>(null);
  const [storeFilter, setStoreFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Account | undefined>();

  useEffect(() => {
    try {
      window.localStorage.setItem(PLATFORM_STORAGE_KEY, platform);
    } catch {
      // Filtering remains usable if browser storage is unavailable.
    }
  }, [platform]);

  const addAccountRequested = searchParams.get('action') === 'add-account';
  const closeAccountModal = () => {
    setModalOpen(false);
    if (!addAccountRequested) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('action');
    setSearchParams(nextParams, { replace: true });
  };

  const filtered = useMemo(() => {
    let list = accounts ?? [];
    list = list.filter((a) => a.platform === platform);
    if (storeFilter) {
      list = list.filter((account) => account.providerId === storeFilter
        || (account.games ?? []).some((game) => game.providerId === storeFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.accountName.toLowerCase().includes(q)
        || getAccountInfoFields(a).some((field) => !field.secret && `${field.label} ${field.value}`.toLowerCase().includes(q))
        || (a.games ?? []).some((g) => g.title.toLowerCase().includes(q)));
    }
    if (sort !== 'recent') list = [...list].sort((a, b) => {
      const order = a.accountName.localeCompare(b.accountName);
      return sort === 'name-asc' ? order : -order;
    });
    return list;
  }, [accounts, platform, search, sort, storeFilter]);
  const sortLabel = sort === 'recent' ? 'Recently added' : sort === 'name-asc' ? 'Name A–Z' : 'Name Z–A';
  const usedProviderIds = new Set((accounts ?? []).flatMap((account) => [
    ...(account.providerId ? [account.providerId] : []),
    ...(account.games ?? []).flatMap((game) => game.providerId ? [game.providerId] : []),
  ]));
  const storeOptions = (providers ?? []).filter((provider) => usedProviderIds.has(provider.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const selectedStore = storeOptions.find((provider) => provider.id === storeFilter);
  const PlatformIcon = PLATFORM_ICONS[platform];

  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={3}>
        {/* Header */}
        <PageHeader
          title="Your Vault"
          subtitle={`${filtered.length} ${filtered.length === 1 ? 'account' : 'accounts'} · ${platform}`}
          action={<Button size="small" variant="contained" startIcon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Add Account</Button>}
        />

        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 320px' }, minWidth: 0 }}>
            <TextField
              fullWidth size="small" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search accounts, emails, or games…"
              slotProps={{
                htmlInput: { 'aria-label': 'Search accounts, emails, or games' },
                input: { startAdornment: <InputAdornment position="start"><Search size={18} color="action" /></InputAdornment> },
              }}
            />
          </Box>
          <Stack role="group" aria-label="Vault filters" direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <Button size="small" variant="adornmentAction" startIcon={<PlatformIcon size={16} />} endIcon={<ChevronDownIcon size={12} />}
              aria-label={`Platform, ${platform}`} aria-haspopup="menu" aria-expanded={Boolean(platformAnchor)}
              onClick={(event) => setPlatformAnchor(event.currentTarget)}>
              {platform}
            </Button>
            <Button size="small" variant="adornmentAction" startIcon={<TuneIcon size={16} />} endIcon={<ChevronDownIcon size={12} />}
              aria-label={`Filter by store, ${selectedStore?.name ?? 'All stores'}`} aria-haspopup="menu"
              aria-expanded={Boolean(storeAnchor)} onClick={(event) => setStoreAnchor(event.currentTarget)}>
              {selectedStore?.name ?? 'All stores'}
            </Button>
            <Button size="small" variant="adornmentAction" startIcon={<SortIcon size={16} />} endIcon={<ChevronDownIcon size={12} />}
              aria-label={`Sort accounts, ${sortLabel}`} aria-haspopup="menu" aria-expanded={Boolean(sortAnchor)}
              onClick={(event) => setSortAnchor(event.currentTarget)}>
              {sortLabel}
            </Button>
          </Stack>
        </Stack>

        <Menu anchorEl={platformAnchor} open={Boolean(platformAnchor)} onClose={() => setPlatformAnchor(null)}
          slotProps={{ list: { 'aria-label': 'Platform' } }}>
          {PLATFORMS.map((option) => (
            <MenuItem key={option} selected={platform === option} onClick={() => { setPlatform(option); setPlatformAnchor(null); }}>
              {option}
            </MenuItem>
          ))}
        </Menu>

        <Menu anchorEl={storeAnchor} open={Boolean(storeAnchor)} onClose={() => setStoreAnchor(null)} aria-label="Filter accounts by store">
          <MenuItem selected={!storeFilter} onClick={() => { setStoreFilter(null); setStoreAnchor(null); }}>All stores</MenuItem>
          {storeOptions.map((provider) => (
            <MenuItem key={provider.id} selected={storeFilter === provider.id} onClick={() => { setStoreFilter(provider.id); setStoreAnchor(null); }}>
              {provider.name}
            </MenuItem>
          ))}
        </Menu>

        <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}>
          <MenuItem selected={sort === 'recent'} onClick={() => { setSort('recent'); setSortAnchor(null); }}>Recently added</MenuItem>
          <MenuItem selected={sort === 'name-asc'} onClick={() => { setSort('name-asc'); setSortAnchor(null); }}>Name A–Z</MenuItem>
          <MenuItem selected={sort === 'name-desc'} onClick={() => { setSort('name-desc'); setSortAnchor(null); }}>Name Z–A</MenuItem>
        </Menu>

        {isLoading && (
          <VaultMasonry columns={columns} loading>
            {SKELETON_KEYS.map((key) => <AccountCardSkeleton key={key} />)}
          </VaultMasonry>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (accounts?.length ?? 0) > 0 && (
          <Paper variant="emptyState">
            <Paper variant="emptyStateIcon"><Gamepad2 size={32} /></Paper>
            <Typography variant="emptyStateTitle" sx={{ mb: 1 }}>No matching accounts</Typography>
            <Typography variant="emptyStateDescription" sx={{ mb: 3, maxWidth: 380, mx: 'auto' }}>
              Try another search or store filter.
            </Typography>
            {storeFilter && <Button variant="outlined" onClick={() => setStoreFilter(null)}>Show all stores</Button>}
          </Paper>
        )}

        {!isLoading && filtered.length === 0 && (accounts?.length ?? 0) === 0 && (
          <Paper variant="emptyState">
            <Paper variant="emptyStateIcon"><Gamepad2 size={32} /></Paper>
            <Typography variant="emptyStateTitle" sx={{ mb: 1 }}>Your vault is empty</Typography>
            <Typography variant="emptyStateDescription" sx={{ mb: 3, maxWidth: 380, mx: 'auto' }}>
              Add your first game account to start building your collection.
            </Typography>
            <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setModalOpen(true)}>
              Add Account
            </Button>
          </Paper>
        )}

        {!isLoading && filtered.length > 0 && (
          <VaultMasonry columns={columns}>
            {filtered.map((account) => (
              <AccountCard key={account.id} account={account} onDelete={setToDelete} />
            ))}
          </VaultMasonry>
        )}

      </Stack>

      {/* Modals */}
      <AccountModal open={modalOpen || addAccountRequested} onClose={closeAccountModal} />
      <ConfirmDialog
        open={Boolean(toDelete)} title="Delete account?"
        message="This permanently removes the account and all its game covers."
        onConfirm={() => { if (toDelete) deleteAccount.mutate(toDelete); setToDelete(undefined); }}
        onClose={() => setToDelete(undefined)}
      />
    </Box>
  );
}

function VaultMasonry({ columns, children, loading }: { columns: number; children: ReactElement[]; loading?: boolean }) {
  const cardsByColumn = Array.from({ length: columns }, () => [] as ReactElement[]);
  children.forEach((card, index) => cardsByColumn[index % columns].push(card));

  return (
    <Box role="list" aria-label="Game accounts" aria-hidden={loading}
      sx={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, alignItems: 'start', gap: `${CARD_GAP}px` }}>
      {cardsByColumn.map((cards, index) => (
        <Stack key={index} role="presentation" useFlexGap spacing={`${CARD_GAP}px`} sx={{ minWidth: 0 }}>
          {cards.map((card) => <Box key={card.key} role="listitem">{card}</Box>)}
        </Stack>
      ))}
    </Box>
  );
}
