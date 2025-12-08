#!/usr/bin/env node
/**
 * Bundle Size Validation Script
 * Measures gzipped bundle size and enforces 500KB limit for production build
 * Cross-platform Node.js implementation
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { gzipSync } from 'zlib';

const DIST_DIR = 'dist/apps/connect';
const LIMIT_BYTES = 512000;    // 500KB
const WARN_BYTES = 409600;     // 400KB

/**
 * Recursively find files with specific extensions
 */
function findFiles(dir, extensions) {
  const files = [];
  
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...findFiles(fullPath, extensions));
      } else if (entry.isFile()) {
        const ext = entry.name.split('.').pop().toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist or isn't readable
  }
  
  return files;
}

/**
 * Get gzipped size of a file
 */
function getGzippedSize(filePath) {
  const content = readFileSync(filePath);
  const gzipped = gzipSync(content);
  return gzipped.length;
}

/**
 * Format bytes as human-readable KB
 */
function formatKB(bytes) {
  return Math.round(bytes / 1024);
}

// Main execution
function main() {
  console.log('');
  
  // Check if build directory exists
  try {
    statSync(DIST_DIR);
  } catch {
    console.log('❌ Error: Build directory not found:', DIST_DIR);
    console.log('   Run "npm run build" first');
    process.exit(1);
  }
  
  // Find JavaScript and CSS files
  const jsFiles = findFiles(DIST_DIR, ['js']);
  const cssFiles = findFiles(DIST_DIR, ['css']);
  
  if (jsFiles.length === 0 && cssFiles.length === 0) {
    console.log('❌ Error: No JavaScript or CSS files found in', DIST_DIR);
    process.exit(1);
  }
  
  // Calculate gzipped sizes
  let jsSize = 0;
  let cssSize = 0;
  const details = [];
  
  for (const file of jsFiles) {
    const size = getGzippedSize(file);
    jsSize += size;
    details.push({ file: file.replace(DIST_DIR + '/', ''), size, type: 'JS' });
  }
  
  for (const file of cssFiles) {
    const size = getGzippedSize(file);
    cssSize += size;
    details.push({ file: file.replace(DIST_DIR + '/', ''), size, type: 'CSS' });
  }
  
  const totalSize = jsSize + cssSize;
  
  // Report
  console.log('📦 Bundle Size Report');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('By file:');
  
  // Sort by size descending
  details.sort((a, b) => b.size - a.size);
  
  for (const { file, size, type } of details) {
    const kb = formatKB(size);
    console.log(`  ${type.padEnd(4)} ${file.padEnd(40)} ${kb.toString().padStart(6)} KB`);
  }
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`JavaScript (gzipped): ${formatKB(jsSize).toString().padStart(6)} KB`);
  console.log(`CSS (gzipped):        ${formatKB(cssSize).toString().padStart(6)} KB`);
  console.log(`Total (gzipped):      ${formatKB(totalSize).toString().padStart(6)} KB`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // Validation
  if (totalSize > LIMIT_BYTES) {
    console.log('❌ ERROR: Bundle size exceeds 500KB limit!');
    console.log(`   Current: ${formatKB(totalSize)} KB`);
    console.log(`   Limit:   500 KB`);
    console.log('');
    process.exit(1);
  } else if (totalSize > WARN_BYTES) {
    console.log(`⚠️  WARNING: Bundle size approaching 500KB limit (${formatKB(totalSize)} KB)`);
    console.log('   Consider further optimization');
    console.log('');
  } else {
    console.log('✅ Bundle size OK (under 500KB limit)');
    console.log('');
  }
  
  process.exit(0);
}

main();

