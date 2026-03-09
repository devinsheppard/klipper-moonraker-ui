import { MoonrakerClient } from "./moonraker.js";
import { createLogger } from "./logger.js";

const CAMERA_MODES = {
  IMAGE: "image",
  IFRAME: "iframe",
};

const INTERFACE_THEMES = ["ocean", "ember", "graphite"];
const INTERFACE_DENSITIES = ["comfortable", "compact"];
const CARD_COLLAPSE_KEY_PREFIX = "card_collapsed_";
const DASHBOARD_CARD_IDS = [
  "card-print-progress",
  "card-temperatures",
  "card-motion",
  "card-quick-commands",
  "camera-main-card",
  "camera-toolhead-card",
];

const DASHBOARD_LAYOUT_DEFAULT = {
  left: ["card-print-progress", "card-motion", "camera-main-card"],
  right: ["card-temperatures", "card-quick-commands", "camera-toolhead-card"],
};

const DASHBOARD_CARD_LABELS = {
  "card-print-progress": "Status",
  "card-temperatures": "Temperatures",
  "card-motion": "Motion",
  "card-quick-commands": "Quick Commands",
  "camera-main-card": "Main Camera",
  "camera-toolhead-card": "Toolhead Cam",
};

const PRINTER_STATE_META = {
  unknown: { label: "Unknown", color: "#64748b" },
  connecting: { label: "Connecting", color: "#f59e0b" },
  disconnected: { label: "Disconnected", color: "#f97316" },
  ready: { label: "Ready", color: "#22c55e" },
  printing: { label: "Printing", color: "#16a34a" },
  paused: { label: "Paused", color: "#f59e0b" },
  complete: { label: "Complete", color: "#22d3ee" },
  cancelled: { label: "Cancelled", color: "#94a3b8" },
  error: { label: "Error", color: "#ef4444" },
};

const CONSOLE_LOG_LEVELS = new Set(["debug", "info", "warn", "error"]);
const TEMPERATURE_PRESETS = {
  hotend: [0, 170, 200, 215, 240, 260],
  bed: [0, 45, 60, 80, 100],
};
const TEMPERATURE_HISTORY_LIMIT = 360;
const TEMPERATURE_DEFAULT_MAX = 250;
const TEMPERATURE_POLL_INTERVAL_MS = 800;
const TEMPERATURE_HISTORY_SAMPLE_MS = 800;
const TEMPERATURE_HISTORY_STORAGE_KEY = "temperature_history_v1";
const TEMPERATURE_HISTORY_MAX_AGE_MS = 60 * 60 * 1000;
const TEMPERATURE_COLORS = {
  hotend: "#ff4a3f",
  bed: "#2ea3ff",
};
function getThemeColorValue(cssVarName, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim();
  return value || fallback;
}

function getTemperatureLineColors() {
  return {
    hotend: getThemeColorValue("--danger", TEMPERATURE_COLORS.hotend),
    bed: getThemeColorValue("--accent", TEMPERATURE_COLORS.bed),
  };
}
const log = createLogger("app");

const els = {
  navItems: [...document.querySelectorAll(".nav-item")],
  views: [...document.querySelectorAll(".view")],
  sidebar: document.getElementById("sidebar"),
  sidebarToggle: document.getElementById("sidebar-toggle"),
  pageTitle: document.getElementById("page-title"),
  connectionPill: document.getElementById("connection-pill"),
  connectionText: document.getElementById("connection-text"),
  printerDot: document.getElementById("printer-dot"),
  printerState: document.getElementById("printer-state"),
  progressBar: document.getElementById("progress-bar"),
  progressText: document.getElementById("progress-text"),
  statusFileName: document.getElementById("status-file-name"),
  statusFileThumbWrap: document.getElementById("status-file-thumb-wrap"),
  statusFileThumb: document.getElementById("status-file-thumb"),
  statusEtp: document.getElementById("status-etp"),
  statusFinish: document.getElementById("status-finish"),
  statusTimeLeft: document.getElementById("status-time-left"),
  statusSpeed: document.getElementById("status-speed"),
  statusFlowrate: document.getElementById("status-flowrate"),
  statusFilament: document.getElementById("status-filament"),
  statusLayer: document.getElementById("status-layer"),
  tempHotend: document.getElementById("temp-hotend"),
  tempBed: document.getElementById("temp-bed"),
  tempHotendState: document.getElementById("temp-hotend-state"),
  tempBedState: document.getElementById("temp-bed-state"),
  tempHotendTarget: document.getElementById("temp-hotend-target"),
  tempBedTarget: document.getElementById("temp-bed-target"),
  tempHotendTargetInput: document.getElementById("temp-hotend-target-input"),
  tempBedTargetInput: document.getElementById("temp-bed-target-input"),
  tempHotendTargetToggle: document.getElementById("temp-hotend-target-toggle"),
  tempBedTargetToggle: document.getElementById("temp-bed-target-toggle"),
  tempHotendTargetMenu: document.getElementById("temp-hotend-target-menu"),
  tempBedTargetMenu: document.getElementById("temp-bed-target-menu"),
  tempCooldown: document.getElementById("temp-cooldown"),
  tempSettingsToggle: document.getElementById("temp-settings-toggle"),
  tempSettingsMenu: document.getElementById("temp-settings-menu"),
  tempShowChart: document.getElementById("temp-show-chart"),
  tempHideHostSensors: document.getElementById("temp-hide-host-sensors"),
  tempHideMonitors: document.getElementById("temp-hide-monitors"),
  tempAutoscaleChart: document.getElementById("temp-autoscale-chart"),
  temperatureChartWrap: document.getElementById("temperature-chart-wrap"),
  temperatureChart: document.getElementById("temperature-chart"),
  temperatureChartTooltip: document.getElementById("temperature-chart-tooltip"),
  temperatureTooltipTime: document.getElementById("temperature-tooltip-time"),
  temperatureTooltipHotend: document.getElementById("temperature-tooltip-hotend"),
  temperatureTooltipBed: document.getElementById("temperature-tooltip-bed"),
  consoleLog: document.getElementById("console-log"),
  consoleForm: document.getElementById("console-form"),
  consoleInput: document.getElementById("console-input"),
  macroList: document.getElementById("macro-list"),
  fileList: document.getElementById("file-list"),
  settingsForm: document.getElementById("settings-form"),
  moonrakerUrl: document.getElementById("moonraker-url"),
  interfaceTheme: document.getElementById("interface-theme"),
  interfaceCompact: document.getElementById("interface-compact"),
  interfaceDensity: document.getElementById("interface-density"),
  dashShowPrintProgress: document.getElementById("dash-show-print-progress"),
  dashShowTemperatures: document.getElementById("dash-show-temperatures"),
  dashShowMotion: document.getElementById("dash-show-motion"),
  dashShowQuickCommands: document.getElementById("dash-show-quick-commands"),
  dashShowMainCamera: document.getElementById("dash-show-main-camera"),
  dashShowToolheadCamera: document.getElementById("dash-show-toolhead-camera"),
  openDashboardLayout: document.getElementById("open-dashboard-layout"),
  dashboardLayoutDialog: document.getElementById("dashboard-layout-dialog"),
  dashboardLayoutClose: document.getElementById("dashboard-layout-close"),
  dashboardLayoutSave: document.getElementById("dashboard-layout-save"),
  dashboardLayoutReset: document.getElementById("dashboard-layout-reset"),
  dashboardLayoutLeft: document.getElementById("dashboard-layout-left"),
  dashboardLayoutRight: document.getElementById("dashboard-layout-right"),
  dashboardCards: document.getElementById("dashboard-cards"),
  dashboardColLeft: document.getElementById("dashboard-col-left"),
  dashboardColRight: document.getElementById("dashboard-col-right"),
  cardPrintProgress: document.getElementById("card-print-progress"),
  cardTemperatures: document.getElementById("card-temperatures"),
  cardMotion: document.getElementById("card-motion"),
  cardQuickCommands: document.getElementById("card-quick-commands"),
  cardMainCamera: document.getElementById("camera-main-card"),
  cardToolheadCamera: document.getElementById("camera-toolhead-card"),
  cameraEnabled: document.getElementById("camera-enabled"),
  cameraUrl: document.getElementById("camera-url"),
  cameraRenderMode: document.getElementById("camera-render-mode"),
  toolheadCameraEnabled: document.getElementById("toolhead-camera-enabled"),
  toolheadCameraUrl: document.getElementById("toolhead-camera-url"),
  toolheadCameraRenderMode: document.getElementById("toolhead-camera-render-mode"),
  mainCameraFrame: document.getElementById("main-camera-frame"),
  toolheadCameraFrame: document.getElementById("toolhead-camera-frame"),
  mainCameraFullscreen: document.getElementById("main-camera-fullscreen"),
  toolheadCameraFullscreen: document.getElementById("toolhead-camera-fullscreen"),
  cameraDialog: document.getElementById("camera-fullscreen-dialog"),
  cameraDialogClose: document.getElementById("camera-fullscreen-close"),
  cameraDialogContent: document.getElementById("camera-fullscreen-content"),
  home: document.getElementById("btn-home"),
  jog: [...document.querySelectorAll("[data-jog]")],
  quickGcode: [...document.querySelectorAll("[data-gcode]")],
};

let layoutDraggedCardId = null;
let layoutDraggedFromColumn = null;
let temperaturePollTimer = null;
let temperatureHistorySaveTimer = null;
let statusCountdownTimer = null;

function loadStoredBool(key, fallback) {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === "1" || raw === "true";
}

function loadStoredMode(key, fallback) {
  const raw = localStorage.getItem(key);
  if (raw === CAMERA_MODES.IMAGE || raw === CAMERA_MODES.IFRAME) return raw;
  return fallback;
}

function loadStoredChoice(key, fallback, allowedValues) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  return allowedValues.includes(raw) ? raw : fallback;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDashboardCardIds(cardIdsCandidate) {
  const candidate = Array.isArray(cardIdsCandidate) ? cardIdsCandidate : [];
  const validKnown = candidate.filter((id) => DASHBOARD_CARD_IDS.includes(id));
  return [...new Set(validKnown)];
}

