import React from 'react';
import { Chip } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

interface OverLimitChipProps {
  currentCount: number;
  maxMemos: number;
  onClick: () => void;
}

export function OverLimitChip({ currentCount, maxMemos, onClick }: OverLimitChipProps) {
  if (maxMemos === -1 || currentCount <= maxMemos) return null;

  return (
    <Chip
      icon={<WarningIcon />}
      label={`当前超出 ${currentCount - maxMemos} 条，请清理`}
      color="warning"
      onClick={onClick}
      variant="outlined"
      sx={{ cursor: 'pointer', mb: 1 }}
    />
  );
}
