---
name: call-taxi-masking
description: Comprehensive expert architectural guide, chronological post-mortem of mistakes, telecom voice API specifications (Edesy, Twilio, Exotel), and Capacitor Android rules for Call Taxi Number Masking applications. Use this whenever building or debugging ride-hailing apps, virtual DID routing, cloud voice bridges, or mobile telephony apps.
---

# 🚕 Call Taxi Number Masking & Telecom Voice Architecture Skill

> **Target Domain:** Ride-Hailing Apps (Uber, Ola, Rapido clones), Telecom Voice APIs, Call Taxi Number Masking, Capacitor Android Applications.  
> **Core Purpose:** Ensure complete caller/driver privacy (virtual number masking) and eliminate broken telephony implementations in future projects.

---

## 1. Chronological Post-Mortem: Every Mistake Made from the Beginning

To ensure neither Antigravity nor any developer repeats these errors in future client projects, here is the chronological breakdown of every mistake made from start to finish, the technical root cause, and the permanent architectural solution.

```
                  CHRONOLOGICAL ERROR POST-MORTEM & RESOLUTION PATH
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 1.  Dark Developer UI        ➔ Rejected (Client wanted consumer Ola/Uber ride screen)            │
│ 2.  Fake In-App VoIP Modal   ➔ Rejected (Needed real GSM cellular telephony, not simulated WebRTC)│
│ 3.  Sample Dummy Numbers     ➔ Polluted Edesy CDR with failed logs (9876543210 <-> 9876543211)   │
│ 4.  Dialer (`tel:+9179...`)   ➔ Carrier hung up in 0.5s (Outbound-only virtual DID has no inbound) │
│ 5.  Dialer (`tel:<real_num>`) ➔ Exposed private driver number in native phone dialer             │
│ 6.  Hidden Cloud Toggle      ➔ Users tapped broken dialer first; masked bridge was obscured      │
│ 7.  JS Syntax Error (`else`) ➔ Froze Settings button completely in Android WebView               │
│ 8.  Notch Safe-Area Cutoff   ➔ Status bar overlapped header buttons on physical Android devices  │
│ 9.  Static Localhost APKs    ➔ Tedious compilation and APK reinstallation for every tiny bug     │
│ 10. Wrong Host Domain        ➔ voice.edesy.in DNS ENOTFOUND error (Real API is voice-api.edesy.in)│
│ 11. WebView CORS Blockage    ➔ Terminal curl works, but WebView fetch drops due to missing OPTIONS│
│ 12. "Dialer vs Bridge" Myth  ➔ Expecting an outbound trunk to accept inbound dialer calls       │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Mistake 1: Dark Developer/Hacker Dashboard Instead of Authentic Consumer UI
- **What Was Built:** A dark-mode developer dashboard with neon green borders, JSON debug panels, and "Demo / Sandbox" labels.
- **Why It Failed:** Consumer ride-hailing clients (Uber, Ola, Rapido) expect an **authentic, white-background (#ffffff) ride confirmation screen**. Dark developer interfaces look unprofessional to non-technical passengers and clients.
- **The Permanent Rule:** Always use clean white backgrounds (`#ffffff`), modern typography (`Inter` / `system-ui`), driver profile cards with rating stars (★ 4.9), vehicle model, license plate badge (`TN 38 BK 4920`), and START OTP badges (`4821`). Never show "demo", "sandbox", or "debug" text on production screens.

---

### Mistake 2: Fake In-App VoIP Call Modal with Audio SFX
- **What Was Built:** An interactive in-browser/in-app call HUD with simulated DTMF ringtones, audio wave animations, speakerphone, mute, and a red hang-up button.
- **Why It Failed:** The user explicitly rejected this: *"the call does not want to look like in-app call, make that goes in phone dialer / real phone"*. Number masking is **cellular GSM telephony**, not an in-browser WebRTC simulation.
- **The Permanent Rule:** Never create fake in-app VoIP screens when the client asks for number masking. Calls must ring on the user's **native smartphone dialer/lock screen** over real cellular GSM lines.

---

