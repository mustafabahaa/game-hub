/**
 * All Firestore document shapes for GameHub.
 *
 * Dates are stored as ISO 8601 strings (fitpal/kippa convention) to avoid the
 * Firestore Timestamp ↔ Date round-trip conversion issues.
 */

export type Platform = 'PlayStation' | 'Xbox' | 'PC';
export type AccountType = 'Primary' | 'Secondary' | 'Full';
export type LifecycleType = 'lifetime' | 'expires_on';
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'canceled';

export interface Game {
  id: string;
  accountId: string;
  title: string;
  imageUrl?: string | null;
  createdAt: string;
}

/** Form data for creating/editing a game (id/createdAt assigned by the lib). */
export interface GameFormData {
  title: string;
  imageUrl?: string | null;
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
  // Present on shared-account views (recipient-side denormalized fields).
  canViewPassword?: boolean;
  canViewOtp?: boolean;
  sharedByName?: string | null;
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
  facebook?: string | null;
  instagram?: string | null;
  notes?: string | null;
  photo: File | null;
}

export interface ProviderRating {
  id: string;
  providerId: string;
  userId: string;
  rating: number;
  review?: string | null;
  createdAt: string;
}

export interface ReputationPost {
  id: string;
  providerId: string;
  userId: string;
  title: string;
  body?: string | null;
  proofLink?: string | null;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt?: string;
}

/** Firestore doc shape for `friendships/{uid}/friends/{friendUid}`. */
export interface FriendshipDoc {
  friendUid: string;
  createdAt: string;
}

export interface Friendship {
  friendUid: string;
  friendProfile?: UserProfile;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  respondedAt?: string | null;
  createdAt: string;
}

/**
 * Denormalized shared account. The owner writes a snapshot (account fields +
 * games + permission flags) so the recipient can read it directly — Firestore
 * has no joins, and the owner's private `users/{uid}/...` docs are unreadable
 * by the recipient by rule.
 */
export interface SharedAccountDoc {
  id: string;
  ownerId: string;
  recipientId: string;
  account: {
    accountName: string;
    email: string;
    platform: Platform;
    isPsPlus: boolean;
    /** Present only when the owner granted password view permission. */
    password?: string | null;
    /** Present only when the owner granted OTP view permission. */
    otpSecret?: string | null;
  };
  games: { id: string; title: string; imageUrl?: string | null }[];
  canViewPassword: boolean;
  canViewOtp: boolean;
  createdAt: string;
}

/**
 * Public game feed doc (`publicGames/{gameId}`). Replaces the Supabase
 * `public_user_games` view. Denormalized at write time.
 */
export interface PublicGameDoc {
  gameId: string;
  title: string;
  imageUrl?: string | null;
  platform: Platform;
  ownerUid: string;
  ownerUsername: string;
  ownerDisplayName: string | null;
  ownerAvatarUrl: string | null;
  ownerBio: string | null;
  createdAt: string;
}

export interface CommunityProfile {
  ownerUid: string;
  ownerUsername: string;
  ownerDisplayName: string | null;
  ownerAvatarUrl: string | null;
  ownerBio: string | null;
  games: PublicGameDoc[];
  hasMoreGames: boolean;
}