function normalizeDashboardLayout(layoutCandidate) {
  const candidate = layoutCandidate && typeof layoutCandidate === "object" ? layoutCandidate : {};

  const left = normalizeDashboardCardIds(candidate.left);
  const right = normalizeDashboardCardIds(candidate.right).filter((id) => !left.includes(id));

  const used = new Set([...left, ...right]);
  const missing = DASHBOARD_CARD_IDS.filter((id) => !used.has(id));

  missing.forEach((id) => {
    if (left.length <= right.length) {
      left.push(id);
    } else {
      right.push(id);
    }
  });

  return { left, right };
}

function convertOrderToLayout(orderCandidate) {
  const order = normalizeDashboardCardIds(orderCandidate);
  const layout = { left: [], right: [] };

  order.forEach((id, index) => {
    const column = index % 2 === 0 ? "left" : "right";
    layout[column].push(id);
  });

  return normalizeDashboardLayout(layout);
}

function flattenDashboardLayout(layoutCandidate) {
  const layout = normalizeDashboardLayout(layoutCandidate);
  const maxLength = Math.max(layout.left.length, layout.right.length);
  const flat = [];

  for (let index = 0; index < maxLength; index += 1) {
    if (layout.left[index]) flat.push(layout.left[index]);
    if (layout.right[index]) flat.push(layout.right[index]);
  }

  return flat;
}

function loadDashboardLayout() {
  const rawLayout = localStorage.getItem("dashboard_layout");
  if (rawLayout) {
    try {
      const parsed = JSON.parse(rawLayout);
      return normalizeDashboardLayout(parsed);
    } catch {
      // Fall through to legacy key/default.
    }
  }

  const rawOrder = localStorage.getItem("dashboard_layout_order");
  if (rawOrder) {
    try {
      const parsed = JSON.parse(rawOrder);
      return convertOrderToLayout(parsed);
    } catch {
      // Fall through to default.
    }
  }

  return normalizeDashboardLayout(DASHBOARD_LAYOUT_DEFAULT);
}

function normalizeTemperatureSample(value, fallback = null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function loadTemperatureHistory() {
  const rawHistory = localStorage.getItem(TEMPERATURE_HISTORY_STORAGE_KEY);
  if (!rawHistory) return [];

  try {
    const parsed = JSON.parse(rawHistory);
    if (!Array.isArray(parsed)) return [];

    const cutoff = Date.now() - TEMPERATURE_HISTORY_MAX_AGE_MS;
    const sanitized = parsed
      .map((point) => {
        const time = normalizeTemperatureSample(point?.time, null);
        if (!Number.isFinite(time)) return null;

        return {
          time,
          hotendCurrent: normalizeTemperatureSample(point?.hotendCurrent, null),
          hotendTarget: normalizeTemperatureSample(point?.hotendTarget, 0),
          bedCurrent: normalizeTemperatureSample(point?.bedCurrent, null),
          bedTarget: normalizeTemperatureSample(point?.bedTarget, 0),
        };
      })
      .filter((point) => point && point.time >= cutoff)
      .sort((a, b) => a.time - b.time);

    if (sanitized.length <= TEMPERATURE_HISTORY_LIMIT) return sanitized;
    return sanitized.slice(-TEMPERATURE_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function persistTemperatureHistory() {
  localStorage.setItem(TEMPERATURE_HISTORY_STORAGE_KEY, JSON.stringify(state.temperatures.history));
}

function scheduleTemperatureHistorySave() {
  if (temperatureHistorySaveTimer) return;

  temperatureHistorySaveTimer = setTimeout(() => {
    temperatureHistorySaveTimer = null;
    persistTemperatureHistory();
  }, 250);
}

const initialTemperatureHistory = loadTemperatureHistory();
const initialTemperatureSnapshot = initialTemperatureHistory[initialTemperatureHistory.length - 1] || null;

const state = {
  client: null,
  moonrakerUrl: localStorage.getItem("moonraker_url") || "http://127.0.0.1:7125",
  interface: {
    theme: loadStoredChoice("interface_theme", "ocean", INTERFACE_THEMES),
    compact: loadStoredBool("interface_compact", false),
    density: loadStoredChoice("interface_density", "comfortable", INTERFACE_DENSITIES),
    sidebarCollapsed: loadStoredBool("interface_sidebar_collapsed", false),
  },
  dashboard: {
    showPrintProgress: loadStoredBool("dashboard_show_print_progress", true),
    showTemperatures: loadStoredBool("dashboard_show_temperatures", true),
    showMotion: loadStoredBool("dashboard_show_motion", true),
    showQuickCommands: loadStoredBool("dashboard_show_quick_commands", true),
    showMainCamera: loadStoredBool("dashboard_show_main_camera", true),
    showToolheadCamera: loadStoredBool("dashboard_show_toolhead_camera", true),
    layout: loadDashboardLayout(),
  },
  camera: {
    enabled: loadStoredBool("camera_enabled", true),
    url: localStorage.getItem("camera_url") || "",
    renderMode: loadStoredMode("camera_render_mode", CAMERA_MODES.IMAGE),
  },
  toolheadCamera: {
    enabled: loadStoredBool("toolhead_camera_enabled", false),
    url: localStorage.getItem("toolhead_camera_url") || "",
    renderMode: loadStoredMode("toolhead_camera_render_mode", CAMERA_MODES.IMAGE),
  },
  temperatures: {
    hotend: {
      current: initialTemperatureSnapshot?.hotendCurrent ?? null,
      target: initialTemperatureSnapshot?.hotendTarget ?? 0,
    },
    bed: {
      current: initialTemperatureSnapshot?.bedCurrent ?? null,
      target: initialTemperatureSnapshot?.bedTarget ?? 0,
    },
    history: initialTemperatureHistory,
    chart: {
      show: loadStoredBool("temperature_show_chart", true),
      hideHostSensors: loadStoredBool("temperature_hide_host_sensors", false),
      hideMonitors: loadStoredBool("temperature_hide_monitors", false),
      autoscale: loadStoredBool("temperature_autoscale_chart", false),
      hoverIndex: null,
      layout: null,
    },
  },
  printStatus: {
    filename: "",
    thumbnailPath: "",
    metadataByFile: new Map(),
    metadataRequestId: 0,
    lastPrintStats: {},
    lastGcodeMove: {},
    lastFilamentUsed: null,
    lastVirtualSd: {},
    lastMotionReport: {},
    countdownTargetMs: null,
  },
};

function appendConsole(message, level = "info") {
  const normalizedLevel = CONSOLE_LOG_LEVELS.has(level) ? level : "info";
  const line = document.createElement("div");
  line.className = `console-line console-line-${normalizedLevel}`;
  line.textContent = `[${new Date().toLocaleTimeString()}] [${normalizedLevel.toUpperCase()}] ${message}`;
  els.consoleLog.appendChild(line);
  els.consoleLog.scrollTop = els.consoleLog.scrollHeight;
}

function updateSidebarToggleUi() {
  if (!els.sidebarToggle) return;

  const collapsed = state.interface.sidebarCollapsed;
  els.sidebarToggle.dataset.state = collapsed ? "collapsed" : "expanded";
  els.sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
  els.sidebarToggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
  els.sidebarToggle.setAttribute("title", collapsed ? "Expand sidebar" : "Collapse sidebar");
}

function applyInterfaceSettings() {
  document.documentElement.dataset.theme = state.interface.theme;
  document.documentElement.dataset.density = state.interface.density;
  document.body.classList.toggle("compact-mode", state.interface.compact);
  document.body.classList.toggle("sidebar-collapsed", state.interface.sidebarCollapsed);
  updateSidebarToggleUi();
}

function applyDashboardLayout() {
  if (!els.dashboardColLeft || !els.dashboardColRight) return;

  state.dashboard.layout = normalizeDashboardLayout(state.dashboard.layout);

  const leftFragment = document.createDocumentFragment();
  state.dashboard.layout.left.forEach((cardId) => {
    const card = document.getElementById(cardId);
    if (card) leftFragment.appendChild(card);
  });

  const rightFragment = document.createDocumentFragment();
  state.dashboard.layout.right.forEach((cardId) => {
    const card = document.getElementById(cardId);
    if (card) rightFragment.appendChild(card);
  });

  els.dashboardColLeft.appendChild(leftFragment);
  els.dashboardColRight.appendChild(rightFragment);
}

function applyDashboardSettings() {
  const visibilityMap = [
    [els.cardPrintProgress, state.dashboard.showPrintProgress],
    [els.cardTemperatures, state.dashboard.showTemperatures],
    [els.cardMotion, state.dashboard.showMotion],
    [els.cardQuickCommands, state.dashboard.showQuickCommands],
    [els.cardMainCamera, state.dashboard.showMainCamera],
    [els.cardToolheadCamera, state.dashboard.showToolheadCamera],
  ];

  visibilityMap.forEach(([card, visible]) => {
    if (!card) return;
    card.classList.toggle("card-hidden", !visible);
  });
}

function clearDashboardLayoutDropTargets() {
  [els.dashboardLayoutLeft, els.dashboardLayoutRight].forEach((list) => {
    if (!list) return;
    list.classList.remove("drop-target");
    list.querySelectorAll(".drop-target").forEach((el) => el.classList.remove("drop-target"));
  });
}

function removeDashboardCardFromLayout(cardId) {
  state.dashboard.layout.left = state.dashboard.layout.left.filter((id) => id !== cardId);
  state.dashboard.layout.right = state.dashboard.layout.right.filter((id) => id !== cardId);
}

function moveDashboardCard(cardId, toColumn, beforeCardId = null) {
  if (!cardId || (toColumn !== "left" && toColumn !== "right")) return;

  removeDashboardCardFromLayout(cardId);

  const targetList = state.dashboard.layout[toColumn];
  if (beforeCardId) {
    const index = targetList.indexOf(beforeCardId);
    if (index >= 0) {
      targetList.splice(index, 0, cardId);
    } else {
      targetList.push(cardId);
    }
  } else {
    targetList.push(cardId);
  }

  state.dashboard.layout = normalizeDashboardLayout(state.dashboard.layout);
}

function getDraggedDashboardCardId(event) {
  if (layoutDraggedCardId) return layoutDraggedCardId;

  const payload = event.dataTransfer?.getData("text/plain") || "";
  const [cardId] = payload.split("|");
  return DASHBOARD_CARD_IDS.includes(cardId) ? cardId : null;
}

function renderDashboardLayoutColumn(column, listEl) {
  if (!listEl) return;

  listEl.innerHTML = "";
  const cards = state.dashboard.layout[column] || [];

  cards.forEach((cardId) => {
    const item = document.createElement("li");
    item.className = "layout-item";
    item.draggable = true;
    item.dataset.cardId = cardId;
    item.dataset.column = column;

    const handle = document.createElement("span");
    handle.className = "layout-handle";
    handle.textContent = "::";

    const label = document.createElement("span");
    label.className = "layout-item-label";
    label.textContent = DASHBOARD_CARD_LABELS[cardId] || cardId;

    const moveButton = document.createElement("button");
    moveButton.type = "button";
    moveButton.className = "layout-move-column";
    moveButton.textContent = column === "left" ? "->" : "<-";
    moveButton.title = column === "left" ? "Move to right column" : "Move to left column";
    moveButton.setAttribute("aria-label", moveButton.title);
    moveButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const nextColumn = column === "left" ? "right" : "left";
      moveDashboardCard(cardId, nextColumn);
      renderDashboardLayoutLists();
    });

    const controls = document.createElement("div");
    controls.className = "layout-item-controls";
    controls.appendChild(moveButton);

    item.append(handle, label, controls);

    item.addEventListener("dragstart", (event) => {
      layoutDraggedCardId = cardId;
      layoutDraggedFromColumn = column;
      item.classList.add("dragging");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", `${cardId}|${column}`);
      }
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      layoutDraggedCardId = null;
      layoutDraggedFromColumn = null;
      clearDashboardLayoutDropTargets();
    });

    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      item.classList.add("drop-target");
      listEl.classList.add("drop-target");
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    });

    item.addEventListener("dragleave", () => {
      item.classList.remove("drop-target");
    });

    item.addEventListener("drop", (event) => {
      event.preventDefault();
      event.stopPropagation();
      item.classList.remove("drop-target");
      listEl.classList.remove("drop-target");

      const draggedCardId = getDraggedDashboardCardId(event);
      if (!draggedCardId) return;

      moveDashboardCard(draggedCardId, column, cardId);
      renderDashboardLayoutLists();
    });

    listEl.appendChild(item);
  });

  listEl.ondragover = (event) => {
    event.preventDefault();
    listEl.classList.add("drop-target");
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  };

  listEl.ondragleave = (event) => {
    if (event.target === listEl) {
      listEl.classList.remove("drop-target");
    }
  };

  listEl.ondrop = (event) => {
    event.preventDefault();
    listEl.classList.remove("drop-target");

    const draggedCardId = getDraggedDashboardCardId(event);
    if (!draggedCardId) return;

    moveDashboardCard(draggedCardId, column);
    renderDashboardLayoutLists();
  };
}

