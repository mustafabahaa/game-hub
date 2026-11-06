import type { Provider } from '@/domain/types';

export type ProviderContactChannel = 'website' | 'whatsapp' | 'messenger' | 'instagram' | 'facebook';

export function getProviderContactHref(provider: Provider, channel: ProviderContactChannel): string | null {
  if (channel === 'whatsapp') return normalizeWhatsAppUrl(provider.whatsapp);
  if (channel === 'website') return normalizeExternalUrl(provider.website);
  if (channel === 'messenger') return normalizeExternalUrl(provider.messenger);
  if (channel === 'instagram') return normalizeExternalUrl(provider.instagram);
  return normalizeExternalUrl(provider.facebook);
}

export function normalizeExternalUrl(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) return null;
  return `https://${trimmed}`;
}

function normalizeWhatsAppUrl(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `20${digits.slice(1)}`;
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}
