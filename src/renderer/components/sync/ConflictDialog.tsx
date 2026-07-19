import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
} from '@mui/material';
import type { ConflictItem, ConflictResolution } from '@shared/types';

interface ConflictDialogProps {
  open: boolean;
  conflicts: ConflictItem[];
  onResolve: (resolution: ConflictResolution) => void;
  onCancel: () => void;
}

export function ConflictDialog({
  open,
  conflicts,
  onResolve,
  onCancel,
}: ConflictDialogProps) {
  const [resolution, setResolution] = React.useState<ConflictResolution>({});

  React.useEffect(() => {
    if (open) setResolution({});
  }, [open]);

  const handleResolve = () => {
    onResolve(resolution);
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>解决同步冲突</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          以下条目在本地和远程同时被修改，请选择要保留的版本：
        </Typography>
        {conflicts.map((item) => (
          <Stack key={item.memoId} spacing={1} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {item.local.content.length > 50
                ? item.local.content.slice(0, 50) + '...'
                : item.local.content}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant={resolution[item.memoId] === 'useLocal' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() =>
                  setResolution((r) => ({ ...r, [item.memoId]: 'useLocal' }))
                }
              >
                使用本地版本
              </Button>
              <Button
                size="small"
                variant={resolution[item.memoId] === 'useRemote' ? 'contained' : 'outlined'}
                color="secondary"
                onClick={() =>
                  setResolution((r) => ({ ...r, [item.memoId]: 'useRemote' }))
                }
              >
                使用远程版本
              </Button>
              <Button
                size="small"
                variant={resolution[item.memoId] === 'skip' ? 'contained' : 'outlined'}
                color="inherit"
                onClick={() =>
                  setResolution((r) => ({ ...r, [item.memoId]: 'skip' }))
                }
              >
                跳过
              </Button>
            </Stack>
          </Stack>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>取消同步</Button>
        <Button onClick={handleResolve} variant="contained" disabled={Object.keys(resolution).length < conflicts.length}>
          应用选择并合并
        </Button>
      </DialogActions>
    </Dialog>
  );
}