function renderDashboardLayoutLists() {
  renderDashboardLayoutColumn("left", els.dashboardLayoutLeft);
  renderDashboardLayoutColumn("right", els.dashboardLayoutRight);
}

function openDashboardLayoutDialog() {
  renderDashboardLayoutLists();
  if (typeof els.dashboardLayoutDialog?.showModal === "function") {
    els.dashboardLayoutDialog.showModal();
  }
}

function closeDashboardLayoutDialog() {
  if (els.dashboardLayoutDialog?.open) {
    els.dashboardLayoutDialog.close();
  }
}

function saveDashboardLayout() {
  state.dashboard.layout = normalizeDashboardLayout(state.dashboard.layout);
  localStorage.setItem("dashboard_layout", JSON.stringify(state.dashboard.layout));
  localStorage.setItem("dashboard_layout_order", JSON.stringify(flattenDashboardLayout(state.dashboard.layout)));
  applyDashboardLayout();
  applyDashboardSettings();
  closeDashboardLayoutDialog();
  appendConsole("Dashboard layout saved.");
}

function resetDashboardLayout() {
  state.dashboard.layout = normalizeDashboardLayout(DASHBOARD_LAYOUT_DEFAULT);
  renderDashboardLayoutLists();
}

function toggleSidebar() {
  state.interface.sidebarCollapsed = !state.interface.sidebarCollapsed;
  localStorage.setItem("interface_sidebar_collapsed", String(state.interface.sidebarCollapsed));
  applyInterfaceSettings();
}

function normalizePrinterState(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "unknown";

  if (["standby", "ready", "idle", "operational"].includes(normalized)) return "ready";
  if (normalized === "printing") return "printing";
  if (normalized === "paused") return "paused";
  if (["complete", "completed"].includes(normalized)) return "complete";
  if (["cancelled", "canceled"].includes(normalized)) return "cancelled";
  if (["error", "shutdown"].includes(normalized)) return "error";
  if (["disconnected", "offline"].includes(normalized)) return "disconnected";
  if (normalized === "connecting") return "connecting";

  return "unknown";
}

function setConnectionUi(status) {
  els.connectionPill.textContent = status;
  if (status === "connected") {
    els.connectionPill.style.borderColor = "rgba(34, 197, 94, 0.7)";
    els.connectionText.textContent = state.moonrakerUrl;

    const currentState = els.printerState.dataset.state || "unknown";
    if (["unknown", "connecting", "disconnected", "error"].includes(currentState)) {
      setPrinterState("ready");
    }
  } else {
    updateStatusCountdown(null);
    els.connectionPill.style.borderColor = "rgba(148, 163, 184, 0.22)";

    if (status === "connecting") setPrinterState("connecting");
    if (status === "disconnected") setPrinterState("disconnected");
    if (status === "error") setPrinterState("error");
  }
}

function setPrinterState(value) {
  const normalized = normalizePrinterState(value);
  const meta = PRINTER_STATE_META[normalized] || PRINTER_STATE_META.unknown;
  els.printerState.dataset.state = normalized;
  els.printerState.textContent = meta.label;
  els.printerDot.style.background = meta.color;
}

function setStatusFilename(filename) {
  const normalized = typeof filename === "string" ? filename.trim() : "";
  const label = normalized || "No active file";
  state.printStatus.filename = normalized;

  if (!els.statusFileName) return;
  els.statusFileName.textContent = label;
  els.statusFileName.title = label;
}

