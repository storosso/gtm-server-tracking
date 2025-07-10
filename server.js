const http = require('http');
const url = require('url');

const PORT = Number(process.env.PORT) || 8080;
const FB_PIXEL_ID = process.env.FB_PIXEL_ID;
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

const server = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url, true);

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Health check
  if (pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('OK');
  }

  // POST to /collect
  if ((pathname === '/collect' || pathname === '/g/collect') && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body);
        if (!parsed || Object.keys(parsed).length === 0) {
          console.error('❌ Invalid event body:', parsed);
          res.writeHead(400);
          return res.end('Invalid body');
        }

        // Send to Meta CAPI
        const axios = require('axios');
        const payload = {
          data: [parsed],
          access_token: FB_ACCESS_TOKEN
        };

        const response = await axios.post(
          `https://graph.facebook.com/v17.0/${FB_PIXEL_ID}/events`,
          payload
        );

        console.log('✅ Sent to Meta:', response.data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } catch (err) {
        console.error('❌ Error processing request:', err.message);
        res.writeHead(500);
        res.end('Server error');
      }
    });
    return;
  }

  // 404 fallback
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`✅ GTM Server running on port ${PORT}`);
});
