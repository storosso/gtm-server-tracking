const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

const FB_PIXEL_ID = process.env.FB_PIXEL_ID;
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Health check
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// GA4 → Meta CAPI handler
app.post(['/collect', '/g/collect'], async (req, res) => {
  try {
    const event = req.body;

    if (!event || !event.event_name) {
      console.error('Invalid event body:', event);
      return res.status(400).json({ error: 'Missing event_name or body is malformed' });
    }

    const payload = {
      data: [{
        event_name: event.event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: event.page_location || '',
        user_data: {
          client_ip_address: req.ip,
          client_user_agent: req.get('User-Agent')
        },
        custom_data: {
          currency: event.currency || 'EUR',
          value: event.value || 0
        }
      }]
    };

    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${FB_PIXEL_ID}/events?access_token=${FB_ACCESS_TOKEN}`,
      payload
    );

    res.status(200).json({ success: true, fb_response: response.data });
  } catch (err) {
    console.error('Error forwarding to Meta CAPI:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to forward to Meta CAPI' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ GTM Server running on port ${PORT}`);
});