function encodePathForUrl(path) {
  return String(path || "")
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildThumbnailUrl(relativePath) {
  if (!relativePath) return "";
  const encodedPath = encodePathForUrl(relativePath);
  return `${state.moonrakerUrl}/server/files/gcodes/${encodedPath}`;
}

function setStatusThumbnail(relativePath) {
  state.printStatus.thumbnailPath = relativePath || "";

  if (!els.statusFileThumbWrap || !els.statusFileThumb) return;

  if (!relativePath) {
    els.statusFileThumbWrap.hidden = true;
    els.statusFileThumb.removeAttribute("src");
    return;
  }

  els.statusFileThumb.src = buildThumbnailUrl(relativePath);
  els.statusFileThumbWrap.hidden = false;
}

function formatStatusDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--:--:--";

  const totalSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainderSeconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainderSeconds).padStart(2, "0")}`;
}

function formatStatusFinishTime(remainingSeconds) {
  if (!Number.isFinite(remainingSeconds) || remainingSeconds < 0) return "--:--";

  const finishDate = new Date(Date.now() + Math.round(remainingSeconds * 1000));
  return finishDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function stopStatusCountdown() {
  if (statusCountdownTimer) {
    clearInterval(statusCountdownTimer);
    statusCountdownTimer = null;
  }
}

function renderStatusTimeLeftFromCountdown() {
  if (!els.statusTimeLeft) return;

  const targetMs = Number(state.printStatus.countdownTargetMs);
  if (!Number.isFinite(targetMs)) {
    els.statusTimeLeft.textContent = "--:--:--";
    return;
  }

  const remainingSeconds = Math.max((targetMs - Date.now()) / 1000, 0);
  els.statusTimeLeft.textContent = formatStatusDuration(remainingSeconds);

  if (remainingSeconds <= 0) {
    stopStatusCountdown();
  }
}

function startStatusCountdown() {
  if (statusCountdownTimer) return;
  statusCountdownTimer = setInterval(renderStatusTimeLeftFromCountdown, 1000);
}

function updateStatusCountdown(remainingSeconds) {
  if (!els.statusTimeLeft) return;

  if (!Number.isFinite(remainingSeconds) || remainingSeconds < 0) {
    state.printStatus.countdownTargetMs = null;
    els.statusTimeLeft.textContent = "--:--:--";
    stopStatusCountdown();
    return;
  }

  state.printStatus.countdownTargetMs = Date.now() + Math.round(remainingSeconds * 1000);
  renderStatusTimeLeftFromCountdown();
  startStatusCountdown();
}
function readPrintElapsedSeconds(printStats) {
  const printDuration = Number(printStats?.print_duration);
  if (Number.isFinite(printDuration) && printDuration >= 0) return printDuration;

  const totalDuration = Number(printStats?.total_duration);
  if (Number.isFinite(totalDuration) && totalDuration >= 0) return totalDuration;

  return 0;
}

function getStatusMetadataEntry(filename) {
  const normalized = typeof filename === "string" ? filename.trim() : "";
  if (!normalized) return null;

  const entry = state.printStatus.metadataByFile.get(normalized);
  return entry && typeof entry === "object" ? entry : null;
}

function deriveEstimatedTotalSeconds(printStats) {
  const metadata = getStatusMetadataEntry(state.printStatus.filename);
  const metadataEstimated = Number(metadata?.estimatedTime);

  if (Number.isFinite(metadataEstimated) && metadataEstimated > 0) {
    return metadataEstimated;
  }

  const progress = Number(state.printStatus.lastVirtualSd?.progress);
  const elapsedSeconds = readPrintElapsedSeconds(printStats);

  if (Number.isFinite(progress) && progress > 0 && elapsedSeconds > 0) {
    return elapsedSeconds / progress;
  }

  return null;
}

function renderStatusTiming(printStats) {
  if (!els.statusEtp || !els.statusFinish) return;

  const estimatedTotalSeconds = deriveEstimatedTotalSeconds(printStats);
  const elapsedSeconds = readPrintElapsedSeconds(printStats);
  const remainingSeconds = Number.isFinite(estimatedTotalSeconds)
    ? Math.max(estimatedTotalSeconds - elapsedSeconds, 0)
    : null;

  els.statusEtp.textContent = formatStatusDuration(estimatedTotalSeconds);
  els.statusFinish.textContent = formatStatusFinishTime(remainingSeconds);
  updateStatusCountdown(remainingSeconds);
}

function mergeVirtualSdSnapshot(virtualSd) {
  const partial = virtualSd && typeof virtualSd === "object" ? virtualSd : {};
  const previous = state.printStatus.lastVirtualSd || {};
  const merged = { ...previous, ...partial };
  state.printStatus.lastVirtualSd = merged;
  return merged;
}

function renderStatusProgress(virtualSd) {
  const progress = Number(virtualSd?.progress);
  const pct = Number.isFinite(progress)
    ? Math.max(0, Math.min(100, Math.round(progress * 100)))
    : 0;

  if (els.progressBar) {
    els.progressBar.style.width = `${pct}%`;
  }

  if (els.progressText) {
    els.progressText.textContent = `${pct}%`;
  }
}
function formatStatusLayerValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return "--";
  return `${Math.round(numeric)}`;
}

function readFiniteNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric;
}

function readPositiveNumber(value) {
  const numeric = readFiniteNumber(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return numeric;
}

function readCurrentZ() {
  const gcodePosition = state.printStatus.lastGcodeMove?.gcode_position;
  const position = state.printStatus.lastGcodeMove?.position;
  const zCandidates = [
    Array.isArray(gcodePosition) ? gcodePosition[2] : null,
    Array.isArray(position) ? position[2] : null,
    state.printStatus.lastGcodeMove?.gcode_z,
    state.printStatus.lastGcodeMove?.position_z,
  ];

  for (const candidate of zCandidates) {
    const numeric = readFiniteNumber(candidate);
    if (Number.isFinite(numeric) && numeric >= 0) {
      return numeric;
    }
  }

  return null;
}

function estimateLayerFromHeight(totalLayers, metadata) {
  const layerHeight = readPositiveNumber(metadata?.layerHeight);
  if (!Number.isFinite(layerHeight)) return null;

  const firstLayerHeight = readPositiveNumber(metadata?.firstLayerHeight) ?? layerHeight;
  const currentZ = readCurrentZ();
  if (!Number.isFinite(currentZ)) return null;

  let estimatedLayer = 1;
  if (currentZ > firstLayerHeight + layerHeight * 0.5) {
    estimatedLayer = 1 + Math.round((currentZ - firstLayerHeight) / layerHeight);
  }

  if (!Number.isFinite(estimatedLayer) || estimatedLayer < 1) return null;

  if (Number.isFinite(totalLayers) && totalLayers > 0) {
    return Math.min(estimatedLayer, totalLayers);
  }

  return estimatedLayer;
}

function estimateLayerFromProgress(totalLayers) {
  const progress = readFiniteNumber(state.printStatus.lastVirtualSd?.progress);
  if (!Number.isFinite(progress) || progress <= 0) return null;
  if (!Number.isFinite(totalLayers) || totalLayers <= 0) return null;

  const clamped = Math.max(0, Math.min(1, progress));
  const estimatedLayer = Math.max(1, Math.round(clamped * totalLayers));
  return Math.min(estimatedLayer, totalLayers);
}

function renderStatusLayer(printStats) {
  if (!els.statusLayer) return;

  const metadata = getStatusMetadataEntry(state.printStatus.filename);
  const currentLayerDirect = readFiniteNumber(printStats?.info?.current_layer ?? printStats?.current_layer);
  const totalLayerFromStats = readPositiveNumber(printStats?.info?.total_layer ?? printStats?.total_layer);
  const totalLayerFromMetadata = readPositiveNumber(metadata?.totalLayers);
  const totalLayer = totalLayerFromStats ?? totalLayerFromMetadata;

  const currentLayer = currentLayerDirect
    ?? estimateLayerFromHeight(totalLayer, metadata)
    ?? estimateLayerFromProgress(totalLayer);

  els.statusLayer.textContent = `Layer: ${formatStatusLayerValue(currentLayer)}/${formatStatusLayerValue(totalLayer)}`;
}
function mergePrintStatsSnapshot(printStats) {
  const partial = printStats && typeof printStats === "object" ? printStats : {};
  const previous = state.printStatus.lastPrintStats || {};
  const merged = { ...previous, ...partial };
  const previousInfo = previous?.info && typeof previous.info === "object" ? previous.info : {};
  const partialInfo = partial?.info && typeof partial.info === "object" ? partial.info : {};

  if (Object.keys(previousInfo).length || Object.keys(partialInfo).length) {
    merged.info = { ...previousInfo, ...partialInfo };
  }

  state.printStatus.lastPrintStats = merged;
  return merged;
}

function updateStatusTiming(printStats) {
  renderStatusTiming(printStats);
}

function formatStatusPercent(value) {
  if (!Number.isFinite(value) || value < 0) return "--%";
  return `${Math.round(value * 100)}%`;
}

function formatStatusFilament(mm) {
  if (!Number.isFinite(mm) || mm < 0) return "--";

  if (mm >= 1000) {
    return `${(mm / 1000).toFixed(2)} m`;
  }

  return `${Math.round(mm)} mm`;
}

function formatStatusSpeedMmPerSec(mmPerSec) {
  if (!Number.isFinite(mmPerSec) || mmPerSec < 0) return "-- mm/s";

  if (mmPerSec >= 100) {
    return `${Math.round(mmPerSec)} mm/s`;
  }

  return `${mmPerSec.toFixed(1)} mm/s`;
}

function updateStatusRatesAndFilament(printStats, gcodeMove = null, motionReport = null) {
  if (gcodeMove && typeof gcodeMove === "object") {
    state.printStatus.lastGcodeMove = {
      ...state.printStatus.lastGcodeMove,
      ...gcodeMove,
    };
  }

  if (motionReport && typeof motionReport === "object") {
    state.printStatus.lastMotionReport = {
      ...state.printStatus.lastMotionReport,
      ...motionReport,
    };
  }

  const liveVelocity = Number(state.printStatus.lastMotionReport?.live_velocity);
  const fallbackSpeed = Number(state.printStatus.lastGcodeMove?.speed);
  const speedMmPerSec = Number.isFinite(liveVelocity) && liveVelocity >= 0 ? liveVelocity : fallbackSpeed;
  const flowrateFactor = Number(state.printStatus.lastGcodeMove?.extrude_factor);
  const filamentUsedIncoming = Number(printStats?.filament_used);

  if (Number.isFinite(filamentUsedIncoming) && filamentUsedIncoming >= 0) {
    state.printStatus.lastFilamentUsed = filamentUsedIncoming;
  }

  if (els.statusSpeed) {
    els.statusSpeed.textContent = formatStatusSpeedMmPerSec(speedMmPerSec);
  }

  if (els.statusFlowrate) {
    els.statusFlowrate.textContent = formatStatusPercent(flowrateFactor);
  }

  if (els.statusFilament) {
    els.statusFilament.textContent = formatStatusFilament(state.printStatus.lastFilamentUsed);
  }
}
function pickThumbnailPath(metadata) {
  const thumbnails = Array.isArray(metadata?.thumbnails) ? metadata.thumbnails : [];
  if (!thumbnails.length) return "";

  const withPath = thumbnails.filter((thumb) => typeof thumb?.relative_path === "string" && thumb.relative_path);
  if (!withPath.length) return "";

  const scored = withPath
    .map((thumb) => {
      const width = Number(thumb.width);
      const delta = Number.isFinite(width) ? Math.abs(width - 96) : 9999;
      return { thumb, delta };
    })
    .sort((a, b) => a.delta - b.delta);

  return scored[0]?.thumb?.relative_path || "";
}

async function syncStatusFileMetadata(filename) {
  const normalized = typeof filename === "string" ? filename.trim() : "";

  if (!normalized || !state.client) {
    setStatusThumbnail("");
    return;
  }

  if (state.printStatus.metadataByFile.has(normalized)) {
    const cachedEntry = getStatusMetadataEntry(normalized);
    setStatusThumbnail(cachedEntry?.thumbnailPath || "");
    renderStatusTiming(state.printStatus.lastPrintStats);
    renderStatusLayer(state.printStatus.lastPrintStats);
    return;
  }

  const requestId = ++state.printStatus.metadataRequestId;

  try {
    const response = await state.client.call(`/server/files/metadata?filename=${encodeURIComponent(normalized)}`);
    const metadata = response?.result || {};
    const thumbnailPath = pickThumbnailPath(metadata);
    const estimatedTime = Number(metadata.estimated_time);
    const layerCount = Number(metadata.layer_count);

    const metadataEntry = {
      thumbnailPath,
      estimatedTime: Number.isFinite(estimatedTime) && estimatedTime > 0 ? estimatedTime : null,
      totalLayers: Number.isFinite(layerCount) && layerCount > 0 ? Math.round(layerCount) : null,
      layerHeight: readPositiveNumber(metadata.layer_height),
      firstLayerHeight: readPositiveNumber(metadata.first_layer_height),
    };

    state.printStatus.metadataByFile.set(normalized, metadataEntry);

    if (requestId !== state.printStatus.metadataRequestId) return;
    if (state.printStatus.filename !== normalized) return;

    setStatusThumbnail(metadataEntry.thumbnailPath || "");
    renderStatusTiming(state.printStatus.lastPrintStats);
    renderStatusLayer(state.printStatus.lastPrintStats);
  } catch (error) {
    const message = error?.message || String(error);
    log.debug("Print file metadata load skipped.", {
      filename: normalized,
      error: message,
    });

    state.printStatus.metadataByFile.set(normalized, {
      thumbnailPath: "",
      estimatedTime: null,
      totalLayers: null,
      layerHeight: null,
      firstLayerHeight: null,
    });

    if (requestId !== state.printStatus.metadataRequestId) return;
    if (state.printStatus.filename !== normalized) return;

    setStatusThumbnail("");
    renderStatusTiming(state.printStatus.lastPrintStats);
    renderStatusLayer(state.printStatus.lastPrintStats);
  }
}

function updateStatusFileInfo(printStats, gcodeMove = null, motionReport = null) {
  const stats = mergePrintStatsSnapshot(printStats);
  const filename = typeof stats.filename === "string" ? stats.filename : "";
  const normalized = filename.trim();
  setStatusFilename(filename);
  updateStatusTiming(stats);
  updateStatusRatesAndFilament(stats, gcodeMove, motionReport);
  renderStatusLayer(stats);

  if (!normalized) {
    setStatusThumbnail("");
    return;
  }

  if (!state.printStatus.metadataByFile.has(normalized)) {
    setStatusThumbnail("");
  }

  void syncStatusFileMetadata(normalized);
}

function switchView(viewName) {
  els.navItems.forEach((btn) => btn.classList.toggle("active", btn.dataset.view === viewName));
  els.views.forEach((view) => view.classList.toggle("active", view.id === `view-${viewName}`));
  els.pageTitle.textContent = viewName.slice(0, 1).toUpperCase() + viewName.slice(1);
}

function inferAxisCommand(axisToken) {
  const axis = axisToken[0];
  const positive = axisToken[1] === "+";
  const distance = axis === "Z" ? 1 : 10;
  const signed = positive ? distance : -distance;
  return `G91\nG0 ${axis}${signed} F6000\nG90`;
}

function renderCameraIntoContainer(container, config, title) {
  container.innerHTML = "";

  if (!config.enabled) {
    const info = document.createElement("p");
    info.className = "muted";
    info.textContent = `${title} disabled in Settings.`;
    container.appendChild(info);
    return;
  }

  if (!config.url) {
    const info = document.createElement("p");
    info.className = "muted";
    info.textContent = `Set ${title} URL in Settings.`;
    container.appendChild(info);
    return;
  }

  if (config.renderMode === CAMERA_MODES.IFRAME) {
    const frame = document.createElement("iframe");
    frame.src = config.url;
    frame.title = title;
    frame.loading = "lazy";
    container.appendChild(frame);
    return;
  }

  const image = document.createElement("img");
  image.src = config.url;
  image.alt = title;
  image.referrerPolicy = "no-referrer";
  image.addEventListener("error", () => {
    container.innerHTML = `<p class=\"muted\">${title} failed to load.</p>`;
  });
  container.appendChild(image);
}

