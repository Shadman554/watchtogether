#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

function log(message) {
  console.log(`[Simple Build] ${message}`);
}

function runCommand(command, args, timeout = 180000) {
  return new Promise((resolve, reject) => {
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
    log('Starting Railway build...');
    
    // Simple Vite config without chunking
    const simpleConfig = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client", "src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
  },
  root: path.resolve(process.cwd(), "client"),
  build: {
    outDir: path.resolve(process.cwd(), "dist/public"),
    emptyOutDir: true
  }
});`;

    writeFileSync('vite.build.js', simpleConfig);
    
    log('Building frontend...');
    await runCommand('npx', ['vite', 'build', '--config', 'vite.build.js']);
    
    log('Building server...');
    await runCommand('npx', ['esbuild', 'server/index.prod.ts', '--bundle', '--platform=node', '--format=esm', '--outfile=dist/index.js', '--packages=external']);
    
    log('Build completed!');
    
  } catch (error) {
    log(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

build();