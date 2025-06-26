#!/usr/bin/env node

// Railway-specific build script that ensures all dependencies are available
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

try {
  // Ensure dist directory exists
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true });
  }

  console.log('Installing build dependencies...');
  execSync('npm install vite esbuild @vitejs/plugin-react @tailwindcss/vite tailwindcss autoprefixer postcss', { stdio: 'inherit' });
  
  console.log('Building client with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  console.log('Building server with esbuild...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  console.log('Railway build completed successfully!');
} catch (error) {
  console.error('Railway build failed:', error.message);
  process.exit(1);
}