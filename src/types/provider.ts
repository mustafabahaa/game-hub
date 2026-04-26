export interface Provider {
  id: string;
  userId?: string;
  name: string;
  website?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  notes?: string;
  photoUrl?: string;
  createdAt: number;
}

export interface ProviderFormData {
  name: string;
  website: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  notes: string;
  photo: File | null;
}
