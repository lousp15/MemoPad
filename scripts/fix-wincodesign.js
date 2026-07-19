/**
 * 解决 electron-builder winCodeSign 解压符号链接失败问题。
 * 
 * 用法：
 *   node scripts/fix-wincodesign.js
 *   然后运行: npx electron-builder --win --x64
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const cacheDir = path.join(
  process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Local'),
  'electron-builder',
  'Cache',
  'winCodeSign'
);

function getAll7zFiles() {
  if (!fs.existsSync(cacheDir)) return [];
  return fs.readdirSync(cacheDir)
    .filter(f => f.endsWith('.7z'))
    .sort()
    .map(f => ({
      full: path.join(cacheDir, f),
      name: f.replace('.7z', ''),
      dir: path.join(cacheDir, f.replace('.7z', '')),
    }));
}

const archives = getAll7zFiles();

if (archives.length === 0) {
  console.log('未找到 winCodeSign 缓存文件');
  console.log('请先运行: npx electron-builder --win --x64');
  console.log('等待下载完成后中断(Ctrl+C)，再运行此脚本');
  process.exit(0);
}

const latest = archives[archives.length - 1];
console.log(`[fix] 处理: ${latest.name}`);

// 创建目标目录
fs.mkdirSync(latest.dir, { recursive: true });

// 尝试解压，忽略符号链接错误
try {
  cp.execFileSync(
    path.join(process.cwd(), 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe'),
    ['x', '-bd', '-snl', '-aoa', latest.full, '-o' + latest.dir],
    { stdio: 'pipe' }
  );
  console.log('[fix] 解压成功');
} catch (e) {
  // 即使 exit code 2（符号链接错误），大部分文件已解压
  console.log('[fix] 解压完成（忽略符号链接错误）');
}

// 修补缺失的符号链接文件
const darwinLib = path.join(latest.dir, 'darwin', '10.12', 'lib');
if (fs.existsSync(darwinLib)) {
  const missing = ['libcrypto.dylib', 'libssl.dylib'].filter(f => !fs.existsSync(path.join(darwinLib, f)));
  for (const f of missing) {
    fs.writeFileSync(path.join(darwinLib, f), '');
    console.log(`[fix] 已创建占位文件: darwin/10.12/lib/${f}`);
  }
}

// 删除 .7z 文件，让 electron-builder 使用已解压的目录
console.log(`[fix] 删除: ${latest.full}`);
fs.unlinkSync(latest.full);

// 验证 signtool 是否存在
const signtool = path.join(latest.dir, 'win', 'signtool.exe');
if (fs.existsSync(signtool)) {
  console.log(`[fix] signtool 就绪: ${signtool}`);
} else {
  console.warn('[fix] 警告: signtool.exe 未找到');
}

console.log('\n[fix] 完成！现在运行: npx electron-builder --win --x64');
