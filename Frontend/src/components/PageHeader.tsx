import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      gap={2}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h4"
          sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, lineHeight: 1.2 }}
        >
          {title}
        </Typography>
        {description && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={1}
          sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}
        >
          {actions}
        </Stack>
      )}
    </Stack>
  );
}
