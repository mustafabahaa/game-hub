export type AccountType = "Primary" | "Secondary" | "Full";
export type Platform = "PlayStation" | "Xbox" | "PC";
export type LifecycleType = "lifetime" | "expires_on";

export interface Game {
  id: string;
  accountId: string;
  title: string;
  imageUrl: string;
  createdAt: number;
}

export interface Account {
  id: string;
  accountName: string;
  email: string;
  password?: string;
  otpSecret?: string;
  providerId?: string;
  accountType?: AccountType;
  platform: Platform;
  isPsPlus: boolean;
  lifecycleType: LifecycleType;
  expiresOn?: string;
  games?: Game[];
  createdAt: number;
  updatedAt: number;
}

export interface AccountFormData {
  accountName: string;
  email: string;
  password: string;
  otpSecret: string;
  providerId: string;
  accountType?: AccountType;
  platform: Platform;
  isPsPlus: boolean;
  lifecycleType: LifecycleType;
  expiresOn: string;
}

export interface GameFormData {
  title: string;
  imageFile: File | null;
  imageUrl?: string;
}