function renderCameraCards() {
  renderCameraIntoContainer(els.mainCameraFrame, state.camera, "Main Camera");
  renderCameraIntoContainer(els.toolheadCameraFrame, state.toolheadCamera, "Toolhead Cam");

  const mainReady = state.camera.enabled && !!state.camera.url;
  const toolheadReady = state.toolheadCamera.enabled && !!state.toolheadCamera.url;
  els.mainCameraFullscreen.disabled = !mainReady;
  els.toolheadCameraFullscreen.disabled = !toolheadReady;
}


function formatTemperatureValue(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--.-\u00B0C";
  return `${value.toFixed(1)}\u00B0C`;
}

function formatTemperatureTargetValue(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  return String(Math.round(Math.max(0, value)));
}

function clampTemperatureTarget(sensorKey, value) {
  const max = sensorKey === "hotend" ? 320 : 130;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.round(Math.max(0, Math.min(max, numeric)));
}

function heaterStateLabel(current, target) {
  if (!Number.isFinite(target) || target <= 0.5) return "off";
  if (!Number.isFinite(current)) return "on";
  if (current < target - 2) return "heating";
  return "on";
}

function stopTemperaturePolling() {
  if (temperaturePollTimer) {
    clearInterval(temperaturePollTimer);
    temperaturePollTimer = null;
  }
}

function startTemperaturePolling() {
  stopTemperaturePolling();
  if (!state.client) return;

  let inFlight = false;

  const poll = async () => {
    if (!state.client || inFlight) return;
    inFlight = true;

    try {
      const statusResponse = await state.client.call("/printer/objects/query?extruder&heater_bed&print_stats&virtual_sdcard&gcode_move&motion_report");
      const statusSnapshot = statusResponse?.result?.status || {};

      updateTemperatureSnapshotFromStatus(statusSnapshot);

      const virtualSd = mergeVirtualSdSnapshot(statusSnapshot?.virtual_sdcard || null);
      renderStatusProgress(virtualSd);
      updateStatusFileInfo(statusSnapshot?.print_stats || {}, statusSnapshot?.gcode_move || null, statusSnapshot?.motion_report || null);
    } catch (error) {
      const message = error?.message || String(error);
      log.debug("Status poll skipped.", { error: message });
    } finally {
      inFlight = false;
    }
  };

  poll();
  temperaturePollTimer = setInterval(poll, TEMPERATURE_POLL_INTERVAL_MS);
}
function updateTemperatureSnapshotFromStatus(status, { recordHistory = true } = {}) {
  const extruder = status?.extruder || {};
  const bed = status?.heater_bed || {};

  if (typeof extruder.temperature === "number") {
    state.temperatures.hotend.current = extruder.temperature;
  }

  if (typeof bed.temperature === "number") {
    state.temperatures.bed.current = bed.temperature;
  }

  if (typeof extruder.target === "number") {
    state.temperatures.hotend.target = extruder.target;
  }

  if (typeof bed.target === "number") {
    state.temperatures.bed.target = bed.target;
  }

  if (recordHistory) {
    const snapshot = {
      time: Date.now(),
      hotendCurrent: state.temperatures.hotend.current,
      hotendTarget: state.temperatures.hotend.target,
      bedCurrent: state.temperatures.bed.current,
      bedTarget: state.temperatures.bed.target,
    };

    const history = state.temperatures.history;
    const last = history[history.length - 1];

    if (last && snapshot.time - last.time < TEMPERATURE_HISTORY_SAMPLE_MS) {
      history[history.length - 1] = {
        ...snapshot,
        // Keep the original sample timestamp so rapid websocket updates
        // still roll over into new points at a steady cadence.
        time: last.time,
      };
    } else {
      history.push(snapshot);
    }

    if (history.length > TEMPERATURE_HISTORY_LIMIT) {
      history.splice(0, history.length - TEMPERATURE_HISTORY_LIMIT);
    }

    scheduleTemperatureHistorySave();
  }

  renderTemperaturePanel();
}

function saveTemperatureChartPreferences() {
  localStorage.setItem("temperature_show_chart", String(state.temperatures.chart.show));
  localStorage.setItem("temperature_hide_host_sensors", String(state.temperatures.chart.hideHostSensors));
  localStorage.setItem("temperature_hide_monitors", String(state.temperatures.chart.hideMonitors));
  localStorage.setItem("temperature_autoscale_chart", String(state.temperatures.chart.autoscale));
}

function closeTemperatureSettingsMenu() {
  if (!els.tempSettingsMenu || !els.tempSettingsToggle) return;
  els.tempSettingsMenu.hidden = true;
  els.tempSettingsToggle.setAttribute("aria-expanded", "false");
}

function closeTemperatureTargetMenus(exceptMenu = null) {
  [els.tempHotendTargetMenu, els.tempBedTargetMenu].forEach((menu) => {
    if (!menu || menu === exceptMenu) return;
    menu.hidden = true;
  });
}

function buildTargetPresetIcon() {
  return `
    <svg class="target-preset-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2v20M4.93 6l14.14 12M19.07 6 4.93 18M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
    </svg>
  `;
}

function buildTemperatureTargetMenu(sensorKey) {
  const menu = sensorKey === "hotend" ? els.tempHotendTargetMenu : els.tempBedTargetMenu;
  if (!menu) return;

  menu.innerHTML = "";
  const currentTarget = Math.round(state.temperatures[sensorKey].target || 0);

  TEMPERATURE_PRESETS[sensorKey].forEach((preset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "target-preset-item";
    button.innerHTML = `${buildTargetPresetIcon()}<span>${preset}\u00B0C</span>`;

    if (preset === currentTarget) {
      button.classList.add("target-preset-active");
    }

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      await setTemperatureTarget(sensorKey, preset);
      closeTemperatureTargetMenus();
    });

    menu.appendChild(button);
  });
}

function buildTemperatureTargetMenus() {
  buildTemperatureTargetMenu("hotend");
  buildTemperatureTargetMenu("bed");
}

function openTemperatureTargetMenu(sensorKey) {
  const menu = sensorKey === "hotend" ? els.tempHotendTargetMenu : els.tempBedTargetMenu;
  if (!menu) return;

  buildTemperatureTargetMenu(sensorKey);
  const isOpening = menu.hidden;
  closeTemperatureTargetMenus();
  menu.hidden = !isOpening;
}

function applyTemperatureChartVisibility() {
  if (!els.temperatureChartWrap) return;
  els.temperatureChartWrap.classList.toggle("is-hidden", !state.temperatures.chart.show);

  if (!state.temperatures.chart.show) {
    state.temperatures.chart.hoverIndex = null;
    if (els.temperatureChartTooltip) {
      els.temperatureChartTooltip.hidden = true;
    }
    return;
  }

  renderTemperatureChart();
}

function renderTemperatureTable() {
  const hotendCurrent = state.temperatures.hotend.current;
  const bedCurrent = state.temperatures.bed.current;
  const hotendTarget = state.temperatures.hotend.target;
  const bedTarget = state.temperatures.bed.target;

  if (els.tempHotend) els.tempHotend.textContent = formatTemperatureValue(hotendCurrent);
  if (els.tempBed) els.tempBed.textContent = formatTemperatureValue(bedCurrent);

  if (els.tempHotendTarget) els.tempHotendTarget.textContent = formatTemperatureTargetValue(hotendTarget);
  if (els.tempBedTarget) els.tempBedTarget.textContent = formatTemperatureTargetValue(bedTarget);

  if (els.tempHotendState) {
    els.tempHotendState.textContent = heaterStateLabel(hotendCurrent, hotendTarget);
  }

  if (els.tempBedState) {
    els.tempBedState.textContent = heaterStateLabel(bedCurrent, bedTarget);
  }

  if (els.tempHotendTargetInput && document.activeElement !== els.tempHotendTargetInput) {
    els.tempHotendTargetInput.value = formatTemperatureTargetValue(hotendTarget);
  }

  if (els.tempBedTargetInput && document.activeElement !== els.tempBedTargetInput) {
    els.tempBedTargetInput.value = formatTemperatureTargetValue(bedTarget);
  }

  buildTemperatureTargetMenus();
}

function temperatureTooltipLine(current, target) {
  const safeCurrent = Number.isFinite(current) ? current : 0;
  const safeTarget = Number.isFinite(target) ? target : 0;
  const pct = safeTarget > 0 ? Math.round((safeCurrent / safeTarget) * 100) : 0;
  return `${safeCurrent.toFixed(1)} / ${safeTarget.toFixed(1)}\u00B0C [${Math.max(0, pct)}%]`;
}

