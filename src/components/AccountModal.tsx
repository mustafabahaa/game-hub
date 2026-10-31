import { useEffect, useState } from 'react';
import {
  Dialog,
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
  CircularProgress,
} from '@mui/material';
import { Gamepad2 } from 'lucide-react';
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
  const { user } = useAppContext();
  const uid = user?.uid ?? '';
  const createAccount = useCreateAccount(uid);
  const updateAccount = useUpdateAccount(uid);

  const [form, setForm] = useState<AccountFormData>(emptyForm());

  useEffect(() => {
    if (open) {
      setForm(
        account
          ? {
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
            }
          : emptyForm(),
      );
    }
  }, [open, account]);

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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: 2, display: 'grid', placeItems: 'center',
              bgcolor: 'action.selected',
              color: 'text.primary',
            }}
          >
            <Gamepad2 size={18} color="currentColor" />
          </Box>
          {isEdit ? 'Edit Account' : 'New Account'}
        </DialogTitle>

        <DialogContent>
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
                onChange={(_, v) => v && setForm({ ...form, platform: v })}
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
                  onChange={(_, v) => setForm({ ...form, accountType: (v as AccountType) || null })}
                  fullWidth
                  size="small"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <ToggleButton key={t} value={t}>{t}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, minHeight: 52 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>PlayStation Plus</Typography>
                    <Typography variant="caption" color="text.secondary">This account includes a PS Plus subscription</Typography>
                  </Box>
                  <Switch
                    checked={form.isPsPlus}
                    onChange={(e) => setForm({ ...form, isPsPlus: e.target.checked })}
                    inputProps={{ 'aria-label': 'PlayStation Plus' }}
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
                onChange={(_, v) => v && setForm({ ...form, lifecycleType: v as LifecycleType })}
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
                  InputLabelProps={{ shrink: true }}
                />
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={saving || !form.accountName || !form.email || (form.lifecycleType === 'expires_on' && !form.expiresOn)}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
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
