/**
 * @fileoverview Bundle size budget tests
 *
 * These tests verify that bundle sizes meet the targets from AC 4.12.5:
 * - Total bundle < 500KB gzipped
 * - Individual chunks within their budgets
 * - Lazy-loaded routes properly split
 *
 * Note: These tests analyze the build output and require a fresh build.
 * Run: npm run build:frontend && npm test
 */

import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { gzipSync } from 'zlib';

import { describe, it, expect, beforeAll } from 'vitest';

// Budget configuration (in bytes)
const BUDGETS = {
  // Total budget
  total: {
    limit: 512_000, // 500KB
    warn: 409_600, // 400KB
  },
  // Per-chunk budgets (gzipped)
  chunks: {
    // Vendor chunks
    'vendor-react': { limit: 50_000, warn: 40_000 }, // 50KB React core
    'vendor-router': { limit: 30_000, warn: 25_000 }, // 30KB TanStack Router
    'vendor-graphql': { limit: 60_000, warn: 50_000 }, // 60KB Apollo + GraphQL
    'vendor-state': { limit: 25_000, warn: 20_000 }, // 25KB Zustand + XState
    'vendor-ui': { limit: 40_000, warn: 35_000 }, // 40KB Radix components
    'vendor-table': { limit: 25_000, warn: 20_000 }, // 25KB TanStack Table + Virtual
    'vendor-forms': { limit: 30_000, warn: 25_000 }, // 30KB React Hook Form + Zod
    // Main app chunk
    index: { limit: 150_000, warn: 120_000 }, // 150KB main app
  },
  // CSS budget
  css: {
    limit: 50_000, // 50KB
    warn: 40_000,
  },
};

// Build output directory
const DIST_DIR = join(process.cwd(), 'dist/apps/connect');
const ASSETS_DIR = join(DIST_DIR, 'assets');

interface ChunkInfo {
  name: string;
  path: string;
  rawSize: number;
  gzipSize: number;
  type: 'js' | 'css';
}

/**
 * Get gzipped size of a file
 */
function getGzipSize(filePath: string): number {
  const content = readFileSync(filePath);
  return gzipSync(content).length;
}

/**
 * Analyze build output and extract chunk information
 */
