#!/usr/bin/env node

// Railway-specific build script that ensures all dependencies are available
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

try {
  // Ensure dist directory exists
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true });
  }

  console.log('Building client with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  console.log('Building server with esbuild...');
  execSync('npx esbuild server/index.prod.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js --target=node20', { stdio: 'inherit' });
  
  console.log('Railway build completed successfully!');
} catch (error) {
  console.error('Railway build failed:', error.message);
  process.exit(1);
}