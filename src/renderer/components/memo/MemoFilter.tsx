import React from 'react';
import { Chip, Stack, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

type FilterValue = 'all' | 'pending' | 'completed' | 'expired';

interface MemoFilterProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
  counts: Record<FilterValue, number>;
  onAdd?: () => void;
}

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待办' },
  { value: 'completed', label: '已完成' },
  { value: 'expired', label: '已过期' },
];

export function MemoFilter({ value, onChange, counts, onAdd }: MemoFilterProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center">
      {FILTER_OPTIONS.map((opt) => (
        <Chip
          key={opt.value}
          label={`${opt.label} (${counts[opt.value]})`}
          color={value === opt.value ? 'primary' : 'default'}
          onClick={() => onChange(opt.value)}
          variant={value === opt.value ? 'filled' : 'outlined'}
        />
      ))}
      <IconButton
        onClick={onAdd}
        size="small"
        color="primary"
        sx={{ ml: 'auto' }}
      >
        <AddIcon />
      </IconButton>
    </Stack>
  );
}
