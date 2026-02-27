#!/usr/bin/env node
/**
 * Renames backend/internal/errors → backend/internal/apperrors
 *
 * 1. Changes `package errors` → `package apperrors` in source files
 * 2. Renames the directory
 * 3. Updates all import paths and call sites across the backend
 *
 * Usage:
 *   node scripts/rename-errors-to-apperrors.mjs --dry-run   # Preview changes
 *   node scripts/rename-errors-to-apperrors.mjs              # Apply changes
 */
import { readFileSync, writeFileSync, readdirSync, renameSync, statSync } from 'fs';
import { join, resolve, sep } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const ROOT = resolve('.');
const BACKEND = join(ROOT, 'apps', 'backend');
const ERRORS_PKG = join(BACKEND, 'internal', 'errors');
const APPERRORS_PKG = join(BACKEND, 'internal', 'apperrors');

if (DRY_RUN) console.log('=== DRY RUN — no files will be modified ===\n');

// ── Step 1: Rename package declaration in source files ─────────────────────
console.log('Step 1: Updating package declaration in internal/errors/*.go ...');
const pkgDir = DRY_RUN ? ERRORS_PKG : ERRORS_PKG; // read from current location
const pkgFiles = readdirSync(pkgDir).filter(f => f.endsWith('.go'));
for (const file of pkgFiles) {
  const fp = join(pkgDir, file);
  let c = readFileSync(fp, 'utf-8');
  const before = c;
  c = c.replace(/^package errors$/m, 'package apperrors');
  c = c.replace(/^package errors_test$/m, 'package apperrors_test');
  if (c !== before) {
    if (!DRY_RUN) writeFileSync(fp, c);
    console.log(`  ${file}`);
  }
}

// ── Step 2: Rename directory ───────────────────────────────────────────────
console.log('\nStep 2: Renaming directory internal/errors → internal/apperrors ...');
if (!DRY_RUN) {
  renameSync(ERRORS_PKG, APPERRORS_PKG);
}
console.log(DRY_RUN ? '  [dry-run] Would rename directory' : '  Done.');

// ── Step 3: Fix imports & call sites in all Go files ───────────────────────
console.log('\nStep 3: Fixing imports and call sites ...');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'vendor' || entry.name.startsWith('.')) continue;
      out.push(...walk(full));
    } else if (entry.name.endsWith('.go')) {
      out.push(full);
    }
  }
  return out;
}

const allGoFiles = walk(BACKEND);
let fixed = 0;

// In dry-run the directory is still named "errors"; in real run it's "apperrors"
const skipDir = DRY_RUN ? ERRORS_PKG : APPERRORS_PKG;

for (const fp of allGoFiles) {
  // Skip files inside the errors/apperrors package itself
  if (fp.startsWith(skipDir + sep) || fp.startsWith(skipDir + '/')) continue;

  let content = readFileSync(fp, 'utf-8');
  const original = content;

  const hasCustomImport = content.includes('"backend/internal/errors"');
  const hasStdlibImport = /\t"errors"/.test(content);

  // Quick check: does this file reference our custom errors symbols?
  const usesCustom = hasCustomImport || (hasStdlibImport &&
    /\berrors\.(New[A-Z]|Code[A-Z]|Category|RouterError|PlatformError|ProtocolError|ValidationError|AuthError|NetworkError|ResourceError|InternalError|IsRouterError|GetRouterError|IsCategory|IsRecoverable|Wrap|ErrorPresenter|ErrorRecoverer|ToGraphQL|LogLevel|ErrorFields|LogError|NewErrorLogger|Redact|IsSensitive|SuggestedFix|DocsURL|TroubleshootingSteps|HTTPStatusCode|GetRequestID|IsProductionMode|WithRequestID|WithProductionMode|RequestIDKey|ProductionModeKey)/.test(content));

  if (!hasCustomImport && !usesCustom) continue;

  // ── Fix import path ──────────────────────────────────────────────────
  if (hasCustomImport) {
    content = content.replace('"backend/internal/errors"', '"backend/internal/apperrors"');
  }

  // For files with only stdlib "errors" that actually use custom symbols,
  // replace the stdlib import with the custom import
  if (!hasCustomImport && usesCustom && hasStdlibImport) {
    content = content.replace(/\t"errors"/, '\t"backend/internal/apperrors"');
  }

  // ── Fix call sites ───────────────────────────────────────────────────
  // Replace `errors.X` → `apperrors.X` for ALL identifiers EXCEPT
  // stdlib functions: New(, Is(, As(, Unwrap(, Join(
  // The negative lookahead preserves stdlib calls.
  content = content.replace(
    /\berrors\.(?!(?:New|Is|As|Unwrap|Join)\s*\()/g,
    'apperrors.'
  );

  // ── Clean up stdlib import if no longer needed ───────────────────────
  const stillNeedsStdlib = /\berrors\.(New|Is|As|Unwrap|Join)\s*\(/.test(content);
  if (!stillNeedsStdlib) {
    // Remove standalone stdlib import line (tab + "errors" + newline)
    content = content.replace(/\t"errors"\n/g, '');
  }

  if (content !== original) {
    if (!DRY_RUN) writeFileSync(fp, content);
    fixed++;
    const rel = fp.replace(BACKEND + sep, '').replace(BACKEND + '/', '');
    console.log(`  ${rel}`);

    // In dry-run, show a sample of what changed
    if (DRY_RUN) {
      // Show import change
      const origImportMatch = original.match(/^.*"(?:backend\/internal\/)?errors".*$/m);
      const newImportMatch = content.match(/^.*"backend\/internal\/apperrors".*$/m);
      if (origImportMatch && newImportMatch) {
        console.log(`    import: ${origImportMatch[0].trim()}  →  ${newImportMatch[0].trim()}`);
      }
      // Count call site replacements
      const callSiteCount = (original.match(/\berrors\.(?!(?:New|Is|As|Unwrap|Join)\s*\()/g) || []).length;
      if (callSiteCount > 0) {
        console.log(`    call sites: ${callSiteCount} replacements (errors.X → apperrors.X)`);
      }
      // Note if stdlib import was removed
      if (/\t"errors"/.test(original) && !/\t"errors"/.test(content)) {
        console.log(`    stdlib "errors" import: removed (not needed)`);
      } else if (/\t"errors"/.test(content)) {
        console.log(`    stdlib "errors" import: kept (still used)`);
      }
    }
  }
}

console.log(`\n${DRY_RUN ? '[DRY RUN] Would update' : 'Done! Updated'} ${fixed} files.`);