function toChartX(layout, timestamp) {
  const ratio = (timestamp - layout.startTime) / (layout.endTime - layout.startTime || 1);
  return layout.left + ratio * layout.width;
}

function toChartY(layout, value) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const ratio = Math.max(0, Math.min(1, safeValue / layout.yMax));
  return layout.top + (1 - ratio) * layout.height;
}

function drawTemperatureChartGrid(ctx, layout) {
  ctx.save();
  ctx.strokeStyle = "rgba(148, 163, 184, 0.22)";
  ctx.lineWidth = 1;

  const horizontalLines = 5;
  for (let i = 0; i <= horizontalLines; i += 1) {
    const y = layout.top + (layout.height * i) / horizontalLines;
    ctx.beginPath();
    ctx.moveTo(layout.left, y);
    ctx.lineTo(layout.left + layout.width, y);
    ctx.stroke();

    const value = layout.yMax - (layout.yMax * i) / horizontalLines;
    ctx.fillStyle = "rgba(203, 213, 225, 0.72)";
    ctx.font = '13px "JetBrains Mono"';
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(String(Math.round(value)), layout.left - 8, y);
  }

  const verticalLines = 9;
  for (let i = 0; i <= verticalLines; i += 1) {
    const x = layout.left + (layout.width * i) / verticalLines;
    ctx.beginPath();
    ctx.moveTo(x, layout.top);
    ctx.lineTo(x, layout.top + layout.height);
    ctx.stroke();

    const t = layout.startTime + ((layout.endTime - layout.startTime) * i) / verticalLines;
    ctx.fillStyle = "rgba(148, 163, 184, 0.68)";
    ctx.font = '13px "JetBrains Mono"';
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const label = new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    ctx.fillText(label, x, layout.top + layout.height + 10);
  }

  ctx.restore();
}

function drawTemperatureLine(ctx, layout, history, currentKey, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

    let started = false;
  let pointsPlotted = 0;
  let lastPoint = null;

  history.forEach((point) => {
    const value = point[currentKey];
    if (!Number.isFinite(value)) return;

    const x = toChartX(layout, point.time);
    const y = toChartY(layout, value);
    lastPoint = { x, y };
    pointsPlotted += 1;

    if (!started) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  });

  if (started) ctx.stroke();

  if (pointsPlotted === 1 && lastPoint) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function updateTemperatureTooltip(layout) {
  if (!els.temperatureChartTooltip) return;

  const { hoverIndex } = state.temperatures.chart;
  const hovered = Number.isInteger(hoverIndex) ? layout.history[hoverIndex] : null;
  if (!hovered) {
    els.temperatureChartTooltip.hidden = true;
    return;
  }

  if (els.temperatureTooltipTime) {
    els.temperatureTooltipTime.textContent = new Date(hovered.time).toLocaleTimeString();
  }

  if (els.temperatureTooltipHotend) {
    els.temperatureTooltipHotend.textContent = temperatureTooltipLine(hovered.hotendCurrent, hovered.hotendTarget);
  }

  if (els.temperatureTooltipBed) {
    els.temperatureTooltipBed.textContent = temperatureTooltipLine(hovered.bedCurrent, hovered.bedTarget);
  }

  const x = toChartX(layout, hovered.time);
  els.temperatureChartTooltip.hidden = false;

  const tooltipWidth = els.temperatureChartTooltip.offsetWidth || 248;
  const left = Math.max(8, Math.min(layout.canvasWidth - tooltipWidth - 8, x + 12));

  els.temperatureChartTooltip.style.left = `${left}px`;
  els.temperatureChartTooltip.style.top = `${Math.max(8, layout.top + 10)}px`;
}

function renderTemperatureChart() {
  const canvas = els.temperatureChart;
  if (!canvas || !state.temperatures.chart.show) return;

  const history = state.temperatures.history.slice(-TEMPERATURE_HISTORY_LIMIT);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const canvasWidth = Math.max(10, canvas.clientWidth || 10);
  const canvasHeight = Math.max(10, canvas.clientHeight || 10);
  const dpr = window.devicePixelRatio || 1;

  const requiredWidth = Math.round(canvasWidth * dpr);
  const requiredHeight = Math.round(canvasHeight * dpr);

  if (canvas.width !== requiredWidth || canvas.height !== requiredHeight) {
    canvas.width = requiredWidth;
    canvas.height = requiredHeight;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const left = 46;
  const right = 12;
  const top = 10;
  const bottom = 40;
  const width = Math.max(16, canvasWidth - left - right);
  const height = Math.max(16, canvasHeight - top - bottom);

  const lastTimestamp = history[history.length - 1]?.time || Date.now();
  const firstTimestamp = history[0]?.time || lastTimestamp - 10 * 60 * 1000;
  const minimumWindow = 10 * 60 * 1000;
  const startTime = Math.min(firstTimestamp, lastTimestamp - minimumWindow);
  const endTime = Math.max(lastTimestamp, startTime + minimumWindow);

  const peak = history.reduce((max, point) => {
    const pointMax = Math.max(
      Number.isFinite(point.hotendCurrent) ? point.hotendCurrent : 0,
      Number.isFinite(point.hotendTarget) ? point.hotendTarget : 0,
      Number.isFinite(point.bedCurrent) ? point.bedCurrent : 0,
      Number.isFinite(point.bedTarget) ? point.bedTarget : 0,
    );
    return Math.max(max, pointMax);
  }, 0);

  const yMax = state.temperatures.chart.autoscale
    ? Math.max(60, Math.ceil((peak + 12) / 10) * 10)
    : TEMPERATURE_DEFAULT_MAX;

  const layout = {
    canvasWidth,
    canvasHeight,
    left,
    top,
    width,
    height,
    startTime,
    endTime,
    yMax,
    history,
  };

  drawTemperatureChartGrid(ctx, layout);
  const temperatureColors = getTemperatureLineColors();
  drawTemperatureLine(ctx, layout, history, "hotendCurrent", temperatureColors.hotend);
  drawTemperatureLine(ctx, layout, history, "bedCurrent", temperatureColors.bed);

  const hovered = Number.isInteger(state.temperatures.chart.hoverIndex)
    ? history[state.temperatures.chart.hoverIndex]
    : null;

  if (hovered) {
    const x = toChartX(layout, hovered.time);

    ctx.save();
    ctx.strokeStyle = "rgba(184, 198, 219, 0.62)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + height);
    ctx.stroke();
    ctx.setLineDash([]);

    [
      [hovered.hotendCurrent, temperatureColors.hotend],
      [hovered.bedCurrent, temperatureColors.bed],
    ].forEach(([value, color]) => {
      if (!Number.isFinite(value)) return;
      const y = toChartY(layout, value);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(15, 23, 42, 0.9)";
      ctx.stroke();
    });

    ctx.restore();
  }

  state.temperatures.chart.layout = layout;
  updateTemperatureTooltip(layout);
}

function renderTemperaturePanel() {
  renderTemperatureTable();
  applyTemperatureChartVisibility();
}

function handleTemperatureChartPointer(event) {
  const layout = state.temperatures.chart.layout;
  if (!layout || !els.temperatureChart) return;

  const rect = els.temperatureChart.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const insideX = x >= layout.left && x <= layout.left + layout.width;
  const insideY = y >= layout.top && y <= layout.top + layout.height;

  if (!insideX || !insideY) {
    if (state.temperatures.chart.hoverIndex !== null) {
      state.temperatures.chart.hoverIndex = null;
      renderTemperatureChart();
    }
    return;
  }

  const ratio = (x - layout.left) / layout.width;
  const targetTime = layout.startTime + ratio * (layout.endTime - layout.startTime);

  let closestIndex = null;
  let minDiff = Number.POSITIVE_INFINITY;

  layout.history.forEach((point, index) => {
    const diff = Math.abs(point.time - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = index;
    }
  });

  if (closestIndex !== state.temperatures.chart.hoverIndex) {
    state.temperatures.chart.hoverIndex = closestIndex;
    renderTemperatureChart();
  }
}

function handleTemperatureChartLeave() {
  if (state.temperatures.chart.hoverIndex === null) return;
  state.temperatures.chart.hoverIndex = null;
  renderTemperatureChart();
}

async function setTemperatureTarget(sensorKey, rawValue) {
  const target = clampTemperatureTarget(sensorKey, rawValue);
  if (target === null) return;

  if (sensorKey === "hotend") {
    if (els.tempHotendTargetInput) els.tempHotendTargetInput.value = String(target);
  } else {
    if (els.tempBedTargetInput) els.tempBedTargetInput.value = String(target);
  }

  const heaterName = sensorKey === "hotend" ? "extruder" : "heater_bed";
  const script = `SET_HEATER_TEMPERATURE HEATER=${heaterName} TARGET=${target}`;

  const sent = await executeGcodeAction(script, {
    actionLabel: `Set ${sensorKey === "hotend" ? "Extruder" : "Heater Bed"} target`,
    successMessage: `Target set to ${target}\u00B0C`,
  });

  if (!sent) return;

  state.temperatures[sensorKey].target = target;
  renderTemperaturePanel();
}

async function cooldownTemperaturePanel() {
  const sent = await executeGcodeAction("SET_HEATER_TEMPERATURE HEATER=extruder TARGET=0\nSET_HEATER_TEMPERATURE HEATER=heater_bed TARGET=0", {
    actionLabel: "Cooldown",
    successMessage: "Cooldown triggered.",
  });

  if (!sent) return;

  state.temperatures.hotend.target = 0;
  state.temperatures.bed.target = 0;
  renderTemperaturePanel();
}

function initializeTemperaturePanel() {
  if (!els.cardTemperatures) return;

  if (els.tempShowChart) els.tempShowChart.checked = state.temperatures.chart.show;
  if (els.tempHideHostSensors) els.tempHideHostSensors.checked = state.temperatures.chart.hideHostSensors;
  if (els.tempHideMonitors) els.tempHideMonitors.checked = state.temperatures.chart.hideMonitors;
  if (els.tempAutoscaleChart) els.tempAutoscaleChart.checked = state.temperatures.chart.autoscale;

  buildTemperatureTargetMenus();
  renderTemperaturePanel();
  closeTemperatureTargetMenus();
  closeTemperatureSettingsMenu();

  els.tempCooldown?.addEventListener("click", async () => {
    closeTemperatureTargetMenus();
    closeTemperatureSettingsMenu();
    await cooldownTemperaturePanel();
  });

  els.tempSettingsToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!els.tempSettingsMenu || !els.tempSettingsToggle) return;
    const opening = els.tempSettingsMenu.hidden;

    closeTemperatureTargetMenus();
    els.tempSettingsMenu.hidden = !opening;
    els.tempSettingsToggle.setAttribute("aria-expanded", String(opening));
  });

  [els.tempShowChart, els.tempHideHostSensors, els.tempHideMonitors, els.tempAutoscaleChart].forEach((checkbox) => {
    checkbox?.addEventListener("change", () => {
      state.temperatures.chart.show = els.tempShowChart?.checked ?? true;
      state.temperatures.chart.hideHostSensors = els.tempHideHostSensors?.checked ?? false;
      state.temperatures.chart.hideMonitors = els.tempHideMonitors?.checked ?? false;
      state.temperatures.chart.autoscale = els.tempAutoscaleChart?.checked ?? false;

      saveTemperatureChartPreferences();
      renderTemperaturePanel();
    });
  });

  els.tempHotendTargetToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeTemperatureSettingsMenu();
    openTemperatureTargetMenu("hotend");
  });

  els.tempBedTargetToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeTemperatureSettingsMenu();
    openTemperatureTargetMenu("bed");
  });

  [
    ["hotend", els.tempHotendTargetInput],
    ["bed", els.tempBedTargetInput],
  ].forEach(([sensorKey, input]) => {
    if (!input) return;

    input.addEventListener("keydown", async (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      await setTemperatureTarget(sensorKey, input.value);
      closeTemperatureTargetMenus();
      closeTemperatureSettingsMenu();
    });

    input.addEventListener("blur", async () => {
      const target = clampTemperatureTarget(sensorKey, input.value);
      if (target === null) {
        input.value = formatTemperatureTargetValue(state.temperatures[sensorKey].target);
      }
    });
  });

  els.temperatureChart?.addEventListener("mousemove", handleTemperatureChartPointer);
  els.temperatureChart?.addEventListener("mouseleave", handleTemperatureChartLeave);

  window.addEventListener("resize", () => {
    renderTemperatureChart();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeTemperatureTargetMenus();
    closeTemperatureSettingsMenu();
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (!els.cardTemperatures.contains(target)) {
      closeTemperatureTargetMenus();
      closeTemperatureSettingsMenu();
      return;
    }

    if (!target.closest(".target-control")) {
      closeTemperatureTargetMenus();
    }

    if (!target.closest("#temp-settings-menu") && !target.closest("#temp-settings-toggle")) {
      closeTemperatureSettingsMenu();
    }
  });
}
function openCameraFullscreen(cameraState, title) {
  if (!cameraState.enabled || !cameraState.url) return;

  els.cameraDialogContent.innerHTML = "";
  renderCameraIntoContainer(els.cameraDialogContent, cameraState, title);

  if (typeof els.cameraDialog.showModal === "function") {
    els.cameraDialog.showModal();
  }
}

