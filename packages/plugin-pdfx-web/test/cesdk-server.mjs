#!/usr/bin/env node

import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const PORT = 3001;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm',
  '.icc': 'application/vnd.iccprofile',
};

function getMimeType(filePath) {
  const ext = extname(filePath);
  return mimeTypes[ext] || 'application/octet-stream';
}

async function serveFile(filePath, res) {
  try {
    const content = await readFile(filePath);
    const mimeType = getMimeType(filePath);

    res.writeHead(200, {
      'Content-Type': mimeType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(content);
  } catch (error) {
    console.error(`Server error: ${error}`);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File not found');
  }
}

const server = createServer(async (req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  let requestPath = req.url;

  // Default to cesdk-integration.html
  if (requestPath === '/') {
    requestPath = '/cesdk-integration.html';
  }

  try {
    let filePath;

    // Handle different file types
    if (requestPath.startsWith('/node_modules/')) {
      // Serve node_modules from project root
      filePath = join(projectRoot, requestPath.substring(1));
    } else if (requestPath.startsWith('/dist/')) {
      // Serve dist files from project root
      filePath = join(projectRoot, requestPath.substring(1));
    } else if (requestPath.startsWith('/src/')) {
      // Serve src files from project root
      filePath = join(projectRoot, requestPath.substring(1));
    } else {
      // Serve test files from test directory
      filePath = join(__dirname, requestPath.substring(1));
    }

    // Check if file exists
    await stat(filePath);
    await serveFile(filePath, res);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(
        `File not found: ${requestPath} (looking at ${requestPath})`
      );
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
    } else {
      console.error(`Server error:`, error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal server error');
    }
  }
});

server.listen(PORT, () => {
  console.log(`CE.SDK test server running at http://localhost:${PORT}`);
  console.log(
    `Open http://localhost:${PORT} to view the CE.SDK integration test`
  );
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});
