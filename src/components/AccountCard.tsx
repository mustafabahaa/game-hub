import { useState } from 'react';
import { Card, CardContent, CardMedia, Box, Paper, Typography, Chip, Button, Stack, IconButton, Collapse, Skeleton, Menu, MenuItem, ListItemText, DestructiveListIcon } from '@monochrome-ui/design-system';
import { ChevronDownIcon as ChevronDown, KeyIcon as KeyRound, ShieldCheckIcon as ShieldCheck, CalendarClockIcon as CalendarClock, InfinityIcon, EmailIcon as Mail, VisibilityIcon as Eye, VisibilityOffIcon as EyeOff, StarIcon as Star, MoreVerticalIcon as MoreVertical, DeleteOutlineIcon as Trash2 } from '@/components/AppIcon';
import type { Account } from '@/domain/types';
import { getLifecycleLabel, isAccountExpired } from '@/domain/lifecycle';

/**
 * AccountCard — follows the design-craft card anatomy.
 *
 * Game covers are PORTRAIT (3:4 box art). The card treats the first game's
 * cover as a full-bleed portrait hero (like a game library shelf tile), with
 * account name + platform overlaid on a gradient scrim. Below: lifecycle meta
 * + credentials drawer. This gives covers the vertical space they need.
 *
 * Tier 1 — HERO: full-bleed portrait cover + overlaid identity
 * Tier 2 — META: lifecycle, game count
 * Tier 3 — ACTION: credentials drawer
 */
interface AccountCardProps {
  account: Account;
  onDelete?: (account: Account) => void;
}

export function AccountCard({ account, onDelete }: AccountCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const games = account.games ?? [];
  const heroGame = games[0];
  const expired = isAccountExpired(account);

  return (
    <Card sx={{ cursor: 'pointer' }}>
      {/* ── Tier 1: Hero cover (portrait 3:4 — game box art ratio) ── */}
      <Paper elevation={0} variant="mediaHero">
        {heroGame?.imageUrl ? (
          <CardMedia component="img" image={heroGame.imageUrl} alt={heroGame.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <Typography variant="caption" color="text.disabled">No cover</Typography>
          </Box>
        )}

        {/* Top overlay: platform + PS+ badges */}
        <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 8, left: 8, right: 8, justifyContent: 'space-between' }}>
          <Chip
            label={account.platform}
            size="small"
            variant="overlayBadge"
          />
          {account.isPsPlus && (
            <Chip
              icon={<Star size={10} />}
              label="PS+"
              size="small"
              variant="quietBadge"
            />
          )}
        </Stack>

        {onDelete && (
          <IconButton
            aria-label={`Actions for ${account.accountName}`}
            onClick={(event) => { event.stopPropagation(); setMenuAnchor(event.currentTarget); }}
            variant="overlayAction"
          >
            <MoreVertical size={18} />
          </IconButton>
        )}

        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} onClick={(event) => event.stopPropagation()}>
          <MenuItem onClick={() => { setMenuAnchor(null); onDelete?.(account); }} color="error">
            <DestructiveListIcon><Trash2 size={17} /></DestructiveListIcon>
            <ListItemText>Delete account</ListItemText>
          </MenuItem>
        </Menu>

        {/* Bottom overlay: account name on gradient scrim */}
        <Paper elevation={0} variant="mediaScrim">
          <Typography variant="heroTitle" noWrap title={account.accountName}>
            {account.accountName}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
            {account.accountType && (
              <Typography variant="heroMetadata">
                {account.accountType}
              </Typography>
            )}
            {games.length > 1 && (
              <Typography variant="heroMetadata">
                · {games.length} games
              </Typography>
            )}
          </Stack>
        </Paper>
      </Paper>

      {/* ── Tier 2 + 3: Meta + Actions ── */}
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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

        {/* Credentials drawer */}
        <Box>
          <Button
            fullWidth size="small" variant="outlined"
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            endIcon={<ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
          >
            Credentials
          </Button>
          <Collapse in={expanded}>
            <Stack spacing={1.5} sx={{ mt: 1.5 }}>
              <CredField icon={<Mail size={13} />} label="Email" value={account.email} />
              <CredField
                icon={<KeyRound size={13} />} label="Password"
                value={account.password ?? '—'}
                masked={!showPass && Boolean(account.password)}
                onToggleMask={() => setShowPass((v) => !v)}
              />
              <CredField
                icon={<ShieldCheck size={13} />} label="OTP"
                value={account.otpSecret ?? '—'}
                masked={!showOtp && Boolean(account.otpSecret)}
                onToggleMask={() => setShowOtp((v) => !v)}
              />
            </Stack>
          </Collapse>
        </Box>

      </CardContent>
    </Card>
  );
}

export function AccountCardSkeleton() {
  return (
    <Card aria-hidden="true" sx={{ height: '100%' }}>
        <Paper elevation={0} variant="mediaHero">
        <Skeleton variant="mediaCover" animation="wave" />
        <Stack direction="row" justifyContent="space-between" sx={{ position: 'absolute', top: 10, left: 10, right: 10 }}>
          <Skeleton variant="mediaBadge" animation="wave" width={76} height={24} />
          <Skeleton variant="circular" animation="wave" width={30} height={30} />
        </Stack>
        <Paper elevation={0} variant="mediaScrim" sx={{ pt: 4, pb: 1.25 }}>
          <Skeleton variant="mediaTitle" animation="wave" width="76%" height={24} />
          <Skeleton variant="mediaMetadata" animation="wave" width="42%" height={16} />
        </Paper>
        </Paper>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Skeleton variant="circular" animation="wave" width={14} height={14} />
          <Skeleton variant="text" animation="wave" width="48%" height={20} />
        </Stack>
        <Skeleton variant="mediaAction" animation="wave" width="100%" height={42} />
      </CardContent>
    </Card>
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
          <IconButton size="small" onClick={onToggleMask} variant="quietAction" sx={{ ml: 'auto' }}>
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
