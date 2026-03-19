#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

TARGET_DIR="/var/www/forgeui"
OWNER_GROUP=""
SKIP_DEPENDENCIES=0
SKIP_BUILD=0
NO_BACKUP=0

usage() {
  cat <<'EOF'
Forge UI Linux CLI installer

Usage:
  ./scripts/install-linux.sh [options]

Options:
  --target <dir>          Install directory (default: /var/www/forgeui)
  --owner <user:group>    Optional ownership for installed files
  --skip-deps             Skip npm dependency install
  --skip-build            Skip npm build step (requires existing dist/)
  --no-backup             Replace target without creating a backup copy
  -h, --help              Show this help message

Examples:
  ./scripts/install-linux.sh --target /var/www/forgeui
  ./scripts/install-linux.sh --target /usr/share/nginx/html/forgeui --owner www-data:www-data
EOF
}

log() {
  printf '[forgeui-install] %s\n' "$*"
}

fail() {
  printf '[forgeui-install] ERROR: %s\n' "$*" >&2
  exit 1
}

run_as_root() {
  if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
    "$@"
    return
  fi
  if command -v sudo >/dev/null 2>&1; then
    sudo "$@"
    return
  fi
  fail "Root privileges are required for '$*'. Re-run as root or install sudo."
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      [[ $# -ge 2 ]] || fail "Missing value for --target"
      TARGET_DIR="$2"
      shift 2
      ;;
    --owner)
      [[ $# -ge 2 ]] || fail "Missing value for --owner"
      OWNER_GROUP="$2"
      shift 2
      ;;
    --skip-deps)
      SKIP_DEPENDENCIES=1
      shift
      ;;
    --skip-build)
      SKIP_BUILD=1
      shift
      ;;
    --no-backup)
      NO_BACKUP=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "Unknown option: $1 (use --help)"
      ;;
  esac
done

[[ -d "$REPO_ROOT" ]] || fail "Repository root not found: $REPO_ROOT"
[[ -f "$REPO_ROOT/package.json" ]] || fail "package.json not found in $REPO_ROOT"

command_exists npm || fail "npm is required but not found in PATH."
command_exists node || fail "node is required but not found in PATH."

cd "$REPO_ROOT"

if [[ "$SKIP_DEPENDENCIES" -eq 0 ]]; then
  if [[ -f package-lock.json ]]; then
    log "Installing dependencies with npm ci..."
    npm ci
  else
    log "Installing dependencies with npm install..."
    npm install
  fi
else
  log "Skipping dependency install (--skip-deps)."
fi

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  log "Building production dist..."
  npm run build
else
  log "Skipping build (--skip-build)."
fi

DIST_DIR="$REPO_ROOT/dist"
[[ -d "$DIST_DIR" ]] || fail "dist/ directory not found. Run without --skip-build or build first."
[[ -f "$DIST_DIR/index.html" ]] || fail "dist/index.html not found. Build appears incomplete."

TARGET_PARENT="$(dirname "$TARGET_DIR")"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${TARGET_DIR}.bak.${TIMESTAMP}"

log "Preparing install target: $TARGET_DIR"
run_as_root mkdir -p "$TARGET_PARENT"

if run_as_root test -e "$TARGET_DIR"; then
  if [[ "$NO_BACKUP" -eq 0 ]]; then
    log "Backing up existing install to: $BACKUP_DIR"
    run_as_root mv "$TARGET_DIR" "$BACKUP_DIR"
  else
    log "Removing existing target (--no-backup)."
    run_as_root rm -rf "$TARGET_DIR"
  fi
fi

run_as_root mkdir -p "$TARGET_DIR"
log "Copying dist/ to target..."
run_as_root cp -a "$DIST_DIR"/. "$TARGET_DIR"/

if [[ -n "$OWNER_GROUP" ]]; then
  log "Applying ownership: $OWNER_GROUP"
  run_as_root chown -R "$OWNER_GROUP" "$TARGET_DIR"
fi

log "Install complete."
log "Installed path: $TARGET_DIR"
if [[ "$NO_BACKUP" -eq 0 ]]; then
  log "Backup path: $BACKUP_DIR (only created when a prior install existed)"
fi
log "Next step: point your web server or Moonraker UI path to $TARGET_DIR"
