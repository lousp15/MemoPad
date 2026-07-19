/**
 * 修复 winCodeSign 解压失败的问题。
 * 7z 包中的 macOS 符号链接在 Windows 上无法解压，
 * 此脚本在 electron-builder 失败后补建这两个文件。
 */
const fs = require('fs');
const path = require('path');

const cacheDir = path.join(
  process.env.APPDATA || process.env.HOME,
  '..',
  'Local',
  'electron-builder',
  'Cache',
  'winCodeSign'
);

function findAndPatch() {
  if (!fs.existsSync(cacheDir)) {
    console.log('[patch] winCodeSign 缓存目录不存在');
    return;
  }

  const entries = fs.readdirSync(cacheDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const libDir = path.join(cacheDir, entry.name, 'darwin', '10.12', 'lib');
    const libcrypto = path.join(libDir, 'libcrypto.dylib');
    const libssl = path.join(libDir, 'libssl.dylib');

    if (fs.existsSync(libDir)) {
      let patched = false;
      if (!fs.existsSync(libcrypto)) {
        fs.writeFileSync(libcrypto, '');
        patched = true;
        console.log(`[patch] 已修复: ${path.relative(cacheDir, libcrypto)}`);
      }
      if (!fs.existsSync(libssl)) {
        fs.writeFileSync(libssl, '');
        patched = true;
        console.log(`[patch] 已修复: ${path.relative(cacheDir, libssl)}`);
      }
      if (!patched) {
        console.log(`[patch] ${entry.name} 已就绪，无需修复`);
      }
    }
  }
}

findAndPatch();
