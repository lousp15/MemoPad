/**
 * 跨平台 GitHub API 工具
 * Electron 环境走 IPC，Android/Web 环境直接 fetch
 */

const STORAGE_KEY_TOKEN = 'github_token';
const STORAGE_KEY_CONFIG = 'github_config';

// Unicode 安全的 base64 编码
function base64Encode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Unicode 安全的 base64 解码
function base64Decode(str: string): string {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export const githubApi = {
  /** 验证 Token */
  async validateToken(token: string): Promise<boolean> {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /** 从 GitHub 拉取 memos.json */
  async pullMemos(token: string, owner: string, repo: string): Promise<any[]> {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/memos.json`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.content) return [];
      return JSON.parse(base64Decode(data.content));
    } catch {
      return [];
    }
  },

  /** 推送 memos.json 到 GitHub */
  async pushMemos(token: string, owner: string, repo: string, memos: any[]): Promise<void> {
    const content = base64Encode(JSON.stringify(memos, null, 2));
    const branch = 'master';

    // 先获取 SHA
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
    if (!putRes.ok) {
      const errText = await putRes.text();
      throw new Error(`GitHub 返回 ${putRes.status}: ${errText}`);
    }
  },

  /** 异步获取 Token（Electron 走 IPC，Android 走 localStorage） */
  async getToken(): Promise<string | null> {
    if (window.electronAPI) {
      return window.electronAPI.getGithubToken();
    }
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  },

  /** 保存 Token */
  async saveToken(token: string): Promise<void> {
    if (window.electronAPI) {
      await window.electronAPI.saveGithubToken(token);
    } else {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
    }
  },

  /** 清除 Token */
  async clearToken(): Promise<void> {
    if (window.electronAPI) {
      await window.electronAPI.clearGithubToken();
    }
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  },
};
