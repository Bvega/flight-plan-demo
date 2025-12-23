# 02_FEATURE — QR LAN URL (Fix QR pointing to localhost)

## Goal
Fix the QR code URLs so scanning them from a phone on the same Wi-Fi opens the app correctly via LAN,
NOT via `localhost`.

## Problem
When QR codes contain:
- `http://localhost:...`
or any non-LAN hostname,
phones cannot reach the server running on the PC.

## Acceptance criteria (must pass)
1) When the app runs on PC at `http://<PC_LAN_IP>:<PORT>/`, the QR code encodes that same base origin.
2) If running via Live Server (commonly `http://127.0.0.1:5500` or `http://localhost:5500`), the app provides a beginner-friendly way to set the LAN base URL (example: `http://192.168.254.84:5500`).
3) No hardcoded localhost remains in QR generation.
4) The feature works without installing new heavy dependencies.

## Repo files involved
- `app.js` (likely main logic)
- `index.html` (UI control for base URL, if needed)
- `server.js` (only if it generates QR URLs server-side)
- Optional: `styles.css` for small UI additions

## Implementation approach (preferred)
Use this priority order for base URL selection:

A) If user has set a stored LAN URL in localStorage:
   use that.

B) Else, if `location.hostname` is NOT localhost/127.0.0.1:
   use `location.origin` (already LAN-safe).

C) Else (running on localhost):
   prompt user to input LAN base URL once (store it).

## UI (simple and beginner-friendly)
Add a small "LAN URL" settings area:
- Input: LAN Base URL (example placeholder: `http://192.168.254.84:5500`)
- Button: Save
- Button: Clear (optional)
- Show current resolved base URL

## QR behavior
Wherever the QR URL is created:
- Build URL as: `${baseUrl}${path}`
- Ensure path starts with `/`
- Never embed localhost in the QR

## Output requirement
1) FIRST: CHANGE LIST
2) THEN: FULL updated file(s), each in its own code block, copy/paste ready.

## Start
Inspect current code for:
- where QR URLs are built (client or server)
- any `localhost` hardcoding
- any QR generation usage (images or canvas)

Then implement the base URL resolver + minimal UI.
