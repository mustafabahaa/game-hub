import type { ReactNode } from 'react';
import { Box, Paper, Typography } from '@monochrome-ui/design-system';
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
    <Paper
      variant="emptyState"
      role="status"
      sx={{
        gap: 2,
        ...sx,
      }}
    >
      <Paper
        elevation={0}
        variant="emptyStateIcon"
        aria-hidden="true"
        sx={{
          flexShrink: 0,
        }}
      >
        {icon}
      </Paper>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="emptyStateTitle" sx={{ mb: 0.25 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
      </Box>
      {action && <Box sx={{ flex: '0 0 auto' }}>{action}</Box>}
    </Paper>
  );
}
