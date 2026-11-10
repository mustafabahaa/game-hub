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
import type { Account, AccountFormData, AccountType, Platform } from '@/domain/types';

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
    notes: account.notes ?? '',
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
      email: form.email?.trim() || null,
      notes: form.notes?.trim() || null,
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
              label="Notes"
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Email"
              type="email"
              value={form.email ?? ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              fullWidth
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
              <ResponsiveToggleButtonGroup
                ariaLabel="Platform"
                value={form.platform}
                options={PLATFORMS.map((platform) => ({ value: platform, label: platform }))}
                onChange={(value) => {
                  if (value) setForm({ ...form, platform: value });
                }}
              />
            </Box>

            {/* Account type (PlayStation only) */}
            {form.platform === 'PlayStation' && (
              <Box>
                <Typography variant="overline" sx={{ display: 'block', mb: 1 }}>Account Type</Typography>
                <ResponsiveToggleButtonGroup
                  ariaLabel="Account type"
                  value={form.accountType ?? ''}
                  options={ACCOUNT_TYPES.map((accountType) => ({ value: accountType, label: accountType }))}
                  onChange={(value) => setForm({ ...form, accountType: value })}
                />
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
              <ResponsiveToggleButtonGroup
                ariaLabel="Access period"
                value={form.lifecycleType}
                options={[
                  { value: 'lifetime' as const, label: 'Lifetime' },
                  { value: 'expires_on' as const, label: 'Set expiry date' },
                ]}
                onChange={(value) => {
                  if (value) setForm({ ...form, lifecycleType: value });
                }}
              />
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

        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, flexShrink: 0 }}>
          <Stack
            direction={{ xs: 'column-reverse', sm: 'row' }}
            spacing={1}
            sx={{ width: '100%', justifyContent: 'flex-end' }}
          >
            <Button onClick={onClose} variant="outlined" sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={saving || !form.accountName.trim() || Boolean(form.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) || (form.lifecycleType === 'expires_on' && !form.expiresOn)}
              loading={saving}
              sx={{ width: { xs: '100%', sm: 'auto' }, whiteSpace: 'nowrap' }}
            >
              {isEdit ? 'Save Changes' : 'Add to Vault'}
            </Button>
          </Stack>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function emptyForm(): AccountFormData {
  return {
    accountName: '',
    email: '',
    notes: '',
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

type ResponsiveChoice<T extends string> = {
  value: T;
  label: string;
};

interface ResponsiveToggleButtonGroupProps<T extends string> {
  ariaLabel: string;
  value: T | '' | null;
  options: ResponsiveChoice<T>[];
  onChange: (value: T | null) => void;
}

function ResponsiveToggleButtonGroup<T extends string>({
  ariaLabel,
  value,
  options,
  onChange,
}: ResponsiveToggleButtonGroupProps<T>) {
  const renderGroup = (orientation: 'horizontal' | 'vertical') => (
    <ToggleButtonGroup
      aria-label={ariaLabel}
      exclusive
      orientation={orientation}
      value={value}
      onChange={(event, nextValue) => {
        void event;
        onChange(nextValue as T | null);
      }}
      fullWidth
      size="small"
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );

  return (
    <>
      <Box sx={{ display: { xs: 'block', sm: 'none' }, width: '100%' }}>{renderGroup('vertical')}</Box>
      <Box sx={{ display: { xs: 'none', sm: 'block' }, width: '100%' }}>{renderGroup('horizontal')}</Box>
    </>
  );
}