function closeCameraFullscreen() {
  if (els.cameraDialog.open) {
    els.cameraDialog.close();
  }
}

function getCardHeader(card, index) {
  let header = card.querySelector(":scope > .card-head, :scope > .camera-card-head");
  if (header) {
    header.classList.add("card-head");
    return header;
  }

  let title = card.querySelector(":scope > h2, :scope > h3");
  if (!title) {
    title = document.createElement("h3");
    title.textContent = card.classList.contains("settings-actions") ? "Actions" : `Card ${index + 1}`;
    card.prepend(title);
  }

  header = document.createElement("div");
  header.className = "card-head";
  title.remove();
  header.appendChild(title);
  card.prepend(header);
  return header;
}

function getCardActionsContainer(header) {
  let actions = header.querySelector(":scope > .card-head-actions");
  if (actions) return actions;

  actions = document.createElement("div");
  actions.className = "card-head-actions";

  const title = header.querySelector(":scope > h2, :scope > h3");
  const movableNodes = [...header.children].filter((child) => child !== title && !child.classList.contains("card-head-actions"));
  movableNodes.forEach((node) => actions.appendChild(node));

  header.appendChild(actions);
  return actions;
}

function getCardBody(card, header) {
  let body = card.querySelector(":scope > .card-body");
  if (body) return body;

  body = document.createElement("div");
  body.className = "card-body";
  const nodes = [...card.children].filter((child) => child !== header);
  nodes.forEach((node) => body.appendChild(node));
  card.appendChild(body);
  return body;
}

function getCardStorageKey(card, index) {
  const viewId = card.closest(".view")?.id || "view";
  const fallback = `card-${index + 1}`;
  const titleText =
    card.querySelector(":scope > .card-head > h2, :scope > .card-head > h3")?.textContent?.trim() ||
    card.querySelector(":scope h2, :scope h3")?.textContent?.trim() ||
    fallback;

  const base = card.id || titleText || fallback;
  return `${CARD_COLLAPSE_KEY_PREFIX}${slugify(`${viewId}-${base}`)}`;
}

function updateCollapseButton(toggle, collapsed) {
  toggle.dataset.state = collapsed ? "collapsed" : "expanded";
  toggle.setAttribute("aria-expanded", String(!collapsed));
  toggle.setAttribute("title", collapsed ? "Expand card" : "Collapse card");
}

function setCardCollapsedState(card, toggle, storageKey, collapsed) {
  card.classList.toggle("card-collapsed", collapsed);
  updateCollapseButton(toggle, collapsed);
  localStorage.setItem(storageKey, collapsed ? "1" : "0");
}

function setupCollapsibleCards() {
  const cards = [...document.querySelectorAll(".view .card")];

  cards.forEach((card, index) => {
    const header = getCardHeader(card, index);
    const actions = getCardActionsContainer(header);
    getCardBody(card, header);

    let toggle = actions.querySelector(":scope > .card-collapse-toggle");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "card-collapse-toggle";
      toggle.setAttribute("aria-label", "Toggle card");
      toggle.innerHTML = '<span class="card-collapse-icon" aria-hidden="true"></span>';
      actions.appendChild(toggle);
    } else if (!toggle.querySelector(".card-collapse-icon")) {
      toggle.innerHTML = '<span class="card-collapse-icon" aria-hidden="true"></span>';
    }

    const storageKey = getCardStorageKey(card, index);
    const collapsed = localStorage.getItem(storageKey) === "1";

    setCardCollapsedState(card, toggle, storageKey, collapsed);

    toggle.addEventListener("click", () => {
      const nextCollapsed = !card.classList.contains("card-collapsed");
      setCardCollapsedState(card, toggle, storageKey, nextCollapsed);
    });
  });
}

async function connectMoonraker() {
  appendConsole(`Connecting to ${state.moonrakerUrl}`, "info");
  log.info("Connecting to Moonraker.", { baseUrl: state.moonrakerUrl });
  stopTemperaturePolling();

  if (state.client?.ws && state.client.ws.readyState <= 1) {
    try {
      state.client.ws.close();
      log.debug("Closed previous websocket before reconnect.");
  } catch (error) {
      const message = error?.message || String(error);
      appendConsole(`Previous websocket close failed: ${message}`, "warn");
      log.warn("Previous websocket close failed.", { error: message });
    }
  }

  state.client = new MoonrakerClient(state.moonrakerUrl);
  setConnectionUi("connecting");

  state.client.onConnectionState((status) => {
    setConnectionUi(status);

    if (status === "connected") {
      appendConsole("Moonraker connected.", "info");
      startTemperaturePolling();
      log.info("Moonraker websocket connected.");
      return;
    }

    if (status === "disconnected") {
      appendConsole("Moonraker disconnected.", "warn");
      stopTemperaturePolling();
      log.warn("Moonraker websocket disconnected.");
      return;
    }

    if (status === "error") {
      appendConsole("Moonraker websocket error.", "error");
      stopTemperaturePolling();
      log.error("Moonraker websocket error.");
      return;
    }

    log.debug("Moonraker connection status update.", { status });
  });

  state.client.onMessage((payload) => {
    if (payload.method !== "notify_status_update") return;

    const [status] = payload.params || [];
    const printStats = status?.print_stats || {};
    const virtualSd = mergeVirtualSdSnapshot(status?.virtual_sdcard || null);
    renderStatusProgress(virtualSd);

    updateStatusFileInfo(printStats, status?.gcode_move || null, status?.motion_report || null);

    updateTemperatureSnapshotFromStatus(status);

    const reportedPrinterState = printStats.state || printStats.status;
    if (reportedPrinterState) {
      setPrinterState(reportedPrinterState);
    }

    const extruder = status?.extruder || {};
    const bed = status?.heater_bed || {};

    log.debug("Status update received.", {
      printerState: reportedPrinterState || null,
      progress: state.printStatus.lastVirtualSd?.progress ?? null,
      hotend: extruder.temperature ?? null,
      hotendTarget: extruder.target ?? null,
      bed: bed.temperature ?? null,
      bedTarget: bed.target ?? null,
    });
  });

  state.client.connectWebSocket();

  try {
    const statusResponse = await state.client.call("/printer/objects/query?print_stats&gcode_move&virtual_sdcard&motion_report");
    const statusSnapshot = statusResponse?.result?.status || {};
    const printStats = statusSnapshot.print_stats || {};
    const gcodeMove = statusSnapshot.gcode_move || null;
    const motionReport = statusSnapshot.motion_report || null;
    const virtualSd = mergeVirtualSdSnapshot(statusSnapshot.virtual_sdcard || null);
    renderStatusProgress(virtualSd);
    const printerState = printStats.state || printStats.status || "ready";
    setPrinterState(printerState);
    updateStatusFileInfo(printStats, gcodeMove, motionReport);
    log.debug("Initial printer state loaded.", { printerState });
  } catch (error) {
    const message = error?.message || String(error);
    appendConsole(`Printer state load failed: ${message}`, "error");
    log.error("Printer state load failed.", { error: message });
  }

  try {
    const temperatureResponse = await state.client.call("/printer/objects/query?extruder&heater_bed");
    const temperatureStatus = temperatureResponse?.result?.status || {};
    updateTemperatureSnapshotFromStatus(temperatureStatus);
  } catch (error) {
    const message = error?.message || String(error);
    appendConsole(`Temperature load failed: ${message}`, "warn");
    log.warn("Temperature load failed.", { error: message });
  }

  try {
    const macroResponse = await state.client.getMacros();
    const settings = macroResponse?.result?.status?.configfile?.settings || {};
    const macros = Object.keys(settings).filter((k) => k.startsWith("gcode_macro "));
    renderMacros(macros);
    log.info("Macros loaded.", { count: macros.length });
  } catch (error) {
    const message = error?.message || String(error);
    appendConsole(`Macro load failed: ${message}`, "error");
    log.error("Macro load failed.", { error: message });
  }

  try {
    const fileResponse = await state.client.getFiles();
    const files = fileResponse?.result || [];
    renderFiles(files);
    log.info("File list loaded.", { count: files.length });
  } catch (error) {
    const message = error?.message || String(error);
    appendConsole(`File list load failed: ${message}`, "error");
    log.error("File list load failed.", { error: message });
  }
}

