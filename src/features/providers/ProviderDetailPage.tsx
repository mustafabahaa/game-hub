import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Stack, Button, CircularProgress, Chip, Avatar, TextField, Rating, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { ArrowLeft, Star, ExternalLink, MessageCircle, Link as LinkIcon, Trash2 } from 'lucide-react';
import { useAppContext } from '@/hooks/useAppContext';
import {
  useProvider, useRatings, useReputation, useUpsertRating, useCreateReputationPost, useProfile, useDeleteProvider,
} from '@/hooks/useGamehub';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { ProviderRating, UserProfile } from '@/domain/types';

export function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppContext();
  const { data: provider, isLoading } = useProvider(id);
  const { data: ratings } = useRatings(id);
  const { data: reputation } = useReputation(id);
  const upsertRating = useUpsertRating(user?.uid ?? '');
  const createPost = useCreateReputationPost(user?.uid ?? '');
  const deleteProvider = useDeleteProvider();

  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postProof, setPostProof] = useState('');
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const avgRating = useMemo(() => {
    const r = ratings ?? [];
    return r.length === 0 ? null : r.reduce((s, x) => s + x.rating, 0) / r.length;
  }, [ratings]);
  const isOwner = provider?.userId === user?.uid;
  const ownRating = useMemo(() => ratings?.find((item) => item.userId === user?.uid), [ratings, user?.uid]);

  useEffect(() => {
    if (!ratings) return;
    setRating(ownRating?.rating ?? 0);
    setReview(ownRating?.review ?? '');
  }, [ratings, ownRating]);

  const saveRating = () => {
    if (!rating) return;
    upsertRating.mutate(
      { providerId: provider!.id, rating, review: review.trim() || null },
      { onSuccess: () => setRatingDialogOpen(false) },
    );
  };

  const shareExperience = () => {
    if (!postTitle.trim()) return;
    createPost.mutate(
      { providerId: provider!.id, title: postTitle.trim(), body: postBody.trim() || null, proofLink: postProof.trim() || null },
      { onSuccess: () => { setPostTitle(''); setPostBody(''); setPostProof(''); setExperienceOpen(false); } },
    );
  };

  if (isLoading) return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}><CircularProgress /></Box>;

  if (!provider) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>Provider not found</Typography>
        <Button onClick={() => navigate('/providers')} sx={{ mt: 2 }}>Back to providers</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Button startIcon={<ArrowLeft size={16} />} variant="text" onClick={() => navigate('/providers')} sx={{ mb: 3, px: 0 }}>
        Back to providers
      </Button>

      {/* Provider header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 4 }}>
        {provider.photoUrl ? <Box component="img" src={provider.photoUrl} alt={`${provider.name} logo`} sx={{ display: 'block', width: { xs: 100, sm: 136 }, height: { xs: 100, sm: 136 }, objectFit: 'contain', p: 1.5, boxSizing: 'border-box', borderRadius: 3, bgcolor: 'action.hover', flexShrink: 0 }} /> : <Avatar sx={{ width: { xs: 100, sm: 136 }, height: { xs: 100, sm: 136 }, borderRadius: 3, bgcolor: 'action.selected', color: 'text.primary', fontSize: '2.5rem', fontWeight: 800, flexShrink: 0 }}>{provider.name[0]?.toUpperCase()}</Avatar>}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1" sx={{ fontSize: { xs: 28, sm: 34 }, overflowWrap: 'anywhere' }}>{provider.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{provider.website ? provider.website.replace(/^https?:\/\//, '') : 'Community provider'}</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center" flexWrap="wrap">
            {avgRating !== null && (
              <Chip icon={<Star size={16} />} label={`${avgRating.toFixed(1)} (${(ratings ?? []).length})`} size="small" variant="outlined" sx={{ '& .MuiChip-icon': { ml: .75 } }} />
            )}
            {provider.website && <Button component="a" href={provider.website} target="_blank" rel="noreferrer" size="small" startIcon={<ExternalLink size={18} />} sx={{ px: 1 }}>Website</Button>}
            {provider.facebook && <Button component="a" href={provider.facebook} target="_blank" rel="noreferrer" size="small" startIcon={<LinkIcon size={18} />} sx={{ px: 1 }}>Facebook</Button>}
            {provider.whatsapp && <Button component="a" href={`https://wa.me/${provider.whatsapp}`} target="_blank" rel="noreferrer" size="small" startIcon={<MessageCircle size={18} />} sx={{ px: 1 }}>WhatsApp</Button>}
          </Stack>
        </Box>
        {isOwner && <Button color="error" variant="text" startIcon={<Trash2 size={18} />} onClick={() => setConfirmDelete(true)}>Delete provider</Button>}
      </Stack>

      {provider.notes && (
        <ProviderSection title="About this provider" sx={{ mb: 4 }}>
          <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{provider.notes}</Typography>
        </ProviderSection>
      )}

      <Divider sx={{ mb: 3.5 }} />
      <ProviderSection title="Your rating" description="Your review is only shown with your community rating." sx={{ mb: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={1.5}>
          {ownRating ? <Stack spacing={.5}>
            <Rating value={ownRating.rating} readOnly size="small" sx={{ color: 'text.primary' }} />
            <Typography variant="body2" color="text.secondary">{ownRating.review || 'You left a rating without a written review.'}</Typography>
          </Stack> : <Typography variant="body2" color="text.secondary">You haven’t rated this provider yet.</Typography>}
          <Button variant="contained" onClick={() => setRatingDialogOpen(true)} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, flexShrink: 0 }}>
            {ownRating ? 'Edit review' : 'Write a review'}
          </Button>
        </Stack>
      </ProviderSection>

      <Divider sx={{ mb: 3.5 }} />
      <ProviderSection title={`Community ratings · ${(ratings ?? []).length}`} description="Ratings and reviews shared by the community." sx={{ mb: 4 }}>
        {(ratings ?? []).length > 0 ? <Stack divider={<Divider flexItem />}>
          {ratings!.map((item) => <RatingReview key={item.id} item={item} isCurrentUser={item.userId === user?.uid} />)}
        </Stack> : <Typography variant="body2" color="text.secondary">No ratings yet.</Typography>}
      </ProviderSection>

      <Divider sx={{ mb: 3.5 }} />
      <ProviderSection title={`Community experiences · ${(reputation ?? []).length}`} description="Longer notes shared about buying from this provider.">
        <Stack divider={<Divider flexItem />} sx={{ mb: 2 }}>
          {(reputation ?? []).map((post) => <ReputationCard key={post.id} post={post} />)}
          {(reputation ?? []).length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>No experiences shared yet.</Typography>}
        </Stack>
        <Button variant="outlined" onClick={() => setExperienceOpen(true)}>Add a comment</Button>
      </ProviderSection>
      <Dialog open={ratingDialogOpen} onClose={() => setRatingDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{ownRating ? 'Edit your review' : 'Write a review'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Choose a rating and add an optional note about your experience.</Typography>
          <Stack spacing={2}>
            <Rating value={rating} onChange={(_, value) => setRating(value ?? 0)} size="large" sx={{ color: 'text.primary' }} />
            <TextField label="Review (optional)" value={review} onChange={(event) => setReview(event.target.value)} fullWidth multiline minRows={3} autoFocus />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRatingDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveRating} disabled={!rating || upsertRating.isPending}>
            {upsertRating.isPending ? <CircularProgress size={16} color="inherit" /> : ownRating ? 'Save changes' : 'Post review'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={experienceOpen} onClose={() => setExperienceOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Share an experience</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Add a comment to help others know what to expect.</Typography>
          <Stack spacing={1.5}>
            <TextField label="Title" value={postTitle} onChange={(event) => setPostTitle(event.target.value)} fullWidth />
            <TextField label="Comment" value={postBody} onChange={(event) => setPostBody(event.target.value)} fullWidth multiline minRows={3} />
            <TextField label="Proof link (optional)" value={postProof} onChange={(event) => setPostProof(event.target.value)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setExperienceOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={shareExperience} disabled={!postTitle.trim() || createPost.isPending}>
            {createPost.isPending ? <CircularProgress size={16} color="inherit" /> : 'Post comment'}
          </Button>
        </DialogActions>
      </Dialog>
      {isOwner && <ConfirmDialog
        open={confirmDelete}
        title="Delete provider?"
        message="This removes the provider and their photo. Linked accounts keep their reference."
        confirmLabel="Delete provider"
        onConfirm={() => { deleteProvider.mutate(provider); setConfirmDelete(false); navigate('/providers', { replace: true }); }}
        onClose={() => setConfirmDelete(false)}
      />}
    </Box>
  );
}

function ProviderSection({ title, description, children, sx }: { title: string; description?: string; children: React.ReactNode; sx?: object }) {
  return <Box component="section" sx={{ minWidth: 0, ...sx }}>
    <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-.01em', mb: description ? .5 : 1.5 }}>{title}</Typography>
    {description && <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>{description}</Typography>}
    {children}
  </Box>;
}

function RatingReview({ item, isCurrentUser }: { item: ProviderRating; isCurrentUser: boolean }) {
  const { data: profile } = useProfile(item.userId);
  const p = profile as UserProfile | undefined;
  const name = isCurrentUser ? 'You' : p?.displayName ?? p?.username ?? 'Anonymous';
  return <Box sx={{ py: 1.75 }}>
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1 }}>
      <Avatar src={p?.avatarUrl ?? undefined} alt={name} sx={{ width: 40, height: 40, fontSize: 15, bgcolor: 'action.selected', color: 'text.primary', fontWeight: 700 }}>
        {name[0]?.toUpperCase()}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 650 }}>{name}</Typography>
        <Typography variant="caption" color="text.secondary">{formatReviewDate(item.createdAt)}</Typography>
      </Box>
      <Rating value={item.rating} readOnly size="small" sx={{ color: 'text.primary' }} />
    </Stack>
    {item.review && <Typography variant="body1" sx={{ pl: '50px', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{item.review}</Typography>}
  </Box>;
}

function ReputationCard({ post }: { post: { id: string; userId: string; title: string; body?: string | null; proofLink?: string | null; createdAt: string } }) {
  const { data: profile } = useProfile(post.userId);
  const p = profile as UserProfile | undefined;
  const name = p?.displayName ?? p?.username ?? 'Anonymous';
  return (
    <Box sx={{ py: 2.25 }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.25 }}>
        <Avatar src={p?.avatarUrl ?? undefined} alt={name} sx={{ width: 40, height: 40, fontSize: 15, bgcolor: 'action.selected', color: 'text.primary', fontWeight: 700 }}>
          {name[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 650 }}>{name}</Typography>
          <Typography variant="caption" color="text.secondary">{formatReviewDate(post.createdAt)}</Typography>
        </Box>
      </Stack>
      <Box sx={{ pl: '50px' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 650, mb: .5 }}>{post.title}</Typography>
        {post.body && <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{post.body}</Typography>}
        {post.proofLink && <Button size="small" href={post.proofLink} target="_blank" rel="noreferrer" startIcon={<ExternalLink size={16} />} sx={{ mt: 1, px: 0 }}>View proof</Button>}
      </Box>
    </Box>
  );
}

function formatReviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(date);
}
