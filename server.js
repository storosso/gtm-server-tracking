const http = require("http");
const url = require("url");

const PORT = process.env.PORT || 8080;
const FB_PIXEL_ID = process.env.FB_PIXEL_ID;
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

const server = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url, true);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("OK");
  }

  if (pathname === "/collect" || pathname === "/g/collect") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", async () => {
      try {
        if (!body || !body.trim()) {
          console.error("❌ Empty request body");
          res.writeHead(400);
          return res.end("Empty request body");
        }

        const event = JSON.parse(body);
        console.log("✅ Received event:", event);

        // Clean event and prepare Meta payload
        const payload = {
          data: [
            {
              event_name: event.event_name,
              event_time: Math.floor(Date.now() / 1000),
              event_source_url: event.event_source_url || "https://storosso.com",
              action_source: "website",
              client_user_agent: req.headers["user-agent"] || "unknown",
              user_data: {
                client_ip_address: req.socket.remoteAddress,
                client_user_agent: req.headers["user-agent"],
                fbp: event.fbp || undefined,
                fbc: event.fbc || undefined
              },
              custom_data: {
                value: event.value,
                currency: event.currency,
                contents: event.contents
              },
              test_event_code: event.test_event_code || undefined
            }
          ]
        };

        const fbResponse = await fetch(
          `https://graph.facebook.com/v17.0/${FB_PIXEL_ID}/events?access_token=${FB_ACCESS_TOKEN}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }
        );

        const result = await fbResponse.json();
        console.log("📡 Meta response:", result);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, fb: result }));
      } catch (err) {
        console.error("❌ Error:", err);
        res.writeHead(500);
        res.end("Internal Server Error");
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`🚀 GTM Server listening on port ${PORT}`);
});
