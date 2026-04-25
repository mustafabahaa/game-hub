export type AccountType = "Primary" | "Secondary" | "Full";
export type Platform = "PlayStation" | "Xbox" | "PC";

export interface Account {
  id: string;
  gameTitle: string;
  imageUrl: string;
  email: string;
  password?: string;
  otpSecret?: string;
  providerId?: string;
  accountType?: AccountType;
  platform: Platform;
  isPsPlus: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AccountFormData {
  gameTitle: string;
  email: string;
  password: string;
  otpSecret: string;
  providerId: string;
  accountType?: AccountType;
  platform: Platform;
  isPsPlus: boolean;
  imageFile: File | null;
  imageUrl?: string;
}
