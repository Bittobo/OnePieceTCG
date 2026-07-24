import { Box, CircularProgress, Typography } from '@mui/material';

export function LoadingState({ label = 'Loading collection...' }: { label?: string }) {
  return (
    <Box
      role="status"
      sx={{ minHeight: 240, display: 'grid', placeItems: 'center', textAlign: 'center' }}
    >
      <Box>
        <CircularProgress size={34} />
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}
