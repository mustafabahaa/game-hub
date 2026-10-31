import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Stack,
  CircularProgress,
  InputAdornment,
  Divider,
} from '@mui/material';
import { Store, Upload, MessageCircle, Globe, Camera, Link as LinkIcon } from 'lucide-react';
import { useAppContext } from '@/hooks/useAppContext';
import { useCreateProvider, useUpdateProvider } from '@/hooks/useGamehub';
import type { Provider, ProviderFormData } from '@/domain/types';
import { optimizeImageForUpload } from '@/libs/storage';

interface ProviderModalProps {
  open: boolean;
  provider?: Provider;
  onClose: () => void;
}

export function ProviderModal({ open, provider, onClose }: ProviderModalProps) {
  const { user } = useAppContext();
  const uid = user?.uid ?? '';
  const createProvider = useCreateProvider(uid);
  const updateProvider = useUpdateProvider(uid);

  const [form, setForm] = useState<ProviderFormData>(emptyForm());
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(
        provider
          ? {
              name: provider.name,
              website: provider.website ?? '',
              whatsapp: provider.whatsapp ?? '',
              facebook: provider.facebook ?? '',
              instagram: provider.instagram ?? '',
              notes: provider.notes ?? '',
              photo: null,
            }
          : emptyForm(),
      );
      setPreview(provider?.photoUrl ?? null);
    }
  }, [open, provider]);

  const isEdit = Boolean(provider);
  const saving = createProvider.isPending || updateProvider.isPending;

  const handleFile = async (file: File | null) => {
    setForm((f) => ({ ...f, photo: file }));
    if (file) {
      const opt = await optimizeImageForUpload(file);
      setPreview(opt?.previewUrl ?? URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (isEdit && provider) {
      await updateProvider.mutateAsync({ id: provider.id, form, existing: provider });
    } else {
      await createProvider.mutateAsync(form);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'action.selected', color: 'text.primary' }}>
            <Store size={18} color="currentColor" />
          </Box>
          {isEdit ? 'Edit Provider' : 'New Provider'}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box onClick={() => fileRef.current?.click()} sx={{ width: 76, height: 76, borderRadius: 2.5, flexShrink: 0, overflow: 'hidden', display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: 'text.secondary', cursor: 'pointer' }}>
                {preview ? <Box component="img" src={preview} alt="Provider photo preview" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Store size={24} />}
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 650 }}>Provider photo</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: .75 }}>Optional. Square images work best.</Typography>
                <Button size="small" onClick={() => fileRef.current?.click()} startIcon={<Upload size={14} />} sx={{ px: 0 }}>Choose image</Button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
              </Box>
            </Stack>

            <TextField label="Provider name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required autoFocus />

            <Divider />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 650, mb: 1.5 }}>Contact details</Typography>
              <Stack spacing={1.5}>
                <TextField label="Website" value={form.website ?? ''} onChange={(e) => setForm({ ...form, website: e.target.value })} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Globe size={16} /></InputAdornment> }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  <TextField label="WhatsApp" value={form.whatsapp ?? ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><MessageCircle size={16} /></InputAdornment> }} />
                  <TextField label="Facebook" value={form.facebook ?? ''} onChange={(e) => setForm({ ...form, facebook: e.target.value })} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><LinkIcon size={16} /></InputAdornment> }} />
                  <TextField label="Instagram" value={form.instagram ?? ''} onChange={(e) => setForm({ ...form, instagram: e.target.value })} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Camera size={16} /></InputAdornment> }} />
                </Box>
              </Stack>
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 650, mb: 1.5 }}>Notes</Typography>
              <TextField label="Notes about this provider" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} fullWidth multiline minRows={2} />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving || !form.name} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
            {isEdit ? 'Save Changes' : 'Add Provider'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function emptyForm(): ProviderFormData {
  return { name: '', website: '', whatsapp: '', facebook: '', instagram: '', notes: '', photo: null };
}
