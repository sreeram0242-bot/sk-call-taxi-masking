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
       MISTAKE CHRONOLOGY IN CALL TAXI MASKING IMPLEMENTATION
┌───────────────────────────────────────────────────────────────────┐
│ 1. Dark Developer UI        ➔ Rejected (Client wanted Ola/Uber)   │
│ 2. Fake In-App VoIP Modal   ➔ Rejected (Needed real GSM telephony)│
│ 3. Sample Dummy Numbers     ➔ Polluted Edesy CDR with failed logs │
│ 4. Dialer (`tel:+9179...`)   ➔ Hung up instantly without ringing   │
│ 5. Dialer (`tel:<real_num>`) ➔ Exposed private driver number      │
│ 6. Hidden Cloud Toggle      ➔ Users tapped broken dialer first    │
│ 7. JS Syntax Error (`else`) ➔ Froze Settings button completely    │
│ 8. Notch Area Insets Cutoff ➔ Header buttons unclickable on phone │
│ 9. Static Localhost APKs    ➔ Constant tedious reinstallations    │
│ 10. Wrong Host Domain       ➔ voice.edesy.in DNS ENOTFOUND error  │
└───────────────────────────────────────────────────────────────────┘
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

## 2. Telecom Architecture: How Number Masking ACTUALLY Works

### Why Direct Dialing (`tel:`) Fails vs Why Cloud Bridge Works

```
❌ BROKEN PATTERN: Direct Dialing an Outbound Virtual Trunk
[ User Phone ] ──(Dials +91 7969002802)──> [ Carrier (Airtel/Jio) ] ──> [ Edesy Trunk Gateway ]
                                                                                   │
                                                         ❌ REJECTED: SIP 486 Busy / 603 Decline
                                                         (Trunk does not accept inbound calls)
                                                         (Hangs up in 0.5s; 0s in CDR)

─────────────────────────────────────────────────────────────────────────────────────────────

✅ WORKING PATTERN: Click-to-Call Cloud Bridge (The Ola / Uber Way)
[ Passenger Phone ]                                                        [ Driver Phone ]
   (9629661668)                                                              (7871580261)
        ▲                                                                         ▲
        │ 1. Rings incoming from +91 7969002802                                   │
        │    (Passenger answers on normal phone)                                  │
        │                                                                         │ 2. Rings incoming
        │                         ┌──────────────────────┐                        │    from +91 7969002802
        └─────────────────────────┤   Edesy Cloud PBX    ├────────────────────────┘
                                  │ (voice-api.edesy.in) │
                                  └──────────────────────┘
                                             ▲
                                             │ HTTP POST /v1/masking/calls
                                             │ { party_a, party_b }
                                    [ Mobile App Screen ]
```

### The Click-to-Call Protocol Steps:
1. **User taps "Call Driver" in the App.**
2. App sends HTTPS request: `POST https://voice-api.edesy.in/v1/masking/calls` with:
   - `party_a`: Passenger phone (`9629661668`)
   - `party_b`: Driver phone (`7871580261`)
3. Edesy Cloud PBX places an **outbound call** to `party_a`.
4. Passenger's phone rings with an incoming cellular call showing Caller ID: `+91 7969002802`.
5. Passenger answers the phone.
6. Edesy immediately dials `party_b`, also displaying Caller ID: `+91 7969002802`.
7. Driver answers. Both parties speak over standard cellular GSM with 100% privacy.

---

## 3. Edesy Voice API Reference & Payloads

### Headers
```http
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

### 1. Initiate Masked Call (Click-to-Call)
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
**Success Response (HTTP 201 Created):**
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

### 2. Query Call Status & Hangup Cause
```http
GET https://voice-api.edesy.in/v1/masking/calls/{call_sid}
```
**Response Object:**
```json
{
  "data": {
    "caller_number": "9629661668",
    "target_number": "7871580261",
    "masked_number": "917969002802",
    "direction": "click_to_call",
    "status": "completed",
    "duration_sec": 34,
    "hangup_cause": "normal",
    "recording_url": "https://voice-api.edesy.in/v1/public/recordings/masking/..."
  }
}
```

---

## 4. UI/UX Design System for Ride-Hailing Apps

### Design Checklist for Passenger Ride Confirmation:
- **Background:** High-contrast pure white (`#ffffff`). Never dark-theme.
- **Top Map Section:** Clean SVG or MapLibre city map with route polyline and animated vehicle marker.
- **Arrival Status:** Bold ETA (`Driver arriving in 3 mins`) + Vehicle subtitle (`White Swift Dzire · Sedan`).
- **Trip OTP Badge:** Prominent verification box: `START OTP: 4821`.
- **Driver Card:** Driver photo avatar, verified shield, star rating (`★ 4.9`), trips count (`1,248 trips`), and license plate (`TN 38 BK 4920`).
- **Primary Action Row:**
  - Big green button: **"Call Driver (Masked)"** (Triggers Cloud Bridge).
  - Clean secondary button: **"Settings"** (Configures phone numbers).
  - Clean secondary button: **"Chat"** (In-app messaging).
- **Route Summary:** Pickup (`Gandhipuram`) ➔ Drop (`Airport CJB`) + Fare (`₹385`).

---

## 5. Android Capacitor Auto-Update Configuration

### `capacitor.config.json`
```json
{
  "appId": "com.sk.calltaximasking",
  "appName": "SK Taxi",
  "webDir": "www",
  "server": {
    "url": "https://sreeram0242-bot.github.io/sk-call-taxi-masking/",
    "cleartext": true
  }
}
```

### Android Manifest Permissions (`android/app/src/main/AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CALL_PHONE" />
<application
    android:usesCleartextTraffic="true" ...>
```

---

## 6. Pre-Flight Checklist for Future Projects

Before delivering any Call Taxi or Number Masking app to a client:
- [ ] Confirm Edesy API token has positive balance (`INR >= 3.00`).
- [ ] Test `POST /v1/masking/calls` with two real active SIM cards.
- [ ] Verify both phones ring and the call records in Edesy CDR.
- [ ] Ensure no dummy placeholder numbers (`9876543210`) exist in code or default storage.
- [ ] Verify that tapping "Call" initiates the Cloud Bridge, NOT direct dialer `tel:`.
- [ ] Validate all client-side JavaScript with AST parser (`new Function(code)`).
- [ ] Ensure white-theme Ola/Uber layout with zero "demo" or "sandbox" labels.
