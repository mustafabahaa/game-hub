import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, MenuItem, Paper, Select, Stack, TextField, Typography,
} from '@monochrome-ui/design-system';
import { ArrowLeftIcon as ArrowLeft, CalendarClockIcon as CalendarClock, CheckCircleIcon as Check, ContentCopyIcon as Copy, InfinityIcon, KeyIcon as KeyRound, EmailIcon as Mail, PencilIcon as Pencil, AddIcon as Plus, ShieldCheckIcon as ShieldCheck, DeleteOutlineIcon as Trash2, ImportIcon as Upload } from '@/components/AppIcon';
import { useAppContext } from '@/hooks/useAppContext';
import { useAccounts, useCreateGame, useDeleteAccount, useDeleteGame, useProviders, useUpdateAccount, useUpdateGame } from '@/hooks/useGamehub';
import { AccountModal } from '@/components/AccountModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { GameCover } from '@/components/GameCover';
import { getLifecycleLabel, isAccountExpired } from '@/domain/lifecycle';
import type { Account, Game } from '@/domain/types';

export function AccountDetailPage() {
  const { id } = useParams();
  return <AccountDetailContent key={id} id={id} />;
}

function AccountDetailContent({ id }: { id?: string }) {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const uid = user?.uid;
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts(uid);
  const { data: providers = [] } = useProviders(uid);
  const account = useMemo(() => accounts.find((item) => item.id === id), [accounts, id]);
  const record = account;
  const createGame = useCreateGame(uid ?? '', record?.id ?? '');
  const updateGame = useUpdateGame(uid ?? '', record?.id ?? '');
  const deleteGame = useDeleteGame(uid ?? '', record?.id ?? '');
  const deleteAccount = useDeleteAccount(uid ?? '');
  const [editOpen, setEditOpen] = useState(false);
  const [gameTitle, setGameTitle] = useState('');
  const [gameNotes, setGameNotes] = useState('');
  const [coverConsole, setCoverConsole] = useState<NonNullable<Game['coverConsole']> | ''>('');
  const [newGameProviderId, setNewGameProviderId] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [gameDialogOpen, setGameDialogOpen] = useState(false);
  const [gameToEdit, setGameToEdit] = useState<Game | undefined>();
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

  const openAddGame = () => {
    setGameToEdit(undefined);
    setGameTitle('');
    setGameNotes('');
    setCoverConsole('');
    setNewGameProviderId('');
    setCoverFile(null);
    setGameDialogOpen(true);
  };
  const openEditGame = (game: Game) => {
    setGameToEdit(game);
    setGameTitle(game.title);
    setGameNotes(game.notes ?? '');
    setCoverConsole(game.coverConsole ?? '');
    setNewGameProviderId(game.providerId ?? '');
    setCoverFile(null);
    setGameDialogOpen(true);
  };
  const saveGame = async () => {
    if (!gameTitle.trim()) return;
    const form = { title: gameTitle.trim(), providerId: newGameProviderId || null, notes: gameNotes, coverConsole: coverConsole || null };
    if (gameToEdit) {
      await updateGame.mutateAsync({ gameId: gameToEdit.id, form });
    } else {
      await createGame.mutateAsync({ form, imageFile: coverFile });
    }
    setGameTitle(''); setGameNotes(''); setNewGameProviderId(''); setCoverFile(null);
    setGameDialogOpen(false); setGameToEdit(undefined);
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

      <Box sx={{ display: 'grid', gridTemplateColumns: games[0]?.imageUrl ? { xs: 'minmax(104px, 30%) minmax(0, 1fr)', sm: '160px minmax(0, 1fr)' } : 'minmax(0, 1fr)', gap: { xs: 2, sm: 3 }, alignItems: 'center', mb: { xs: 3, sm: 3.5 } }}>
        {games[0]?.imageUrl && <GameCover game={games[0]} platform={record.platform} />}
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
        <AccountInfo account={record} uid={uid ?? ''} />

        <Section title={`Games in this account · ${games.length}`}>
          {games.length > 0 && <Stack divider={<Divider />}>
            {games.map((game) => <GameRow key={game.id} game={game} providerName={providers.find((provider) => provider.id === game.providerId)?.name} onEdit={() => openEditGame(game)} onDelete={() => setGameToDelete(game)} />)}
          </Stack>}
          <Button variant="outlined" fullWidth startIcon={<Plus size={16} />} onClick={openAddGame} sx={{ mt: 2 }}>Add a game</Button>
        </Section>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}><Button color="error" variant="text" startIcon={<Trash2 size={16} />} onClick={() => setConfirmAccountDelete(true)}>Delete account</Button></Box>

      {account && <AccountModal open={editOpen} account={account} onClose={() => setEditOpen(false)} />}
      <Dialog open={gameDialogOpen} onClose={() => setGameDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{gameToEdit ? 'Edit game' : 'Add a game'}</DialogTitle>
        <DialogContent>
          <Stack direction="column" spacing={2} sx={{ mt: 1 }}>
            <TextField label="Game title" fullWidth required value={gameTitle} onChange={(event) => setGameTitle(event.target.value)} />
            <TextField label="Game notes" fullWidth multiline minRows={2} value={gameNotes} onChange={(event) => setGameNotes(event.target.value)} />
            {record.platform === 'PlayStation' && (
              <TextField select fullWidth label="Cover frame" value={coverConsole}
                onChange={(event) => setCoverConsole(event.target.value as typeof coverConsole)}>
                <MenuItem value="">PlayStation</MenuItem>
                <MenuItem value="PS5">PS5</MenuItem>
                <MenuItem value="PS4">PS4</MenuItem>
              </TextField>
            )}
            <Stack direction="column" spacing={0.5}>
              <Typography variant="metadataLabel" color="text.secondary">Provider</Typography>
              <Select size="small" fullWidth displayEmpty value={newGameProviderId} onChange={(event) => setNewGameProviderId(event.target.value)} aria-label="Provider for game">
                <MenuItem value="">No provider</MenuItem>
                {providers.map((provider) => <MenuItem key={provider.id} value={provider.id}>{provider.name}</MenuItem>)}
              </Select>
            </Stack>
            {!gameToEdit && <>
              <input ref={coverInput} type="file" accept="image/*" hidden onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)} />
              <Button variant="quietAction" size="small" onClick={() => coverInput.current?.click()} startIcon={<Upload size={15} />} sx={{ alignSelf: 'flex-start', minWidth: 0, px: 0, overflow: 'hidden' }}>
                <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: { xs: 180, sm: 300 } }}>{coverFile?.name ?? 'Add cover image'}</Box>
              </Button>
            </>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGameDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void saveGame()} disabled={!gameTitle.trim()} loading={createGame.isPending || updateGame.isPending} startIcon={gameToEdit ? <Pencil size={16} /> : <Plus size={16} />}>
            {gameToEdit ? 'Save changes' : 'Add game'}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={confirmAccountDelete} title="Delete account?" message="This permanently removes the account and all its game covers." onConfirm={() => void handleDeleteAccount()} onClose={() => setConfirmAccountDelete(false)} />
      <ConfirmDialog open={Boolean(gameToDelete)} title="Remove game?" message="This removes the game and its cover from this account." onConfirm={() => { if (gameToDelete) deleteGame.mutate(gameToDelete); setGameToDelete(undefined); }} onClose={() => setGameToDelete(undefined)} />
    </Box>
  );
}

