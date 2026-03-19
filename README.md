# Forge UI

A Klipper + Moonraker frontend combining the best of both Fluidd and Mainsail with some original ideas.

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

## Print Video + Timelapse App

A companion recorder service is available at:

- `tools/timelapse_recorder/moonraker_timelapse_recorder.py`

It monitors Moonraker print state, records full print video from your camera stream, and auto-generates a timelapse when the print ends.

Quick start:

```bash
cp tools/timelapse_recorder/config.example.json tools/timelapse_recorder/config.json
python3 tools/timelapse_recorder/moonraker_timelapse_recorder.py --config tools/timelapse_recorder/config.json
```

See `tools/timelapse_recorder/README.md` for setup details and systemd service instructions.

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

## Linux CLI Install

Use the included installer to build and deploy from CLI on a Linux host:

```bash
cd ~
git clone https://github.com/devinsheppard/klipper-moonraker-ui.git
cd ~/klipper-moonraker-ui
chmod +x scripts/install-linux.sh
./scripts/install-linux.sh --target /var/www/forgeui --owner www-data:www-data
```

Equivalent via npm script:

```bash
npm run install:linux -- --target /var/www/forgeui --owner www-data:www-data
```

Notes:

- The installer bootstraps required system dependencies automatically (`node`, `npm`, `curl`, `gnupg`) when possible.
- The installer runs `npm ci` + `npm run build` by default, then copies `dist/` into the target directory.
- By default, the installer also creates/updates an nginx site on port `82` and reloads nginx.
- Existing target content is backed up to `<target>.bak.<timestamp>` unless `--no-backup` is used.
- If your web root is elsewhere, set `--target` accordingly (for example `/usr/share/nginx/html/forgeui`).
- Use `--skip-nginx` to skip nginx changes, or `--port <number>` to use a different port.
- Use `./scripts/install-linux.sh --help` to see all options.

## Windows CLI Install

Use the included PowerShell installer to build and deploy from CLI on a Windows host:

```powershell
cd $HOME
git clone https://github.com/devinsheppard/klipper-moonraker-ui.git
cd .\klipper-moonraker-ui
powershell -ExecutionPolicy Bypass -File .\scripts\install-windows.ps1 -Target "C:\forgeui"
```

Equivalent via npm script:

```powershell
npm run install:windows -- -Target "C:\forgeui"
```

Notes:

- The installer bootstraps required system dependencies automatically (`node`, `npm`) when possible (`winget`/`choco`).
- The installer runs `npm ci` + `npm run build` by default, then copies `dist\` into the target directory.
- Existing target content is backed up to `<target>.bak.<timestamp>` unless `-NoBackup` is used.
- If deploying to protected locations such as `C:\inetpub\wwwroot`, run PowerShell as Administrator.
- Use `powershell -ExecutionPolicy Bypass -File .\scripts\install-windows.ps1 -Help` to see all options.


