import type { Account, AccountInfoField } from './types';

const sensitiveLabel = /(password|passcode|otp|secret|token|recovery code|backup code)/i;

export function isSensitiveAccountInfoLabel(label: string): boolean {
  return sensitiveLabel.test(label);
}

/** Read extensible fields while keeping older account documents visible. */
export function getAccountInfoFields(account: Account): AccountInfoField[] {
  const fields: AccountInfoField[] = (account.infoFields ?? []).map((field) => ({
    ...field,
    secret: Boolean(field.secret) || isSensitiveAccountInfoLabel(field.label),
  }));
  const known = new Set(fields.map((field) => field.id));
  const legacy: AccountInfoField[] = [
    { id: 'legacy-email', label: 'Email', value: account.email ?? '' },
    { id: 'legacy-password', label: 'Password', value: account.password ?? '', secret: true },
    { id: 'legacy-otp', label: 'OTP secret', value: account.otpSecret ?? '', secret: true },
    { id: 'legacy-notes', label: 'Notes', value: account.notes ?? '' },
  ];
  for (const field of legacy) {
    if (field.value.trim() && !known.has(field.id)) fields.push(field);
  }
  return fields;
}

export function cleanAccountInfoFields(fields: AccountInfoField[]): AccountInfoField[] {
  return fields
    .map((field) => ({ ...field, label: field.label.trim(), value: field.value.trim(), secret: Boolean(field.secret) || isSensitiveAccountInfoLabel(field.label) }))
    .filter((field) => field.label && field.value);
}
