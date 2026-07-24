import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Stack alignItems="flex-start" gap={2}>
      <Typography variant="h2">Lost at sea</Typography>
      <Typography color="text.secondary">The page you requested does not exist.</Typography>
      <Button component={RouterLink} to="/" variant="contained">
        Return to dashboard
      </Button>
    </Stack>
  );
}
