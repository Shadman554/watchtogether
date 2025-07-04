#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, cpSync, mkdirSync } from 'fs';
import path from 'path';

function log(message) {
  console.log(`[Railway Build] ${message}`);
}

function runCommand(command, args, timeout = 300000) { // 5 minute timeout
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });
    
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
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
    
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function build() {
  try {
    log('Starting Railway build process...');
    
    // Build frontend with production config
    log('Building frontend...');
    await runCommand('npx', ['vite', 'build', '--config', 'vite.config.prod.ts'], 180000);
    
    // Ensure dist directory exists
    if (!existsSync('dist')) {
      mkdirSync('dist', { recursive: true });
    }
    
    // Copy shared schema for bundling
    log('Copying shared modules...');
    if (existsSync('shared')) {
      cpSync('shared', 'dist/shared', { recursive: true });
    }
    
    log('Building server...');
    await runCommand('npx', [
      'esbuild', 
      'server/index.prod.ts',
      '--platform=node',
      '--bundle',
      '--format=esm',
      '--outfile=dist/index.js',
      '--packages=external'
    ]);
    
    log('Build completed successfully!');
  } catch (error) {
    log(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

build();