# 🚕 SK Telemetry · Call Taxi Number Masking (Edesy Voice API)

[![Android](https://img.shields.io/badge/Platform-Android%20%7C%20Capacitor-green.svg)](https://capacitorjs.com/)
[![Edesy API](https://img.shields.io/badge/Voice%20Gateway-Edesy%20Telecom-blue.svg)](https://voice-api.edesy.in)
[![Privacy](https://img.shields.io/badge/Number%20Privacy-100%25%20Masked-orange.svg)](#)
[![Theme](https://img.shields.io/badge/UI-Uber%2FOla%20Consumer%20Theme-white.svg)](#)

Production-grade **Call Taxi Number Masking** mobile application built with Capacitor Android and powered by **Edesy Voice Cloud PBX**.

Neither the **Passenger** (`9629661668`) nor the **Driver** (`7871580261`) ever sees each other's private phone number. All calls are connected over standard cellular GSM lines through the **Edesy Virtual Masked Trunk** (`+91 7969002802`).

---

## 📱 Consumer Ride-Hailing Experience (Ola / Uber Style)

1. **Clean White Consumer UI (`#ffffff`)**:
   - Modern, high-contrast ride confirmation screen matching Uber and Ola design standards.
   - Animated SVG route map from **Gandhipuram** to **Coimbatore Airport**.
   - Driver profile with verified badge, star rating (**★ 4.9**), and vehicle details (**White Swift Dzire**).
   - High-visibility vehicle registration badge (**`TN 38 BK 4920`**).
   - Security **`START OTP: 4821`** badge for passenger verification.

2. **One-Tap Private Calling**:
   - Tapping **"Call Driver (Masked)"** triggers an automated **Two-Legged Cloud Bridge**.
   - An animated bottom sheet guides the user: *"Please answer incoming call from +91 7969002802 to talk to your driver."*
   - Leg 1 calls Passenger (`9629661668`); when answered, Leg 2 instantly rings Driver (`7871580261`).
   - Both parties talk on their phone's native dialer over real cellular lines with 100% privacy.

3. **In-App Trip Settings Modal (`⚙️`)**:
   - Configure active Passenger and Driver 10-digit SIM numbers on the fly.
   - Pre-configured defaults: Passenger `9629661668`, Driver `7871580261`.

---

## 🏗️ Technical Architecture & Telephony Protocol

```
                        CLICK-TO-CALL CLOUD BRIDGE
┌──────────────────┐                               ┌───────────────┐
│ Passenger Phone  │                               │ Driver Phone  │
│   (9629661668)   │                               │ (7871580261)  │
└────────┬─────────┘                               └───────▲───────┘
         │                                                 │
         │ 1. Rings incoming from +91 7969002802           │ 2. Rings incoming
         │    (Passenger answers)                          │    from +91 7969002802
         │                                                 │    (Driver answers)
         │           ┌───────────────────────────┐         │
         └───────────┤   Edesy Voice Cloud PBX   ├─────────┘
                     │   (voice-api.edesy.in)    │
                     └─────────────▲─────────────┘
                                   │
                                   │ POST /v1/masking/calls
                                   │ { party_a, party_b }
                     ┌─────────────┴─────────────┐
                     │ Permanent Backend Proxy   │
                     │ (Render 24/7 CORS Engine) │
                     │ sk-call-taxi-masking      │
                     │ .onrender.com             │
                     └─────────────▲─────────────┘
                                   │ HTTPS fetch()
                     ┌─────────────┴─────────────┐
                     │ Mobile App (Android APK)  │
                     └───────────────────────────┘
```

### Why Direct Dialing (`tel:+917969002802`) Fails vs Why Cloud Bridge Works
- Virtual numbers like `+91 7969002802` are **outbound-only PRI/SIP trunks**. Carriers (Jio, Airtel, Vi) reject inbound SIM calls with `SIP 486 Busy` or `SIP 603 Decline`.
- The only way to connect a masked call is via **Two-Legged Outbound Bridge** (`POST /v1/masking/calls`), where the PBX calls both parties.

### Permanent Voice Proxy & CORS Solution
- Edesy's gateway omits `Access-Control-Allow-Origin` on HTTP `OPTIONS` preflight requests from arbitrary origins, causing standard browser `fetch()` calls in WebViews and mobile browsers to drop.
- **Solution:** Calls route through the permanent backend proxy **`https://sk-call-taxi-masking.onrender.com/v1/masking/calls`**, which injects full CORS headers (`Access-Control-Allow-Origin: *`), automatically normalizes 10-digit Indian phone numbers, and bridges directly to `voice-api.edesy.in`.
- In-app **Diagnostic Test Button** (`⚡ Test Connection`) allows instantaneous verification of backend proxy availability and latency directly from the user's phone.

---

## 📡 Edesy Voice API Reference

### 1. Initiate Masked Call (Click-to-Call)
```http
POST https://voice-api.edesy.in/v1/masking/calls
Authorization: Bearer vp_4d70661cad114d5b5a3243df2f16767a4d88aaf55f889195ef74f36ea67e0895
Content-Type: application/json

{
  "party_a": "9629661668",
  "party_b": "7871580261"
}
```

### Success Response (HTTP 201 Created):
```json
{
  "data": {
    "call_sid": "e7f3fb7c-8ada-449d-946c-31b1dcefbb8d",
    "status": "initiated",
    "party_a": "9629661668",
    "party_b": "7871580261",
    "masked_number": "917969002802"
  },
  "meta": {
    "timestamp": "2026-09-29T04:28:20Z"
  }
}
```

### 2. Query Live CDR Call Status
```bash
curl -s https://voice-api.edesy.in/v1/masking/calls/<call_sid>   -H "Authorization: Bearer vp_4d70661cad114d5b5a3243df2f16767a4d88aaf55f889195ef74f36ea67e0895"
```

---

## 🚀 Live Deployment & Auto-Update Architecture

The Android APK is configured with Capacitor live server URL pointing to GitHub Pages:
- **Live URL:** `https://sreeram0242-bot.github.io/sk-call-taxi-masking/`
- **Auto-Update:** Every commit pushed to `main` updates the app on all installed phones within 60 seconds without reinstalling the APK.

---

## 📋 Pre-Flight Checklist

- [x] Edesy API token verified and active.
- [x] Tested with real SIM cards (`9629661668` & `7871580261`).
- [x] Virtual DID `+91 7969002802` caller ID verified.
- [x] CORS preflight solved via Cloudflare edge proxy.
- [x] Modern white-theme Ola/Uber consumer UI.
- [x] Capacitor safe-area notch insets configured.
