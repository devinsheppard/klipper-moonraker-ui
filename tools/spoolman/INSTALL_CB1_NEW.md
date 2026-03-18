# Spoolman Install (CB1) - New

This guide is for host `cb1.local` user `biqu` and keeps your existing configs untouched.

## 1) Install Spoolman on the host (official standalone method)

Run on the CB1 host:

```bash
mkdir -p ./Spoolman && \
curl -s https://api.github.com/repos/Donkie/Spoolman/releases/latest | \
grep -o 'https://[^\"]*spoolman.zip' | \
xargs curl -sSL -o temp.zip && \
unzip -o temp.zip -d ./Spoolman && \
rm temp.zip && \
cd ./Spoolman && \
bash ./scripts/install.sh
```

Source: https://github.com/Donkie/Spoolman/wiki/Installation

## 2) Validate Spoolman UI/API

On your LAN, open:

- `http://cb1.local:7912`

## 3) Apply Moonraker config using new file only

A clean new config file with Spoolman is provided at:

- `_uploaded_config/reference_1_zip_20260318/config/moonraker_new.conf`

Copy the `[spoolman]` section from that file into your active Moonraker config when you are ready, then restart Moonraker.

## 4) In Forge UI

- Open **Settings -> Spoolman**
- Enable Spoolman integration
- Leave server URL blank for Moonraker proxy mode, or set `http://cb1.local:7912` for direct mode
- Click **Save & Connect**
- Open **Spoolman** in the left menu and click **Test Connection**