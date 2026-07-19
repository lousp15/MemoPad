import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';

interface SyncStatusBarProps {
  status: 'idle' | 'syncing' | 'error' | 'conflict';
  lastSyncTime: Date | null;
  onSync: () => void;
}

export function SyncStatusBar({ status, lastSyncTime, onSync }: SyncStatusBarProps) {
  const statusConfig: Record<string, { icon: React.ReactElement; label: string; color: 'default' | 'primary' | 'error' | 'warning' }> = {
    idle: { icon: <SyncIcon />, label: '同步', color: 'default' },
    syncing: { icon: <SyncIcon />, label: '同步中...', color: 'primary' },
    error: { icon: <ErrorIcon />, label: '同步失败', color: 'error' },
    conflict: { icon: <WarningIcon />, label: '有冲突', color: 'warning' },
  };

  const config = statusConfig[status];

  return (
    <Tooltip title={lastSyncTime ? `上次同步: ${lastSyncTime.toLocaleString('zh-CN')}` : '尚未同步'}>
      <Chip
        icon={config.icon}
        label={config.label}
        color={status === 'idle' ? 'default' : config.color}
        variant="outlined"
        onClick={onSync}
        disabled={status === 'syncing'}
        size="small"
      />
    </Tooltip>
  );
}
