/* eslint-env node */
import { spawn, execSync } from 'child_process';
import { writeFileSync } from 'node:fs';
import { basename, extname, dirname, join } from 'node:path';

process.setMaxListeners(30);

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
const outputFile = outputPath ?? 'check-frontend-output.txt';
const splitLines = splitArg ? parseInt(splitArg, 10) : 1000;

const exclude =
  '@nas-net/source,backend,connectpoc,star-setup-docker,star-setup-web,core-ui-qwik,ros-cmd-generator,star-context,star-setup,@nas-net/connectpoc-e2e';

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

const [lint, typecheck] = await Promise.all([
  run(`npx nx run-many -t lint --quiet --parallel=10 --exclude=${exclude}`),
  run(`npx nx run-many -t typecheck --parallel=10 --exclude=${exclude}`),
]);

const buf = [];

const lintHeader = `=== Lint (errors only) [${lint.time}] ===\n`;
console.log(lintHeader);
console.log(lint.output);
buf.push(lintHeader, lint.output);

const tcHeader = `=== Typecheck [${typecheck.time}] ===\n`;
console.log(tcHeader);
console.log(typecheck.output);
buf.push(tcHeader, typecheck.output);

if (!lint.ok || !typecheck.ok) {
  const failMsg = `Lint or typecheck failed — skipping build. [total: ${elapsed(totalStart)}]`;
  console.error(failMsg);
  buf.push(failMsg);
  if (fileMode) writeOutput(buf.join('\n'));
  process.exit(1);
}

console.log('=== Build connect ===\n');
const buildStart = Date.now();
execSync('npx nx build connect', { stdio: 'inherit' });

const doneMsg = `\n=== Done [build: ${elapsed(buildStart)}, total: ${elapsed(totalStart)}] ===`;
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
