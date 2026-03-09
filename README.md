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

## Run Locally

Because this is plain HTML/CSS/JS, you can serve it with any static server:

```powershell
cd "C:\Users\dkshe\Documents\New project"
python -m http.server 8080
```

Then open `http://localhost:8080`.

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

