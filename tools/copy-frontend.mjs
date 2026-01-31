import { cpSync, rmSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(process.cwd(), '.');
const src = resolve(root, 'dist', 'apps', 'connectpoc');
const dst = resolve(root, 'apps', 'backend', 'dist');

if (!existsSync(src)) {
  console.error(`[copy-frontend] Source not found: ${src}. Did you run nx run connectpoc:build?`);
  process.exit(1);
}

try {
  rmSync(dst, { recursive: true, force: true });
  mkdirSync(dst, { recursive: true });
  cpSync(src, dst, { recursive: true });
  console.log(`[copy-frontend] Copied frontend from ${src} to ${dst}`);
} catch (err) {
  console.error('[copy-frontend] Failed:', err);
  process.exit(1);
}
