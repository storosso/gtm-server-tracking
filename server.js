const http = require('http');
const url = require('url');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 8080;
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

  if (pathname === '/collect') {
    let body = '';

    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const eventData = JSON.parse(body);

        console.log('📥 Received CAPI event:', eventData);

        // Mutăm fbp și fbc în user_data
        const event = {
          ...eventData,
          user_data: {
            ...eventData.user_data,
            fbp: eventData.fbp || undefined,
            fbc: eventData.fbc || undefined,
          }
        };

        // Eliminăm fbp și fbc din nivelul superior
        delete event.fbp;
        delete event.fbc;

        const forwardBody = {
          data: [event]
        };

        const fbRes = await fetch(`https://graph.facebook.com/v17.0/${FB_PIXEL_ID}/events?access_token=${FB_ACCESS_TOKEN}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(forwardBody),
        });

        const fbResult = await fbRes.json();
        console.log('📤 Sent to Meta CAPI:', fbResult);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'forwarded', fbResult }));
      } catch (err) {
        console.error('❌ Failed to process request:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 GTM Server listening on port ${PORT}`);
});
