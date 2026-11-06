/**
 * All Firestore document shapes for GameHub.
 *
 * Dates are stored as ISO 8601 strings (fitpal/kippa convention) to avoid the
 * Firestore Timestamp ↔ Date round-trip conversion issues.
 */

export type Platform = 'PlayStation' | 'Xbox' | 'PC';
export type AccountType = 'Primary' | 'Secondary' | 'Full';
export type LifecycleType = 'lifetime' | 'expires_on';

export interface Game {
  id: string;
  accountId: string;
  title: string;
  imageUrl?: string | null;
  providerId?: string | null;
  createdAt: string;
}

/** Form data for creating/editing a game (id/createdAt assigned by the lib). */
export interface GameFormData {
  title: string;
  imageUrl?: string | null;
  providerId?: string | null;
}

export interface Account {
  id: string;
  accountName: string;
  email: string;
  password?: string | null;
  otpSecret?: string | null;
  providerId?: string | null;
  accountType?: AccountType | null;
  platform: Platform;
  isPsPlus: boolean;
  lifecycleType: LifecycleType;
  expiresOn?: string | null;
  games?: Game[];
  createdAt: string;
  updatedAt: string;
}

export interface AccountFormData {
  accountName: string;
  email: string;
  password?: string | null;
  otpSecret?: string | null;
  providerId?: string | null;
  accountType?: AccountType | null;
  platform: Platform;
  isPsPlus: boolean;
  lifecycleType: LifecycleType;
  expiresOn?: string | null;
}

export interface Provider {
  id: string;
  userId?: string;
  name: string;
  website?: string | null;
  whatsapp?: string | null;
  messenger?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ProviderFormData {
  name: string;
  website?: string | null;
  whatsapp?: string | null;
  messenger?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  notes?: string | null;
  photo: File | null;
}
