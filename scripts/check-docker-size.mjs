#!/usr/bin/env node
/**
 * Docker Image Size Validation Script
 * Measures Docker image size and enforces RouterOS container limits
 * Cross-platform Node.js implementation
 */

import { execSync } from 'child_process';

const DEFAULT_IMAGE = 'nasnet:local';
const LIMIT_BYTES = 10 * 1024 * 1024;    // 10MB
const WARN_BYTES = 9 * 1024 * 1024;      // 9MB

function getImageSize(imageName) {
  try {
    // Get uncompressed image size in bytes
    const sizeOutput = execSync(`docker inspect ${imageName} --format="{{.Size}}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    
    return parseInt(sizeOutput, 10);
  } catch (error) {
    return null;
  }
}

function getImageSizeHuman(imageName) {
  try {
    return execSync(`docker images ${imageName} --format "{{.Size}}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch (error) {
    return 'unknown';
  }
}

function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(2);
}

function main() {
  const imageName = process.argv[2] || DEFAULT_IMAGE;
  
  console.log('');
  console.log('🐳 Docker Image Size Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Image: ${imageName}`);
  console.log('');
  
  // Check if Docker is available
  try {
    execSync('docker version', { stdio: 'pipe' });
  } catch (error) {
    console.log('❌ Error: Docker is not running or not installed');
    console.log('   Start Docker Desktop and try again');
    process.exit(1);
  }
  
  // Check if image exists
  const sizeBytes = getImageSize(imageName);
  
  if (sizeBytes === null) {
    console.log(`❌ Error: Image '${imageName}' not found`);
    console.log('   Run docker:build first to create the image');
    process.exit(1);
  }
  
  const sizeHuman = getImageSizeHuman(imageName);
  const sizeMB = formatBytes(sizeBytes);
  
  console.log(`Size (uncompressed): ${sizeHuman} (${sizeMB} MB)`);
  console.log(`RouterOS limit:      10 MB`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  if (sizeBytes > LIMIT_BYTES) {
    console.log('❌ ERROR: Image exceeds 10MB RouterOS container limit!');
    console.log(`   Current: ${sizeMB} MB`);
    console.log(`   Limit:   10 MB`);
    console.log('');
    console.log('Optimization suggestions:');
    console.log('   - Verify UPX compression is applied to rosproxy binary');
    console.log('   - Remove unnecessary files from static build');
    console.log('   - Check for duplicate dependencies');
    process.exit(1);
  } else if (sizeBytes > WARN_BYTES) {
    console.log(`⚠️  WARNING: Image approaching 10MB limit (${sizeMB} MB)`);
    console.log('   Consider further optimization for safety margin');
    console.log('');
  } else {
    console.log(`✅ Image size OK (${sizeMB} MB < 10MB limit)`);
    console.log('');
  }
  
  // Show layer breakdown
  console.log('Layer breakdown:');
  try {
    const history = execSync(`docker history ${imageName} --format "{{.Size}}\t{{.CreatedBy}}" --no-trunc`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    
    const lines = history.split('\n').slice(0, 5);
    for (const line of lines) {
      const [size, cmd] = line.split('\t');
      const shortCmd = cmd ? cmd.slice(0, 60) + (cmd.length > 60 ? '...' : '') : '';
      console.log(`  ${size.padEnd(10)} ${shortCmd}`);
    }
  } catch (error) {
    console.log('  (unable to retrieve layer info)');
  }
  
  console.log('');
  process.exit(0);
}

main();

