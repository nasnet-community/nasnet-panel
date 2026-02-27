/* eslint-env node */
import { spawn, execSync } from 'child_process';
import { writeFileSync } from 'node:fs';
import { basename, extname, dirname, join } from 'node:path';

// --- CLI arg parsing ---
const args = process.argv.slice(2);
function getArg(long, short) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === long || args[i] === short) return args[i + 1];
  }
  return undefined;
}
const hasFlag = (long, short) => args.includes(long) || (short && args.includes(short));

const outputPath = getArg('--output', '-o');
const splitArg = getArg('--split', '-s');
const fileMode = hasFlag('--file') || outputPath != null || splitArg != null;
const outputFile = outputPath ?? 'check-backend-output.txt';
const splitLines = splitArg ? parseInt(splitArg, 10) : 1000;
const runCodegen = hasFlag('--codegen', '-cg');

function elapsed(start) {
  const s = ((Date.now() - start) / 1000).toFixed(1);
  return `${s}s`;
}

function run(command) {
  const start = Date.now();
  return new Promise((resolve) => {
    const chunks = [];
    const child = spawn(command, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (d) => chunks.push(d));
    child.stderr.on('data', (d) => chunks.push(d));
    child.on('close', (code) =>
      resolve({ ok: code === 0, output: Buffer.concat(chunks).toString(), time: elapsed(start) }),
    );
  });
}

const totalStart = Date.now();
const buf = [];

// --- Phase 1: Codegen (optional — only needed after schema/wire changes) ---
let codegen = { ok: true, output: '', time: 'skipped' };
if (runCodegen) {
  console.log('=== Phase 1: Codegen (ent + gqlgen + wire) ===\n');
  codegen = await run('npm run codegen:go');

  const codegenHeader = `=== Codegen [${codegen.time}] ===\n`;
  console.log(codegenHeader);
  console.log(codegen.output);
  buf.push(codegenHeader, codegen.output);

  if (!codegen.ok) {
    const failMsg = `Codegen failed — skipping remaining phases. [total: ${elapsed(totalStart)}]`;
    console.error(failMsg);
    buf.push(failMsg);
    if (fileMode) writeOutput(buf.join('\n'));
    process.exit(1);
  }
} else {
  console.log('=== Phase 1: Codegen — skipped (use --codegen to enable) ===\n');
  buf.push('=== Codegen [skipped] ===\n');
}

// --- Phase 2: Format (sequential — must complete before linters analyze code) ---
console.log('=== Phase 2: Format (go fmt) ===\n');
const fmt = await run('cd apps/backend && go fmt ./...');

const fmtHeader = `=== Format [${fmt.time}] ===\n`;
console.log(fmtHeader);
if (fmt.output.trim()) console.log(fmt.output);
buf.push(fmtHeader, fmt.output);

if (!fmt.ok) {
  const failMsg = `go fmt failed — skipping remaining phases. [total: ${elapsed(totalStart)}]`;
  console.error(failMsg);
  buf.push(failMsg);
  if (fileMode) writeOutput(buf.join('\n'));
  process.exit(1);
}

// --- Phase 3: Lint + Typecheck (parallel) ---
console.log('=== Phase 3: Lint + Typecheck (parallel) ===\n');
const [lint, typecheck] = await Promise.all([
  run('npx nx run backend:lint'),
  run('npx nx run backend:typecheck'),
]);

const lintHeader = `=== Lint [${lint.time}] ===\n`;
console.log(lintHeader);
console.log(lint.output);
buf.push(lintHeader, lint.output);

const tcHeader = `=== Typecheck (go vet) [${typecheck.time}] ===\n`;
console.log(tcHeader);
console.log(typecheck.output);
buf.push(tcHeader, typecheck.output);

if (!lint.ok || !typecheck.ok) {
  const failed = [!lint.ok && 'lint', !typecheck.ok && 'typecheck'].filter(Boolean).join(' + ');
  const failMsg = `${failed} failed — skipping build + vulncheck. [total: ${elapsed(totalStart)}]`;
  console.error(failMsg);
  buf.push(failMsg);
  if (fileMode) writeOutput(buf.join('\n'));
  process.exit(1);
}

// --- Phase 4: Build check + Vulncheck (parallel — independent, gated by Phase 3) ---
console.log('=== Phase 4: Build check + Vulncheck (parallel) ===\n');
const [build, vulncheck] = await Promise.all([
  run('npx nx run backend:build:check'),
  run('npx nx run backend:vulncheck'),
]);

const buildHeader = `=== Build check [${build.time}] ===\n`;
console.log(buildHeader);
console.log(build.output);
buf.push(buildHeader, build.output);

const vulnHeader = `=== Vulncheck [${vulncheck.time}] ===\n`;
console.log(vulnHeader);
console.log(vulncheck.output);
buf.push(vulnHeader, vulncheck.output);

if (!build.ok || !vulncheck.ok) {
  const failed = [!build.ok && 'build', !vulncheck.ok && 'vulncheck'].filter(Boolean).join(' + ');
  const failMsg = `${failed} failed. [total: ${elapsed(totalStart)}]`;
  console.error(failMsg);
  buf.push(failMsg);
  if (fileMode) writeOutput(buf.join('\n'));
  process.exit(1);
}

const doneMsg = `\n=== Done [codegen: ${codegen.time}, fmt: ${fmt.time}, lint: ${lint.time}, typecheck: ${typecheck.time}, build: ${build.time}, vulncheck: ${vulncheck.time}, total: ${elapsed(totalStart)}] ===`;
console.log(doneMsg);
buf.push(doneMsg);

if (fileMode) writeOutput(buf.join('\n'));

// --- file output helper ---
function writeOutput(content) {
  const lines = content.split('\n');
  const ext = extname(outputFile);
  const base = basename(outputFile, ext);
  const dir = dirname(outputFile);

  if (lines.length <= splitLines) {
    writeFileSync(outputFile, content, 'utf8');
    console.log(`Output written to ${outputFile}`);
    return;
  }

  const files = [];
  for (let i = 0; i < lines.length; i += splitLines) {
    const partNum = Math.floor(i / splitLines) + 1;
    const partPath = join(dir, `${base}-part${partNum}${ext}`);
    writeFileSync(partPath, lines.slice(i, i + splitLines).join('\n'), 'utf8');
    files.push(partPath);
  }
  console.log(`Output written to ${files.join(', ')} (${files.length} files)`);
}
