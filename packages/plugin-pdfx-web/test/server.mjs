import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = join(__dirname, '..');

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.ts': 'application/javascript', // For source maps
  '.map': 'application/json',
};

const server = createServer(async (req, res) => {
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    let filePath;
    let url = req.url;

    console.log(`Request: ${req.method} ${url}`);

    // Handle root
    if (url === '/') {
      url = '/test/index.html';
    }

    // Map URLs to file paths
    if (url.startsWith('/dist/')) {
      filePath = join(projectRoot, url);
    } else if (url.startsWith('/src/')) {
      filePath = join(projectRoot, url);
    } else if (url.startsWith('/test/')) {
      filePath = join(projectRoot, url);
    } else if (url.startsWith('/node_modules/')) {
      filePath = join(projectRoot, url);
    } else if (url.startsWith('/@privyid/')) {
      // Special handling for @privyid scoped package
      filePath = join(projectRoot, 'node_modules', url.substring(1));
    } else {
      filePath = join(projectRoot, 'test', url);
    }

    // Get file stats
    const stats = await stat(filePath);
    if (!stats.isFile()) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    // Read file
    const content = await readFile(filePath);
    const ext = extname(filePath);
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', content.length);

    // Cache control for development
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    res.writeHead(200);
    res.end(content);
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(404);
    res.end('File not found');
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log('Open http://localhost:3000 to view the test page');
});
