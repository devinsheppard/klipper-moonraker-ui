#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

TARGET_DIR="/var/www/forgeui"
OWNER_GROUP=""
NODE_MAJOR="20"
SKIP_SYSTEM_DEPENDENCIES=0
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
  --node-major <version>  Node major version to install when missing (default: 20)
  --skip-system-deps      Skip system dependency bootstrap (node/npm, curl, gnupg)
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

node_major_version() {
  if ! command_exists node; then
    return 1
  fi

  local raw
  raw="$(node -v 2>/dev/null || true)"
  raw="${raw#v}"
  printf '%s\n' "${raw%%.*}"
}

node_and_npm_ready() {
  if ! command_exists node || ! command_exists npm; then
    return 1
  fi

  local major
  major="$(node_major_version || true)"
  [[ "$major" =~ ^[0-9]+$ ]] || return 1
  (( major >= NODE_MAJOR ))
}

ensure_system_dependencies() {
  if node_and_npm_ready; then
    log "System dependencies already present (node $(node -v), npm $(npm -v))."
    return
  fi

  if [[ "$SKIP_SYSTEM_DEPENDENCIES" -eq 1 ]]; then
    fail "System dependencies are missing and --skip-system-deps was set."
  fi

  if command_exists apt-get; then
    log "Installing required system packages via apt..."
    run_as_root apt-get update
    run_as_root apt-get install -y ca-certificates curl gnupg

    if ! node_and_npm_ready; then
      local setup_script
      setup_script="/tmp/nodesource_setup_${NODE_MAJOR}.sh"
      log "Installing Node.js ${NODE_MAJOR}.x from NodeSource..."
      run_as_root curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" -o "$setup_script"
      run_as_root bash "$setup_script"
      run_as_root apt-get install -y nodejs
      run_as_root rm -f "$setup_script"
    fi
  elif command_exists dnf; then
    log "Installing required system packages via dnf..."
    run_as_root dnf install -y ca-certificates curl gnupg2 nodejs npm
  elif command_exists yum; then
    log "Installing required system packages via yum..."
    run_as_root yum install -y ca-certificates curl gnupg2 nodejs npm
  elif command_exists pacman; then
    log "Installing required system packages via pacman..."
    run_as_root pacman -Sy --noconfirm ca-certificates curl gnupg nodejs npm
  else
    fail "Unsupported package manager. Install node >= ${NODE_MAJOR} and npm manually, then re-run with --skip-system-deps."
  fi

  if ! command_exists node || ! command_exists npm; then
    fail "Dependency installation finished but node/npm are still unavailable in PATH."
  fi

  local installed_major
  installed_major="$(node_major_version || true)"
  if [[ ! "$installed_major" =~ ^[0-9]+$ ]] || (( installed_major < NODE_MAJOR )); then
    fail "Detected node $(node -v), but node >= ${NODE_MAJOR} is required."
  fi

  log "System dependencies installed (node $(node -v), npm $(npm -v))."
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
    --node-major)
      [[ $# -ge 2 ]] || fail "Missing value for --node-major"
      NODE_MAJOR="$2"
      [[ "$NODE_MAJOR" =~ ^[0-9]+$ ]] || fail "--node-major must be numeric"
      shift 2
      ;;
    --skip-system-deps)
      SKIP_SYSTEM_DEPENDENCIES=1
      shift
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

ensure_system_dependencies

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
