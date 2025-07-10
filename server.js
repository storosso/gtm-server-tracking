
const http = require('http');
const url = require('url');

const PORT = Number(process.env.PORT) || 8080;

const server = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url, true);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Health check
  if (pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('OK');
  }

  // GTM Server Tag endpoint
  if (pathname === '/collect' || pathname === '/g/collect') {
    let body = '';
    req.on('data', chunk => { body += chunk });
    req.on('end', () => {
      if (!body || body.trim().length === 0) {
        console.error('❌ Empty request body');
        res.writeHead(400);
        return res.end('Bad Request: Empty body');
      }

      try {
        const data = JSON.parse(body);
        console.log('✅ Received event:', JSON.stringify(data, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'ok' }));
      } catch (err) {
        console.error('❌ JSON parse error:', err.message);
        res.writeHead(400);
        return res.end('Bad Request: Invalid JSON');
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`🚀 GTM Server listening on port ${PORT}`);
});
