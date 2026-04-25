export interface Provider {
  id: string;
  name: string;
  website?: string;
  whatsapp?: string;
  facebook?: string;
  createdAt: number;
}

export interface ProviderFormData {
  name: string;
  website: string;
  whatsapp: string;
  facebook: string;
}
