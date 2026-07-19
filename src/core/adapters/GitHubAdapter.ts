import type { Memo } from '@shared/types/memo';
import { Octokit } from 'octokit';
import { DEFAULTS } from '@shared/constants';

interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

export class GitHubAdapter {
  private octokit: Octokit | null = null;
  private config: GitHubConfig | null = null;

  configure(config: GitHubConfig): void {
    this.config = config;
    this.octokit = new Octokit({ auth: config.token });
  }

  isConfigured(): boolean {
    return this.config !== null && this.octokit !== null;
  }

  /**
   * 拉取远程备忘录 JSON 文件
   * 若文件损坏，尝试检查 .backup 文件
   */
  async pullMemos(): Promise<{ memos: Memo[]; backupAvailable: boolean; backupMemos?: Memo[] }> {
    if (!this.octokit || !this.config) throw new Error('GitHub 未配置');

    const { owner, repo, branch } = this.config;
    const path = 'memos.json';

    try {
      const { data } = await this.octokit.request(
        'GET /repos/{owner}/{repo}/contents/{path}',
        { owner, repo, path, ref: branch },
      );

      if (!('content' in data)) throw new Error('不是文件');

      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      const memos: Memo[] = JSON.parse(content);
      return { memos, backupAvailable: false };
    } catch (err) {
      if (err instanceof SyntaxError) {
        // JSON 损坏 → 尝试 .backup
        const backup = await this.tryPullBackup();
        return { memos: [], backupAvailable: true, backupMemos: backup ?? undefined };
      }
      throw err;
    }
  }

  private async tryPullBackup(): Promise<Memo[] | null> {
    if (!this.octokit || !this.config) return null;
    const { owner, repo, branch } = this.config;

    try {
      const { data } = await this.octokit.request(
        'GET /repos/{owner}/{repo}/contents/{path}',
        { owner, repo, path: 'memos.json.backup', ref: branch },
      );
      if (!('content' in data)) return null;
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * 推送备忘录到远程仓库
   */
  async pushMemos(memos: Memo[]): Promise<void> {
    if (!this.octokit || !this.config) throw new Error('GitHub 未配置');

    const { owner, repo, branch } = this.config;
    const path = 'memos.json';
    const content = Buffer.from(JSON.stringify(memos, null, 2)).toString('base64');

    try {
      // 先获取当前文件 SHA
      const { data } = await this.octokit.request(
        'GET /repos/{owner}/{repo}/contents/{path}',
        { owner, repo, path, ref: branch },
      );

      const sha = 'sha' in data ? data.sha : undefined;

      await this.octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path,
        message: `MemoPad 同步 ${new Date().toISOString()}`,
        content,
        sha,
        branch,
      });
    } catch (err: any) {
      if (err?.status === 404) {
        // 文件不存在，新建
        await this.octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
          owner,
          repo,
          path,
          message: `MemoPad 初始同步 ${new Date().toISOString()}`,
          content,
          branch,
        });
        return;
      }
      throw err;
    }
  }

  /**
   * 验证 Token 有效性
   */
  async validateToken(token: string): Promise<boolean> {
    const octokit = new Octokit({ auth: token });
    try {
      await octokit.request('GET /user');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取当前用户信息
   */
  async getUser(): Promise<{ login: string } | null> {
    if (!this.octokit) return null;
    try {
      const { data } = await this.octokit.request('GET /user');
      return { login: data.login };
    } catch {
      return null;
    }
  }
}

export const gitHubAdapter = new GitHubAdapter();
