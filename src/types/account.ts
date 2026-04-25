export type AccountType = "Primary" | "Secondary" | "Full";

export interface Account {
  id: string;
  gameTitle: string;
  imageUrl: string;
  email: string;
  password?: string;
  otpSecret?: string;
  providerId?: string;
  accountType: AccountType;
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
  accountType: AccountType;
  isPsPlus: boolean;
  imageFile: File | null;
  imageUrl?: string;
}
