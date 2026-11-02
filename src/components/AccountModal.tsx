import { useState } from 'react';
import {
  Dialog,
  Paper,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Switch,
  FormHelperText,
  Divider,
} from '@monochrome-ui/design-system';
import { GamepadIcon as Gamepad2 } from '@/components/AppIcon';
import { useAppContext } from '@/hooks/useAppContext';
import { useCreateAccount, useUpdateAccount } from '@/hooks/useGamehub';
import type { Account, AccountFormData, AccountType, LifecycleType, Platform } from '@/domain/types';

interface AccountModalProps {
  open: boolean;
  account?: Account;
  onClose: () => void;
}

const PLATFORMS: Platform[] = ['PlayStation', 'Xbox', 'PC'];
const ACCOUNT_TYPES: AccountType[] = ['Primary', 'Secondary', 'Full'];

export function AccountModal({ open, account, onClose }: AccountModalProps) {
  if (!open) return null;
  return <AccountModalContent key={account?.id ?? 'new-account'} account={account} onClose={onClose} />;
}

function AccountModalContent({ account, onClose }: Omit<AccountModalProps, 'open'>) {
  const { user } = useAppContext();
  const uid = user?.uid ?? '';
  const createAccount = useCreateAccount(uid);
  const updateAccount = useUpdateAccount(uid);

  const [form, setForm] = useState<AccountFormData>(() => account ? {
    accountName: account.accountName,
    email: account.email,
    password: account.password ?? '',
    otpSecret: account.otpSecret ?? '',
    providerId: account.providerId ?? '',
    accountType: account.accountType ?? null,
    platform: account.platform,
    isPsPlus: account.isPsPlus,
    lifecycleType: account.lifecycleType,
    expiresOn: account.expiresOn ?? '',
  } : emptyForm());

  const isEdit = Boolean(account);
  const saving = createAccount.isPending || updateAccount.isPending;

  const handleSubmit = async () => {
    const payload: AccountFormData = {
      ...form,
      password: form.password || null,
      otpSecret: form.otpSecret || null,
      providerId: form.providerId || null,
      expiresOn: form.lifecycleType === 'expires_on' ? form.expiresOn || null : null,
    };
    if (isEdit && account) {
      await updateAccount.mutateAsync({ id: account.id, form: payload });
    } else {
      await createAccount.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: 'calc(100dvh - 64px)' }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          <Paper elevation={0} variant="iconBadge">
            <Gamepad2 size={18} />
          </Paper>
          <Typography variant="dialogTitle">{isEdit ? 'Edit Account' : 'New Account'}</Typography>
        </DialogTitle>

        <DialogContent sx={{ minHeight: 0, flex: 1, overflowY: 'auto' }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Account Name"
              value={form.accountName}
              onChange={(e) => setForm({ ...form, accountName: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Password"
              type="text"
              value={form.password ?? ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              fullWidth
            />
            <TextField
              label="OTP Secret"
              value={form.otpSecret ?? ''}
              onChange={(e) => setForm({ ...form, otpSecret: e.target.value })}
              fullWidth
            />

            <Divider />

            {/* Platform */}
            <Box>
              <Typography variant="overline" sx={{ display: 'block', mb: 1 }}>Platform</Typography>
              <ToggleButtonGroup
                exclusive
                value={form.platform}
                onChange={(event, value) => { void event; if (value) setForm({ ...form, platform: value }); }}
                fullWidth
                size="small"
              >
                {PLATFORMS.map((p) => (
                  <ToggleButton key={p} value={p}>{p}</ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {/* Account type (PlayStation only) */}
            {form.platform === 'PlayStation' && (
              <Box>
                <Typography variant="overline" sx={{ display: 'block', mb: 1 }}>Account Type</Typography>
                <ToggleButtonGroup
                  exclusive
                  value={form.accountType ?? ''}
                  onChange={(event, value) => { void event; setForm({ ...form, accountType: (value as AccountType) || null }); }}
                  fullWidth
                  size="small"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <ToggleButton key={t} value={t}>{t}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, minHeight: 52 }}>
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Typography variant="settingLabel">PlayStation Plus</Typography>
                    <Typography variant="caption" color="text.secondary">
                      This account includes a PS Plus subscription
                    </Typography>
                  </Stack>
                  <Switch
                    checked={form.isPsPlus}
                    onChange={(e) => setForm({ ...form, isPsPlus: e.target.checked })}
                    slotProps={{ input: { 'aria-label': 'PlayStation Plus' } }}
                  />
                </Box>
              </Box>
            )}

            <Divider />

            {/* Lifecycle */}
            <Box>
              <Typography variant="overline" sx={{ display: 'block', mb: 1 }}>Access period</Typography>
              <ToggleButtonGroup
                exclusive
                value={form.lifecycleType}
                onChange={(event, value) => { void event; if (value) setForm({ ...form, lifecycleType: value as LifecycleType }); }}
                fullWidth
                size="small"
              >
                <ToggleButton value="lifetime">Lifetime</ToggleButton>
                <ToggleButton value="expires_on">Set expiry date</ToggleButton>
              </ToggleButtonGroup>
              <FormHelperText sx={{ ml: 0, mt: 1 }}>
                Choose Lifetime for ongoing access, or set a date to track when it expires.
              </FormHelperText>
              {form.lifecycleType === 'expires_on' && (
                <TextField
                  label="Expiry Date"
                  type="date"
                  required
                  value={form.expiresOn ?? ''}
                  onChange={(e) => setForm({ ...form, expiresOn: e.target.value })}
                  fullWidth
                  sx={{ mt: 2 }}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, flexShrink: 0 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={saving || !form.accountName || !form.email || (form.lifecycleType === 'expires_on' && !form.expiresOn)}
            loading={saving}
          >
            {isEdit ? 'Save Changes' : 'Add to Vault'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function emptyForm(): AccountFormData {
  return {
    accountName: '',
    email: '',
    password: '',
    otpSecret: '',
    providerId: '',
    accountType: null,
    platform: 'PlayStation',
    isPsPlus: false,
    lifecycleType: 'lifetime',
    expiresOn: '',
  };
}
