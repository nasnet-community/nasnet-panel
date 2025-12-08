#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

function parseArgs() {
  const [,, cmd, ...rest] = process.argv;
  const args = Object.create(null);
  for (let i = 0; i < rest.length; i++) {
    const k = rest[i];
    if (k.startsWith('--')) {
      const key = k.slice(2).replace(/-/g, '_'); // Convert kebab-case to snake_case
      const val = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : 'true';
      args[key] = val;
    }
  }
  return { cmd, args };
}

function sh(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
    p.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}`)));
  });
}

async function ensureBuildx() {
  try { await sh('docker', ['buildx', 'create', '--use', '--name', 'nxbuilder']); } catch {}
}

async function removeDockerImage(tag) {
  try {
    await sh('docker', ['rmi', '-f', tag]);
    console.log(`  Removed old image: ${tag}`);
  } catch {
    // Image doesn't exist, that's fine
  }
}

function removeFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`  Removed old file: ${filePath}`);
    }
  } catch (e) {
    console.warn(`  Could not remove ${filePath}:`, e.message);
  }
}

async function buildLocal({ tag = 'nasnet:local', platform = 'linux/amd64', noCache = false } = {}) {
  await ensureBuildx();
  const buildArgs = [
    'buildx', 'build',
    '--platform', platform,
    '-f', 'apps/rosproxy/Dockerfile',
    '-t', tag,
    '--load'
  ];
  
  if (noCache) {
    buildArgs.push('--no-cache', '--pull');
  }
  
  buildArgs.push('.');
  await sh('docker', buildArgs);
}

async function exportTar({ tag = 'nasnet:local', out = 'dist/images/nasnet-local.tar.gz' } = {}) {
  const outDir = path.dirname(out);
  fs.mkdirSync(outDir, { recursive: true });
  
  return new Promise((resolve, reject) => {
    const save = spawn('docker', ['save', tag], { shell: process.platform === 'win32' });
    const outStream = fs.createWriteStream(out);
    const gzip = createGzip({ level: 9 });
    
    let errorOccurred = false;
    
    save.on('error', (err) => {
      errorOccurred = true;
      reject(new Error(`docker save error: ${err.message}`));
    });
    
    gzip.on('error', (err) => {
      errorOccurred = true;
      reject(new Error(`gzip error: ${err.message}`));
    });
    
    outStream.on('error', (err) => {
      errorOccurred = true;
      reject(new Error(`file write error: ${err.message}`));
    });
    
    outStream.on('finish', () => {
      if (!errorOccurred) {
        resolve();
      }
    });
    
    save.on('exit', (code) => {
      if (code !== 0 && !errorOccurred) {
        errorOccurred = true;
        reject(new Error(`docker save exited with code ${code}`));
      }
    });
    
    save.stdout.pipe(gzip).pipe(outStream);
  });
}

async function buildExport(opts) {
  const { tag = 'nasnet:local', platform = 'linux/amd64', out = 'dist/images/nasnet-local-amd64.tar.gz' } = opts;
  await buildLocal({ tag, platform });
  await exportTar({ tag, out });
}

async function buildExportMulti({ tag = 'nasnet', base_out = 'dist/images' } = {}) {
  const platforms = [
    { platform: 'linux/arm/v7', suffix: 'armv7' },
    { platform: 'linux/arm64', suffix: 'arm64' },
    { platform: 'linux/amd64', suffix: 'amd64' }
  ];
  
  console.log('Cleaning up old files and images...\n');
  
  // Clean up old .tar.gz files first
  for (const { suffix } of platforms) {
    const outPath = path.join(base_out, `${tag}-local-${suffix}.tar.gz`);
    removeFile(outPath);
  }
  
  console.log(`\nBuilding and exporting ${platforms.length} architectures (fresh builds, no cache)...\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < platforms.length; i++) {
    const { platform, suffix } = platforms[i];
    const archTag = `${tag}:local-${suffix}`;
    const outPath = path.join(base_out, `${tag}-local-${suffix}.tar.gz`);
    
    try {
      console.log(`[${suffix.toUpperCase()}] (${i + 1}/${platforms.length}) Starting...`);
      
      console.log(`[${suffix.toUpperCase()}] Removing old Docker image...`);
      await removeDockerImage(archTag);
      
      console.log(`[${suffix.toUpperCase()}] Building ${platform} (no cache)...`);
      await buildLocal({ tag: archTag, platform, noCache: true });
      
      console.log(`[${suffix.toUpperCase()}] Exporting to ${outPath}...`);
      await exportTar({ tag: archTag, out: outPath });
      
      console.log(`[${suffix.toUpperCase()}] ✓ Complete\n`);
      successCount++;
    } catch (error) {
      console.error(`[${suffix.toUpperCase()}] ✗ Failed: ${error.message}\n`);
      failCount++;
      // Continue with next architecture instead of stopping
    }
  }
  
  console.log(`\nBuild Summary: ${successCount} successful, ${failCount} failed out of ${platforms.length} total`);
  
  if (failCount > 0) {
    throw new Error(`${failCount} architecture(s) failed to build`);
  }
  
  console.log('All architectures built and exported successfully!');
}

(async () => {
  const { cmd, args } = parseArgs();
  if (cmd === 'build-local') {
    await buildLocal(args);
  } else if (cmd === 'export-tar') {
    await exportTar(args);
  } else if (cmd === 'build-export') {
    await buildExport(args);
  } else if (cmd === 'build-export-multi') {
    await buildExportMulti(args);
  } else {
    console.error('Usage:\n  node tools/docker/cli.mjs build-local --tag <name> [--platform linux/amd64]\n  node tools/docker/cli.mjs export-tar --tag <name> --out <path.tar.gz>\n  node tools/docker/cli.mjs build-export --tag <name> --platform linux/amd64 --out <path.tar.gz>\n  node tools/docker/cli.mjs build-export-multi --tag <name> [--base_out dist/images]');
    process.exit(1);
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });



