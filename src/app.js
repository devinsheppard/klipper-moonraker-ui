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
  "card-macros",
  "card-dashboard-console",
  "camera-main-card",
  "camera-toolhead-card",
];

const DASHBOARD_LAYOUT_DEFAULT = {
  left: ["card-print-progress", "card-motion", "camera-main-card", "card-macros"],
  right: ["card-temperatures", "card-quick-commands", "card-dashboard-console", "camera-toolhead-card"],
};

const DASHBOARD_CARD_LABELS = {
  "card-print-progress": "Status",
  "card-temperatures": "Temperatures",
  "card-motion": "Motion",
  "card-quick-commands": "Quick Commands",
  "card-macros": "Macros",
  "card-dashboard-console": "Console",
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

const VIEW_TITLES = {
  dashboard: "Dashboard",
  console: "Console",
  configuration: "Machine",
  files: "GCode Files",
  settings: "Settings",
};
const ACTIVE_VIEW_STORAGE_KEY = "active_view";
const CONFIG_SELECTED_PATH_STORAGE_KEY = "config_selected_path";
const CONFIG_FILE_FILTER_STORAGE_KEY = "config_file_type_filter";
const CONFIG_FILE_SEARCH_STORAGE_KEY = "config_file_search_filter";
const MACHINE_SIDE_COLLAPSED_STORAGE_KEY = "interface_machine_side_collapsed";
const JOBS_SORT_STORAGE_KEY = "jobs_sort_mode";
const JOBS_TYPE_FILTER_STORAGE_KEY = "jobs_type_filter";
const JOBS_SEARCH_STORAGE_KEY = "jobs_search_query";
const JOBS_DIRECTORY_STORAGE_KEY = "jobs_directory";
const JOBS_COLUMNS_STORAGE_KEY = "jobs_visible_columns";
const JOBS_SORT_VALUES = [
  "modified_desc",
  "modified_asc",
  "name_asc",
  "name_desc",
  "size_desc",
  "size_asc",
  "eta_desc",
  "eta_asc",
];
const JOBS_TYPE_FILTER_VALUES = ["all", "files", "folders"];
const JOBS_COLUMN_DEFINITIONS = [
  { key: "size", label: "Size" },
  { key: "modified", label: "Modified" },
  { key: "eta", label: "ETA" },
  { key: "total_layers", label: "Total Layers" },
  { key: "layer_height", label: "Layer Height" },
  { key: "first_layer_height", label: "First Layer Height" },
  { key: "object_height", label: "Object Height" },
  { key: "filament_length", label: "Filament Length" },
  { key: "filament_weight", label: "Filament Weight" },
  { key: "filament_type", label: "Filament Type" },
  { key: "filament_name", label: "Filament Name" },
  { key: "nozzle_diameter", label: "Nozzle Diameter" },
  { key: "slicer", label: "Slicer" },
  { key: "first_layer_extruder_temp", label: "First Layer Nozzle Temp" },
  { key: "first_layer_bed_temp", label: "First Layer Bed Temp" },
  { key: "chamber_temp", label: "Chamber Temp" },
];
const JOBS_COLUMN_KEYS = JOBS_COLUMN_DEFINITIONS.map((entry) => entry.key);
const JOBS_DEFAULT_VISIBLE_COLUMNS = ["size", "modified", "eta", "total_layers"];

const CONSOLE_LOG_LEVELS = new Set(["debug", "info", "warn", "error"]);
const CONSOLE_MAX_LINES = 1200;
const CONSOLE_STORE_FETCH_COUNT = 400;
const CONSOLE_STORE_POLL_INTERVAL_MS = 1200;
const CONSOLE_STORE_SEEN_KEY_LIMIT = 6000;
const CONSOLE_PENDING_COMMAND_LIMIT = 250;
const CONSOLE_HISTORY_STORAGE_KEY = "console_history_v1";
const CONSOLE_FILTER_STORAGE_KEY = "console_filter_v1";
const CONSOLE_AUTOSCROLL_STORAGE_KEY = "console_autoscroll_v1";
const CONSOLE_HIDE_TEMPS_STORAGE_KEY = "console_hide_temps_v1";
const CONSOLE_RAW_OUTPUT_STORAGE_KEY = "console_raw_output_v1";
const CONSOLE_HISTORY_LIMIT = 120;
const CONSOLE_PAUSED_BUFFER_LIMIT = 1500;
const CONSOLE_FILTER_VALUES = ["all", "command", "response", "error", "system"];
const CONSOLE_HELPER_BASE_COMMANDS = [
  "G0", "G1", "G2", "G3", "G4", "G10", "G20", "G21", "G28", "G90", "G91", "G92",
  "M82", "M83", "M84", "M104", "M105", "M106", "M107", "M109", "M114", "M115", "M117",
  "M118", "M140", "M141", "M190", "M191", "M220", "M221", "M400",
];
const CONSOLE_HELPER_FALLBACK = ["STATUS", "GET_POSITION", "QUERY_ENDSTOPS", "RESTART", "FIRMWARE_RESTART"];
const TEMPERATURE_PRESETS = {
  hotend: [0, 170, 200, 215, 240, 260],
  bed: [0, 45, 60, 80, 100],
};
const TEMPERATURE_DEFAULT_MAX = 250;
const TEMPERATURE_POLL_INTERVAL_MS = 800;
const SYSTEM_LOAD_POLL_INTERVAL_MS = 2000;
const UPDATE_MANAGER_POLL_INTERVAL_MS = 10000;
const UPDATE_MANAGER_LOG_LIMIT = 140;
const TEMPERATURE_HISTORY_SAMPLE_MS = 800;
const TEMPERATURE_CHART_WINDOW_MS = 10 * 60 * 1000;
const TEMPERATURE_CHART_SCROLL_STEP_RATIO = 0.18;
const TEMPERATURE_HISTORY_SESSION_KEY = "temperature_history_session_v1";
const TEMPERATURE_HISTORY_DB_NAME = "forge_ui_temperature_history";
const TEMPERATURE_HISTORY_DB_VERSION = 1;
const TEMPERATURE_HISTORY_STORE = "temperature_samples";
const TEMPERATURE_COLORS = {
  hotend: "#ff4a3f",
  bed: "#2ea3ff",
};
const CONFIG_FILE_TYPES = {
  ALL: "all",
  EXAMPLE: "example",
  LOG: "log",
  BACKUP: "backup",
  CONFIG: "config",
  DOC: "doc",
};
const CONFIG_FILE_TYPE_LABELS = {
  [CONFIG_FILE_TYPES.EXAMPLE]: "Examples",
  [CONFIG_FILE_TYPES.LOG]: "Logs",
  [CONFIG_FILE_TYPES.BACKUP]: "Backups",
  [CONFIG_FILE_TYPES.CONFIG]: "Configs",
  [CONFIG_FILE_TYPES.DOC]: "Other docs",
};
const CONFIG_FILE_TYPE_RANK = {
  [CONFIG_FILE_TYPES.EXAMPLE]: 0,
  [CONFIG_FILE_TYPES.LOG]: 1,
  [CONFIG_FILE_TYPES.BACKUP]: 2,
  [CONFIG_FILE_TYPES.CONFIG]: 3,
  [CONFIG_FILE_TYPES.DOC]: 4,
};
const CONFIG_FILE_HIDDEN_ROOTS = new Set(["gcodes", "timelapse", "timelapse_frames"]);
const CONFIG_FILE_FALLBACK_ROOTS = ["config", "logs", "docs", "config_example", "config_examples"];
const UPDATE_MANAGER_PRIMARY_ORDER = ["system", "klipper", "moonraker", "fluidd", "mainsail"];
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
  consoleClear: document.getElementById("console-clear"),
  consoleHelperToggle: document.getElementById("console-helper-toggle"),
  consoleSettingsToggle: document.getElementById("console-settings-toggle"),
  consoleHelperPanel: document.getElementById("console-helper-panel"),
  consoleSettingsPanel: document.getElementById("console-settings-panel"),
  consoleHideTemps: document.getElementById("console-hide-temps"),
  consoleRawOutput: document.getElementById("console-raw-output"),
  consolePause: document.getElementById("console-pause"),
  consoleAutoscroll: document.getElementById("console-autoscroll"),
  consoleFilter: document.getElementById("console-filter"),
  consoleSearch: document.getElementById("console-search"),
  consoleMeta: document.getElementById("console-meta"),
  consoleHelperGrid: document.getElementById("console-helper-grid"),
  dashboardConsoleLog: document.getElementById("dashboard-console-log"),
  dashboardConsoleForm: document.getElementById("dashboard-console-form"),
  dashboardConsoleInput: document.getElementById("dashboard-console-input"),
  dashboardConsoleClear: document.getElementById("dashboard-console-clear"),
  dashboardConsoleHelperToggle: document.getElementById("dashboard-console-helper-toggle"),
  dashboardConsoleSettingsToggle: document.getElementById("dashboard-console-settings-toggle"),
  dashboardConsoleHelperPanel: document.getElementById("dashboard-console-helper-panel"),
  dashboardConsoleSettingsPanel: document.getElementById("dashboard-console-settings-panel"),
  dashboardConsoleHideTemps: document.getElementById("dashboard-console-hide-temps"),
  dashboardConsoleRawOutput: document.getElementById("dashboard-console-raw-output"),
  dashboardConsolePause: document.getElementById("dashboard-console-pause"),
  dashboardConsoleAutoscroll: document.getElementById("dashboard-console-autoscroll"),
  dashboardConsoleFilter: document.getElementById("dashboard-console-filter"),
  dashboardConsoleSearch: document.getElementById("dashboard-console-search"),
  dashboardConsoleMeta: document.getElementById("dashboard-console-meta"),
  dashboardConsoleHelperGrid: document.getElementById("dashboard-console-helper-grid"),
  macroList: document.getElementById("macro-list"),
  dashboardMacroList: document.getElementById("dashboard-macro-list"),
  jobsCard: document.getElementById("jobs-card"),
  fileList: document.getElementById("file-list"),
  jobsRefresh: document.getElementById("jobs-refresh"),
  jobsUploadBtn: document.getElementById("jobs-upload-btn"),
  jobsUploadFolderBtn: document.getElementById("jobs-upload-folder-btn"),
  jobsUploadPrintBtn: document.getElementById("jobs-upload-print-btn"),
  jobsAddFileBtn: document.getElementById("jobs-add-file-btn"),
  jobsUploadInput: document.getElementById("jobs-upload-input"),
  jobsUploadFolderInput: document.getElementById("jobs-upload-folder-input"),
  jobsUploadPrintInput: document.getElementById("jobs-upload-print-input"),
  jobsAddFileInput: document.getElementById("jobs-add-file-input"),
  jobsNewFolder: document.getElementById("jobs-new-folder"),
  jobsSummary: document.getElementById("jobs-summary"),
  jobsFeaturePanel: document.getElementById("jobs-feature-panel"),
  jobsPathDisplay: document.getElementById("jobs-path-display"),
  jobsSortToggle: document.getElementById("jobs-sort-toggle"),
  jobsSortMenu: document.getElementById("jobs-sort-menu"),
  jobsColumnsToggle: document.getElementById("jobs-columns-toggle"),
  jobsColumnsMenu: document.getElementById("jobs-columns-menu"),
  jobsColumnsList: document.getElementById("jobs-columns-list"),
  jobsSearchToggle: document.getElementById("jobs-search-toggle"),
  jobsFilterToggle: document.getElementById("jobs-filter-toggle"),
  jobsFilterMenu: document.getElementById("jobs-filter-menu"),
  jobsAddToggle: document.getElementById("jobs-add-toggle"),
  jobsAddMenu: document.getElementById("jobs-add-menu"),
  jobsSearch: document.getElementById("jobs-search"),
  jobsSort: document.getElementById("jobs-sort"),
  jobsTypeFilter: document.getElementById("jobs-type-filter"),
  jobsActiveLabel: document.getElementById("jobs-active-label"),
  jobsPause: document.getElementById("jobs-pause"),
  jobsResume: document.getElementById("jobs-resume"),
  jobsCancel: document.getElementById("jobs-cancel"),
  jobsBreadcrumbs: document.getElementById("jobs-breadcrumbs"),
  jobsStatus: document.getElementById("jobs-status"),
  machineLayout: document.getElementById("machine-layout"),
  machineSideColumn: document.getElementById("machine-side-column"),
  machineSideToggle: document.getElementById("machine-side-toggle"),
  configRefresh: document.getElementById("config-refresh"),
  configUploadBtn: document.getElementById("config-upload-btn"),
  configUploadInput: document.getElementById("config-upload-input"),
  configFilter: document.getElementById("config-filter"),
  configFileSearch: document.getElementById("config-file-search"),
  configFileList: document.getElementById("config-file-list"),
  configCurrentFile: document.getElementById("config-current-file"),
  configStatus: document.getElementById("config-status"),
  configDownload: document.getElementById("config-download"),
  configDelete: document.getElementById("config-delete"),
  configNewBtn: document.getElementById("config-new-btn"),
  configIgnoreChanges: document.getElementById("config-ignore-changes"),
  configSaveRestart: document.getElementById("config-save-restart"),
  configDirtyPrompt: document.getElementById("config-dirty-prompt"),
  configEditor: document.getElementById("config-editor"),
  configSearchInput: document.getElementById("config-search-input"),
  configSearchPrev: document.getElementById("config-search-prev"),
  configSearchNext: document.getElementById("config-search-next"),
  configSearchCount: document.getElementById("config-search-count"),
  configSearchCase: document.getElementById("config-search-case"),
  configSearchWord: document.getElementById("config-search-word"),
  configSearchRegex: document.getElementById("config-search-regex"),
  machineSystemStatus: document.getElementById("machine-system-status"),
  machineMcuName: document.getElementById("machine-mcu-name"),
  machineMcuChip: document.getElementById("machine-mcu-chip"),
  machineMcuVersion: document.getElementById("machine-mcu-version"),
  machineMcuStats: document.getElementById("machine-mcu-stats"),
  machineHostArch: document.getElementById("machine-host-arch"),
  machineHostVersion: document.getElementById("machine-host-version"),
  machineHostOs: document.getElementById("machine-host-os"),
  machineHostStats: document.getElementById("machine-host-stats"),
  machineHostNetworkList: document.getElementById("machine-host-network-list"),
  machineDevicesGauge: document.getElementById("machine-devices-gauge"),
  machineDevicesValue: document.getElementById("machine-devices-value"),
  machineCpuGauge: document.getElementById("machine-cpu-gauge"),
  machineCpuGaugeValue: document.getElementById("machine-cpu-gauge-value"),
  machineMemGauge: document.getElementById("machine-mem-gauge"),
  machineMemGaugeValue: document.getElementById("machine-mem-gauge-value"),
  machineUpdateRefresh: document.getElementById("machine-update-refresh"),
  machineUpdateUpgradeAll: document.getElementById("machine-update-upgrade-all"),
  machineUpdateSummary: document.getElementById("machine-update-summary"),
  machineUpdateRate: document.getElementById("machine-update-rate"),
  machineUpdateList: document.getElementById("machine-update-list"),
  machineUpdateLog: document.getElementById("machine-update-log"),
  machineUpdateStatus: document.getElementById("machine-update-status"),
  machineEndstopsQuery: document.getElementById("machine-endstops-query"),
  machineEndstopsSummary: document.getElementById("machine-endstops-summary"),
  machineEndstopsList: document.getElementById("machine-endstops-list"),
  machineEndstopsStatus: document.getElementById("machine-endstops-status"),
  machineLogFilesRefresh: document.getElementById("machine-log-files-refresh"),
  machineLogFilesDeleteAll: document.getElementById("machine-log-files-delete-all"),
  machineLogFilesSummary: document.getElementById("machine-log-files-summary"),
  machineLogFilesList: document.getElementById("machine-log-files-list"),
  machineLogFilesStatus: document.getElementById("machine-log-files-status"),
  settingsForm: document.getElementById("settings-form"),
  moonrakerUrl: document.getElementById("moonraker-url"),
  interfaceTheme: document.getElementById("interface-theme"),
  interfaceCompact: document.getElementById("interface-compact"),
  interfaceDensity: document.getElementById("interface-density"),
  dashShowPrintProgress: document.getElementById("dash-show-print-progress"),
  dashShowTemperatures: document.getElementById("dash-show-temperatures"),
  dashShowMotion: document.getElementById("dash-show-motion"),
  dashShowQuickCommands: document.getElementById("dash-show-quick-commands"),
  dashShowMacros: document.getElementById("dash-show-macros"),
  dashShowMainCamera: document.getElementById("dash-show-main-camera"),
  dashShowToolheadCamera: document.getElementById("dash-show-toolhead-camera"),
  dashShowConsole: document.getElementById("dash-show-console"),
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
  cardMacros: document.getElementById("card-macros"),
  cardDashboardConsole: document.getElementById("card-dashboard-console"),
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
let machineLoadPollTimer = null;
let updateManagerPollTimer = null;
let consoleStorePollTimer = null;
let temperatureHistorySessionId = null;
let temperatureHistoryDbPromise = null;
let statusCountdownTimer = null;
let jobsColumnsDragKey = null;

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

function isKnownView(viewName) {
  return Object.prototype.hasOwnProperty.call(VIEW_TITLES, viewName);
}

function loadStoredView(fallback = "dashboard") {
  const raw = localStorage.getItem(ACTIVE_VIEW_STORAGE_KEY);
  return isKnownView(raw) ? raw : fallback;
}

function loadStoredConfigSelectedPath() {
  return String(localStorage.getItem(CONFIG_SELECTED_PATH_STORAGE_KEY) || "").trim();
}

function loadStoredConfigFileTypeFilter() {
  return normalizeConfigFileType(localStorage.getItem(CONFIG_FILE_FILTER_STORAGE_KEY));
}

function loadStoredConfigFileSearchQuery() {
  return String(localStorage.getItem(CONFIG_FILE_SEARCH_STORAGE_KEY) || "").trim();
}

function normalizeJobsSort(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return JOBS_SORT_VALUES.includes(normalized) ? normalized : "modified_desc";
}

function normalizeJobsTypeFilter(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return JOBS_TYPE_FILTER_VALUES.includes(normalized) ? normalized : "all";
}

function normalizeJobsDirectory(path) {
  return String(path || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function loadStoredJobsSort() {
  return normalizeJobsSort(localStorage.getItem(JOBS_SORT_STORAGE_KEY));
}

function loadStoredJobsTypeFilter() {
  return normalizeJobsTypeFilter(localStorage.getItem(JOBS_TYPE_FILTER_STORAGE_KEY));
}

function loadStoredJobsSearchQuery() {
  return String(localStorage.getItem(JOBS_SEARCH_STORAGE_KEY) || "").trim();
}

function loadStoredJobsDirectory() {
  return normalizeJobsDirectory(localStorage.getItem(JOBS_DIRECTORY_STORAGE_KEY));
}

function normalizeJobsVisibleColumns(value) {
  let candidate = [];

  if (Array.isArray(value)) {
    candidate = value;
  } else if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        candidate = parsed;
      }
    } catch {
      candidate = [];
    }
  }

  const normalized = candidate
    .map((entry) => String(entry || "").trim().toLowerCase())
    .map((entry) => (entry === "layers" ? "total_layers" : entry))
    .filter((entry) => JOBS_COLUMN_KEYS.includes(entry));

  const unique = [...new Set(normalized)];
  return unique.length ? unique : [...JOBS_DEFAULT_VISIBLE_COLUMNS];
}

function loadStoredJobsVisibleColumns() {
  return normalizeJobsVisibleColumns(localStorage.getItem(JOBS_COLUMNS_STORAGE_KEY));
}

