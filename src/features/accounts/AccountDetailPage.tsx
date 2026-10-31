import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControlLabel, IconButton, MenuItem, Stack, Switch, TextField, Typography,
} from '@mui/material';
import { ArrowLeft, CalendarClock, Check, Copy, Infinity as InfinityIcon, KeyRound, Mail, Pencil, Plus, Share2, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { useAppContext } from '@/hooks/useAppContext';
import { useAccounts, useCreateGame, useDeleteAccount, useDeleteGame, useFriends, useProfile, useShareAccount, useSharedAccounts } from '@/hooks/useGamehub';
import { AccountModal } from '@/components/AccountModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { getLifecycleLabel, isAccountExpired } from '@/domain/lifecycle';
import type { Account, Game } from '@/domain/types';

export function AccountDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAppContext();
  const uid = user?.uid;
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts(uid);
  const { data: shares = [], isLoading: sharesLoading } = useSharedAccounts(uid);
  const { data: friends = [] } = useFriends(uid);
  const account = useMemo(() => accounts.find((item) => item.id === id), [accounts, id]);
  const sharedDoc = useMemo(() => shares.find((item) => item.id === id), [shares, id]);
  const { data: ownerProfile } = useProfile(sharedDoc?.ownerId);
  const isShared = !account && Boolean(sharedDoc);
  const record: Account | undefined = account ?? (sharedDoc ? {
    id: sharedDoc.id,
    accountName: sharedDoc.account.accountName,
    email: sharedDoc.account.email,
    password: sharedDoc.account.password ?? null,
    otpSecret: sharedDoc.account.otpSecret ?? null,
    platform: sharedDoc.account.platform,
    isPsPlus: sharedDoc.account.isPsPlus,
    accountType: null,
    providerId: null,
    lifecycleType: 'lifetime',
    expiresOn: null,
    games: sharedDoc.games.map((game) => ({ ...game, accountId: sharedDoc.id, createdAt: sharedDoc.createdAt })),
    canViewPassword: sharedDoc.canViewPassword,
    canViewOtp: sharedDoc.canViewOtp,
    sharedByName: ownerProfile?.displayName ?? ownerProfile?.username ?? null,
    createdAt: sharedDoc.createdAt,
    updatedAt: sharedDoc.createdAt,
  } : undefined);

  const createGame = useCreateGame(uid ?? '', record?.id ?? '');
  const deleteGame = useDeleteGame(uid ?? '', record?.id ?? '');
  const deleteAccount = useDeleteAccount(uid ?? '');
  const shareAccount = useShareAccount(uid ?? '', user?.displayName ?? user?.email ?? 'GameHub user');
  const [editOpen, setEditOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [canViewPassword, setCanViewPassword] = useState(false);
  const [canViewOtp, setCanViewOtp] = useState(false);
  const [shownSecrets, setShownSecrets] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [gameTitle, setGameTitle] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [gameToDelete, setGameToDelete] = useState<Game | undefined>();
  const [confirmAccountDelete, setConfirmAccountDelete] = useState(false);
  const coverInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShownSecrets({});
    setCopied(null);
    setSharing(false);
  }, [id]);

  if (accountsLoading || sharesLoading) return <Box sx={{ minHeight: '55vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  if (!record) return <Box sx={{ width: '100%', py: 4 }}>
    <Button startIcon={<ArrowLeft size={17} />} onClick={() => navigate('/')} sx={{ mb: 3 }}>Back to vault</Button>
    <Typography variant="h2" sx={{ mb: 1 }}>Account not found</Typography>
    <Typography color="text.secondary">This account may have been removed or you may no longer have access to it.</Typography>
  </Box>;

  const games = record.games ?? [];
  const expired = isAccountExpired(record);
  const statusLabel = getLifecycleLabel(record);

  const addGame = async () => {
    if (!gameTitle.trim() || isShared) return;
    await createGame.mutateAsync({ title: gameTitle.trim(), imageFile: coverFile });
    setGameTitle(''); setCoverFile(null);
    if (coverInput.current) coverInput.current.value = '';
  };
  const handleDeleteAccount = async () => {
    if (!account) return;
    await deleteAccount.mutateAsync(account);
    navigate('/', { replace: true });
  };
  const handleShare = async () => {
    if (!account || !recipientId) return;
    await shareAccount.mutateAsync({ account, recipientId, canViewPassword, canViewOtp });
    setSharing(false); setRecipientId(''); setCanViewPassword(false); setCanViewOtp(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={1.5} sx={{ mb: 2.5 }}>
        <Button startIcon={<ArrowLeft size={17} />} onClick={() => navigate('/')} sx={{ alignSelf: 'flex-start', px: 0 }}>Your Vault</Button>
        <Stack direction="row" spacing={1}>
          {!isShared && <Button variant="outlined" startIcon={<Pencil size={16} />} onClick={() => setEditOpen(true)}>Edit account</Button>}
          {!isShared && <Button variant="contained" startIcon={<Share2 size={16} />} onClick={() => setSharing((value) => !value)}>Share</Button>}
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(104px, 30%) minmax(0, 1fr)', sm: '180px minmax(0, 1fr)' }, gap: { xs: 2, sm: 3 }, alignItems: 'center', mb: { xs: 3.5, sm: 4.5 } }}>
        {games[0]?.imageUrl ? <Box component="img" src={games[0].imageUrl} alt={`${games[0].title} cover`} sx={{ display: 'block', width: '100%', aspectRatio: '2 / 3', objectFit: 'contain', borderRadius: 2, bgcolor: 'action.hover' }} /> : <Box sx={{ width: '100%', aspectRatio: '2 / 3', borderRadius: 2, bgcolor: 'action.hover' }} />}
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={.75} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
            <HeaderChip label={record.platform} />
            {record.accountType && <HeaderChip label={record.accountType} />}
            <HeaderChip label={statusLabel} expired={expired} icon={expired ? <CalendarClock size={13} /> : record.lifecycleType === 'lifetime' ? <InfinityIcon size={13} /> : <CalendarClock size={13} />} />
            {isShared && <HeaderChip label={`Shared by ${record.sharedByName ?? 'a friend'}`} />}
          </Stack>
          <Typography variant="h1" sx={{ fontWeight: 750, fontSize: { xs: 25, sm: 36 }, lineHeight: 1.15, overflowWrap: 'anywhere' }}>{record.accountName}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>{games.length} {games.length === 1 ? 'game' : 'games'} on this account</Typography>
          {games[0]?.title && <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Featuring {games[0].title}</Typography>}
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(360px, .85fr)' }, columnGap: { xs: 0, lg: 5 }, rowGap: { xs: 3.5, lg: 0 }, alignItems: 'start' }}>
        <Section title="Account credentials" description={isShared ? 'Only the details shared with you are shown.' : 'Your sign-in details. Reveal secrets only when you need them.'}>
          <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
            <Credential icon={<Mail size={17} />} label="Email" value={record.email} copied={copied === 'email'} onCopy={() => copyValue('email', record.email, setCopied)} />
            <Credential icon={<KeyRound size={17} />} label="Password" value={record.password ?? ''} unavailable={isShared && !record.canViewPassword} unavailableLabel="Not shared with you" secret shown={shownSecrets.password} onReveal={() => setShownSecrets((prev) => ({ ...prev, password: !prev.password }))} copied={copied === 'password'} onCopy={() => copyValue('password', record.password ?? '', setCopied)} />
            <Credential icon={<ShieldCheck size={17} />} label="OTP secret" value={record.otpSecret ?? ''} unavailable={isShared && !record.canViewOtp} unavailableLabel="Not shared with you" secret shown={shownSecrets.otp} onReveal={() => setShownSecrets((prev) => ({ ...prev, otp: !prev.otp }))} copied={copied === 'otp'} onCopy={() => copyValue('otp', record.otpSecret ?? '', setCopied)} />
          </Stack>
        </Section>

        <Section title={`Games in this account · ${games.length}`} description="Games and covers linked to these credentials.">
          {games.length ? <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
            {games.map((game) => <GameRow key={game.id} game={game} readOnly={isShared} onDelete={() => setGameToDelete(game)} />)}
          </Stack> : <Typography variant="body2" color="text.secondary" sx={{ py: 1.5 }}>No games linked yet.</Typography>}
          {!isShared && <Stack spacing={1} sx={{ mt: 2.5 }}>
            <input ref={coverInput} type="file" accept="image/*" hidden onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)} />
            <TextField size="small" fullWidth value={gameTitle} onChange={(event) => setGameTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void addGame(); }} placeholder="Game title" inputProps={{ 'aria-label': 'Game title' }} />
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
              <Button variant="text" size="small" onClick={() => coverInput.current?.click()} startIcon={<Upload size={15} />} sx={{ minWidth: 0, px: 0, color: 'text.secondary', overflow: 'hidden' }}>
                <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: { xs: 180, sm: 300 } }}>{coverFile?.name ?? 'Add cover image'}</Box>
              </Button>
              <Button variant="contained" onClick={() => void addGame()} disabled={!gameTitle.trim() || createGame.isPending} startIcon={createGame.isPending ? <CircularProgress size={16} color="inherit" /> : <Plus size={17} />} sx={{ minHeight: 42, flexShrink: 0, px: 2.25 }}>Add game</Button>
            </Stack>
          </Stack>}
        </Section>
      </Box>

      {!isShared && <Dialog open={sharing} onClose={() => setSharing(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: .5, fontSize: 21, fontWeight: 700 }}>Share account</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.55 }}>
            Choose a friend and decide whether they can view the password or OTP secret.
          </Typography>
          <Stack spacing={2.5}>
            <TextField select fullWidth label="Friend" value={recipientId} onChange={(event) => setRecipientId(event.target.value)}>
              {friends.length === 0 ? <MenuItem value="" disabled>No friends to share with yet</MenuItem> : <MenuItem value="">Choose a friend</MenuItem>}
              {friends.map((friend) => <MenuItem key={friend.friendUid} value={friend.friendUid}>{friend.friendProfile?.displayName ?? friend.friendProfile?.username ?? 'Friend'}</MenuItem>)}
            </TextField>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 650, mb: .5 }}>Credentials they can view</Typography>
              <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
                <FormControlLabel sx={{ py: .5, mx: 0, justifyContent: 'space-between' }} control={<Switch size="small" checked={canViewPassword} onChange={(event) => setCanViewPassword(event.target.checked)} />} label="Password" labelPlacement="start" />
                <FormControlLabel sx={{ py: .5, mx: 0, justifyContent: 'space-between' }} control={<Switch size="small" checked={canViewOtp} onChange={(event) => setCanViewOtp(event.target.checked)} />} label="OTP secret" labelPlacement="start" />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSharing(false)}>Cancel</Button>
          <Button variant="contained" disabled={!recipientId || shareAccount.isPending} onClick={() => void handleShare()}>{shareAccount.isPending ? 'Sharing…' : 'Share account'}</Button>
        </DialogActions>
      </Dialog>}

      {!isShared && <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}><Button color="error" variant="text" startIcon={<Trash2 size={16} />} onClick={() => setConfirmAccountDelete(true)}>Delete account</Button></Box>}

      {account && <AccountModal open={editOpen} account={account} onClose={() => setEditOpen(false)} />}
      <ConfirmDialog open={confirmAccountDelete} title="Delete account?" message="This permanently removes the account and all its game covers." onConfirm={() => void handleDeleteAccount()} onClose={() => setConfirmAccountDelete(false)} />
      <ConfirmDialog open={Boolean(gameToDelete)} title="Remove game?" message="This removes the game and its cover from this account." onConfirm={() => { if (gameToDelete) deleteGame.mutate(gameToDelete); setGameToDelete(undefined); }} onClose={() => setGameToDelete(undefined)} />
    </Box>
  );
}

