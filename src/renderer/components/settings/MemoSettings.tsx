import React from 'react';
import {
  Typography,
  Box,
  Slider,
  TextField,
} from '@mui/material';
import { useConfigStore } from '../../stores/configStore';
import { MAX_MEMOS_RANGE, DEFAULTS } from '@shared/constants';

export function MemoSettings() {
  const config = useConfigStore((s) => s.config);
  const updateConfig = useConfigStore((s) => s.updateConfig);

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom fontWeight={600}>
        备忘录设置
      </Typography>

      <Typography variant="body2" color="text.secondary">
        最大数量: {config.maxMemos === -1 ? '无限制' : config.maxMemos}
      </Typography>
      <Slider
        value={config.maxMemos === -1 ? MAX_MEMOS_RANGE.MAX + 1 : config.maxMemos}
        min={MAX_MEMOS_RANGE.MIN}
        max={MAX_MEMOS_RANGE.MAX + 1}
        step={5}
        marks={[
          { value: MAX_MEMOS_RANGE.MIN, label: `${MAX_MEMOS_RANGE.MIN}` },
          { value: MAX_MEMOS_RANGE.MAX + 1, label: '不限' },
        ]}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) =>
          v > MAX_MEMOS_RANGE.MAX ? '无限制' : `${v} 条`
        }
        onChange={(_, v) =>
          updateConfig({
            maxMemos: v as number > MAX_MEMOS_RANGE.MAX ? -1 : (v as number),
          })
        }
        sx={{ mt: 1 }}
      />

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          撤销栈深度
        </Typography>
        <TextField
          type="number"
          size="small"
          value={config.maxUndoStack}
          onChange={(e) =>
            updateConfig({
              maxUndoStack: Math.max(1, parseInt(e.target.value) || DEFAULTS.MAX_UNDO_STACK),
            })
          }
          inputProps={{ min: 1, max: 200 }}
          sx={{ width: 100 }}
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          自动保存延迟 (ms)
        </Typography>
        <TextField
          type="number"
          size="small"
          value={config.autoSaveDelay}
          onChange={(e) =>
            updateConfig({
              autoSaveDelay: Math.max(100, parseInt(e.target.value) || DEFAULTS.AUTO_SAVE_DELAY_MS),
            })
          }
          inputProps={{ min: 100, max: 10000 }}
          sx={{ width: 120 }}
        />
      </Box>
    </Box>
  );
}
