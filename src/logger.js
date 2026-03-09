const LOG_LEVELS = ["debug", "info", "warn", "error"];
const LOG_LEVEL_RANK = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};
const LOG_STORAGE_KEY = "ui_log_level";

function normalizeLevel(candidate) {
  if (!candidate) return null;
  const normalized = String(candidate).trim().toLowerCase();
  return LOG_LEVELS.includes(normalized) ? normalized : null;
}

function readQueryLevel() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search || "");
  return normalizeLevel(params.get("log"));
}

function readStoredLevel() {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    return normalizeLevel(window.localStorage.getItem(LOG_STORAGE_KEY));
  } catch {
    return null;
  }
}

let currentLevel = readQueryLevel() || readStoredLevel() || "info";

function shouldLog(level) {
  return LOG_LEVEL_RANK[level] >= LOG_LEVEL_RANK[currentLevel];
}

function emit(level, scope, message, details) {
  if (!shouldLog(level)) return;

  const fnName = level === "debug" ? "debug" : level === "info" ? "info" : level === "warn" ? "warn" : "error";
  const loggerFn = console[fnName] || console.log;
  const prefix = `[${scope}] [${level.toUpperCase()}] ${message}`;

  if (typeof details === "undefined") {
    loggerFn(prefix);
    return;
  }

  loggerFn(prefix, details);
}

export function createLogger(scope) {
  return {
    debug(message, details) {
      emit("debug", scope, message, details);
    },
    info(message, details) {
      emit("info", scope, message, details);
    },
    warn(message, details) {
      emit("warn", scope, message, details);
    },
    error(message, details) {
      emit("error", scope, message, details);
    },
  };
}

export function getLogLevel() {
  return currentLevel;
}

export function setLogLevel(nextLevel) {
  const normalized = normalizeLevel(nextLevel);
  if (!normalized) return currentLevel;

  currentLevel = normalized;

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(LOG_STORAGE_KEY, currentLevel);
    } catch {
      // Ignore storage write failures.
    }
  }

  return currentLevel;
}

export function getLogLevels() {
  return [...LOG_LEVELS];
}
