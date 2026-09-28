const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT) || 3001;
const DEFAULT_EDESY_URL = process.env.EDESY_URL || "https://voice-api.edesy.in/v1/masking/calls";
const MAX_BODY_BYTES = 32 * 1024;
const appFile = path.join(__dirname, "index.html");

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Demo-Mode",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  // Handle CORS Preflight
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Demo-Mode",
      "Access-Control-Max-Age": "86400"
    });
    return response.end();
  }

  // Health check endpoint
  if (request.method === "GET" && (url.pathname === "/health" || url.pathname === "/api/health")) {
    return sendJson(response, 200, {
      status: "ok",
      server: "SK Telemetry Call Shield Proxy",
      edesyConfigured: true,
      upstreamUrl: DEFAULT_EDESY_URL,
      virtualDid: "+917969002802"
    });
  }

  // Serve Single-Page Demo App
  if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    });
    return fs.createReadStream(appFile).pipe(response);
  }

  // Serve Web App Manifest for PWA installation
  if (request.method === "GET" && url.pathname === "/manifest.json") {
    const manifestFile = path.join(__dirname, "manifest.json");
    if (fs.existsSync(manifestFile)) {
      response.writeHead(200, { "Content-Type": "application/manifest+json" });
      return fs.createReadStream(manifestFile).pipe(response);
    }
  }

  // Handle Number Masking Call
  if (request.method !== "POST" || (!url.pathname.endsWith("/v1/masking/calls") && !url.pathname.endsWith("/api/masking/calls"))) {
    return sendJson(response, 404, { error: "Endpoint not found" });
  }

  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
      request.destroy();
      return sendJson(response, 413, { error: "Request body is too large" });
    }
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return sendJson(response, 400, { error: "Request body must be valid JSON" });
  }

  const rawPartyA = String(payload.party_a || "").trim();
  const rawPartyB = String(payload.party_b || "").trim();
  const digitsA = rawPartyA.replace(/\D/g, "");
  const digitsB = rawPartyB.replace(/\D/g, "");

  if (digitsA.length < 10 || digitsB.length < 10 || digitsA === digitsB) {
    return sendJson(response, 400, {
      error: "Provide two different valid 10-digit Indian phone numbers (Party A and Party B)"
    });
  }

  const isDemo = payload.demo === true || request.headers["x-demo-mode"] === "true";
  const defaultApiKey = "vp_4d70661cad114d5b5a3243df2f16767a4d88aaf55f889195ef74f36ea67e0895";
  const apiKey = process.env.EDESY_API_KEY || String(request.headers.authorization || "").replace(/^Bearer\s+/i, "") || defaultApiKey;
  const defaultVirtualDid = "+917969002802";

  // If Demo mode is explicitly requested
  if (isDemo) {
    const mockSid = `csid_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const virtualDid = payload.virtual_did || defaultVirtualDid;
    return sendJson(response, 200, {
      status: "success",
      call_sid: mockSid,
      masked_number: virtualDid,
      message: "Call initiated successfully. Edesy is bridging Driver and Customer privately.",
      provider: "Edesy Number Masking (Simulation)",
      party_a: rawPartyA.startsWith("+") ? rawPartyA : `+91${digitsA.slice(-10)}`,
      party_b: rawPartyB.startsWith("+") ? rawPartyB : `+91${digitsB.slice(-10)}`,
      created_at: new Date().toISOString()
    });
  }

  // Format numbers for Edesy: 10-digit format
  const edesyPartyA = digitsA.length === 10 ? digitsA : digitsA.slice(-10);
  const edesyPartyB = digitsB.length === 10 ? digitsB : digitsB.slice(-10);

  const targetUrl = payload.upstream_url || DEFAULT_EDESY_URL;

  try {
    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        party_a: edesyPartyA,
        party_b: edesyPartyB
      })
    });

    const responseText = await upstream.text();
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = { raw: responseText };
    }

    // If Edesy returns success with call_sid, enrich response with virtual DID if needed
    if ((upstream.status === 200 || upstream.status === 201) && typeof parsedData === "object") {
      if (parsedData.data && !parsedData.data.masked_number) {
        parsedData.data.masked_number = payload.virtual_did || defaultVirtualDid;
      }
      if (!parsedData.masked_number) {
        parsedData.masked_number = (parsedData.data && parsedData.data.masked_number) || payload.virtual_did || defaultVirtualDid;
      }
    }

    sendJson(response, upstream.status, parsedData);
  } catch (error) {
    sendJson(response, 502, {
      error: "Unable to reach Edesy Voice API server",
      detail: error.message,
      targetUrl
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n======================================================`);
  console.log(`🚕 SK Telemetry / Call Shield Proxy is RUNNING`);
  console.log(`🌐 Local access:   http://localhost:${PORT}`);
  console.log(`📡 Edesy Endpoint: ${DEFAULT_EDESY_URL}`);
  console.log(`🔑 Server API Key: ${process.env.EDESY_API_KEY ? "Configured (Active)" : "None (Client token or Demo Mode)"}`);
  console.log(`======================================================\n`);
});
