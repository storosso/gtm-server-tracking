req.on('end', async () => {
  if (!body || body.trim().length === 0) {
    console.error('❌ Empty request body');
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Empty request body' }));
  }

  try {
    const eventData = JSON.parse(body);
    console.log('📥 Received CAPI event:', eventData);

    const forwardBody = {
      data: [eventData],
      // test_event_code: 'TEST123' // adaugă pentru testare în Events Manager
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
    return res.end(JSON.stringify({ error: 'Invalid or malformed JSON' }));
  }
});
