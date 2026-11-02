import { useMemo, useState } from 'react';
import { Stack, Box, Typography, TextField, InputAdornment, Chip, Button, Paper, PageHeader } from '@monochrome-ui/design-system';
import { AddIcon as Plus, SearchIcon as Search, GamepadIcon as Gamepad2 } from '@/components/AppIcon';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '@/hooks/useAppContext';
import { useAccounts, useDeleteAccount } from '@/hooks/useGamehub';
import { AccountCard, AccountCardSkeleton } from '@/components/AccountCard';
import { AccountModal } from '@/components/AccountModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Account, Platform } from '@/domain/types';

const PLATFORMS: ('All' | Platform)[] = ['All', 'PlayStation', 'Xbox', 'PC'];
const SKELETON_KEYS = [0, 1, 2, 3, 4, 5];

export function Dashboard() {
  const navigate = useNavigate();
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
      list = list.filter((a) => a.accountName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || (a.games ?? []).some((g) => g.title.toLowerCase().includes(q)));
    }
    if (sort === 'name') list = [...list].sort((a, b) => a.accountName.localeCompare(b.accountName));
    return list;
  }, [accounts, platform, search, sort]);

  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={3}>
        {/* Header */}
        <PageHeader
          title="Your Vault"
          subtitle={`${accounts?.length ?? 0} ${(accounts?.length ?? 0) === 1 ? 'account' : 'accounts'} · all platforms`}
          action={<Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setModalOpen(true)}>Add Account</Button>}
        />

        {/* Search */}
        <TextField
          fullWidth value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search accounts, emails, or games…"
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} color="action" /></InputAdornment> } }}
        />

        {/* Filters */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {PLATFORMS.map((p) => (
            <Chip
              key={p} label={p} onClick={() => setPlatform(p)}
              variant={platform === p ? 'filterSelected' : 'filter'}
            />
          ))}
          <Chip label={sort === 'recent' ? 'Recent' : 'A–Z'} onClick={() => setSort((s) => (s === 'recent' ? 'name' : 'recent'))} variant="filterAction" sx={{ ml: 'auto' }} />
        </Stack>

        {/* Loading */}
        {isLoading && (
          <Box sx={{ columnCount: { xs: 1, sm: 2, md: 3, lg: 4 }, columnGap: '20px' }}>
            {SKELETON_KEYS.map((i) => (
              <Box
                key={i}
                sx={{
                  display: 'inline-block',
                  width: '100%',
                  mb: '20px',
                  breakInside: 'avoid',
                  verticalAlign: 'top',
                }}
              >
                <AccountCardSkeleton />
              </Box>
            ))}
          </Box>
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

        {/* Keep account cards wide enough for their platform and account-type overlays. */}
        {!isLoading && filtered.length > 0 && (
          <Box sx={{ columnCount: { xs: 1, sm: 2, md: 3, lg: 4 }, columnGap: '20px' }}>
            {filtered.map((account) => (
              <Box key={account.id} onClick={() => navigate(`/accounts/${account.id}`)} sx={{ display: 'inline-block', width: '100%', mb: '20px', breakInside: 'avoid', verticalAlign: 'top', cursor: 'pointer' }}>
                <AccountCard account={account} onDelete={setToDelete} />
              </Box>
            ))}
          </Box>
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
