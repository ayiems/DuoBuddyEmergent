const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = __dirname;
const BACKEND_URL = 'http://127.0.0.1:8001'; // Backend proxy on port 8001

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

// Content Security Policy
const CSP_HEADER = [
  "default-src 'self'",
  "img-src 'self' https://res.cloudinary.com https://quickchart.io data: blob:",
  "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
  "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
  "connect-src 'self' https://*.emergentagent.com https://duobuddy.my",
  "font-src 'self' data:",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

// Proxy API requests to backend
function proxyApiRequest(req, res) {
  const parsedUrl = url.parse(req.url);
  const options = {
    hostname: '127.0.0.1',
    port: 8001,
    path: parsedUrl.path,
    method: req.method,
    headers: {
      ...req.headers,
      host: '127.0.0.1:8001'
    }
  };

  console.log(`Proxying ${req.method} ${parsedUrl.path} to backend`);

  const proxyReq = http.request(options, (proxyRes) => {
    // Forward status code and headers
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(502);
    res.end(JSON.stringify({ error: 'Bad Gateway', message: err.message }));
  });

  // Forward request body if present
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Proxy API requests to backend
  if (req.url.startsWith('/api/')) {
    return proxyApiRequest(req, res);
  }

  // Serve frontend files
  let filePath = path.join(FRONTEND_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    // If not a file, serve index.html for SPA routing
    filePath = path.join(FRONTEND_DIR, 'index.html');
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      // Security headers
      const headers = {
        'Content-Type': contentType,
        'Content-Security-Policy': CSP_HEADER,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      };
      
      res.writeHead(200, headers);
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running at http://0.0.0.0:${PORT}/`);
  console.log(`Proxying /api/* requests to ${BACKEND_URL}`);
  console.log(`CSP enabled: ${CSP_HEADER}`);
});