function persistConfigViewState() {
  localStorage.setItem(CONFIG_SELECTED_PATH_STORAGE_KEY, state.config.selectedPath || "");
  localStorage.setItem(CONFIG_FILE_FILTER_STORAGE_KEY, normalizeConfigFileType(state.config.fileTypeFilter));
  localStorage.setItem(CONFIG_FILE_SEARCH_STORAGE_KEY, String(state.config.fileSearchQuery || "").trim());
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

function normalizeTemperatureHistoryPoint(point) {
  const time = normalizeTemperatureSample(point?.time, null);
  if (!Number.isFinite(time)) return null;

  return {
    time,
    hotendCurrent: normalizeTemperatureSample(point?.hotendCurrent, null),
    hotendTarget: normalizeTemperatureSample(point?.hotendTarget, 0),
    bedCurrent: normalizeTemperatureSample(point?.bedCurrent, null),
    bedTarget: normalizeTemperatureSample(point?.bedTarget, 0),
  };
}

function ensureTemperatureHistorySessionId() {
  if (temperatureHistorySessionId) return temperatureHistorySessionId;

  let sessionId = null;

  try {
    sessionId = sessionStorage.getItem(TEMPERATURE_HISTORY_SESSION_KEY);

    if (!sessionId) {
      sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(TEMPERATURE_HISTORY_SESSION_KEY, sessionId);
    }
  } catch {
    // Fall back to an in-memory session id if sessionStorage is unavailable.
  }

  if (!sessionId) {
    sessionId = `volatile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  temperatureHistorySessionId = sessionId;
  return sessionId;
}

function openTemperatureHistoryDatabase() {
  if (temperatureHistoryDbPromise) return temperatureHistoryDbPromise;

  temperatureHistoryDbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }

    const request = indexedDB.open(TEMPERATURE_HISTORY_DB_NAME, TEMPERATURE_HISTORY_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(TEMPERATURE_HISTORY_STORE)) {
        db.createObjectStore(TEMPERATURE_HISTORY_STORE, { keyPath: ["sessionId", "time"] });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to open temperature history database."));
    };
  });

  return temperatureHistoryDbPromise;
}

async function loadTemperatureHistoryForSession() {
  try {
    const db = await openTemperatureHistoryDatabase();
    if (!db) return [];

    const sessionId = ensureTemperatureHistorySessionId();

    return await new Promise((resolve, reject) => {
      const tx = db.transaction(TEMPERATURE_HISTORY_STORE, "readonly");
      const store = tx.objectStore(TEMPERATURE_HISTORY_STORE);
      const range = IDBKeyRange.bound([sessionId, 0], [sessionId, Number.MAX_SAFE_INTEGER]);
      const request = store.getAll(range);

      request.onsuccess = () => {
        const history = (request.result || [])
          .map((entry) => normalizeTemperatureHistoryPoint(entry))
          .filter(Boolean)
          .sort((a, b) => a.time - b.time);
        resolve(history);
      };

      request.onerror = () => {
        reject(request.error || new Error("Failed to read temperature history."));
      };
    });
  } catch (error) {
    log.debug("Temperature history load failed.", { error: error?.message || String(error) });
    return [];
  }
}

async function persistTemperatureHistoryPoint(point) {
  const normalizedPoint = normalizeTemperatureHistoryPoint(point);
  if (!normalizedPoint) return;

  try {
    const db = await openTemperatureHistoryDatabase();
    if (!db) return;

    const sessionId = ensureTemperatureHistorySessionId();

    await new Promise((resolve, reject) => {
      const tx = db.transaction(TEMPERATURE_HISTORY_STORE, "readwrite");
      const store = tx.objectStore(TEMPERATURE_HISTORY_STORE);

      store.put({
        sessionId,
        ...normalizedPoint,
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Failed to persist temperature sample."));
      tx.onabort = () => reject(tx.error || new Error("Temperature sample transaction aborted."));
    });
  } catch (error) {
    log.debug("Temperature history persist failed.", { error: error?.message || String(error) });
  }
}

async function restoreTemperatureHistoryForSession() {
  const restoredHistory = await loadTemperatureHistoryForSession();
  if (!restoredHistory.length) return;

  state.temperatures.history = restoredHistory;

  const latest = restoredHistory[restoredHistory.length - 1];
  state.temperatures.hotend.current = latest.hotendCurrent;
  state.temperatures.hotend.target = latest.hotendTarget;
  state.temperatures.bed.current = latest.bedCurrent;
  state.temperatures.bed.target = latest.bedTarget;
}

const initialTemperatureHistory = [];
const initialTemperatureSnapshot = initialTemperatureHistory[initialTemperatureHistory.length - 1] || null;

function createDefaultMachineLoadsState() {
  return {
    systemInfo: null,
    procStats: null,
    mcuStatus: null,
    systemStats: null,
    klipperVersion: "",
    lastError: "",
    lastUpdatedMs: null,
  };
}

function createDefaultUpdateManagerState() {
  return {
    busy: false,
    versionInfo: {},
    githubRateLimit: null,
    githubRequestsRemaining: null,
    githubLimitResetTime: null,
    lastError: "",
    statusMessage: "",
    actionInFlight: false,
    activeActionLabel: "",
    lastUpdatedMs: null,
    activityLog: [],
  };
}

function createDefaultEndstopsState() {
  return {
    values: {},
    queryInFlight: false,
    lastError: "",
    lastUpdatedMs: null,
  };
}

function createDefaultMachineLogFilesState() {
  return {
    files: [],
    isLoading: false,
    actionInFlight: false,
    lastError: "",
    lastUpdatedMs: null,
  };
}

function createDefaultJobsState() {
  return {
    files: [],
    directories: [],
    isLoading: false,
    actionInFlight: false,
    actionLabel: "",
    activePath: "",
    lastError: "",
    lastUpdatedMs: null,
    searchQuery: loadStoredJobsSearchQuery(),
    sortMode: loadStoredJobsSort(),
    typeFilter: loadStoredJobsTypeFilter(),
    currentDirectory: loadStoredJobsDirectory(),
    visibleColumns: loadStoredJobsVisibleColumns(),
    metadataByPath: new Map(),
    metadataLoading: new Set(),
    uploadDragDepth: 0,
  };
}

const state = {
  client: null,
  connectionStatus: "disconnected",
  activeView: loadStoredView(),
  moonrakerUrl: localStorage.getItem("moonraker_url") || "http://127.0.0.1:7125",
  config: {
    files: [],
    filteredFiles: [],
    selectedPath: loadStoredConfigSelectedPath(),
    originalContent: "",
    draftContent: "",
    isDirty: false,
    isLoadingFile: false,
    fileTypeFilter: loadStoredConfigFileTypeFilter(),
    fileSearchQuery: loadStoredConfigFileSearchQuery(),
  },
  configSearch: {
    query: "",
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
    matches: [],
    activeIndex: -1,
    invalidRegex: false,
  },
  interface: {
    theme: loadStoredChoice("interface_theme", "ocean", INTERFACE_THEMES),
    compact: loadStoredBool("interface_compact", false),
    density: loadStoredChoice("interface_density", "comfortable", INTERFACE_DENSITIES),
    sidebarCollapsed: loadStoredBool("interface_sidebar_collapsed", false),
    machineSideCollapsed: loadStoredBool(MACHINE_SIDE_COLLAPSED_STORAGE_KEY, false),
  },
  dashboard: {
    showPrintProgress: loadStoredBool("dashboard_show_print_progress", true),
    showTemperatures: loadStoredBool("dashboard_show_temperatures", true),
    showMotion: loadStoredBool("dashboard_show_motion", true),
    showQuickCommands: loadStoredBool("dashboard_show_quick_commands", true),
    showMacros: loadStoredBool("dashboard_show_macros", true),
    showMainCamera: loadStoredBool("dashboard_show_main_camera", true),
    showToolheadCamera: loadStoredBool("dashboard_show_toolhead_camera", true),
    showConsole: loadStoredBool("dashboard_show_console", true),
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
      offsetMs: 0,
      hoverIndex: null,
      layout: null,
    },
  },
  machineLoads: createDefaultMachineLoadsState(),
  updateManager: createDefaultUpdateManagerState(),
  endstops: createDefaultEndstopsState(),
  logFiles: createDefaultMachineLogFilesState(),
  jobs: createDefaultJobsState(),
  console: {
    seenStoreEntryKeys: new Set(),
    pendingCommandCounts: new Map(),
    storeSyncFailed: false,
    autoscroll: loadStoredBool(CONSOLE_AUTOSCROLL_STORAGE_KEY, true),
    filter: normalizeConsoleFilter(localStorage.getItem(CONSOLE_FILTER_STORAGE_KEY)),
    searchQuery: "",
    hideTemps: loadStoredBool(CONSOLE_HIDE_TEMPS_STORAGE_KEY, false),
    rawOutput: loadStoredBool(CONSOLE_RAW_OUTPUT_STORAGE_KEY, false),
    paused: false,
    pausedBuffer: [],
    history: loadStoredConsoleHistory(),
    historyIndex: 0,
    historyDraft: "",
    helperEntries: buildDefaultConsoleHelperEntries(),
    helperLoading: false,
    helperLoaded: false,
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

function formatConsoleTimestamp(timestampMs = Date.now()) {
  const numeric = Number(timestampMs);
  const date = Number.isFinite(numeric) ? new Date(numeric) : new Date();
  return date.toLocaleTimeString();
}

function loadStoredConsoleHistory() {
  try {
    const raw = localStorage.getItem(CONSOLE_HISTORY_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => String(entry || "").trim())
      .filter((entry) => entry.length > 0)
      .slice(-CONSOLE_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function normalizeConsoleFilter(value) {
  const normalized = String(value || "all").trim().toLowerCase();
  return CONSOLE_FILTER_VALUES.includes(normalized) ? normalized : "all";
}

function splitConsoleMessageLines(message) {
  return String(message || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);
}

function getConsoleInstances() {
  return [
    {
      key: "main",
      log: els.consoleLog,
      form: els.consoleForm,
      input: els.consoleInput,
      clearButton: els.consoleClear,
      helperToggle: els.consoleHelperToggle,
      settingsToggle: els.consoleSettingsToggle,
      helperPanel: els.consoleHelperPanel,
      settingsPanel: els.consoleSettingsPanel,
      hideTempsInput: els.consoleHideTemps,
      rawOutputInput: els.consoleRawOutput,
      pauseButton: els.consolePause,
      autoscrollInput: els.consoleAutoscroll,
      filterSelect: els.consoleFilter,
      searchInput: els.consoleSearch,
      meta: els.consoleMeta,
      helperGrid: els.consoleHelperGrid,
    },
    {
      key: "dashboard",
      log: els.dashboardConsoleLog,
      form: els.dashboardConsoleForm,
      input: els.dashboardConsoleInput,
      clearButton: els.dashboardConsoleClear,
      helperToggle: els.dashboardConsoleHelperToggle,
      settingsToggle: els.dashboardConsoleSettingsToggle,
      helperPanel: els.dashboardConsoleHelperPanel,
      settingsPanel: els.dashboardConsoleSettingsPanel,
      hideTempsInput: els.dashboardConsoleHideTemps,
      rawOutputInput: els.dashboardConsoleRawOutput,
      pauseButton: els.dashboardConsolePause,
      autoscrollInput: els.dashboardConsoleAutoscroll,
      filterSelect: els.dashboardConsoleFilter,
      searchInput: els.dashboardConsoleSearch,
      meta: els.dashboardConsoleMeta,
      helperGrid: els.dashboardConsoleHelperGrid,
    },
  ];
}

function findConsoleInstance(instanceKey = "main") {
  return getConsoleInstances().find((instance) => instance.key === instanceKey) || null;
}

function getConsoleInputElements() {
  return getConsoleInstances()
    .map((instance) => instance.input)
    .filter((input) => input instanceof HTMLInputElement);
}

function getActiveConsoleInput(preferredInput = null) {
  if (preferredInput instanceof HTMLInputElement) return preferredInput;

  const inputs = getConsoleInputElements();
  const focusedInput = inputs.find((input) => input === document.activeElement);
  return focusedInput || inputs[0] || null;
}

function setAllConsoleInputValues(value) {
  getConsoleInputElements().forEach((input) => {
    input.value = value;
  });
}

function syncConsoleInputValue(value, preferredInput = null) {
  const targetInput = getActiveConsoleInput(preferredInput);
  setAllConsoleInputValues(String(value || ""));
  return targetInput;
}

function getPrimaryConsoleLog() {
  const instance = getConsoleInstances().find((candidate) => candidate.log);
  return instance?.log || null;
}

function isTemperatureConsoleMessage(message) {
  const normalized = String(message || "").trim();
  if (!normalized) return false;

  if (/^(?:ok\s+)?(?:T\d*:|T:|B:|C:|P:)/i.test(normalized)) return true;
  if (/\bT\d*:\s*-?\d/i.test(normalized)) return true;
  if (/\bB:\s*-?\d/i.test(normalized)) return true;

  return false;
}

function trimConsoleLog() {
  getConsoleInstances().forEach((instance) => {
    const logElement = instance.log;
    if (!logElement) return;

    while (logElement.children.length > CONSOLE_MAX_LINES) {
      logElement.removeChild(logElement.firstElementChild);
    }
  });
}

function deriveConsoleType(level, label, preferredType = "") {
  const normalizedPreferred = String(preferredType || "").trim().toLowerCase();
  if (["command", "response", "error", "system"].includes(normalizedPreferred)) {
    return normalizedPreferred;
  }

  const normalizedLabel = String(label || "").trim().toUpperCase();
  const normalizedLevel = CONSOLE_LOG_LEVELS.has(level) ? level : "info";

  if (normalizedLabel === "COMMAND") return "command";
  if (normalizedLabel === "RESPONSE") return "response";
  if (normalizedLabel === "ERROR" || normalizedLevel === "error") return "error";

  return "system";
}

function doesConsoleLineMatchFilter(line) {
  if (!line) return false;

  const filter = normalizeConsoleFilter(state.console.filter);
  if (filter !== "all" && line.dataset.consoleType !== filter) {
    return false;
  }

  if (state.console.hideTemps && line.dataset.consoleType === "response") {
    const sourceText = line.dataset.consoleMessage || line.textContent || "";
    if (isTemperatureConsoleMessage(sourceText)) {
      return false;
    }
  }

  const query = String(state.console.searchQuery || "").trim().toLowerCase();
  if (!query) return true;

  return String(line.textContent || "").toLowerCase().includes(query);
}

function updateConsoleMeta() {
  const primaryLog = getPrimaryConsoleLog();
  if (!primaryLog) return;

  const total = primaryLog.children.length;
  let visible = 0;

  [...primaryLog.children].forEach((line) => {
    if (!line.hidden) visible += 1;
  });

  const buffered = state.console.pausedBuffer.length;
  const parts = [`${visible}/${total} visible`];

  if (buffered > 0) {
    parts.push(`${buffered} buffered`);
  }

  if (state.console.paused) {
    parts.push("paused");
  }

  const metaText = `${parts.join(" | ")} lines`;

  getConsoleInstances().forEach((instance) => {
    if (instance.meta) {
      instance.meta.textContent = metaText;
    }

    if (instance.pauseButton) {
      instance.pauseButton.dataset.paused = state.console.paused ? "true" : "false";
      instance.pauseButton.setAttribute("aria-pressed", String(state.console.paused));
      const suffix = buffered > 0 ? ` (${buffered})` : "";
      instance.pauseButton.textContent = state.console.paused ? `Resume${suffix}` : "Pause";
    }
  });
}

function scrollConsoleToBottom() {
  getConsoleInstances().forEach((instance) => {
    if (!instance.log) return;
    instance.log.scrollTop = instance.log.scrollHeight;
  });
}

function applyConsoleLineVisibility(line) {
  if (!line) return;
  line.hidden = !doesConsoleLineMatchFilter(line);
}

function refreshConsoleVisibility() {
  getConsoleInstances().forEach((instance) => {
    const logElement = instance.log;
    if (!logElement) return;

    [...logElement.children].forEach((line) => {
      applyConsoleLineVisibility(line);
    });
  });

  updateConsoleMeta();

  if (!state.console.paused && state.console.autoscroll) {
    scrollConsoleToBottom();
  }
}

function buildConsoleLine(message, level, { timestampMs = Date.now(), label = null, consoleType = null } = {}) {
  const normalizedLevel = CONSOLE_LOG_LEVELS.has(level) ? level : "info";
  const lineLabel = String(label || normalizedLevel).trim().toUpperCase() || normalizedLevel.toUpperCase();
  const lineType = deriveConsoleType(normalizedLevel, lineLabel, consoleType);

  const line = document.createElement("div");
  line.className = `console-line console-line-${normalizedLevel}`;
  line.dataset.consoleType = lineType;
  line.dataset.consoleLevel = normalizedLevel;
  line.dataset.consoleLabel = lineLabel;
  line.dataset.consoleMessage = String(message || "");
  line.textContent = `[${formatConsoleTimestamp(timestampMs)}] [${lineLabel}] ${message}`;
  return line;
}

function appendConsoleLine(line) {
  if (!line) return;

  const logElements = getConsoleInstances()
    .map((instance) => instance.log)
    .filter((logElement) => !!logElement);

  if (!logElements.length) return;

  logElements.forEach((logElement, index) => {
    const lineToAppend = index === 0 ? line : line.cloneNode(true);
    applyConsoleLineVisibility(lineToAppend);
    logElement.appendChild(lineToAppend);
  });

  trimConsoleLog();
  updateConsoleMeta();

  if (state.console.autoscroll && !state.console.paused) {
    scrollConsoleToBottom();
  }
}

function flushPausedConsoleEntries() {
  if (!state.console.pausedBuffer.length) {
    updateConsoleMeta();
    return;
  }

  const buffered = [...state.console.pausedBuffer];
  state.console.pausedBuffer.length = 0;

  buffered.forEach((entry) => {
    const line = buildConsoleLine(entry.message, entry.level, entry);
    appendConsoleLine(line);
  });
}

function setConsolePaused(nextPaused) {
  const paused = !!nextPaused;
  if (state.console.paused === paused) return;

  state.console.paused = paused;

  if (!paused) {
    flushPausedConsoleEntries();
  }

  updateConsoleMeta();
}

function setConsoleAutoscroll(enabled) {
  state.console.autoscroll = !!enabled;
  localStorage.setItem(CONSOLE_AUTOSCROLL_STORAGE_KEY, String(state.console.autoscroll));

  getConsoleInstances().forEach((instance) => {
    if (instance.autoscrollInput) {
      instance.autoscrollInput.checked = state.console.autoscroll;
    }
  });

  if (!state.console.paused && state.console.autoscroll) {
    scrollConsoleToBottom();
  }

  updateConsoleMeta();
}

function setConsoleFilter(value) {
  state.console.filter = normalizeConsoleFilter(value);
  localStorage.setItem(CONSOLE_FILTER_STORAGE_KEY, state.console.filter);

  getConsoleInstances().forEach((instance) => {
    if (instance.filterSelect) {
      instance.filterSelect.value = state.console.filter;
    }
  });

  refreshConsoleVisibility();
}

function setConsoleSearchQuery(value) {
  state.console.searchQuery = String(value || "").trim();

  getConsoleInstances().forEach((instance) => {
    if (instance.searchInput) {
      instance.searchInput.value = state.console.searchQuery;
    }
  });

  refreshConsoleVisibility();
}

function closeConsolePanels() {
  getConsoleInstances().forEach((instance) => {
    if (instance.helperPanel) instance.helperPanel.hidden = true;
    if (instance.settingsPanel) instance.settingsPanel.hidden = true;
    if (instance.helperToggle) instance.helperToggle.setAttribute("aria-expanded", "false");
    if (instance.settingsToggle) instance.settingsToggle.setAttribute("aria-expanded", "false");
  });
}

function toggleConsoleHelperPanel(instanceKey = "main") {
  const instance = findConsoleInstance(instanceKey);
  if (!instance?.helperPanel) return;

  const shouldOpen = instance.helperPanel.hidden;
  closeConsolePanels();

  if (shouldOpen) {
    instance.helperPanel.hidden = false;
    if (instance.helperToggle) instance.helperToggle.setAttribute("aria-expanded", "true");
  }
}

function toggleConsoleSettingsPanel(instanceKey = "main") {
  const instance = findConsoleInstance(instanceKey);
  if (!instance?.settingsPanel) return;

  const shouldOpen = instance.settingsPanel.hidden;
  closeConsolePanels();

  if (shouldOpen) {
    instance.settingsPanel.hidden = false;
    if (instance.settingsToggle) instance.settingsToggle.setAttribute("aria-expanded", "true");
  }
}

function setConsoleHideTemps(enabled) {
  state.console.hideTemps = !!enabled;
  localStorage.setItem(CONSOLE_HIDE_TEMPS_STORAGE_KEY, String(state.console.hideTemps));

  getConsoleInstances().forEach((instance) => {
    if (instance.hideTempsInput) {
      instance.hideTempsInput.checked = state.console.hideTemps;
    }
  });

  refreshConsoleVisibility();
}

function setConsoleRawOutput(enabled) {
  state.console.rawOutput = !!enabled;
  localStorage.setItem(CONSOLE_RAW_OUTPUT_STORAGE_KEY, String(state.console.rawOutput));

  getConsoleInstances().forEach((instance) => {
    if (instance.rawOutputInput) {
      instance.rawOutputInput.checked = state.console.rawOutput;
    }
  });
}

function buildDefaultConsoleHelperEntries() {
  const defaults = [...CONSOLE_HELPER_BASE_COMMANDS, ...CONSOLE_HELPER_FALLBACK];
  const unique = new Set();

  defaults.forEach((command) => {
    const normalized = String(command || "").trim().toUpperCase();
    if (!normalized) return;
    unique.add(normalized);
  });

  return [...unique]
    .sort((a, b) => a.localeCompare(b))
    .map((command) => ({ command, description: "" }));
}

function mergeConsoleHelperEntries(entries) {
  const merged = new Map();

  buildDefaultConsoleHelperEntries().forEach((entry) => {
    merged.set(entry.command, entry);
  });

  (Array.isArray(entries) ? entries : []).forEach((entry) => {
    const command = String(entry?.command || "").trim().toUpperCase();
    if (!command) return;

    const existing = merged.get(command);
    const description = String(entry?.description || "").trim() || existing?.description || "";
    merged.set(command, { command, description });
  });

  return [...merged.values()].sort((a, b) => a.command.localeCompare(b.command));
}

function renderConsoleHelperEntries() {
  const helperGrids = getConsoleInstances()
    .map((instance) => instance.helperGrid)
    .filter((grid) => !!grid);

  if (!helperGrids.length) return;

  const entries = Array.isArray(state.console.helperEntries) ? state.console.helperEntries : [];

  helperGrids.forEach((grid) => {
    grid.innerHTML = "";

    if (state.console.helperLoading) {
      const loading = document.createElement("p");
      loading.className = "muted";
      loading.textContent = "Loading commands from Moonraker...";
      grid.appendChild(loading);
      return;
    }

    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "No helper commands available.";
      grid.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();

    entries.forEach((entry) => {
      const command = String(entry?.command || "").trim();
      if (!command) return;

      const button = document.createElement("button");
      button.type = "button";
      button.dataset.consoleHelper = command;

      const commandLabel = document.createElement("span");
      commandLabel.className = "console-helper-command";
      commandLabel.textContent = command;
      button.appendChild(commandLabel);

      const description = String(entry?.description || "").trim();
      if (description) {
        const descriptionLabel = document.createElement("span");
        descriptionLabel.className = "console-helper-description";
        descriptionLabel.textContent = description;
        button.appendChild(descriptionLabel);
      }

      if (description) {
        button.title = `${command} - ${description}`;
      } else {
        button.title = command;
      }

      fragment.appendChild(button);
    });

    grid.appendChild(fragment);
  });
}

function normalizeConsoleHelperEntries(response) {
  const payload = response?.result ?? response ?? {};

  let raw = payload;
  if (payload && typeof payload === "object") {
    if (payload.commands && typeof payload.commands === "object") {
      raw = payload.commands;
    } else if (payload.gcode_help && typeof payload.gcode_help === "object") {
      raw = payload.gcode_help;
    } else if (payload.help && typeof payload.help === "object") {
      raw = payload.help;
    }
  }

  const entries = [];

  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      if (typeof item === "string") {
        const command = item.trim();
        if (command) entries.push({ command, description: "" });
        return;
      }

      if (item && typeof item === "object") {
        const command = String(item.command || item.name || item.cmd || "").trim();
        if (!command) return;
        const description = String(item.description || item.help || item.desc || "").trim();
        entries.push({ command, description });
      }
    });
  } else if (raw && typeof raw === "object") {
    Object.entries(raw).forEach(([name, value]) => {
      const command = String(name || "").trim();
      if (!command) return;

      let description = "";
      if (typeof value === "string") {
        description = value.trim();
      } else if (value && typeof value === "object") {
        description = String(value.help || value.description || value.desc || "").trim();
      }

      entries.push({ command, description });
    });
  }

  const unique = [];
  const seen = new Set();

  entries.forEach((entry) => {
    const command = String(entry.command || "").trim().toUpperCase();
    if (!command || seen.has(command)) return;
    seen.add(command);
    unique.push({ command, description: String(entry.description || "").trim() });
  });

  unique.sort((a, b) => a.command.localeCompare(b.command));
  return unique;
}

async function loadConsoleHelperEntries() {
  if (!state.client) {
    renderConsoleHelperEntries();
    return;
  }

  state.console.helperLoading = true;
  renderConsoleHelperEntries();

  try {
    const response = await state.client.call("/printer/gcode/help");
    const entries = normalizeConsoleHelperEntries(response);

    state.console.helperEntries = mergeConsoleHelperEntries(entries);
    state.console.helperLoaded = true;
  } catch (error) {
    const message = error?.message || String(error);

    if (!state.console.helperLoaded) {
      state.console.helperEntries = buildDefaultConsoleHelperEntries();
    }

    appendConsole(`Console helper load failed: ${message}`, "warn", {
      consoleType: "system",
      label: "SYSTEM",
    });

    log.debug("Console helper load failed.", { error: message });
  } finally {
    state.console.helperLoading = false;
    renderConsoleHelperEntries();
  }
}

function clearConsoleLog() {
  getConsoleInstances().forEach((instance) => {
    if (instance.log) {
      instance.log.innerHTML = "";
    }
  });

  state.console.pausedBuffer.length = 0;
  updateConsoleMeta();
}

function persistConsoleHistory() {
  localStorage.setItem(CONSOLE_HISTORY_STORAGE_KEY, JSON.stringify(state.console.history));
}

function resetConsoleHistoryCursor() {
  state.console.historyIndex = state.console.history.length;
  state.console.historyDraft = "";
}

function rememberConsoleHistory(command) {
  const normalized = String(command || "").trim();
  if (!normalized) return;

  state.console.history = state.console.history.filter((entry) => entry !== normalized);
  state.console.history.push(normalized);

  while (state.console.history.length > CONSOLE_HISTORY_LIMIT) {
    state.console.history.shift();
  }

  persistConsoleHistory();
  resetConsoleHistoryCursor();
}

function moveConsoleHistory(direction, preferredInput = null) {
  const history = state.console.history;
  const activeInput = getActiveConsoleInput(preferredInput);
  if (!history.length || !activeInput) return;

  if (typeof state.console.historyIndex !== "number") {
    state.console.historyIndex = history.length;
  }

  if (direction < 0) {
    if (state.console.historyIndex === history.length) {
      state.console.historyDraft = activeInput.value;
    }
    state.console.historyIndex = Math.max(0, state.console.historyIndex - 1);
  } else if (direction > 0) {
    state.console.historyIndex = Math.min(history.length, state.console.historyIndex + 1);
  }

  if (state.console.historyIndex >= history.length) {
    syncConsoleInputValue(state.console.historyDraft, activeInput);
    return;
  }

  syncConsoleInputValue(history[state.console.historyIndex] || "", activeInput);

  if (typeof activeInput.setSelectionRange === "function") {
    const cursor = activeInput.value.length;
    activeInput.setSelectionRange(cursor, cursor);
  }
}

function appendConsole(message, level = "info", { timestampMs = Date.now(), label = null, consoleType = null } = {}) {
  const text = String(message ?? "");
  if (!text.trim()) return;

  const entry = {
    message: text,
    level,
    timestampMs,
    label,
    consoleType,
  };

  if (state.console.paused) {
    state.console.pausedBuffer.push(entry);

    while (state.console.pausedBuffer.length > CONSOLE_PAUSED_BUFFER_LIMIT) {
      state.console.pausedBuffer.shift();
    }

    updateConsoleMeta();
    return;
  }

  const line = buildConsoleLine(text, level, {
    timestampMs,
    label,
    consoleType,
  });

  appendConsoleLine(line);
}

function makePendingCommandKey(line) {
  return String(line || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function rememberPendingCommand(line) {
  const key = makePendingCommandKey(line);
  if (!key) return;

  const current = state.console.pendingCommandCounts.get(key) || 0;
  state.console.pendingCommandCounts.set(key, current + 1);

  while (state.console.pendingCommandCounts.size > CONSOLE_PENDING_COMMAND_LIMIT) {
    const oldestKey = state.console.pendingCommandCounts.keys().next().value;
    if (!oldestKey) break;
    state.console.pendingCommandCounts.delete(oldestKey);
  }
}

function consumePendingCommand(line) {
  const key = makePendingCommandKey(line);
  if (!key) return false;

  const current = state.console.pendingCommandCounts.get(key) || 0;
  if (!current) return false;

  if (current <= 1) {
    state.console.pendingCommandCounts.delete(key);
  } else {
    state.console.pendingCommandCounts.set(key, current - 1);
  }

  return true;
}

function appendOutgoingScriptLines(script) {
  const commandLines = splitConsoleMessageLines(script);
  commandLines.forEach((line) => {
    rememberPendingCommand(line);
    appendConsole(line, "info", { label: "COMMAND", consoleType: "command" });
  });
}

function normalizeGcodeStoreType(type) {
  return String(type || "")
    .trim()
    .toLowerCase();
}

function inferGcodeStoreLineType(lineText, normalizedType) {
  if (normalizedType === "command") return "command";
  if (normalizedType === "response") return "response";
  if (normalizedType === "warn" || normalizedType === "warning") return "system";
  if (normalizedType === "error") return "error";

  if (lineText.startsWith("!!") || /^error/i.test(lineText)) return "error";
  if (lineText.startsWith("//") || /^ok/i.test(lineText)) return "response";
  return "command";
}

function getConsoleLineMeta(lineType) {
  if (lineType === "error") {
    return { level: "error", label: "ERROR", consoleType: "error" };
  }

  if (lineType === "response") {
    return { level: "info", label: "RESPONSE", consoleType: "response" };
  }

  if (lineType === "command") {
    return { level: "info", label: "COMMAND", consoleType: "command" };
  }

  return { level: "info", label: "SYSTEM", consoleType: "system" };
}

function rememberConsoleStoreEntryKey(key) {
  state.console.seenStoreEntryKeys.add(key);

  while (state.console.seenStoreEntryKeys.size > CONSOLE_STORE_SEEN_KEY_LIMIT) {
    const oldestKey = state.console.seenStoreEntryKeys.keys().next().value;
    if (!oldestKey) break;
    state.console.seenStoreEntryKeys.delete(oldestKey);
  }
}

function createConsoleStoreEntryKey(entry, line, resolvedType = "") {
  const timestamp = Number(entry?.time);
  const normalizedType = resolvedType || normalizeGcodeStoreType(entry?.type) || "log";
  const safeTimestamp = Number.isFinite(timestamp) ? timestamp : 0;
  return `${safeTimestamp}|${normalizedType}|${line}`;
}

function processGcodeStoreEntries(entries) {
  if (!Array.isArray(entries) || !entries.length) return;

  const sortedEntries = [...entries].sort((a, b) => (Number(a?.time) || 0) - (Number(b?.time) || 0));

  sortedEntries.forEach((entry) => {
    const normalizedType = normalizeGcodeStoreType(entry?.type);
    const lines = splitConsoleMessageLines(entry?.message || "");
    if (!lines.length) return;

    const timestampMs = Number.isFinite(Number(entry?.time)) ? Number(entry.time) * 1000 : Date.now();

    lines.forEach((lineText) => {
      const lineType = inferGcodeStoreLineType(lineText, normalizedType);
      const entryKey = createConsoleStoreEntryKey(entry, lineText, lineType);

      if (state.console.seenStoreEntryKeys.has(entryKey)) return;
      rememberConsoleStoreEntryKey(entryKey);

      if (lineType === "command" && consumePendingCommand(lineText)) return;

      const meta = getConsoleLineMeta(lineType);
      appendConsole(lineText, meta.level, {
        timestampMs,
        label: meta.label,
        consoleType: meta.consoleType,
      });
    });
  });
}

function extractGcodeStoreEntries(payload) {
  if (!payload || !Array.isArray(payload.params)) return [];

  const entries = [];

  payload.params.forEach((param) => {
    if (!param) return;

    if (Array.isArray(param)) {
      param.forEach((candidate) => {
        if (candidate && typeof candidate === "object") entries.push(candidate);
      });
      return;
    }

    if (Array.isArray(param.gcode_store)) {
      param.gcode_store.forEach((candidate) => {
        if (candidate && typeof candidate === "object") entries.push(candidate);
      });
      return;
    }

    if (typeof param === "object" && ("message" in param || "type" in param)) {
      entries.push(param);
    }
  });

  return entries;
}

async function syncConsoleFromGcodeStore() {
  if (!state.client) return;

  try {
    const response = await state.client.call(`/server/gcode_store?count=${CONSOLE_STORE_FETCH_COUNT}`);
    const store = response?.result?.gcode_store;
    if (Array.isArray(store)) {
      processGcodeStoreEntries(store);
    }
    state.console.storeSyncFailed = false;
  } catch (error) {
    const message = error?.message || String(error);
    if (!state.console.storeSyncFailed) {
      appendConsole(`Console sync failed: ${message}`, "warn", { consoleType: "system" });
    }
    state.console.storeSyncFailed = true;
    log.debug("Console store sync failed.", { error: message });
  }
}

function stopConsoleStorePolling() {
  if (!consoleStorePollTimer) return;
  clearInterval(consoleStorePollTimer);
  consoleStorePollTimer = null;
}

function startConsoleStorePolling() {
  stopConsoleStorePolling();
  if (!state.client) return;

  let inFlight = false;

  const poll = async () => {
    if (inFlight || !state.client) return;
    inFlight = true;
    try {
      await syncConsoleFromGcodeStore();
    } finally {
      inFlight = false;
    }
  };

  void poll();
  consoleStorePollTimer = setInterval(() => {
    void poll();
  }, CONSOLE_STORE_POLL_INTERVAL_MS);
}

function resetConsoleStoreTracking() {
  state.console.seenStoreEntryKeys.clear();
  state.console.pendingCommandCounts.clear();
  state.console.storeSyncFailed = false;
}


function updateSidebarToggleUi() {
  if (!els.sidebarToggle) return;

  const collapsed = state.interface.sidebarCollapsed;
  els.sidebarToggle.dataset.state = collapsed ? "collapsed" : "expanded";
  els.sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
  els.sidebarToggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
  els.sidebarToggle.setAttribute("title", collapsed ? "Expand sidebar" : "Collapse sidebar");
}

function updateMachineSideToggleUi() {
  if (!els.machineSideToggle) return;

  const collapsed = !!state.interface.machineSideCollapsed;
  els.machineSideToggle.dataset.state = collapsed ? "collapsed" : "expanded";
  els.machineSideToggle.setAttribute("aria-expanded", String(!collapsed));
  const label = collapsed ? "Expand right column" : "Collapse right column";
  els.machineSideToggle.setAttribute("aria-label", label);
  els.machineSideToggle.setAttribute("title", label);
}

function applyInterfaceSettings() {
  document.documentElement.dataset.theme = state.interface.theme;
  document.documentElement.dataset.density = state.interface.density;
  document.body.classList.toggle("compact-mode", state.interface.compact);
  document.body.classList.toggle("sidebar-collapsed", state.interface.sidebarCollapsed);
  els.machineLayout?.classList.toggle("machine-side-collapsed", !!state.interface.machineSideCollapsed);
  updateSidebarToggleUi();
  updateMachineSideToggleUi();
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
    [els.cardMacros, state.dashboard.showMacros],
    [els.cardMainCamera, state.dashboard.showMainCamera],
    [els.cardToolheadCamera, state.dashboard.showToolheadCamera],
    [els.cardDashboardConsole, state.dashboard.showConsole],
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

function toggleMachineSideColumn() {
  state.interface.machineSideCollapsed = !state.interface.machineSideCollapsed;
  localStorage.setItem(MACHINE_SIDE_COLLAPSED_STORAGE_KEY, String(state.interface.machineSideCollapsed));
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
  state.connectionStatus = String(status || "").trim().toLowerCase();
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
  renderJobsJobControls();
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
  renderJobsJobControls();

  if (state.activeView === "files") {
    renderJobsList();
  }

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
  if (!isKnownView(viewName)) return;
  els.navItems.forEach((btn) => btn.classList.toggle("active", btn.dataset.view === viewName));
  els.views.forEach((view) => view.classList.toggle("active", view.id === `view-${viewName}`));
  els.pageTitle.textContent = VIEW_TITLES[viewName] || viewName.slice(0, 1).toUpperCase() + viewName.slice(1);
  state.activeView = viewName;
  localStorage.setItem(ACTIVE_VIEW_STORAGE_KEY, viewName);
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

function asFiniteNumber(value, fallback = null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatSystemLoadNumber(value) {
  const numeric = asFiniteNumber(value, null);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : "--";
}

function formatByteMagnitude(bytes) {
  const numeric = asFiniteNumber(bytes, null);
  if (!Number.isFinite(numeric) || numeric < 0) return "--";

  if (numeric >= 1024 * 1024 * 1024) {
    return `${(numeric / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  if (numeric >= 1024 * 1024) {
    return `${(numeric / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (numeric >= 1024) {
    return `${(numeric / 1024).toFixed(1)} kB`;
  }

  return `${Math.round(numeric)} B`;
}

function formatBandwidthPerSecond(value) {
  const numeric = asFiniteNumber(value, null);
  if (!Number.isFinite(numeric) || numeric < 0) return "--";

  if (numeric >= 1024 * 1024) {
    return `${(numeric / (1024 * 1024)).toFixed(1)} MB/s`;
  }

  if (numeric >= 1024) {
    return `${(numeric / 1024).toFixed(1)} kB/s`;
  }

  return `${numeric.toFixed(1)} B/s`;
}

function toMemoryBytes(value, { preferKiB = false, allowHeuristic = true } = {}) {
  const numeric = asFiniteNumber(value, null);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;

  if (preferKiB) {
    return numeric * 1024;
  }

  if (allowHeuristic && numeric < 32 * 1024 * 1024) {
    return numeric * 1024;
  }

  return numeric;
}

function formatMcuFrequency(value) {
  const numeric = asFiniteNumber(value, null);
  if (!Number.isFinite(numeric) || numeric <= 0) return "--";

  if (numeric >= 1_000_000) {
    return `${Math.round(numeric / 1_000_000)} MHz`;
  }

  if (numeric >= 1000) {
    return `${Math.round(numeric / 1000)} kHz`;
  }

  return `${Math.round(numeric)} Hz`;
}

function extractVersionLabel(value) {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized || "";
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const candidates = [
    value.git_version,
    value.version,
    value.software_version,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "";
}

function extractMcuStatsSnapshot(mcuStatus) {
  const lastStats = mcuStatus?.last_stats && typeof mcuStatus.last_stats === "object"
    ? mcuStatus.last_stats
    : {};

  return {
    load: asFiniteNumber(lastStats.mcu_task_avg ?? mcuStatus?.mcu_task_avg, null),
    awake: asFiniteNumber(lastStats.mcu_awake ?? mcuStatus?.mcu_awake, null),
    freq: asFiniteNumber(lastStats.freq ?? mcuStatus?.freq, null),
  };
}

function getPreferredIpAddress(interfaceInfo) {
  const ipAddresses = Array.isArray(interfaceInfo?.ip_addresses) ? interfaceInfo.ip_addresses : [];
  if (!ipAddresses.length) return "--";

  const preferred = ipAddresses.find((entry) => {
    const family = String(entry?.family || "").toLowerCase();
    return family.includes("ipv4") && !entry?.is_link_local;
  }) || ipAddresses.find((entry) => !entry?.is_link_local) || ipAddresses[0];

  return String(preferred?.address || "").trim() || "--";
}

function setMachineGauge(gaugeEl, valueEl, percent, label) {
  const clamped = Number.isFinite(percent)
    ? Math.max(0, Math.min(100, percent))
    : 0;

  if (gaugeEl) {
    gaugeEl.style.setProperty("--gauge-value", clamped.toFixed(2));
  }

  if (valueEl) {
    valueEl.textContent = label;
  }
}

function setMachineStatusMessage(message) {
  if (!els.machineSystemStatus) return;

  const normalized = String(message || "").trim();
  els.machineSystemStatus.textContent = normalized;
  els.machineSystemStatus.hidden = !normalized;
}

function renderMachineLoadsCard() {
  const machineLoads = state.machineLoads || createDefaultMachineLoadsState();
  const mcuStatus = machineLoads.mcuStatus || {};
  const systemStats = machineLoads.systemStats || {};
  const procStats = machineLoads.procStats || {};
  const systemInfo = machineLoads.systemInfo || {};

  const mcuName = String(mcuStatus?.name || "mcu").trim() || "mcu";
  const mcuChip = String(
    mcuStatus?.mcu_constants?.MCU ||
    mcuStatus?.mcu_constants?.MCU_TYPE ||
    mcuStatus?.mcu_type ||
    "unknown"
  ).trim();
  const mcuVersionLabel = extractVersionLabel(mcuStatus?.mcu_version) || extractVersionLabel(machineLoads.klipperVersion) || "--";
  const mcuStats = extractMcuStatsSnapshot(mcuStatus);
  const mcuLoadLabel = Number.isFinite(mcuStats.load) ? mcuStats.load.toFixed(2) : "--";
  const mcuAwakeLabel = Number.isFinite(mcuStats.awake) ? mcuStats.awake.toFixed(2) : "--";
  const mcuFrequencyLabel = formatMcuFrequency(mcuStats.freq);

  if (els.machineMcuName) els.machineMcuName.textContent = mcuName;
  if (els.machineMcuChip) els.machineMcuChip.textContent = `(${mcuChip || "unknown"})`;
  if (els.machineMcuVersion) els.machineMcuVersion.textContent = `Version: ${mcuVersionLabel}`;
  if (els.machineMcuStats) {
    els.machineMcuStats.textContent = `Load: ${mcuLoadLabel}, Awake: ${mcuAwakeLabel}, Freq: ${mcuFrequencyLabel}`;
  }

  const cpuInfo = systemInfo?.cpu_info && typeof systemInfo.cpu_info === "object"
    ? systemInfo.cpu_info
    : {};
  const distro = systemInfo?.distribution && typeof systemInfo.distribution === "object"
    ? systemInfo.distribution
    : {};

  const hostArch = String(cpuInfo.cpu_desc || cpuInfo.arch || cpuInfo.model || "").trim();
  const hostBits = asFiniteNumber(cpuInfo.bits ?? cpuInfo.address_bits, null);
  const hostArchParts = [];
  if (hostArch) hostArchParts.push(hostArch);
  if (Number.isFinite(hostBits)) hostArchParts.push(`${Math.round(hostBits)}bit`);
  const hostArchLabel = hostArchParts.length ? `(${hostArchParts.join(", ")})` : "(unknown)";

  const hostVersionLabel = extractVersionLabel(machineLoads.klipperVersion) || mcuVersionLabel || "--";
  const distroName = String(distro.name || distro.pretty_name || distro.id || "").trim();
  const distroVersion = String(distro.version || "").trim();
  const distroCodename = String(distro.codename || "").trim();
  const hostOsLabel = distroName
    ? `${distroName}${distroVersion ? ` ${distroVersion}` : ""}${distroCodename ? ` (${distroCodename})` : ""}`
    : "Unknown";

  const hostLoad = asFiniteNumber(systemStats?.sysload, null);
  const hostTemp = asFiniteNumber(procStats?.cpu_temp ?? systemStats?.cpu_temp, null);
  let cpuPercent = asFiniteNumber(procStats?.system_cpu_usage?.cpu, null);
  if (!Number.isFinite(cpuPercent) && Number.isFinite(hostLoad)) {
    cpuPercent = Math.max(0, Math.min(100, hostLoad * 100));
  }

  const totalMemoryBytes = toMemoryBytes(
    cpuInfo?.total_memory ?? cpuInfo?.mem_total ?? procStats?.total_memory ?? procStats?.mem_total,
    { preferKiB: false }
  );
  const availableMemoryBytes = toMemoryBytes(
    systemStats?.memavail ?? procStats?.mem_available ?? procStats?.memavail,
    { preferKiB: true }
  );

  let usedMemoryBytes = null;
  let memPercent = asFiniteNumber(procStats?.memory_usage?.percent ?? procStats?.memory_percent, null);

  if (Number.isFinite(totalMemoryBytes) && Number.isFinite(availableMemoryBytes)) {
    usedMemoryBytes = Math.max(totalMemoryBytes - availableMemoryBytes, 0);
    memPercent = totalMemoryBytes > 0 ? (usedMemoryBytes / totalMemoryBytes) * 100 : null;
  } else if (Number.isFinite(totalMemoryBytes) && Number.isFinite(memPercent)) {
    usedMemoryBytes = totalMemoryBytes * Math.max(0, Math.min(100, memPercent)) / 100;
  }

  const memUsageLabel = Number.isFinite(usedMemoryBytes) && Number.isFinite(totalMemoryBytes)
    ? `${formatByteMagnitude(usedMemoryBytes)} / ${formatByteMagnitude(totalMemoryBytes)}`
    : "--";
  const tempLabel = Number.isFinite(hostTemp) ? `${Math.round(hostTemp)}\u00B0C` : "--";

  if (els.machineHostArch) els.machineHostArch.textContent = hostArchLabel;
  if (els.machineHostVersion) els.machineHostVersion.textContent = `Version: ${hostVersionLabel}`;
  if (els.machineHostOs) els.machineHostOs.textContent = `OS: ${hostOsLabel}`;
  if (els.machineHostStats) {
    els.machineHostStats.textContent = `Load: ${formatSystemLoadNumber(hostLoad)}, Mem: ${memUsageLabel}, Temp: ${tempLabel}`;
  }

  if (els.machineHostNetworkList) {
    els.machineHostNetworkList.innerHTML = "";

    const networkStats = procStats?.network && typeof procStats.network === "object" ? procStats.network : {};
    const networkInfo = systemInfo?.network && typeof systemInfo.network === "object" ? systemInfo.network : {};
    const interfaceNames = [...new Set([...Object.keys(networkInfo), ...Object.keys(networkStats)])].sort();

    if (!interfaceNames.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "No network interfaces reported.";
      els.machineHostNetworkList.appendChild(empty);
    } else {
      interfaceNames.forEach((name) => {
        const ifaceStats = networkStats[name] || {};
        const ifaceInfo = networkInfo[name] || {};
        const ipAddress = getPreferredIpAddress(ifaceInfo);

        let bandwidth = asFiniteNumber(
          ifaceStats?.bandwidth ?? ifaceStats?.tx_bandwidth ?? ifaceStats?.rx_bandwidth,
          null
        );
        const rxBandwidth = asFiniteNumber(ifaceStats?.rx_bandwidth, null);
        const txBandwidth = asFiniteNumber(ifaceStats?.tx_bandwidth, null);
        if (!Number.isFinite(bandwidth) && (Number.isFinite(rxBandwidth) || Number.isFinite(txBandwidth))) {
          bandwidth = (Number.isFinite(rxBandwidth) ? rxBandwidth : 0) + (Number.isFinite(txBandwidth) ? txBandwidth : 0);
        }

        const receivedBytes = toMemoryBytes(ifaceStats?.rx_bytes ?? ifaceStats?.received_bytes, { preferKiB: false, allowHeuristic: false });
        const transmittedBytes = toMemoryBytes(ifaceStats?.tx_bytes ?? ifaceStats?.transmitted_bytes, { preferKiB: false, allowHeuristic: false });

        const linePrimary = document.createElement("p");
        linePrimary.textContent = `${name} (${ipAddress}): Bandwidth: ${formatBandwidthPerSecond(bandwidth)}`;

        const lineSecondary = document.createElement("p");
        lineSecondary.className = "muted";
        lineSecondary.textContent = `Received: ${formatByteMagnitude(receivedBytes)}, Transmitted: ${formatByteMagnitude(transmittedBytes)}`;

        els.machineHostNetworkList.append(linePrimary, lineSecondary);
      });
    }
  }

  const mcuDeviceCount = mcuStatus && Object.keys(mcuStatus).length ? 1 : 0;
  setMachineGauge(
    els.machineDevicesGauge,
    els.machineDevicesValue,
    mcuDeviceCount > 0 ? 14 : 0,
    String(mcuDeviceCount)
  );

  setMachineGauge(
    els.machineCpuGauge,
    els.machineCpuGaugeValue,
    cpuPercent,
    Number.isFinite(cpuPercent) ? `${Math.round(cpuPercent)}` : "--"
  );

  setMachineGauge(
    els.machineMemGauge,
    els.machineMemGaugeValue,
    memPercent,
    Number.isFinite(memPercent) ? `${Math.round(memPercent)}` : "--"
  );

  if (!state.client) {
    setMachineStatusMessage("Connect to Moonraker to load system stats.");
  } else if (machineLoads.lastError) {
    setMachineStatusMessage(`System load update issue: ${machineLoads.lastError}`);
  } else if (!machineLoads.lastUpdatedMs) {
    setMachineStatusMessage("Loading system stats...");
  } else {
    setMachineStatusMessage("");
  }
}

async function refreshMachineLoadsSnapshot({ fetchStatic = false } = {}) {
  if (!state.client) {
    renderMachineLoadsCard();
    return;
  }

  const machineLoads = state.machineLoads;
  const systemInfoPromise = (fetchStatic || !machineLoads.systemInfo)
    ? state.client.getMachineSystemInfo()
    : Promise.resolve(null);
  const serverInfoPromise = (fetchStatic || !machineLoads.klipperVersion)
    ? state.client.getServerInfo()
    : Promise.resolve(null);

  const [mcuSystemResult, procResult, systemInfoResult, serverInfoResult] = await Promise.allSettled([
    state.client.getMcuAndSystemStats(),
    state.client.getMachineProcStats(),
    systemInfoPromise,
    serverInfoPromise,
  ]);

  const errors = [];
  let updated = false;

  if (mcuSystemResult.status === "fulfilled") {
    const statusSnapshot = mcuSystemResult.value?.result?.status || {};
    machineLoads.mcuStatus = statusSnapshot?.mcu || null;
    machineLoads.systemStats = statusSnapshot?.system_stats || null;
    updated = true;
  } else {
    errors.push(mcuSystemResult.reason?.message || String(mcuSystemResult.reason));
  }

  if (procResult.status === "fulfilled") {
    machineLoads.procStats = procResult.value?.result || null;
    updated = true;
  } else {
    errors.push(procResult.reason?.message || String(procResult.reason));
  }

  if (systemInfoResult.status === "fulfilled") {
    if (systemInfoResult.value) {
      machineLoads.systemInfo = systemInfoResult.value?.result?.system_info || systemInfoResult.value?.result || null;
      updated = true;
    }
  } else {
    errors.push(systemInfoResult.reason?.message || String(systemInfoResult.reason));
  }

  if (serverInfoResult.status === "fulfilled") {
    if (serverInfoResult.value) {
      const serverInfo = serverInfoResult.value?.result || {};
      const versionLabel = extractVersionLabel(serverInfo?.klippy_version)
        || extractVersionLabel(serverInfo?.software_version);
      if (versionLabel) {
        machineLoads.klipperVersion = versionLabel;
      }
      updated = true;
    }
  } else {
    errors.push(serverInfoResult.reason?.message || String(serverInfoResult.reason));
  }

  if (updated) {
    machineLoads.lastUpdatedMs = Date.now();
  }

  machineLoads.lastError = errors.length ? errors[0] : "";

  if (errors.length) {
    log.debug("Machine loads poll completed with warnings.", {
      errorCount: errors.length,
      firstError: errors[0],
    });
  }

  renderMachineLoadsCard();
}

function stopMachineLoadPolling() {
  if (machineLoadPollTimer) {
    clearInterval(machineLoadPollTimer);
    machineLoadPollTimer = null;
  }
}

function startMachineLoadPolling() {
  stopMachineLoadPolling();
  if (!state.client) return;

  let inFlight = false;

  const poll = async () => {
    if (!state.client || inFlight) return;
    inFlight = true;

    try {
      await refreshMachineLoadsSnapshot();
    } catch (error) {
      const message = error?.message || String(error);
      state.machineLoads.lastError = message;
      log.debug("Machine loads poll failed.", { error: message });
      renderMachineLoadsCard();
    } finally {
      inFlight = false;
    }
  };

  poll();
  machineLoadPollTimer = setInterval(poll, SYSTEM_LOAD_POLL_INTERVAL_MS);
}

function resetMachineLoadsState() {
  state.machineLoads = createDefaultMachineLoadsState();
  renderMachineLoadsCard();
}

function normalizeEndstopState(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "triggered" || normalized === "closed") return "triggered";
  if (normalized === "open") return "open";
  return "unknown";
}

function normalizeEndstopPayload(payload) {
  if (!payload || typeof payload !== "object") return {};

  const entries = Object.entries(payload)
    .filter(([key]) => !!String(key || "").trim())
    .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value));

  const normalized = {};
  entries.forEach(([key, value]) => {
    normalized[String(key).trim()] = String(value);
  });

  return normalized;
}

function sortEndstopEntries(entries) {
  const axisOrder = ["x", "y", "z", "probe", "z_probe"];

  return [...entries].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();

    const rankA = axisOrder.indexOf(nameA);
    const rankB = axisOrder.indexOf(nameB);

    const weightedA = rankA >= 0 ? rankA : axisOrder.length + (nameA[0] === "x" ? 0 : nameA[0] === "y" ? 1 : nameA[0] === "z" ? 2 : 3);
    const weightedB = rankB >= 0 ? rankB : axisOrder.length + (nameB[0] === "x" ? 0 : nameB[0] === "y" ? 1 : nameB[0] === "z" ? 2 : 3);

    if (weightedA !== weightedB) return weightedA - weightedB;
    return nameA.localeCompare(nameB);
  });
}

function setEndstopsStatusMessage(message, level = "info") {
  const normalized = String(message || "").trim();
  if (!els.machineEndstopsStatus) return;
  els.machineEndstopsStatus.textContent = normalized;
  els.machineEndstopsStatus.dataset.level = level;
}

function renderEndstopsCard() {
  const endstopsState = state.endstops || createDefaultEndstopsState();
  const isConnected = state.connectionStatus === "connected";
  const entries = sortEndstopEntries(
    Object.entries(endstopsState.values || {}).map(([name, raw]) => ({
      name,
      raw: String(raw || "").trim(),
      state: normalizeEndstopState(raw),
    }))
  );

  if (els.machineEndstopsQuery) {
    els.machineEndstopsQuery.disabled = !isConnected || endstopsState.queryInFlight;
    els.machineEndstopsQuery.textContent = endstopsState.queryInFlight ? "Querying..." : "Query";
  }

  if (els.machineEndstopsList) {
    els.machineEndstopsList.innerHTML = "";

    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = isConnected
        ? "No endstop data available yet."
        : "Endstop data is unavailable while disconnected.";
      els.machineEndstopsList.appendChild(empty);
    } else {
      entries.forEach((entry) => {
        const row = document.createElement("div");
        row.className = "machine-endstop-item";

        const label = document.createElement("span");
        label.className = "machine-endstop-name";
        label.textContent = entry.name;

        const pill = document.createElement("span");
        pill.className = `machine-endstop-pill machine-endstop-pill-${entry.state}`;
        pill.textContent = entry.state === "triggered" ? "TRIGGERED" : entry.state === "open" ? "open" : "unknown";

        row.append(label, pill);
        els.machineEndstopsList.appendChild(row);
      });
    }
  }

  if (els.machineEndstopsSummary) {
    if (!entries.length) {
      els.machineEndstopsSummary.textContent = "Press Query to check current endstop states.";
    } else {
      const triggeredCount = entries.filter((entry) => entry.state === "triggered").length;
      const openCount = entries.filter((entry) => entry.state === "open").length;
      const unknownCount = entries.length - triggeredCount - openCount;

      const parts = [
        `${triggeredCount} triggered`,
        `${openCount} open`,
      ];
      if (unknownCount > 0) {
        parts.push(`${unknownCount} unknown`);
      }

      const lastLabel = endstopsState.lastUpdatedMs
        ? ` | Last query: ${new Date(endstopsState.lastUpdatedMs).toLocaleTimeString()}`
        : "";

      els.machineEndstopsSummary.textContent = `${parts.join(" | ")}${lastLabel}`;
    }
  }

  if (!state.client) {
    setEndstopsStatusMessage("Connect to Moonraker to query endstops.", "warn");
  } else if (!isConnected) {
    setEndstopsStatusMessage("Moonraker disconnected. Reconnect to query endstops.", "warn");
  } else if (endstopsState.queryInFlight) {
    setEndstopsStatusMessage("Querying endstop state...", "info");
  } else if (endstopsState.lastError) {
    setEndstopsStatusMessage(`Endstop query failed: ${endstopsState.lastError}`, "error");
  } else if (endstopsState.lastUpdatedMs) {
    setEndstopsStatusMessage("Endstop query complete.", "info");
  } else {
    setEndstopsStatusMessage("Press Query to request endstop state from Moonraker.", "info");
  }
}

async function requestEndstopsStatus({ source = "user", silent = false } = {}) {
  if (!state.client || state.connectionStatus !== "connected") {
    renderEndstopsCard();
    return null;
  }

  if (state.endstops.queryInFlight) {
    return null;
  }

  state.endstops.queryInFlight = true;
  state.endstops.lastError = "";
  renderEndstopsCard();

  try {
    const response = await state.client.getEndstopsStatus();
    const payload = response?.result && typeof response.result === "object" ? response.result : response;
    const normalized = normalizeEndstopPayload(payload);

    state.endstops.values = normalized;
    state.endstops.lastUpdatedMs = Date.now();
    state.endstops.lastError = "";

    if (source === "user") {
      appendConsole("Endstops queried.", "info");
    }

    renderEndstopsCard();
    return normalized;
  } catch (error) {
    const message = error?.message || String(error);
    state.endstops.lastError = message;

    if (!silent) {
      appendConsole(`Endstop query failed: ${message}`, "error");
    }

    renderEndstopsCard();
    return null;
  } finally {
    state.endstops.queryInFlight = false;
    renderEndstopsCard();
  }
}

function resetEndstopsState() {
  state.endstops = createDefaultEndstopsState();
  renderEndstopsCard();
}

function normalizeMachineLogPath(path) {
  return String(path || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^logs\//i, "");
}

function toMachineLogTimestampMs(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
}

function extractMachineLogFiles(fileResponse) {
  const result = fileResponse?.result;
  const rawFiles = Array.isArray(result)
    ? result
    : Array.isArray(result?.files)
      ? result.files
      : [];

  const byPath = new Map();

  rawFiles.forEach((entry) => {
    if (!entry) return;

    if (typeof entry === "object" && String(entry.type || "").toLowerCase() === "directory") {
      return;
    }

    const candidatePath = typeof entry === "string"
      ? entry
      : typeof entry.path === "string"
        ? entry.path
        : [entry.dirname, entry.filename].filter(Boolean).join("/");

    const relativePath = normalizeMachineLogPath(candidatePath);
    if (!relativePath || relativePath.endsWith("/")) return;

    const sizeValue = Number(entry?.size);
    const size = Number.isFinite(sizeValue) && sizeValue >= 0 ? sizeValue : null;
    const modifiedMs = toMachineLogTimestampMs(entry?.modified ?? entry?.mtime ?? entry?.date ?? entry?.time);

    byPath.set(relativePath, {
      relativePath,
      path: `logs/${relativePath}`,
      size,
      modifiedMs,
    });
  });

  return [...byPath.values()].sort((a, b) => {
    const aModified = Number(a.modifiedMs) || 0;
    const bModified = Number(b.modifiedMs) || 0;
    if (aModified !== bModified) return bModified - aModified;
    return a.relativePath.localeCompare(b.relativePath);
  });
}

function formatMachineLogTimestamp(modifiedMs) {
  const numeric = Number(modifiedMs);
  if (!Number.isFinite(numeric) || numeric <= 0) return "--";
  return new Date(numeric).toLocaleString();
}

function setMachineLogFilesStatusMessage(message, level = "info") {
  if (!els.machineLogFilesStatus) return;
  els.machineLogFilesStatus.textContent = String(message || "").trim();
  els.machineLogFilesStatus.dataset.level = level;
}

async function requestMachineLogFileDownload(relativePath) {
  const normalizedPath = normalizeMachineLogPath(relativePath);
  if (!normalizedPath || !state.client || state.connectionStatus !== "connected") return false;

  state.logFiles.actionInFlight = true;
  renderMachineLogFilesCard();

  try {
    const fileBlob = await state.client.getFileBlob("logs", normalizedPath);
    const fileName = normalizedPath.split("/").pop() || "log.txt";
    const url = URL.createObjectURL(fileBlob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
    appendConsole(`Log downloaded: logs/${normalizedPath}`, "info");
    state.logFiles.lastError = "";
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.logFiles.lastError = message;
    appendConsole(`Log download failed (${normalizedPath}): ${message}`, "error");
    return false;
  } finally {
    state.logFiles.actionInFlight = false;
    renderMachineLogFilesCard();
  }
}

async function requestMachineLogFileDelete(relativePath) {
  const normalizedPath = normalizeMachineLogPath(relativePath);
  if (!normalizedPath || !state.client || state.connectionStatus !== "connected") return false;

  const confirmed = window.confirm(`Delete log file logs/${normalizedPath}? This cannot be undone.`);
  if (!confirmed) return false;

  state.logFiles.actionInFlight = true;
  renderMachineLogFilesCard();

  try {
    await state.client.deleteLogFile(normalizedPath);
    appendConsole(`Log deleted: logs/${normalizedPath}`, "warn");
    state.logFiles.lastError = "";
    await loadMachineLogFiles({ source: "delete", silent: true });
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.logFiles.lastError = message;
    appendConsole(`Log delete failed (${normalizedPath}): ${message}`, "error");
    renderMachineLogFilesCard();
    return false;
  } finally {
    state.logFiles.actionInFlight = false;
    renderMachineLogFilesCard();
  }
}

async function requestMachineLogFilesDeleteAll() {
  if (!state.client || state.connectionStatus !== "connected") return false;

  const files = [...(state.logFiles.files || [])];
  if (!files.length) return false;

  const confirmed = window.confirm(`Delete all ${files.length} log file${files.length === 1 ? "" : "s"}? This cannot be undone.`);
  if (!confirmed) return false;

  state.logFiles.actionInFlight = true;
  renderMachineLogFilesCard();

  let deletedCount = 0;
  let failedCount = 0;

  try {
    for (const entry of files) {
      try {
        await state.client.deleteLogFile(entry.relativePath);
        deletedCount += 1;
      } catch {
        failedCount += 1;
      }
    }

    state.logFiles.lastError = "";
    appendConsole(`Log cleanup complete: ${deletedCount} deleted${failedCount ? `, ${failedCount} failed` : ""}.`, failedCount ? "warn" : "info");
    await loadMachineLogFiles({ source: "delete", silent: true });
    return failedCount === 0;
  } catch (error) {
    const message = error?.message || String(error);
    state.logFiles.lastError = message;
    appendConsole(`Delete all logs failed: ${message}`, "error");
    renderMachineLogFilesCard();
    return false;
  } finally {
    state.logFiles.actionInFlight = false;
    renderMachineLogFilesCard();
  }
}

function renderMachineLogFilesCard() {
  const logState = state.logFiles || createDefaultMachineLogFilesState();
  const isConnected = state.connectionStatus === "connected";
  const files = Array.isArray(logState.files) ? logState.files : [];
  const busy = logState.isLoading || logState.actionInFlight;

  if (els.machineLogFilesRefresh) {
    els.machineLogFilesRefresh.disabled = !isConnected || busy;
    els.machineLogFilesRefresh.textContent = logState.isLoading ? "Loading..." : "Refresh";
  }

  if (els.machineLogFilesDeleteAll) {
    els.machineLogFilesDeleteAll.disabled = !isConnected || busy || !files.length;
  }

  if (els.machineLogFilesSummary) {
    if (!files.length) {
      els.machineLogFilesSummary.textContent = "No log files loaded.";
    } else {
      const sizeTotal = files.reduce((sum, entry) => sum + (Number(entry.size) || 0), 0);
      const latestModified = files.reduce((max, entry) => Math.max(max, Number(entry.modifiedMs) || 0), 0);
      const latestLabel = latestModified > 0 ? ` | Latest: ${formatMachineLogTimestamp(latestModified)}` : "";
      const sizeLabel = sizeTotal > 0 ? ` | Total: ${formatFileSize(sizeTotal)}` : "";
      els.machineLogFilesSummary.textContent = `${files.length} log file${files.length === 1 ? "" : "s"}${sizeLabel}${latestLabel}`;
    }
  }

  if (els.machineLogFilesList) {
    els.machineLogFilesList.innerHTML = "";

    if (!files.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = isConnected ? "No log files reported in logs/." : "Log files are unavailable while disconnected.";
      els.machineLogFilesList.appendChild(empty);
    } else {
      files.forEach((entry) => {
        const row = document.createElement("article");
        row.className = "machine-log-file-item";

        const metaWrap = document.createElement("div");
        metaWrap.className = "machine-log-file-meta";

        const title = document.createElement("p");
        title.className = "machine-log-file-name";
        title.textContent = entry.relativePath;

        const detail = document.createElement("p");
        detail.className = "machine-log-file-detail muted";
        const sizeLabel = formatFileSize(entry.size) || "--";
        const modifiedLabel = formatMachineLogTimestamp(entry.modifiedMs);
        detail.textContent = `${sizeLabel} | Modified: ${modifiedLabel}`;

        metaWrap.append(title, detail);

        const actions = document.createElement("div");
        actions.className = "machine-log-file-row-actions";

        const downloadButton = document.createElement("button");
        downloadButton.type = "button";
        downloadButton.className = "machine-log-file-btn";
        downloadButton.textContent = "Download";
        downloadButton.disabled = busy;
        downloadButton.addEventListener("click", async () => {
          await requestMachineLogFileDownload(entry.relativePath);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "machine-log-file-btn danger";
        deleteButton.textContent = "Delete";
        deleteButton.disabled = busy;
        deleteButton.addEventListener("click", async () => {
          await requestMachineLogFileDelete(entry.relativePath);
        });

        actions.append(downloadButton, deleteButton);
        row.append(metaWrap, actions);
        els.machineLogFilesList.appendChild(row);
      });
    }
  }

  if (!state.client) {
    setMachineLogFilesStatusMessage("Connect to Moonraker to manage logs.", "warn");
  } else if (!isConnected) {
    setMachineLogFilesStatusMessage("Moonraker disconnected. Reconnect to manage logs.", "warn");
  } else if (logState.isLoading) {
    setMachineLogFilesStatusMessage("Loading log files...", "info");
  } else if (logState.actionInFlight) {
    setMachineLogFilesStatusMessage("Running log file action...", "warn");
  } else if (logState.lastError) {
    setMachineLogFilesStatusMessage(`Log files action failed: ${logState.lastError}`, "error");
  } else if (logState.lastUpdatedMs) {
    setMachineLogFilesStatusMessage(`Last refreshed: ${new Date(logState.lastUpdatedMs).toLocaleTimeString()}`, "info");
  } else {
    setMachineLogFilesStatusMessage("Press Refresh to load log files.", "info");
  }
}

async function loadMachineLogFiles({ source = "user", silent = false } = {}) {
  if (!state.client || state.connectionStatus !== "connected") {
    renderMachineLogFilesCard();
    return [];
  }

  if (state.logFiles.isLoading) {
    return state.logFiles.files || [];
  }

  state.logFiles.isLoading = true;
  state.logFiles.lastError = "";
  renderMachineLogFilesCard();

  try {
    const response = await state.client.getLogFiles();
    const files = extractMachineLogFiles(response);

    state.logFiles.files = files;
    state.logFiles.lastError = "";
    state.logFiles.lastUpdatedMs = Date.now();

    if (source === "user") {
      appendConsole(`Loaded ${files.length} log file${files.length === 1 ? "" : "s"}.`, "info");
    }

    renderMachineLogFilesCard();
    return files;
  } catch (error) {
    const message = error?.message || String(error);
    state.logFiles.lastError = message;

    if (!silent) {
      appendConsole(`Log files load failed: ${message}`, "error");
    }

    renderMachineLogFilesCard();
    return [];
  } finally {
    state.logFiles.isLoading = false;
    renderMachineLogFilesCard();
  }
}

function resetMachineLogFilesState() {
  state.logFiles = createDefaultMachineLogFilesState();
  renderMachineLogFilesCard();
}

function normalizeUpdaterName(value) {
  return String(value || "").trim().toLowerCase();
}

function formatUpdaterDisplayName(name) {
  const normalized = normalizeUpdaterName(name);
  if (!normalized) return "Unknown";
  if (normalized === "klipper") return "Klipper";
  if (normalized === "moonraker") return "Moonraker";
  if (normalized === "fluidd") return "Fluidd";
  if (normalized === "mainsail") return "Mainsail";
  if (normalized === "system") return "System";
  return normalized
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function deriveUpdateManagerEntries() {
  const versionInfo = state.updateManager.versionInfo;
  if (!versionInfo || typeof versionInfo !== "object") return [];

  const entries = Object.entries(versionInfo)
    .map(([key, rawEntry]) => {
      if (!rawEntry || typeof rawEntry !== "object") return null;
      const name = String(rawEntry.name || key).trim();
      if (!name) return null;
      return {
        ...rawEntry,
        name,
      };
    })
    .filter(Boolean);

  entries.sort((a, b) => {
    const nameA = normalizeUpdaterName(a.name);
    const nameB = normalizeUpdaterName(b.name);
    const rankA = UPDATE_MANAGER_PRIMARY_ORDER.indexOf(nameA);
    const rankB = UPDATE_MANAGER_PRIMARY_ORDER.indexOf(nameB);
    const weightedA = rankA >= 0 ? rankA : UPDATE_MANAGER_PRIMARY_ORDER.length + 10;
    const weightedB = rankB >= 0 ? rankB : UPDATE_MANAGER_PRIMARY_ORDER.length + 10;

    if (weightedA !== weightedB) return weightedA - weightedB;
    return nameA.localeCompare(nameB);
  });

  return entries;
}

function hasUpdaterUpdateAvailable(entry) {
  if (!entry || typeof entry !== "object") return false;

  const name = normalizeUpdaterName(entry.name);
  const configuredType = normalizeUpdaterName(entry.configured_type);

  if (name === "system" || configuredType === "system") {
    const packageCount = asFiniteNumber(entry.package_count, 0);
    return Number.isFinite(packageCount) && packageCount > 0;
  }

  const remoteHash = String(entry.remote_hash || "").trim().toLowerCase();
  const currentHash = String(entry.current_hash || "").trim().toLowerCase();
  if (remoteHash === "update-available") return true;
  if (remoteHash && currentHash && remoteHash !== currentHash) return true;

  const commitsBehind = toArray(entry.commits_behind).length;
  if (commitsBehind > 0) return true;

  const remoteVersion = String(entry.remote_version || "").trim();
  const currentVersion = String(entry.version || "").trim();
  if (remoteVersion && currentVersion && remoteVersion !== currentVersion) return true;

  return false;
}

function canRecoverUpdater(entry) {
  if (!entry || typeof entry !== "object") return false;

  const name = normalizeUpdaterName(entry.name);
  if (name === "system") return false;

  const configuredType = normalizeUpdaterName(entry.configured_type);
  if (configuredType === "git_repo" || configuredType === "zip" || configuredType === "web") return true;

  if (entry.is_valid === false) return true;
  if (entry.is_dirty === true) return true;
  if (entry.corrupt === true) return true;
  return false;
}

function canRollbackUpdater(entry) {
  if (!entry || typeof entry !== "object") return false;
  const rollbackVersion = String(entry.rollback_version || "").trim();
  return !!rollbackVersion;
}

function getUpdaterIssueMessages(entry) {
  if (!entry || typeof entry !== "object") return [];

  const messages = [];
  toArray(entry.warnings).forEach((msg) => {
    const normalized = String(msg || "").trim();
    if (normalized) messages.push(normalized);
  });
  toArray(entry.anomalies).forEach((msg) => {
    const normalized = String(msg || "").trim();
    if (normalized) messages.push(normalized);
  });
  toArray(entry.recovery_messages).forEach((msg) => {
    const normalized = String(msg || "").trim();
    if (normalized) messages.push(normalized);
  });

  return [...new Set(messages)];
}

function formatUpdateLogTime(timestamp) {
  const time = Number(timestamp);
  if (!Number.isFinite(time)) return "--:--:--";
  return new Date(time).toLocaleTimeString();
}

function setUpdateManagerStatusMessage(message, level = "info") {
  const normalized = String(message || "").trim();
  state.updateManager.statusMessage = normalized;

  if (!els.machineUpdateStatus) return;
  els.machineUpdateStatus.textContent = normalized;
  els.machineUpdateStatus.dataset.level = level;
}

function appendUpdateManagerActivity(message, level = "info") {
  const normalized = String(message || "").trim();
  if (!normalized) return;

  state.updateManager.activityLog.push({
    time: Date.now(),
    message: normalized,
    level,
  });

  if (state.updateManager.activityLog.length > UPDATE_MANAGER_LOG_LIMIT) {
    state.updateManager.activityLog.splice(0, state.updateManager.activityLog.length - UPDATE_MANAGER_LOG_LIMIT);
  }

  renderUpdateManagerCard();
}

function renderUpdateManagerLog() {
  if (!els.machineUpdateLog) return;

  els.machineUpdateLog.innerHTML = "";

  const logs = state.updateManager.activityLog;
  if (!logs.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No update activity yet.";
    els.machineUpdateLog.appendChild(empty);
    return;
  }

  const recentLogs = logs.slice(-60);
  recentLogs.forEach((entry) => {
    const line = document.createElement("p");
    line.className = "machine-update-log-line";
    if (entry.level === "error") {
      line.classList.add("machine-update-log-line-error");
    }

    line.textContent = `[${formatUpdateLogTime(entry.time)}] ${entry.message}`;
    els.machineUpdateLog.appendChild(line);
  });

  els.machineUpdateLog.scrollTop = els.machineUpdateLog.scrollHeight;
}

function buildUpdateActionButton({ label, kind = "default", disabled = false, onClick }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `machine-update-btn machine-update-btn-${kind}`;
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener("click", onClick);
  return button;
}

function renderUpdateManagerEntry(entry, actionsDisabled) {
  const item = document.createElement("article");
  item.className = "machine-update-item";

  const head = document.createElement("div");
  head.className = "machine-update-item-head";

  const titleWrap = document.createElement("div");
  titleWrap.className = "machine-update-title-wrap";

  const title = document.createElement("h4");
  title.textContent = formatUpdaterDisplayName(entry.name);
  titleWrap.appendChild(title);

  const statusPill = document.createElement("span");
  statusPill.className = "machine-update-pill";

  const hasUpdate = hasUpdaterUpdateAvailable(entry);
  const isValid = entry.is_valid !== false;
  const packageCount = asFiniteNumber(entry.package_count, 0);

  if (!isValid) {
    statusPill.classList.add("machine-update-pill-danger");
    statusPill.textContent = "Invalid";
  } else if (packageCount > 0 && normalizeUpdaterName(entry.name) === "system") {
    statusPill.classList.add("machine-update-pill-warn");
    statusPill.textContent = `${Math.round(packageCount)} packages`;
  } else if (hasUpdate) {
    statusPill.classList.add("machine-update-pill-warn");
    statusPill.textContent = "Update available";
  } else {
    statusPill.classList.add("machine-update-pill-ok");
    statusPill.textContent = "Up to date";
  }

  titleWrap.appendChild(statusPill);
  head.appendChild(titleWrap);

  const actionWrap = document.createElement("div");
  actionWrap.className = "machine-update-item-actions";

  const entryName = String(entry.name || "").trim();
  if (entryName && hasUpdate) {
    actionWrap.appendChild(buildUpdateActionButton({
      label: "Update",
      kind: "accent",
      disabled: actionsDisabled || !isValid,
      onClick: async () => {
        await requestUpdateManagerUpgrade(entryName);
      },
    }));
  }

  if (entryName && canRecoverUpdater(entry)) {
    actionWrap.appendChild(buildUpdateActionButton({
      label: "Recover",
      kind: "warning",
      disabled: actionsDisabled,
      onClick: async () => {
        const label = formatUpdaterDisplayName(entryName);
        const confirmed = window.confirm(`Recover ${label}?`);
        if (!confirmed) return;

        const hardRecover = window.confirm(
          `Use hard recover for ${label}?\n\nPress OK for hard recover, or Cancel for standard recover.`
        );

        await requestUpdateManagerRecover(entryName, { hard: hardRecover });
      },
    }));
  }

  if (entryName && canRollbackUpdater(entry)) {
    actionWrap.appendChild(buildUpdateActionButton({
      label: "Rollback",
      kind: "default",
      disabled: actionsDisabled,
      onClick: async () => {
        const label = formatUpdaterDisplayName(entryName);
        const confirmed = window.confirm(`Rollback ${label} to ${entry.rollback_version}?`);
        if (!confirmed) return;
        await requestUpdateManagerRollback(entryName);
      },
    }));
  }

  if (actionWrap.childElementCount) {
    head.appendChild(actionWrap);
  }

  item.appendChild(head);

  const detail = document.createElement("p");
  detail.className = "machine-update-detail";

  const currentVersion = String(entry.version || entry.full_version_string || "--").trim() || "--";
  const remoteVersion = String(entry.remote_version || "--").trim() || "--";
  const configuredType = String(entry.configured_type || "").trim();
  const channel = String(entry.channel || "").trim();
  const branch = String(entry.branch || "").trim();

  if (normalizeUpdaterName(entry.name) === "system") {
    detail.textContent = `Package updates: ${Number.isFinite(packageCount) ? Math.max(0, Math.round(packageCount)) : 0}`;
  } else {
    detail.textContent = `Current: ${currentVersion}  |  Latest: ${remoteVersion}`;
  }

  item.appendChild(detail);

  const metaParts = [];
  if (configuredType) metaParts.push(`Type: ${configuredType}`);
  if (channel) metaParts.push(`Channel: ${channel}`);
  if (branch) metaParts.push(`Branch: ${branch}`);

  const commitsBehind = toArray(entry.commits_behind).length;
  if (commitsBehind > 0) {
    metaParts.push(`${commitsBehind} commit${commitsBehind === 1 ? "" : "s"} behind`);
  }

  if (entry.is_dirty === true) metaParts.push("Dirty working tree");
  if (entry.is_valid === false) metaParts.push("Invalid state");

  if (metaParts.length) {
    const metaLine = document.createElement("p");
    metaLine.className = "machine-update-meta";
    metaLine.textContent = metaParts.join(" | ");
    item.appendChild(metaLine);
  }

  const issues = getUpdaterIssueMessages(entry);
  if (issues.length) {
    const issueList = document.createElement("div");
    issueList.className = "machine-update-issues";

    issues.slice(0, 3).forEach((issue) => {
      const issueLine = document.createElement("p");
      issueLine.textContent = issue;
      issueList.appendChild(issueLine);
    });

    item.appendChild(issueList);
  }

  return item;
}

function renderUpdateManagerCard() {
  const updateState = state.updateManager;
  const entries = deriveUpdateManagerEntries();
  const updatableCount = entries.filter((entry) => hasUpdaterUpdateAvailable(entry)).length;
  const hasClient = !!state.client;

  if (els.machineUpdateRefresh) {
    els.machineUpdateRefresh.disabled = !hasClient || updateState.actionInFlight;
  }

  if (els.machineUpdateUpgradeAll) {
    els.machineUpdateUpgradeAll.disabled = !hasClient || updateState.actionInFlight || updateState.busy || !updatableCount;
  }

  if (els.machineUpdateSummary) {
    if (!hasClient) {
      els.machineUpdateSummary.textContent = "Connect to Moonraker to check update status.";
    } else if (!entries.length) {
      els.machineUpdateSummary.textContent = "No updaters reported by Moonraker.";
    } else if (!updatableCount) {
      els.machineUpdateSummary.textContent = `All ${entries.length} updater${entries.length === 1 ? "" : "s"} are up to date.`;
    } else {
      els.machineUpdateSummary.textContent = `${updatableCount} updater${updatableCount === 1 ? "" : "s"} need attention.`;
    }
  }

  if (els.machineUpdateRate) {
    const remaining = asFiniteNumber(updateState.githubRequestsRemaining, null);
    const limit = asFiniteNumber(updateState.githubRateLimit, null);
    const resetTime = asFiniteNumber(updateState.githubLimitResetTime, null);

    if (Number.isFinite(remaining) && Number.isFinite(limit)) {
      const resetLabel = Number.isFinite(resetTime)
        ? ` | Reset: ${new Date(resetTime * 1000).toLocaleTimeString()}`
        : "";
      els.machineUpdateRate.textContent = `GitHub API: ${Math.round(remaining)}/${Math.round(limit)}${resetLabel}`;
    } else {
      els.machineUpdateRate.textContent = "";
    }
  }

  if (els.machineUpdateList) {
    els.machineUpdateList.innerHTML = "";

    if (!hasClient) {
      const message = document.createElement("p");
      message.className = "muted";
      message.textContent = "Update controls are available after Moonraker connects.";
      els.machineUpdateList.appendChild(message);
    } else if (!entries.length) {
      const message = document.createElement("p");
      message.className = "muted";
      message.textContent = "No updater entries found in Moonraker update status.";
      els.machineUpdateList.appendChild(message);
    } else {
      const actionsDisabled = updateState.actionInFlight || updateState.busy;
      entries.forEach((entry) => {
        els.machineUpdateList.appendChild(renderUpdateManagerEntry(entry, actionsDisabled));
      });
    }
  }

  renderUpdateManagerLog();

  if (!updateState.statusMessage) {
    if (!hasClient) {
      setUpdateManagerStatusMessage("Connect to Moonraker to use Update Manager.", "warn");
    } else if (updateState.lastError) {
      setUpdateManagerStatusMessage(`Update manager error: ${updateState.lastError}`, "error");
    } else if (updateState.busy) {
      setUpdateManagerStatusMessage("Update process running...", "warn");
    } else if (updateState.lastUpdatedMs) {
      setUpdateManagerStatusMessage(`Last checked: ${new Date(updateState.lastUpdatedMs).toLocaleTimeString()}`, "info");
    } else {
      setUpdateManagerStatusMessage("Loading update status...", "info");
    }
  }
}

function applyUpdateManagerSnapshot(payload, { keepStatusMessage = false } = {}) {
  const normalized = payload && typeof payload === "object" ? payload : {};
  const versionInfo = normalized.version_info && typeof normalized.version_info === "object"
    ? normalized.version_info
    : {};

  state.updateManager.busy = !!normalized.busy;
  state.updateManager.versionInfo = versionInfo;
  state.updateManager.githubRateLimit = asFiniteNumber(normalized.github_rate_limit, null);
  state.updateManager.githubRequestsRemaining = asFiniteNumber(normalized.github_requests_remaining, null);
  state.updateManager.githubLimitResetTime = asFiniteNumber(normalized.github_limit_reset_time, null);
  state.updateManager.lastError = "";
  state.updateManager.lastUpdatedMs = Date.now();

  if (!keepStatusMessage) {
    state.updateManager.statusMessage = "";
  }
}

async function refreshUpdateManagerStatus({ forceRefresh = false, source = "poll", name = null } = {}) {
  if (!state.client) {
    renderUpdateManagerCard();
    return null;
  }

  try {
    const response = forceRefresh
      ? await state.client.refreshMachineUpdates(name)
      : await state.client.getMachineUpdateStatus();

    const snapshot = response?.result && typeof response.result === "object"
      ? response.result
      : response;

    applyUpdateManagerSnapshot(snapshot);

    if (forceRefresh && source !== "poll") {
      setUpdateManagerStatusMessage("Update status refreshed.", "info");
      appendUpdateManagerActivity("Update status refreshed.");
    }

    renderUpdateManagerCard();
    return snapshot;
  } catch (error) {
    const message = error?.message || String(error);
    state.updateManager.lastError = message;

    if (source !== "poll") {
      appendConsole(`Update manager refresh failed: ${message}`, "error");
      appendUpdateManagerActivity(`Refresh failed: ${message}`, "error");
      setUpdateManagerStatusMessage(`Update manager refresh failed: ${message}`, "error");
    } else if (!state.updateManager.lastUpdatedMs) {
      setUpdateManagerStatusMessage(`Update manager refresh failed: ${message}`, "error");
    }

    renderUpdateManagerCard();
    throw error;
  }
}

function stopUpdateManagerPolling() {
  if (updateManagerPollTimer) {
    clearInterval(updateManagerPollTimer);
    updateManagerPollTimer = null;
  }
}

function startUpdateManagerPolling() {
  stopUpdateManagerPolling();
  if (!state.client) return;

  let inFlight = false;

  const poll = async () => {
    if (!state.client || inFlight) return;
    inFlight = true;

    try {
      await refreshUpdateManagerStatus({ forceRefresh: false, source: "poll" });
    } catch (error) {
      log.debug("Update manager poll failed.", { error: error?.message || String(error) });
    } finally {
      inFlight = false;
    }
  };

  poll();
  updateManagerPollTimer = setInterval(poll, UPDATE_MANAGER_POLL_INTERVAL_MS);
}

function resetUpdateManagerState() {
  state.updateManager = createDefaultUpdateManagerState();
  renderUpdateManagerCard();
}

async function runUpdateManagerAction(actionLabel, action) {
  if (!state.client) {
    setUpdateManagerStatusMessage("Connect to Moonraker to run updater actions.", "warn");
    return false;
  }

  if (state.updateManager.actionInFlight) {
    setUpdateManagerStatusMessage("Another update action is currently running.", "warn");
    return false;
  }

  state.updateManager.actionInFlight = true;
  state.updateManager.activeActionLabel = actionLabel;
  setUpdateManagerStatusMessage(`${actionLabel} requested...`, "warn");
  appendUpdateManagerActivity(`${actionLabel} requested.`);
  renderUpdateManagerCard();

  try {
    await action();
    appendUpdateManagerActivity(`${actionLabel} accepted.`);

    // Refresh quickly in case websocket update notifications are unavailable.
    try {
      await refreshUpdateManagerStatus({ forceRefresh: false, source: "action" });
    } catch (refreshError) {
      const refreshMessage = refreshError?.message || String(refreshError);
      log.debug("Update manager post-action refresh failed.", { actionLabel, error: refreshMessage });
    }

    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.updateManager.lastError = message;
    appendUpdateManagerActivity(`${actionLabel} failed: ${message}`, "error");
    appendConsole(`${actionLabel} failed: ${message}`, "error");
    setUpdateManagerStatusMessage(`${actionLabel} failed: ${message}`, "error");
    renderUpdateManagerCard();
    return false;
  } finally {
    state.updateManager.actionInFlight = false;
    state.updateManager.activeActionLabel = "";
    renderUpdateManagerCard();
  }
}

async function requestUpdateManagerRefresh() {
  await refreshUpdateManagerStatus({ forceRefresh: true, source: "user" });
}

async function requestUpdateManagerUpgrade(name = null) {
  const actionLabel = name
    ? `Update ${formatUpdaterDisplayName(name)}`
    : "Update all components";

  return runUpdateManagerAction(actionLabel, async () => {
    await state.client.upgradeMachineUpdates(name);
  });
}

async function requestUpdateManagerRecover(name, { hard = false } = {}) {
  const actionLabel = `${hard ? "Hard recover" : "Recover"} ${formatUpdaterDisplayName(name)}`;

  return runUpdateManagerAction(actionLabel, async () => {
    await state.client.recoverMachineUpdater(name, { hard });
  });
}

async function requestUpdateManagerRollback(name) {
  const actionLabel = `Rollback ${formatUpdaterDisplayName(name)}`;

  return runUpdateManagerAction(actionLabel, async () => {
    await state.client.rollbackMachineUpdater(name);
  });
}

function handleUpdateManagerResponseNotification(payload) {
  const [response] = Array.isArray(payload?.params) ? payload.params : [];
  if (!response || typeof response !== "object") return;

  const applicationName = String(response.application || response.name || "update").trim();
  const applicationLabel = formatUpdaterDisplayName(applicationName);
  const message = String(response.message || "").trim();
  const isComplete = response.complete === true;
  const isError = response.error === true;

  if (message) {
    appendUpdateManagerActivity(`${applicationLabel}: ${message}`, isError ? "error" : "info");
  }

  if (isError) {
    state.updateManager.lastError = message || "Update manager reported an error.";
    setUpdateManagerStatusMessage(state.updateManager.lastError, "error");
  } else if (isComplete) {
    state.updateManager.busy = false;
    state.updateManager.actionInFlight = false;
    state.updateManager.activeActionLabel = "";
    setUpdateManagerStatusMessage(`${applicationLabel} update completed.`, "info");
    void refreshUpdateManagerStatus({ forceRefresh: false, source: "notify" });
  } else {
    state.updateManager.busy = true;
    if (message) {
      setUpdateManagerStatusMessage(`${applicationLabel}: ${message}`, "warn");
    }
  }

  renderUpdateManagerCard();
}

function handleUpdateManagerRefreshedNotification(payload) {
  const [status] = Array.isArray(payload?.params) ? payload.params : [];
  if (!status || typeof status !== "object") return;

  applyUpdateManagerSnapshot(status);
  setUpdateManagerStatusMessage("Update status refreshed.", "info");
  appendUpdateManagerActivity("Moonraker pushed refreshed update status.");
  renderUpdateManagerCard();
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

    const latestSample = history[history.length - 1];
    void persistTemperatureHistoryPoint(latestSample);
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

  ctx.beginPath();
  ctx.rect(layout.left, layout.top, layout.width, layout.height);
  ctx.clip();

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

function findFirstTemperatureHistoryIndex(history, timestamp) {
  let low = 0;
  let high = history.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (history[mid].time < timestamp) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

function findLastTemperatureHistoryIndex(history, timestamp) {
  let low = 0;
  let high = history.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (history[mid].time <= timestamp) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low - 1;
}

function sliceVisibleTemperatureHistory(history, startTime, endTime) {
  if (!history.length) return [];

  let startIndex = findFirstTemperatureHistoryIndex(history, startTime);
  let endIndex = findLastTemperatureHistoryIndex(history, endTime);

  if (startIndex > 0) startIndex -= 1;
  if (endIndex < history.length - 1) endIndex += 1;

  if (startIndex < 0) startIndex = 0;
  if (endIndex >= history.length) endIndex = history.length - 1;
  if (endIndex < startIndex) return [];

  return history.slice(startIndex, endIndex + 1);
}

function renderTemperatureChart() {
  const canvas = els.temperatureChart;
  if (!canvas || !state.temperatures.chart.show) return;

  const fullHistory = state.temperatures.history;
  const chartState = state.temperatures.chart;
  const windowMs = TEMPERATURE_CHART_WINDOW_MS;

  const lastTimestamp = fullHistory[fullHistory.length - 1]?.time || Date.now();
  const firstTimestamp = fullHistory[0]?.time || lastTimestamp - windowMs;
  const fullSpanMs = Math.max(0, lastTimestamp - firstTimestamp);
  const maxOffsetMs = Math.max(0, fullSpanMs - windowMs);
  const clampedOffsetMs = Math.max(0, Math.min(chartState.offsetMs || 0, maxOffsetMs));

  if (clampedOffsetMs !== chartState.offsetMs) {
    chartState.offsetMs = clampedOffsetMs;
  }

  const requestedEndTime = lastTimestamp - clampedOffsetMs;
  const startTime = Math.max(firstTimestamp, requestedEndTime - windowMs);
  const endTime = Math.max(requestedEndTime, startTime + windowMs);
  const history = sliceVisibleTemperatureHistory(fullHistory, startTime, endTime);

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

  const peak = history.reduce((max, point) => {
    const pointMax = Math.max(
      Number.isFinite(point.hotendCurrent) ? point.hotendCurrent : 0,
      Number.isFinite(point.hotendTarget) ? point.hotendTarget : 0,
      Number.isFinite(point.bedCurrent) ? point.bedCurrent : 0,
      Number.isFinite(point.bedTarget) ? point.bedTarget : 0,
    );
    return Math.max(max, pointMax);
  }, 0);

  const yMax = chartState.autoscale
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
    windowMs,
    maxOffsetMs,
  };

  drawTemperatureChartGrid(ctx, layout);
  const temperatureColors = getTemperatureLineColors();
  drawTemperatureLine(ctx, layout, history, "hotendCurrent", temperatureColors.hotend);
  drawTemperatureLine(ctx, layout, history, "bedCurrent", temperatureColors.bed);

  const hovered = Number.isInteger(chartState.hoverIndex)
    ? history[chartState.hoverIndex]
    : null;

  if (!hovered && chartState.hoverIndex !== null) {
    chartState.hoverIndex = null;
  }

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

  chartState.layout = layout;
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

function handleTemperatureChartWheel(event) {
  const layout = state.temperatures.chart.layout;
  if (!layout || layout.maxOffsetMs <= 0) return;

  const primaryDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
    ? event.deltaX
    : event.deltaY;

  if (!Number.isFinite(primaryDelta) || primaryDelta === 0) return;

  event.preventDefault();

  const baseStepMs = Math.max(15 * 1000, Math.round(layout.windowMs * TEMPERATURE_CHART_SCROLL_STEP_RATIO));
  const deltaUnits = Math.min(12, Math.max(1, Math.abs(primaryDelta) / 100));
  const speedMultiplier = event.shiftKey ? 8 : 1;
  const deltaOffsetMs = Math.round(baseStepMs * deltaUnits * speedMultiplier);

  const nextOffsetMs = Math.max(
    0,
    Math.min(layout.maxOffsetMs, state.temperatures.chart.offsetMs + Math.sign(primaryDelta) * deltaOffsetMs),
  );

  if (nextOffsetMs === state.temperatures.chart.offsetMs) return;

  state.temperatures.chart.offsetMs = nextOffsetMs;
  state.temperatures.chart.hoverIndex = null;
  renderTemperatureChart();
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
  });

  if (!sent) return;

  state.temperatures[sensorKey].target = target;
  renderTemperaturePanel();
}

async function cooldownTemperaturePanel() {
  const sent = await executeGcodeAction("SET_HEATER_TEMPERATURE HEATER=extruder TARGET=0\nSET_HEATER_TEMPERATURE HEATER=heater_bed TARGET=0", {
    actionLabel: "Cooldown",
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
  els.temperatureChart?.addEventListener("wheel", handleTemperatureChartWheel, { passive: false });

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
  stopMachineLoadPolling();
  stopUpdateManagerPolling();
  stopConsoleStorePolling();
  resetConsoleStoreTracking();
  resetMachineLoadsState();
  resetUpdateManagerState();
  resetEndstopsState();
  resetMachineLogFilesState();

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
      startMachineLoadPolling();
      startUpdateManagerPolling();
      resetConsoleStoreTracking();
      startConsoleStorePolling();
      void loadConsoleHelperEntries();
      void refreshMachineLoadsSnapshot({ fetchStatic: true });
      void refreshUpdateManagerStatus({ forceRefresh: false, source: "connect" });
      void requestEndstopsStatus({ source: "connect", silent: true });
      void loadMachineLogFiles({ source: "connect", silent: true });      log.info("Moonraker websocket connected.");
      return;
    }

    if (status === "disconnected") {
      appendConsole("Moonraker disconnected.", "warn");
      stopTemperaturePolling();
      stopMachineLoadPolling();
      stopUpdateManagerPolling();
      stopConsoleStorePolling();
      state.machineLoads.lastError = "Moonraker disconnected.";
      state.updateManager.lastError = "Moonraker disconnected.";
      state.updateManager.statusMessage = "";
      state.endstops.queryInFlight = false;
      state.logFiles.isLoading = false;
      state.logFiles.actionInFlight = false;
      state.jobs.isLoading = false;
      state.jobs.actionInFlight = false;
      renderMachineLoadsCard();
      renderUpdateManagerCard();
      renderEndstopsCard();
      renderMachineLogFilesCard();
      renderJobsCard();
      log.warn("Moonraker websocket disconnected.");
      return;
    }

    if (status === "error") {
      appendConsole("Moonraker websocket error.", "error");
      stopTemperaturePolling();
      stopMachineLoadPolling();
      stopUpdateManagerPolling();
      stopConsoleStorePolling();
      state.machineLoads.lastError = "Moonraker websocket error.";
      state.updateManager.lastError = "Moonraker websocket error.";
      state.updateManager.statusMessage = "";
      state.endstops.queryInFlight = false;
      state.logFiles.isLoading = false;
      state.logFiles.actionInFlight = false;
      state.jobs.isLoading = false;
      state.jobs.actionInFlight = false;
      renderMachineLoadsCard();
      renderUpdateManagerCard();
      renderEndstopsCard();
      renderMachineLogFilesCard();
      renderJobsCard();
      log.error("Moonraker websocket error.");
      return;
    }

    log.debug("Moonraker connection status update.", { status });
  });

  state.client.onMessage((payload) => {
    if (state.console.rawOutput) {
      try {
        appendConsole(JSON.stringify(payload), "debug", {
          label: "RAW",
          consoleType: "system",
        });
      } catch {
        appendConsole(String(payload), "debug", {
          label: "RAW",
          consoleType: "system",
        });
      }
    }

    if (payload.method === "notify_gcode_response") {
      const [responseLine] = payload.params || [];
      splitConsoleMessageLines(responseLine).forEach((line) => {
        const isErrorLine = line.startsWith("!!") || /^error\b/i.test(line);
        appendConsole(line, isErrorLine ? "error" : "info", {
          label: isErrorLine ? "ERROR" : "RESPONSE",
          consoleType: isErrorLine ? "error" : "response",
        });
      });
      return;
    }
    if (payload.method === "notify_gcode_store") {
      const entries = extractGcodeStoreEntries(payload);
      if (entries.length) {
        processGcodeStoreEntries(entries);
      }
      return;
    }
    if (payload.method === "notify_status_update") {
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
      return;
    }

    if (payload.method === "notify_update_response") {
      handleUpdateManagerResponseNotification(payload);
      return;
    }

    if (payload.method === "notify_update_refreshed") {
      handleUpdateManagerRefreshedNotification(payload);
    }
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
    await refreshMachineLoadsSnapshot({ fetchStatic: true });
  } catch (error) {
    const message = error?.message || String(error);
    state.machineLoads.lastError = message;
    renderMachineLoadsCard();
    log.debug("Initial machine loads snapshot failed.", { error: message });
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
    const files = await loadJobsFiles({ source: "connect", silent: true });
    log.info("Print files loaded.", { count: files.length });
  } catch (error) {
    const message = error?.message || String(error);
    appendConsole(`Print files load failed: ${message}`, "error");
    log.error("Print files load failed.", { error: message });
  }

  await loadConfigFiles({ preserveSelection: true });
}

function renderMacroButtons(container, macroKeys) {
  if (!container) return;

  container.innerHTML = "";
  if (!macroKeys.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No macros found.";
    container.appendChild(empty);
    return;
  }

  macroKeys.forEach((macro) => {
    const name = macro.replace("gcode_macro ", "");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "macro-action-btn";
    button.textContent = name;
    button.title = name;
    button.addEventListener("click", async () => {
      await executeGcodeAction(name, {
        actionLabel: `Macro ${name}`,
      });
    });
    container.appendChild(button);
  });
}

function renderMacros(macroKeys) {
  renderMacroButtons(els.macroList, macroKeys);
  renderMacroButtons(els.dashboardMacroList, macroKeys);
}

function normalizeGcodePath(path) {
  return String(path || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^gcodes\//i, "")
    .replace(/\/+$/, "");
}

function getGcodeDirectory(path) {
  const normalized = normalizeGcodePath(path);
  if (!normalized) return "";

  const parts = normalized.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
}

function getGcodeDisplayName(path) {
  const normalized = normalizeGcodePath(path);
  if (!normalized) return "";

  const parts = normalized.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : normalized;
}

function toGcodeTimestampMs(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
}

function formatJobsTimestamp(modifiedMs) {
  const numeric = Number(modifiedMs);
  if (!Number.isFinite(numeric) || numeric <= 0) return "--";
  return new Date(numeric).toLocaleString();
}

function normalizeJobsEntryType(type) {
  const normalized = String(type || "").trim().toLowerCase();
  if (normalized === "directory") return "directory";
  if (normalized === "file") return "file";
  return "";
}

function addJobsDirectoryWithParents(directorySet, directoryPath) {
  const normalized = normalizeJobsDirectory(directoryPath);
  if (!normalized) return;

  const segments = normalized.split("/").filter(Boolean);
  if (!segments.length) return;

  let prefix = "";
  segments.forEach((segment) => {
    prefix = prefix ? `${prefix}/${segment}` : segment;
    directorySet.add(prefix);
  });
}

function extractJobsListing(fileResponse) {
  const result = fileResponse?.result;
  const rawFiles = Array.isArray(fileResponse)
    ? fileResponse
    : Array.isArray(result)
      ? result
      : Array.isArray(result?.files)
        ? result.files
        : [];

  const byPath = new Map();
  const directories = new Set();

  rawFiles.forEach((entry) => {
    if (!entry) return;

    const entryType = normalizeJobsEntryType(entry?.type);
    const candidatePath = typeof entry === "string"
      ? entry
      : typeof entry.path === "string"
        ? entry.path
        : [entry.dirname, entry.filename].filter(Boolean).join("/");

    const normalizedPath = normalizeGcodePath(candidatePath);
    if (!normalizedPath) return;

    const isDirectory = entryType === "directory" || String(candidatePath || "").trim().endsWith("/");
    if (isDirectory) {
      addJobsDirectoryWithParents(directories, normalizedPath);
      return;
    }

    const sizeValue = Number(entry?.size);
    const size = Number.isFinite(sizeValue) && sizeValue >= 0 ? sizeValue : 0;
    const modifiedMs = toGcodeTimestampMs(entry?.modified ?? entry?.mtime ?? entry?.date ?? entry?.time);

    byPath.set(normalizedPath, {
      path: normalizedPath,
      displayName: getGcodeDisplayName(normalizedPath),
      directory: getGcodeDirectory(normalizedPath),
      size,
      modifiedMs,
    });

    const parentDirectory = getGcodeDirectory(normalizedPath);
    if (parentDirectory) {
      addJobsDirectoryWithParents(directories, parentDirectory);
    }
  });

  const files = [...byPath.values()].sort((a, b) => {
    const aModified = Number(a.modifiedMs) || 0;
    const bModified = Number(b.modifiedMs) || 0;
    if (aModified !== bModified) return bModified - aModified;
    return a.path.localeCompare(b.path);
  });

  return {
    files,
    directories: [...directories].sort((a, b) => a.localeCompare(b)),
  };
}

function syncJobsMetadataCache(files) {
  const paths = new Set((files || []).map((entry) => normalizeGcodePath(entry.path)).filter(Boolean));

  [...state.jobs.metadataByPath.keys()].forEach((key) => {
    if (!paths.has(key)) {
      state.jobs.metadataByPath.delete(key);
    }
  });

  [...state.jobs.metadataLoading].forEach((key) => {
    if (!paths.has(key)) {
      state.jobs.metadataLoading.delete(key);
    }
  });
}

function applyJobsListing(listing) {
  const files = Array.isArray(listing?.files) ? listing.files : [];
  const directories = Array.isArray(listing?.directories) ? listing.directories : [];

  state.jobs.files = files;
  state.jobs.directories = directories;
  syncJobsMetadataCache(files);
  state.jobs.currentDirectory = normalizeJobsCurrentDirectory(state.jobs.currentDirectory);
}

function deriveJobsDirectoryEntries() {
  const currentDirectory = normalizeJobsDirectory(state.jobs.currentDirectory);
  const directoryPrefix = currentDirectory ? `${currentDirectory}/` : "";
  const directories = new Map();
  const files = [];

  const ensureDirectory = (path) => {
    const normalizedPath = normalizeJobsDirectory(path);
    if (!normalizedPath) return;

    const displayName = getGcodeDisplayName(normalizedPath) || normalizedPath;

    if (!directories.has(normalizedPath)) {
      directories.set(normalizedPath, {
        path: normalizedPath,
        displayName,
        fileCount: 0,
        size: 0,
        modifiedMs: 0,
      });
    }
  };

  const getImmediateChildDirectory = (path) => {
    const normalizedPath = normalizeJobsDirectory(path);
    if (!normalizedPath) return "";

    if (currentDirectory) {
      if (!normalizedPath.startsWith(directoryPrefix)) return "";
      const remainder = normalizedPath.slice(directoryPrefix.length);
      if (!remainder || remainder.startsWith("/")) return "";
      const childName = remainder.split("/")[0];
      if (!childName) return "";
      return `${directoryPrefix}${childName}`;
    }

    const childName = normalizedPath.split("/")[0];
    return childName || "";
  };

  (state.jobs.directories || []).forEach((directoryPath) => {
    const childPath = getImmediateChildDirectory(directoryPath);
    if (!childPath || childPath === currentDirectory) return;
    ensureDirectory(childPath);
  });

  (state.jobs.files || []).forEach((entry) => {
    const normalizedPath = normalizeGcodePath(entry.path);
    if (!normalizedPath) return;

    if (currentDirectory && !normalizedPath.startsWith(directoryPrefix)) {
      return;
    }

    const remainder = currentDirectory ? normalizedPath.slice(directoryPrefix.length) : normalizedPath;
    if (!remainder || remainder.startsWith("/")) return;

    const slashIndex = remainder.indexOf("/");
    if (slashIndex >= 0) {
      const childName = remainder.slice(0, slashIndex);
      const childPath = directoryPrefix ? `${directoryPrefix}${childName}` : childName;
      if (!childPath) return;

      ensureDirectory(childPath);

      const folderEntry = directories.get(childPath);
      folderEntry.fileCount += 1;
      folderEntry.size += Number(entry.size) || 0;
      folderEntry.modifiedMs = Math.max(folderEntry.modifiedMs, Number(entry.modifiedMs) || 0);
      return;
    }

    files.push(entry);
  });

  return {
    directories: [...directories.values()],
    files,
  };
}
function sortJobsDirectories(entries) {
  return [...entries].sort((a, b) => a.path.localeCompare(b.path));
}

function sortJobsFiles(entries) {
  const sortMode = normalizeJobsSort(state.jobs.sortMode);
  const items = [...entries];

  items.sort((a, b) => {
    if (sortMode === "name_asc") {
      return a.displayName.localeCompare(b.displayName) || a.path.localeCompare(b.path);
    }

    if (sortMode === "name_desc") {
      return b.displayName.localeCompare(a.displayName) || b.path.localeCompare(a.path);
    }

    if (sortMode === "size_desc") {
      const delta = (Number(b.size) || 0) - (Number(a.size) || 0);
      return delta || a.displayName.localeCompare(b.displayName);
    }

    if (sortMode === "size_asc") {
      const delta = (Number(a.size) || 0) - (Number(b.size) || 0);
      return delta || a.displayName.localeCompare(b.displayName);
    }

    if (sortMode === "eta_desc" || sortMode === "eta_asc") {
      const metadataA = state.jobs.metadataByPath.get(a.path);
      const metadataB = state.jobs.metadataByPath.get(b.path);
      const etaA = Number(metadataA?.estimatedTime) || 0;
      const etaB = Number(metadataB?.estimatedTime) || 0;
      const delta = sortMode === "eta_desc" ? etaB - etaA : etaA - etaB;
      if (delta !== 0) return delta;
      return a.displayName.localeCompare(b.displayName);
    }

    if (sortMode === "modified_asc") {
      const delta = (Number(a.modifiedMs) || 0) - (Number(b.modifiedMs) || 0);
      return delta || a.displayName.localeCompare(b.displayName);
    }

    const delta = (Number(b.modifiedMs) || 0) - (Number(a.modifiedMs) || 0);
    return delta || a.displayName.localeCompare(b.displayName);
  });

  return items;
}

function getCurrentJobsPrintState() {
  const printStats = state.printStatus.lastPrintStats || {};
  const fallbackState = els.printerState?.dataset?.state || "unknown";
  const reportedState = printStats.state || printStats.status || fallbackState;
  const normalizedState = normalizePrinterState(reportedState);

  const statsFilename = normalizeGcodePath(printStats.filename);
  const fallbackFilename = normalizeGcodePath(state.printStatus.filename);
  const filename = statsFilename || fallbackFilename;

  return {
    state: normalizedState,
    filename,
  };
}

function setJobsStatusMessage(message, level = "info") {
  if (!els.jobsStatus) return;
  els.jobsStatus.textContent = String(message || "").trim();
  els.jobsStatus.dataset.level = level;
}

function parseJobsMetadata(metadata) {
  const estimatedTime = Number(metadata?.estimated_time);
  const layerCount = Number(metadata?.layer_count);
  const slicer = String(metadata?.slicer || "").trim();
  const slicerVersion = String(metadata?.slicer_version || "").trim();

  return {
    thumbnailPath: pickThumbnailPath(metadata),
    estimatedTime: Number.isFinite(estimatedTime) && estimatedTime > 0 ? estimatedTime : null,
    totalLayers: Number.isFinite(layerCount) && layerCount > 0 ? Math.round(layerCount) : null,
    layerHeight: readPositiveNumber(metadata?.layer_height),
    firstLayerHeight: readPositiveNumber(metadata?.first_layer_height),
    objectHeight: readPositiveNumber(metadata?.object_height),
    filamentTotal: readPositiveNumber(metadata?.filament_total),
    filamentWeightTotal: readPositiveNumber(metadata?.filament_weight_total),
    filamentType: String(metadata?.filament_type || "").trim(),
    filamentName: String(metadata?.filament_name || "").trim(),
    nozzleDiameter: readPositiveNumber(metadata?.nozzle_diameter),
    slicerLabel: slicer ? `${slicer}${slicerVersion ? ` ${slicerVersion}` : ""}` : "",
    firstLayerExtruderTemp: readFiniteNumber(metadata?.first_layer_extr_temp ?? metadata?.first_layer_extruder_temp),
    firstLayerBedTemp: readFiniteNumber(metadata?.first_layer_bed_temp),
    chamberTemp: readFiniteNumber(metadata?.chamber_temp),
  };
}

async function ensureJobsMetadata(path) {
  const normalizedPath = normalizeGcodePath(path);
  if (!normalizedPath || !state.client) return;

  if (state.jobs.metadataByPath.has(normalizedPath)) return;
  if (state.jobs.metadataLoading.has(normalizedPath)) return;

  state.jobs.metadataLoading.add(normalizedPath);

  try {
    const response = await state.client.getFileMetadata(normalizedPath);
    const metadata = parseJobsMetadata(response?.result || {});
    state.jobs.metadataByPath.set(normalizedPath, metadata);

    if (!state.printStatus.metadataByFile.has(normalizedPath)) {
      state.printStatus.metadataByFile.set(normalizedPath, metadata);
    }
  } catch {
    state.jobs.metadataByPath.set(normalizedPath, {
      thumbnailPath: "",
      estimatedTime: null,
      totalLayers: null,
      layerHeight: null,
      firstLayerHeight: null,
      objectHeight: null,
      filamentTotal: null,
      filamentWeightTotal: null,
      filamentType: "",
      filamentName: "",
      nozzleDiameter: null,
      slicerLabel: "",
      firstLayerExtruderTemp: null,
      firstLayerBedTemp: null,
      chamberTemp: null,
    });
  } finally {
    state.jobs.metadataLoading.delete(normalizedPath);
    if (state.activeView === "files") {
      renderJobsCard();
    }
  }
}

function persistJobsViewState() {
  localStorage.setItem(JOBS_SORT_STORAGE_KEY, normalizeJobsSort(state.jobs.sortMode));
  localStorage.setItem(JOBS_TYPE_FILTER_STORAGE_KEY, normalizeJobsTypeFilter(state.jobs.typeFilter));
  localStorage.setItem(JOBS_SEARCH_STORAGE_KEY, String(state.jobs.searchQuery || "").trim());
  localStorage.setItem(JOBS_DIRECTORY_STORAGE_KEY, normalizeJobsDirectory(state.jobs.currentDirectory));
  localStorage.setItem(JOBS_COLUMNS_STORAGE_KEY, JSON.stringify(normalizeJobsVisibleColumns(state.jobs.visibleColumns)));
}

function doesJobsDirectoryExist(directory) {
  const normalizedDirectory = normalizeJobsDirectory(directory);
  if (!normalizedDirectory) return true;

  if ((state.jobs.directories || []).some((entry) => normalizeJobsDirectory(entry) === normalizedDirectory)) {
    return true;
  }

  return (state.jobs.files || []).some((entry) => {
    const path = normalizeGcodePath(entry.path);
    return path.startsWith(`${normalizedDirectory}/`);
  });
}

function normalizeJobsCurrentDirectory(directoryCandidate = state.jobs.currentDirectory) {
  let directory = normalizeJobsDirectory(directoryCandidate);
  if (!directory) return "";

  while (directory && !doesJobsDirectoryExist(directory)) {
    const segments = directory.split("/");
    segments.pop();
    directory = segments.join("/");
  }

  return directory;
}

function setJobsDirectory(directory, { persist = true } = {}) {
  state.jobs.currentDirectory = normalizeJobsCurrentDirectory(directory);

  if (persist) {
    persistJobsViewState();
  }

  renderJobsCard();
}

function getJobsToolbarMenus() {
  return [
    { menu: els.jobsSortMenu, toggle: els.jobsSortToggle },
    { menu: els.jobsColumnsMenu, toggle: els.jobsColumnsToggle },
    { menu: els.jobsFilterMenu, toggle: els.jobsFilterToggle },
    { menu: els.jobsAddMenu, toggle: els.jobsAddToggle },
  ].filter((entry) => entry.menu && entry.toggle);
}

function setJobsToolbarMenuState(menu, toggle, isOpen) {
  if (!menu || !toggle) return;
  menu.hidden = !isOpen;
  toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  toggle.classList.toggle("is-active", isOpen);
}

function closeJobsToolbarMenus(exceptMenu = null) {
  getJobsToolbarMenus().forEach(({ menu, toggle }) => {
    if (menu === exceptMenu) return;
    setJobsToolbarMenuState(menu, toggle, false);
  });
}

function toggleJobsToolbarMenu(menu, toggle) {
  if (!menu || !toggle) return;
  const opening = menu.hidden;
  closeJobsToolbarMenus(opening ? menu : null);
  setJobsToolbarMenuState(menu, toggle, opening);
}

function renderJobsPathDisplay() {
  if (!els.jobsPathDisplay) return;
  const directory = normalizeJobsDirectory(state.jobs.currentDirectory);
  const pathLabel = directory ? `/${directory}` : "/";
  els.jobsPathDisplay.textContent = pathLabel;
  els.jobsPathDisplay.title = directory ? `gcodes/${directory}` : "gcodes/";
}

function getJobsVisibleColumns() {
  return normalizeJobsVisibleColumns(state.jobs.visibleColumns);
}

function setJobsVisibleColumns(nextColumns) {
  const normalized = normalizeJobsVisibleColumns(nextColumns);
  const current = getJobsVisibleColumns();
  if (normalized.length === current.length && normalized.every((value, index) => value === current[index])) {
    return;
  }

  state.jobs.visibleColumns = normalized;
  persistJobsViewState();
  renderJobsColumnsMenu();
  renderJobsCard();
}

function toggleJobsVisibleColumn(columnKey, enabled) {
  const normalizedKey = String(columnKey || "").trim().toLowerCase();
  if (!JOBS_COLUMN_KEYS.includes(normalizedKey)) return;

  const current = getJobsVisibleColumns();

  if (enabled) {
    if (current.includes(normalizedKey)) return;
    setJobsVisibleColumns([...current, normalizedKey]);
    return;
  }

  if (!current.includes(normalizedKey)) return;

  if (current.length === 1) {
    setJobsStatusMessage("At least one file info field must remain visible.", "warn");
    renderJobsColumnsMenu();
    return;
  }

  setJobsVisibleColumns(current.filter((entry) => entry !== normalizedKey));
}

function moveJobsVisibleColumn(columnKey, direction) {
  const normalizedKey = String(columnKey || "").trim().toLowerCase();
  if (!JOBS_COLUMN_KEYS.includes(normalizedKey)) return;

  const offset = Number(direction);
  if (!Number.isFinite(offset) || offset === 0) return;

  const current = getJobsVisibleColumns();
  const fromIndex = current.indexOf(normalizedKey);
  if (fromIndex < 0) return;

  const toIndex = fromIndex + (offset > 0 ? 1 : -1);
  if (toIndex < 0 || toIndex >= current.length) return;

  const reordered = [...current];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  setJobsVisibleColumns(reordered);
}

function moveJobsVisibleColumnByDrop(sourceKey, targetKey, position = "before") {
  const source = String(sourceKey || "").trim().toLowerCase();
  const target = String(targetKey || "").trim().toLowerCase();
  if (!JOBS_COLUMN_KEYS.includes(source) || !JOBS_COLUMN_KEYS.includes(target)) return;
  if (source === target) return;

  const current = getJobsVisibleColumns();
  const sourceIndex = current.indexOf(source);
  const targetIndex = current.indexOf(target);
  if (sourceIndex < 0 || targetIndex < 0) return;

  const reordered = [...current];
  reordered.splice(sourceIndex, 1);

  const adjustedTargetIndex = reordered.indexOf(target);
  const insertAt = position === "after" ? adjustedTargetIndex + 1 : adjustedTargetIndex;
  reordered.splice(insertAt, 0, source);

  setJobsVisibleColumns(reordered);
}

function clearJobsColumnsDropIndicators() {
  if (!els.jobsColumnsList) return;

  els.jobsColumnsList.querySelectorAll(".jobs-columns-row").forEach((row) => {
    row.classList.remove("is-drop-target", "is-drop-after", "is-dragging");
    row.removeAttribute("data-drop-position");
  });
}

function renderJobsColumnsMenu() {
  if (!els.jobsColumnsList) return;

  const columns = getJobsVisibleColumns();
  els.jobsColumnsList.innerHTML = "";

  columns.forEach((columnKey, index) => {
    const definition = JOBS_COLUMN_DEFINITIONS.find((entry) => entry.key === columnKey);
    if (!definition) return;

    const row = document.createElement("div");
    row.className = "jobs-columns-row";
    row.draggable = true;

    const left = document.createElement("label");
    left.className = "jobs-columns-toggle";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.addEventListener("change", () => {
      toggleJobsVisibleColumn(columnKey, checkbox.checked);
    });

    const text = document.createElement("span");
    text.textContent = definition.label;

    left.append(checkbox, text);

    const orderControls = document.createElement("div");
    orderControls.className = "jobs-columns-order";

    const dragHandle = document.createElement("span");
    dragHandle.className = "jobs-columns-drag-handle";
    dragHandle.textContent = "::";
    dragHandle.title = `Drag ${definition.label} to reorder`;

    const upButton = document.createElement("button");
    upButton.type = "button";
    upButton.className = "jobs-columns-order-btn";
    upButton.textContent = "^";
    upButton.title = `Move ${definition.label} up`;
    upButton.disabled = index === 0;
    upButton.addEventListener("click", () => {
      moveJobsVisibleColumn(columnKey, -1);
    });

    const downButton = document.createElement("button");
    downButton.type = "button";
    downButton.className = "jobs-columns-order-btn";
    downButton.textContent = "v";
    downButton.title = `Move ${definition.label} down`;
    downButton.disabled = index === columns.length - 1;
    downButton.addEventListener("click", () => {
      moveJobsVisibleColumn(columnKey, 1);
    });

    row.addEventListener("dragstart", (event) => {
      jobsColumnsDragKey = columnKey;
      clearJobsColumnsDropIndicators();
      row.classList.add("is-dragging");

      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        try {
          event.dataTransfer.setData("text/plain", columnKey);
        } catch {
          // Some browsers may block custom drag data in secure contexts.
        }
      }
    });

    row.addEventListener("dragover", (event) => {
      if (!jobsColumnsDragKey || jobsColumnsDragKey === columnKey) return;
      event.preventDefault();

      const rect = row.getBoundingClientRect();
      const isAfter = event.clientY > rect.top + rect.height / 2;

      clearJobsColumnsDropIndicators();
      row.classList.add("is-drop-target");
      row.classList.toggle("is-drop-after", isAfter);
      row.dataset.dropPosition = isAfter ? "after" : "before";

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    });

    row.addEventListener("drop", (event) => {
      event.preventDefault();

      const sourceFromTransfer = event.dataTransfer?.getData("text/plain") || "";
      const sourceKey = String(jobsColumnsDragKey || sourceFromTransfer || "").trim().toLowerCase();
      const targetKey = columnKey;
      const position = row.dataset.dropPosition === "after" ? "after" : "before";

      jobsColumnsDragKey = null;
      clearJobsColumnsDropIndicators();
      moveJobsVisibleColumnByDrop(sourceKey, targetKey, position);
    });

    row.addEventListener("dragend", () => {
      jobsColumnsDragKey = null;
      clearJobsColumnsDropIndicators();
    });

    orderControls.append(dragHandle, upButton, downButton);
    row.append(left, orderControls);
    els.jobsColumnsList.appendChild(row);
  });

  const hiddenColumns = JOBS_COLUMN_DEFINITIONS.filter((entry) => !columns.includes(entry.key));
  hiddenColumns.forEach((definition) => {
    const row = document.createElement("div");
    row.className = "jobs-columns-row is-hidden";

    const left = document.createElement("label");
    left.className = "jobs-columns-toggle";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = false;
    checkbox.addEventListener("change", () => {
      toggleJobsVisibleColumn(definition.key, checkbox.checked);
    });

    const text = document.createElement("span");
    text.textContent = definition.label;

    left.append(checkbox, text);
    row.append(left);
    els.jobsColumnsList.appendChild(row);
  });
}

function renderJobsBreadcrumbs() {
  if (!els.jobsBreadcrumbs) return;

  const breadcrumbs = [];
  const currentDirectory = normalizeJobsDirectory(state.jobs.currentDirectory);

  breadcrumbs.push({ label: "gcodes", path: "" });

  if (currentDirectory) {
    const parts = currentDirectory.split("/").filter(Boolean);
    let prefix = "";

    parts.forEach((part) => {
      prefix = prefix ? `${prefix}/${part}` : part;
      breadcrumbs.push({ label: part, path: prefix });
    });
  }

  els.jobsBreadcrumbs.innerHTML = "";

  breadcrumbs.forEach((crumb, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "jobs-breadcrumb-btn";
    button.textContent = crumb.label;
    button.disabled = crumb.path === currentDirectory;
    button.addEventListener("click", () => {
      setJobsDirectory(crumb.path);
    });
    els.jobsBreadcrumbs.appendChild(button);

    if (index < breadcrumbs.length - 1) {
      const separator = document.createElement("span");
      separator.className = "jobs-breadcrumb-sep";
      separator.textContent = "/";
      els.jobsBreadcrumbs.appendChild(separator);
    }
  });
}

function renderJobsJobControls() {
  const isConnected = state.connectionStatus === "connected";
  const busy = state.jobs.actionInFlight;
  const current = getCurrentJobsPrintState();
  const activeLabel = current.filename
    ? `${PRINTER_STATE_META[current.state]?.label || "Job"}: ${current.filename}`
    : "Printer is idle.";

  if (els.jobsActiveLabel) {
    els.jobsActiveLabel.textContent = activeLabel;
  }

  if (els.jobsPause) {
    els.jobsPause.disabled = !isConnected || busy || current.state !== "printing";
  }

  if (els.jobsResume) {
    els.jobsResume.disabled = !isConnected || busy || current.state !== "paused";
  }

  if (els.jobsCancel) {
    const cancellable = current.state === "printing" || current.state === "paused";
    els.jobsCancel.disabled = !isConnected || busy || !cancellable;
  }
}

function formatJobsLength(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "--";
  if (numeric >= 1000) return `${(numeric / 1000).toFixed(2)} m`;
  return `${numeric.toFixed(2)} mm`;
}

function formatJobsWeight(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "--";
  if (numeric >= 1000) return `${(numeric / 1000).toFixed(2)} kg`;
  return `${numeric.toFixed(2)} g`;
}

function formatJobsTemperature(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "--";
  return `${numeric.toFixed(1)}C`;
}

function buildJobsEntryMetaLine(fileEntry, metadata) {
  const parts = [];
  const columns = getJobsVisibleColumns();

  columns.forEach((columnKey) => {
    if (columnKey === "size") {
      parts.push(formatFileSize(fileEntry.size) || "--");
      return;
    }

    if (columnKey === "modified") {
      parts.push(`Modified: ${formatJobsTimestamp(fileEntry.modifiedMs)}`);
      return;
    }

    if (columnKey === "eta") {
      const etaSeconds = Number(metadata?.estimatedTime);
      const etaLabel = Number.isFinite(etaSeconds) && etaSeconds > 0 ? formatStatusDuration(etaSeconds) : "--";
      parts.push(`ETA: ${etaLabel}`);
      return;
    }

    if (columnKey === "total_layers") {
      const layers = Number(metadata?.totalLayers);
      const layerLabel = Number.isFinite(layers) && layers > 0 ? String(Math.round(layers)) : "--";
      parts.push(`Layers: ${layerLabel}`);
      return;
    }

    if (columnKey === "layer_height") {
      parts.push(`Layer H: ${formatJobsLength(metadata?.layerHeight)}`);
      return;
    }

    if (columnKey === "first_layer_height") {
      parts.push(`First Layer H: ${formatJobsLength(metadata?.firstLayerHeight)}`);
      return;
    }

    if (columnKey === "object_height") {
      parts.push(`Object H: ${formatJobsLength(metadata?.objectHeight)}`);
      return;
    }

    if (columnKey === "filament_length") {
      parts.push(`Filament: ${formatJobsLength(metadata?.filamentTotal)}`);
      return;
    }

    if (columnKey === "filament_weight") {
      parts.push(`Filament W: ${formatJobsWeight(metadata?.filamentWeightTotal)}`);
      return;
    }

    if (columnKey === "filament_type") {
      parts.push(`Filament Type: ${metadata?.filamentType || "--"}`);
      return;
    }

    if (columnKey === "filament_name") {
      parts.push(`Filament Name: ${metadata?.filamentName || "--"}`);
      return;
    }

    if (columnKey === "nozzle_diameter") {
      parts.push(`Nozzle: ${formatJobsLength(metadata?.nozzleDiameter)}`);
      return;
    }

    if (columnKey === "slicer") {
      parts.push(`Slicer: ${metadata?.slicerLabel || "--"}`);
      return;
    }

    if (columnKey === "first_layer_extruder_temp") {
      parts.push(`1st Nozzle: ${formatJobsTemperature(metadata?.firstLayerExtruderTemp)}`);
      return;
    }

    if (columnKey === "first_layer_bed_temp") {
      parts.push(`1st Bed: ${formatJobsTemperature(metadata?.firstLayerBedTemp)}`);
      return;
    }

    if (columnKey === "chamber_temp") {
      parts.push(`Chamber: ${formatJobsTemperature(metadata?.chamberTemp)}`);
    }
  });

  return parts.join(" | ");
}

function getJobsParentDirectory(path) {
  const normalized = normalizeJobsDirectory(path);
  if (!normalized) return "";
  const segments = normalized.split("/").filter(Boolean);
  segments.pop();
  return segments.join("/");
}

function formatJobsRootPath(path) {
  const normalized = normalizeJobsDirectory(path);
  return normalized ? `gcodes/${normalized}` : "gcodes/";
}

function renderJobsList() {
  if (!els.fileList) return;

  const isConnected = state.connectionStatus === "connected";
  const busy = state.jobs.isLoading || state.jobs.actionInFlight;
  const query = String(state.jobs.searchQuery || "").trim().toLowerCase();
  const typeFilter = normalizeJobsTypeFilter(state.jobs.typeFilter);
  const currentDirectory = normalizeJobsDirectory(state.jobs.currentDirectory);
  const parentDirectory = getJobsParentDirectory(currentDirectory);

  const { directories, files } = deriveJobsDirectoryEntries();

  const filteredDirectories = sortJobsDirectories(directories).filter((entry) => {
    if (typeFilter === "files") return false;
    if (!query) return true;
    return entry.displayName.toLowerCase().includes(query);
  });

  const filteredFiles = sortJobsFiles(files).filter((entry) => {
    if (typeFilter === "folders") return false;
    if (!query) return true;
    return entry.path.toLowerCase().includes(query);
  });

  const showParentEntry = !!currentDirectory && !query && typeFilter !== "files";

  els.fileList.innerHTML = "";

  if (!isConnected) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Print files are unavailable while disconnected.";
    els.fileList.appendChild(empty);
    return;
  }

  if (state.jobs.isLoading) {
    const loading = document.createElement("p");
    loading.className = "muted";
    loading.textContent = "Loading print files...";
    els.fileList.appendChild(loading);
    return;
  }

  if (!showParentEntry && !filteredDirectories.length && !filteredFiles.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = query
      ? `No files or folders match "${query}".`
      : "No print files found in this directory.";
    els.fileList.appendChild(empty);
    return;
  }

  if (showParentEntry) {
    const row = document.createElement("article");
    row.className = "jobs-entry jobs-entry-folder jobs-entry-parent";

    const body = document.createElement("div");
    body.className = "jobs-entry-body";

    const title = document.createElement("p");
    title.className = "jobs-entry-title";
    title.textContent = "..";

    const detail = document.createElement("p");
    detail.className = "jobs-entry-detail muted";
    detail.textContent = `Up to ${formatJobsRootPath(parentDirectory)}`;

    body.append(title, detail);

    const actions = document.createElement("div");
    actions.className = "jobs-entry-actions";

    const upButton = document.createElement("button");
    upButton.type = "button";
    upButton.className = "jobs-entry-btn";
    upButton.textContent = "^";
    upButton.disabled = busy;
    upButton.addEventListener("click", () => {
      setJobsDirectory(parentDirectory);
    });

    actions.append(upButton);
    row.append(body, actions);
    els.fileList.appendChild(row);
  }

  filteredDirectories.forEach((entry) => {
    const row = document.createElement("article");
    row.className = "jobs-entry jobs-entry-folder";

    const body = document.createElement("div");
    body.className = "jobs-entry-body";

    const title = document.createElement("p");
    title.className = "jobs-entry-title";
    title.textContent = entry.displayName;
    title.title = entry.path;

    const detail = document.createElement("p");
    detail.className = "jobs-entry-detail muted";
    const fileWord = entry.fileCount === 1 ? "file" : "files";
    const sizeLabel = formatFileSize(entry.size) || "--";
    const latest = entry.modifiedMs ? formatJobsTimestamp(entry.modifiedMs) : "--";
    detail.textContent = `${entry.fileCount} ${fileWord} | ${sizeLabel} | Latest: ${latest}`;

    body.append(title, detail);

    const actions = document.createElement("div");
    actions.className = "jobs-entry-actions";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "jobs-entry-btn";
    openButton.textContent = "Open";
    openButton.disabled = busy;
    openButton.addEventListener("click", () => {
      setJobsDirectory(entry.path);
    });

    const renameButton = document.createElement("button");
    renameButton.type = "button";
    renameButton.className = "jobs-entry-btn";
    renameButton.textContent = "Rename";
    renameButton.disabled = busy;
    renameButton.addEventListener("click", async () => {
      await requestJobsFolderRename(entry.path);
    });

    const moveButton = document.createElement("button");
    moveButton.type = "button";
    moveButton.className = "jobs-entry-btn";
    moveButton.textContent = "Move";
    moveButton.disabled = busy;
    moveButton.addEventListener("click", async () => {
      await requestJobsFolderMove(entry.path);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "jobs-entry-btn danger";
    deleteButton.textContent = "Delete";
    deleteButton.disabled = busy;
    deleteButton.addEventListener("click", async () => {
      await requestJobsFolderDelete(entry.path);
    });

    actions.append(openButton, renameButton, moveButton, deleteButton);
    row.append(body, actions);
    els.fileList.appendChild(row);
  });

  const currentPrintPath = normalizeGcodePath(getCurrentJobsPrintState().filename);

  filteredFiles.forEach((entry) => {
    const row = document.createElement("article");
    row.className = "jobs-entry jobs-entry-file";

    if (currentPrintPath && currentPrintPath === entry.path) {
      row.classList.add("is-active-job");
    }

    const thumbWrap = document.createElement("div");
    thumbWrap.className = "jobs-entry-thumb-wrap";

    const metadata = state.jobs.metadataByPath.get(entry.path);
    const thumbnailPath = metadata?.thumbnailPath || "";

    if (thumbnailPath) {
      const thumb = document.createElement("img");
      thumb.className = "jobs-entry-thumb";
      thumb.loading = "lazy";
      thumb.alt = `Thumbnail for ${entry.displayName}`;
      thumb.src = buildThumbnailUrl(thumbnailPath);
      thumb.addEventListener("error", () => {
        thumbWrap.classList.add("is-fallback");
        thumb.remove();
        thumbWrap.textContent = "G";
      });
      thumbWrap.appendChild(thumb);
    } else {
      thumbWrap.classList.add("is-fallback");
      thumbWrap.textContent = "G";
      if (!state.jobs.metadataLoading.has(entry.path)) {
        void ensureJobsMetadata(entry.path);
      }
    }

    const body = document.createElement("div");
    body.className = "jobs-entry-body";

    const title = document.createElement("p");
    title.className = "jobs-entry-title";
    title.textContent = entry.displayName;
    title.title = entry.path;

    const detail = document.createElement("p");
    detail.className = "jobs-entry-detail muted";
    detail.textContent = buildJobsEntryMetaLine(entry, metadata);

    body.append(title, detail);

    const actions = document.createElement("div");
    actions.className = "jobs-entry-actions";

    const printButton = document.createElement("button");
    printButton.type = "button";
    printButton.className = "jobs-entry-btn";
    printButton.textContent = state.jobs.actionInFlight && state.jobs.activePath === entry.path && state.jobs.actionLabel === "print"
      ? "Printing..."
      : "Print";
    printButton.disabled = busy;
    printButton.addEventListener("click", async () => {
      await requestJobsFilePrint(entry.path);
    });

    const renameButton = document.createElement("button");
    renameButton.type = "button";
    renameButton.className = "jobs-entry-btn";
    renameButton.textContent = "Rename";
    renameButton.disabled = busy;
    renameButton.addEventListener("click", async () => {
      await requestJobsFileRename(entry.path);
    });

    const moveButton = document.createElement("button");
    moveButton.type = "button";
    moveButton.className = "jobs-entry-btn";
    moveButton.textContent = "Move";
    moveButton.disabled = busy;
    moveButton.addEventListener("click", async () => {
      await requestJobsFileMove(entry.path);
    });

    const downloadButton = document.createElement("button");
    downloadButton.type = "button";
    downloadButton.className = "jobs-entry-btn";
    downloadButton.textContent = "Download";
    downloadButton.disabled = busy;
    downloadButton.addEventListener("click", async () => {
      await requestJobsFileDownload(entry.path);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "jobs-entry-btn danger";
    deleteButton.textContent = "Delete";
    deleteButton.disabled = busy;
    deleteButton.addEventListener("click", async () => {
      await requestJobsFileDelete(entry.path);
    });

    actions.append(printButton, renameButton, moveButton, downloadButton, deleteButton);
    row.append(thumbWrap, body, actions);
    els.fileList.appendChild(row);

    if (!metadata && !state.jobs.metadataLoading.has(entry.path)) {
      void ensureJobsMetadata(entry.path);
    }
  });
}
function renderJobsSummary() {
  if (!els.jobsSummary) return;

  const totalFiles = state.jobs.files.length;
  const totalFolders = state.jobs.directories.length;
  const totalSize = state.jobs.files.reduce((sum, entry) => sum + (Number(entry.size) || 0), 0);
  const directory = normalizeJobsDirectory(state.jobs.currentDirectory);
  const label = directory ? `gcodes/${directory}` : "gcodes/";
  const sizeLabel = totalSize > 0 ? ` | Total: ${formatFileSize(totalSize)}` : "";

  const fileLabel = `${totalFiles} print file${totalFiles === 1 ? "" : "s"}`;
  const folderLabel = `${totalFolders} folder${totalFolders === 1 ? "" : "s"}`;
  els.jobsSummary.textContent = `${fileLabel} | ${folderLabel} in ${label}${sizeLabel}`;
}

function renderJobsStatus() {
  if (!state.client) {
    setJobsStatusMessage("Connect to Moonraker to manage print files.", "warn");
    return;
  }

  if (state.connectionStatus !== "connected") {
    setJobsStatusMessage("Moonraker disconnected. Reconnect to manage print files.", "warn");
    return;
  }

  if (state.jobs.isLoading) {
    setJobsStatusMessage("Loading print files...", "info");
    return;
  }

  if (state.jobs.actionInFlight) {
    setJobsStatusMessage("Running print file action...", "warn");
    return;
  }

  if (state.jobs.lastError) {
    setJobsStatusMessage(`Print files action failed: ${state.jobs.lastError}`, "error");
    return;
  }

  if (state.jobs.lastUpdatedMs) {
    setJobsStatusMessage(`Last refreshed: ${new Date(state.jobs.lastUpdatedMs).toLocaleTimeString()}`, "info");
    return;
  }

  setJobsStatusMessage("Press Refresh to load print files.", "info");
}

function renderJobsCard() {
  if (els.jobsSearch && els.jobsSearch.value !== state.jobs.searchQuery) {
    els.jobsSearch.value = state.jobs.searchQuery;
  }

  if (els.jobsSort) {
    els.jobsSort.value = normalizeJobsSort(state.jobs.sortMode);
  }

  if (els.jobsTypeFilter) {
    els.jobsTypeFilter.value = normalizeJobsTypeFilter(state.jobs.typeFilter);
  }

  const isConnected = state.connectionStatus === "connected";
  const busy = state.jobs.isLoading || state.jobs.actionInFlight;

  if (els.jobsRefresh) {
    els.jobsRefresh.disabled = !isConnected || busy;
    els.jobsRefresh.classList.toggle("is-loading", state.jobs.isLoading);
    els.jobsRefresh.title = state.jobs.isLoading ? "Loading..." : "Refresh";
    els.jobsRefresh.setAttribute("aria-label", state.jobs.isLoading ? "Loading print files" : "Refresh file list");
  }

  if (els.jobsSortToggle) {
    els.jobsSortToggle.disabled = busy;
  }

  if (els.jobsColumnsToggle) {
    els.jobsColumnsToggle.disabled = busy;
  }

  if (els.jobsSearchToggle) {
    els.jobsSearchToggle.disabled = busy;
  }

  if (els.jobsFilterToggle) {
    els.jobsFilterToggle.disabled = busy;
  }

  if (els.jobsAddToggle) {
    els.jobsAddToggle.disabled = !isConnected || busy;
  }

  if (els.jobsUploadBtn) {
    els.jobsUploadBtn.disabled = !isConnected || busy;
  }

  if (els.jobsUploadFolderBtn) {
    els.jobsUploadFolderBtn.disabled = !isConnected || busy;
  }

  if (els.jobsUploadPrintBtn) {
    els.jobsUploadPrintBtn.disabled = !isConnected || busy;
  }

  if (els.jobsAddFileBtn) {
    els.jobsAddFileBtn.disabled = !isConnected || busy;
  }

  if (els.jobsNewFolder) {
    els.jobsNewFolder.disabled = !isConnected || busy;
  }

  if (els.jobsSearch) {
    els.jobsSearch.disabled = busy;
  }

  if (!isConnected || busy) {
    closeJobsToolbarMenus();
    state.jobs.uploadDragDepth = 0;
    updateJobsDragTarget(false);
  }

  renderJobsSummary();
  renderJobsPathDisplay();
  renderJobsColumnsMenu();
  renderJobsBreadcrumbs();
  renderJobsJobControls();
  renderJobsList();
  renderJobsStatus();
}

function renderFiles(files) {
  const listing = extractJobsListing(files);
  applyJobsListing(listing);
  renderJobsCard();
}

async function loadJobsFiles({ source = "user", silent = false } = {}) {
  if (!state.client || state.connectionStatus !== "connected") {
    renderJobsCard();
    return [];
  }

  if (state.jobs.isLoading) {
    return state.jobs.files || [];
  }

  state.jobs.isLoading = true;
  state.jobs.lastError = "";
  renderJobsCard();

  try {
    const response = await state.client.getGcodeFiles();
    const listing = extractJobsListing(response);

    applyJobsListing(listing);
    state.jobs.lastError = "";
    state.jobs.lastUpdatedMs = Date.now();
    persistJobsViewState();

    if (source === "user") {
      appendConsole(`Loaded ${listing.files.length} print file${listing.files.length === 1 ? "" : "s"}.`, "info");
    }

    renderJobsCard();
    return listing.files;
  } catch (error) {
    const message = error?.message || String(error);
    state.jobs.lastError = message;

    if (!silent) {
      appendConsole(`Print files load failed: ${message}`, "error");
    }

    renderJobsCard();
    return [];
  } finally {
    state.jobs.isLoading = false;
    renderJobsCard();
  }
}

async function requestJobsFileDownload(path) {
  const normalizedPath = normalizeGcodePath(path);
  if (!normalizedPath || !state.client || state.connectionStatus !== "connected") return false;

  state.jobs.actionInFlight = true;
  state.jobs.actionLabel = "download";
  state.jobs.activePath = normalizedPath;
  renderJobsCard();

  try {
    const fileBlob = await state.client.getFileBlob("gcodes", normalizedPath);
    const fileName = getGcodeDisplayName(normalizedPath) || "print.gcode";
    const url = URL.createObjectURL(fileBlob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
    state.jobs.lastError = "";
    appendConsole(`Downloaded print file: ${formatJobsRootPath(normalizedPath)}`, "info");
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.jobs.lastError = message;
    appendConsole(`Print file download failed (${normalizedPath}): ${message}`, "error");
    return false;
  } finally {
    state.jobs.actionInFlight = false;
    state.jobs.actionLabel = "";
    state.jobs.activePath = "";
    renderJobsCard();
  }
}

function normalizeJobsSimpleName(value) {
  const name = String(value || "").trim();
  if (!name) return "";
  if (name.includes("/") || name.includes("\\")) return "";
  return name;
}

function remapJobsCurrentDirectoryForMove(sourcePath, destinationPath) {
  const source = normalizeJobsDirectory(sourcePath);
  const destination = normalizeJobsDirectory(destinationPath);
  const current = normalizeJobsDirectory(state.jobs.currentDirectory);

  if (!source || !destination || !current) return;

  if (current === source) {
    state.jobs.currentDirectory = destination;
    persistJobsViewState();
    return;
  }

  if (current.startsWith(`${source}/`)) {
    const suffix = current.slice(source.length + 1);
    state.jobs.currentDirectory = suffix ? `${destination}/${suffix}` : destination;
    persistJobsViewState();
  }
}

async function requestJobsPathMove(sourcePath, destinationPath, { entryType = "file", mode = "move" } = {}) {
  const normalize = entryType === "directory" ? normalizeJobsDirectory : normalizeGcodePath;
  const source = normalize(sourcePath);
  const destination = normalize(destinationPath);

  if (!source || !destination || !state.client || state.connectionStatus !== "connected") return false;
  if (source === destination) return false;

  if (entryType === "directory" && destination.startsWith(`${source}/`)) {
    setJobsStatusMessage("Cannot move a folder into itself.", "warn");
    return false;
  }

  state.jobs.actionInFlight = true;
  state.jobs.actionLabel = mode;
  state.jobs.activePath = source;
  renderJobsCard();

  try {
    await state.client.moveFile("gcodes", source, destination);
    state.jobs.lastError = "";

    if (entryType === "directory") {
      remapJobsCurrentDirectoryForMove(source, destination);
    }

    const label = mode === "rename" ? "Renamed" : "Moved";
    const noun = entryType === "directory" ? "folder" : "print file";
    appendConsole(`${label} ${noun}: ${formatJobsRootPath(source)} -> ${formatJobsRootPath(destination)}`, "info");

    await loadJobsFiles({ source: mode, silent: true });
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.jobs.lastError = message;

    const noun = entryType === "directory" ? "Folder" : "Print file";
    const verb = mode === "rename" ? "rename" : "move";
    appendConsole(`${noun} ${verb} failed (${source}): ${message}`, "error");
    renderJobsCard();
    return false;
  } finally {
    state.jobs.actionInFlight = false;
    state.jobs.actionLabel = "";
    state.jobs.activePath = "";
    renderJobsCard();
  }
}

async function requestJobsFileRename(path) {
  const normalizedPath = normalizeGcodePath(path);
  if (!normalizedPath) return false;

  const currentName = getGcodeDisplayName(normalizedPath) || "";
  const requested = window.prompt("Rename print file to:", currentName);
  if (requested === null) return false;

  const nextName = normalizeJobsSimpleName(requested);
  if (!nextName) {
    setJobsStatusMessage("Enter a valid file name.", "warn");
    return false;
  }

  const directory = getGcodeDirectory(normalizedPath);
  const destination = directory ? `${directory}/${nextName}` : nextName;
  return requestJobsPathMove(normalizedPath, destination, { entryType: "file", mode: "rename" });
}

async function requestJobsFileMove(path) {
  const normalizedPath = normalizeGcodePath(path);
  if (!normalizedPath) return false;

  const filename = getGcodeDisplayName(normalizedPath);
  if (!filename) return false;

  const currentDirectory = getGcodeDirectory(normalizedPath);
  const requested = window.prompt(
    "Move print file to folder (relative to gcodes root):",
    currentDirectory
  );
  if (requested === null) return false;

  const targetDirectory = normalizeJobsDirectory(requested);
  const destination = targetDirectory ? `${targetDirectory}/${filename}` : filename;
  return requestJobsPathMove(normalizedPath, destination, { entryType: "file", mode: "move" });
}

async function requestJobsFolderRename(path) {
  const normalizedPath = normalizeJobsDirectory(path);
  if (!normalizedPath) return false;

  const currentName = getGcodeDisplayName(normalizedPath) || "";
  const requested = window.prompt("Rename folder to:", currentName);
  if (requested === null) return false;

  const nextName = normalizeJobsSimpleName(requested);
  if (!nextName) {
    setJobsStatusMessage("Enter a valid folder name.", "warn");
    return false;
  }

  const parent = getJobsParentDirectory(normalizedPath);
  const destination = parent ? `${parent}/${nextName}` : nextName;
  return requestJobsPathMove(normalizedPath, destination, { entryType: "directory", mode: "rename" });
}

async function requestJobsFolderMove(path) {
  const normalizedPath = normalizeJobsDirectory(path);
  if (!normalizedPath) return false;

  const folderName = getGcodeDisplayName(normalizedPath);
  if (!folderName) return false;

  const currentParent = getJobsParentDirectory(normalizedPath);
  const requested = window.prompt(
    "Move folder to destination parent (relative to gcodes root):",
    currentParent
  );
  if (requested === null) return false;

  const targetParent = normalizeJobsDirectory(requested);
  const destination = targetParent ? `${targetParent}/${folderName}` : folderName;
  return requestJobsPathMove(normalizedPath, destination, { entryType: "directory", mode: "move" });
}

async function requestJobsFileDelete(path) {
  const normalizedPath = normalizeGcodePath(path);
  if (!normalizedPath || !state.client || state.connectionStatus !== "connected") return false;

  const confirmed = window.confirm(`Delete print file ${formatJobsRootPath(normalizedPath)}? This cannot be undone.`);
  if (!confirmed) return false;

  state.jobs.actionInFlight = true;
  state.jobs.actionLabel = "delete";
  state.jobs.activePath = normalizedPath;
  renderJobsCard();

  try {
    await state.client.deleteFile("gcodes", normalizedPath);
    state.jobs.lastError = "";
    appendConsole(`Deleted print file: ${formatJobsRootPath(normalizedPath)}`, "warn");
    await loadJobsFiles({ source: "delete", silent: true });
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.jobs.lastError = message;
    appendConsole(`Print file delete failed (${normalizedPath}): ${message}`, "error");
    renderJobsCard();
    return false;
  } finally {
    state.jobs.actionInFlight = false;
    state.jobs.actionLabel = "";
    state.jobs.activePath = "";
    renderJobsCard();
  }
}

async function requestJobsFolderDelete(path) {
  const normalizedPath = normalizeJobsDirectory(path);
  if (!normalizedPath || !state.client || state.connectionStatus !== "connected") return false;

  const confirmed = window.confirm(`Delete folder ${formatJobsRootPath(normalizedPath)} and its contents? This cannot be undone.`);
  if (!confirmed) return false;

  state.jobs.actionInFlight = true;
  state.jobs.actionLabel = "delete";
  state.jobs.activePath = normalizedPath;
  renderJobsCard();

  try {
    await state.client.deleteDirectory("gcodes", normalizedPath, { force: true });

    const currentDirectory = normalizeJobsDirectory(state.jobs.currentDirectory);
    if (currentDirectory === normalizedPath || currentDirectory.startsWith(`${normalizedPath}/`)) {
      state.jobs.currentDirectory = getJobsParentDirectory(normalizedPath);
      persistJobsViewState();
    }

    state.jobs.lastError = "";
    appendConsole(`Deleted folder: ${formatJobsRootPath(normalizedPath)}`, "warn");
    await loadJobsFiles({ source: "delete", silent: true });
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.jobs.lastError = message;
    appendConsole(`Folder delete failed (${normalizedPath}): ${message}`, "error");
    renderJobsCard();
    return false;
  } finally {
    state.jobs.actionInFlight = false;
    state.jobs.actionLabel = "";
    state.jobs.activePath = "";
    renderJobsCard();
  }
}

async function requestJobsFilePrint(path) {
  const normalizedPath = normalizeGcodePath(path);
  if (!normalizedPath || !state.client || state.connectionStatus !== "connected") return false;

  const current = getCurrentJobsPrintState();
  const hasActiveJob = current.state === "printing" || current.state === "paused";

  if (hasActiveJob) {
    const confirmedReplace = window.confirm(
      `A job is currently ${current.state}. Start ${formatJobsRootPath(normalizedPath)} anyway?`
    );
    if (!confirmedReplace) return false;
  }

  state.jobs.actionInFlight = true;
  state.jobs.actionLabel = "print";
  state.jobs.activePath = normalizedPath;
  renderJobsCard();

  try {
    await state.client.startPrint(normalizedPath);
    state.jobs.lastError = "";
    appendConsole(`Started print: ${formatJobsRootPath(normalizedPath)}`, "info");
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.jobs.lastError = message;
    appendConsole(`Start print failed (${normalizedPath}): ${message}`, "error");
    return false;
  } finally {
    state.jobs.actionInFlight = false;
    state.jobs.actionLabel = "";
    state.jobs.activePath = "";
    renderJobsCard();
  }
}

function normalizeJobsUploadRelativePath(file) {
  const candidate = String(file?.webkitRelativePath || file?.name || "").trim();
  return candidate
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");
}

function splitJobsUploadPath(path) {
  const normalized = normalizeJobsDirectory(path);
  if (!normalized) {
    return { directory: "", filename: "" };
  }

  const segments = normalized.split("/").filter(Boolean);
  const filename = segments.pop() || "";
  const directory = segments.join("/");
  return { directory, filename };
}

function isJobsDirectoryAlreadyExistsError(error) {
  const message = String(error?.message || "").toLowerCase();
  const status = Number(error?.status);
  return message.includes("exist") || message.includes("already") || status === 409;
}

async function ensureJobsUploadDirectory(directoryPath) {
  const normalizedDirectory = normalizeJobsDirectory(directoryPath);
  if (!normalizedDirectory || !state.client) return;

  const segments = normalizedDirectory.split("/").filter(Boolean);
  let cursor = "";

  for (const segment of segments) {
    cursor = cursor ? `${cursor}/${segment}` : segment;

    try {
      await state.client.createDirectory("gcodes", cursor);
    } catch (error) {
      if (!isJobsDirectoryAlreadyExistsError(error)) {
        throw error;
      }
    }
  }
}

async function uploadJobsFileToDirectory(file, directoryPath, filename) {
  const directory = normalizeJobsDirectory(directoryPath);
  const safeFilename = String(filename || "").trim();
  if (!safeFilename) {
    throw new Error("A valid file name is required for upload.");
  }

  if (directory) {
    await ensureJobsUploadDirectory(directory);
  }

  await state.client.uploadFile("gcodes", file, directory, safeFilename);
  return directory ? `${directory}/${safeFilename}` : safeFilename;
}

async function requestJobsUpload(files, { preserveRelativePaths = false, printAfterUpload = false, mode = "upload" } = {}) {
  if (!state.client || state.connectionStatus !== "connected") return false;

  const fileList = Array.isArray(files) ? files : [...(files || [])];
  if (!fileList.length) return false;

  state.jobs.actionInFlight = true;
  state.jobs.actionLabel = String(mode || "upload").trim() || "upload";
  state.jobs.activePath = "";
  renderJobsCard();

  let uploaded = 0;
  const uploadedPaths = [];

  try {
    const currentDirectory = normalizeJobsDirectory(state.jobs.currentDirectory);

    for (const file of fileList) {
      const relativePath = preserveRelativePaths
        ? normalizeJobsUploadRelativePath(file)
        : normalizeJobsDirectory(file?.name || "");

      const { directory, filename } = splitJobsUploadPath(relativePath);
      if (!filename) continue;

      const targetDirectory = preserveRelativePaths
        ? normalizeJobsDirectory([currentDirectory, directory].filter(Boolean).join("/"))
        : currentDirectory;

      const uploadedPath = await uploadJobsFileToDirectory(file, targetDirectory, filename);
      uploadedPaths.push(uploadedPath);
      uploaded += 1;
    }

    if (!uploaded) {
      throw new Error("No valid files were selected for upload.");
    }

    state.jobs.lastError = "";
    appendConsole(`Uploaded ${uploaded} print file${uploaded === 1 ? "" : "s"}.`, "info");
    await loadJobsFiles({ source: "upload", silent: true });

    if (printAfterUpload && uploadedPaths.length) {
      await requestJobsFilePrint(uploadedPaths[0]);
    }

    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.jobs.lastError = message;
    appendConsole(`Print file upload failed: ${message}`, "error");
    renderJobsCard();
    return false;
  } finally {
    state.jobs.actionInFlight = false;
    state.jobs.actionLabel = "";
    state.jobs.activePath = "";
    state.jobs.uploadDragDepth = 0;
    els.jobsCard?.classList.remove("is-drag-over");
    renderJobsCard();
  }
}

async function requestJobsCreateFolder() {
  if (!state.client || state.connectionStatus !== "connected") return false;

  const targetDefault = "new-folder";
  const requested = window.prompt("Enter the new folder name (relative to current directory):", targetDefault);
  if (requested === null) return false;

  const normalizedName = normalizeJobsDirectory(requested);
  if (!normalizedName) {
    setJobsStatusMessage("Enter a valid folder name.", "warn");
    return false;
  }

  const currentDirectory = normalizeJobsDirectory(state.jobs.currentDirectory);
  const fullPath = currentDirectory ? `${currentDirectory}/${normalizedName}` : normalizedName;

  state.jobs.actionInFlight = true;
  state.jobs.actionLabel = "mkdir";
  state.jobs.activePath = fullPath;
  renderJobsCard();

  try {
    await state.client.createDirectory("gcodes", fullPath);
    state.jobs.lastError = "";
    appendConsole(`Created folder: ${formatJobsRootPath(fullPath)}`, "info");
    state.jobs.currentDirectory = normalizeJobsDirectory(fullPath);
    persistJobsViewState();
    await loadJobsFiles({ source: "mkdir", silent: true });
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.jobs.lastError = message;
    appendConsole(`Create folder failed (${fullPath}): ${message}`, "error");
    renderJobsCard();
    return false;
  } finally {
    state.jobs.actionInFlight = false;
    state.jobs.actionLabel = "";
    state.jobs.activePath = "";
    renderJobsCard();
  }
}

function jobsDataTransferHasFiles(dataTransfer) {
  if (!dataTransfer) return false;
  const types = Array.from(dataTransfer.types || []);
  return types.includes("Files");
}

function updateJobsDragTarget(active) {
  if (!els.jobsCard) return;
  els.jobsCard.classList.toggle("is-drag-over", !!active);
}

async function handleJobsDropUpload(event) {
  if (!state.client || state.connectionStatus !== "connected") return;

  if (!jobsDataTransferHasFiles(event.dataTransfer)) {
    return;
  }

  event.preventDefault();
  state.jobs.uploadDragDepth = 0;
  updateJobsDragTarget(false);

  const files = [...(event.dataTransfer?.files || [])];
  if (!files.length) return;

  await requestJobsUpload(files, { mode: "drop-upload" });
}
async function requestJobsPrintAction(action) {
  if (!state.client || state.connectionStatus !== "connected") return false;

  const normalizedAction = String(action || "").trim().toLowerCase();
  if (!["pause", "resume", "cancel"].includes(normalizedAction)) return false;

  const label = normalizedAction === "cancel" ? "cancel" : normalizedAction;

  state.jobs.actionInFlight = true;
  state.jobs.actionLabel = label;
  state.jobs.activePath = "";
  renderJobsCard();

  try {
    if (normalizedAction === "pause") {
      await state.client.pausePrint();
    } else if (normalizedAction === "resume") {
      await state.client.resumePrint();
    } else {
      const confirmed = window.confirm("Cancel the active print job?");
      if (!confirmed) return false;
      await state.client.cancelPrint();
    }

    state.jobs.lastError = "";
    appendConsole(`Job action sent: ${normalizedAction.toUpperCase()}`, "info");
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.jobs.lastError = message;
    appendConsole(`Job action failed (${normalizedAction}): ${message}`, "error");
    return false;
  } finally {
    state.jobs.actionInFlight = false;
    state.jobs.actionLabel = "";
    state.jobs.activePath = "";
    renderJobsCard();
  }
}

function resetJobsState() {
  state.jobs = createDefaultJobsState();
  renderJobsCard();
}

function normalizeConfigPath(path) {
  return String(path || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^config\//i, "");
}

function getConfigDirectory(path) {
  const normalized = normalizeConfigPath(path);
  if (!normalized) return "";

  const parts = normalized.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
}

function getConfigFileDisplayName(entry) {
  const relative = String(entry?.relativePath || entry?.path || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/+$/, "");
  if (!relative) return "";

  const segments = relative.split("/").filter(Boolean);
  return segments.length ? segments[segments.length - 1] : relative;
}
function formatFileSize(size) {
  const numeric = Number(size);
  if (!Number.isFinite(numeric) || numeric < 0) return "";
  if (numeric < 1024) return `${numeric} B`;
  if (numeric < 1024 * 1024) return `${Math.round(numeric / 1024)} KB`;
  return `${(numeric / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeConfigFileType(type) {
  const normalized = String(type || "").toLowerCase().trim();

  switch (normalized) {
    case CONFIG_FILE_TYPES.EXAMPLE:
    case CONFIG_FILE_TYPES.LOG:
    case CONFIG_FILE_TYPES.BACKUP:
    case CONFIG_FILE_TYPES.CONFIG:
    case CONFIG_FILE_TYPES.DOC:
      return normalized;
    default:
      return CONFIG_FILE_TYPES.ALL;
  }
}

function getConfigFileType(path, rootName = "") {
  const normalized = String(path || "").toLowerCase();
  const normalizedRoot = String(rootName || "").toLowerCase().trim();
  if (!normalized) return null;

  if (normalizedRoot.includes("example")) return CONFIG_FILE_TYPES.EXAMPLE;
  if (normalized.includes("example")) return CONFIG_FILE_TYPES.EXAMPLE;

  const isDocsImageOrPrintContent =
    normalizedRoot === "docs" &&
    (
      normalized.startsWith("img/") ||
      normalized.startsWith("prints/") ||
      normalized.startsWith("_klipper3d/") ||
      normalized.startsWith("_kliper3d/")
    );

  if (isDocsImageOrPrintContent) {
    return CONFIG_FILE_TYPES.DOC;
  }

  const filename = normalized.split("/").pop() || normalized;
  const isKlipperBackup = /^printer-\d{8}_\d{6}\.cfg$/i.test(filename);
  const isCrowsnestBackup = /^crowsnest\.conf\.\d{4}-\d{2}-\d{2}-\d{4}$/i.test(filename);

  if (isKlipperBackup || isCrowsnestBackup || /\.bak(?:$|[._-]|\d)/i.test(normalized) || /\.bkp(?:$|[._-]|\d)/i.test(normalized)) {
    return CONFIG_FILE_TYPES.BACKUP;
  }

  if (/\.log(?:$|[._-]|\d)/i.test(normalized)) {
    return CONFIG_FILE_TYPES.LOG;
  }

  if (/\.(conf|cfg|config)$/i.test(normalized)) {
    return CONFIG_FILE_TYPES.CONFIG;
  }

  if (/\.(doc|md|txt)$/i.test(normalized)) {
    return CONFIG_FILE_TYPES.DOC;
  }

  return null;
}

function normalizeRootRelativePath(path, rootName) {
  const normalized = String(path || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  const root = String(rootName || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  if (!root) return normalized;

  const prefix = `${root}/`;
  if (normalized.toLowerCase().startsWith(prefix.toLowerCase())) {
    return normalized.slice(prefix.length);
  }

  return normalized;
}

function buildConfigEntryPath(rootName, relativePath) {
  const root = String(rootName || "").trim();
  const relative = normalizeRootRelativePath(relativePath, rootName);
  if (!root || !relative) return "";
  return `${root}/${relative}`;
}

function getConfigFileEntry(path) {
  const normalizedPath = String(path || "").trim();
  if (!normalizedPath) return null;

  return state.config.files.find((entry) => entry.path === normalizedPath) || null;
}

function escapeConfigSearchPattern(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function syncConfigSearchToggleUi(button, isActive) {
  if (!button) return;
  button.classList.toggle("is-active", !!isActive);
  button.setAttribute("aria-pressed", String(!!isActive));
}

function renderConfigSearchUi() {
  const hasSelection = !!state.config.selectedPath;
  const hasMatches = state.configSearch.matches.length > 0 && !state.configSearch.invalidRegex;

  if (els.configSearchInput) {
    els.configSearchInput.disabled = !hasSelection;
  }

  [els.configSearchPrev, els.configSearchNext].forEach((button) => {
    if (!button) return;
    button.disabled = !hasSelection || !hasMatches;
  });

  [els.configSearchCase, els.configSearchWord, els.configSearchRegex].forEach((button) => {
    if (!button) return;
    button.disabled = !hasSelection;
  });

  syncConfigSearchToggleUi(els.configSearchCase, state.configSearch.caseSensitive);
  syncConfigSearchToggleUi(els.configSearchWord, state.configSearch.wholeWord);
  syncConfigSearchToggleUi(els.configSearchRegex, state.configSearch.useRegex);

  if (!els.configSearchCount) return;

  if (!hasSelection) {
    els.configSearchCount.textContent = "0/0";
    return;
  }

  if (state.configSearch.invalidRegex) {
    els.configSearchCount.textContent = "Invalid";
    return;
  }

  const total = state.configSearch.matches.length;
  const current = state.configSearch.activeIndex;
  els.configSearchCount.textContent = total > 0 && current >= 0
    ? `${current + 1}/${total}`
    : `0/${total}`;
}

function clearConfigSearch({ clearQuery = false } = {}) {
  if (clearQuery && els.configSearchInput) {
    els.configSearchInput.value = "";
  }

  if (clearQuery) {
    state.configSearch.query = "";
  }

  state.configSearch.matches = [];
  state.configSearch.activeIndex = -1;
  state.configSearch.invalidRegex = false;
  renderConfigSearchUi();
}

function buildConfigSearchRegex() {
  if (!state.configSearch.query) return null;

  const basePattern = state.configSearch.useRegex
    ? state.configSearch.query
    : escapeConfigSearchPattern(state.configSearch.query);

  const pattern = state.configSearch.wholeWord ? `\\b${basePattern}\\b` : basePattern;
  const flags = state.configSearch.caseSensitive ? "g" : "gi";

  try {
    return new RegExp(pattern, flags);
  } catch {
    state.configSearch.invalidRegex = true;
    return null;
  }
}

function computeConfigSearchMatches(content, regex) {
  const matches = [];
  let guard = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (guard > 20000) break;
    guard += 1;

    const value = String(match[0] || "");
    if (!value.length) {
      regex.lastIndex += 1;
      continue;
    }

    matches.push({
      start: match.index,
      end: match.index + value.length,
    });
  }

  return matches;
}

function focusActiveConfigSearchMatch() {
  const editor = els.configEditor;
  if (!editor || editor.disabled) return;

  const active = state.configSearch.matches[state.configSearch.activeIndex];
  if (!active) return;

  editor.focus();
  editor.setSelectionRange(active.start, active.end, "forward");
}

function refreshConfigSearchMatches({ preserveActive = false, focusActive = false } = {}) {
  const editor = els.configEditor;
  const hasSelection = !!state.config.selectedPath;
  const rawQuery = String(els.configSearchInput?.value || "").trim();

  state.configSearch.query = rawQuery;
  state.configSearch.invalidRegex = false;

  if (!hasSelection || !editor || !rawQuery) {
    state.configSearch.matches = [];
    state.configSearch.activeIndex = -1;
    renderConfigSearchUi();
    return;
  }

  const previousMatch = preserveActive && state.configSearch.activeIndex >= 0
    ? state.configSearch.matches[state.configSearch.activeIndex]
    : null;

  const regex = buildConfigSearchRegex();
  if (!regex) {
    state.configSearch.matches = [];
    state.configSearch.activeIndex = -1;
    renderConfigSearchUi();
    return;
  }

  const matches = computeConfigSearchMatches(editor.value || "", regex);
  state.configSearch.matches = matches;

  if (!matches.length) {
    state.configSearch.activeIndex = -1;
    renderConfigSearchUi();
    return;
  }

  if (previousMatch) {
    const previousIndex = matches.findIndex((entry) => entry.start === previousMatch.start && entry.end === previousMatch.end);
    state.configSearch.activeIndex = previousIndex >= 0 ? previousIndex : 0;
  } else {
    const cursor = Number(editor.selectionStart);
    const initialIndex = matches.findIndex((entry) => entry.start >= cursor);
    state.configSearch.activeIndex = initialIndex >= 0 ? initialIndex : 0;
  }

  renderConfigSearchUi();

  if (focusActive) {
    focusActiveConfigSearchMatch();
  }
}

function navigateConfigSearch(direction = 1) {
  const hasSelection = !!state.config.selectedPath;
  if (!hasSelection) return;

  if (!state.configSearch.matches.length || state.configSearch.invalidRegex) {
    refreshConfigSearchMatches({ preserveActive: false, focusActive: true });
    return;
  }

  const total = state.configSearch.matches.length;
  const nextIndex = state.configSearch.activeIndex < 0
    ? 0
    : (state.configSearch.activeIndex + direction + total) % total;

  state.configSearch.activeIndex = nextIndex;
  renderConfigSearchUi();
  focusActiveConfigSearchMatch();
}

function setConfigSearchMode(modeKey, value) {
  state.configSearch[modeKey] = !!value;
  renderConfigSearchUi();
  refreshConfigSearchMatches({ preserveActive: false, focusActive: false });
}

function focusConfigSearchInput() {
  if (!els.configSearchInput || els.configSearchInput.disabled) return;
  els.configSearchInput.focus();
  els.configSearchInput.select();
}

function setConfigStatus(message, level = "info") {
  if (!els.configStatus) return;
  els.configStatus.textContent = message;
  els.configStatus.dataset.level = level;
}

function setConfigDirtyState(isDirty) {
  const selectedEntry = getConfigFileEntry(state.config.selectedPath);
  const hasActualChanges = state.config.draftContent !== state.config.originalContent;
  const isEditableConfigFile = selectedEntry?.root === "config";

  state.config.isDirty = !!isDirty && hasActualChanges && isEditableConfigFile;

  if (els.configDirtyPrompt) {
    els.configDirtyPrompt.hidden = !state.config.isDirty;
  }
}

function syncConfigSelectionUi() {
  const selectedEntry = getConfigFileEntry(state.config.selectedPath);
  const hasSelection = !!selectedEntry;
  const selectedPath = hasSelection ? selectedEntry.path : "";

  if (els.configCurrentFile) {
    els.configCurrentFile.textContent = selectedPath || "No file selected";
  }

  if (els.configDownload) {
    els.configDownload.hidden = !hasSelection;
    els.configDownload.disabled = !hasSelection;
  }

  if (els.configDelete) {
    els.configDelete.hidden = !hasSelection;
    els.configDelete.disabled = !hasSelection;
  }

  if (!hasSelection && els.configEditor) {
    els.configEditor.value = "";
    els.configEditor.disabled = true;
  }

  setConfigDirtyState(state.config.isDirty);

  if (!hasSelection) {
    clearConfigSearch({ clearQuery: true });
  } else {
    refreshConfigSearchMatches({ preserveActive: false, focusActive: false });
  }
}

function applyConfigFilter() {
  const selectedType = normalizeConfigFileType(state.config.fileTypeFilter);
  const rawSearchQuery = String(state.config.fileSearchQuery || "").trim();
  const searchTokens = rawSearchQuery.toLowerCase().split(/\s+/).filter(Boolean);

  state.config.fileTypeFilter = selectedType;
  state.config.fileSearchQuery = rawSearchQuery;

  if (els.configFileSearch && els.configFileSearch.value !== rawSearchQuery) {
    els.configFileSearch.value = rawSearchQuery;
  }

  persistConfigViewState();

  state.config.filteredFiles = state.config.files.filter((entry) => {
    if (selectedType !== CONFIG_FILE_TYPES.ALL && entry.fileType !== selectedType) {
      return false;
    }

    if (!searchTokens.length) {
      return true;
    }

    const haystack = `${entry.path} ${entry.relativePath}`.toLowerCase();
    return searchTokens.every((token) => haystack.includes(token));
  });

  renderConfigFileList();
}

function renderConfigFileList() {
  if (!els.configFileList) return;

  els.configFileList.innerHTML = "";

  if (!state.config.filteredFiles.length) {
    const empty = document.createElement("p");
    empty.className = "muted";

    const selectedType = normalizeConfigFileType(state.config.fileTypeFilter);
    const searchQuery = String(state.config.fileSearchQuery || "").trim();

    if (!state.config.files.length) {
      empty.textContent = "No supported files found (.conf, .cfg, .config, .log, .bak, .bkp, .doc, .md, .txt).";
    } else if (searchQuery) {
      if (selectedType === CONFIG_FILE_TYPES.ALL) {
        empty.textContent = `No files match "${searchQuery}".`;
      } else {
        const label = CONFIG_FILE_TYPE_LABELS[selectedType] || "files";
        empty.textContent = `No ${label.toLowerCase()} match "${searchQuery}".`;
      }
    } else if (selectedType === CONFIG_FILE_TYPES.ALL) {
      empty.textContent = "No files found for the selected filters.";
    } else {
      const label = CONFIG_FILE_TYPE_LABELS[selectedType] || "files";
      empty.textContent = `No ${label.toLowerCase()} found.`;
    }

    els.configFileList.appendChild(empty);
    return;
  }

  let lastFileType = "";

  state.config.filteredFiles.forEach((entry) => {
    if (entry.fileType !== lastFileType) {
      const groupLabel = document.createElement("p");
      groupLabel.className = "config-file-group muted";
      groupLabel.textContent = CONFIG_FILE_TYPE_LABELS[entry.fileType] || "Files";
      els.configFileList.appendChild(groupLabel);
      lastFileType = entry.fileType;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "config-file-item";
    button.classList.toggle("active", entry.path === state.config.selectedPath);
    button.title = entry.path;

    const label = document.createElement("span");
    label.className = "config-file-path";
    label.textContent = getConfigFileDisplayName(entry);

    const sizeLabel = document.createElement("span");
    sizeLabel.className = "config-file-size muted";
    sizeLabel.textContent = formatFileSize(entry.size);

    button.append(label, sizeLabel);
    button.addEventListener("click", async () => {
      await requestConfigFileOpen(entry.path);
    });

    els.configFileList.appendChild(button);
  });
}

function extractConfigFiles(fileResponse, rootName = "config") {
  const result = fileResponse?.result;
  const rawFiles = Array.isArray(result)
    ? result
    : Array.isArray(result?.files)
      ? result.files
      : [];

  const byPath = new Map();

  rawFiles.forEach((entry) => {
    if (!entry) return;

    if (typeof entry === "object" && String(entry.type || "").toLowerCase() === "directory") {
      return;
    }

    const candidatePath = typeof entry === "string"
      ? entry
      : typeof entry.path === "string"
        ? entry.path
        : [entry.dirname, entry.filename].filter(Boolean).join("/");

    const relativePath = normalizeRootRelativePath(candidatePath, rootName);
    if (!relativePath || relativePath.endsWith("/")) return;

    const fileType = getConfigFileType(relativePath, rootName);
    if (!fileType) return;

    const entryPath = buildConfigEntryPath(rootName, relativePath);
    if (!entryPath) return;

    const sizeValue = Number(entry?.size);
    const size = Number.isFinite(sizeValue) && sizeValue >= 0 ? sizeValue : null;

    if (!byPath.has(entryPath)) {
      byPath.set(entryPath, {
        path: entryPath,
        root: rootName,
        relativePath,
        size,
        fileType,
      });
    }
  });

  return [...byPath.values()].sort((a, b) => {
    const aRank = CONFIG_FILE_TYPE_RANK[a.fileType] ?? Number.MAX_SAFE_INTEGER;
    const bRank = CONFIG_FILE_TYPE_RANK[b.fileType] ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    const aName = getConfigFileDisplayName(a).toLowerCase();
    const bName = getConfigFileDisplayName(b).toLowerCase();
    if (aName !== bName) return aName.localeCompare(bName);
    return a.path.localeCompare(b.path);
  });
}

async function resolveConfigRoots() {
  if (!state.client) {
    return [...CONFIG_FILE_FALLBACK_ROOTS];
  }

  try {
    const infoResponse = await state.client.getServerInfo();
    const payload = infoResponse?.result || {};
    const registered = Array.isArray(payload.registered_directories) ? payload.registered_directories : [];

    const roots = registered
      .map((entry) => String(entry || "").trim())
      .filter(Boolean)
      .filter((rootName) => !CONFIG_FILE_HIDDEN_ROOTS.has(rootName));

    const uniqueRoots = [...new Set(roots)];
    CONFIG_FILE_FALLBACK_ROOTS.forEach((rootName) => {
      if (!uniqueRoots.includes(rootName)) {
        uniqueRoots.push(rootName);
      }
    });

    return uniqueRoots;
  } catch (error) {
    log.debug("Config root discovery failed; using fallback roots.", {
      error: error?.message || String(error),
    });
    return [...CONFIG_FILE_FALLBACK_ROOTS];
  }
}
async function loadConfigFiles({ preserveSelection = true } = {}) {
  if (!state.client) {
    setConfigStatus("Connect to Moonraker from Settings to manage configuration files.", "warn");
    return [];
  }

  if (state.activeView === "configuration" && els.configFileList) {
    els.configFileList.innerHTML = '<p class="muted">Loading configuration files...</p>';
  }

  try {
    const roots = await resolveConfigRoots();
    const rootResponses = await Promise.allSettled(
      roots.map((rootName) => state.client.getFilesByRoot(rootName))
    );

    const files = rootResponses.flatMap((response, index) => {
      if (response.status !== "fulfilled") return [];
      return extractConfigFiles(response.value, roots[index]);
    });

    files.sort((a, b) => {
      const aRank = CONFIG_FILE_TYPE_RANK[a.fileType] ?? Number.MAX_SAFE_INTEGER;
      const bRank = CONFIG_FILE_TYPE_RANK[b.fileType] ?? Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) return aRank - bRank;
      const aName = getConfigFileDisplayName(a).toLowerCase();
      const bName = getConfigFileDisplayName(b).toLowerCase();
      if (aName !== bName) return aName.localeCompare(bName);
      return a.path.localeCompare(b.path);
    });

    state.config.files = files;

    if (preserveSelection && state.config.selectedPath) {
      const selectionStillExists = files.some((entry) => entry.path === state.config.selectedPath);
      if (!selectionStillExists) {
        state.config.selectedPath = "";
        state.config.originalContent = "";
        state.config.draftContent = "";
        setConfigDirtyState(false);
        persistConfigViewState();
      }
    }

    applyConfigFilter();
    syncConfigSelectionUi();

    if (
      preserveSelection &&
      state.activeView === "configuration" &&
      state.config.selectedPath &&
      !state.config.originalContent &&
      !state.config.draftContent
    ) {
      await loadConfigFile(state.config.selectedPath);
    }

    setConfigStatus(`Loaded ${files.length} supported file${files.length === 1 ? "" : "s"}.`);
    return files;
  } catch (error) {
    const message = error?.message || String(error);
    setConfigStatus(`Failed to load configuration files: ${message}`, "error");
    appendConsole(`Config file load failed: ${message}`, "error");
    log.error("Config file load failed.", { error: message });

    if (els.configFileList) {
      els.configFileList.innerHTML = `<p class="muted">Failed to load config files: ${message}</p>`;
    }

    return [];
  }
}

async function loadConfigFile(path) {
  const entry = getConfigFileEntry(path);
  if (!entry || !state.client || state.config.isLoadingFile) return false;

  state.config.isLoadingFile = true;
  setConfigStatus(`Loading ${entry.path}...`);

  if (els.configEditor) {
    els.configEditor.disabled = true;
  }

  try {
    const content = await state.client.getFileText(entry.root, entry.relativePath);
    state.config.selectedPath = entry.path;
    persistConfigViewState();
    state.config.originalContent = content;
    state.config.draftContent = content;

    if (els.configEditor) {
      els.configEditor.value = content;
      els.configEditor.disabled = entry.root !== "config";
    }

    setConfigDirtyState(false);
    syncConfigSelectionUi();
    renderConfigFileList();
    setConfigStatus(`Loaded ${entry.path}.`);
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    setConfigStatus(`Failed to load ${entry.path}: ${message}`, "error");
    appendConsole(`Config open failed: ${message}`, "error");
    log.error("Config file load failed.", { path: entry.path, error: message });
    syncConfigSelectionUi();
    return false;
  } finally {
    state.config.isLoadingFile = false;
  }
}

function discardConfigDraft({ notify = true } = {}) {
  if (!state.config.selectedPath) return;

  state.config.draftContent = state.config.originalContent;

  if (els.configEditor) {
    els.configEditor.value = state.config.originalContent;
    els.configEditor.disabled = false;
  }

  setConfigDirtyState(false);

  if (notify) {
    setConfigStatus(`Ignored changes for ${state.config.selectedPath}.`, "warn");
    appendConsole(`Ignored unsaved changes: ${state.config.selectedPath}`, "warn");
  }
}

async function saveConfigAndRestartFirmware() {
  const selectedEntry = getConfigFileEntry(state.config.selectedPath);
  if (!selectedEntry || !state.client) {
    setConfigStatus("Select a configuration file before saving.", "warn");
    return false;
  }

  if (selectedEntry.root !== "config") {
    setConfigStatus("Save & Restart Firmware is only available for files under config/.", "warn");
    return false;
  }

  const selectedPath = normalizeConfigPath(selectedEntry.relativePath);
  const nextContent = els.configEditor ? els.configEditor.value : state.config.draftContent;
  state.config.draftContent = nextContent;

  setConfigStatus(`Saving ${selectedPath}...`);

  try {
    await state.client.saveConfigFileText(selectedPath, nextContent);

    state.config.originalContent = nextContent;
    state.config.draftContent = nextContent;
    setConfigDirtyState(false);
    syncConfigSelectionUi();

    appendConsole(`Config saved: ${selectedPath}`, "info");
    setConfigStatus(`Saved ${selectedPath}. Restarting firmware...`);

    const restarted = await executeGcodeAction("FIRMWARE_RESTART", {
      actionLabel: "Firmware restart",
    });

    if (!restarted) {
      appendConsole("Firmware restart failed after config save.", "warn");
      setConfigStatus(`Saved ${selectedPath}, but firmware restart failed.`, "warn");
    } else {
      setConfigStatus(`Saved ${selectedPath} and requested firmware restart.`);
    }

    await loadConfigFiles({ preserveSelection: true });
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    appendConsole(`Config save failed: ${message}`, "error");
    setConfigStatus(`Failed to save ${selectedPath}: ${message}`, "error");
    log.error("Config save failed.", {
      path: selectedPath,
      error: message,
    });
    return false;
  }
}

async function resolveConfigDirtyChanges() {
  if (!state.config.isDirty || !state.config.selectedPath) {
    return true;
  }

  const shouldSave = window.confirm(
    `Unsaved changes detected in ${state.config.selectedPath}.\n\nPress OK to Save and Restart Firmware, or Cancel to Ignore Changes.`
  );

  if (shouldSave) {
    return saveConfigAndRestartFirmware();
  }

  discardConfigDraft({ notify: true });
  return true;
}

async function requestConfigFileOpen(path) {
  const normalizedPath = String(path || "").trim();
  if (!normalizedPath || normalizedPath === state.config.selectedPath) return;

  if (state.config.isDirty) {
    const resolved = await resolveConfigDirtyChanges();
    if (!resolved) return;
  }

  await loadConfigFile(normalizedPath);
}

async function requestViewChange(viewName) {
  if (!viewName || viewName === state.activeView) return;

  if (state.activeView === "configuration" && viewName !== "configuration" && state.config.isDirty) {
    const resolved = await resolveConfigDirtyChanges();
    if (!resolved) return;
  }

  switchView(viewName);

  if (viewName === "files") {
    if (!state.client || state.connectionStatus !== "connected") {
      renderJobsCard();
      return;
    }

    if (!state.jobs.files.length && !state.jobs.directories.length) {
      await loadJobsFiles({ source: "view", silent: true });
    } else {
      state.jobs.currentDirectory = normalizeJobsCurrentDirectory(state.jobs.currentDirectory);
      renderJobsCard();
    }

    return;
  }

  if (viewName !== "configuration") return;

  if (!state.client) {
    setConfigStatus("Connect to Moonraker from Settings to manage configuration files.", "warn");
    return;
  }

  if (!state.config.files.length) {
    await loadConfigFiles({ preserveSelection: true });
  } else {
    applyConfigFilter();
    syncConfigSelectionUi();
  }

  if (!state.updateManager.lastUpdatedMs) {
    try {
      await refreshUpdateManagerStatus({ forceRefresh: false, source: "view" });
    } catch {
      // Status message is handled inside refreshUpdateManagerStatus.
    }
  } else {
    renderUpdateManagerCard();
  }

  if (state.connectionStatus === "connected" && !state.endstops.lastUpdatedMs && !state.endstops.queryInFlight) {
    void requestEndstopsStatus({ source: "view", silent: true });
  } else {
    renderEndstopsCard();
  }

  if (state.connectionStatus === "connected" && !state.logFiles.lastUpdatedMs && !state.logFiles.isLoading) {
    void loadMachineLogFiles({ source: "view", silent: true });
  } else {
    renderMachineLogFilesCard();
  }
}

async function handleConfigUpload(file) {
  if (!file) return false;

  if (!state.client) {
    setConfigStatus("Connect to Moonraker from Settings before uploading.", "warn");
    return false;
  }

  const selectedEntry = getConfigFileEntry(state.config.selectedPath);
  const directory = selectedEntry?.root === "config" ? getConfigDirectory(selectedEntry.relativePath) : "";

  setConfigStatus(`Uploading ${file.name}...`);

  try {
    await state.client.uploadFile("config", file, directory, file.name);

    appendConsole(`Config uploaded: ${file.name}`, "info");
    await loadConfigFiles({ preserveSelection: true });

    const uploadedPath = normalizeConfigPath(directory ? `${directory}/${file.name}` : file.name);
    if (uploadedPath) {
      await requestConfigFileOpen(buildConfigEntryPath("config", uploadedPath));
    }

    setConfigStatus(`Uploaded ${file.name}.`);
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    appendConsole(`Config upload failed: ${message}`, "error");
    setConfigStatus(`Failed to upload ${file.name}: ${message}`, "error");
    log.error("Config upload failed.", {
      filename: file.name,
      error: message,
    });
    return false;
  }
}

function isValidNewConfigPath(path) {
  if (!path || path.endsWith("/")) return false;

  const segments = path.split("/").filter(Boolean);
  if (!segments.length) return false;

  return !segments.some((segment) => segment === "." || segment === "..");
}

function buildNewConfigPathSuggestion() {
  const selectedEntry = getConfigFileEntry(state.config.selectedPath);
  const directory = selectedEntry?.root === "config" ? getConfigDirectory(selectedEntry.relativePath) : "";
  return directory ? `${directory}/new-file.cfg` : "new-file.cfg";
}

async function createNewConfigFile() {
  if (!state.client) {
    setConfigStatus("Connect to Moonraker from Settings before creating files.", "warn");
    return false;
  }

  if (state.config.isDirty) {
    const resolved = await resolveConfigDirtyChanges();
    if (!resolved) return false;
  }

  const suggestedPath = buildNewConfigPathSuggestion();
  const requestedPath = window.prompt("Enter the new config file path (relative to config/):", suggestedPath);
  if (requestedPath === null) return false;

  const normalizedPath = normalizeConfigPath(requestedPath);
  if (!isValidNewConfigPath(normalizedPath)) {
    setConfigStatus("Enter a valid file path for the new config file.", "warn");
    return false;
  }

  const targetEntryPath = buildConfigEntryPath("config", normalizedPath);
  const alreadyExists = state.config.files.some((entry) => entry.path === targetEntryPath);
  if (alreadyExists) {
    setConfigStatus(`File already exists: ${normalizedPath}`, "warn");
    await requestConfigFileOpen(targetEntryPath);
    return false;
  }

  setConfigStatus(`Creating ${normalizedPath}...`);

  try {
    await state.client.saveConfigFileText(normalizedPath, "");
    appendConsole(`Config file created: ${normalizedPath}`, "info");

    await loadConfigFiles({ preserveSelection: true });
    await requestConfigFileOpen(targetEntryPath);

    setConfigStatus(`Created ${normalizedPath}.`);
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    appendConsole(`Config file create failed: ${message}`, "error");
    setConfigStatus(`Failed to create ${normalizedPath}: ${message}`, "error");
    log.error("Config file create failed.", {
      path: normalizedPath,
      error: message,
    });
    return false;
  }
}

async function deleteActiveConfigFile() {
  const selectedEntry = getConfigFileEntry(state.config.selectedPath);
  if (!selectedEntry) return false;

  if (!state.client) {
    setConfigStatus("Connect to Moonraker from Settings before deleting files.", "warn");
    return false;
  }

  if (selectedEntry.root !== "config") {
    setConfigStatus("Deleting is only available for files under config/.", "warn");
    return false;
  }

  const selectedPath = normalizeConfigPath(selectedEntry.relativePath);
  const dirtyWarning = state.config.isDirty ? "\n\nUnsaved edits will be lost." : "";
  const confirmed = window.confirm(`Delete ${selectedPath}? This cannot be undone.${dirtyWarning}`);
  if (!confirmed) return false;

  setConfigStatus(`Deleting ${selectedPath}...`, "warn");

  try {
    await state.client.deleteConfigFile(selectedPath);
    appendConsole(`Config deleted: ${selectedPath}`, "warn");

    state.config.selectedPath = "";
    persistConfigViewState();
    state.config.originalContent = "";
    state.config.draftContent = "";
    setConfigDirtyState(false);
    syncConfigSelectionUi();

    await loadConfigFiles({ preserveSelection: false });

    setConfigStatus(`Deleted ${selectedPath}.`);
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    appendConsole(`Config delete failed: ${message}`, "error");
    setConfigStatus(`Failed to delete ${selectedPath}: ${message}`, "error");
    log.error("Config delete failed.", {
      path: selectedPath,
      error: message,
    });
    return false;
  }
}

function downloadActiveConfigFile() {
  const selectedEntry = getConfigFileEntry(state.config.selectedPath);
  if (!selectedEntry) return;

  const content = els.configEditor ? els.configEditor.value : state.config.draftContent;
  const filename = selectedEntry.relativePath.split("/").pop() || "config.txt";

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
  appendConsole(`Config downloaded: ${selectedEntry.path}`, "info");
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

  appendOutgoingScriptLines(script);

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
  els.navItems.forEach((btn) => {
    btn.addEventListener("click", async () => {
      await requestViewChange(btn.dataset.view);
    });
  });
  els.sidebarToggle?.addEventListener("click", toggleSidebar);
  els.machineSideToggle?.addEventListener("click", toggleMachineSideColumn);

  els.configRefresh?.addEventListener("click", async () => {
    await loadConfigFiles({ preserveSelection: true });
  });

  els.machineUpdateRefresh?.addEventListener("click", async () => {
    await requestUpdateManagerRefresh();
  });

  els.machineUpdateUpgradeAll?.addEventListener("click", async () => {
    const confirmed = window.confirm("Run Update All for every updater with available updates?");
    if (!confirmed) return;
    await requestUpdateManagerUpgrade();
  });

  els.machineEndstopsQuery?.addEventListener("click", async () => {
    await requestEndstopsStatus({ source: "user" });
  });

  els.machineLogFilesRefresh?.addEventListener("click", async () => {
    await loadMachineLogFiles({ source: "user" });
  });

  els.machineLogFilesDeleteAll?.addEventListener("click", async () => {
    await requestMachineLogFilesDeleteAll();
  });

  els.jobsRefresh?.addEventListener("click", async () => {
    closeJobsToolbarMenus();
    await loadJobsFiles({ source: "user" });
  });

  els.jobsSortToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    toggleJobsToolbarMenu(els.jobsSortMenu, els.jobsSortToggle);
  });

  els.jobsColumnsToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    toggleJobsToolbarMenu(els.jobsColumnsMenu, els.jobsColumnsToggle);
  });

  els.jobsSearchToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    closeJobsToolbarMenus();
    if (els.jobsSearch) {
      els.jobsSearch.focus();
      els.jobsSearch.select();
    }
  });

  els.jobsFilterToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    toggleJobsToolbarMenu(els.jobsFilterMenu, els.jobsFilterToggle);
  });

  els.jobsAddToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    toggleJobsToolbarMenu(els.jobsAddMenu, els.jobsAddToggle);
  });

  els.jobsUploadBtn?.addEventListener("click", () => {
    closeJobsToolbarMenus();
    els.jobsUploadInput?.click();
  });

  els.jobsUploadFolderBtn?.addEventListener("click", () => {
    closeJobsToolbarMenus();
    els.jobsUploadFolderInput?.click();
  });

  els.jobsUploadPrintBtn?.addEventListener("click", () => {
    closeJobsToolbarMenus();
    els.jobsUploadPrintInput?.click();
  });

  els.jobsAddFileBtn?.addEventListener("click", () => {
    closeJobsToolbarMenus();
    els.jobsAddFileInput?.click();
  });

  els.jobsUploadInput?.addEventListener("change", async (event) => {
    const input = event.currentTarget;
    const files = [...(input?.files || [])];
    if (!files.length) return;

    await requestJobsUpload(files, { mode: "upload-files" });
    input.value = "";
  });

  els.jobsUploadFolderInput?.addEventListener("change", async (event) => {
    const input = event.currentTarget;
    const files = [...(input?.files || [])];
    if (!files.length) return;

    await requestJobsUpload(files, { preserveRelativePaths: true, mode: "upload-folder" });
    input.value = "";
  });

  els.jobsUploadPrintInput?.addEventListener("change", async (event) => {
    const input = event.currentTarget;
    const file = input?.files?.[0] || null;
    if (!file) return;

    await requestJobsUpload([file], { printAfterUpload: true, mode: "upload-print" });
    input.value = "";
  });

  els.jobsAddFileInput?.addEventListener("change", async (event) => {
    const input = event.currentTarget;
    const file = input?.files?.[0] || null;
    if (!file) return;

    await requestJobsUpload([file], { mode: "add-file" });
    input.value = "";
  });

  els.jobsCard?.addEventListener("dragenter", (event) => {
    if (!jobsDataTransferHasFiles(event.dataTransfer)) return;
    if (!state.client || state.connectionStatus !== "connected") return;

    event.preventDefault();
    state.jobs.uploadDragDepth += 1;
    updateJobsDragTarget(true);
  });

  els.jobsCard?.addEventListener("dragover", (event) => {
    if (!jobsDataTransferHasFiles(event.dataTransfer)) return;
    if (!state.client || state.connectionStatus !== "connected") return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    updateJobsDragTarget(true);
  });

  els.jobsCard?.addEventListener("dragleave", (event) => {
    event.preventDefault();
    state.jobs.uploadDragDepth = Math.max(0, state.jobs.uploadDragDepth - 1);
    if (state.jobs.uploadDragDepth === 0) {
      updateJobsDragTarget(false);
    }
  });

  els.jobsCard?.addEventListener("drop", async (event) => {
    await handleJobsDropUpload(event);
  });

  els.jobsNewFolder?.addEventListener("click", async () => {
    closeJobsToolbarMenus();
    await requestJobsCreateFolder();
  });

  els.jobsSearch?.addEventListener("focus", () => {
    closeJobsToolbarMenus();
  });

  els.jobsSearch?.addEventListener("input", () => {
    state.jobs.searchQuery = String(els.jobsSearch.value || "").trim();
    persistJobsViewState();
    renderJobsCard();
  });

  els.jobsSearch?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      state.jobs.searchQuery = "";
      closeJobsToolbarMenus();
      if (els.jobsSearch) {
        els.jobsSearch.value = "";
        els.jobsSearch.blur();
      }
      persistJobsViewState();
      renderJobsCard();
    }
  });

  els.jobsSort?.addEventListener("change", () => {
    state.jobs.sortMode = normalizeJobsSort(els.jobsSort.value);
    persistJobsViewState();
    closeJobsToolbarMenus();
    renderJobsCard();
  });

  els.jobsTypeFilter?.addEventListener("change", () => {
    state.jobs.typeFilter = normalizeJobsTypeFilter(els.jobsTypeFilter.value);
    persistJobsViewState();
    closeJobsToolbarMenus();
    renderJobsCard();
  });

  els.jobsPause?.addEventListener("click", async () => {
    await requestJobsPrintAction("pause");
  });

  els.jobsResume?.addEventListener("click", async () => {
    await requestJobsPrintAction("resume");
  });

  els.jobsCancel?.addEventListener("click", async () => {
    await requestJobsPrintAction("cancel");
  });

  els.configSearchInput?.addEventListener("input", () => {
    refreshConfigSearchMatches({ preserveActive: false, focusActive: false });
  });

  els.configSearchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      navigateConfigSearch(event.shiftKey ? -1 : 1);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      clearConfigSearch({ clearQuery: true });
      if (els.configEditor && !els.configEditor.disabled) {
        els.configEditor.focus();
      }
    }
  });

  els.configSearchPrev?.addEventListener("click", () => {
    navigateConfigSearch(-1);
  });

  els.configSearchNext?.addEventListener("click", () => {
    navigateConfigSearch(1);
  });

  els.configSearchCase?.addEventListener("click", () => {
    setConfigSearchMode("caseSensitive", !state.configSearch.caseSensitive);
  });

  els.configSearchWord?.addEventListener("click", () => {
    setConfigSearchMode("wholeWord", !state.configSearch.wholeWord);
  });

  els.configSearchRegex?.addEventListener("click", () => {
    setConfigSearchMode("useRegex", !state.configSearch.useRegex);
  });

  els.configUploadBtn?.addEventListener("click", () => {
    els.configUploadInput?.click();
  });

  els.configUploadInput?.addEventListener("change", async (event) => {
    const input = event.currentTarget;
    const file = input?.files?.[0] || null;
    if (!file) return;

    await handleConfigUpload(file);
    input.value = "";
  });

  els.configNewBtn?.addEventListener("click", async () => {
    await createNewConfigFile();
  });

  els.configDelete?.addEventListener("click", async () => {
    await deleteActiveConfigFile();
  });

  els.configFilter?.addEventListener("change", () => {
    state.config.fileTypeFilter = normalizeConfigFileType(els.configFilter.value);
    applyConfigFilter();
  });

  els.configFileSearch?.addEventListener("input", () => {
    state.config.fileSearchQuery = String(els.configFileSearch.value || "");
    applyConfigFilter();
  });

  els.configFileSearch?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      els.configFileSearch.value = "";
      state.config.fileSearchQuery = "";
      applyConfigFilter();
      els.configFileSearch.blur();
    }
  });

  els.configDownload?.addEventListener("click", () => {
    downloadActiveConfigFile();
  });

  els.configIgnoreChanges?.addEventListener("click", () => {
    discardConfigDraft({ notify: true });
  });

  els.configSaveRestart?.addEventListener("click", async () => {
    await saveConfigAndRestartFirmware();
  });

  els.configEditor?.addEventListener("input", () => {
    if (!state.config.selectedPath) return;

    state.config.draftContent = els.configEditor.value;
    const isDirty = state.config.draftContent !== state.config.originalContent;
    setConfigDirtyState(isDirty);

    if (isDirty) {
      setConfigStatus(`Unsaved changes in ${state.config.selectedPath}. Choose Ignore Changes or Save & Restart Firmware.`, "warn");
    } else {
      setConfigStatus(`Loaded ${state.config.selectedPath}.`);
    }

    refreshConfigSearchMatches({ preserveActive: true, focusActive: false });
  });

  els.configEditor?.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
      event.preventDefault();
      focusConfigSearchInput();
      return;
    }

    if (event.key === "F3") {
      event.preventDefault();
      navigateConfigSearch(event.shiftKey ? -1 : 1);
    }
  });

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
    state.dashboard.showMacros = els.dashShowMacros.checked;
    state.dashboard.showMainCamera = els.dashShowMainCamera.checked;
    state.dashboard.showToolheadCamera = els.dashShowToolheadCamera.checked;
    state.dashboard.showConsole = !!els.dashShowConsole?.checked;

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
    localStorage.setItem(MACHINE_SIDE_COLLAPSED_STORAGE_KEY, String(state.interface.machineSideCollapsed));
    localStorage.setItem("dashboard_show_print_progress", String(state.dashboard.showPrintProgress));
    localStorage.setItem("dashboard_show_temperatures", String(state.dashboard.showTemperatures));
    localStorage.setItem("dashboard_show_motion", String(state.dashboard.showMotion));
    localStorage.setItem("dashboard_show_quick_commands", String(state.dashboard.showQuickCommands));
    localStorage.setItem("dashboard_show_macros", String(state.dashboard.showMacros));
    localStorage.setItem("dashboard_show_main_camera", String(state.dashboard.showMainCamera));
    localStorage.setItem("dashboard_show_toolhead_camera", String(state.dashboard.showToolheadCamera));
    localStorage.setItem("dashboard_show_console", String(state.dashboard.showConsole));
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

  getConsoleInstances().forEach((instance) => {
    instance.form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const command = String(instance.input?.value || "").trim();
      if (!command) return;

      const sent = await executeGcodeAction(command, {
        actionLabel: "Console command",
      });

      if (sent) {
        rememberConsoleHistory(command);
        setAllConsoleInputValues("");
        resetConsoleHistoryCursor();
        instance.input?.focus();
      }
    });

    instance.clearButton?.addEventListener("click", () => {
      clearConsoleLog();
    });

    instance.pauseButton?.addEventListener("click", () => {
      setConsolePaused(!state.console.paused);
    });

    instance.helperToggle?.addEventListener("click", (event) => {
      event.preventDefault();
      toggleConsoleHelperPanel(instance.key);
    });

    instance.settingsToggle?.addEventListener("click", (event) => {
      event.preventDefault();
      toggleConsoleSettingsPanel(instance.key);
    });

    instance.helperGrid?.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const helperButton = target.closest("[data-console-helper]");
      if (!helperButton) return;

      const command = helperButton.getAttribute("data-console-helper") || "";
      if (!command) return;

      syncConsoleInputValue(command, instance.input);
      resetConsoleHistoryCursor();
      instance.input?.focus();
      closeConsolePanels();
    });

    instance.hideTempsInput?.addEventListener("change", () => {
      setConsoleHideTemps(!!instance.hideTempsInput?.checked);
    });

    instance.rawOutputInput?.addEventListener("change", () => {
      setConsoleRawOutput(!!instance.rawOutputInput?.checked);
    });

    instance.autoscrollInput?.addEventListener("change", () => {
      setConsoleAutoscroll(!!instance.autoscrollInput?.checked);
    });

    instance.filterSelect?.addEventListener("change", () => {
      setConsoleFilter(instance.filterSelect?.value || "all");
    });

    instance.searchInput?.addEventListener("input", () => {
      setConsoleSearchQuery(instance.searchInput?.value || "");
    });

    instance.input?.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
        event.preventDefault();
        clearConsoleLog();
        return;
      }

      if (event.key === "ArrowUp" && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        event.preventDefault();
        moveConsoleHistory(-1, instance.input);
        return;
      }

      if (event.key === "ArrowDown" && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        event.preventDefault();
        moveConsoleHistory(1, instance.input);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeConsolePanels();
        setAllConsoleInputValues("");
        resetConsoleHistoryCursor();
      }
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;

    const clickedToggle = getConsoleInstances().some((instance) =>
      !!instance.helperToggle?.contains(target) || !!instance.settingsToggle?.contains(target)
    );

    const clickedPanel = getConsoleInstances().some((instance) =>
      !!instance.helperPanel?.contains(target) || !!instance.settingsPanel?.contains(target)
    );

    if (!clickedToggle && !clickedPanel) {
      closeConsolePanels();
    }

    const clickedJobsToolbar = target instanceof Element && !!target.closest("#jobs-feature-panel");
    if (!clickedJobsToolbar) {
      closeJobsToolbarMenus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeJobsToolbarMenus();
    }
  });
  els.quickGcode.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const command = btn.dataset.gcode;
      if (!command) return;
      await executeGcodeAction(command, {
        actionLabel: `Quick command ${command}`,
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
      });
    });
  });

  els.home.addEventListener("click", async () => {
    await executeGcodeAction("G28", {
      actionLabel: "Home axes",
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

async function init() {
  els.moonrakerUrl.value = state.moonrakerUrl;

  els.interfaceTheme.value = state.interface.theme;
  els.interfaceCompact.checked = state.interface.compact;
  els.interfaceDensity.value = state.interface.density;

  els.dashShowPrintProgress.checked = state.dashboard.showPrintProgress;
  els.dashShowTemperatures.checked = state.dashboard.showTemperatures;
  els.dashShowMotion.checked = state.dashboard.showMotion;
  els.dashShowQuickCommands.checked = state.dashboard.showQuickCommands;
  els.dashShowMacros.checked = state.dashboard.showMacros;
  els.dashShowMainCamera.checked = state.dashboard.showMainCamera;
  els.dashShowToolheadCamera.checked = state.dashboard.showToolheadCamera;
  if (els.dashShowConsole) els.dashShowConsole.checked = state.dashboard.showConsole;

  els.cameraEnabled.checked = state.camera.enabled;
  els.cameraUrl.value = state.camera.url;
  els.cameraRenderMode.value = state.camera.renderMode;

  els.toolheadCameraEnabled.checked = state.toolheadCamera.enabled;
  els.toolheadCameraUrl.value = state.toolheadCamera.url;
  els.toolheadCameraRenderMode.value = state.toolheadCamera.renderMode;

  if (els.configFilter) {
    els.configFilter.value = normalizeConfigFileType(state.config.fileTypeFilter);
  }

  if (els.configFileSearch) {
    els.configFileSearch.value = String(state.config.fileSearchQuery || "");
  }

  if (els.jobsSearch) {
    els.jobsSearch.value = String(state.jobs.searchQuery || "");
  }

  if (els.jobsSort) {
    els.jobsSort.value = normalizeJobsSort(state.jobs.sortMode);
  }

  if (els.jobsTypeFilter) {
    els.jobsTypeFilter.value = normalizeJobsTypeFilter(state.jobs.typeFilter);
  }

  getConsoleInstances().forEach((instance) => {
    if (instance.autoscrollInput) {
      instance.autoscrollInput.checked = state.console.autoscroll;
    }

    if (instance.filterSelect) {
      instance.filterSelect.value = normalizeConsoleFilter(state.console.filter);
    }

    if (instance.searchInput) {
      instance.searchInput.value = state.console.searchQuery;
    }

    if (instance.hideTempsInput) {
      instance.hideTempsInput.checked = state.console.hideTemps;
    }

    if (instance.rawOutputInput) {
      instance.rawOutputInput.checked = state.console.rawOutput;
    }
  });

  closeConsolePanels();
  renderConsoleHelperEntries();
  resetConsoleHistoryCursor();
  updateConsoleMeta();

  switchView(state.activeView);
  syncConfigSelectionUi();
  clearConfigSearch({ clearQuery: true });
  setConfigStatus("Connect to Moonraker from Settings to manage configuration files.", "warn");

  applyDashboardLayout();
  setupCollapsibleCards();
  renderMachineLoadsCard();
  renderUpdateManagerCard();
  renderEndstopsCard();
  renderMachineLogFilesCard();
  renderJobsCard();

  try {
    await restoreTemperatureHistoryForSession();
  } catch (error) {
    log.debug("Temperature history restore failed.", { error: error?.message || String(error) });
  }

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

init().catch((error) => {
  const message = error?.message || String(error);
  log.error("App init failed.", { error: message });
  setConnectionUi("error");
  appendConsole(`Init failed: ${message}`, "error");
});

























