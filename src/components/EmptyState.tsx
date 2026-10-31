import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  sx?: SxProps<Theme>;
}

export function EmptyState({ icon, title, description, action, sx }: EmptyStateProps) {
  return (
    <Box
      role="status"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 3,
        px: 2,
        borderRadius: 2.5,
        bgcolor: 'action.hover',
        ...sx,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          width: 44,
          height: 44,
          flex: '0 0 auto',
          display: 'grid',
          placeItems: 'center',
          borderRadius: 2,
          bgcolor: 'background.paper',
          color: 'text.secondary',
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 650, mb: 0.25 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
      </Box>
      {action && <Box sx={{ flex: '0 0 auto' }}>{action}</Box>}
    </Box>
  );
}