function renderMacros(macroKeys) {
  els.macroList.innerHTML = "";
  if (!macroKeys.length) {
    els.macroList.textContent = "No macros found.";
    return;
  }

  macroKeys.forEach((macro) => {
    const name = macro.replace("gcode_macro ", "");
    const button = document.createElement("button");
    button.textContent = name;
    button.addEventListener("click", async () => {
      await executeGcodeAction(name, {
        actionLabel: `Macro ${name}`,
        successMessage: `Macro executed: ${name}`,
      });
    });
    els.macroList.appendChild(button);
  });
}

function renderFiles(files) {
  els.fileList.innerHTML = "";
  if (!files.length) {
    els.fileList.textContent = "No files available.";
    return;
  }

  files.slice(0, 40).forEach((file) => {
    const row = document.createElement("div");
    row.className = "file-row";
    row.innerHTML = `<strong>${file.path}</strong><div class=\"muted\">${Math.round((file.size || 0) / 1024)} KB</div>`;
    els.fileList.appendChild(row);
  });
}

async function executeGcodeAction(script, { actionLabel = script, successMessage = null } = {}) {
  if (!state.client) {
    appendConsole(`Cannot run "${actionLabel}" while disconnected.`, "warn");
    log.warn("Skipped G-code action because client is unavailable.", {
      actionLabel,
      script,
    });
    return false;
  }

  log.info("Sending G-code action.", {
    actionLabel,
    script,
  });

  try {
    await state.client.runGcode(script);
    if (successMessage) {
      appendConsole(successMessage, "info");
    }
    log.debug("G-code action completed.", { actionLabel });
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    appendConsole(`${actionLabel} failed: ${message}`, "error");
    log.error("G-code action failed.", {
      actionLabel,
      script,
      error: message,
    });
    return false;
  }
}

function wireEvents() {
  els.navItems.forEach((btn) => btn.addEventListener("click", () => switchView(btn.dataset.view)));
  els.sidebarToggle?.addEventListener("click", toggleSidebar);

  els.openDashboardLayout?.addEventListener("click", openDashboardLayoutDialog);
  els.dashboardLayoutClose?.addEventListener("click", closeDashboardLayoutDialog);
  els.dashboardLayoutSave?.addEventListener("click", saveDashboardLayout);
  els.dashboardLayoutReset?.addEventListener("click", resetDashboardLayout);
  els.dashboardLayoutDialog?.addEventListener("click", (event) => {
    if (event.target === els.dashboardLayoutDialog) {
      closeDashboardLayoutDialog();
    }
  });

  els.settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const url = els.moonrakerUrl.value.trim();
    if (!url) return;

    state.moonrakerUrl = url;
    state.interface.theme = INTERFACE_THEMES.includes(els.interfaceTheme.value) ? els.interfaceTheme.value : "ocean";
    state.interface.compact = els.interfaceCompact.checked;
    state.interface.density = INTERFACE_DENSITIES.includes(els.interfaceDensity.value) ? els.interfaceDensity.value : "comfortable";

    state.dashboard.showPrintProgress = els.dashShowPrintProgress.checked;
    state.dashboard.showTemperatures = els.dashShowTemperatures.checked;
    state.dashboard.showMotion = els.dashShowMotion.checked;
    state.dashboard.showQuickCommands = els.dashShowQuickCommands.checked;
    state.dashboard.showMainCamera = els.dashShowMainCamera.checked;
    state.dashboard.showToolheadCamera = els.dashShowToolheadCamera.checked;

    state.camera.enabled = els.cameraEnabled.checked;
    state.camera.url = els.cameraUrl.value.trim();
    state.camera.renderMode = els.cameraRenderMode.value === CAMERA_MODES.IFRAME ? CAMERA_MODES.IFRAME : CAMERA_MODES.IMAGE;

    state.toolheadCamera.enabled = els.toolheadCameraEnabled.checked;
    state.toolheadCamera.url = els.toolheadCameraUrl.value.trim();
    state.toolheadCamera.renderMode = els.toolheadCameraRenderMode.value === CAMERA_MODES.IFRAME ? CAMERA_MODES.IFRAME : CAMERA_MODES.IMAGE;

    localStorage.setItem("moonraker_url", state.moonrakerUrl);
    localStorage.setItem("interface_theme", state.interface.theme);
    localStorage.setItem("interface_compact", String(state.interface.compact));
    localStorage.setItem("interface_density", state.interface.density);
    localStorage.setItem("interface_sidebar_collapsed", String(state.interface.sidebarCollapsed));
    localStorage.setItem("dashboard_show_print_progress", String(state.dashboard.showPrintProgress));
    localStorage.setItem("dashboard_show_temperatures", String(state.dashboard.showTemperatures));
    localStorage.setItem("dashboard_show_motion", String(state.dashboard.showMotion));
    localStorage.setItem("dashboard_show_quick_commands", String(state.dashboard.showQuickCommands));
    localStorage.setItem("dashboard_show_main_camera", String(state.dashboard.showMainCamera));
    localStorage.setItem("dashboard_show_toolhead_camera", String(state.dashboard.showToolheadCamera));
    localStorage.setItem("dashboard_layout", JSON.stringify(state.dashboard.layout));
    localStorage.setItem("dashboard_layout_order", JSON.stringify(flattenDashboardLayout(state.dashboard.layout)));
    localStorage.setItem("camera_enabled", String(state.camera.enabled));
    localStorage.setItem("camera_url", state.camera.url);
    localStorage.setItem("camera_render_mode", state.camera.renderMode);
    localStorage.setItem("toolhead_camera_enabled", String(state.toolheadCamera.enabled));
    localStorage.setItem("toolhead_camera_url", state.toolheadCamera.url);
    localStorage.setItem("toolhead_camera_render_mode", state.toolheadCamera.renderMode);

    applyInterfaceSettings();
    applyDashboardLayout();
    applyDashboardSettings();
    renderCameraCards();
    appendConsole("Settings saved.", "info");
    log.info("Settings saved.", {
      moonrakerUrl: state.moonrakerUrl,
      theme: state.interface.theme,
      density: state.interface.density,
    });
    await connectMoonraker();
  });

  els.consoleForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const command = els.consoleInput.value.trim();
    if (!command) return;

    const sent = await executeGcodeAction(command, {
      actionLabel: "Console command",
      successMessage: `> ${command}`,
    });

    if (sent) {
      els.consoleInput.value = "";
    }
  });

  els.quickGcode.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const command = btn.dataset.gcode;
      if (!command) return;
      await executeGcodeAction(command, {
        actionLabel: `Quick command ${command}`,
        successMessage: `> ${command}`,
      });
    });
  });

  els.jog.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const direction = btn.dataset.jog;
      if (!direction) return;
      const script = inferAxisCommand(direction);
      await executeGcodeAction(script, {
        actionLabel: `Jog ${direction}`,
        successMessage: `Jogged ${direction}`,
      });
    });
  });

  els.home.addEventListener("click", async () => {
    await executeGcodeAction("G28", {
      actionLabel: "Home axes",
      successMessage: "Home command sent.",
    });
  });

  els.mainCameraFullscreen.addEventListener("click", () => openCameraFullscreen(state.camera, "Main Camera"));
  els.toolheadCameraFullscreen.addEventListener("click", () => openCameraFullscreen(state.toolheadCamera, "Toolhead Cam"));
  els.cameraDialogClose.addEventListener("click", closeCameraFullscreen);
  els.cameraDialog.addEventListener("click", (event) => {
    if (event.target === els.cameraDialog) {
      closeCameraFullscreen();
    }
  });
}

function init() {
  els.moonrakerUrl.value = state.moonrakerUrl;

  els.interfaceTheme.value = state.interface.theme;
  els.interfaceCompact.checked = state.interface.compact;
  els.interfaceDensity.value = state.interface.density;

  els.dashShowPrintProgress.checked = state.dashboard.showPrintProgress;
  els.dashShowTemperatures.checked = state.dashboard.showTemperatures;
  els.dashShowMotion.checked = state.dashboard.showMotion;
  els.dashShowQuickCommands.checked = state.dashboard.showQuickCommands;
  els.dashShowMainCamera.checked = state.dashboard.showMainCamera;
  els.dashShowToolheadCamera.checked = state.dashboard.showToolheadCamera;

  els.cameraEnabled.checked = state.camera.enabled;
  els.cameraUrl.value = state.camera.url;
  els.cameraRenderMode.value = state.camera.renderMode;

  els.toolheadCameraEnabled.checked = state.toolheadCamera.enabled;
  els.toolheadCameraUrl.value = state.toolheadCamera.url;
  els.toolheadCameraRenderMode.value = state.toolheadCamera.renderMode;

  applyDashboardLayout();
  setupCollapsibleCards();
  initializeTemperaturePanel();
  applyInterfaceSettings();
  applyDashboardSettings();
  renderCameraCards();
  wireEvents();

  connectMoonraker().catch((error) => {
    const message = error?.message || String(error);
    log.error("Initial Moonraker connection failed.", { error: message });
    setConnectionUi("error");
    appendConsole(`Connect failed: ${message}`, "error");
  });
}

init();



