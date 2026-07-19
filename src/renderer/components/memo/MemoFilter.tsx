import React from 'react';
import { Chip, Stack } from '@mui/material';

type FilterValue = 'all' | 'pending' | 'completed' | 'expired';

interface MemoFilterProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
  counts: Record<FilterValue, number>;
}

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待办' },
  { value: 'completed', label: '已完成' },
  { value: 'expired', label: '已过期' },
];

export function MemoFilter({ value, onChange, counts }: MemoFilterProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
      {FILTER_OPTIONS.map((opt) => (
        <Chip
          key={opt.value}
          label={`${opt.label} (${counts[opt.value]})`}
          color={value === opt.value ? 'primary' : 'default'}
          onClick={() => onChange(opt.value)}
          variant={value === opt.value ? 'filled' : 'outlined'}
        />
      ))}
    </Stack>
  );
}
