import { useRef, useState } from 'react';
import {
  Dialog,
  Paper,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Stack,
  InputAdornment,
  Divider,
} from '@monochrome-ui/design-system';
import { ShopIcon as Store, ImportIcon as Upload, MessageCircleIcon as MessageCircle, MessengerIcon, GlobeIcon as Globe, CameraIcon as Camera, LinkIcon } from '@/components/AppIcon';
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
  if (!open) return null;
  return <ProviderModalContent key={provider?.id ?? 'new-provider'} provider={provider} onClose={onClose} />;
}

function ProviderModalContent({ provider, onClose }: Omit<ProviderModalProps, 'open'>) {
  const { user } = useAppContext();
  const uid = user?.uid ?? '';
  const createProvider = useCreateProvider(uid);
  const updateProvider = useUpdateProvider(uid);

  const [form, setForm] = useState<ProviderFormData>(() => provider ? {
    name: provider.name,
    website: provider.website ?? '',
    whatsapp: provider.whatsapp ?? '',
    messenger: provider.messenger ?? '',
    facebook: provider.facebook ?? '',
    instagram: provider.instagram ?? '',
    notes: provider.notes ?? '',
    photo: null,
  } : emptyForm());
  const [preview, setPreview] = useState<string | null>(provider?.photoUrl ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <Box>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Paper elevation={0} variant="iconBadge">
            <Store size={18} />
          </Paper>
          <Typography variant="dialogTitle">{isEdit ? 'Edit Provider' : 'New Provider'}</Typography>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Paper elevation={0} variant="imagePicker" onClick={() => fileRef.current?.click()} sx={{ cursor: 'pointer' }}>
                {preview ? <Box component="img" src={preview} alt="Provider photo preview" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Store size={24} />}
              </Paper>
              <Box>
                <Typography variant="sectionTitle">Provider photo</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: .75 }}>Optional. Square images work best.</Typography>
                <Button size="small" onClick={() => fileRef.current?.click()} startIcon={<Upload size={14} />} sx={{ px: 0 }}>Choose image</Button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
              </Box>
            </Stack>

            <TextField label="Provider name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required autoFocus />

            <Divider />
            <Box>
              <Typography variant="sectionTitle" sx={{ mb: 1.5 }}>Contact details</Typography>
              <Stack spacing={1.5}>
                <TextField label="Website" value={form.website ?? ''} onChange={(e) => setForm({ ...form, website: e.target.value })} fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start"><Globe size={16} /></InputAdornment> } }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  <TextField label="WhatsApp" value={form.whatsapp ?? ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start"><MessageCircle size={16} /></InputAdornment> } }} />
                  <TextField label="Messenger URL" value={form.messenger ?? ''} onChange={(e) => setForm({ ...form, messenger: e.target.value })} fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start"><MessengerIcon size={16} /></InputAdornment> } }} />
                  <TextField label="Facebook" value={form.facebook ?? ''} onChange={(e) => setForm({ ...form, facebook: e.target.value })} fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start"><LinkIcon size={16} /></InputAdornment> } }} />
                  <TextField label="Instagram" value={form.instagram ?? ''} onChange={(e) => setForm({ ...form, instagram: e.target.value })} fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start"><Camera size={16} /></InputAdornment> } }} />
                </Box>
              </Stack>
            </Box>
            <Divider />
            <Box>
              <Typography variant="sectionTitle" sx={{ mb: 1.5 }}>Notes</Typography>
              <TextField label="Notes about this provider" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} fullWidth multiline minRows={2} />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!form.name} loading={saving}>
            {isEdit ? 'Save Changes' : 'Add Provider'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function emptyForm(): ProviderFormData {
  return { name: '', website: '', whatsapp: '', messenger: '', facebook: '', instagram: '', notes: '', photo: null };
}
