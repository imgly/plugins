#!/usr/bin/env node
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const server = createServer(async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    let filePath;
    if (req.url === '/' || req.url === '/test') {
      filePath = resolve(__dirname, 'browser-test.html');
    } else {
      // Serve files from project root
      filePath = resolve(projectRoot, req.url.slice(1));
    }
    
    console.log(`Serving: ${filePath}`);
    
    const content = await readFile(filePath);
    
    // Set content type based on extension
    const ext = extname(filePath).toLowerCase();
    const contentTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.mjs': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.pdf': 'application/pdf'
    };
    
    const contentType = contentTypes[ext] || 'text/plain';
    res.setHeader('Content-Type', contentType);
    
    res.writeHead(200);
    res.end(content);
    
  } catch (error) {
    console.error(`Error serving ${req.url}:`, error.message);
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`Test page: http://localhost:${PORT}/test`);
});

export { server };