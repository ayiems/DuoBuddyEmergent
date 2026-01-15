const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = __dirname;

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
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://*.emergentagent.com https://duobuddy.my",
  "font-src 'self' data:",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // For SPA routing, always serve index.html for non-file requests
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
  console.log(`CSP enabled: ${CSP_HEADER}`);
});