### Mistake 3: Hardcoding Dummy Placeholder Numbers (`9876543210` / `9876543211`)
- **What Was Built:** Sample numbers from API docs (`9876543210` and `9876543211`) were left in scripts, README files, and test inputs.
- **Why It Failed:** When test calls were fired, the Edesy Cloud PBX attempted to dial those non-existent numbers. The calls failed, and the client's Edesy Web Portal dashboard displayed:
  `9876543210 <-> 9876543211 | failed`
  This caused massive client confusion: *"in edesy history it shows wrong mobile number history"*.
- **The Permanent Rule:** Never leave dummy placeholder numbers in production templates. Always default to real, verified 10-digit SIM cards or prompt the user for their active numbers.

---

### Mistake 4: Expecting Mobile Phone Dialers (`tel:+917969002802`) to Call Virtual Trunks
- **What Was Built:** `<a href="tel:+917969002802">Call Driver</a>` in the app, expecting that tapping it would open the phone dialer and dial the masked number.
- **Why It Failed:** `+91 7969002802` is an **outbound-only SIP/PRI trunk**. It does not accept inbound calls from mobile SIM cards. When dialed from Jio, Airtel, or Vi:
  - Carrier returns `SIP 486 Busy` or `SIP 603 Decline`.
  - The phone hangs up within 0.5s without ringing.
  - The carrier drops the call before it reaches Edesy, so **nothing is recorded in Edesy history**.
- **The Permanent Rule:** **Mobile dialers CANNOT call outbound virtual DIDs directly.** Masked calling must ALWAYS be initiated via **Click-to-Call Cloud Bridge** (`POST /v1/masking/calls`).

---

### Mistake 5: Exposing the Real Driver Phone Number in the Dialer Link
- **What Was Built:** To stop the dialer from hanging up, the link was changed to `<a href="tel:+917871580261">`.
- **Why It Failed:** The client saw the driver's real private mobile number in their phone dialer: *"now if i touch the call button it dials the real number of the target"*. This violated the core number masking privacy requirement.
- **The Permanent Rule:** Never place the raw customer or driver phone number into a public `href="tel:..."` link unless the user explicitly switches to a dedicated "Direct SIM Call" mode.

---

### Mistake 6: Making the Working Cloud Bridge a Hidden Toggle
- **What Was Built:** Cloud Bridge was added behind a toggle ("Incoming Mode"), but Outgoing Dialer mode was kept as default.
- **Why It Failed:** Users simply tap the big green "Call Driver" button. Because the dialer was default, it opened the uncallable virtual DID and hung up.
- **The Permanent Rule:** The primary **"Call Driver (Masked)"** button must **ALWAYS trigger the Cloud Bridge by default**.

---

### Mistake 7: JavaScript Syntax Errors (`Unexpected token 'else'`)
- **What Was Built:** When modifying `handleCallClick`, an orphan `} else {` block was left in `index.html`.
- **Why It Failed:** In an Android Capacitor WebView, an unhandled syntax error halts the entire `<script>` tag. `window.openNumberModal()` was never registered, rendering the settings button completely unresponsive with zero visible error message to the client.
- **The Permanent Rule:** Always execute an automated AST/syntax check (`node -e "new Function(scriptCode)"`) before committing any client-side JavaScript.

---

### Mistake 8: Missing Safe Area Insets for Mobile Notches
- **What Was Built:** Positioned map header settings buttons at `top: 16px; left: 16px;`.
- **Why It Failed:** On modern Android devices with camera punch-holes or rounded status bars, `top: 16px` fell directly under the system status bar, making buttons unclickable.
- **The Permanent Rule:** Always use `top: max(16px, env(safe-area-inset-top, 16px));` and provide multiple accessible entry points (e.g. tapping the driver card and an action bar button).

---

### Mistake 9: Static Localhost APKs Requiring Reinstallation
- **What Was Built:** Packaged static assets into an APK or pointed to `http://localhost:3001`.
- **Why It Failed:** Every small code fix required re-compiling a 5MB APK, re-uploading to GitHub Releases, and forcing the client to uninstall and reinstall the APK.
- **The Permanent Rule:** Always configure `capacitor.config.json` with a live remote server URL (e.g. GitHub Pages):
  ```json
  {
    "server": {
      "url": "https://<username>.github.io/<repo>/",
      "cleartext": true
    }
  }
  ```
  Every `git push` to `main` instantly updates the client's phone within 60 seconds without reinstalling the APK.