function HeaderChip({ label, icon, expired }: { label: string; icon?: React.ReactElement; expired?: boolean }) {
  return <Chip size="small" icon={icon} label={label} variant={expired ? 'inverseAlertTag' : 'inverseTag'} />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <Box component="section" sx={{ minWidth: 0, py: { xs: 0, lg: 1 } }}>
    <Typography component="h2" variant="sectionHeading" sx={{ mb: 1.5 }}>{title}</Typography>
    {children}
  </Box>;
}

const credentialFields = [
  { key: 'email', label: 'Email', addLabel: 'Add email', type: 'email', Icon: Mail },
  { key: 'password', label: 'Password', addLabel: 'Add password', type: 'password', Icon: KeyRound },
  { key: 'otpSecret', label: 'OTP secret', addLabel: 'Add OTP secret', type: 'password', Icon: ShieldCheck },
] as const;

const noteField = { key: 'notes', label: 'Account note', addLabel: 'Add note', type: 'text' } as const;
type InfoField = (typeof credentialFields)[number] | typeof noteField;
type SavedNote = { label: string; value: string; gameId?: string };
type InfoEditor = { mode: 'add'; field: InfoField } | { mode: 'edit' | 'delete'; note: SavedNote };

function AccountInfo({ account, uid }: { account: Account; uid: string }) {
  const updateAccount = useUpdateAccount(uid);
  const updateGame = useUpdateGame(uid, account.id);
  const [editor, setEditor] = useState<InfoEditor | null>(null);
  const [draft, setDraft] = useState('');
  const [shownSecrets, setShownSecrets] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const notes: SavedNote[] = [];
  if (account.notes?.trim()) notes.push({ label: noteField.label, value: account.notes });
  for (const game of account.games ?? []) {
    if (game.notes?.trim()) notes.push({ label: `${game.title} note`, value: game.notes, gameId: game.id });
  }
  const missingFields: InfoField[] = credentialFields.filter(({ key }) => !account[key]?.trim());
  if (notes.length === 0) missingFields.push(noteField);

  const saving = updateAccount.isPending || updateGame.isPending;
  const saveFailed = updateAccount.isError || updateGame.isError;
  const field = editor?.mode === 'add' ? editor.field : noteField;
  const deleting = editor?.mode === 'delete';

  const openEditor = (next: InfoEditor) => {
    updateAccount.reset();
    updateGame.reset();
    setDraft(next.mode === 'edit' ? next.note.value : '');
    setEditor(next);
  };

  const closeEditor = () => {
    setDraft('');
    setEditor(null);
  };

  const saveInfo = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor || saving || (!deleting && !draft.trim())) return;
    const value = deleting ? null : field.key === 'password' ? draft : draft.trim();
    const gameId = editor.mode === 'add' ? undefined : editor.note.gameId;

    if (gameId) {
      updateGame.mutate({ gameId, form: { notes: value } }, { onSuccess: closeEditor });
    } else {
      updateAccount.mutate({ id: account.id, form: { [field.key]: value } }, { onSuccess: closeEditor });
    }
  };

  return (
    <Section title="Account info">
      <Stack divider={<Divider />}>
        {credentialFields.map(({ key, label, type, Icon }) => {
          const value = account[key];
          if (!value?.trim()) return null;
          return <Credential key={key} icon={<Icon size={17} />} label={label} value={value} secret={type === 'password'}
            shown={shownSecrets[key]} onReveal={() => setShownSecrets((previous) => ({ ...previous, [key]: !previous[key] }))}
            copied={copied === key} onCopy={() => copyValue(key, value, setCopied)} />;
        })}
        {notes.map((note) => (
          <Stack key={note.gameId ?? 'account'} direction="row" alignItems="flex-start" spacing={1} sx={{ py: 1.5 }}>
            <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="metadataLabel" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{note.label}</Typography>
              <Typography variant="bodyNote" sx={{ overflowWrap: 'anywhere' }}>{note.value}</Typography>
            </Stack>
            <IconButton size="small" variant="quietAction" aria-label={`Edit ${note.label}`} onClick={() => openEditor({ mode: 'edit', note })}>
              <Pencil size={16} />
            </IconButton>
            <IconButton size="small" variant="quietAction" color="error" aria-label={`Delete ${note.label}`} onClick={() => openEditor({ mode: 'delete', note })}>
              <Trash2 size={16} />
            </IconButton>
          </Stack>
        ))}
      </Stack>
      {missingFields.length > 0 && (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
          {missingFields.map((item) => (
            <Button key={item.key} size="small" variant="outlined" startIcon={<Plus size={15} />}
              onClick={() => openEditor({ mode: 'add', field: item })}>
              {item.addLabel}
            </Button>
          ))}
        </Stack>
      )}
      {editor && (
        <Dialog open onClose={() => { if (!saving) closeEditor(); }} maxWidth="xs" fullWidth>
          <Box component="form" onSubmit={saveInfo}>
            <DialogTitle>{editor.mode === 'add' ? field.addLabel : deleting ? 'Delete note?' : 'Edit note'}</DialogTitle>
            <DialogContent>
              {editor.mode === 'delete' ? (
                <Typography variant="body2" color="text.secondary">Remove the saved note from {editor.note.gameId ? 'this game' : 'this account'}.</Typography>
              ) : (
                <TextField autoFocus required fullWidth label={editor.mode === 'edit' ? editor.note.label : field.label} type={field.type}
                  multiline={field.key === 'notes'} minRows={field.key === 'notes' ? 3 : undefined}
                  autoComplete={field.key === 'password' ? 'new-password' : 'off'}
                  value={draft} onChange={(event) => setDraft(event.target.value)} sx={{ mt: 1 }} />
              )}
              {saveFailed && <Typography role="alert" variant="body2" color="error" sx={{ mt: 1 }}>
                {deleting ? 'Couldn’t delete the note. Please try again.' : 'Couldn’t save. Please try again.'}
              </Typography>}
            </DialogContent>
            <DialogActions>
              <Button disabled={saving} onClick={closeEditor}>Cancel</Button>
              <Button type="submit" variant="contained" color={deleting ? 'error' : 'primary'}
                disabled={!deleting && !draft.trim()} loading={saving}>{deleting ? 'Delete note' : 'Save'}</Button>
            </DialogActions>
          </Box>
        </Dialog>
      )}
    </Section>
  );
}

