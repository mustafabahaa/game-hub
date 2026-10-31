import { useEffect, useMemo, useState } from 'react';
import { Stack, Box, Typography, TextField, InputAdornment, Chip, Button } from '@mui/material';
import { Plus, Search, Gamepad2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '@/hooks/useAppContext';
import { useAccounts, useDeleteAccount } from '@/hooks/useGamehub';
import { AccountCard, AccountCardSkeleton } from '@/components/AccountCard';
import { AccountModal } from '@/components/AccountModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Account, Platform } from '@/domain/types';

const PLATFORMS: ('All' | Platform)[] = ['All', 'PlayStation', 'Xbox', 'PC'];

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

  useEffect(() => {
    if (searchParams.get('action') !== 'add-account') return;
    setModalOpen(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('action');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

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
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h1">Your Vault</Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {accounts?.length ?? 0} {(accounts?.length ?? 0) === 1 ? 'account' : 'accounts'} · all platforms
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setModalOpen(true)} sx={{ flexShrink: 0 }}>
            Add Account
          </Button>
        </Stack>

        {/* Search */}
        <TextField
          fullWidth value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search accounts, emails, or games…"
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} color="action" /></InputAdornment> }}
        />

        {/* Filters */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {PLATFORMS.map((p) => (
            <Chip
              key={p} label={p} onClick={() => setPlatform(p)}
              variant={platform === p ? 'filled' : 'outlined'}
              sx={{
                height: 32, fontWeight: 600, fontSize: 13,
                bgcolor: platform === p ? 'primary.main' : 'transparent',
                color: platform === p ? 'primary.contrastText' : 'text.secondary',
                borderColor: 'divider',
              }}
            />
          ))}
          <Box sx={{ flex: 1 }} />
          <Chip label={sort === 'recent' ? 'Recent' : 'A–Z'} onClick={() => setSort((s) => (s === 'recent' ? 'name' : 'recent'))} variant="outlined" sx={{ height: 32, fontWeight: 600 }} />
        </Stack>

        {/* Loading */}
        {isLoading && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5 }}>
            {Array.from({ length: 6 }).map((_, i) => <AccountCardSkeleton key={i} />)}
          </Box>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8, px: 3, borderRadius: '16px', border: '1px dashed', borderColor: 'divider' }}>
            <Box sx={{ width: 72, height: 72, mx: 'auto', mb: 2, borderRadius: 3, display: 'grid', placeItems: 'center', bgcolor: 'action.selected' }}>
              <Box sx={{ color: 'primary.main' }}><Gamepad2 size={32} /></Box>
            </Box>
            <Typography variant="h4" sx={{ mb: 1 }}>Your vault is empty</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 380, mx: 'auto' }}>
              Add your first game account to start building your collection.
            </Typography>
            <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setModalOpen(true)}>
              Add Account
            </Button>
          </Box>
        )}

        {/* Account grid — 4-up desktop, 2-up mobile. Each card ~280px+ wide. */}
        {!isLoading && filtered.length > 0 && (
          <Box sx={{ columnCount: { xs: 2, sm: 3, lg: 4 }, columnGap: '20px' }}>
            {filtered.map((account) => (
              <Box key={account.id} onClick={() => navigate(`/accounts/${account.id}`)} sx={{ display: 'inline-block', width: '100%', mb: '20px', breakInside: 'avoid', verticalAlign: 'top', cursor: 'pointer' }}>
                <AccountCard account={account} onDelete={setToDelete} />
              </Box>
            ))}
          </Box>
        )}

      </Stack>

      {/* Modals */}
      <AccountModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <ConfirmDialog
        open={Boolean(toDelete)} title="Delete account?"
        message="This permanently removes the account and all its game covers."
        onConfirm={() => { if (toDelete) deleteAccount.mutate(toDelete); setToDelete(undefined); }}
        onClose={() => setToDelete(undefined)}
      />
    </Box>
  );
}
