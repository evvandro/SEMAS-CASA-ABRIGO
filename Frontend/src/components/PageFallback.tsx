import { Box, CircularProgress } from '@mui/material';

export function PageFallback() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', height: 300 }}>
      <CircularProgress />
    </Box>
  );
}
