import { useMemo, useState, type ReactElement } from 'react';
import { Stack, Box, Typography, TextField, InputAdornment, Chip, Button, Paper, PageHeader, useMediaQuery, useTheme } from '@monochrome-ui/design-system';
import { AddIcon as Plus, SearchIcon as Search, GamepadIcon as Gamepad2 } from '@/components/AppIcon';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '@/hooks/useAppContext';
import { useAccounts, useDeleteAccount } from '@/hooks/useGamehub';
import { AccountCard, AccountCardSkeleton } from '@/components/AccountCard';
import { AccountModal } from '@/components/AccountModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Account, Platform } from '@/domain/types';

const PLATFORMS: ('All' | Platform)[] = ['All', 'PlayStation', 'Xbox', 'PC'];
const SKELETON_KEYS = [0, 1, 2, 3, 4, 5];
const CARD_GAP = 12;

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
  const deleteAccount = useDeleteAccount(uid ?? '');

  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState<'All' | Platform>('All');
  const [sort, setSort] = useState<'recent' | 'name'>('recent');
  const [modalOpen, setModalOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Account | undefined>();

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
    if (platform !== 'All') list = list.filter((a) => a.platform === platform);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.accountName.toLowerCase().includes(q) || (a.email ?? '').toLowerCase().includes(q) || (a.games ?? []).some((g) => g.title.toLowerCase().includes(q)));
    }
    if (sort === 'name') list = [...list].sort((a, b) => a.accountName.localeCompare(b.accountName));
    return list;
  }, [accounts, platform, search, sort]);

  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={2}>
        {/* Header */}
        <PageHeader
          title="Your Vault"
          subtitle={`${accounts?.length ?? 0} ${(accounts?.length ?? 0) === 1 ? 'account' : 'accounts'} · all platforms`}
          action={<Button size="small" variant="contained" startIcon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Add Account</Button>}
        />

        {/* Search */}
        <TextField
          fullWidth size="small" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search accounts, emails, or games…"
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} color="action" /></InputAdornment> } }}
        />

        {/* Filters */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {PLATFORMS.map((p) => (
            <Chip
              key={p} label={p} size="small" onClick={() => setPlatform(p)}
              variant={platform === p ? 'filterSelected' : 'filter'}
            />
          ))}
          <Chip size="small" label={sort === 'recent' ? 'Recent' : 'A–Z'} onClick={() => setSort((s) => (s === 'recent' ? 'name' : 'recent'))} variant="filterAction" sx={{ ml: 'auto' }} />
        </Stack>

        {isLoading && (
          <VaultMasonry columns={columns} loading>
            {SKELETON_KEYS.map((key) => <AccountCardSkeleton key={key} />)}
          </VaultMasonry>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
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
