# 🚕 SK Telemetry · Call Taxi Number Masking Demo (Edesy API)

Demo application showcasing **Number Masking (Call Privacy)** for Call Taxi apps.

Neither the **Driver** nor the **Customer** can see each other's real phone numbers. All calls are connected through an **Edesy Virtual DID (Proxy Line)**.

---

## 🌟 Key Features

1. **Driver Console (டிரைவர் கன்சோல்)**:
   - Live trip request showing passenger name, pickup, destination, and fare.
   - Passenger's phone number is **100% masked** (e.g. `+91 98*** **210`).
   - One-tap **"Call Customer (Masked)"** button.
   - Ride lifecycle controls (Arrived at Pickup ➔ Start Trip with OTP ➔ Complete Ride).

2. **Customer View (பயணிகள் பார்வை)**:
   - "Your driver is arriving in 3 mins" with animated route map (Gandhipuram to Coimbatore Airport).
   - Driver's car and rating with masked phone number (`+91 98*** **211`).
   - One-tap **"Call Driver (Masked)"** button.

3. **Dual Calling Methods (டயலர் மற்றும் கிளவுட் பிரிட்ஜ்)**:
   - **Automated Cloud Bridge (Edesy Voice API)**: When tapped, Edesy calls Party A, then bridges Party B with masked caller ID.
   - **Direct Mobile Phone Dialer (`tel:`)**: Seamlessly opens the phone's native dialer with the virtual DID number.
   - **Interactive Smartphone HUD**: Animated in-browser calling screen with DTMF dial tone, audio waveforms, call timer, mute, speaker, and red hang up button.

4. **API Diagnostics & Architecture Console**:
   - Visual architecture diagram showing Party A ➔ Edesy Cloud PBX ➔ Party B.
   - Live JSON Request and Response payload inspector (`POST /v1/masking/calls`).
   - Quick phone number test sandbox.

5. **Sandbox / Simulation & Live Modes**:
   - Test calls work immediately in Demo Mode even without active API credits.
   - Switch to Live Mode anytime by pasting your Edesy Bearer Token in Settings (`⚙️`).

---

## 🚀 How to Run

1. Open a terminal in this folder:
   ```bash
   node proxy.js
   ```
2. Open your browser at:
   ```
   http://localhost:3001
   ```

---

## 📡 Edesy API Endpoint

- **Upstream URL**: `https://voice-api.edesy.in/v1/masking/calls`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "party_a": "9876543211",
    "party_b": "9876543210"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "call_sid": "csid_...",
    "masked_number": "+918047109283",
    "message": "Call initiated successfully"
  }
  ```
