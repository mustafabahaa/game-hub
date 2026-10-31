import { useState } from 'react';
import { Card, CardContent, CardMedia, Box, Typography, Chip, Button, Stack, IconButton, Collapse, Skeleton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { ChevronDown, KeyRound, ShieldCheck, CalendarClock, Infinity as InfinityIcon, Mail, Eye, EyeOff, Star, MoreVertical, Trash2 } from 'lucide-react';
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
    <Card sx={{ width: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
      {/* ── Tier 1: Hero cover (portrait 3:4 — game box art ratio) ── */}
      <Box sx={{ position: 'relative', width: '100%', aspectRatio: '3 / 4', minHeight: 0, flexShrink: 0, overflow: 'hidden', bgcolor: 'action.hover' }}>
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
            sx={{
              height: 22, fontSize: 10, fontWeight: 700,
              bgcolor: 'rgba(13,13,13,0.68)',
              color: 'common.white',
              backdropFilter: 'blur(4px)',
            }}
          />
          {account.isPsPlus && (
            <Chip
              icon={<Star size={10} />}
              label="PS+"
              size="small"
              sx={{
                height: 22, fontSize: 10, fontWeight: 700,
              bgcolor: 'background.paper', color: 'text.primary', border: '1px solid', borderColor: 'divider',
              '& .MuiChip-icon': { color: 'text.secondary' },
              }}
            />
          )}
        </Stack>

        {onDelete && (
          <IconButton
            aria-label={`Actions for ${account.accountName}`}
            onClick={(event) => { event.stopPropagation(); setMenuAnchor(event.currentTarget); }}
            sx={{ position: 'absolute', top: 40, right: 8, width: 34, height: 34, color: 'common.white', bgcolor: 'rgba(13,13,13,0.68)', backdropFilter: 'blur(4px)', '&:hover': { bgcolor: 'rgba(13,13,13,0.84)' } }}
          >
            <MoreVertical size={18} />
          </IconButton>
        )}

        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} onClick={(event) => event.stopPropagation()}>
          <MenuItem onClick={() => { setMenuAnchor(null); onDelete?.(account); }} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'inherit' }}><Trash2 size={17} /></ListItemIcon>
            <ListItemText>Delete account</ListItemText>
          </MenuItem>
        </Menu>

        {/* Bottom overlay: account name on gradient scrim */}
        <Box sx={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
          px: 1.5, pt: 3, pb: 1,
        }}>
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: 'common.white', lineHeight: 1.25 }} noWrap title={account.accountName}>
            {account.accountName}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
            {account.accountType && (
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                {account.accountType}
              </Typography>
            )}
            {games.length > 1 && (
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                · {games.length} games
              </Typography>
            )}
          </Stack>
        </Box>
      </Box>

      {/* ── Tier 2 + 3: Meta + Actions ── */}
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Lifecycle */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          {account.lifecycleType === 'lifetime' ? (
            <>
              <InfinityIcon size={13} color="currentColor" />
              <Typography variant="caption">{getLifecycleLabel(account)}</Typography>
            </>
          ) : (
            <>
              <CalendarClock size={13} color="currentColor" />
              <Typography variant="caption" sx={{ color: expired ? 'error.main' : 'text.secondary', fontWeight: 600 }}>
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
      <Box sx={{ position: 'relative', width: '100%', aspectRatio: '3 / 4', overflow: 'hidden', bgcolor: 'action.hover' }}>
        <Skeleton variant="rectangular" animation="wave" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'none', bgcolor: 'action.selected' }} />
        <Stack direction="row" justifyContent="space-between" sx={{ position: 'absolute', top: 10, left: 10, right: 10 }}>
          <Skeleton variant="rounded" animation="wave" width={76} height={24} sx={{ borderRadius: 999 }} />
          <Skeleton variant="circular" animation="wave" width={30} height={30} />
        </Stack>
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, px: 1.5, pt: 4, pb: 1.25, background: 'linear-gradient(to top, rgba(0,0,0,0.72), transparent)' }}>
          <Skeleton variant="text" animation="wave" width="76%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.22)' }} />
          <Skeleton variant="text" animation="wave" width="42%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.16)' }} />
        </Box>
      </Box>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Skeleton variant="circular" animation="wave" width={14} height={14} />
          <Skeleton variant="text" animation="wave" width="48%" height={20} />
        </Stack>
        <Skeleton variant="rounded" animation="wave" width="100%" height={42} sx={{ borderRadius: 999 }} />
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
        <Box sx={{ color: 'text.disabled', display: 'flex' }}>{icon}</Box>
        <Typography variant="caption" color="text.disabled">{label}</Typography>
        {canToggle && (
          <IconButton size="small" onClick={onToggleMask} sx={{ ml: 'auto', p: 0.25, color: 'text.secondary' }}>
            {masked ? <EyeOff size={13} /> : <Eye size={13} />}
          </IconButton>
        )}
      </Stack>
      <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: 600, color: 'text.primary' }}>
        {masked ? '••••••••' : value}
      </Typography>
    </Box>
  );
}
