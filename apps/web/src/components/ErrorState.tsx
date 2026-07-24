import ReplayIcon from '@mui/icons-material/Replay';
import { Alert, Button, Stack } from '@mui/material';

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Alert severity="error">
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ sm: 'center' }}>
        <span>{message}</span>
        {onRetry ? (
          <Button color="inherit" size="small" startIcon={<ReplayIcon />} onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </Stack>
    </Alert>
  );
}
