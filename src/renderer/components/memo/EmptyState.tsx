import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface EmptyStateProps {
  onCreateNew: () => void;
}

export function EmptyState({ onCreateNew }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'text.secondary',
        gap: 2,
      }}
    >
      <Typography variant="h6">暂无备忘录</Typography>
      <Typography variant="body2">点击下方按钮创建第一条备忘录</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateNew}>
        新建备忘录
      </Button>
    </Box>
  );
}
