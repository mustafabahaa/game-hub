import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Avatar, Box, Button, Chip, CircularProgress, Divider, IconButton, Paper, Stack, TextField, Typography,
} from '@monochrome-ui/design-system';
import { ArrowLeftIcon as ArrowLeft, CalendarClockIcon as CalendarClock, CheckCircleIcon as Check, ContentCopyIcon as Copy, InfinityIcon, KeyIcon as KeyRound, EmailIcon as Mail, PencilIcon as Pencil, AddIcon as Plus, ShieldCheckIcon as ShieldCheck, DeleteOutlineIcon as Trash2, ImportIcon as Upload } from '@/components/AppIcon';
import { useAppContext } from '@/hooks/useAppContext';
import { useAccounts, useCreateGame, useDeleteAccount, useDeleteGame } from '@/hooks/useGamehub';
import { AccountModal } from '@/components/AccountModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { getLifecycleLabel, isAccountExpired } from '@/domain/lifecycle';
import type { Game } from '@/domain/types';

export function AccountDetailPage() {
  const { id } = useParams();
  return <AccountDetailContent key={id} id={id} />;
}

function AccountDetailContent({ id }: { id?: string }) {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const uid = user?.uid;
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts(uid);
  const account = useMemo(() => accounts.find((item) => item.id === id), [accounts, id]);
  const record = account;
  const createGame = useCreateGame(uid ?? '', record?.id ?? '');
  const deleteGame = useDeleteGame(uid ?? '', record?.id ?? '');
  const deleteAccount = useDeleteAccount(uid ?? '');
  const [editOpen, setEditOpen] = useState(false);
  const [shownSecrets, setShownSecrets] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [gameTitle, setGameTitle] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [gameToDelete, setGameToDelete] = useState<Game | undefined>();
  const [confirmAccountDelete, setConfirmAccountDelete] = useState(false);
  const coverInput = useRef<HTMLInputElement>(null);

  if (accountsLoading) return <Box sx={{ minHeight: '55vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  if (!record) return <Box sx={{ width: '100%', py: 4 }}>
    <Button startIcon={<ArrowLeft size={17} />} onClick={() => navigate('/')} sx={{ mb: 3 }}>Back to vault</Button>
    <Typography variant="h2" sx={{ mb: 1 }}>Account not found</Typography>
    <Typography color="text.secondary">This account may have been removed or you may no longer have access to it.</Typography>
  </Box>;

  const games = record.games ?? [];
  const expired = isAccountExpired(record);
  const statusLabel = getLifecycleLabel(record);

  const addGame = async () => {
    if (!gameTitle.trim()) return;
    await createGame.mutateAsync({ title: gameTitle.trim(), imageFile: coverFile });
    setGameTitle(''); setCoverFile(null);
    if (coverInput.current) coverInput.current.value = '';
  };
  const handleDeleteAccount = async () => {
    if (!account) return;
    await deleteAccount.mutateAsync(account);
    navigate('/', { replace: true });
  };
  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={1.5} sx={{ mb: 2.5 }}>
        <Button startIcon={<ArrowLeft size={17} />} onClick={() => navigate('/')} sx={{ alignSelf: 'flex-start', px: 0 }}>Your Vault</Button>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Pencil size={16} />} onClick={() => setEditOpen(true)}>Edit account</Button>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(104px, 30%) minmax(0, 1fr)', sm: '180px minmax(0, 1fr)' }, gap: { xs: 2, sm: 3 }, alignItems: 'center', mb: { xs: 3.5, sm: 4.5 } }}>
        {games[0]?.imageUrl ? <Paper component="img" variant="mediaSurface" src={games[0].imageUrl} alt={`${games[0].title} cover`} sx={{ width: '100%', aspectRatio: '2 / 3' }} /> : <Paper variant="mediaSurface" sx={{ width: '100%', aspectRatio: '2 / 3' }} />}
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={.75} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
            <HeaderChip label={record.platform} />
            {record.accountType && <HeaderChip label={record.accountType} />}
            <HeaderChip label={statusLabel} expired={expired} icon={expired ? <CalendarClock size={13} /> : record.lifecycleType === 'lifetime' ? <InfinityIcon size={13} /> : <CalendarClock size={13} />} />
          </Stack>
          <Typography variant="pageHeading">{record.accountName}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>{games.length} {games.length === 1 ? 'game' : 'games'} on this account</Typography>
          {games[0]?.title && <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Featuring {games[0].title}</Typography>}
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(360px, .85fr)' }, columnGap: { xs: 0, lg: 5 }, rowGap: { xs: 3.5, lg: 0 }, alignItems: 'start' }}>
        <Section title="Account credentials" description="Your sign-in details. Reveal secrets only when you need them.">
          <Stack divider={<Divider />}>
            <Credential icon={<Mail size={17} />} label="Email" value={record.email} copied={copied === 'email'} onCopy={() => copyValue('email', record.email, setCopied)} />
            <Credential icon={<KeyRound size={17} />} label="Password" value={record.password ?? ''} secret shown={shownSecrets.password} onReveal={() => setShownSecrets((prev) => ({ ...prev, password: !prev.password }))} copied={copied === 'password'} onCopy={() => copyValue('password', record.password ?? '', setCopied)} />
            <Credential icon={<ShieldCheck size={17} />} label="OTP secret" value={record.otpSecret ?? ''} secret shown={shownSecrets.otp} onReveal={() => setShownSecrets((prev) => ({ ...prev, otp: !prev.otp }))} copied={copied === 'otp'} onCopy={() => copyValue('otp', record.otpSecret ?? '', setCopied)} />
          </Stack>
        </Section>

        <Section title={`Games in this account · ${games.length}`} description="Games and covers linked to these credentials.">
          {games.length ? <Stack divider={<Divider />}>
            {games.map((game) => <GameRow key={game.id} game={game} onDelete={() => setGameToDelete(game)} />)}
          </Stack> : <Typography variant="body2" color="text.secondary" sx={{ py: 1.5 }}>No games linked yet.</Typography>}
          <Stack spacing={1} sx={{ mt: 2.5 }}>
            <input ref={coverInput} type="file" accept="image/*" hidden onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)} />
            <TextField size="small" fullWidth value={gameTitle} onChange={(event) => setGameTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void addGame(); }} placeholder="Game title" slotProps={{ htmlInput: { 'aria-label': 'Game title' } }} />
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
              <Button variant="quietAction" size="small" onClick={() => coverInput.current?.click()} startIcon={<Upload size={15} />} sx={{ minWidth: 0, px: 0, overflow: 'hidden' }}>
                <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: { xs: 180, sm: 300 } }}>{coverFile?.name ?? 'Add cover image'}</Box>
              </Button>
              <Button variant="contained" onClick={() => void addGame()} disabled={!gameTitle.trim() || createGame.isPending} startIcon={createGame.isPending ? <CircularProgress size={16} color="inherit" /> : <Plus size={17} />} sx={{ minHeight: 42, flexShrink: 0, px: 2.25 }}>Add game</Button>
            </Stack>
          </Stack>
        </Section>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}><Button color="error" variant="text" startIcon={<Trash2 size={16} />} onClick={() => setConfirmAccountDelete(true)}>Delete account</Button></Box>

      {account && <AccountModal open={editOpen} account={account} onClose={() => setEditOpen(false)} />}
      <ConfirmDialog open={confirmAccountDelete} title="Delete account?" message="This permanently removes the account and all its game covers." onConfirm={() => void handleDeleteAccount()} onClose={() => setConfirmAccountDelete(false)} />
      <ConfirmDialog open={Boolean(gameToDelete)} title="Remove game?" message="This removes the game and its cover from this account." onConfirm={() => { if (gameToDelete) deleteGame.mutate(gameToDelete); setGameToDelete(undefined); }} onClose={() => setGameToDelete(undefined)} />
    </Box>
  );
}

