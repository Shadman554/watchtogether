#!/usr/bin/env node

import { execSync } from 'child_process';

try {
  console.log('Building client...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  console.log('Building server...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}