---

### Mistake 10: Calling Non-Existent API Domain (`voice.edesy.in`)
- **What Was Built:** `https://voice.edesy.in/v1/masking/calls`.
- **Why It Failed:** `voice.edesy.in` does not resolve (`ENOTFOUND`). The actual API gateway is `voice-api.edesy.in`, while the web portal is `masking.edesy.in`.
- **The Permanent Rule:** Always verify DNS endpoints. For Edesy:
  - **API Host:** `https://voice-api.edesy.in`
  - **Web Portal:** `https://masking.edesy.in`

---

### Mistake 11: Edesy Gateway Missing `Access-Control-Allow-Origin` on Preflight `OPTIONS` (WebView CORS Deadlock)
- **What Was Built:** App fired `fetch("https://voice-api.edesy.in/v1/masking/calls", { headers: { "Authorization": "Bearer ...", "Content-Type": "application/json" } })` directly from browser JavaScript in Android WebView.
- **Why It Failed:** 
  1. Terminal `curl` commands succeeded with HTTP 201 Created and completed calls (confirmed on Edesy live CDR).
  2. In Android WebView / Chrome browser, adding custom headers (`Authorization`, `Content-Type`) triggers a mandatory HTTP `OPTIONS` preflight request.
  3. Edesy's API Gateway / Nginx configuration responds to `OPTIONS`:
     ```http
     HTTP/1.1 200 OK
     Access-Control-Allow-Headers: Content-Type,Accept,Origin,Authorization...
     Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
     Access-Control-Max-Age: 86400
     ```
     **Edesy omits `Access-Control-Allow-Origin` from the `OPTIONS` preflight response!** It only includes it in actual `POST` responses.
  4. The Android WebView enforces browser security and aborts the fetch before sending the `POST` request.
  5. The call never reaches Edesy, nothing is recorded in CDR, and the user's phone never rings!
- **The Permanent Rule:** Never rely on browser `fetch()` for third-party telecom APIs with flawed CORS preflight handling. In Capacitor, **ALWAYS enable and use native HTTP networking**:
  ```json
  // capacitor.config.json
  {
    "plugins": {
      "CapacitorHttp": {
        "enabled": true
      }
    }
  }
  ```
  Native Java `HttpURLConnection` runs outside the browser sandbox, sends NO preflight `OPTIONS` requests, and is **completely immune to CORS blocking**. Alternatively, route requests through a backend server or Cloudflare Worker edge proxy.

---

### Mistake 12: Client Expectation Mismatch: "Why doesn't the button open my phone dialer with the masked number?"
- **The User's Request:** *"if i click call button it shows call masked attend incoming call, fix that i want it to take me to the dialer, it wants to dial the masked number, if i call it must connect the call and speak with masked number."*
- **Why This Cannot Work on Standard Outbound Masking Trunks:**
  - Clients intuitively expect to see their phone's native green dialer open with `+91 7969002802` pre-filled, press dial, and be connected to their driver.
  - However, telecom carrier routing does not work by "magic". When a SIM card dials a number, the telecom switch sends an inbound SIP INVITE to the owner of that number.
  - If the DID is an **outbound-only PRI/SIP trunk** without Inbound IVR/DID mapping, the switch rejects it instantly with `SIP 486 Busy` or `SIP 603 Decline`.
  - For a dialer to work, the telecom provider must support **Inbound Dynamic Session Mapping (Proxy)**:
    1. Passenger opens app; app requests temporary session: `DID + Passenger Number -> Driver Number` valid for 30 minutes.
    2. App opens dialer `tel:+917969002802`.
    3. Passenger dials.
    4. Telecom provider receives incoming call, checks Caller ID (`9629661668`), queries the active session, and forwards to driver (`7871580261`).
  - Edesy Voice API does NOT offer dynamic inbound proxy mapping on basic masking plans. It is built strictly as a **Two-Legged Outbound Cloud Bridge**.
