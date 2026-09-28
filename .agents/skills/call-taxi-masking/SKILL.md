---
name: call-taxi-masking
description: Expert architectural guide, rules, and troubleshooting runbook for Call Taxi Number Masking applications using Telecom Voice APIs (Edesy, Twilio, Exotel) and Capacitor Android apps. Use this whenever building or debugging ride-hailing apps, number masking, virtual DID routing, or mobile phone call bridges.
---

# 🚕 Call Taxi Number Masking & Telecom Voice Integration Skill

This skill documents critical architectural principles, telecom realities, API specifications, and design guidelines learned from real-world Call Taxi number masking implementations.

---

## 1. Core Architectural Realities (Telecom & Number Masking)

### ❌ The Fatal Mistake: Direct Phone Dialer (`tel:`) to Virtual DID
- **What was attempted**: Opening the phone's native dialer with the virtual DID: `<a href="tel:+917969002802">Call Driver</a>`.
- **What happens in reality**: The user taps Call on their phone. The carrier (Jio, Airtel, Vi) routes the call to Edesy's SIP/PRI trunk. Because the trunk DID is dedicated to outbound masking and has no inbound routing session enrolled, the carrier immediately returns `486 Busy` or `603 Decline`.
- **User experience**: **The phone flashes, does not ring, and hangs up in under 0.5 seconds.**

### ✅ The Industry Standard Solution: Click-to-Call Cloud Bridge
Real-world ride-hailing services (Ola, Uber, Rapido) **never** have the passenger call an unmapped DID directly from a dialer. Instead, they use a **Cloud-Initiated Bridge**:
1. Passenger taps **"Call Driver (Masked)"** inside the app.
2. The app invokes the Voice API: `POST /v1/masking/calls` with Party A (Passenger) and Party B (Driver).
3. The Cloud PBX places an outbound call to Party A's phone.
4. Party A's phone rings with an incoming cellular GSM call showing Caller ID: `+91 7969002802` (Masked DID).
5. As soon as Party A answers on their normal phone screen, the Cloud PBX dials Party B (Driver), also displaying `+91 7969002802`.
6. Both parties speak through the secure bridge.
7. **Privacy Result**: Neither party ever sees the other party's personal phone number. Both numbers are 100% masked.

---

## 2. Edesy Voice API Reference & Best Practices

### API Host & Authentication
- **Correct Base URL**: `https://voice-api.edesy.in` (Do NOT use `voice.edesy.in` which is an inactive domain).
- **Authentication Header**:
```http
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

### Initiate Masked Call (Click-to-Call)
- **Endpoint**: `POST https://voice-api.edesy.in/v1/masking/calls`
- **Payload**:
```json
{
  "party_a": "9629661668",
  "party_b": "7871580261"
}
```
- **Success Response (HTTP 201 Created)**:
```json
{
  "data": {
    "call_sid": "c991e637-cd69-46be-847a-11189449c730",
    "status": "initiated",
    "party_a": "9629661668",
    "party_b": "7871580261",
    "masked_number": "917969002802"
  },
  "meta": {
    "timestamp": "2026-09-28T15:19:34Z"
  }
}
```

### Query Call Status & Hangup Cause
- **Endpoint**: `GET https://voice-api.edesy.in/v1/masking/calls/{call_sid}`
- **Response Fields to Inspect**:
  - `data.status`: `initiated` | `completed` | `failed`
  - `data.hangup_cause`: `normal` | `failed` | `no_answer`
  - `data.duration_sec`: Call duration in seconds.
  - `data.recording_url`: Call recording link.

---

## 3. Troubleshooting & Common Pitfalls Runbook