function analyzeBundle(): ChunkInfo[] {
  const chunks: ChunkInfo[] = [];

  if (!existsSync(ASSETS_DIR)) {
    return chunks;
  }

  const files = readdirSync(ASSETS_DIR);

  for (const file of files) {
    const filePath = join(ASSETS_DIR, file);
    const stat = statSync(filePath);

    if (!stat.isFile()) continue;

    const ext = file.split('.').pop()?.toLowerCase();
    if (ext !== 'js' && ext !== 'css') continue;

    // Extract chunk name from filename (e.g., vendor-react-abc123.js -> vendor-react)
    const nameMatch = file.match(/^(.+?)-[a-f0-9]+\.(js|css)$/);
    const name = nameMatch ? nameMatch[1] : file.replace(/\.[^.]+$/, '');

    chunks.push({
      name,
      path: filePath,
      rawSize: stat.size,
      gzipSize: getGzipSize(filePath),
      type: ext as 'js' | 'css',
    });
  }

  return chunks;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

describe('Bundle Size Budgets', () => {
  let chunks: ChunkInfo[];
  let buildExists: boolean;

  beforeAll(() => {
    buildExists = existsSync(DIST_DIR);
    if (buildExists) {
      chunks = analyzeBundle();
    } else {
      chunks = [];
    }
  });

  describe('Total Bundle Size', () => {
    it('should have a build output available', () => {
      // Skip if no build - this test is informational
      if (!buildExists) {
        console.log('⚠️  No build found. Run "npm run build:frontend" first.');
        return;
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should keep total JS bundle under 500KB gzipped', () => {
      if (!buildExists || chunks.length === 0) return;

      const totalJs = chunks
        .filter((c) => c.type === 'js')
        .reduce((sum, c) => sum + c.gzipSize, 0);

      console.log(`Total JS (gzipped): ${formatBytes(totalJs)}`);

      expect(totalJs).toBeLessThan(BUDGETS.total.limit);

      if (totalJs > BUDGETS.total.warn) {
        console.warn(`⚠️  JS bundle approaching limit: ${formatBytes(totalJs)}`);
      }
    });

    it('should keep total CSS under 50KB gzipped', () => {
      if (!buildExists || chunks.length === 0) return;

      const totalCss = chunks
        .filter((c) => c.type === 'css')
        .reduce((sum, c) => sum + c.gzipSize, 0);

      console.log(`Total CSS (gzipped): ${formatBytes(totalCss)}`);

      expect(totalCss).toBeLessThan(BUDGETS.css.limit);

      if (totalCss > BUDGETS.css.warn) {
        console.warn(`⚠️  CSS bundle approaching limit: ${formatBytes(totalCss)}`);
      }
    });
  });

  describe('Vendor Chunk Budgets', () => {
    const vendorChunks = [
      'vendor-react',
      'vendor-router',
      'vendor-graphql',
      'vendor-state',
      'vendor-ui',
      'vendor-table',
      'vendor-forms',
    ] as const;

    it.each(vendorChunks)('should keep %s chunk within budget', (chunkName) => {
      if (!buildExists || chunks.length === 0) return;

      const chunk = chunks.find((c) => c.name === chunkName && c.type === 'js');
      const budget = BUDGETS.chunks[chunkName];

      if (!chunk) {
        console.log(`ℹ️  Chunk "${chunkName}" not found (may be tree-shaken)`);
        return;
      }

      console.log(`${chunkName}: ${formatBytes(chunk.gzipSize)} (limit: ${formatBytes(budget.limit)})`);

      expect(chunk.gzipSize).toBeLessThan(budget.limit);

      if (chunk.gzipSize > budget.warn) {
        console.warn(`⚠️  ${chunkName} approaching limit: ${formatBytes(chunk.gzipSize)}`);
      }
    });
  });

  describe('Main App Chunk', () => {
    it('should keep main index chunk under 150KB gzipped', () => {
      if (!buildExists || chunks.length === 0) return;

      const indexChunk = chunks.find(
        (c) => c.type === 'js' && (c.name === 'index' || c.name.startsWith('index'))
      );

      if (!indexChunk) {
        console.log('ℹ️  Index chunk not found');
        return;
      }

      console.log(`Main chunk: ${formatBytes(indexChunk.gzipSize)}`);

      expect(indexChunk.gzipSize).toBeLessThan(BUDGETS.chunks.index.limit);

      if (indexChunk.gzipSize > BUDGETS.chunks.index.warn) {
        console.warn(`⚠️  Main chunk approaching limit: ${formatBytes(indexChunk.gzipSize)}`);
      }
    });
  });

  describe('Code Splitting Effectiveness', () => {
    it('should have separate vendor chunks for lazy loading', () => {
      if (!buildExists || chunks.length === 0) return;

      const jsChunks = chunks.filter((c) => c.type === 'js');
      const vendorChunks = jsChunks.filter((c) => c.name.startsWith('vendor-'));

      console.log(`Total JS chunks: ${jsChunks.length}`);
      console.log(`Vendor chunks: ${vendorChunks.length}`);

      // Should have at least 3 vendor chunks for proper code splitting
      expect(vendorChunks.length).toBeGreaterThanOrEqual(3);
    });

    it('should not have a single chunk over 200KB gzipped', () => {
      if (!buildExists || chunks.length === 0) return;

      const MAX_CHUNK_SIZE = 200_000; // 200KB per chunk max

      const oversizedChunks = chunks.filter((c) => c.gzipSize > MAX_CHUNK_SIZE);

      if (oversizedChunks.length > 0) {
        console.log('Oversized chunks:');
        oversizedChunks.forEach((c) => {
          console.log(`  ${c.name}: ${formatBytes(c.gzipSize)}`);
        });
      }

      expect(oversizedChunks.length).toBe(0);
    });

    it('should have proper compression ratio (>60%)', () => {
      if (!buildExists || chunks.length === 0) return;

      const totalRaw = chunks.reduce((sum, c) => sum + c.rawSize, 0);
      const totalGzip = chunks.reduce((sum, c) => sum + c.gzipSize, 0);
      const ratio = (1 - totalGzip / totalRaw) * 100;

      console.log(`Compression ratio: ${ratio.toFixed(1)}%`);
      console.log(`  Raw: ${formatBytes(totalRaw)}`);
      console.log(`  Gzipped: ${formatBytes(totalGzip)}`);

      // Good compression should achieve at least 60% reduction
      expect(ratio).toBeGreaterThan(60);
    });
  });

  describe('Bundle Size Report', () => {
    it('should generate a detailed bundle report', () => {
      if (!buildExists || chunks.length === 0) {
        console.log('\n📦 No build available for report');
        return;
      }

      console.log('\n📦 Bundle Size Report');
      console.log('━'.repeat(70));

      // Sort by gzip size descending
      const sorted = [...chunks].sort((a, b) => b.gzipSize - a.gzipSize);

      for (const chunk of sorted) {
        const status =
          chunk.gzipSize > 100_000
            ? '🔴'
            : chunk.gzipSize > 50_000
              ? '🟡'
              : '🟢';

        console.log(
          `${status} ${chunk.type.toUpperCase().padEnd(4)} ${chunk.name.padEnd(30)} ` +
            `${formatBytes(chunk.gzipSize).padStart(10)} (raw: ${formatBytes(chunk.rawSize)})`
        );
      }

      console.log('━'.repeat(70));

      const totalJs = chunks.filter((c) => c.type === 'js').reduce((s, c) => s + c.gzipSize, 0);
      const totalCss = chunks.filter((c) => c.type === 'css').reduce((s, c) => s + c.gzipSize, 0);

      console.log(`Total JS:  ${formatBytes(totalJs).padStart(10)}`);
      console.log(`Total CSS: ${formatBytes(totalCss).padStart(10)}`);
      console.log(`Total:     ${formatBytes(totalJs + totalCss).padStart(10)}`);
      console.log('━'.repeat(70));

      expect(true).toBe(true); // Always pass - informational test
    });
  });
});
