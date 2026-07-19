import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  Box,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useUiStore } from '../../stores/uiStore';

interface TopBarProps {
  undoCount?: number;
  redoCount?: number;
  undoDescription?: string;
  redoDescription?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  onEndSession?: () => void;
}

export function TopBar({
  undoCount = 0,
  redoCount = 0,
  undoDescription,
  redoDescription,
  onUndo,
  onRedo,
  onEndSession,
}: TopBarProps) {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <AppBar position="static" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
      <Toolbar variant="dense">
        <IconButton color="inherit" edge="start" onClick={toggleSidebar}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1, ml: 1 }}>
          MemoPad
        </Typography>

        <Box>
          <Tooltip title={undoCount > 0 ? `撤销 ${undoDescription ?? ''}` : '无操作可撤销'}>
            <span>
              <IconButton color="inherit" onClick={onUndo} disabled={undoCount === 0}>
                <UndoIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={redoCount > 0 ? `重做 ${redoDescription ?? ''}` : '无操作可重做'}>
            <span>
              <IconButton color="inherit" onClick={onRedo} disabled={redoCount === 0}>
                <RedoIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="结束会话（清空撤销历史）">
            <IconButton color="inherit" onClick={onEndSession}>
              <ExitToAppIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
