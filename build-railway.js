#!/usr/bin/env node

// Railway-specific build script with timeout handling
import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

function runCommand(command, args, timeout = 300000) { // 5 minute timeout
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, { stdio: 'inherit' });
    
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Command timed out after ${timeout}ms`));
    }, timeout);
    
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

async function build() {
  try {
    // Ensure dist directory exists
    if (!existsSync('dist')) {
      mkdirSync('dist', { recursive: true });
    }

    console.log('Building client with Vite...');
    await runCommand('npx', ['vite', 'build'], 180000); // 3 minute timeout
    
    console.log('Building server with esbuild...');
    await runCommand('npx', ['esbuild', 'server/index.prod.ts', '--platform=node', '--packages=external', '--bundle', '--format=esm', '--outfile=dist/index.js', '--target=node20'], 60000); // 1 minute timeout
    
    console.log('Railway build completed successfully!');
  } catch (error) {
    console.error('Railway build failed:', error.message);
    process.exit(1);
  }
}

build();