| Symptom / Complaint | Root Cause | Fix / Correct Action |
| :--- | :--- | :--- |
| **"Call got hanged up not even ringing"** | User dialed virtual DID (+91 7969002802) from mobile phone dialer. Virtual trunk lines reject unmapped inbound calls. | Trigger `POST /v1/masking/calls` via Cloud Bridge instead of opening `tel:` dialer. User answers incoming ring from virtual DID. |
| **"In edesy history it shows wrong mobile number history"** | Edesy web portal dashboard displays cached test calls from earlier when sample dummy numbers (9876543210 / 9876543211) were used in test scripts. Real calls are located in the **Call Logs** tab or require refreshing the browser page. | 1. Never leave dummy numbers in default inputs.<br>2. Direct the user to the **Call Logs** menu in Edesy portal to see actual completed calls. |
| **"Call cuts as soon as target answers"** | One of the phone numbers is identical to the other, or target carrier blocked simultaneous incoming SIP leg. | Ensure `party_a` and `party_b` are two different, active 10-digit SIM cards with valid network coverage. |
| **"Dialer opened the real number of driver"** | Fallback link was set to `tel:<driver_real_number>`. | Never expose the real number in the dialer. Keep all calling strictly through the masked Cloud Bridge. |
| **"App looks like a developer sandbox / in-app fake call"** | Simulated HUD screens with fake ringtones and audio waveforms instead of real mobile telephony. | Remove all fake VoIP modals. Build an authentic Uber/Ola white-theme ride confirmation UI. When the call is initiated, the phone's native telephony app rings. |
| **"Settings button or modals not responding"** | JavaScript syntax error in script block silently prevents execution of global functions. | Validate entire client JS with syntax check (`new Function(code)`) before committing. Also provide multiple accessible entry points (header gear, driver card, and action row button). |

---

## 4. UI/UX Standard for Call Taxi Confirmation Screens

When building ride-hailing client applications:
1. **Visual Style**: Clean, high-contrast **White Background (#ffffff)** matching Uber/Ola native apps. No dark cyberpunk or developer dashboard styles unless explicitly requested.
2. **Ride Confirmation Essentials**:
   - **Driver Card**: Photo avatar, verified badge, rating (e.g. 4.9 stars), driver name, total trips.
   - **Vehicle Details**: Model (e.g. Swift Dzire Tour Sedan), registration plate (e.g. `TN 38 BK 4920`).
   - **Trip OTP**: Distinctive start-trip PIN badge (e.g. `START OTP: 4821`).
   - **Route Summary**: Pickup `Gandhipuram` to Drop `Airport CJB`, distance and fare.
   - **Animated Map**: City grid with moving taxi icon along route.
3. **Primary Call Action**:
   - Prominent green button: **"Call Driver (Masked)"**.
   - Clear subtext banner: *"Number Masking Active: Your real number is 100% private. Calls connect via +91 7969002802."*
   - On tap: Instantly initiates Cloud Bridge and displays feedback: *"Calling your phone... Answer to connect privately with Driver."*

---

## 5. Android APK Auto-Update Architecture (Capacitor + GitHub Pages)

To prevent clients from needing to re-download or reinstall APKs after every bug fix:
1. Set Capacitor to load the live web application in `capacitor.config.json`:
```json
{
  "appId": "com.sk.calltaximasking",
  "appName": "SK Taxi",
  "webDir": "www",
  "server": {
    "url": "https://<github-username>.github.io/<repo-name>/",
    "cleartext": true
  }
}
```
2. Configure GitHub Pages to build from the `main` branch.
3. Any changes pushed to `index.html` on `main` are served live within 60 seconds to any device running the APK.
4. Keep `www/index.html` synchronized with `index.html` so offline fallbacks continue to function.

---

## 6. Pre-Flight Checklist for Future Projects

Before handing off any number masking app to a client:
- [ ] Confirm Edesy API token has positive wallet balance (INR >= 3.00).
- [ ] Test `POST /v1/masking/calls` with two distinct real mobile numbers.
- [ ] Verify both phones ring and the call duration records in Edesy CDR.
- [ ] Ensure no dummy phone numbers (9876543210) exist in default configuration or storage.
- [ ] Verify that tapping "Call" initiates Cloud Bridge, NOT direct unmapped dialer `tel:`.
- [ ] Confirm white-theme Ola/Uber layout with zero "sandbox" or "demo" badges.
