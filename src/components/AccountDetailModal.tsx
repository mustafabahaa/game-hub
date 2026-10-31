import { useEffect, useRef, useState } from 'react';
import {
  Avatar, Box, Button, Chip, CircularProgress, Collapse, Dialog, DialogActions, DialogContent,
  FormControlLabel, IconButton, MenuItem, Stack, Switch, TextField, Typography,
} from '@mui/material';
import { CalendarClock, Check, Copy, Infinity as InfinityIcon, KeyRound, Mail, Plus, ShieldCheck, Share2, Trash2, Upload, X } from 'lucide-react';
import { useAppContext } from '@/hooks/useAppContext';
import { useCreateGame, useDeleteGame, useFriends, useShareAccount } from '@/hooks/useGamehub';
import { getLifecycleLabel, isAccountExpired } from '@/domain/lifecycle';
import type { Account, Game } from '@/domain/types';

interface AccountDetailModalProps {
  open: boolean;
  account?: Account;
  onClose: () => void;
  onDelete: () => void;
}

export function AccountDetailModal({ open, account, onClose, onDelete }: AccountDetailModalProps) {
  const { user } = useAppContext();
  const uid = user?.uid ?? '';
  const { data: friends = [] } = useFriends(uid || undefined);
  const createGame = useCreateGame(uid, account?.id ?? '');
  const deleteGame = useDeleteGame(uid, account?.id ?? '');
  const shareAccount = useShareAccount(uid, user?.displayName ?? user?.email ?? 'GameHub user');
  const [title, setTitle] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sharing, setSharing] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [canViewPassword, setCanViewPassword] = useState(false);
  const [canViewOtp, setCanViewOtp] = useState(false);
  const [shownSecrets, setShownSecrets] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(''); setImageFile(null); setSharing(false); setRecipientId('');
    setCanViewPassword(false); setCanViewOtp(false); setShownSecrets({}); setCopied(null);
  }, [open, account?.id]);

  if (!account) return null;
  const games = account.games ?? [];
  const expired = isAccountExpired(account);
  const share = async () => {
    if (!recipientId) return;
    await shareAccount.mutateAsync({ account, recipientId, canViewPassword, canViewOtp });
    setSharing(false); setRecipientId(''); setCanViewPassword(false); setCanViewOtp(false);
  };
  const addGame = async () => {
    if (!title.trim()) return;
    await createGame.mutateAsync({ title: title.trim(), imageFile });
    setTitle(''); setImageFile(null);
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper" aria-labelledby="account-detail-title">
      <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: 'min(88dvh, 820px)' }}>
        <Box sx={{ position: 'relative', minHeight: 148, display: 'flex', alignItems: 'flex-end', p: { xs: 2, sm: 2.5 }, overflow: 'hidden', bgcolor: 'action.hover' }}>
          {games[0]?.imageUrl && <Box component="img" src={games[0].imageUrl} alt="" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 38%' }} />}
          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,.8), rgba(0,0,0,.18)), linear-gradient(0deg, rgba(0,0,0,.52), transparent)' }} />
          <IconButton aria-label="Close account details" onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12, color: 'common.white', bgcolor: 'rgba(0,0,0,.38)', '&:hover': { bgcolor: 'rgba(0,0,0,.58)' } }}><X size={18} /></IconButton>
          <Box sx={{ position: 'relative', color: 'common.white', pr: 5, minWidth: 0 }}>
            <Stack direction="row" spacing={.75} useFlexGap flexWrap="wrap" sx={{ mb: .8 }}>
              <HeroChip label={account.platform} />
              {account.accountType && <HeroChip label={account.accountType} />}
              <HeroChip label={getLifecycleLabel(account)} expired={expired} icon={expired ? <CalendarClock size={12} /> : account.lifecycleType === 'lifetime' ? <InfinityIcon size={12} /> : <CalendarClock size={12} />} />
            </Stack>
            <Typography id="account-detail-title" variant="h2" sx={{ color: 'common.white', fontWeight: 800, fontSize: { xs: 23, sm: 28 }, lineHeight: 1.15 }} noWrap>{account.accountName}</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.78)', mt: .4 }}>{games.length} {games.length === 1 ? 'game' : 'games'} · account details</Typography>
          </Box>
        </Box>

        <DialogContent sx={{ p: { xs: 2, sm: 2.5 }, overflowY: 'auto' }}>
          <Stack spacing={{ xs: 2.5, sm: 3 }}>
            <Box component="section" aria-labelledby="credentials-heading">
              <SectionHeading id="credentials-heading" title="Credentials" detail="Private to you unless you choose to share them." />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
                <Credential icon={<Mail size={16} />} label="Email" value={account.email} copied={copied === 'email'} onCopy={() => copyValue('email', account.email, setCopied)} />
                <Credential icon={<KeyRound size={16} />} label="Password" value={account.password ?? ''} secret shown={shownSecrets.password} onReveal={() => setShownSecrets((prev) => ({ ...prev, password: !prev.password }))} copied={copied === 'password'} onCopy={() => copyValue('password', account.password ?? '', setCopied)} />
                <Credential icon={<ShieldCheck size={16} />} label="OTP secret" value={account.otpSecret ?? ''} secret shown={shownSecrets.otp} onReveal={() => setShownSecrets((prev) => ({ ...prev, otp: !prev.otp }))} copied={copied === 'otp'} onCopy={() => copyValue('otp', account.otpSecret ?? '', setCopied)} />
              </Box>
            </Box>

            <Box component="section" aria-labelledby="games-heading">
              <SectionHeading id="games-heading" title={`Games · ${games.length}`} detail="Games linked to this account." />
              {games.length > 0 ? <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1, mb: 1.25 }}>
                {games.map((game) => <GameRow key={game.id} game={game} onDelete={() => deleteGame.mutate(game)} deleting={deleteGame.isPending} />)}
              </Box> : <Box sx={{ mb: 1.25, p: 1.5, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}><Typography variant="body2" color="text.secondary">No games linked yet. Add a game below.</Typography></Box>}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <Button variant="outlined" onClick={() => fileInput.current?.click()} startIcon={<Upload size={15} />} sx={{ flexShrink: 0, minHeight: 42, maxWidth: { sm: 190 }, overflow: 'hidden' }}>
                  <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{imageFile?.name ?? 'Add cover image'}</Box>
                </Button>
                <input ref={fileInput} type="file" accept="image/*" hidden onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />
                <TextField size="small" fullWidth value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void addGame(); }} placeholder="Game title" inputProps={{ 'aria-label': 'Game title' }} />
                <Button variant="contained" onClick={() => void addGame()} disabled={!title.trim() || createGame.isPending} startIcon={createGame.isPending ? <CircularProgress size={15} color="inherit" /> : <Plus size={16} />} sx={{ minHeight: 42, flexShrink: 0 }}>Add game</Button>
              </Stack>
            </Box>

            <Collapse in={sharing}>
              <Box component="section" sx={{ p: 1.75, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <SectionHeading title="Share account" detail="Choose a friend and exactly what they can view." />
                <Stack spacing={1.25}>
                  <TextField select size="small" label="Friend" value={recipientId} onChange={(event) => setRecipientId(event.target.value)}>
                    {friends.length === 0 ? <MenuItem value="" disabled>No friends to share with yet</MenuItem> : <MenuItem value="">Choose a friend</MenuItem>}
                    {friends.map((friend) => <MenuItem key={friend.friendUid} value={friend.friendUid}>{friend.friendProfile?.displayName ?? friend.friendProfile?.username ?? 'Friend'}</MenuItem>)}
                  </TextField>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0, sm: 2 }}>
                    <FormControlLabel control={<Switch size="small" checked={canViewPassword} onChange={(event) => setCanViewPassword(event.target.checked)} />} label="Allow password access" />
                    <FormControlLabel control={<Switch size="small" checked={canViewOtp} onChange={(event) => setCanViewOtp(event.target.checked)} />} label="Allow OTP access" />
                  </Stack>
                </Stack>
              </Box>
            </Collapse>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Button color="error" size="small" startIcon={<Trash2 size={16} />} onClick={onDelete}>Delete</Button>
          <Stack direction="row" spacing={1}>
            {sharing ? <><Button size="small" onClick={() => setSharing(false)}>Cancel</Button><Button size="small" variant="contained" disabled={!recipientId || shareAccount.isPending} onClick={() => void share()}>{shareAccount.isPending ? 'Sharing…' : 'Share account'}</Button></> : <Button size="small" variant="outlined" startIcon={<Share2 size={16} />} onClick={() => setSharing(true)}>Share</Button>}
            <Button size="small" variant="contained" onClick={onClose}>Done</Button>
          </Stack>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function HeroChip({ label, icon, expired }: { label: string; icon?: React.ReactElement; expired?: boolean }) {
  return <Chip size="small" icon={icon} label={label} sx={{ height: 26, color: 'common.white', bgcolor: expired ? 'rgba(150,24,24,.78)' : 'rgba(0,0,0,.48)', '& .MuiChip-icon': { color: 'inherit', ml: .8 }, '& .MuiChip-label': { px: 1, fontSize: 11, fontWeight: 700 } }} />;
}