function HeaderChip({ label, icon, expired }: { label: string; icon?: React.ReactElement; expired?: boolean }) {
  return <Chip size="small" icon={icon} label={label} variant={expired ? 'inverseAlertTag' : 'inverseTag'} />;
}

function Section({ title, description, children, sx }: { title: string; description: string; children: React.ReactNode; sx?: object }) {
  return <Box component="section" sx={{ minWidth: 0, py: { xs: 0, lg: 1 }, ...sx }}>
    <Typography variant="sectionHeading">{title}</Typography>
    <Typography variant="sectionDescription" color="text.secondary" sx={{ mt: .5, mb: 1.5 }}>{description}</Typography>
    {children}
  </Box>;
}

function Credential({ icon, label, value, secret, shown, copied, onReveal, onCopy }: { icon: React.ReactNode; label: string; value: string; secret?: boolean; shown?: boolean; copied: boolean; onReveal?: () => void; onCopy: () => void }) {
  const hasValue = Boolean(value);
  return <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.5, minWidth: 0 }}>
    <Typography component="span" color="text.secondary" sx={{ display: 'flex', flexShrink: 0 }}>{icon}</Typography>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="metadataLabel" color="text.secondary">{label}</Typography>
      <Typography variant="monospaceValue">{value ? secret && !shown ? '••••••••' : value : 'Not set'}</Typography>
    </Box>
    {secret && hasValue && <Button size="small" onClick={onReveal} sx={{ minWidth: 0, px: 1, flexShrink: 0 }}>{shown ? 'Hide' : 'Reveal'}</Button>}
    <IconButton size="small" aria-label={`Copy ${label}`} disabled={!hasValue} onClick={onCopy} sx={{ flexShrink: 0 }}>{copied ? <Check size={16} /> : <Copy size={16} />}</IconButton>
  </Stack>;
}

function GameRow({ game, onDelete }: { game: Game; onDelete: () => void }) {
  return <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.5, minWidth: 0 }}>
    {game.imageUrl ? <Paper component="img" variant="mediaThumbnail" src={game.imageUrl} alt="" sx={{ width: 52, height: 72, flexShrink: 0 }} /> : <Avatar variant="mediaPlaceholder"><Plus size={18} /></Avatar>}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="itemTitle" title={game.title}>{game.title}</Typography>
      <Typography variant="caption" color="text.secondary">Linked to this account</Typography>
    </Box>
    <Button aria-label={`Remove ${game.title}`} size="small" color="error" variant="text" startIcon={<Trash2 size={15} />} onClick={onDelete} sx={{ flexShrink: 0 }}>Remove</Button>
  </Stack>;
}

function copyValue(key: string, value: string, setCopied: (key: string | null) => void) {
  if (!value || !navigator.clipboard) return;
  void navigator.clipboard.writeText(value).then(() => {
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1400);
  }).catch(() => setCopied(null));
}