function Credential({ icon, label, value, secret, shown, copied, onReveal, onCopy }: { icon: React.ReactNode; label: string; value: string; secret?: boolean; shown?: boolean; copied: boolean; onReveal?: () => void; onCopy: () => void }) {
  return <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.5, minWidth: 0 }}>
    <Typography component="span" color="text.secondary" sx={{ display: 'flex', flexShrink: 0 }}>{icon}</Typography>
    <Stack direction="column" spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="metadataLabel" color="text.secondary">{label}</Typography>
      <Typography variant="monospaceValue">{secret && !shown ? '••••••••' : value}</Typography>
    </Stack>
    {secret && <Button size="small" onClick={onReveal} sx={{ minWidth: 0, px: 1, flexShrink: 0 }}>{shown ? 'Hide' : 'Reveal'}</Button>}
    <IconButton size="small" aria-label={`Copy ${label}`} onClick={onCopy} sx={{ flexShrink: 0 }}>{copied ? <Check size={16} /> : <Copy size={16} />}</IconButton>
  </Stack>;
}

function GameRow({ game, providerName, onEdit, onDelete }: { game: Game; providerName?: string; onEdit: () => void; onDelete: () => void }) {
  return <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ py: 1.75, minWidth: 0 }}>
    {game.imageUrl && <Paper component="img" variant="mediaThumbnail" src={game.imageUrl} alt="" sx={{ width: 52, height: 72, flexShrink: 0 }} />}
    <Stack direction="column" spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="itemTitle" title={game.title}>{game.title}</Typography>
      {providerName && <Typography variant="caption" color="text.secondary">Provider · {providerName}</Typography>}
    </Stack>
    <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0, mt: -0.5 }}>
      <IconButton aria-label={`Edit ${game.title}`} size="small" variant="quietAction" onClick={onEdit}><Pencil size={15} /></IconButton>
      <IconButton aria-label={`Remove ${game.title}`} size="small" color="error" variant="quietAction" onClick={onDelete}><Trash2 size={16} /></IconButton>
    </Stack>
  </Stack>;
}

function copyValue(key: string, value: string, setCopied: (key: string | null) => void) {
  if (!value || !navigator.clipboard) return;
  void navigator.clipboard.writeText(value).then(() => {
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1400);
  }).catch(() => setCopied(null));
}
