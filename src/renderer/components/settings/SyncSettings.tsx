import React, { useState, useEffect, useCallback } from 'react';
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
import { useMemoStore } from '../../stores/memoStore';
import type { SyncMode } from '@shared/types';
import { githubApi } from '../../../core/services/GitHubApi';

export function SyncSettings() {
  const config = useConfigStore((s) => s.config);
  const updateConfig = useConfigStore((s) => s.updateConfig);

  const memos = useMemoStore((s) => s.memos);

  const [tokenInput, setTokenInput] = useState('');
  const [tokenStatus, setTokenStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');
  const [validating, setValidating] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // 加载已保存的配置（Token + 仓库）
  useEffect(() => {
    (async () => {
      const token = await githubApi.getToken();
      setTokenStatus(token ? 'valid' : 'unknown');

      if (window.electronAPI) {
        const savedConfig = await window.electronAPI.getGithubConfig();
        if (savedConfig) {
          updateConfig({
            github: {
              owner: savedConfig.owner,
              repo: savedConfig.repo,
              branch: savedConfig.branch,
              syncMode: savedConfig.syncMode as SyncMode,
            },
          });
        }
      } else {
        // Android：从 localStorage 恢复仓库配置
        const savedRaw = localStorage.getItem('github_config');
        if (savedRaw) {
          const savedConfig = JSON.parse(savedRaw);
          updateConfig({ github: savedConfig });
        }
      }
    })();
  }, [updateConfig]);

  /** 获取有效的 Token：优先用输入框中的，否则取已存储的 */
  const getEffectiveToken = useCallback(async (): Promise<string | null> => {
    if (tokenInput.trim()) return tokenInput.trim();
    if (window.electronAPI) {
      return await window.electronAPI.getGithubToken();
    }
    // Android / Web：从 localStorage 读取
    return localStorage.getItem('github_token');
  }, [tokenInput]);

  /** 直接调用 GitHub API 验证 Token（兼容 Android / Web） */
  const validateTokenDirect = async (token: string): Promise<boolean> => {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  /** 直接推送到 GitHub（兼容 Android / Web） */
  const pushToGithubDirect = async (token: string, owner: string, repo: string, memos: any[]) => {
    const content = btoa(JSON.stringify(memos, null, 2));
    const branch = 'master';

    // 先尝试获取已有文件 SHA
    let sha: string | undefined;
    try {
      const getRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/memos.json`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }
    } catch {}

    // 推送
    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/memos.json`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `MemoPad 同步 ${new Date().toISOString()}`,
          content,
          branch,
          sha,
        }),
      },
    );
    if (!putRes.ok) throw new Error(`GitHub 返回 ${putRes.status}`);
  };

  const handleValidate = async () => {
    if (!tokenInput.trim()) return;
    setValidating(true);
    try {
      if (window.electronAPI) {
        // Electron 环境：走 IPC
        const valid = await window.electronAPI.validateGithubToken(tokenInput.trim());
        setTokenStatus(valid ? 'valid' : 'invalid');
        if (valid) {
          await window.electronAPI.saveGithubToken(tokenInput.trim());
        }
      } else {
        // Android / Web：直接调用 GitHub API
        const valid = await validateTokenDirect(tokenInput.trim());
        setTokenStatus(valid ? 'valid' : 'invalid');
        if (valid) {
          localStorage.setItem('github_token', tokenInput.trim());
        }
      }
    } finally {
      setValidating(false);
    }
  };

  // 仓库配置变更时自动持久化到本地
  useEffect(() => {
    if (!config.github) return;
    const cfg = {
      owner: config.github.owner,
      repo: config.github.repo,
      branch: config.github.branch,
      syncMode: config.github.syncMode,
    };
    if (window.electronAPI) {
      window.electronAPI.saveGithubConfig(cfg);
    } else {
      localStorage.setItem('github_config', JSON.stringify(cfg));
    }
  }, [config.github]);

  const handleClear = async () => {
    if (window.electronAPI) {
      await window.electronAPI.clearGithubToken();
      await window.electronAPI.saveGithubConfig({ owner: '', repo: '', branch: 'main', syncMode: 'safe' });
    }
    localStorage.removeItem('github_token');
    setTokenStatus('unknown');
    setTokenInput('');
    updateConfig({ github: undefined });
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const effectiveToken = await getEffectiveToken();
      if (!effectiveToken || !config.github) {
        alert('请先配置并验证仓库');
        return;
      }

      if (window.electronAPI) {
        // Electron 环境
        await window.electronAPI.syncPush({
          token: effectiveToken,
          owner: config.github.owner,
          repo: config.github.repo,
          memos,
        });
        await window.electronAPI.saveGithubToken(effectiveToken);
      } else {
        // Android / Web 环境
        await pushToGithubDirect(
          effectiveToken,
          config.github.owner,
          config.github.repo,
          memos,
        );
      }

      alert(`同步成功！已推送 ${memos.length} 条备忘录到远程仓库`);
    } catch (err: any) {
      alert('同步失败: ' + (err?.message ?? '未知错误'));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom fontWeight={600}>
        GitHub 同步
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: 13 }}>
        Token 和仓库地址保存在本地，关闭应用后不丢失；
        点击"清除配置"可清除所有已保存的凭证。
        应用每 30 分钟自动同步一次。
      </Typography>

      <Stack spacing={2}>
        {/* 连接状态 */}
        <Chip
          label={
            tokenStatus === 'valid'
              ? '仓库连接正常'
              : tokenStatus === 'invalid'
                ? '仓库连接失败'
                : '未配置仓库'
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
          label="GitHub Personal Access Token"
          type="password"
          size="small"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          fullWidth
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          helperText="在 github.com/settings/tokens 创建（勾选 repo 权限）"
        />
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            onClick={handleValidate}
            disabled={!tokenInput.trim() || validating}
          >
            {validating ? '验证中...' : '验证并保存'}
          </Button>
          <Button size="small" color="error" onClick={handleClear}>
            清除配置
          </Button>
        </Stack>

        {/* 仓库地址 */}
        <TextField
          label="仓库地址 (owner/repo)"
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
          placeholder="lousp15/bwl"
          helperText="输入 owner/repo 格式"
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
            <MenuItem value="safe">安全模式（保留本地）</MenuItem>
            <MenuItem value="forceLocal">强制本地覆盖远程</MenuItem>
            <MenuItem value="forceRemote">强制远程覆盖本地</MenuItem>
          </Select>
        </FormControl>

        {/* 同步按钮 */}
        {tokenStatus === 'valid' && config.github && (
          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Button
              variant="contained"
              size="small"
              disabled={syncing}
              onClick={handleSync}
            >
              {syncing ? '同步中...' : `立即同步 (${memos.length} 条)`}
            </Button>
          </Stack>
        )}

        {tokenStatus === 'invalid' && (
          <Alert severity="warning">
            仓库连接失败，请检查 Token。前往{' '}
            <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">
              GitHub Token 设置页面
            </a>{' '}
            创建或更新 Token（需授予 repo 权限）
          </Alert>
        )}
      </Stack>
    </Box>
  );
}