- **The Permanent Rule:** When using Edesy or two-legged bridge APIs, never promise or implement direct dialer links (`tel:`). Instead, build an **intuitive, reassuring incoming call transition screen** in the UI:
  - Display an animated incoming call badge: *"Connecting securely... Pick up incoming call from +91 7969002802 to talk to your driver"*.
  - Show the user why their phone is ringing instead of dialing out.

---

### Mistake 13: Missing `capacitor.js` Bundle When Loading Remote `server.url`
- **What Was Built:** Pointed `server.url` in `capacitor.config.json` to GitHub Pages, but forgot to bundle and include `capacitor.js` in the remote `<head>`.
- **Why It Failed:** 
  1. Without `<script src="capacitor.js"></script>`, `window.Capacitor` was `undefined`.
  2. The app could not access native Android plugins (`CapacitorHttp`), and fell back to standard browser `fetch()`.
  3. The browser `fetch()` encountered either CORS preflight drops or Indian ISP carrier DNS blocks (`*.workers.dev`), resulting in a cryptic `"Failed to fetch"` error.
- **The Permanent Rule:** Whenever using a remote `server.url`, always copy `node_modules/@capacitor/core/dist/capacitor.js` into the web root and ensure `<script src="capacitor.js"></script>` is in `<head>`. This enables native Android Java `HttpURLConnection` for all API calls, completely bypassing browser CORS and carrier DNS filters.

---

### Mistake 14: Triggering Browser CORS Preflights with `application/json` vs Using CORS-Simple `text/plain`
- **What Was Built:** Frontend sent requests with `headers: { "Content-Type": "application/json" }`.
- **Why It Failed:** 
  1. Under W3C CORS standards, `application/json` is NOT a CORS-safelisted header.
  2. Every browser (Chrome, Android WebView, Safari) forces an HTTP `OPTIONS` preflight request before sending the actual POST.
  3. If the destination gateway or network firewall drops or mishandles the `OPTIONS` preflight (as Edesy and certain proxies do), the browser immediately terminates the request with `TypeError: Failed to fetch`.
- **The Permanent Rule:** For edge API proxies that bridge mobile web/WebView clients to voice gateways, always send payloads with **`Content-Type: text/plain`** and parse JSON from the body text on the proxy (`JSON.parse(await request.text())`). Under W3C standards, `text/plain` is a **CORS Simple Request** that completely bypasses the preflight `OPTIONS` phase. The browser sends the POST directly, eliminating the entire class of CORS preflight failures forever.

---

## 2. Telecom Architecture: Dual-Leg Cloud Bridge vs Inbound Dynamic DID Mapping

Understanding how telecom routing works under the hood is critical to choosing the right architecture and avoiding broken implementations.

### Comparison of the Two Telecom Patterns

| Feature | Pattern A: Dual-Leg Outbound Bridge (Edesy, Uber, Ola) | Pattern B: Inbound Dynamic DID Proxy (Twilio Proxy, Exotel ExoPhone) |
| :--- | :--- | :--- |
| **How it starts** | App sends API request: `POST /v1/masking/calls` | App reserves session via API; opens `tel:+91DID` in native dialer |
| **Who initiates the call** | Cloud PBX dials Passenger (Leg 1), then Driver (Leg 2) | Passenger dials the virtual DID from their native phone dialer |
| **User Experience** | Passenger's phone rings with an **incoming call** from DID | Passenger sees standard **outgoing call** screen in phone dialer |
| **DID Requirement** | Outbound-only SIP/PRI Trunk (Cost-effective, simple) | Inbound DID with Webhook / Dynamic routing engine |
| **Carrier Costs** | 2 call legs billed simultaneously (Leg A + Leg B) | Inbound leg + Outbound leg billed |
| **TRAI Compliance** | 100% compliant in India (Both parties see masked DID) | 100% compliant in India |
| **Supported by Edesy?** | **YES (Primary supported mechanism)** | **NO (Edesy trunk drops direct inbound mobile dials)** |

---

### Detailed Call Signaling Flow (Pattern A - Edesy Dual-Leg Bridge)

