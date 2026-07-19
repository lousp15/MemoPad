import React from 'react';
import { Alert, Button, Stack } from '@mui/material';

interface RetryBannerProps {
  message: string;
  onRetry: () => void;
  onIgnore?: () => void;
  retryCount: number;
}

export function RetryBanner({
  message,
  onRetry,
  onIgnore,
  retryCount,
}: RetryBannerProps) {
  return (
    <Alert
      severity="error"
      sx={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 9999 }}
      action={
        <Stack direction="row" spacing={1}>
          <Button color="inherit" size="small" onClick={onRetry}>
            重试（{retryCount}）
          </Button>
          {onIgnore && (
            <Button color="inherit" size="small" onClick={onIgnore}>
              忽略
            </Button>
          )}
        </Stack>
      }
    >
      {message}
    </Alert>
  );
}
