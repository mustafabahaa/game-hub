import { useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, Box, Paper, Typography, Button, Stack, IconButton, Collapse, Skeleton, Menu, MenuItem, ListItemText, DestructiveListIcon, Avatar, Tooltip, Link as UiLink } from '@monochrome-ui/design-system';
import { ChevronDownIcon as ChevronDown, KeyIcon as KeyRound, ShieldCheckIcon as ShieldCheck, CalendarClockIcon as CalendarClock, InfinityIcon, EmailIcon as Mail, VisibilityIcon as Eye, VisibilityOffIcon as EyeOff, MoreVerticalIcon as MoreVertical, DeleteOutlineIcon as Trash2 } from '@/components/AppIcon';
import type { Account } from '@/domain/types';
import { GameCover } from '@/components/GameCover';
import { getLifecycleLabel, isAccountExpired } from '@/domain/lifecycle';
import { useAppContext } from '@/hooks/useAppContext';
import { useProviders } from '@/hooks/useGamehub';

interface AccountCardProps {
  account: Account;
  onDelete?: (account: Account) => void;
}

export function AccountCard({ account, onDelete }: AccountCardProps) {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const { data: providers = [] } = useProviders(user?.uid);
  const [expanded, setExpanded] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const infoId = useId();

  const games = account.games ?? [];
  const heroGame = games[0];
  const heroProvider = providers.find((provider) => provider.id === heroGame?.providerId);
  const expired = isAccountExpired(account);
  const email = account.email?.trim();
  const accountNotes = account.notes?.trim();
  const gameNotes = games.flatMap((game) => game.notes?.trim() ? [{ id: game.id, title: game.title, notes: game.notes }] : []);
  const hasInfo = Boolean(email || account.password || account.otpSecret || accountNotes || gameNotes.length);
  const metadata = [account.accountType, account.isPsPlus ? 'PS Plus' : null, games.length > 1 ? `${games.length} games` : null]
    .filter(Boolean).join(' · ');

  return (
    <Card sx={{ position: 'relative', minWidth: 0 }}>
      <UiLink component={Link} to={`/accounts/${account.id}`} aria-label={`Open ${account.accountName}`} underline="none"
        sx={{ display: 'block', mx: 1, mt: 1 }}>
        <GameCover game={heroGame} platform={account.platform} />
      </UiLink>
      {onDelete && <IconButton variant="overlayAction" aria-label={`Actions for ${account.accountName}`}
        aria-haspopup="menu" aria-expanded={Boolean(menuAnchor)} onClick={(event) => setMenuAnchor(event.currentTarget)}
        sx={{ top: 56, right: 16 }}>
        <MoreVertical size={17} />
      </IconButton>}
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack spacing={0.5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ minWidth: 0 }}>
            <Typography variant="itemTitle" component="div" role="heading" aria-level={2} sx={{ minWidth: 0 }}>{account.accountName}</Typography>
            {heroProvider && <Tooltip title={heroProvider.name}>
              <IconButton size="small" aria-label={`Open ${heroProvider.name} provider`}
                onClick={() => navigate(`/providers/${heroProvider.id}`)} sx={{ flexShrink: 0 }}>
                <Avatar src={heroProvider.photoUrl ?? undefined} alt="" sx={{ width: 24, height: 24 }}>
                  {heroProvider.name[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>}
          </Stack>
          {metadata && <Typography variant="caption" color="text.secondary">{metadata}</Typography>}
        </Stack>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          <MenuItem onClick={() => { setMenuAnchor(null); onDelete?.(account); }} color="error">
            <DestructiveListIcon><Trash2 size={17} /></DestructiveListIcon>
            <ListItemText>Delete account</ListItemText>
          </MenuItem>
        </Menu>
        {/* Lifecycle */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          {account.lifecycleType === 'lifetime' ? (
            <>
              <InfinityIcon size={13} />
              <Typography variant="caption">{getLifecycleLabel(account)}</Typography>
            </>
          ) : (
            <>
              <CalendarClock size={13} />
              <Typography variant={expired ? 'statusMetadataEmphasis' : 'statusMetadata'}>
                {getLifecycleLabel(account)}
              </Typography>
            </>
          )}
        </Stack>

        {hasInfo && <Box>
          <Button
            size="small" variant="outlined" fullWidth
            aria-expanded={expanded}
            aria-controls={infoId}
            onClick={() => {
              if (expanded) {
                setShowPass(false);
                setShowOtp(false);
              }
              setExpanded(!expanded);
            }}
            endIcon={<ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
          >
            Info
          </Button>
          <Collapse id={infoId} in={expanded}>
            <Stack spacing={1.5} sx={{ mt: 1.5 }}>
              {email && <CredField icon={<Mail size={13} />} label="Email" value={email} />}
              {account.password && <CredField
                icon={<KeyRound size={13} />} label="Password"
                value={account.password}
                masked={!showPass}
                onToggleMask={() => setShowPass((v) => !v)}
              />}
              {account.otpSecret && <CredField
                icon={<ShieldCheck size={13} />} label="OTP"
                value={account.otpSecret}
                masked={!showOtp}
                onToggleMask={() => setShowOtp((v) => !v)}
              />}
              {accountNotes && <NoteField label="Account notes" value={accountNotes} />}
              {gameNotes.map((game) => (
                <NoteField key={game.id} label={games.length > 1 ? `${game.title} notes` : 'Game notes'} value={game.notes} />
              ))}
            </Stack>
          </Collapse>
        </Box>}

      </CardContent>
    </Card>
  );
}

export function AccountCardSkeleton() {
  return (
    <Card aria-hidden="true">
      <Paper elevation={0} variant="mediaHero" sx={{ aspectRatio: '5 / 8', mx: 1, mt: 1, width: 'auto' }}>
        <Skeleton variant="mediaCover" animation="wave" />
      </Paper>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Skeleton variant="circular" animation="wave" width={14} height={14} />
          <Skeleton variant="text" animation="wave" width="48%" height={20} />
        </Stack>
        <Skeleton variant="mediaAction" animation="wave" width="100%" height={42} />
      </CardContent>
    </Card>
  );
}

function NoteField({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="bodyNote" sx={{ overflowWrap: 'anywhere' }}>{value}</Typography>
    </Stack>
  );
}

interface CredFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  masked?: boolean;
  onToggleMask?: () => void;
}

function CredField({ icon, label, value, masked, onToggleMask }: CredFieldProps) {
  const canToggle = Boolean(onToggleMask) && value !== '—' && !value.startsWith('Hidden');
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.25 }}>
        <Typography component="span" variant="caption" color="text.disabled" sx={{ display: 'flex' }}>{icon}</Typography>
        <Typography variant="caption" color="text.disabled">{label}</Typography>
        {canToggle && (
          <IconButton size="small" aria-label={`${masked ? 'Reveal' : 'Hide'} ${label}`} onClick={onToggleMask} variant="quietAction" sx={{ ml: 'auto' }}>
            {masked ? <EyeOff size={13} /> : <Eye size={13} />}
          </IconButton>
        )}
      </Stack>
      <Typography variant="monospaceValue">
        {masked ? '••••••••' : value}
      </Typography>
    </Box>
  );
}
