import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar, Box, Button, CircularProgress, Divider, Paper, Stack, Typography } from '@monochrome-ui/design-system';
import { ArrowLeftIcon as ArrowLeft, EditIcon as Edit, ExternalLinkIcon as ExternalLink, LinkIcon, MessageCircleIcon as MessageCircle, DeleteOutlineIcon as Trash2 } from '@/components/AppIcon';
import { useAppContext } from '@/hooks/useAppContext';
import { useDeleteProvider, useProvider } from '@/hooks/useGamehub';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ProviderModal } from '@/components/ProviderModal';

export function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppContext();
  const { data: provider, isLoading } = useProvider(user?.uid, id);
  const deleteProvider = useDeleteProvider(user?.uid ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}><CircularProgress /></Box>;

  if (!provider) return (
    <Box sx={{ py: 4 }}>
      <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate('/providers')}>Back to providers</Button>
      <Typography variant="h2" sx={{ mt: 3 }}>Provider not found</Typography>
    </Box>
  );

  const isOwner = provider.userId === user?.uid;

  return (
    <Box sx={{ width: '100%' }}>
      <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate('/providers')} sx={{ mb: 3, px: 0 }}>Back to providers</Button>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 4 }}>
        {provider.photoUrl
          ? <Paper component="img" variant="mediaSurface" src={provider.photoUrl} alt={`${provider.name} logo`} sx={{ width: { xs: 104, sm: 136 }, height: { xs: 104, sm: 136 }, objectFit: 'contain', p: 1.5, boxSizing: 'border-box', flexShrink: 0 }} />
          : <Avatar variant="mediaFallbackLarge">{provider.name[0]?.toUpperCase()}</Avatar>}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="pageHeading">{provider.name}</Typography>
          {provider.website && <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{provider.website.replace(/^https?:\/\//, '')}</Typography>}
        </Box>
        {isOwner && <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Edit size={17} />} onClick={() => setEditOpen(true)}>Edit provider</Button>
          <Button color="error" variant="outlined" startIcon={<Trash2 size={17} />} onClick={() => setConfirmDelete(true)}>Delete provider</Button>
        </Stack>}
      </Stack>

      <Divider />
      <Box component="section" sx={{ py: 3 }}>
        <Typography variant="sectionHeading" sx={{ mb: 1 }}>Contact</Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {provider.website && <Button component="a" href={provider.website} target="_blank" rel="noreferrer" startIcon={<ExternalLink size={17} />}>Website</Button>}
          {provider.facebook && <Button component="a" href={provider.facebook} target="_blank" rel="noreferrer" startIcon={<LinkIcon size={17} />}>Facebook</Button>}
          {provider.instagram && <Button component="a" href={provider.instagram} target="_blank" rel="noreferrer" startIcon={<LinkIcon size={17} />}>Instagram</Button>}
          {provider.whatsapp && <Button component="a" href={`https://wa.me/${provider.whatsapp}`} target="_blank" rel="noreferrer" startIcon={<MessageCircle size={17} />}>WhatsApp</Button>}
          {!provider.website && !provider.facebook && !provider.instagram && !provider.whatsapp && <Typography variant="body2" color="text.secondary">No contact details saved.</Typography>}
        </Stack>
      </Box>

      {provider.notes && <>
        <Divider />
        <Box component="section" sx={{ py: 3 }}>
          <Typography variant="sectionHeading" sx={{ mb: 1 }}>My notes</Typography>
          <Typography variant="bodyNote" color="text.secondary">{provider.notes}</Typography>
        </Box>
      </>}

      {isOwner && <ProviderModal open={editOpen} provider={provider} onClose={() => setEditOpen(false)} />}

      {isOwner && <ConfirmDialog
        open={confirmDelete}
        title="Delete provider?"
        message="This removes the provider and its photo. Linked accounts keep their reference."
        confirmLabel="Delete provider"
        onConfirm={() => { deleteProvider.mutate(provider); setConfirmDelete(false); navigate('/providers', { replace: true }); }}
        onClose={() => setConfirmDelete(false)}
      />}
    </Box>
  );
}
