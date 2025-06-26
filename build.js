#!/usr/bin/env node

import { execSync } from 'child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

try {
  // Ensure dist directory exists
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true });
  }

  console.log('Building client...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  console.log('Creating production server...');
  // Create a simplified JavaScript server for Railway deployment
  const jsServerContent = `
import express from "express";
import { registerRoutes } from "../server/routes.js";
import fs from "fs";
import path from "path";

function log(message, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(\`\${formattedTime} [\${source}] \${message}\`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const requestPath = req.path;
  let capturedJsonResponse;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (requestPath.startsWith("/api")) {
      let logLine = \`\${req.method} \${requestPath} \${res.statusCode} in \${duration}ms\`;
      if (capturedJsonResponse) {
        logLine += \` :: \${JSON.stringify(capturedJsonResponse)}\`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Production mode - serve static files
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(\`Could not find the build directory: \${distPath}, make sure to build the client first\`);
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(\`serving on port \${port}\`);
  });
})();
`;
    
  writeFileSync('dist/index.js', jsServerContent);
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}