# Moonraker Timelapse Recorder

This companion app watches Moonraker print state, records the full camera stream
for each print, and generates a timelapse automatically when the print ends.

## What It Does

- Detects print start/stop from Moonraker `print_stats.state`.
- Records from your camera URL with `ffmpeg` while printing (and paused).
- Renders a sped-up timelapse when the print reaches `complete`, `cancelled`,
  `error`, or `standby`.
- Stores output in:
  - `raw/` full-length recordings
  - `timelapse/` rendered timelapses

## Requirements

- Python 3.9+
- `ffmpeg` and `ffprobe` available in `PATH`
- Moonraker reachable from the host running this script
- Camera stream URL reachable from the host running this script

## Setup

1. Copy and edit config:

```bash
cp tools/timelapse_recorder/config.example.json tools/timelapse_recorder/config.json
```

2. Update `camera_url` and `moonraker_url` in `config.json`.

## Run

```bash
python3 tools/timelapse_recorder/moonraker_timelapse_recorder.py --config tools/timelapse_recorder/config.json
```

## Optional Systemd Service (Linux)

Use the template in `tools/timelapse_recorder/forge-timelapse-recorder.service`.
Set `WorkingDirectory`, `ExecStart`, and the config path for your installation.

Then:

```bash
sudo cp tools/timelapse_recorder/forge-timelapse-recorder.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now forge-timelapse-recorder.service
```
