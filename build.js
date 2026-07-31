#!/usr/bin/env node

import { execFileSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, cpSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const runTsc = (args = []) => {
  const tscPath = require.resolve('typescript/bin/tsc');
  execFileSync(process.execPath, [tscPath, ...args], { stdio: 'inherit' });
};

console.log('🔨 Building grspec...\n');

// Clean dist directory
if (existsSync('dist')) {
  console.log('Cleaning dist directory...');
  rmSync('dist', { recursive: true, force: true });
}

// Run TypeScript compiler (use local version explicitly)
console.log('Compiling TypeScript...');
try {
  runTsc(['--version']);
  runTsc();
} catch (error) {
  console.error('\n❌ Build failed!');
  process.exit(1);
}

// Copy non-TS assets that the loader resolves at runtime
const contentSrc = 'src/core/templates/content';
const contentDest = 'dist/core/templates/content';
if (existsSync(contentSrc)) {
  console.log('Copying template content files...');
  mkdirSync(contentDest, { recursive: true });
  cpSync(contentSrc, contentDest, { recursive: true });
}

console.log('\n✅ Build completed successfully!');
