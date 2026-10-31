import type { Account } from './types';

/** Treat a date-only expiry as valid through that local calendar day. */
export function isExpiredOnDate(expiresOn: string | null | undefined, now = new Date()): boolean {
  if (!expiresOn) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expiresOn);
  if (!match) return false;
  const [, year, month, day] = match;
  const expiry = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(expiry.getTime()) || expiry.getFullYear() !== Number(year) || expiry.getMonth() !== Number(month) - 1 || expiry.getDate() !== Number(day)) return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return expiry < today;
}

export function formatExpiryDate(expiresOn: string): string {
  const [year, month, day] = expiresOn.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function getLifecycleLabel(account: Pick<Account, 'lifecycleType' | 'expiresOn'>, now = new Date()): string {
  if (account.lifecycleType === 'lifetime' || !account.expiresOn) return 'Lifetime access';
  const date = formatExpiryDate(account.expiresOn);
  return isExpiredOnDate(account.expiresOn, now) ? `Expired · ${date}` : `Expires ${date}`;
}

export function isAccountExpired(account: Pick<Account, 'lifecycleType' | 'expiresOn'>, now = new Date()): boolean {
  return account.lifecycleType === 'expires_on' && isExpiredOnDate(account.expiresOn, now);
}