function SectionHeading({ id, title, detail }: { id?: string; title: string; detail: string }) {
  return <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'baseline' }} spacing={{ xs: .2, sm: 1 }} sx={{ mb: 1.25 }}>
    <Typography id={id} variant="subtitle2" sx={{ fontWeight: 800 }}>{title}</Typography>
    <Typography variant="caption" color="text.secondary">{detail}</Typography>
  </Stack>;
}

function Credential({ icon, label, value, secret, shown, copied, onReveal, onCopy }: { icon: React.ReactNode; label: string; value: string; secret?: boolean; shown?: boolean; copied: boolean; onReveal?: () => void; onCopy: () => void }) {
  return <Box sx={{ px: 1.25, py: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2, minWidth: 0 }}>
    <Stack direction="row" alignItems="center" spacing={.75} sx={{ minHeight: 28 }}>
      <Box sx={{ display: 'flex', color: 'text.secondary' }}>{icon}</Box>
      <Typography variant="caption" color="text.secondary" sx={{ flex: 1, fontWeight: 600 }}>{label}</Typography>
      {secret && <Button size="small" onClick={onReveal} sx={{ minWidth: 0, px: .5, py: 0, fontSize: 11 }}>{shown ? 'Hide' : 'Reveal'}</Button>}
      <IconButton size="small" aria-label={`Copy ${label}`} disabled={!value} onClick={onCopy} sx={{ p: .5 }}>{copied ? <Check size={15} /> : <Copy size={15} />}</IconButton>
    </Stack>
    <Typography variant="body2" title={secret && !shown ? undefined : value} sx={{ mt: .4, fontFamily: 'monospace', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {value ? secret && !shown ? '••••••••' : value : 'Not set'}
    </Typography>
  </Box>;
}

function GameRow({ game, onDelete, deleting }: { game: Game; onDelete: () => void; deleting: boolean }) {
  return <Stack direction="row" alignItems="center" spacing={1.25} sx={{ p: .9, minWidth: 0, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
    {game.imageUrl ? <Box component="img" src={game.imageUrl} alt="" sx={{ width: 38, height: 50, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} /> : <Avatar variant="rounded" sx={{ width: 38, height: 50, bgcolor: 'action.selected', flexShrink: 0 }}><Plus size={16} /></Avatar>}
    <Typography variant="body2" sx={{ flex: 1, minWidth: 0, fontWeight: 650 }} noWrap title={game.title}>{game.title}</Typography>
    <IconButton aria-label={`Remove ${game.title}`} size="small" disabled={deleting} onClick={onDelete}><Trash2 size={16} /></IconButton>
  </Stack>;
}

function copyValue(key: string, value: string, setCopied: (key: string | null) => void) {
  if (!value || !navigator.clipboard) return;
  void navigator.clipboard.writeText(value).then(() => {
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1400);
  }).catch(() => setCopied(null));
}
