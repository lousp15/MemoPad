import React from 'react';
import {
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Box,
} from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useConfigStore } from '../../stores/configStore';

export function ThemeSettings() {
  const theme = useConfigStore((s) => s.config.theme);
  const updateConfig = useConfigStore((s) => s.updateConfig);

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom fontWeight={600}>
        主题
      </Typography>
      <ToggleButtonGroup
        value={theme}
        exclusive
        onChange={(_, v) => v && updateConfig({ theme: v })}
        size="small"
      >
        <ToggleButton value="light">
          <LightModeIcon sx={{ mr: 1 }} />
          亮色
        </ToggleButton>
        <ToggleButton value="dark">
          <DarkModeIcon sx={{ mr: 1 }} />
          暗色
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