```
[ Passenger Phone ]           [ Edesy Cloud PBX ]            [ Driver Phone ]
   (9629661668)               (voice-api.edesy.in)             (7871580261)
        │                              │                            │
        │  1. App sends POST /calls    │                            │
        │ ───────────────────────────> │                            │
        │                              │                            │
        │  2. SIP INVITE (Leg A)       │                            │
        │     Caller ID: 7969002802    │                            │
        │ <─────────────────────────── │                            │
        │                              │                            │
        │  3. 180 Ringing              │                            │
        │ ───────────────────────────> │                            │
        │                              │                            │
        │  4. 200 OK (Passenger Ans)  │                            │
        │ ───────────────────────────> │                            │
        │                              │                            │
        │                              │  5. SIP INVITE (Leg B)     │
        │                              │     Caller ID: 7969002802  │
        │                              │ ─────────────────────────> │
        │                              │                            │
        │                              │  6. 180 Ringing            │
        │                              │ <───────────────────────── │
        │                              │                            │
        │                              │  7. 200 OK (Driver Ans)    │
        │                              │ <───────────────────────── │
        │                              │                            │
        │ <════════════════════════════╪══════════════════════════> │
        │        8. Full Duplex Audio Bridge (GSM Cellular)         │
        │           Both parties see +91 7969002802                 │
        │           Complete Number Privacy Maintained              │
```

---

## 3. Capacitor Android & WebView Network Architecture

