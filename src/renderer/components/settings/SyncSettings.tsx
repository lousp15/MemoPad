import React, { useState, useEffect } from 'react';
import {
  Typography,
  TextField,
  Button,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
} from '@mui/material';
import { useConfigStore } from '../../stores/configStore';
import type { SyncMode } from '@shared/types';

export function SyncSettings() {
  const config = useConfigStore((s) => s.config);
  const updateConfig = useConfigStore((s) => s.updateConfig);

  const [token, setToken] = useState('');
  const [tokenStatus, setTokenStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');
  const [validating, setValidating] = useState(false);

  // 检查已存 Token 状态
  useEffect(() => {
    (async () => {
      if (window.electronAPI) {
        const hasToken = await window.electronAPI.hasGithubToken();
        setTokenStatus(hasToken ? 'valid' : 'unknown');
      }
    })();
  }, []);

  const handleValidate = async () => {
    if (!token.trim()) return;
    setValidating(true);
    try {
      if (window.electronAPI) {
        const valid = await window.electronAPI.validateGithubToken(token.trim());
        setTokenStatus(valid ? 'valid' : 'invalid');
        if (valid) {
          await window.electronAPI.saveGithubToken(token.trim());
          setToken('');
        }
      }
    } finally {
      setValidating(false);
    }
  };

  const handleClearToken = async () => {
    if (window.electronAPI) {
      await window.electronAPI.clearGithubToken();
    }
    setTokenStatus('unknown');
    setToken('');
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom fontWeight={600}>
        GitHub 同步
      </Typography>

      <Stack spacing={2}>
        {/* Token 验证状态 */}
        <Chip
          label={
            tokenStatus === 'valid'
              ? 'Token 有效'
              : tokenStatus === 'invalid'
                ? 'Token 无效'
                : '未配置 Token'
          }
          color={
            tokenStatus === 'valid'
              ? 'success'
              : tokenStatus === 'invalid'
                ? 'error'
                : 'default'
          }
          size="small"
          variant="outlined"
        />

        {/* Token 输入 */}
        <TextField
          label="Personal Access Token"
          type="password"
          size="small"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          fullWidth
          helperText="需 repo 权限，token 不会暴露到渲染进程"
        />
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            onClick={handleValidate}
            disabled={!token.trim() || validating}
          >
            {validating ? '验证中...' : '验证并保存'}
          </Button>
          <Button size="small" color="error" onClick={handleClearToken}>
            清除 Token
          </Button>
        </Stack>

        {/* 仓库配置 */}
        <TextField
          label="仓库 (owner/repo)"
          size="small"
          value={
            config.github ? `${config.github.owner}/${config.github.repo}` : ''
          }
          onChange={(e) => {
            const parts = e.target.value.split('/');
            if (parts.length === 2) {
              updateConfig({
                github: {
                  owner: parts[0],
                  repo: parts[1],
                  branch: config.github?.branch ?? 'main',
                  syncMode: config.github?.syncMode ?? 'safe',
                },
              });
            }
          }}
          fullWidth
        />

        {/* 同步模式 */}
        <FormControl size="small" fullWidth>
          <InputLabel>同步模式</InputLabel>
          <Select
            value={config.github?.syncMode ?? 'safe'}
            label="同步模式"
            onChange={(e) =>
              updateConfig({
                github: config.github
                  ? { ...config.github, syncMode: e.target.value as SyncMode }
                  : undefined,
              })
            }
          >
            <MenuItem value="safe">安全模式（冲突时选择）</MenuItem>
            <MenuItem value="forceLocal">强制本地覆盖远程</MenuItem>
            <MenuItem value="forceRemote">强制远程覆盖本地</MenuItem>
          </Select>
        </FormControl>

        {tokenStatus === 'invalid' && (
          <Alert severity="warning">
            Token 无效，请在{' '}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Token 设置
            </a>{' '}
            重新生成
          </Alert>
        )}
      </Stack>
    </Box>
  );
}
