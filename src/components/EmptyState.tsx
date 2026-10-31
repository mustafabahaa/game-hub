import type { ReactNode } from 'react';
import { EmptyStateLayout } from '@monochrome-ui/design-system';
import type { SxProps, Theme } from '@mui/material/styles';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  sx?: SxProps<Theme>;
}

export function EmptyState({ icon, title, description, action, sx }: EmptyStateProps) {
  return <EmptyStateLayout icon={icon} title={title} description={description} action={action} sx={sx} />;
}
