#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import path from 'path';

function log(message) {
  console.log(`[Build] ${message}`);
}

function runCommand(command, args, timeout = 300000) {
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
    log('Starting build process...');
    
    // Create optimized Vite config for production build
    const productionViteConfig = `
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
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-button']
        }
      }
    }
  }
});`;

    writeFileSync('vite.config.temp.js', productionViteConfig);
    
    // Build frontend
    log('Building frontend...');
    await runCommand('npx', ['vite', 'build', '--config', 'vite.config.temp.js'], 180000);
    
    // Create bundled server
    log('Building server...');
    await runCommand('npx', [
      'esbuild',
      'server/index.prod.ts',
      '--bundle',
      '--platform=node',
      '--format=esm',
      '--outfile=dist/index.js',
      '--external:@neondatabase/serverless',
      '--external:drizzle-orm',
      '--external:ws',
      '--external:express',
      '--external:nanoid',
      '--external:zod'
    ]);
    
    log('Build completed successfully!');
    
    // Cleanup
    if (existsSync('vite.config.temp.js')) {
      await runCommand('rm', ['vite.config.temp.js']);
    }
    
  } catch (error) {
    log(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

build();