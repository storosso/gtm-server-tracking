const http = require('http');
const url = require('url');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 8080;
const FB_PIXEL_ID = process.env.FB_PIXEL_ID;
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

const server = http.createServer(async (req, res) => {
  const { pathname } = url.parse(req.url, true);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Health check
  if (pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('OK');
  }

  // GTM event receiver
  if (pathname === '/collect' || pathname === '/g/collect') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      if (!body) {
        console.error('❌ Empty request body');
        res.writeHead(400);
        return res.end('Missing body');
      }

      try {
        const eventData = JSON.parse(body);
        console.log('📥 Received event:', JSON.stringify(eventData, null, 2));

        const fbResponse = await fetch(`https://graph.facebook.com/v17.0/${FB_PIXEL_ID}/events?access_token=${FB_ACCESS_TOKEN}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: [eventData],
            test_event_code: eventData.test_event_code || undefined // optional
          })
        });

        const fbResult = await fbResponse.json();
        console.log('📤 Meta response:', JSON.stringify(fbResult, null, 2));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', fb: fbResult }));
      } catch (err) {
        console.error('❌ Error processing request:', err);
        res.writeHead(500);
        res.end('Server error');
      }
    });
    return;
  }

  // Default: Not Found
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`✅ GTM Server listening on port ${PORT}`);
});
