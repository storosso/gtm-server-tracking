const http = require('http');
const url = require('url');
const axios = require('axios');

const PORT = Number(process.env.PORT) || 8080;
const FB_PIXEL_ID = process.env.FB_PIXEL_ID;
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

const server = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url, true);

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

  if ((pathname === '/collect' || pathname === '/g/collect') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        if (!body) {
          throw new Error('Empty body');
        }

        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid Content-Type');
        }

        const data = JSON.parse(body);

        if (!data || Object.keys(data).length === 0) {
          throw new Error('Parsed body is empty');
        }

        const response = await axios.post(
          `https://graph.facebook.com/v17.0/${FB_PIXEL_ID}/events`,
          {
            data: [data],
            access_token: FB_ACCESS_TOKEN,
          }
        );

        console.log('✅ Sent to Meta:', response.data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'ok' }));
      } catch (err) {
        console.error('❌ Error processing request:', err.message);
        res.writeHead(400);
        return res.end('Bad request');
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`✅ GTM Server running on port ${PORT}`);
});
