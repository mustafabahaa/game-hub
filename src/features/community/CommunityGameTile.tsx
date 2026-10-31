import { Box, Typography } from '@mui/material';
import { Gamepad2 } from 'lucide-react';

export function CommunityGameTile({ title, imageUrl }: { title: string; imageUrl?: string | null }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ aspectRatio: '3 / 4', display: 'grid', placeItems: 'center', overflow: 'hidden', borderRadius: 2.5, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
        {imageUrl ? (
          <Box component="img" src={imageUrl} alt={title} loading="lazy" sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <Gamepad2 size={28} strokeWidth={1.6} color="currentColor" />
        )}
      </Box>
      <Typography variant="body2" sx={{ mt: 0.75, fontWeight: 600, lineHeight: 1.35 }} noWrap title={title}>{title}</Typography>
    </Box>
  );
}
