# Flight Plan — Demo PWA Kit (EN/ES) + Phone Sync (LAN)

This is a **local-only** demo kit to present a minimalist “Flight Plan” surgery-status tracker concept.
It does **not** depend on any hospital backend.

## Views
- **Family view (mobile):** `#/f/B0170`
- **Waiting room display (TV):** `#/display`
- **Presenter controls:** `#/presenter`

## Sync (important)
- Same-device (tabs) sync uses **BroadcastChannel**
- **Phone sync (laptop → phone)** uses the local server:
  - SSE stream: `/api/stream`
  - State endpoint: `/api/state`

So when you run `node server.js`, changing status in Presenter updates your phone automatically.

## Run
```bash
cd flight-plan-demo
node server.js
```

Open on laptop:
- Presenter: `http://localhost:8000/#/presenter`
- Display: `http://localhost:8000/#/display`

Open on phone (same Wi‑Fi):
- Family: `http://<YOUR_LAPTOP_IP>:8000/#/f/B0170`

## Base URL (for QR)
In Presenter, set Base URL to:
`http://<YOUR_LAPTOP_IP>:8000`