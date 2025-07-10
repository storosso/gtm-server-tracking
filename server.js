
const http = require('http');
const url = require('url');

const PORT = 8080;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('OK');
  }

  if (pathname === '/gtm.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    return res.end('// GTM Stub');
  }

  if (pathname === '/gtm/preview') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end('<html><body><h2>Preview Mode</h2></body></html>');
  }

  if (pathname === '/gtm/debug') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    if (query && query.gtm_preview) {
      return res.end('Preview OK');
    }
    return res.end('GTM Server Running');
  }

  if (pathname === '/collect' || pathname === '/g/collect') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      console.log('📦 Received data:', body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'received' }));
    });
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('GTM Server Running');
});

server.listen(PORT, () => {
  console.log(`🚀 GTM Server listening on port ${PORT}`);
});
