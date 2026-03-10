# Forge UI

A custom-look Klipper + Moonraker frontend scaffold targeting Fluidd-level feature parity.

## Current State

This repository now includes:

- Custom visual shell (not a Fluidd clone)
- Moonraker connection settings
- Live websocket status subscription
- Dashboard primitives:
  - Print state/progress
  - Hotend/bed temperatures
  - Pause/resume/cancel/home controls
  - Jog controls
- G-code console send UI
- Macro loader/executor scaffold
- File list scaffold
- KlipperView visualizer and dashboard card

## Run Locally

Use Vite in development mode:

```powershell
cd "C:\Users\dkshe\Documents\New project"
npm install
npm run dev
```

To test the production bundle locally:

```powershell
npm run build
npm run preview
```

## Moonraker Requirements

- Moonraker API reachable from browser
- CORS configured if frontend is served from different origin
- WebSocket endpoint available at `/websocket`

## Feature Parity Plan (Fluidd)

1. Printer dashboard improvements
   - Fan speeds, live positions, ETA, layer tracking
2. File manager
   - Upload, delete, move, metadata, thumbnails
3. Full console
   - History, filtering, command aliases
4. Macro UX
   - Parameterized forms, favorites, categories
5. Config editor
   - In-app `printer.cfg` editing with restart flows
6. Job timeline
   - Print history, analytics, filament usage
7. Camera support
   - MJPEG/WebRTC panels and layouts
8. Notifications
   - Toasts, webhook/mobile push integrations
9. Multi-printer profiles
   - Quick switching and saved endpoints
10. Auth/session hardening
   - Token support and secure storage strategy

## Notes

- The Moonraker API wrapper is in `src/moonraker.js`.
- UI state/event wiring is in `src/app.js`.
- Styling direction is in `src/styles.css`.

## Licensing

- Third-party license tracking is maintained in `THIRD_PARTY_LICENSES.md`.
- Auto-generated dependency license inventory is in `THIRD_PARTY_LICENSES_REPORT.md`.
- Run `npm run licenses:report` manually, or use `npm run build:dist` to generate it automatically for release builds.
- Any dependency add/update should include an update to those files before release.

## Production Deployment (Moonraker)

If your Moonraker server serves this UI from built files, deploy from `dist/` only.

1. Run `npm run build:dist` (this generates the license report, then runs build + `verify:dist`).
2. Deploy the full `dist/` folder together:
   - `dist/index.html`
   - `dist/assets/*`
3. Do not mix files from different builds (hashed asset names must match `dist/index.html`).
4. After deploy, hard refresh the browser once to clear old cached entry HTML.

Tip: `npm run verify:dist` can be run by itself to validate `dist/index.html` -> `dist/assets/*` references before copying to your server.
