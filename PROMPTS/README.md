## Run the Demo (LAN + QR + Live Sync)

### A) Start the server (Windows one-click)
Double-click `START_DEMO.bat`

OR run manually:
```bash
node server.js

### Windows one-click start
In File Explorer (not inside VS Code), double-click:
- `START_DEMO.bat`

Keep the window open while running the demo.


# PROMPTS (Codex)

This folder stores the prompts used to build and change this repo. The goal is: reproducible work + version control.

## How to use (fast)
1) Open the feature prompt (example: `02_FEATURE_QR_LAN_URL.md`)
2) Copy the **PROMPT** section into Codex
3) Run Codex changes
4) Verify locally
5) Commit:
   - code changes
   - updated prompt (if you refined it)

## Files
- `00_CONTEXT.md`  
  Global rules Codex must follow for this repo (style, constraints, output format).

- `01_ARCHITECTURE.md`  
  Current repo architecture summary (PWA + Node server + QR generation flow).

- `02_FEATURE_QR_LAN_URL.md`  
  Feature prompt: Fix QR codes so they point to LAN-accessible URL instead of localhost.

## Prompt discipline
- One feature = one prompt file (or extend the existing feature file).
- Keep prompts short but complete.
- Prompts should include:
  - Goal
  - Repo files involved
  - Exact output format (so we avoid typos)
  - Acceptance tests / checks