function HeaderChip({ label, icon, expired }: { label: string; icon?: React.ReactElement; expired?: boolean }) {
  return <Chip size="small" icon={icon} label={label} sx={{ height: 28, color: 'common.white', bgcolor: expired ? 'rgba(150,24,24,.78)' : 'rgba(0,0,0,.48)', '& .MuiChip-icon': { color: 'inherit', ml: .8 }, '& .MuiChip-label': { px: 1, fontSize: 12, fontWeight: 700 } }} />;
}

function Section({ title, description, children, sx }: { title: string; description: string; children: React.ReactNode; sx?: object }) {
  return <Box component="section" sx={{ minWidth: 0, py: { xs: 0, lg: 1 }, ...sx }}>
    <Typography variant="h3" sx={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.015em' }}>{title}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 1.5, lineHeight: 1.55 }}>{description}</Typography>
    {children}
  </Box>;
}

function Credential({ icon, label, value, unavailable, unavailableLabel, secret, shown, copied, onReveal, onCopy }: { icon: React.ReactNode; label: string; value: string; unavailable?: boolean; unavailableLabel?: string; secret?: boolean; shown?: boolean; copied: boolean; onReveal?: () => void; onCopy: () => void }) {
  const hasValue = Boolean(value) && !unavailable;
  return <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.5, minWidth: 0 }}>
    <Box sx={{ display: 'flex', color: 'text.secondary', flexShrink: 0 }}>{icon}</Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, overflowWrap: 'anywhere' }}>{unavailable ? unavailableLabel : value ? secret && !shown ? '••••••••' : value : 'Not set'}</Typography>
    </Box>
    {secret && hasValue && <Button size="small" onClick={onReveal} sx={{ minWidth: 0, px: 1, flexShrink: 0 }}>{shown ? 'Hide' : 'Reveal'}</Button>}
    <IconButton size="small" aria-label={`Copy ${label}`} disabled={!hasValue} onClick={onCopy} sx={{ flexShrink: 0 }}>{copied ? <Check size={16} /> : <Copy size={16} />}</IconButton>
  </Stack>;
}

function GameRow({ game, readOnly, onDelete }: { game: Game; readOnly: boolean; onDelete: () => void }) {
  return <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.5, minWidth: 0 }}>
    {game.imageUrl ? <Box component="img" src={game.imageUrl} alt="" sx={{ width: 52, height: 72, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0, bgcolor: 'action.hover' }} /> : <Avatar variant="rounded" sx={{ width: 52, height: 72, bgcolor: 'action.hover', color: 'text.secondary', flexShrink: 0 }}><Plus size={18} /></Avatar>}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body1" sx={{ fontWeight: 650, overflowWrap: 'anywhere' }} title={game.title}>{game.title}</Typography>
      <Typography variant="caption" color="text.secondary">Linked to this account</Typography>
    </Box>
    {!readOnly && <Button aria-label={`Remove ${game.title}`} size="small" color="error" variant="text" startIcon={<Trash2 size={15} />} onClick={onDelete} sx={{ flexShrink: 0 }}>Remove</Button>}
  </Stack>;
}

function copyValue(key: string, value: string, setCopied: (key: string | null) => void) {
  if (!value || !navigator.clipboard) return;
  void navigator.clipboard.writeText(value).then(() => {
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1400);
  }).catch(() => setCopied(null));
}
