const http = require('http');
const url = require('url');

const PORT = Number(process.env.PORT) || 8080;
const FB_PIXEL_ID = process.env.FB_PIXEL_ID;
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

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

  if (pathname === '/collect' || pathname === '/g/collect') {
    let body = '';
    req.on('data', chunk => { body += chunk });
    req.on('end', async () => {
      if (!body || body.trim().length === 0) {
        console.error('❌ Empty request body');
        res.writeHead(400);
        return res.end('Missing request body');
      }

      try {
        const eventData = JSON.parse(body);
        console.log('✅ Received event:', JSON.stringify(eventData, null, 2));

        const response = await fetch(`https://graph.facebook.com/v19.0/${FB_PIXEL_ID}/events?access_token=${FB_ACCESS_TOKEN}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: [eventData],
            test_event_code: eventData.test_event_code || undefined
          })
        });

        const fbRes = await response.json();
        console.log('📡 Meta response:', fbRes);

        res.writeHead(200);
        res.end('Event forwarded to Meta');
      } catch (err) {
        console.error('❌ JSON parse error or request failed:', err.message);
        res.writeHead(500);
        res.end('Server error');
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 GTM Server listening on port ${PORT}`);
});