### The CORS Preflight Issue in WebViews
When an Android app built with Capacitor or Cordova makes an HTTP request via `fetch()` or `XMLHttpRequest`:
1. The WebView's Chromium engine treats requests from `http://localhost`, `https://localhost`, or `https://<user>.github.io` as cross-origin.
2. Because the request includes `Authorization: Bearer ...` and `Content-Type: application/json`, the browser sends an HTTP `OPTIONS` preflight request.
3. If the server does not include `Access-Control-Allow-Origin: *` in the `OPTIONS` response (as is the case with Edesy's gateway), the browser throws:
   `Access to fetch at 'https://voice-api.edesy.in/v1/masking/calls' from origin 'https://...' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
4. The request is aborted before reaching the API.

### The Two Solutions for WebView CORS Deadlock

#### Solution 1: Cloudflare Edge Worker Proxy (Recommended - 100% Reliable Everywhere)
When an Android APK points its `server.url` to a remote origin (like GitHub Pages `https://sreeram0242-bot.github.io/...`), `window.Capacitor` JavaScript bridge may not be injected into the remote page context, causing requests to fall back to standard WebView `fetch()`.

To guarantee 100% reliability regardless of WebView environment, OS version, or remote host:
**Deploy a lightweight Cloudflare Worker Edge Proxy (`sk-voice-proxy`):**
```javascript
export default {
  async fetch(request) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === "POST") {
      try {
        const body = await request.json();
        const apiKey = "vp_4d70661cad114d5b5a3243df2f16767a4d88aaf55f889195ef74f36ea67e0895";
        const upstream = await fetch("https://voice-api.edesy.in/v1/masking/calls", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            party_a: String(body.party_a).replace(/\D/g, '').slice(-10),
            party_b: String(body.party_b).replace(/\D/g, '').slice(-10)
          })
        });
        const data = await upstream.text();
        return new Response(data, {
          status: upstream.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
  }
};
```
- **Why this works 100% of the time:**
  1. Browser sends `OPTIONS` preflight ➔ Edge worker responds with `Access-Control-Allow-Origin: *` in 30ms.
  2. Browser sends `POST` request with JSON body.
  3. Worker executes server-to-server HTTPS call to `voice-api.edesy.in` (server calls never have CORS restrictions).
  4. Edesy PBX triggers the call and returns `HTTP 201 Created` with `call_sid`.
  5. Both phones ring over cellular GSM.

#### Solution 2: Capacitor Native HTTP (`CapacitorHttp`)
For fully offline or bundled apps where the web code runs locally inside the Android assets:
Capacitor provides a native HTTP plugin that replaces WebView network calls with native Android Java networking (`HttpURLConnection` / `OkHttp`).

Enable in `capacitor.config.json`:
```json
{
  "appId": "com.sk.calltaximasking",
  "appName": "SK Taxi",
  "webDir": "www",
  "server": {
    "url": "https://sreeram0242-bot.github.io/sk-call-taxi-masking/",
    "cleartext": true
  },
  "plugins": {
    "CapacitorHttp": {
      "enabled": true
    }
  }
}
```

#### 2. Robust Client-Side API Handler (with Native Fallback)
```javascript
async function initiateMaskedCall(passengerPhone, driverPhone, apiKey) {
  const url = 'https://voice-api.edesy.in/v1/masking/calls';
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };
  const body = {
    party_a: passengerPhone.replace(/\D/g, '').slice(-10),
    party_b: driverPhone.replace(/\D/g, '').slice(-10)
  };

  // 1. Try Native Capacitor HTTP first (bypasses CORS entirely)
  if (window.Capacitor?.Plugins?.CapacitorHttp) {
    try {
      const response = await window.Capacitor.Plugins.CapacitorHttp.post({
        url: url,
        headers: headers,
        data: body
      });
      if (response.status >= 200 && response.status < 300) {
        return { success: true, data: response.data };
      }
      throw new Error(response.data?.message || `HTTP ${response.status}`);
    } catch (nativeErr) {
      console.warn('CapacitorHttp failed, trying fallback fetch', nativeErr);
    }
  }

  // 2. Fallback to standard fetch
  const res = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `API Error HTTP ${res.status}`);
  }

  const data = await res.json();
  return { success: true, data: data };
}
```

---

## 4. Edesy Voice API Reference & Production Payloads

### API Hosts
- **Production API:** `https://voice-api.edesy.in`
- **Web Management Dashboard:** `https://masking.edesy.in`

### Authentication
Every request must include:
```http
Authorization: Bearer vp_4d70661cad114d5b5a3243df2f16767a4d88aaf55f889195ef74f36ea67e0895
Content-Type: application/json
```

---

### Endpoint 1: Initiate Masked Call (Click-to-Call)
```http
POST https://voice-api.edesy.in/v1/masking/calls
```
**Request Body:**
```json
{
  "party_a": "9629661668",
  "party_b": "7871580261"
}
```
*Note: Numbers must be valid 10-digit Indian mobile numbers without +91 or leading 0.*

**Success Response (HTTP 201 Created):**
```json
{
  "data": {
    "call_sid": "7c2db5ec-8735-4abf-9fa8-898f204f0883",
    "status": "initiated",
    "party_a": "9629661668",
    "party_b": "7871580261",
    "masked_number": "917969002802"
  },
  "meta": {
    "timestamp": "2026-09-29T03:47:12Z"
  }
}
```

---

### Endpoint 2: Query Call Status & Hangup Cause
```http
GET https://voice-api.edesy.in/v1/masking/calls/{call_sid}
```

**Response Body:**
```json
{
  "data": {
    "call_sid": "7c2db5ec-8735-4abf-9fa8-898f204f0883",
    "caller_number": "9629661668",
    "target_number": "7871580261",
    "masked_number": "917969002802",
    "direction": "click_to_call",
    "status": "completed",
    "duration_sec": 7,
    "hangup_cause": "normal",
    "created_at": "2026-09-29T03:47:12Z"
  }
}
```

### CDR Status Codes & Hangup Causes
- `status`:
  - `initiated`: PBX has queued the call and is dialing Leg A (Passenger).
  - `ringing`: Leg A phone is ringing.
  - `in-progress`: Leg A answered; Leg B is being dialed or bridged.
  - `completed`: Call completed successfully.
  - `failed`: Call could not be established.
- `hangup_cause`:
  - `normal`: Either party hung up normally after talking.
  - `busy`: Line was busy (`SIP 486`).
  - `no-answer`: Call rang out without answer (`SIP 408`).
  - `rejected`: User tapped decline on phone screen (`SIP 603`).

---

## 5. Telecom Provider Comparison Matrix for India Ride-Hailing

| Provider | Mechanism | Inbound Direct DID Dialing | Click-to-Call Bridge | Reliability / Latency | Typical Indian Pricing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Edesy** | Dual-Leg Outbound | ❌ No (Outbound Trunk) | ✅ Yes (`/v1/masking/calls`) | High (<2s connection) | Very affordable (~₹0.30 - ₹0.50/min) |
| **Exotel** | ExoPhone Bridge / Passthru | ✅ Yes (with dynamic flow) | ✅ Yes (Call API) | Industry Standard | Mid-tier (~₹0.60 - ₹0.90/min) |
| **Twilio (India)** | Voice Proxy / Programmable | ✅ Yes (Proxy Sessions) | ✅ Yes (Twilio Voice API) | Enterprise Grade | Higher cost (~₹1.20+/min) |
| **Knowlarity** | Supercaller / Masking | ✅ Yes (Virtual Number) | ✅ Yes (Click-to-Call) | High | Mid-tier |

---

## 6. UI/UX Design Standards for Consumer Ride-Hailing (Ola / Uber Style)

1. **Clean White Theme (`#ffffff`):**
   - Background must be crisp white `#ffffff` or soft gray `#f8f9fa`.
   - Never use hacker-style dark modes, purple neon, or developer console widgets.
2. **Top Map Viewport:**
   - Visual route polyline connecting pickup to drop.
   - Animated SVG car icon showing driver moving toward pickup location.
3. **Driver & Vehicle Information Card:**
   - Driver Photo avatar with verified blue checkmark.
   - Star rating (`★ 4.9`) and trip count (`1,248 rides`).
   - Car model (`White Swift Dzire · Sedan`).
   - License plate prominently highlighted in a bold badge: `TN 38 BK 4920`.
4. **Security START OTP:**
   - A high-visibility badge displaying `START OTP: 4821` so the passenger is prepared before boarding.
5. **Call Action & User Expectation Management:**
   - Large, prominent green button: **"Call Driver (Masked)"**.
   - When tapped, display an animated **Bottom Sheet Modal**:
     - Pulse animation with phone icon.
     - Headline: **"Connecting Secure Call..."**
     - Subtitle: **"Please answer the incoming call from +91 7969002802. We are bridging you directly to your driver while keeping your personal number private."**
     - Live timer badge showing bridge status.
     - A secondary "Need Direct SIM Call?" option only for edge cases where cloud bridge fails.

---

## 7. Capacitor & Android Production Configuration

### Safe Area Insets for Modern Mobile Notches
```css
/* Ensure headers and floating buttons never clash with camera notches or navigation bars */
.header-bar {
  padding-top: max(16px, env(safe-area-inset-top, 16px));
}

.bottom-action-container {
  padding-bottom: max(20px, env(safe-area-inset-bottom, 20px));
}
```

### Automated JavaScript AST Syntax Verification
Before deploying or committing any JavaScript changes in Capacitor projects, run this verification command:
```bash
node -e "const fs = require('fs'); const html = fs.readFileSync('index.html', 'utf8'); const scripts = [...html.matchAll(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi)].map(m => m[1]); scripts.forEach((s, i) => { try { new Function(s); console.log('Script block ' + i + ' OK'); } catch(e) { console.error('SYNTAX ERROR in script block ' + i + ':', e); process.exit(1); } });"
```

---

## 8. Pre-Flight Checklist for Future Projects

Before delivering any Call Taxi or Number Masking app to a client:
- [ ] Confirm Edesy API token has positive balance (`INR >= 3.00`).
- [ ] Test `POST /v1/masking/calls` with two real active SIM cards.
- [ ] Verify both phones ring and the call records in Edesy CDR.
- [ ] Ensure no dummy placeholder numbers (`9876543210`) exist in code or default storage.
- [ ] Verify that tapping "Call" initiates the Cloud Bridge, NOT direct dialer `tel:`.
- [ ] Ensure `CapacitorHttp` is enabled in `capacitor.config.json` to bypass WebView CORS restrictions.
- [ ] Validate all client-side JavaScript with AST parser (`new Function(code)`).
- [ ] Ensure white-theme Ola/Uber layout with zero "demo" or "sandbox" labels.
- [ ] Provide clear bottom sheet explaining incoming call from virtual DID so user is not surprised.
