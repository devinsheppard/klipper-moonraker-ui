import { MoonrakerClient } from "./moonraker.js";
import { createLogger } from "./logger.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const CAMERA_MODES = {
  IMAGE: "image",
  IFRAME: "iframe",
};

const INTERFACE_THEMES = ["ocean", "ember", "graphite", "raiders", "pbhs", "royals"];
const DEFAULT_INTERFACE_THEME = "ember";
const INTERFACE_DENSITIES = ["comfortable", "compact"];
const INTERFACE_THEME_PALETTE_STORAGE_KEY = "interface_theme_palette_v1";
const INTERFACE_THEME_PRESET_STORAGE_KEY = "interface_theme_preset_v1";
const INTERFACE_THEME_PRESET_CUSTOM = "custom";
const INTERFACE_THEME_BASE_PRESET_PREFIX = "base:";
const INTERFACE_BACKGROUND_IMAGE_URL_STORAGE_KEY = "interface_background_image_url_v1";
const INTERFACE_BACKGROUND_IMAGE_ENABLED_STORAGE_KEY = "interface_background_image_enabled_v1";
const THEME_WATERMARK_LOGO_CANDIDATES = Object.freeze({
  raiders: Object.freeze([
    "/branding/three-rivers-college-logo.svg",
    "/branding/three-rivers-college-logo.png",
    "/branding/three-rivers-college-logo.webp",
  ]),
  pbhs: Object.freeze([
    "/branding/poplar-bluff-mules-logo.png",
    "/branding/poplar-bluff-mules-logo.webp",
    "/branding/poplar-bluff-mules-logo.svg",
    "/branding/poplar-bluff-high-school-logo.svg",
    "/branding/poplar-bluff-high-school-logo.png",
    "/branding/poplar-bluff-high-school-logo.webp",
  ]),
  royals: Object.freeze([
    "/branding/twin-rivers-royals-logo.png",
    "/branding/twin-rivers-royals-logo.webp",
    "/branding/twin-rivers-royals-logo.svg",
  ]),
});
const THEME_WATERMARK_CSS_VARIABLES = Object.freeze({
  raiders: "--raiders-watermark-approved-logo",
  pbhs: "--pbhs-watermark-approved-logo",
  royals: "--royals-watermark-approved-logo",
});
const INTERFACE_THEME_COLOR_FIELDS = Object.freeze([
  { key: "bg", cssVar: "--bg", elKey: "themeColorBg" },
  { key: "bgSoft", cssVar: "--bg-soft", elKey: "themeColorBgSoft" },
  { key: "text", cssVar: "--text", elKey: "themeColorText" },
  { key: "muted", cssVar: "--muted", elKey: "themeColorMuted" },
  { key: "accent", cssVar: "--accent", elKey: "themeColorAccent" },
  { key: "accent2", cssVar: "--accent-2", elKey: "themeColorAccent2" },
  { key: "danger", cssVar: "--danger", elKey: "themeColorDanger" },
]);
const INTERFACE_THEME_BASE_PALETTES = Object.freeze({
  ocean: Object.freeze({
    bg: "#080d18",
    bgSoft: "#121d33",
    text: "#f8fafc",
    muted: "#e2e8f0",
    accent: "#22d3ee",
    accent2: "#34d399",
    danger: "#f97316",
  }),
  ember: Object.freeze({
    bg: "#140f0b",
    bgSoft: "#24160f",
    text: "#fff7ed",
    muted: "#ffe4c7",
    accent: "#fb923c",
    accent2: "#f97316",
    danger: "#ef4444",
  }),
  graphite: Object.freeze({
    bg: "#0c0f14",
    bgSoft: "#171d25",
    text: "#f8fafc",
    muted: "#e5ebf5",
    accent: "#7cb6ff",
    accent2: "#2dd4bf",
    danger: "#f87171",
  }),
  raiders: Object.freeze({
    bg: "#060607",
    bgSoft: "#121214",
    text: "#f6f3ea",
    muted: "#d8d1be",
    accent: "#f5c543",
    accent2: "#9f7b19",
    danger: "#e05252",
  }),
  pbhs: Object.freeze({
    bg: "#07080b",
    bgSoft: "#12141a",
    text: "#f5f6fa",
    muted: "#cfd3df",
    accent: "#6b1722",
    accent2: "#9a9ea9",
    danger: "#e16464",
  }),
  royals: Object.freeze({
    bg: "#070d1b",
    bgSoft: "#111b32",
    text: "#f5f8ff",
    muted: "#ced9f1",
    accent: "#3f9dff",
    accent2: "#2a5fba",
    danger: "#ec6b72",
  }),
});
const COMMUNITY_THEME_PRESETS = Object.freeze([
  {
    id: "forge-spectrum",
    name: "Forge Spectrum",
    baseTheme: "ocean",
    palette: {
      bg: "#0b1020",
      bgSoft: "#182642",
      text: "#f8fbff",
      muted: "#d6e2f2",
      accent: "#36d1ff",
      accent2: "#58f1b7",
      danger: "#ff7a59",
    },
  },
  {
    id: "harbor-night",
    name: "Harbor Night",
    baseTheme: "graphite",
    palette: {
      bg: "#0a1118",
      bgSoft: "#162330",
      text: "#edf4ff",
      muted: "#bfd0e8",
      accent: "#4db2ff",
      accent2: "#39d5c2",
      danger: "#ff7474",
    },
  },
  {
    id: "solder-sunset",
    name: "Solder Sunset",
    baseTheme: "ember",
    palette: {
      bg: "#1d110d",
      bgSoft: "#301a12",
      text: "#fff4e8",
      muted: "#ffd9bc",
      accent: "#ff9c53",
      accent2: "#ff7b44",
      danger: "#ff5f5f",
    },
  },
  {
    id: "mint-shift",
    name: "Mint Shift",
    baseTheme: "ocean",
    palette: {
      bg: "#07131a",
      bgSoft: "#11282f",
      text: "#efffff",
      muted: "#b7e8e2",
      accent: "#3ce6cf",
      accent2: "#79f59d",
      danger: "#ff8f66",
    },
  },
  {
    id: "steel-dawn",
    name: "Steel Dawn",
    baseTheme: "graphite",
    palette: {
      bg: "#10141f",
      bgSoft: "#1b2436",
      text: "#f3f6ff",
      muted: "#cad2e8",
      accent: "#7fa4ff",
      accent2: "#6cd4ff",
      danger: "#ff7f8e",
    },
  },
  {
    id: "raiders-spirit",
    name: "Raiders Spirit",
    baseTheme: "raiders",
    palette: {
      bg: "#050506",
      bgSoft: "#111215",
      text: "#f8f4e8",
      muted: "#d9d0b8",
      accent: "#f7ca4f",
      accent2: "#ab8320",
      danger: "#e65a5a",
    },
  },
  {
    id: "pbhs-mules",
    name: "PBHS Mules",
    baseTheme: "pbhs",
    palette: {
      bg: "#06070a",
      bgSoft: "#10131a",
      text: "#f6f7fb",
      muted: "#c9ced9",
      accent: "#701925",
      accent2: "#a8adb9",
      danger: "#e56666",
    },
  },
  {
    id: "twin-rivers-royals",
    name: "Twin Rivers Royals",
    baseTheme: "royals",
    palette: {
      bg: "#060b17",
      bgSoft: "#0f1a31",
      text: "#f6f9ff",
      muted: "#c7d4ee",
      accent: "#49a5ff",
      accent2: "#3169c5",
      danger: "#f06f76",
    },
  },
]);
const COMMUNITY_THEME_PRESET_IDS = COMMUNITY_THEME_PRESETS.map((preset) => preset.id);
const CONTROL_DISTANCE_VALUES = [0.1, 1, 10, 100];
const CONTROL_Z_OFFSET_STEPS = Object.freeze([0.005, 0.01, 0.025, 0.05]);
const CONTROL_Z_OFFSET_SAVE_OPTION_STORAGE_KEY = "controls_z_offset_save_option";
const CONTROL_Z_OFFSET_SAVE_OPTION_VALUES = ["Z_OFFSET_APPLY_ENDSTOP", "Z_OFFSET_APPLY_PROBE"];
const MANUAL_PROBE_STEPS = Object.freeze([0.005, 0.01, 0.05, 0.1, 1]);
const CARD_COLLAPSE_KEY_PREFIX = "card_collapsed_";
const KLIPPERVIEW_CARD_ID = "card-klipperview";
const RUNOUT_SENSOR_OBJECT_PREFIXES = Object.freeze([
  "filament_switch_sensor ",
  "filament_motion_sensor ",
]);
const DASHBOARD_CARD_IDS = [
  "card-print-progress",
  "card-temperatures",
  "card-motion",
  "card-quick-commands",
  "card-macros",
  "card-runout-sensors",
  "card-dashboard-console",
  "camera-main-card",
  "camera-toolhead-card",
  KLIPPERVIEW_CARD_ID,
];

const DASHBOARD_LAYOUT_DEFAULT = {
  left: ["card-print-progress", "card-motion", "camera-main-card", "card-macros", "card-runout-sensors"],
  right: ["card-temperatures", "card-quick-commands", "card-dashboard-console", KLIPPERVIEW_CARD_ID, "camera-toolhead-card"],
};

const DASHBOARD_VIEWPORTS = ["mobile", "tablet", "desktop", "widescreen"];
const DASHBOARD_VIEWPORT_COLUMN_COUNT = Object.freeze({
  mobile: 1,
  tablet: 2,
  desktop: 2,
  widescreen: 3,
});
const DASHBOARD_LAYOUT_DEFAULTS = Object.freeze({
  mobile: Object.freeze({
    columns: [Object.freeze([...DASHBOARD_LAYOUT_DEFAULT.left, ...DASHBOARD_LAYOUT_DEFAULT.right])],
  }),
  tablet: Object.freeze({
    columns: [Object.freeze([...DASHBOARD_LAYOUT_DEFAULT.left]), Object.freeze([...DASHBOARD_LAYOUT_DEFAULT.right])],
  }),
  desktop: Object.freeze({
    columns: [Object.freeze([...DASHBOARD_LAYOUT_DEFAULT.left]), Object.freeze([...DASHBOARD_LAYOUT_DEFAULT.right])],
  }),
  widescreen: Object.freeze({
    columns: [
      Object.freeze(["card-print-progress", "card-motion", "card-macros", "card-runout-sensors"]),
      Object.freeze(["card-temperatures", "card-quick-commands", "card-dashboard-console"]),
      Object.freeze(["camera-main-card", "camera-toolhead-card", KLIPPERVIEW_CARD_ID]),
    ],
  }),
});
const DASHBOARD_LAYOUT_STORAGE_KEYS = Object.freeze({
  mobile: "dashboard_layout_mobile_v1",
  tablet: "dashboard_layout_tablet_v1",
  desktop: "dashboard_layout_desktop_v1",
  widescreen: "dashboard_layout_widescreen_v1",
});
const DASHBOARD_LAYOUT_LEGACY_STORAGE_KEY = "dashboard_layout";
const DASHBOARD_LAYOUT_LEGACY_ORDER_STORAGE_KEY = "dashboard_layout_order";
const DASHBOARD_VISIBILITY_STORAGE_KEYS = Object.freeze({
  "card-print-progress": "dashboard_show_print_progress",
  "card-temperatures": "dashboard_show_temperatures",
  "card-motion": "dashboard_show_motion",
  "card-quick-commands": "dashboard_show_quick_commands",
  "card-macros": "dashboard_show_macros",
  "card-runout-sensors": "dashboard_show_runout_sensors",
  "camera-main-card": "dashboard_show_main_camera",
  "camera-toolhead-card": "dashboard_show_toolhead_camera",
  "card-dashboard-console": "dashboard_show_console",
  [KLIPPERVIEW_CARD_ID]: "dashboard_show_klipperview",
});
const DASHBOARD_CARD_LABELS = {
  "card-print-progress": "Status",
  "card-temperatures": "Thermals",
  "card-motion": "Controls",
  "card-quick-commands": "Quick Commands",
  "card-macros": "Macros",
  "card-runout-sensors": "Runout Sensors",
  "card-dashboard-console": "Console",
  "camera-main-card": "Main Camera",
  "camera-toolhead-card": "Toolhead Cam",
  [KLIPPERVIEW_CARD_ID]: "KlipperView",
};

const PRINTER_STATE_META = {
  unknown: { label: "Unknown", color: "var(--status-idle, #64748b)" },
  connecting: { label: "Connecting", color: "var(--warning, #f59e0b)" },
  disconnected: { label: "Disconnected", color: "var(--status-disconnected, #f97316)" },
  ready: { label: "Ready", color: "var(--success, #22c55e)" },
  printing: { label: "Printing", color: "var(--status-printing, #16a34a)" },
  paused: { label: "Paused", color: "var(--status-paused, #f59e0b)" },
  complete: { label: "Complete", color: "var(--status-complete, #22d3ee)" },
  cancelled: { label: "Cancelled", color: "var(--status-idle, #94a3b8)" },
  error: { label: "Error", color: "var(--error, #ef4444)" },
};

const VIEW_TITLES = {
  dashboard: "Dashboard",
  console: "Console",
  configuration: "Machine",
  files: "GCode Files",
  history: "Print History",
  timelapse: "Timelapse",
  spoolman: "Spoolman",
  "pretty-gcode": "KlipperView",
  settings: "Settings",
};
const SETTINGS_SUBNAV_ANCHORS = [
  "general",
  "dashboard",
  "warnings",
  "theme",
  "console",
  "macros",
  "camera",
  "toolhead",
  "presets",
  "timelapse",
  "spoolman",
  "versions",
];
const ACTIVE_VIEW_STORAGE_KEY = "active_view";
const CONFIG_SELECTED_PATH_STORAGE_KEY = "config_selected_path";
const CONFIG_FILE_FILTER_STORAGE_KEY = "config_file_type_filter";
const CONFIG_FILE_SEARCH_STORAGE_KEY = "config_file_search_filter";
const MACHINE_SIDE_COLLAPSED_STORAGE_KEY = "interface_machine_side_collapsed";
const TIMELAPSE_SERVICE_NAME_STORAGE_KEY = "timelapse_service_name_v1";
const TIMELAPSE_SERVICE_NAME_DEFAULT = "forge-timelapse-recorder";
const TIMELAPSE_CONTROL_MODE_STORAGE_KEY = "timelapse_control_mode_v1";
const STATUS_CLEARED_FILENAME_STORAGE_KEY = "status_cleared_filename_v1";
const TIMELAPSE_CONTROL_MODE_SERVICE = "moonraker-service";
const TIMELAPSE_CONTROL_MODE_EXTERNAL = "external-recorder";
const TIMELAPSE_MEDIA_SORT_STORAGE_KEY = "timelapse_media_sort";
const TIMELAPSE_MEDIA_DIRECTORY_STORAGE_KEY = "timelapse_media_directory";
const SPOOLMAN_ENABLED_STORAGE_KEY = "spoolman_enabled_v1";
const SPOOLMAN_SERVER_URL_STORAGE_KEY = "spoolman_server_url_v1";
const SPOOLMAN_API_TOKEN_STORAGE_KEY = "spoolman_api_token_v1";
const SPOOLMAN_AUTO_DIALOG_STORAGE_KEY = "spoolman_auto_spool_selection_dialog_v1";
const SPOOLMAN_AUTO_QR_CAMERA_STORAGE_KEY = "spoolman_auto_qr_detection_camera_v1";
const SPOOLMAN_PREFER_DEVICE_CAMERA_STORAGE_KEY = "spoolman_prefer_device_camera_v1";
const SPOOLMAN_AUTO_SELECT_ON_MATCH_STORAGE_KEY = "spoolman_auto_select_on_match_v1";
const SPOOLMAN_WARN_NOT_ENOUGH_STORAGE_KEY = "spoolman_warn_not_enough_filament_v1";
const SPOOLMAN_WARN_MISMATCH_STORAGE_KEY = "spoolman_warn_filament_type_mismatch_v1";
const SPOOLMAN_REMAINING_UNIT_STORAGE_KEY = "spoolman_remaining_filament_unit_v1";
const SPOOLMAN_CARD_FIELDS_STORAGE_KEY = "spoolman_selected_card_fields_v1";
const SPOOLMAN_CONNECTION_DIRECT = "direct";
const SPOOLMAN_CONNECTION_PROXY = "moonraker-proxy";
const SPOOLMAN_REMAINING_UNIT_VALUES = ["weight", "length"];
const SPOOLMAN_CARD_FIELD_OPTIONS = [
  "id",
  "vendor",
  "filament_name",
  "remaining_weight",
  "used_weight",
  "location",
  "material",
  "lot_nr",
  "price",
  "density",
  "diameter",
  "extruder_temp",
  "bed_temp",
  "first_used",
  "last_used",
  "comment",
];
const SPOOLMAN_DEFAULT_SELECTED_CARD_FIELDS = [
  "vendor",
  "filament_name",
  "remaining_weight",
  "location",
  "material",
  "lot_nr",
  "first_used",
  "comment",
];
const SPOOLMAN_SETTINGS_DEFAULTS = Object.freeze({
  autoSpoolSelectionDialog: true,
  autoOpenQRDetectionCamera: "",
  preferDeviceCamera: false,
  autoSelectSpoolOnMatch: false,
  warnOnNotEnoughFilament: true,
  warnOnFilamentTypeMismatch: true,
  remainingFilamentUnit: "weight",
  selectedCardFields: [...SPOOLMAN_DEFAULT_SELECTED_CARD_FIELDS],
});
const TIMELAPSE_MEDIA_SORT_VALUES = [
  "modified_desc",
  "modified_asc",
  "name_asc",
  "name_desc",
];
const TIMELAPSE_SETTINGS_MODE_VALUES = ["layermacro", "hyperlapse"];
const TIMELAPSE_SETTINGS_PARKPOS_VALUES = [
  "center",
  "front_left",
  "front_right",
  "back_left",
  "back_right",
  "x_only",
  "y_only",
  "custom",
];
const TIMELAPSE_SETTINGS_DEFAULTS = Object.freeze({
  enabled: true,
  camera: "",
  mode: "layermacro",
  autorender: true,
  autorenderOnce: false,
  saveframes: false,
  stream_delay_compensation: 0.05,
  gcode_verbose: true,
  parkhead: false,
  parkpos: "back_left",
  park_custom_pos_x: 0,
  park_custom_pos_y: 0,
  park_custom_pos_dz: 0,
  park_travel_speed: 100,
  park_retract_speed: 15,
  park_retract_distance: 1,
  park_extrude_speed: 15,
  park_extrude_distance: 1,
  park_time: 0.1,
  fw_retract: false,
  hyperlapse_cycle: 30,
  constant_rate_factor: 23,
  output_framerate: 30,
  pixelformat: "yuv420p",
  extraoutputparams: "",
  variable_fps: false,
  targetlength: 60,
  variable_fps_min: 5,
  variable_fps_max: 60,
  rotation: 0,
  duplicatelastframe: 0,
  previewimage: true,
  time_format_code: "%Y%m%d_%H%M",
  blockedsettings: [],
});
const TIMELAPSE_SETTINGS_NUMERIC_RULES = Object.freeze({
  stream_delay_compensation: { min: 0, strict: false },
  park_custom_pos_dz: { min: 0, strict: false },
  park_travel_speed: { min: 0, strict: false },
  park_retract_speed: { min: 0, strict: true },
  park_retract_distance: { min: 0, strict: false },
  park_extrude_speed: { min: 0, strict: true },
  park_extrude_distance: { min: 0, strict: false },
  park_time: { min: 0, strict: false },
  hyperlapse_cycle: { min: 0, strict: true },
  constant_rate_factor: { min: 0, strict: true },
  output_framerate: { min: 0, strict: true },
  targetlength: { min: 0, strict: true },
  variable_fps_min: { min: 0, strict: true },
  variable_fps_max: { min: 0, strict: true },
  duplicatelastframe: { min: 0, strict: false },
});
const TIMELAPSE_SETTINGS_UNAVAILABLE_PATTERNS = [
  "method not found",
  "unknown method",
  "machine.timelapse",
  "404",
  "501",
];
const WARNINGS_SETTINGS_DEFAULTS = Object.freeze({
  warnOnCpuThrottled: true,
  warnOnStepperDriverOverheating: true,
});
const WARNINGS_CPU_THROTTLED_STORAGE_KEY = "warnings_warn_on_cpu_throttled";
const WARNINGS_STEPPER_DRIVER_OVERHEATING_STORAGE_KEY = "warnings_warn_on_stepper_driver_overheating";
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
  { key: "first_layer_extruder_temp", label: "First Layer Nozzle Temp" },
  { key: "first_layer_bed_temp", label: "First Layer Bed Temp" },
  { key: "chamber_temp", label: "Chamber Temp" },
];
const JOBS_COLUMN_KEYS = JOBS_COLUMN_DEFINITIONS.map((entry) => entry.key);
const JOBS_DEFAULT_VISIBLE_COLUMNS = ["size", "modified", "eta", "total_layers"];
const JOBS_PREPARE_PRINT_MACRO_NAME = "PRINT_START";
const JOBS_PREPARE_STAGE_ORDER = Object.freeze([
  "file_loaded",
  "heating_bed",
  "heating_nozzle",
  "homing",
  "adaptive_mesh",
  "starting_print",
]);
const JOBS_PREPARE_STAGE_TEXT = Object.freeze({
  file_loaded: "File loaded",
  heating_bed: "Heating bed",
  heating_nozzle: "Heating nozzle to standby",
  homing: "Homing",
  adaptive_mesh: "Running adaptive bed mesh",
  starting_print: "Starting print",
});
const PRINT_HISTORY_SEARCH_STORAGE_KEY = "print_history_search";
const PRINT_HISTORY_STATUS_STORAGE_KEY = "print_history_status";
const PRINT_HISTORY_SORT_STORAGE_KEY = "print_history_sort";
const PRINT_HISTORY_PAGE_SIZE_STORAGE_KEY = "print_history_page_size";
const PRINT_HISTORY_COLUMNS_STORAGE_KEY = "print_history_visible_columns";
const PRINT_HISTORY_TIME_DAYS_STORAGE_KEY = "print_history_time_in_days";
const PRINT_HISTORY_LENGTH_KM_STORAGE_KEY = "print_history_length_km";
const PRINT_HISTORY_LOAD_LIMIT_STORAGE_KEY = "print_history_load_limit";
const PRINT_HISTORY_STATUS_VIEW_STORAGE_KEY = "print_history_status_view";
const PRINT_HISTORY_STATUS_VALUE_STORAGE_KEY = "print_history_status_value";
const PRINT_HISTORY_TREND_MODE_STORAGE_KEY = "print_history_trend_mode";
const PRINT_HISTORY_LOAD_LIMIT_VALUES = [50, 100, 250, 500, 0];
const PRINT_HISTORY_PAGE_SIZE_VALUES = [10, 15, 25, 50];
const PRINT_HISTORY_STATUS_VIEW_VALUES = ["chart", "table"];
const PRINT_HISTORY_STATUS_VALUE_VALUES = ["jobs", "filament", "time"];
const PRINT_HISTORY_TREND_MODE_VALUES = ["filament_usage", "printtime_avg"];
const PRINT_HISTORY_SORT_VALUES = [
  "start_desc",
  "start_asc",
  "end_desc",
  "end_asc",
  "total_desc",
  "print_desc",
  "filament_desc",
  "name_asc",
  "name_desc",
  "status_asc",
];
const PRINT_HISTORY_STATUS_FILTER_VALUES = [
  "all",
  "completed",
  "cancelled",
  "error",
  "interrupted",
  "server_exit",
  "klippy_shutdown",
  "klippy_disconnect",
  "printing",
  "in_progress",
];
const PRINT_HISTORY_COLUMN_DEFINITIONS = [
  { key: "status", label: "Status" },
  { key: "start_time", label: "Start" },
  { key: "end_time", label: "End" },
  { key: "print_duration", label: "Print Time" },
  { key: "total_duration", label: "Total Time" },
  { key: "filament_used", label: "Filament" },
  { key: "user", label: "User" },
  { key: "exists", label: "File Exists" },
  { key: "estimated_time", label: "ETA" },
  { key: "object_height", label: "Object H" },
  { key: "layer_height", label: "Layer H" },
  { key: "first_layer_height", label: "First Layer H" },
  { key: "filament_type", label: "Filament Type" },
  { key: "filament_name", label: "Filament Name" },
  { key: "nozzle_diameter", label: "Nozzle" },
  { key: "size", label: "Size" },
  { key: "modified", label: "Modified" },
  { key: "auxiliary_data", label: "Aux Data" },
];
const PRINT_HISTORY_COLUMN_KEYS = PRINT_HISTORY_COLUMN_DEFINITIONS.map((entry) => entry.key);
const PRINT_HISTORY_DEFAULT_VISIBLE_COLUMNS = ["status", "start_time", "end_time", "total_duration", "filament_used", "user", "exists"];

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
const CONSOLE_HIDE_TIMELAPSE_STORAGE_KEY = "console_hide_timelapse_v1";
const CONSOLE_DIRECTION_STORAGE_KEY = "console_direction_v1";
const CONSOLE_ENTRY_DESIGN_STORAGE_KEY = "console_entry_design_v1";
const CONSOLE_HEIGHT_STORAGE_KEY = "console_height_v1";
const CONSOLE_CUSTOM_FILTERS_STORAGE_KEY = "console_custom_filters_v1";
const CONSOLE_DIRECTION_VALUES = ["bottom", "top"];
const CONSOLE_ENTRY_DESIGN_VALUES = ["default", "compact"];
const CONSOLE_DEFAULT_HEIGHT = 340;
const CONSOLE_MIN_HEIGHT = 180;
const CONSOLE_MAX_HEIGHT = 960;
const CONSOLE_HISTORY_LIMIT = 120;
const CONSOLE_PAUSED_BUFFER_LIMIT = 1500;
const CONSOLE_FILTER_VALUES = ["all", "command", "response", "error", "system"];
const MACRO_SETTINGS_STORAGE_KEY = "macro_settings_v1";
const MACRO_DEFAULT_CATEGORY_ID = "0";
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
const THERMAL_PRESETS_STORAGE_KEY = "thermal_presets_v1";
const THERMAL_PRESET_SENSOR_KEYS = ["hotend", "bed"];
const THERMAL_PRESET_SENSOR_LABELS = {
  hotend: "Hotend",
  bed: "Bed",
};
const THERMAL_PRESET_MAX_VALUES = {
  hotend: 400,
  bed: 200,
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
const UPDATE_MANAGER_BACKUP_BASE_DIR = "backups/update-manager";
const UPDATE_MANAGER_BACKUP_FILES_DIRNAME = "files";
const UPDATE_MANAGER_BACKUP_MANIFEST_FILENAME = "manifest.json";
const UPDATE_MANAGER_DB_BACKUP_PREFIX = "update-manager";
const PRETTY_GCODE_MAX_SEGMENTS = 150000;
const PRETTY_GCODE_SIM_TICK_MS = 120;
const PRETTY_GCODE_SIM_STEP_DELTA = 0.05;
const PRETTY_GCODE_SIM_MIN_DURATION_MS = 20 * 1000;
const PRETTY_GCODE_SIM_MAX_DURATION_MS = 4 * 60 * 60 * 1000;
const PRETTY_GCODE_SIM_BASE_SEGMENT_MS = 95;
const PRETTY_GCODE_LAYER_Z_TOLERANCE = 0.005;
const PRETTY_GCODE_FEATURE_TYPE_DEFAULT = "default";
const PRETTY_GCODE_FEATURE_TYPE_TRAVEL = "travel";
const PRETTY_GCODE_FEATURE_TYPE_ORDER = [
  PRETTY_GCODE_FEATURE_TYPE_DEFAULT,
  "inner",
  "outer",
  "fill",
  "skin",
  "support",
  "skirt",
];
const PRETTY_GCODE_FEATURE_COMMENT_MATCHERS = [
  { term: "inner wall", featureType: "inner" },
  { term: "outer wall", featureType: "outer" },
  { term: "inner", featureType: "inner" },
  { term: "outer", featureType: "outer" },
  { term: "perimeter", featureType: "outer" },
  { term: "wall", featureType: "outer" },
  { term: "fill", featureType: "fill" },
  { term: "infill", featureType: "fill" },
  { term: "skin", featureType: "skin" },
  { term: "support", featureType: "support" },
  { term: "raft", featureType: "support" },
  { term: "brim", featureType: "skirt" },
  { term: "skirt", featureType: "skirt" },
];
const PRETTY_GCODE_FEATURE_RENDER_STYLES = {
  [PRETTY_GCODE_FEATURE_TYPE_DEFAULT]: {
    current: "rgba(248, 113, 113, 0.96)",
    history: "rgba(186, 92, 92, 0.52)",
  },
  inner: {
    current: "rgba(34, 197, 94, 0.95)",
    history: "rgba(52, 138, 84, 0.5)",
  },
  outer: {
    current: "rgba(239, 68, 68, 0.98)",
    history: "rgba(164, 66, 66, 0.56)",
  },
  fill: {
    current: "rgba(251, 146, 60, 0.95)",
    history: "rgba(178, 111, 66, 0.52)",
  },
  skin: {
    current: "rgba(250, 204, 21, 0.96)",
    history: "rgba(184, 154, 60, 0.52)",
  },
  support: {
    current: "rgba(56, 189, 248, 0.95)",
    history: "rgba(72, 131, 168, 0.52)",
  },
  skirt: {
    current: "rgba(14, 165, 233, 0.95)",
    history: "rgba(60, 122, 153, 0.52)",
  },
};
const PRETTY_GCODE_TRAVEL_RENDER_STYLE = {
  current: "rgba(148, 163, 184, 0.72)",
  history: "rgba(100, 116, 139, 0.38)",
};
const PRETTY_GCODE_FUTURE_RENDER_STYLE = "rgba(100, 116, 139, 0.42)";
const PRETTY_GCODE_3D_ORBIT_IDLE_SECONDS = 5;
const PRETTY_GCODE_3D_MIRROR_OPACITY_SCALE = 0.42;
function getThemeColorValue(cssVarName, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim();
  return value || fallback;
}

function getTemperatureLineColors() {
  return {
    hotend: getThemeColorValue("--temperature-hot", getThemeColorValue("--danger", TEMPERATURE_COLORS.hotend)),
    bed: getThemeColorValue("--temperature-bed", getThemeColorValue("--accent", TEMPERATURE_COLORS.bed)),
  };
}
const log = createLogger("app");

const els = {
  navItems: [...document.querySelectorAll(".nav-item")],
  views: [...document.querySelectorAll(".view")],
  sidebar: document.getElementById("sidebar"),
  sidebarToggle: document.getElementById("sidebar-toggle"),
  settingsSubnav: document.getElementById("settings-subnav"),
  settingsSubnavItems: [...document.querySelectorAll(".settings-subnav-item")],
  settingsSections: [...document.querySelectorAll("[data-settings-section]")],
  toolsMenuToggle: document.getElementById("tools-menu-toggle"),
  toolsMenuClose: document.getElementById("tools-menu-close"),
  toolsDrawer: document.getElementById("tools-drawer"),
  toolsDrawerBackdrop: document.getElementById("tools-drawer-backdrop"),
  toolsPowerStatus: document.getElementById("tools-power-status"),
  toolsPowerList: document.getElementById("tools-power-list"),
  toolsServicesStatus: document.getElementById("tools-services-status"),
  toolsServicesList: document.getElementById("tools-services-list"),
  timelapseControlMode: document.getElementById("timelapse-control-mode"),
  timelapseServiceNameLabel: document.getElementById("timelapse-service-name-label"),
  timelapseServiceName: document.getElementById("timelapse-service-name"),
  timelapseServiceStatus: document.getElementById("timelapse-service-status"),
  timelapseServiceDetail: document.getElementById("timelapse-service-detail"),
  timelapseServiceMessage: document.getElementById("timelapse-service-message"),
  timelapseServiceRefresh: document.getElementById("timelapse-service-refresh"),
  timelapseServiceActions: document.getElementById("timelapse-service-actions"),
  timelapseExternalNote: document.getElementById("timelapse-external-note"),
  timelapseServiceStart: document.getElementById("timelapse-service-start"),
  timelapseServiceRestart: document.getElementById("timelapse-service-restart"),
  timelapseServiceStop: document.getElementById("timelapse-service-stop"),
  timelapseMediaCard: document.getElementById("timelapse-media-card"),
  timelapseMediaRefresh: document.getElementById("timelapse-media-refresh"),
  timelapseMediaNewFolder: document.getElementById("timelapse-media-new-folder"),
  timelapseMediaSort: document.getElementById("timelapse-media-sort"),
  timelapseMediaSummary: document.getElementById("timelapse-media-summary"),
  timelapseMediaPathDisplay: document.getElementById("timelapse-media-path-display"),
  timelapseMediaFolderList: document.getElementById("timelapse-media-folder-list"),
  timelapseMediaBreadcrumbs: document.getElementById("timelapse-media-breadcrumbs"),
  timelapseMediaFileList: document.getElementById("timelapse-media-file-list"),
  timelapseMediaStatus: document.getElementById("timelapse-media-status"),
  jobsMoveFileDialog: document.getElementById("jobs-move-file-dialog"),
  jobsMoveFileTitle: document.getElementById("jobs-move-file-title"),
  jobsMoveFileSelect: document.getElementById("jobs-move-file-select"),
  jobsMoveFileCancel: document.getElementById("jobs-move-file-cancel"),
  jobsMoveFileConfirm: document.getElementById("jobs-move-file-confirm"),
  spoolmanRefresh: document.getElementById("spoolman-refresh"),
  spoolmanChangeSpool: document.getElementById("spoolman-change-spool"),
  spoolmanFieldsGrid: document.getElementById("spoolman-fields-grid"),
  spoolmanProgressLinear: document.getElementById("spoolman-progress-linear"),
  spoolmanProgressLinearBar: document.getElementById("spoolman-progress-linear-bar"),
  spoolmanProgressRing: document.getElementById("spoolman-progress-ring"),
  spoolmanProgressRingValue: document.getElementById("spoolman-progress-ring-value"),
  spoolmanVisualFallback: document.getElementById("spoolman-visual-fallback"),
  spoolmanStatusMessage: document.getElementById("spoolman-status-message"),
  spoolmanSelectDialog: document.getElementById("spoolman-select-dialog"),
  spoolmanSelectClose: document.getElementById("spoolman-select-close"),
  spoolmanSelectId: document.getElementById("spoolman-select-id"),
  spoolmanSelectApply: document.getElementById("spoolman-select-apply"),
  spoolmanSelectClear: document.getElementById("spoolman-select-clear"),
  spoolmanSelectHelp: document.getElementById("spoolman-select-help"),
  pageTitle: document.getElementById("page-title"),
  connectionPill: document.getElementById("connection-pill"),
  connectionText: document.getElementById("connection-text"),
  printerDot: document.getElementById("printer-dot"),
  printerState: document.getElementById("printer-state"),
  statusStateChip: document.getElementById("status-state-chip"),
  statusStateDot: document.getElementById("status-state-dot"),
  statusPrinterState: document.getElementById("status-printer-state"),
  statusProgressRing: document.getElementById("status-progress-ring"),
  statusProgressRingText: document.getElementById("status-progress-ring-text"),
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
  statusHotendSummary: document.getElementById("status-hotend-summary"),
  statusBedSummary: document.getElementById("status-bed-summary"),
  statusFanSpeed: document.getElementById("status-fan-speed"),
  statusLayer: document.getElementById("status-layer"),
  runoutSensorList: document.getElementById("runout-sensor-list"),
  runoutSensorStatus: document.getElementById("runout-sensor-status"),
  statusClearFile: document.getElementById("status-clear-file"),
  statusPrintActions: document.getElementById("status-print-actions"),
  statusPrintPause: document.getElementById("status-print-pause"),
  statusPrintResume: document.getElementById("status-print-resume"),
  statusPrintCancel: document.getElementById("status-print-cancel"),
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
  headerUploadPrintBtn: document.getElementById("header-upload-print-btn"),
  jobsUploadInput: document.getElementById("jobs-upload-input"),
  jobsUploadFolderInput: document.getElementById("jobs-upload-folder-input"),
  jobsUploadPrintInput: document.getElementById("jobs-upload-print-input"),
  jobsNewFolder: document.getElementById("jobs-new-folder"),
  jobsNewFolderDirect: document.getElementById("jobs-new-folder-direct"),
  jobsSummary: document.getElementById("jobs-summary"),
  jobsFeaturePanel: document.getElementById("jobs-feature-panel"),
  jobsPathDisplay: document.getElementById("jobs-path-display"),
  jobsSortToggle: document.getElementById("jobs-sort-toggle"),
  jobsSortMenu: document.getElementById("jobs-sort-menu"),
  jobsColumnsToggle: document.getElementById("jobs-columns-toggle"),
  jobsColumnsMenu: document.getElementById("jobs-columns-menu"),
  jobsColumnsList: document.getElementById("jobs-columns-list"),
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
  historyCard: document.getElementById("history-card"),
  historyFeaturePanel: document.getElementById("history-feature-panel"),
  historySummary: document.getElementById("history-summary"),
  historyStatus: document.getElementById("history-status"),
  historySearch: document.getElementById("history-search"),
  historyStatusFilter: document.getElementById("history-status-filter"),
  historySort: document.getElementById("history-sort"),
  historyPageSize: document.getElementById("history-page-size"),
  historyLoadLimit: document.getElementById("history-load-limit"),
  historyColumnsToggle: document.getElementById("history-columns-toggle"),
  historyColumnsMenu: document.getElementById("history-columns-menu"),
  historyColumnsList: document.getElementById("history-columns-list"),
  historyRefresh: document.getElementById("history-refresh"),
  historyLoadAll: document.getElementById("history-load-all"),
  historyExportCsv: document.getElementById("history-export-csv"),
  historyRemoveSelected: document.getElementById("history-remove-selected"),
  historyRemoveAll: document.getElementById("history-remove-all"),
  historyTableWrap: document.getElementById("history-table-wrap"),
  historyTableHead: document.getElementById("history-table-head"),
  historyTableBody: document.getElementById("history-table-body"),
  historyPagePrev: document.getElementById("history-page-prev"),
  historyPageNext: document.getElementById("history-page-next"),
  historyPageLabel: document.getElementById("history-page-label"),
  historyResetStats: document.getElementById("history-reset-stats"),
  historyTimeDays: document.getElementById("history-time-days"),
  historyLengthKm: document.getElementById("history-length-km"),
  historyStatsTableBody: document.getElementById("history-stats-table-body"),
  historyStatusChartWrap: document.getElementById("history-status-chart-wrap"),
  historyStatusTableWrap: document.getElementById("history-status-table-wrap"),
  historyStatusTableBody: document.getElementById("history-status-table-body"),
  historyStatusViewChart: document.getElementById("history-status-view-chart"),
  historyStatusViewTable: document.getElementById("history-status-view-table"),
  historyStatsLoadAll: document.getElementById("history-stats-load-all"),
  historyStatusValueJobs: document.getElementById("history-status-value-jobs"),
  historyStatusValueFilament: document.getElementById("history-status-value-filament"),
  historyStatusValueTime: document.getElementById("history-status-value-time"),
  historyChartStatusCanvas: document.getElementById("history-chart-status-canvas"),
  historyChartTrendCanvas: document.getElementById("history-chart-trend-canvas"),
  historyChartTrendMeta: document.getElementById("history-chart-trend-meta"),
  historyTrendModeFilament: document.getElementById("history-trend-mode-filament"),
  historyTrendModePrinttime: document.getElementById("history-trend-mode-printtime"),
  prettyGcodeView: document.getElementById("view-pretty-gcode"),
  prettyGcodeCard: document.getElementById(KLIPPERVIEW_CARD_ID),
  prettyGcodeCanvas: document.getElementById("pretty-gcode-canvas"),
  prettyGcodeStatus: document.getElementById("pretty-gcode-status"),
  prettyGcodeFile: document.getElementById("pretty-gcode-file"),
  prettyGcodeFollow: document.getElementById("pretty-gcode-follow"),
  prettyGcodeReload: document.getElementById("pretty-gcode-reload"),
  prettyGcodeMode: document.getElementById("pretty-gcode-mode"),
  prettyGcodeLoadFile: document.getElementById("pretty-gcode-load-file"),
  prettyGcodeLive: document.getElementById("pretty-gcode-live"),
  prettyGcodeRewind: document.getElementById("pretty-gcode-rewind"),
  prettyGcodePlayPause: document.getElementById("pretty-gcode-play-pause"),
  prettyGcodeFastForward: document.getElementById("pretty-gcode-fast-forward"),
  prettyGcodeShowMirror: document.getElementById("pretty-gcode-show-mirror"),
  prettyGcodeShowNozzle: document.getElementById("pretty-gcode-show-nozzle"),
  prettyGcodeOrbitIdle: document.getElementById("pretty-gcode-orbit-idle"),
  prettyGcodeProgress: document.getElementById("pretty-gcode-progress"),
  prettyGcodeLayerSlider: document.getElementById("pretty-gcode-layer-slider"),
  prettyGcodeLayerTop: document.getElementById("pretty-gcode-layer-top"),
  prettyGcodeLayerBottom: document.getElementById("pretty-gcode-layer-bottom"),
  prettyGcodeLoadInput: document.getElementById("pretty-gcode-load-input"),
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
  controlsEndstopsQuery: document.getElementById("controls-endstops-query"),
  controlsEndstopsSummary: document.getElementById("controls-endstops-summary"),
  controlsEndstopsList: document.getElementById("controls-endstops-list"),
  controlsEndstopsStatus: document.getElementById("controls-endstops-status"),
  machineLogFilesRefresh: document.getElementById("machine-log-files-refresh"),
  machineLogFilesDeleteAll: document.getElementById("machine-log-files-delete-all"),
  machineLogFilesSummary: document.getElementById("machine-log-files-summary"),
  machineLogFilesList: document.getElementById("machine-log-files-list"),
  machineLogFilesStatus: document.getElementById("machine-log-files-status"),
  settingsForm: document.getElementById("settings-form"),
  moonrakerUrl: document.getElementById("moonraker-url"),
  themeCommunityPreset: document.getElementById("theme-community-preset"),
  themeCommunityApply: document.getElementById("theme-community-apply"),
  themePaletteReset: document.getElementById("theme-palette-reset"),
  themeColorBg: document.getElementById("theme-color-bg"),
  themeColorBgSoft: document.getElementById("theme-color-bg-soft"),
  themeColorText: document.getElementById("theme-color-text"),
  themeColorMuted: document.getElementById("theme-color-muted"),
  themeColorAccent: document.getElementById("theme-color-accent"),
  themeColorAccent2: document.getElementById("theme-color-accent-2"),
  themeColorDanger: document.getElementById("theme-color-danger"),
  interfaceCompact: document.getElementById("interface-compact"),
  interfaceDensity: document.getElementById("interface-density"),
  interfaceBgImageEnabled: document.getElementById("interface-bg-image-enabled"),
  interfaceBgImageUrl: document.getElementById("interface-bg-image-url"),
  interfaceBgImageApply: document.getElementById("interface-bg-image-apply"),
  interfaceBgImageClear: document.getElementById("interface-bg-image-clear"),
  settingsWarningCpuThrottled: document.getElementById("settings-warning-cpu-throttled"),
  settingsWarningStepperDriverOverheating: document.getElementById("settings-warning-stepper-driver-overheating"),
  settingsWarningReset: document.getElementById("settings-warning-reset"),
  settingsConsoleDirection: document.getElementById("settings-console-direction"),
  settingsConsoleEntryDesign: document.getElementById("settings-console-entry-design"),
  settingsConsoleHeight: document.getElementById("settings-console-height"),
  settingsConsoleHideTemps: document.getElementById("settings-console-hide-temps"),
  settingsConsoleHideTimelapse: document.getElementById("settings-console-hide-timelapse"),
  settingsConsoleFilterAdd: document.getElementById("settings-console-filter-add"),
  settingsConsoleFilterEditor: document.getElementById("settings-console-filter-editor"),
  settingsConsoleFilterName: document.getElementById("settings-console-filter-name"),
  settingsConsoleFilterRegex: document.getElementById("settings-console-filter-regex"),
  settingsConsoleFilterEnabled: document.getElementById("settings-console-filter-enabled"),
  settingsConsoleFilterSave: document.getElementById("settings-console-filter-save"),
  settingsConsoleFilterCancel: document.getElementById("settings-console-filter-cancel"),
  settingsConsoleFilterList: document.getElementById("settings-console-filter-list"),
  settingsThermalPresetAdd: document.getElementById("settings-thermal-preset-add"),
  settingsThermalPresetList: document.getElementById("settings-thermal-preset-list"),
  settingsThermalPresetDialog: document.getElementById("settings-thermal-preset-dialog"),
  settingsThermalPresetDialogTitle: document.getElementById("settings-thermal-preset-dialog-title"),
  settingsThermalPresetClose: document.getElementById("settings-thermal-preset-close"),
  settingsThermalPresetName: document.getElementById("settings-thermal-preset-name"),
  settingsThermalPresetHotendActive: document.getElementById("settings-thermal-preset-hotend-active"),
  settingsThermalPresetHotendValue: document.getElementById("settings-thermal-preset-hotend-value"),
  settingsThermalPresetBedActive: document.getElementById("settings-thermal-preset-bed-active"),
  settingsThermalPresetBedValue: document.getElementById("settings-thermal-preset-bed-value"),
  settingsThermalPresetGcode: document.getElementById("settings-thermal-preset-gcode"),
  settingsThermalPresetSave: document.getElementById("settings-thermal-preset-save"),
  settingsThermalPresetCancel: document.getElementById("settings-thermal-preset-cancel"),
  settingsTimelapseRefresh: document.getElementById("settings-timelapse-refresh"),
  settingsTimelapseStatus: document.getElementById("settings-timelapse-status"),
  settingsTimelapseUnavailable: document.getElementById("settings-timelapse-unavailable"),
  settingsTimelapseCameraWarning: document.getElementById("settings-timelapse-camera-warning"),
  settingsTimelapseEnabled: document.getElementById("settings-timelapse-enabled"),
  settingsTimelapseAutorender: document.getElementById("settings-timelapse-autorender"),
  settingsTimelapseCamera: document.getElementById("settings-timelapse-camera"),
  settingsTimelapseMode: document.getElementById("settings-timelapse-mode"),
  settingsTimelapseHyperlapseCycle: document.getElementById("settings-timelapse-hyperlapse-cycle"),
  settingsTimelapsePreviewImage: document.getElementById("settings-timelapse-previewimage"),
  settingsTimelapseSaveFrames: document.getElementById("settings-timelapse-saveframes"),
  settingsTimelapseStreamDelayCompensation: document.getElementById("settings-timelapse-stream-delay-compensation"),
  settingsTimelapseGcodeVerbose: document.getElementById("settings-timelapse-gcode-verbose"),
  settingsTimelapseParkhead: document.getElementById("settings-timelapse-parkhead"),
  settingsTimelapseParkpos: document.getElementById("settings-timelapse-parkpos"),
  settingsTimelapseParkCustomPosX: document.getElementById("settings-timelapse-park-custom-pos-x"),
  settingsTimelapseParkCustomPosY: document.getElementById("settings-timelapse-park-custom-pos-y"),
  settingsTimelapseParkCustomPosDz: document.getElementById("settings-timelapse-park-custom-pos-dz"),
  settingsTimelapseParkTravelSpeed: document.getElementById("settings-timelapse-park-travel-speed"),
  settingsTimelapseFwRetract: document.getElementById("settings-timelapse-fw-retract"),
  settingsTimelapseParkRetractSpeed: document.getElementById("settings-timelapse-park-retract-speed"),
  settingsTimelapseParkRetractDistance: document.getElementById("settings-timelapse-park-retract-distance"),
  settingsTimelapseParkExtrudeSpeed: document.getElementById("settings-timelapse-park-extrude-speed"),
  settingsTimelapseParkExtrudeDistance: document.getElementById("settings-timelapse-park-extrude-distance"),
  settingsTimelapseParkTime: document.getElementById("settings-timelapse-park-time"),
  settingsTimelapseVariableFps: document.getElementById("settings-timelapse-variable-fps"),
  settingsTimelapseTargetLength: document.getElementById("settings-timelapse-targetlength"),
  settingsTimelapseVariableFpsMin: document.getElementById("settings-timelapse-variable-fps-min"),
  settingsTimelapseVariableFpsMax: document.getElementById("settings-timelapse-variable-fps-max"),
  settingsTimelapseOutputFramerate: document.getElementById("settings-timelapse-output-framerate"),
  settingsTimelapseDuplicateLastFrame: document.getElementById("settings-timelapse-duplicatelastframe"),
  settingsTimelapseConstantRateFactor: document.getElementById("settings-timelapse-constant-rate-factor"),
  settingsTimelapsePixelformat: document.getElementById("settings-timelapse-pixelformat"),
  settingsTimelapseTimeFormatCode: document.getElementById("settings-timelapse-time-format-code"),
  settingsTimelapseExtraOutputParams: document.getElementById("settings-timelapse-extraoutputparams"),
  settingsTimelapseHyperlapseCycleRow: document.getElementById("settings-timelapse-hyperlapse-cycle-row"),
  settingsTimelapseParkOptions: document.getElementById("settings-timelapse-park-options"),
  settingsTimelapseParkPosXRow: document.getElementById("settings-timelapse-park-pos-x-row"),
  settingsTimelapseParkPosYRow: document.getElementById("settings-timelapse-park-pos-y-row"),
  settingsTimelapseParkPosDzRow: document.getElementById("settings-timelapse-park-pos-dz-row"),
  settingsTimelapseRetractOptions: document.getElementById("settings-timelapse-retract-options"),
  settingsTimelapseVariableFpsOptions: document.getElementById("settings-timelapse-variable-fps-options"),
  settingsTimelapseStaticFpsOptions: document.getElementById("settings-timelapse-static-fps-options"),
  settingsMacrosCategoryAdd: document.getElementById("settings-macros-category-add"),
  settingsMacrosCategoryList: document.getElementById("settings-macros-category-list"),
  settingsMacrosSelectedCategory: document.getElementById("settings-macros-selected-category"),
  settingsMacrosSearch: document.getElementById("settings-macros-search"),
  settingsMacrosAllOn: document.getElementById("settings-macros-all-on"),
  settingsMacrosAllOff: document.getElementById("settings-macros-all-off"),
  settingsMacrosItemList: document.getElementById("settings-macros-item-list"),
  settingsMacroDialog: document.getElementById("settings-macro-dialog"),
  settingsMacroDialogTitle: document.getElementById("settings-macro-dialog-title"),
  settingsMacroClose: document.getElementById("settings-macro-close"),
  settingsMacroAlias: document.getElementById("settings-macro-alias"),
  settingsMacroCategory: document.getElementById("settings-macro-category"),
  settingsMacroColor: document.getElementById("settings-macro-color"),
  settingsMacroColorReset: document.getElementById("settings-macro-color-reset"),
  settingsMacroDisabledWhilePrinting: document.getElementById("settings-macro-disabled-while-printing"),
  settingsMacroVisible: document.getElementById("settings-macro-visible"),
  settingsMacroSave: document.getElementById("settings-macro-save"),
  settingsMacroCancel: document.getElementById("settings-macro-cancel"),
  settingsSpoolmanAutoDialog: document.getElementById("settings-spoolman-auto-dialog"),
  settingsSpoolmanAutoCamera: document.getElementById("settings-spoolman-auto-camera"),
  settingsSpoolmanPreferDeviceCamera: document.getElementById("settings-spoolman-prefer-device-camera"),
  settingsSpoolmanAutoSelectOnMatch: document.getElementById("settings-spoolman-auto-select-on-match"),
  settingsSpoolmanWarnNotEnoughFilament: document.getElementById("settings-spoolman-warn-not-enough-filament"),
  settingsSpoolmanWarnFilamentMismatch: document.getElementById("settings-spoolman-warn-filament-mismatch"),
  settingsSpoolmanRemainingUnit: document.getElementById("settings-spoolman-remaining-unit"),
  settingsSpoolmanCardFields: document.getElementById("settings-spoolman-card-fields"),
  settingsSpoolmanCardFieldToggles: [...document.querySelectorAll("[data-spoolman-card-field]")],
  settingsSpoolmanFieldsApply: document.getElementById("settings-spoolman-fields-apply"),
  settingsSpoolmanReset: document.getElementById("settings-spoolman-reset"),
  settingsSpoolmanStatus: document.getElementById("settings-spoolman-status"),
  settingsDashboardViewportButtons: [...document.querySelectorAll(".settings-dashboard-viewport-btn")],
  settingsDashboardColumns: document.getElementById("settings-dashboard-columns"),
  settingsDashboardReset: document.getElementById("settings-dashboard-reset"),
  dashShowPrintProgress: document.getElementById("dash-show-print-progress"),
  dashShowTemperatures: document.getElementById("dash-show-temperatures"),
  dashShowMotion: document.getElementById("dash-show-motion"),
  dashShowQuickCommands: document.getElementById("dash-show-quick-commands"),
  dashShowMacros: document.getElementById("dash-show-macros"),
  dashShowRunoutSensors: document.getElementById("dash-show-runout-sensors"),
  dashShowMainCamera: document.getElementById("dash-show-main-camera"),
  dashShowToolheadCamera: document.getElementById("dash-show-toolhead-camera"),
  dashShowConsole: document.getElementById("dash-show-console"),
  dashShowKlipperView: document.getElementById("dash-show-klipperview"),
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
  cardRunoutSensors: document.getElementById("card-runout-sensors"),
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
  controlsCard: document.getElementById("card-motion"),
  controlsKeyboardSurface: document.getElementById("controls-keyboard-surface"),
  controlsJogButtons: [...document.querySelectorAll("[data-control-jog-axis]")],
  controlsHomeButtons: [...document.querySelectorAll("[data-control-home]")],
  controlsDistanceButtons: [...document.querySelectorAll("[data-jog-distance]")],
  controlsFeedrateInput: document.getElementById("controls-feedrate-input"),
  controlsFeedrateSet: document.getElementById("controls-feedrate-set"),
  controlsFlowrateInput: document.getElementById("controls-flowrate-input"),
  controlsFlowrateSet: document.getElementById("controls-flowrate-set"),
  controlsExtrusionAmount: document.getElementById("controls-extrusion-amount"),
  controlsExtrude: document.getElementById("controls-extrude"),
  controlsRetract: document.getElementById("controls-retract"),
  controlsToolRow: document.getElementById("controls-tool-row"),
  controlsToolSelect: document.getElementById("controls-tool-select"),
  controlsToolSet: document.getElementById("controls-tool-set"),
  controlsMotorsOff: document.getElementById("controls-motors-off"),
  controlsFanOn: document.getElementById("controls-fan-on"),
  controlsFanOff: document.getElementById("controls-fan-off"),
  controlsFanSpeed: document.getElementById("controls-fan-speed"),
  controlsFanSpeedValue: document.getElementById("controls-fan-speed-value"),
  controlsZOffsetSection: document.getElementById("controls-zoffset-section"),
  controlsZOffsetValue: document.getElementById("controls-zoffset-value"),
  controlsZOffsetUpGroup: document.getElementById("controls-zoffset-up-group"),
  controlsZOffsetDownGroup: document.getElementById("controls-zoffset-down-group"),
  controlsZOffsetClear: document.getElementById("controls-zoffset-clear"),
  controlsZOffsetSave: document.getElementById("controls-zoffset-save"),
  controlsZOffsetSaveDialog: document.getElementById("controls-zoffset-save-dialog"),
  controlsZOffsetSaveDialogDescription: document.getElementById("controls-zoffset-save-dialog-description"),
  controlsZOffsetSaveDialogSaveConfig: document.getElementById("controls-zoffset-save-dialog-save-config"),
  controlsZOffsetSaveDialogLater: document.getElementById("controls-zoffset-save-dialog-later"),
  controlsZOffsetSaveDialogOk: document.getElementById("controls-zoffset-save-dialog-ok"),
  manualProbeDialog: document.getElementById("manual-probe-dialog"),
  manualProbeClose: document.getElementById("manual-probe-close"),
  manualProbeZLower: document.getElementById("manual-probe-z-lower"),
  manualProbeZCurrent: document.getElementById("manual-probe-z-current"),
  manualProbeZUpper: document.getElementById("manual-probe-z-upper"),
  manualProbeQuickButtons: [...document.querySelectorAll("[data-manual-probe-testz]")],
  manualProbeAdvancedUp: document.getElementById("manual-probe-advanced-up"),
  manualProbeAdvancedDown: document.getElementById("manual-probe-advanced-down"),
  manualProbeAbort: document.getElementById("manual-probe-abort"),
  manualProbeAccept: document.getElementById("manual-probe-accept"),
  quickGcode: [...document.querySelectorAll("[data-gcode]")],
};

let runtimeDashboardViewport = getDashboardRuntimeViewport();
let hasWiredGlobalEvents = false;
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
let printHistoryRefreshTimer = null;
let settingsSubnavScrollRaf = null;
let prettyGcodeSimulationTimer = null;
let prettyGcodeThreeState = {
  renderer: null,
  scene: null,
  camera: null,
  controls: null,
  animationFrame: null,
  geometryDirty: true,
  renderRequested: true,
  layerEntries: [],
  printGroup: null,
  mirrorGroup: null,
  bedGrid: null,
  bedPlane: null,
  nozzleMesh: null,
  bedCenter: { x: 0, y: 0, z: 0 },
  bedSize: { x: 220, z: 220, y: 220 },
  lastInteractionMs: 0,
};

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

function loadStoredStatusClearedFilename() {
  return normalizeGcodePath(localStorage.getItem(STATUS_CLEARED_FILENAME_STORAGE_KEY) || "");
}

function persistStatusClearedFilename(filename) {
  const normalized = normalizeGcodePath(filename);

  if (normalized) {
    localStorage.setItem(STATUS_CLEARED_FILENAME_STORAGE_KEY, normalized);
  } else {
    localStorage.removeItem(STATUS_CLEARED_FILENAME_STORAGE_KEY);
  }

  return normalized;
}

function normalizeThemeColorValue(value, fallback) {
  const normalized = String(value || "").trim().toLowerCase();

  if (/^#[0-9a-f]{6}$/.test(normalized)) {
    return normalized;
  }

  if (/^#[0-9a-f]{3}$/.test(normalized)) {
    return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
  }

  return fallback;
}

function getThemeBasePalette(themeName) {
  const normalizedTheme = INTERFACE_THEMES.includes(themeName) ? themeName : DEFAULT_INTERFACE_THEME;
  const source = INTERFACE_THEME_BASE_PALETTES[normalizedTheme] || INTERFACE_THEME_BASE_PALETTES[DEFAULT_INTERFACE_THEME];
  return { ...source };
}

function getThemeBasePresetOptionId(themeName) {
  const normalizedTheme = INTERFACE_THEMES.includes(themeName) ? themeName : DEFAULT_INTERFACE_THEME;
  return `${INTERFACE_THEME_BASE_PRESET_PREFIX}${normalizedTheme}`;
}

function parseThemeBasePresetOptionId(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized.startsWith(INTERFACE_THEME_BASE_PRESET_PREFIX)) return null;
  const themeName = normalized.slice(INTERFACE_THEME_BASE_PRESET_PREFIX.length);
  return INTERFACE_THEMES.includes(themeName) ? themeName : null;
}

function isThemePaletteMatchingBaseTheme(themeName, palette) {
  const basePalette = getThemeBasePalette(themeName);
  const normalizedPalette = normalizeThemePalette(palette, themeName);
  return INTERFACE_THEME_COLOR_FIELDS.every(
    (field) => normalizedPalette[field.key] === basePalette[field.key]
  );
}

function normalizeThemePalette(palette, themeName) {
  const fallback = getThemeBasePalette(themeName);

  if (!palette || typeof palette !== "object" || Array.isArray(palette)) {
    return fallback;
  }

  const normalized = { ...fallback };
  INTERFACE_THEME_COLOR_FIELDS.forEach((field) => {
    normalized[field.key] = normalizeThemeColorValue(palette[field.key], fallback[field.key]);
  });

  return normalized;
}

function loadStoredThemePalette(themeName) {
  const fallback = getThemeBasePalette(themeName);
  const raw = localStorage.getItem(INTERFACE_THEME_PALETTE_STORAGE_KEY);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return normalizeThemePalette(parsed, themeName);
  } catch {
    return fallback;
  }
}

function loadStoredThemePreset() {
  const raw = String(localStorage.getItem(INTERFACE_THEME_PRESET_STORAGE_KEY) || "").trim();
  if (COMMUNITY_THEME_PRESET_IDS.includes(raw)) return raw;
  return INTERFACE_THEME_PRESET_CUSTOM;
}

function normalizeInterfaceBackgroundImageUrl(value) {
  const normalized = String(value || "").trim();
  return normalized.length <= 8192 ? normalized : normalized.slice(0, 8192);
}

function loadStoredInterfaceBackgroundImageUrl() {
  return normalizeInterfaceBackgroundImageUrl(localStorage.getItem(INTERFACE_BACKGROUND_IMAGE_URL_STORAGE_KEY));
}

function createInterfaceState() {
  const theme = loadStoredChoice("interface_theme", DEFAULT_INTERFACE_THEME, INTERFACE_THEMES);
  return {
    theme,
    compact: loadStoredBool("interface_compact", false),
    density: loadStoredChoice("interface_density", "comfortable", INTERFACE_DENSITIES),
    sidebarCollapsed: loadStoredBool("interface_sidebar_collapsed", false),
    machineSideCollapsed: loadStoredBool(MACHINE_SIDE_COLLAPSED_STORAGE_KEY, false),
    themePreset: loadStoredThemePreset(),
    themePalette: loadStoredThemePalette(theme),
    backgroundImageEnabled: loadStoredBool(INTERFACE_BACKGROUND_IMAGE_ENABLED_STORAGE_KEY, false),
    backgroundImageUrl: loadStoredInterfaceBackgroundImageUrl(),
  };
}

function normalizeZOffsetSaveOption(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return CONTROL_Z_OFFSET_SAVE_OPTION_VALUES.includes(normalized) ? normalized : null;
}

function loadStoredPositiveNumber(key, fallback, { min = 0.1, max = Infinity } = {}) {
  const raw = Number(localStorage.getItem(key));
  if (!Number.isFinite(raw)) return fallback;
  if (raw < min || raw > max) return fallback;
  return raw;
}

function ensureFileInputPicker(input) {
  if (!(input instanceof HTMLInputElement) || input.type !== "file") return null;
  if (input.hasAttribute("hidden")) {
    input.removeAttribute("hidden");
  }
  input.classList.add("file-input-proxy");
  return input;
}
function openFileInputPicker(input) {
  const picker = ensureFileInputPicker(input);
  if (!picker || picker.disabled) return;
  if (typeof picker.showPicker === "function") {
    try {
      picker.showPicker();
      return;
    } catch {
      // Fall back to click for browsers that reject showPicker.
    }
  }
  picker.click();
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

function normalizeTimelapseMediaSort(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return TIMELAPSE_MEDIA_SORT_VALUES.includes(normalized) ? normalized : "modified_desc";
}

function loadStoredTimelapseMediaSort() {
  return normalizeTimelapseMediaSort(localStorage.getItem(TIMELAPSE_MEDIA_SORT_STORAGE_KEY));
}

function loadStoredTimelapseMediaDirectory() {
  return normalizeTimelapseMediaDirectory(localStorage.getItem(TIMELAPSE_MEDIA_DIRECTORY_STORAGE_KEY));
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

function normalizePrintHistorySort(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PRINT_HISTORY_SORT_VALUES.includes(normalized) ? normalized : "start_desc";
}

function normalizePrintHistoryStatusFilter(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PRINT_HISTORY_STATUS_FILTER_VALUES.includes(normalized) ? normalized : "all";
}

function normalizePrintHistoryPageSize(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && PRINT_HISTORY_PAGE_SIZE_VALUES.includes(numeric)) {
    return numeric;
  }
  return 15;
}

function normalizePrintHistoryLoadLimit(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && PRINT_HISTORY_LOAD_LIMIT_VALUES.includes(numeric)) {
    return numeric;
  }
  return 50;
}

function normalizePrintHistoryStatusView(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PRINT_HISTORY_STATUS_VIEW_VALUES.includes(normalized) ? normalized : "chart";
}

function normalizePrintHistoryStatusValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PRINT_HISTORY_STATUS_VALUE_VALUES.includes(normalized) ? normalized : "jobs";
}

function normalizePrintHistoryTrendMode(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PRINT_HISTORY_TREND_MODE_VALUES.includes(normalized) ? normalized : "filament_usage";
}

function normalizePrintHistoryVisibleColumns(value) {
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
    .filter((entry) => PRINT_HISTORY_COLUMN_KEYS.includes(entry));

  const unique = [...new Set(normalized)];
  return unique.length ? unique : [...PRINT_HISTORY_DEFAULT_VISIBLE_COLUMNS];
}

function loadStoredPrintHistorySearch() {
  return String(localStorage.getItem(PRINT_HISTORY_SEARCH_STORAGE_KEY) || "").trim();
}

function loadStoredPrintHistoryStatusFilter() {
  return normalizePrintHistoryStatusFilter(localStorage.getItem(PRINT_HISTORY_STATUS_STORAGE_KEY));
}

function loadStoredPrintHistorySort() {
  return normalizePrintHistorySort(localStorage.getItem(PRINT_HISTORY_SORT_STORAGE_KEY));
}

function loadStoredPrintHistoryPageSize() {
  return normalizePrintHistoryPageSize(localStorage.getItem(PRINT_HISTORY_PAGE_SIZE_STORAGE_KEY));
}

function loadStoredPrintHistoryVisibleColumns() {
  return normalizePrintHistoryVisibleColumns(localStorage.getItem(PRINT_HISTORY_COLUMNS_STORAGE_KEY));
}

function loadStoredPrintHistoryTimeInDays() {
  return loadStoredBool(PRINT_HISTORY_TIME_DAYS_STORAGE_KEY, false);
}

function loadStoredPrintHistoryLengthInKilometers() {
  return loadStoredBool(PRINT_HISTORY_LENGTH_KM_STORAGE_KEY, false);
}

function loadStoredPrintHistoryLoadLimit() {
  return normalizePrintHistoryLoadLimit(localStorage.getItem(PRINT_HISTORY_LOAD_LIMIT_STORAGE_KEY));
}

function loadStoredPrintHistoryStatusView() {
  return normalizePrintHistoryStatusView(localStorage.getItem(PRINT_HISTORY_STATUS_VIEW_STORAGE_KEY));
}

function loadStoredPrintHistoryStatusValue() {
  return normalizePrintHistoryStatusValue(localStorage.getItem(PRINT_HISTORY_STATUS_VALUE_STORAGE_KEY));
}

function loadStoredPrintHistoryTrendMode() {
  return normalizePrintHistoryTrendMode(localStorage.getItem(PRINT_HISTORY_TREND_MODE_STORAGE_KEY));
}

function loadStoredWarningsSettings() {
  return {
    warnOnCpuThrottled: loadStoredBool(WARNINGS_CPU_THROTTLED_STORAGE_KEY, WARNINGS_SETTINGS_DEFAULTS.warnOnCpuThrottled),
    warnOnStepperDriverOverheating: loadStoredBool(
      WARNINGS_STEPPER_DRIVER_OVERHEATING_STORAGE_KEY,
      WARNINGS_SETTINGS_DEFAULTS.warnOnStepperDriverOverheating
    ),
  };
}

function normalizeWarningsSettings(candidate) {
  const source = candidate && typeof candidate === "object" ? candidate : {};
  return {
    warnOnCpuThrottled: source.warnOnCpuThrottled !== false,
    warnOnStepperDriverOverheating: source.warnOnStepperDriverOverheating !== false,
  };
}

function persistWarningsSettings() {
  localStorage.setItem(WARNINGS_CPU_THROTTLED_STORAGE_KEY, String(state.warnings.warnOnCpuThrottled));
  localStorage.setItem(
    WARNINGS_STEPPER_DRIVER_OVERHEATING_STORAGE_KEY,
    String(state.warnings.warnOnStepperDriverOverheating)
  );
}

function syncWarningsSettingsControls() {
  if (els.settingsWarningCpuThrottled) {
    els.settingsWarningCpuThrottled.checked = !!state.warnings.warnOnCpuThrottled;
  }

  if (els.settingsWarningStepperDriverOverheating) {
    els.settingsWarningStepperDriverOverheating.checked = !!state.warnings.warnOnStepperDriverOverheating;
  }
}
function normalizeThermalPresetTemperature(valueCandidate, sensorKey) {
  const max = THERMAL_PRESET_MAX_VALUES[sensorKey] || TEMPERATURE_DEFAULT_MAX;
  const numeric = Number(valueCandidate);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(max, Math.round(numeric)));
}

function normalizeThermalPresetEntry(candidate, index = 0) {
  const source = candidate && typeof candidate === "object" ? candidate : {};
  const sourceValues = source.values && typeof source.values === "object" ? source.values : {};
  const fallbackId = Date.now() + index;
  const idCandidate = Number(source.id);

  const values = {
    hotend: {
      type: "heater",
      active: sourceValues.hotend?.active !== false,
      value: normalizeThermalPresetTemperature(sourceValues.hotend?.value, "hotend"),
    },
    bed: {
      type: "heater",
      active: sourceValues.bed?.active !== false,
      value: normalizeThermalPresetTemperature(sourceValues.bed?.value, "bed"),
    },
  };

  return {
    id: Number.isFinite(idCandidate) ? idCandidate : fallbackId,
    name: String(source.name || "").trim().slice(0, 64),
    values,
    gcode: String(source.gcode || "").trim().slice(0, 4000),
  };
}

function cloneThermalPresetEntry(entry) {
  const normalized = normalizeThermalPresetEntry(entry);
  return {
    id: normalized.id,
    name: normalized.name,
    values: {
      hotend: { ...normalized.values.hotend },
      bed: { ...normalized.values.bed },
    },
    gcode: normalized.gcode,
  };
}

function createBlankThermalPresetEntry() {
  return {
    id: -1,
    name: "",
    values: {
      hotend: { type: "heater", active: true, value: 0 },
      bed: { type: "heater", active: true, value: 0 },
    },
    gcode: "",
  };
}

function loadStoredThermalPresets() {
  const raw = localStorage.getItem(THERMAL_PRESETS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry, index) => normalizeThermalPresetEntry(entry, index));
  } catch {
    return [];
  }
}

function persistThermalPresets() {
  const normalized = (Array.isArray(state.thermalPresets) ? state.thermalPresets : [])
    .map((entry, index) => normalizeThermalPresetEntry(entry, index));

  state.thermalPresets = normalized;
  localStorage.setItem(THERMAL_PRESETS_STORAGE_KEY, JSON.stringify(normalized));
}

function buildThermalPresetSummary(preset) {
  const parts = [];

  THERMAL_PRESET_SENSOR_KEYS.forEach((sensorKey) => {
    const entry = preset?.values?.[sensorKey];
    if (!entry?.active) return;
    const value = normalizeThermalPresetTemperature(entry.value, sensorKey);
    parts.push(`${THERMAL_PRESET_SENSOR_LABELS[sensorKey]}: ${value}\u00B0C`);
  });

  return parts.length ? parts.join(" | ") : "No active targets.";
}

function renderThermalPresetSettingsList() {
  const list = els.settingsThermalPresetList;
  if (!list) return;

  list.replaceChildren();

  const presets = Array.isArray(state.thermalPresets) ? state.thermalPresets : [];
  if (!presets.length) {
    const empty = document.createElement("p");
    empty.className = "muted settings-presets-empty";
    empty.textContent = "No thermal presets configured.";
    list.appendChild(empty);
    return;
  }

  presets.forEach((preset) => {
    const row = document.createElement("div");
    row.className = "settings-thermal-preset-item";

    const meta = document.createElement("button");
    meta.type = "button";
    meta.className = "settings-thermal-preset-meta";

    const title = document.createElement("strong");
    title.textContent = preset.name || "Untitled preset";

    const subtitle = document.createElement("span");
    subtitle.textContent = buildThermalPresetSummary(preset);

    meta.append(title, subtitle);
    meta.addEventListener("click", () => {
      openThermalPresetDialog(preset.id);
    });

    const actions = document.createElement("div");
    actions.className = "settings-thermal-preset-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => {
      openThermalPresetDialog(preset.id);
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => {
      deleteThermalPreset(preset.id);
    });

    actions.append(edit, remove);
    row.append(meta, actions);
    list.appendChild(row);
  });
}

function syncThermalPresetDialogInputs() {
  const draft = state.thermalPresetDialogDraft;
  if (!draft) return;

  if (els.settingsThermalPresetName) {
    els.settingsThermalPresetName.value = draft.name || "";
  }

  const hotendActive = !!draft.values?.hotend?.active;
  const bedActive = !!draft.values?.bed?.active;

  if (els.settingsThermalPresetHotendActive) {
    els.settingsThermalPresetHotendActive.checked = hotendActive;
  }

  if (els.settingsThermalPresetBedActive) {
    els.settingsThermalPresetBedActive.checked = bedActive;
  }

  if (els.settingsThermalPresetHotendValue) {
    els.settingsThermalPresetHotendValue.value = String(normalizeThermalPresetTemperature(draft.values?.hotend?.value, "hotend"));
    els.settingsThermalPresetHotendValue.disabled = !hotendActive;
  }

  if (els.settingsThermalPresetBedValue) {
    els.settingsThermalPresetBedValue.value = String(normalizeThermalPresetTemperature(draft.values?.bed?.value, "bed"));
    els.settingsThermalPresetBedValue.disabled = !bedActive;
  }

  if (els.settingsThermalPresetGcode) {
    els.settingsThermalPresetGcode.value = draft.gcode || "";
  }
}

function updateThermalPresetDraftFromInputs() {
  const draft = state.thermalPresetDialogDraft;
  if (!draft) return null;

  draft.name = String(els.settingsThermalPresetName?.value || "").trim().slice(0, 64);
  draft.gcode = String(els.settingsThermalPresetGcode?.value || "").trim().slice(0, 4000);
  draft.values.hotend.active = !!els.settingsThermalPresetHotendActive?.checked;
  draft.values.bed.active = !!els.settingsThermalPresetBedActive?.checked;
  draft.values.hotend.value = normalizeThermalPresetTemperature(els.settingsThermalPresetHotendValue?.value, "hotend");
  draft.values.bed.value = normalizeThermalPresetTemperature(els.settingsThermalPresetBedValue?.value, "bed");
  return draft;
}

function openThermalPresetDialog(presetId = null) {
  if (!els.settingsThermalPresetDialog) return;

  const numericId = Number(presetId);
  const source = Number.isFinite(numericId)
    ? state.thermalPresets.find((preset) => preset.id === numericId)
    : null;

  state.thermalPresetDialogPresetId = source ? source.id : null;
  state.thermalPresetDialogDraft = source
    ? cloneThermalPresetEntry(source)
    : createBlankThermalPresetEntry();

  if (els.settingsThermalPresetDialogTitle) {
    els.settingsThermalPresetDialogTitle.textContent = source ? "Edit Thermal Preset" : "Add Thermal Preset";
  }

  syncThermalPresetDialogInputs();

  if (typeof els.settingsThermalPresetDialog.showModal === "function") {
    if (!els.settingsThermalPresetDialog.open) {
      els.settingsThermalPresetDialog.showModal();
    }
  } else {
    els.settingsThermalPresetDialog.setAttribute("open", "open");
  }
}

function closeThermalPresetDialog() {
  if (!els.settingsThermalPresetDialog) return;

  if (els.settingsThermalPresetDialog.open && typeof els.settingsThermalPresetDialog.close === "function") {
    els.settingsThermalPresetDialog.close();
  } else {
    els.settingsThermalPresetDialog.removeAttribute("open");
    state.thermalPresetDialogPresetId = null;
    state.thermalPresetDialogDraft = null;
  }
}

function saveThermalPresetDialog() {
  const draft = updateThermalPresetDraftFromInputs();
  if (!draft) return;

  if (!draft.name) {
    appendConsole("Thermal preset name is required.", "warn");
    els.settingsThermalPresetName?.focus();
    return;
  }

  if (!draft.values.hotend.active && !draft.values.bed.active) {
    appendConsole("Enable at least one target (hotend or bed).", "warn");
    return;
  }

  const id = Number.isFinite(state.thermalPresetDialogPresetId)
    ? state.thermalPresetDialogPresetId
    : Date.now();

  const normalized = normalizeThermalPresetEntry({
    ...draft,
    id,
  });

  const existingIndex = state.thermalPresets.findIndex((preset) => preset.id === normalized.id);

  if (existingIndex >= 0) {
    state.thermalPresets[existingIndex] = normalized;
  } else {
    state.thermalPresets.push(normalized);
  }

  persistThermalPresets();
  renderThermalPresetSettingsList();
  buildTemperatureTargetMenus();
  closeThermalPresetDialog();

  appendConsole(
    existingIndex >= 0
      ? `Thermal preset updated: ${normalized.name}.`
      : `Thermal preset added: ${normalized.name}.`,
    "info"
  );
}

function deleteThermalPreset(presetId) {
  const numericId = Number(presetId);
  if (!Number.isFinite(numericId)) return;

  const preset = state.thermalPresets.find((entry) => entry.id === numericId);
  if (!preset) return;

  const presetName = preset.name || "Untitled preset";
  const confirmed = window.confirm(`Delete thermal preset "${presetName}"?`);
  if (!confirmed) return;

  state.thermalPresets = state.thermalPresets.filter((entry) => entry.id !== numericId);
  persistThermalPresets();
  renderThermalPresetSettingsList();
  buildTemperatureTargetMenus();

  appendConsole(`Thermal preset deleted: ${presetName}.`, "info");
}

function setTimelapseSettingsStatus(message, level = "info") {
  state.timelapseSettings.statusMessage = String(message || "").trim();
  state.timelapseSettings.statusLevel = String(level || "info").trim().toLowerCase();

  if (!els.settingsTimelapseStatus) return;
  els.settingsTimelapseStatus.textContent = state.timelapseSettings.statusMessage;
  els.settingsTimelapseStatus.dataset.level = state.timelapseSettings.statusLevel;
}

function isTimelapseSettingsConnected() {
  return !!state.client && state.connectionStatus === "connected";
}

function isTimelapseSettingsBlocked(...keys) {
  const blocked = normalizeTimelapseSettingsBlockedList(state.timelapseSettings.settings?.blockedsettings);
  return keys.some((key) => blocked.includes(String(key || "").trim()));
}

function isTimelapseSettingsUnavailableError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  if (!message.includes("machine.timelapse")) return false;
  return TIMELAPSE_SETTINGS_UNAVAILABLE_PATTERNS.some((pattern) => message.includes(pattern));
}

function extractTimelapseSettingsPayload(response) {
  const root = response?.result ?? response;
  if (!root || typeof root !== "object" || Array.isArray(root)) {
    return {};
  }
  return root;
}

function extractTimelapseCameraOptions(webcamResponse) {
  const payload = webcamResponse?.result ?? webcamResponse;
  const webcams = Array.isArray(payload?.webcams)
    ? payload.webcams
    : Array.isArray(payload)
      ? payload
      : [];

  const map = new Map();
  webcams.forEach((entry) => {
    const name = String(entry?.name ?? entry?.webcam_name ?? "").trim();
    const snapshotUrl = String(entry?.snapshot_url ?? entry?.snapshotUrl ?? "").trim();
    if (!name || !snapshotUrl) return;
    if (!map.has(name)) {
      map.set(name, { value: name, label: name });
    }
  });

  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function mergeTimelapseSettingsPatch(patch) {
  const current = state.timelapseSettings.settings || createDefaultTimelapseSettingsPayload();
  const merged = {
    ...current,
    ...(patch && typeof patch === "object" ? patch : {}),
  };
  state.timelapseSettings.settings = normalizeTimelapseSettingsPayload(merged);
}

function setTimelapseSettingsControlDisabled(input, disabled) {
  if (!input) return;
  input.disabled = !!disabled;
}

function syncTimelapseSettingsCameraSelect() {
  if (!els.settingsTimelapseCamera) return;

  const currentValue = String(state.timelapseSettings.settings.camera || "");
  const options = [...(Array.isArray(state.timelapseSettings.cameraOptions) ? state.timelapseSettings.cameraOptions : [])];

  if (currentValue && !options.some((entry) => entry.value === currentValue)) {
    options.unshift({
      value: currentValue,
      label: `${currentValue} (Current)`,
    });
  }

  if (!options.length) {
    options.push({ value: "", label: "No snapshot webcams found" });
  } else {
    options.unshift({ value: "", label: "Select webcam" });
  }

  const active = document.activeElement === els.settingsTimelapseCamera;
  if (!active) {
    els.settingsTimelapseCamera.replaceChildren();
    options.forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.value;
      option.textContent = entry.label;
      els.settingsTimelapseCamera.appendChild(option);
    });
  }

  const knownValues = options.map((entry) => entry.value);
  const nextValue = knownValues.includes(currentValue) ? currentValue : "";
  if (!active) {
    els.settingsTimelapseCamera.value = nextValue;
  }
}

function renderTimelapseSettingsCard() {
  const connected = isTimelapseSettingsConnected();
  const busy = state.timelapseSettings.loading || state.timelapseSettings.saving;
  const available = connected && state.timelapseSettings.available;
  const settings = normalizeTimelapseSettingsPayload(state.timelapseSettings.settings);
  state.timelapseSettings.settings = settings;

  if (!connected) {
    setTimelapseSettingsStatus("Connect to Moonraker to load timelapse settings.", "warn");
  } else if (state.timelapseSettings.loading) {
    setTimelapseSettingsStatus("Loading timelapse settings...", "info");
  } else if (!state.timelapseSettings.available && state.timelapseSettings.lastError) {
    const unavailable = isTimelapseSettingsUnavailableError(state.timelapseSettings.lastError);
    setTimelapseSettingsStatus(
      unavailable
        ? "Moonraker timelapse settings are not available on this host."
        : `Timelapse settings load failed: ${state.timelapseSettings.lastError}`,
      unavailable ? "warn" : "error"
    );
  } else if (state.timelapseSettings.lastUpdatedMs) {
    setTimelapseSettingsStatus(
      `Last updated: ${new Date(state.timelapseSettings.lastUpdatedMs).toLocaleTimeString()}`,
      "info"
    );
  }

  if (els.settingsTimelapseUnavailable) {
    els.settingsTimelapseUnavailable.hidden = !connected || state.timelapseSettings.loading || state.timelapseSettings.available;
  }

  if (els.settingsTimelapseRefresh) {
    els.settingsTimelapseRefresh.disabled = !connected || state.timelapseSettings.loading || state.timelapseSettings.saving;
  }

  syncTimelapseSettingsCameraSelect();

  const setCheckbox = (input, value) => {
    if (!input) return;
    if (document.activeElement !== input) {
      input.checked = !!value;
    }
  };

  const setTextValue = (input, value) => {
    if (!input) return;
    if (document.activeElement !== input) {
      input.value = String(value ?? "");
    }
  };

  setCheckbox(els.settingsTimelapseEnabled, settings.enabled);
  setCheckbox(els.settingsTimelapseAutorender, settings.autorender);
  setTextValue(els.settingsTimelapseMode, normalizeTimelapseSettingsMode(settings.mode));
  setTextValue(els.settingsTimelapseHyperlapseCycle, settings.hyperlapse_cycle);
  setCheckbox(els.settingsTimelapsePreviewImage, settings.previewimage);
  setCheckbox(els.settingsTimelapseSaveFrames, settings.saveframes);
  setTextValue(els.settingsTimelapseStreamDelayCompensation, settings.stream_delay_compensation);
  setCheckbox(els.settingsTimelapseGcodeVerbose, settings.gcode_verbose);
  setCheckbox(els.settingsTimelapseParkhead, settings.parkhead);
  setTextValue(els.settingsTimelapseParkpos, normalizeTimelapseSettingsParkpos(settings.parkpos));
  setTextValue(els.settingsTimelapseParkCustomPosX, settings.park_custom_pos_x);
  setTextValue(els.settingsTimelapseParkCustomPosY, settings.park_custom_pos_y);
  setTextValue(els.settingsTimelapseParkCustomPosDz, settings.park_custom_pos_dz);
  setTextValue(els.settingsTimelapseParkTravelSpeed, settings.park_travel_speed);
  setCheckbox(els.settingsTimelapseFwRetract, settings.fw_retract);
  setTextValue(els.settingsTimelapseParkRetractSpeed, settings.park_retract_speed);
  setTextValue(els.settingsTimelapseParkRetractDistance, settings.park_retract_distance);
  setTextValue(els.settingsTimelapseParkExtrudeSpeed, settings.park_extrude_speed);
  setTextValue(els.settingsTimelapseParkExtrudeDistance, settings.park_extrude_distance);
  setTextValue(els.settingsTimelapseParkTime, settings.park_time);
  setCheckbox(els.settingsTimelapseVariableFps, settings.variable_fps);
  setTextValue(els.settingsTimelapseTargetLength, settings.targetlength);
  setTextValue(els.settingsTimelapseVariableFpsMin, settings.variable_fps_min);
  setTextValue(els.settingsTimelapseVariableFpsMax, settings.variable_fps_max);
  setTextValue(els.settingsTimelapseOutputFramerate, settings.output_framerate);
  setTextValue(els.settingsTimelapseDuplicateLastFrame, settings.duplicatelastframe);
  setTextValue(els.settingsTimelapseConstantRateFactor, settings.constant_rate_factor);
  setTextValue(els.settingsTimelapsePixelformat, settings.pixelformat);
  setTextValue(els.settingsTimelapseTimeFormatCode, settings.time_format_code);
  setTextValue(els.settingsTimelapseExtraOutputParams, settings.extraoutputparams);

  if (els.settingsTimelapseHyperlapseCycleRow) {
    els.settingsTimelapseHyperlapseCycleRow.hidden = settings.mode !== "hyperlapse";
  }

  if (els.settingsTimelapseParkOptions) {
    els.settingsTimelapseParkOptions.hidden = !settings.parkhead;
  }

  const showPosX = ["x_only", "custom"].includes(settings.parkpos);
  const showPosY = ["y_only", "custom"].includes(settings.parkpos);
  const showPosDz = ["x_only", "y_only", "custom"].includes(settings.parkpos);

  if (els.settingsTimelapseParkPosXRow) {
    els.settingsTimelapseParkPosXRow.hidden = !settings.parkhead || !showPosX;
  }

  if (els.settingsTimelapseParkPosYRow) {
    els.settingsTimelapseParkPosYRow.hidden = !settings.parkhead || !showPosY;
  }

  if (els.settingsTimelapseParkPosDzRow) {
    els.settingsTimelapseParkPosDzRow.hidden = !settings.parkhead || !showPosDz;
  }

  if (els.settingsTimelapseRetractOptions) {
    els.settingsTimelapseRetractOptions.hidden = !settings.parkhead || settings.fw_retract;
  }

  if (els.settingsTimelapseVariableFpsOptions) {
    els.settingsTimelapseVariableFpsOptions.hidden = !settings.variable_fps;
  }

  if (els.settingsTimelapseStaticFpsOptions) {
    els.settingsTimelapseStaticFpsOptions.hidden = settings.variable_fps;
  }

  if (els.settingsTimelapseCameraWarning) {
    els.settingsTimelapseCameraWarning.hidden = !isTimelapseSettingsBlocked("snapshoturl");
  }

  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseEnabled,
    !available || busy || isTimelapseSettingsBlocked("enabled")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseAutorender,
    !available || busy || isTimelapseSettingsBlocked("autorender")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseCamera,
    !available || busy || !state.timelapseSettings.cameraOptions.length || isTimelapseSettingsBlocked("camera", "snapshoturl")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseMode,
    !available || busy || isTimelapseSettingsBlocked("modeOptions")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseHyperlapseCycle,
    !available || busy || settings.mode !== "hyperlapse" || isTimelapseSettingsBlocked("hyperlapseCycle")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapsePreviewImage,
    !available || busy || isTimelapseSettingsBlocked("previewimage")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseSaveFrames,
    !available || busy || isTimelapseSettingsBlocked("saveframes")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseStreamDelayCompensation,
    !available || busy || isTimelapseSettingsBlocked("stream_delay_compensation")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseGcodeVerbose,
    !available || busy || isTimelapseSettingsBlocked("gcode_verbose")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseParkhead,
    !available || busy || isTimelapseSettingsBlocked("parkhead")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseParkpos,
    !available || busy || !settings.parkhead || isTimelapseSettingsBlocked("parkposOptions")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseParkCustomPosX,
    !available || busy || !settings.parkhead || !showPosX || isTimelapseSettingsBlocked("park_custom_pos_x")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseParkCustomPosY,
    !available || busy || !settings.parkhead || !showPosY || isTimelapseSettingsBlocked("park_custom_pos_y")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseParkCustomPosDz,
    !available || busy || !settings.parkhead || !showPosDz || isTimelapseSettingsBlocked("park_custom_pos_dz")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseParkTravelSpeed,
    !available || busy || !settings.parkhead || isTimelapseSettingsBlocked("park_travel_speed")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseFwRetract,
    !available || busy || !settings.parkhead || isTimelapseSettingsBlocked("fw_retract")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseParkRetractSpeed,
    !available || busy || !settings.parkhead || settings.fw_retract || isTimelapseSettingsBlocked("park_retract_speed")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseParkRetractDistance,
    !available || busy || !settings.parkhead || settings.fw_retract || isTimelapseSettingsBlocked("park_retract_distance")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseParkExtrudeSpeed,
    !available || busy || !settings.parkhead || settings.fw_retract || isTimelapseSettingsBlocked("park_extrude_speed")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseParkExtrudeDistance,
    !available || busy || !settings.parkhead || settings.fw_retract || isTimelapseSettingsBlocked("park_extrude_distance")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseParkTime,
    !available || busy || !settings.parkhead || isTimelapseSettingsBlocked("park_time")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseVariableFps,
    !available || busy || isTimelapseSettingsBlocked("variable_fps")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseTargetLength,
    !available || busy || !settings.variable_fps || isTimelapseSettingsBlocked("targetlength")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseVariableFpsMin,
    !available || busy || !settings.variable_fps || isTimelapseSettingsBlocked("variable_fps_min")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseVariableFpsMax,
    !available || busy || !settings.variable_fps || isTimelapseSettingsBlocked("variable_fps_max")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseOutputFramerate,
    !available || busy || settings.variable_fps || isTimelapseSettingsBlocked("output_framerate")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseDuplicateLastFrame,
    !available || busy || isTimelapseSettingsBlocked("duplicatelastframe")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseConstantRateFactor,
    !available || busy || isTimelapseSettingsBlocked("constant_rate_factor")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapsePixelformat,
    !available || busy || isTimelapseSettingsBlocked("pixelformat")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseTimeFormatCode,
    !available || busy || isTimelapseSettingsBlocked("time_format_code")
  );
  setTimelapseSettingsControlDisabled(
    els.settingsTimelapseExtraOutputParams,
    !available || busy || isTimelapseSettingsBlocked("extraoutputparams")
  );
}

async function refreshTimelapseSettings({ silent = false } = {}) {
  if (!isTimelapseSettingsConnected()) {
    state.timelapseSettings.available = false;
    state.timelapseSettings.loading = false;
    state.timelapseSettings.saving = false;
    state.timelapseSettings.lastError = "";
    state.timelapseSettings.statusMessage = "Connect to Moonraker to load timelapse settings.";
    state.timelapseSettings.statusLevel = "warn";
    renderTimelapseSettingsCard();
    return null;
  }

  if (state.timelapseSettings.loading) {
    return state.timelapseSettings.settings;
  }

  state.timelapseSettings.loading = true;
  state.timelapseSettings.lastError = "";
  state.timelapseSettings.statusMessage = "Loading timelapse settings...";
  state.timelapseSettings.statusLevel = "info";
  renderTimelapseSettingsCard();

  try {
    const settingsResponse = await state.client.getTimelapseSettings();
    const settingsPayload = extractTimelapseSettingsPayload(settingsResponse);
    mergeTimelapseSettingsPatch(settingsPayload);
    state.timelapseSettings.available = true;
    state.timelapseSettings.lastUpdatedMs = Date.now();
    state.timelapseSettings.lastError = "";

    try {
      const webcamResponse = await state.client.getWebcamsList();
      state.timelapseSettings.cameraOptions = extractTimelapseCameraOptions(webcamResponse);
    } catch (webcamError) {
      log.debug("Timelapse webcam list refresh failed.", {
        error: webcamError?.message || String(webcamError),
      });
      state.timelapseSettings.cameraOptions = [];
    }

    state.timelapseSettings.statusMessage = `Last updated: ${new Date(state.timelapseSettings.lastUpdatedMs).toLocaleTimeString()}`;
    state.timelapseSettings.statusLevel = "info";

    if (!silent) {
      appendConsole("Timelapse settings refreshed.", "info");
    }

    renderTimelapseSettingsCard();
    return state.timelapseSettings.settings;
  } catch (error) {
    const message = error?.message || String(error);
    state.timelapseSettings.available = false;
    state.timelapseSettings.lastError = message;
    state.timelapseSettings.cameraOptions = [];

    const unavailable = isTimelapseSettingsUnavailableError(error);
    state.timelapseSettings.statusMessage = unavailable
      ? "Moonraker timelapse settings are not available on this host."
      : `Timelapse settings load failed: ${message}`;
    state.timelapseSettings.statusLevel = unavailable ? "warn" : "error";

    if (!silent) {
      appendConsole(
        unavailable
          ? "Timelapse settings unavailable: machine.timelapse module missing."
          : `Timelapse settings load failed: ${message}`,
        unavailable ? "warn" : "error"
      );
    }

    renderTimelapseSettingsCard();
    return null;
  } finally {
    state.timelapseSettings.loading = false;
    renderTimelapseSettingsCard();
  }
}

async function saveTimelapseSettingsPatch(patch, { silent = true } = {}) {
  if (!isTimelapseSettingsConnected()) {
    setTimelapseSettingsStatus("Connect to Moonraker before saving timelapse settings.", "warn");
    renderTimelapseSettingsCard();
    return false;
  }

  const payload = patch && typeof patch === "object" ? patch : {};
  const keys = Object.keys(payload);
  if (!keys.length) return false;

  const previous = normalizeTimelapseSettingsPayload(state.timelapseSettings.settings);
  mergeTimelapseSettingsPatch(payload);
  state.timelapseSettings.saving = true;
  renderTimelapseSettingsCard();

  try {
    const response = await state.client.saveTimelapseSettings(payload);
    const responsePayload = extractTimelapseSettingsPayload(response);
    const hasResponsePayload = Object.keys(responsePayload).length > 0;
    mergeTimelapseSettingsPatch(
      hasResponsePayload
        ? normalizeTimelapseSettingsPayload(responsePayload)
        : payload
    );
    state.timelapseSettings.available = true;
    state.timelapseSettings.lastError = "";
    state.timelapseSettings.lastUpdatedMs = Date.now();
    state.timelapseSettings.statusMessage = `Saved: ${keys.join(", ")}`;
    state.timelapseSettings.statusLevel = "info";

    if (!silent) {
      appendConsole(`Timelapse setting saved: ${keys.join(", ")}`, "info");
    }

    renderTimelapseSettingsCard();
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.timelapseSettings.settings = previous;
    state.timelapseSettings.lastError = message;
    state.timelapseSettings.statusMessage = `Timelapse setting save failed: ${message}`;
    state.timelapseSettings.statusLevel = "error";
    renderTimelapseSettingsCard();

    if (!silent) {
      appendConsole(`Timelapse setting save failed: ${message}`, "error");
    }

    return false;
  } finally {
    state.timelapseSettings.saving = false;
    renderTimelapseSettingsCard();
  }
}

function parseTimelapseSettingsNumberInput(key, rawValue) {
  const fallback = state.timelapseSettings.settings?.[key] ?? TIMELAPSE_SETTINGS_DEFAULTS[key] ?? 0;
  const value = normalizeTimelapseSettingsNumber(key, rawValue, fallback);
  return value;
}

function saveTimelapseNumberSettingFromInput(key, input, { silent = true } = {}) {
  if (!input) return;

  const value = parseTimelapseSettingsNumberInput(key, input.value);
  const patch = { [key]: value };

  if (key === "variable_fps_max" && value <= Number(state.timelapseSettings.settings.variable_fps_min)) {
    setTimelapseSettingsStatus("Variable FPS Max must be greater than Variable FPS Min.", "warn");
    renderTimelapseSettingsCard();
    return;
  }

  if (key === "variable_fps_min" && Number(state.timelapseSettings.settings.variable_fps_max) <= value) {
    patch.variable_fps_max = value + 1;
  }

  void saveTimelapseSettingsPatch(patch, { silent });
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

function normalizeDashboardViewport(viewportCandidate) {
  const normalized = String(viewportCandidate || "").trim().toLowerCase();
  return DASHBOARD_VIEWPORTS.includes(normalized) ? normalized : "desktop";
}

function getDashboardViewportColumnCount(viewportCandidate) {
  const viewport = normalizeDashboardViewport(viewportCandidate);
  return DASHBOARD_VIEWPORT_COLUMN_COUNT[viewport] || DASHBOARD_VIEWPORT_COLUMN_COUNT.desktop;
}

function getDashboardViewportForWidth(widthCandidate) {
  const width = Number(widthCandidate);
  if (!Number.isFinite(width)) return "desktop";
  if (width < 700) return "mobile";
  if (width < 1100) return "tablet";
  if (width < 1600) return "desktop";
  return "widescreen";
}

function getDashboardRuntimeViewport() {
  return getDashboardViewportForWidth(window.innerWidth || 0);
}

function normalizeDashboardViewportLayout(layoutCandidate, viewportCandidate) {
  const viewport = normalizeDashboardViewport(viewportCandidate);
  const columnCount = getDashboardViewportColumnCount(viewport);
  const candidate = layoutCandidate && typeof layoutCandidate === "object" ? layoutCandidate : {};
  const sourceColumns = Array.isArray(candidate.columns) ? candidate.columns : [];

  const columns = Array.from({ length: columnCount }, (_, index) => normalizeDashboardCardIds(sourceColumns[index]));
  const used = new Set();

  columns.forEach((column, columnIndex) => {
    columns[columnIndex] = column.filter((id) => {
      if (used.has(id)) return false;
      used.add(id);
      return true;
    });
  });

  const missing = DASHBOARD_CARD_IDS.filter((id) => !used.has(id));
  missing.forEach((id) => {
    let targetIndex = 0;
    let minCount = Number.POSITIVE_INFINITY;

    columns.forEach((column, columnIndex) => {
      if (column.length < minCount) {
        minCount = column.length;
        targetIndex = columnIndex;
      }
    });

    columns[targetIndex].push(id);
  });

  return { columns };
}

function cloneDashboardViewportLayout(layoutCandidate, viewportCandidate) {
  const normalized = normalizeDashboardViewportLayout(layoutCandidate, viewportCandidate);
  return { columns: normalized.columns.map((column) => [...column]) };
}

function getDashboardDefaultLayoutForViewport(viewportCandidate) {
  const viewport = normalizeDashboardViewport(viewportCandidate);
  const fallback = DASHBOARD_LAYOUT_DEFAULTS.desktop;
  return cloneDashboardViewportLayout(DASHBOARD_LAYOUT_DEFAULTS[viewport] || fallback, viewport);
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

function convertLegacyLayoutToViewportLayout(layoutCandidate, viewportCandidate) {
  const viewport = normalizeDashboardViewport(viewportCandidate);
  const legacy = normalizeDashboardLayout(layoutCandidate);

  if (viewport === "mobile") {
    return normalizeDashboardViewportLayout({ columns: [[...legacy.left, ...legacy.right]] }, viewport);
  }

  if (viewport === "widescreen") {
    const right = [...legacy.right];
    const splitIndex = Math.ceil(right.length / 2);
    return normalizeDashboardViewportLayout(
      {
        columns: [
          [...legacy.left],
          right.slice(0, splitIndex),
          right.slice(splitIndex),
        ],
      },
      viewport
    );
  }

  return normalizeDashboardViewportLayout({ columns: [[...legacy.left], [...legacy.right]] }, viewport);
}

function convertViewportLayoutToLegacyLayout(layoutCandidate, viewportCandidate) {
  const viewport = normalizeDashboardViewport(viewportCandidate);
  const layout = normalizeDashboardViewportLayout(layoutCandidate, viewport);

  if (viewport === "mobile") {
    return normalizeDashboardLayout({ left: [...layout.columns[0]], right: [] });
  }

  if (viewport === "widescreen") {
    const left = [...(layout.columns[0] || [])];
    const right = [...(layout.columns[1] || []), ...(layout.columns[2] || [])];
    return normalizeDashboardLayout({ left, right });
  }

  return normalizeDashboardLayout({
    left: [...(layout.columns[0] || [])],
    right: [...(layout.columns[1] || [])],
  });
}

function loadDashboardLayout() {
  const rawLayout = localStorage.getItem(DASHBOARD_LAYOUT_LEGACY_STORAGE_KEY);
  if (rawLayout) {
    try {
      const parsed = JSON.parse(rawLayout);
      return normalizeDashboardLayout(parsed);
    } catch {
      // Fall through to legacy key/default.
    }
  }

  const rawOrder = localStorage.getItem(DASHBOARD_LAYOUT_LEGACY_ORDER_STORAGE_KEY);
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

function loadStoredDashboardViewportLayout(viewportCandidate, fallbackLegacyLayout) {
  const viewport = normalizeDashboardViewport(viewportCandidate);
  const storageKey = DASHBOARD_LAYOUT_STORAGE_KEYS[viewport];
  const fallback = convertLegacyLayoutToViewportLayout(fallbackLegacyLayout, viewport);
  const raw = storageKey ? localStorage.getItem(storageKey) : null;

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return normalizeDashboardViewportLayout(parsed, viewport);
  } catch {
    return fallback;
  }
}

function loadDashboardLayoutsByViewport(baseLegacyLayout = loadDashboardLayout()) {
  const legacy = normalizeDashboardLayout(baseLegacyLayout);
  const layouts = {};

  DASHBOARD_VIEWPORTS.forEach((viewport) => {
    layouts[viewport] = loadStoredDashboardViewportLayout(viewport, legacy);
  });

  return layouts;
}

function getDashboardLayoutForViewport(viewportCandidate) {
  const viewport = normalizeDashboardViewport(viewportCandidate);
  const candidate = state.dashboard.layoutsByViewport?.[viewport];
  return normalizeDashboardViewportLayout(candidate || getDashboardDefaultLayoutForViewport(viewport), viewport);
}

function setDashboardLayoutForViewport(viewportCandidate, layoutCandidate, { persist = true } = {}) {
  const viewport = normalizeDashboardViewport(viewportCandidate);
  const normalized = normalizeDashboardViewportLayout(layoutCandidate, viewport);
  state.dashboard.layoutsByViewport[viewport] = normalized;

  if (persist) {
    const storageKey = DASHBOARD_LAYOUT_STORAGE_KEYS[viewport];
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(normalized));
    }
  }

  if (viewport === "desktop") {
    state.dashboard.layout = convertViewportLayoutToLegacyLayout(normalized, "desktop");
    localStorage.setItem(DASHBOARD_LAYOUT_LEGACY_STORAGE_KEY, JSON.stringify(state.dashboard.layout));
    localStorage.setItem(DASHBOARD_LAYOUT_LEGACY_ORDER_STORAGE_KEY, JSON.stringify(flattenDashboardLayout(state.dashboard.layout)));
  }
}

function persistDashboardLayoutsByViewport() {
  DASHBOARD_VIEWPORTS.forEach((viewport) => {
    setDashboardLayoutForViewport(viewport, state.dashboard.layoutsByViewport?.[viewport], { persist: true });
  });
}

function getDashboardAppliedViewport() {
  return normalizeDashboardViewport(state.dashboard.settingsViewport || getDashboardRuntimeViewport());
}

function getRuntimeDashboardLegacyLayout(viewportCandidate = getDashboardAppliedViewport()) {
  const viewport = normalizeDashboardViewport(viewportCandidate);
  const layout = getDashboardLayoutForViewport(viewport);
  return convertViewportLayoutToLegacyLayout(layout, viewport);
}

function getDashboardCardVisibilityValue(cardId) {
  switch (cardId) {
    case "card-print-progress":
      return !!state.dashboard.showPrintProgress;
    case "card-temperatures":
      return !!state.dashboard.showTemperatures;
    case "card-motion":
      return !!state.dashboard.showMotion;
    case "card-quick-commands":
      return !!state.dashboard.showQuickCommands;
    case "card-macros":
      return !!state.dashboard.showMacros;
    case "card-runout-sensors":
      return !!state.dashboard.showRunoutSensors;
    case "camera-main-card":
      return !!state.dashboard.showMainCamera;
    case "camera-toolhead-card":
      return !!state.dashboard.showToolheadCamera;
    case "card-dashboard-console":
      return !!state.dashboard.showConsole;
    case KLIPPERVIEW_CARD_ID:
      return !!state.dashboard.showKlipperView;
    default:
      return true;
  }
}

function setDashboardCardVisibilityValue(cardId, visible) {
  const nextValue = !!visible;

  switch (cardId) {
    case "card-print-progress":
      state.dashboard.showPrintProgress = nextValue;
      break;
    case "card-temperatures":
      state.dashboard.showTemperatures = nextValue;
      break;
    case "card-motion":
      state.dashboard.showMotion = nextValue;
      break;
    case "card-quick-commands":
      state.dashboard.showQuickCommands = nextValue;
      break;
    case "card-macros":
      state.dashboard.showMacros = nextValue;
      break;
    case "card-runout-sensors":
      state.dashboard.showRunoutSensors = nextValue;
      break;
    case "camera-main-card":
      state.dashboard.showMainCamera = nextValue;
      break;
    case "camera-toolhead-card":
      state.dashboard.showToolheadCamera = nextValue;
      break;
    case "card-dashboard-console":
      state.dashboard.showConsole = nextValue;
      break;
    case KLIPPERVIEW_CARD_ID:
      state.dashboard.showKlipperView = nextValue;
      break;
    default:
      break;
  }
}

function persistDashboardVisibilityState() {
  Object.entries(DASHBOARD_VISIBILITY_STORAGE_KEYS).forEach(([cardId, storageKey]) => {
    localStorage.setItem(storageKey, String(getDashboardCardVisibilityValue(cardId)));
  });
}

function syncDashboardVisibilityInputs() {
  if (els.dashShowPrintProgress) els.dashShowPrintProgress.checked = state.dashboard.showPrintProgress;
  if (els.dashShowTemperatures) els.dashShowTemperatures.checked = state.dashboard.showTemperatures;
  if (els.dashShowMotion) els.dashShowMotion.checked = state.dashboard.showMotion;
  if (els.dashShowQuickCommands) els.dashShowQuickCommands.checked = state.dashboard.showQuickCommands;
  if (els.dashShowMacros) els.dashShowMacros.checked = state.dashboard.showMacros;
  if (els.dashShowRunoutSensors) els.dashShowRunoutSensors.checked = state.dashboard.showRunoutSensors;
  if (els.dashShowMainCamera) els.dashShowMainCamera.checked = state.dashboard.showMainCamera;
  if (els.dashShowToolheadCamera) els.dashShowToolheadCamera.checked = state.dashboard.showToolheadCamera;
  if (els.dashShowConsole) els.dashShowConsole.checked = state.dashboard.showConsole;
  if (els.dashShowKlipperView) els.dashShowKlipperView.checked = state.dashboard.showKlipperView;
}

let settingsDashboardDraggedCardId = null;
let settingsDashboardDraggedFromColumn = null;

function moveDashboardCardInViewportLayout(viewportCandidate, cardId, toColumnIndex, beforeCardId = null) {
  const viewport = normalizeDashboardViewport(viewportCandidate);
  const layout = cloneDashboardViewportLayout(getDashboardLayoutForViewport(viewport), viewport);
  const maxColumnIndex = getDashboardViewportColumnCount(viewport) - 1;
  const targetIndex = Math.max(0, Math.min(maxColumnIndex, Number(toColumnIndex) || 0));

  layout.columns.forEach((column) => {
    const cardIndex = column.indexOf(cardId);
    if (cardIndex >= 0) {
      column.splice(cardIndex, 1);
    }
  });

  const targetColumn = layout.columns[targetIndex];
  if (!Array.isArray(targetColumn)) return;

  if (beforeCardId) {
    const insertIndex = targetColumn.indexOf(beforeCardId);
    if (insertIndex >= 0) {
      targetColumn.splice(insertIndex, 0, cardId);
    } else {
      targetColumn.push(cardId);
    }
  } else {
    targetColumn.push(cardId);
  }

  setDashboardLayoutForViewport(viewport, layout, { persist: true });
}

function renderSettingsDashboardLayout() {
  if (!els.settingsDashboardColumns) return;

  const viewport = normalizeDashboardViewport(state.dashboard.settingsViewport);
  const layout = getDashboardLayoutForViewport(viewport);
  const columnCount = getDashboardViewportColumnCount(viewport);

  els.settingsDashboardColumns.innerHTML = "";
  els.settingsDashboardColumns.dataset.dashboardViewport = viewport;
  els.settingsDashboardColumns.style.setProperty("--dashboard-settings-columns", String(columnCount));

  layout.columns.forEach((cards, columnIndex) => {
    const column = document.createElement("section");
    column.className = "settings-dashboard-column";

    const heading = document.createElement("h4");
    heading.textContent = columnCount === 1 ? "Mobile Layout" : `Column ${columnIndex + 1}`;

    const list = document.createElement("ul");
    list.className = "settings-dashboard-list";
    list.dataset.columnIndex = String(columnIndex);

    if (columnIndex === 0) {
      const locked = document.createElement("li");
      locked.className = "settings-dashboard-locked";
      const lockedLabel = document.createElement("span");
      lockedLabel.textContent = "Status";
      const lockedIcon = document.createElement("span");
      lockedIcon.textContent = "LOCKED";
      locked.append(lockedLabel, lockedIcon);
      list.appendChild(locked);
    }

    cards.forEach((cardId) => {
      const item = document.createElement("li");
      item.className = "settings-dashboard-item";
      item.draggable = true;
      item.dataset.cardId = cardId;

      const handle = document.createElement("span");
      handle.className = "settings-dashboard-handle";
      handle.textContent = "::";

      const label = document.createElement("span");
      label.className = "settings-dashboard-label";
      label.textContent = DASHBOARD_CARD_LABELS[cardId] || cardId;

      const visibleButton = document.createElement("button");
      visibleButton.type = "button";
      visibleButton.className = "settings-dashboard-visible";
      const visible = getDashboardCardVisibilityValue(cardId);
      visibleButton.dataset.visible = visible ? "true" : "false";
      visibleButton.textContent = visible ? "ON" : "OFF";
      visibleButton.setAttribute("aria-label", visible ? "Hide card" : "Show card");
      visibleButton.addEventListener("click", (event) => {
        event.preventDefault();
        const nextVisible = !getDashboardCardVisibilityValue(cardId);
        setDashboardCardVisibilityValue(cardId, nextVisible);
        persistDashboardVisibilityState();
        syncDashboardVisibilityInputs();
        applyDashboardSettings();
        renderSettingsDashboardLayout();
      });

      item.append(handle, label, visibleButton);

      item.addEventListener("dragstart", (event) => {
        settingsDashboardDraggedCardId = cardId;
        settingsDashboardDraggedFromColumn = columnIndex;
        item.classList.add("dragging");
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", `${cardId}|${columnIndex}`);
        }
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        settingsDashboardDraggedCardId = null;
        settingsDashboardDraggedFromColumn = null;
        els.settingsDashboardColumns?.querySelectorAll(".drop-target").forEach((el) => el.classList.remove("drop-target"));
      });

      item.addEventListener("dragover", (event) => {
        event.preventDefault();
        item.classList.add("drop-target");
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

        const payload = event.dataTransfer?.getData("text/plain") || "";
        const payloadCardId = payload.split("|")[0];
        const draggedCardId = settingsDashboardDraggedCardId || payloadCardId;
        if (!DASHBOARD_CARD_IDS.includes(draggedCardId)) return;

        moveDashboardCardInViewportLayout(viewport, draggedCardId, columnIndex, cardId);
        if (viewport === getDashboardAppliedViewport()) {
          applyDashboardLayout();
        }
        renderSettingsDashboardLayout();
      });

      list.appendChild(item);
    });

    list.addEventListener("dragover", (event) => {
      event.preventDefault();
      list.classList.add("drop-target");
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    });

    list.addEventListener("dragleave", (event) => {
      if (event.target === list) {
        list.classList.remove("drop-target");
      }
    });

    list.addEventListener("drop", (event) => {
      event.preventDefault();
      list.classList.remove("drop-target");

      const payload = event.dataTransfer?.getData("text/plain") || "";
      const payloadCardId = payload.split("|")[0];
      const draggedCardId = settingsDashboardDraggedCardId || payloadCardId;
      if (!DASHBOARD_CARD_IDS.includes(draggedCardId)) return;

      moveDashboardCardInViewportLayout(viewport, draggedCardId, columnIndex);
      if (viewport === getDashboardAppliedViewport()) {
        applyDashboardLayout();
      }
      renderSettingsDashboardLayout();
    });

    column.append(heading, list);
    els.settingsDashboardColumns.appendChild(column);
  });

  els.settingsDashboardViewportButtons.forEach((button) => {
    const buttonViewport = normalizeDashboardViewport(button.dataset.dashboardViewport);
    const isActive = buttonViewport === viewport;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function resetDashboardLayoutForViewport(viewportCandidate) {
  const viewport = normalizeDashboardViewport(viewportCandidate);
  const defaults = getDashboardDefaultLayoutForViewport(viewport);
  setDashboardLayoutForViewport(viewport, defaults, { persist: true });

  if (viewport === getDashboardAppliedViewport()) {
    applyDashboardLayout();
  }
}
function handleDashboardViewportResize() {
  const nextViewport = getDashboardRuntimeViewport();
  const viewportChanged = nextViewport !== runtimeDashboardViewport;

  if (viewportChanged) {
    runtimeDashboardViewport = nextViewport;
    state.dashboard.layout = getRuntimeDashboardLegacyLayout(nextViewport);
    applyDashboardLayout();
    applyDashboardSettings();
  }

  if (state.activeView === "settings") {
    queueSettingsSubnavSync();
    renderSettingsDashboardLayout();
  }
}
function normalizeMacroCategoryId(value) {
  const normalized = String(value || "").trim();
  return normalized && normalized !== MACRO_DEFAULT_CATEGORY_ID ? normalized : MACRO_DEFAULT_CATEGORY_ID;
}

function normalizeMacroColor(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(normalized)) return normalized;
  if (/^#[0-9a-f]{3}$/.test(normalized)) {
    return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
  }
  return "";
}
function getMacroColorContrastText(value) {
  const color = normalizeMacroColor(value);
  if (!color) return "#f8fafc";

  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  const luminance = ((0.299 * red) + (0.587 * green) + (0.114 * blue)) / 255;
  return luminance >= 0.62 ? "#0b1120" : "#f8fafc";
}

function sanitizeMacroStoredEntry(entry) {
  const name = String(entry?.name || "").trim().toLowerCase();
  if (!name) return null;

  const orderRaw = Number(entry?.order);
  const sanitized = {
    name,
    alias: String(entry?.alias || "").trim().slice(0, 64),
    visible: entry?.visible !== false,
    categoryId: normalizeMacroCategoryId(entry?.categoryId),
    disabledWhilePrinting: !!entry?.disabledWhilePrinting,
    color: normalizeMacroColor(entry?.color),
  };

  if (Number.isFinite(orderRaw) && orderRaw >= 0) {
    sanitized.order = Math.round(orderRaw);
  }

  return sanitized;
}

function sanitizeMacroCategoryEntry(entry) {
  const id = String(entry?.id || "").trim();
  const name = String(entry?.name || "").trim().slice(0, 40);
  if (!id || id === MACRO_DEFAULT_CATEGORY_ID || !name) return null;
  return { id, name };
}

function normalizeStoredMacroSettingsPayload(payload) {
  const source = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const storedCandidate = Array.isArray(source.stored) ? source.stored : [];
  const categoriesCandidate = Array.isArray(source.categories) ? source.categories : [];

  const stored = [];
  const seenStored = new Set();
  storedCandidate.forEach((entry) => {
    const sanitized = sanitizeMacroStoredEntry(entry);
    if (!sanitized || seenStored.has(sanitized.name)) return;
    seenStored.add(sanitized.name);
    stored.push(sanitized);
  });

  const categories = [];
  const seenCategories = new Set();
  categoriesCandidate.forEach((entry) => {
    const sanitized = sanitizeMacroCategoryEntry(entry);
    if (!sanitized || seenCategories.has(sanitized.id)) return;
    seenCategories.add(sanitized.id);
    categories.push(sanitized);
  });

  return { stored, categories };
}

function loadStoredMacroSettings() {
  const raw = localStorage.getItem(MACRO_SETTINGS_STORAGE_KEY);
  if (!raw) return { stored: [], categories: [] };

  try {
    return normalizeStoredMacroSettingsPayload(JSON.parse(raw));
  } catch {
    return { stored: [], categories: [] };
  }
}

function createMacroState() {
  const stored = loadStoredMacroSettings();
  return {
    keys: [],
    stored: stored.stored,
    categories: stored.categories,
    selectedCategoryId: MACRO_DEFAULT_CATEGORY_ID,
    searchQuery: "",
    dialogMacroName: "",
    dialogColorDefault: "",
  };
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

function normalizeSpoolmanServerUrl(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized.replace(/\/+$/, "");
}

function normalizeSpoolmanApiToken(value) {
  return String(value || "").trim();
}

function loadStoredSpoolmanEnabled() {
  return true;
}

function loadStoredSpoolmanServerUrl() {
  return "";
}

function loadStoredSpoolmanApiToken() {
  return "";
}

function getSpoolmanConnectionMode(serverUrl) {
  return normalizeSpoolmanServerUrl(serverUrl) ? SPOOLMAN_CONNECTION_DIRECT : SPOOLMAN_CONNECTION_PROXY;
}

function normalizeSpoolmanRemainingFilamentUnit(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return SPOOLMAN_REMAINING_UNIT_VALUES.includes(normalized)
    ? normalized
    : SPOOLMAN_SETTINGS_DEFAULTS.remainingFilamentUnit;
}

function normalizeSpoolmanCardFields(value) {
  const list = Array.isArray(value)
    ? value
    : [];
  const normalized = list
    .map((entry) => String(entry || "").trim())
    .filter((entry, index, arr) => entry && arr.indexOf(entry) === index && SPOOLMAN_CARD_FIELD_OPTIONS.includes(entry));
  return normalized.length ? normalized : [...SPOOLMAN_SETTINGS_DEFAULTS.selectedCardFields];
}

function getSelectedSpoolmanCardFieldsFromInputs() {
  const selected = (els.settingsSpoolmanCardFieldToggles || [])
    .filter((input) => input instanceof HTMLInputElement && input.checked)
    .map((input) => input.value);
  return normalizeSpoolmanCardFields(selected);
}

function syncSpoolmanCardFieldInputs(selectedCardFields) {
  const selected = new Set(normalizeSpoolmanCardFields(selectedCardFields));
  (els.settingsSpoolmanCardFieldToggles || []).forEach((input) => {
    if (!(input instanceof HTMLInputElement)) return;
    input.checked = selected.has(input.value);
  });
}

function hasPendingSpoolmanCardFieldChanges(selectedCardFields) {
  const applied = normalizeSpoolmanCardFields(selectedCardFields);
  const pending = getSelectedSpoolmanCardFieldsFromInputs();
  if (applied.length !== pending.length) return true;
  return applied.some((field, index) => field !== pending[index]);
}

function syncSpoolmanCardFieldApplyButton(selectedCardFields) {
  if (!els.settingsSpoolmanFieldsApply) return;
  els.settingsSpoolmanFieldsApply.disabled = !hasPendingSpoolmanCardFieldChanges(selectedCardFields);
}

function loadStoredSpoolmanCardFields() {
  const raw = localStorage.getItem(SPOOLMAN_CARD_FIELDS_STORAGE_KEY);
  if (!raw) return [...SPOOLMAN_SETTINGS_DEFAULTS.selectedCardFields];

  try {
    return normalizeSpoolmanCardFields(JSON.parse(raw));
  } catch {
    return [...SPOOLMAN_SETTINGS_DEFAULTS.selectedCardFields];
  }
}

function loadStoredSpoolmanSettings() {
  const storedCameraValue = String(localStorage.getItem(SPOOLMAN_AUTO_QR_CAMERA_STORAGE_KEY) || "");
  return {
    autoSpoolSelectionDialog: loadStoredBool(
      SPOOLMAN_AUTO_DIALOG_STORAGE_KEY,
      SPOOLMAN_SETTINGS_DEFAULTS.autoSpoolSelectionDialog
    ),
    autoOpenQRDetectionCamera: storedCameraValue === "null" ? "" : storedCameraValue,
    preferDeviceCamera: loadStoredBool(
      SPOOLMAN_PREFER_DEVICE_CAMERA_STORAGE_KEY,
      SPOOLMAN_SETTINGS_DEFAULTS.preferDeviceCamera
    ),
    autoSelectSpoolOnMatch: loadStoredBool(
      SPOOLMAN_AUTO_SELECT_ON_MATCH_STORAGE_KEY,
      SPOOLMAN_SETTINGS_DEFAULTS.autoSelectSpoolOnMatch
    ),
    warnOnNotEnoughFilament: loadStoredBool(
      SPOOLMAN_WARN_NOT_ENOUGH_STORAGE_KEY,
      SPOOLMAN_SETTINGS_DEFAULTS.warnOnNotEnoughFilament
    ),
    warnOnFilamentTypeMismatch: loadStoredBool(
      SPOOLMAN_WARN_MISMATCH_STORAGE_KEY,
      SPOOLMAN_SETTINGS_DEFAULTS.warnOnFilamentTypeMismatch
    ),
    remainingFilamentUnit: normalizeSpoolmanRemainingFilamentUnit(
      localStorage.getItem(SPOOLMAN_REMAINING_UNIT_STORAGE_KEY)
    ),
    selectedCardFields: loadStoredSpoolmanCardFields(),
  };
}

function normalizeTimelapseServiceName(value) {
  return String(value || "").trim();
}

function normalizeTimelapseControlMode(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === TIMELAPSE_CONTROL_MODE_EXTERNAL) {
    return TIMELAPSE_CONTROL_MODE_EXTERNAL;
  }
  return TIMELAPSE_CONTROL_MODE_SERVICE;
}

function loadStoredTimelapseControlMode() {
  return normalizeTimelapseControlMode(localStorage.getItem(TIMELAPSE_CONTROL_MODE_STORAGE_KEY));
}

function normalizeTimelapseServiceLookupKey(value) {
  return normalizeTimelapseServiceName(value).toLowerCase().replace(/\.service$/, "");
}

function getTimelapseServiceLookupCandidates(serviceName) {
  const normalizedName = normalizeTimelapseServiceName(serviceName).toLowerCase();
  if (!normalizedName) return [];

  const baseName = normalizeTimelapseServiceLookupKey(normalizedName);
  const candidates = [];

  const pushCandidate = (name) => {
    if (!name || candidates.includes(name)) return;
    candidates.push(name);
  };

  pushCandidate(normalizedName);
  pushCandidate(baseName);
  pushCandidate(`${baseName}.service`);

  return candidates;
}

function loadStoredTimelapseServiceName() {
  const stored = normalizeTimelapseServiceName(localStorage.getItem(TIMELAPSE_SERVICE_NAME_STORAGE_KEY));
  return stored || TIMELAPSE_SERVICE_NAME_DEFAULT;
}

function createDefaultTimelapseControlState() {
  const controlMode = loadStoredTimelapseControlMode();
  return {
    controlMode,
    serviceName: loadStoredTimelapseServiceName(),
    resolvedServiceName: "",
    serviceState: controlMode === TIMELAPSE_CONTROL_MODE_EXTERNAL ? "external" : "unknown",
    serviceSubState: "",
    loading: false,
    actionInFlight: false,
    lastUpdatedMs: null,
    lastError: "",
    statusMessage: controlMode === TIMELAPSE_CONTROL_MODE_EXTERNAL
      ? "External recorder mode enabled. Moonraker service checks are disabled."
      : "Connect to Moonraker to query service state.",
  };
}

function createDefaultTimelapseSettingsPayload() {
  return {
    ...TIMELAPSE_SETTINGS_DEFAULTS,
    blockedsettings: [...TIMELAPSE_SETTINGS_DEFAULTS.blockedsettings],
  };
}

function normalizeTimelapseSettingsMode(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return TIMELAPSE_SETTINGS_MODE_VALUES.includes(normalized) ? normalized : TIMELAPSE_SETTINGS_DEFAULTS.mode;
}

function normalizeTimelapseSettingsParkpos(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return TIMELAPSE_SETTINGS_PARKPOS_VALUES.includes(normalized) ? normalized : TIMELAPSE_SETTINGS_DEFAULTS.parkpos;
}

function normalizeTimelapseSettingsBlockedList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((entry) => String(entry || "").trim()).filter(Boolean))];
}

function normalizeTimelapseSettingsNumber(key, candidate, fallback) {
  const numeric = Number(candidate);
  if (!Number.isFinite(numeric)) return fallback;

  const rules = TIMELAPSE_SETTINGS_NUMERIC_RULES[key];
  if (!rules) return numeric;

  if (rules.strict ? numeric <= rules.min : numeric < rules.min) {
    return fallback;
  }

  return numeric;
}

function normalizeTimelapseSettingsPayload(candidate) {
  const source = candidate && typeof candidate === "object" ? candidate : {};
  const defaults = createDefaultTimelapseSettingsPayload();
  const output = { ...defaults };

  Object.keys(defaults).forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(source, key)) return;

    if (key === "mode") {
      output.mode = normalizeTimelapseSettingsMode(source.mode);
      return;
    }

    if (key === "parkpos") {
      output.parkpos = normalizeTimelapseSettingsParkpos(source.parkpos);
      return;
    }

    if (key === "blockedsettings") {
      output.blockedsettings = normalizeTimelapseSettingsBlockedList(source.blockedsettings);
      return;
    }

    const defaultValue = defaults[key];
    if (typeof defaultValue === "boolean") {
      output[key] = source[key] === true;
      return;
    }

    if (typeof defaultValue === "number") {
      output[key] = normalizeTimelapseSettingsNumber(key, source[key], defaultValue);
      return;
    }

    output[key] = String(source[key] ?? "").trim();
  });

  if (output.variable_fps_max <= output.variable_fps_min) {
    output.variable_fps_max = Math.max(output.variable_fps_min + 1, defaults.variable_fps_max);
  }

  return output;
}

function createDefaultTimelapseSettingsState() {
  return {
    settings: createDefaultTimelapseSettingsPayload(),
    cameraOptions: [],
    loading: false,
    saving: false,
    available: false,
    lastUpdatedMs: null,
    lastError: "",
    statusMessage: "Connect to Moonraker to load timelapse settings.",
    statusLevel: "info",
  };
}

function createDefaultSpoolmanState() {
  const enabled = loadStoredSpoolmanEnabled();
  const serverUrl = loadStoredSpoolmanServerUrl();
  return {
    enabled,
    serverUrl,
    apiToken: loadStoredSpoolmanApiToken(),
    connectionMode: getSpoolmanConnectionMode(serverUrl),
    connectionState: enabled ? "unknown" : "disabled",
    healthState: enabled ? "unknown" : "disabled",
    info: null,
    currency: null,
    spools: [],
    activeSpoolId: null,
    activeSpool: null,
    loading: false,
    testing: false,
    actionInFlight: false,
    lastUpdatedMs: null,
    lastError: "",
    settings: loadStoredSpoolmanSettings(),
    statusMessage: enabled
      ? "Press Refresh to load Spoolman data."
      : "Spoolman integration is disabled in Settings.",
  };
}

function createDefaultTimelapseMediaState() {
  return {
    files: [],
    directories: [],
    isLoading: false,
    actionInFlight: false,
    actionLabel: "",
    activePath: "",
    lastError: "",
    lastUpdatedMs: null,
    sortMode: loadStoredTimelapseMediaSort(),
    currentDirectory: loadStoredTimelapseMediaDirectory(),
    selectedPath: "",
    selectedType: "",
  };
}
function createDefaultToolsMenuState() {
  return {
    open: false,
    loading: false,
    powerDevices: [],
    services: [],
    supportsHostControl: true,
    actionInFlight: false,
    lastError: "",
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
    selectedPath: "",
    selectedType: "",
    listPrintPath: "",
    listPrintState: "",
    workflowStatusMessage: "",
    workflowStatusLevel: "info",
    uploadDragDepth: 0,
  };
}

function createDefaultPrintHistoryState() {
  return {
    jobs: [],
    totalCount: 0,
    totals: {
      total_jobs: 0,
      total_time: 0,
      total_print_time: 0,
      total_filament_used: 0,
      longest_job: 0,
      longest_print: 0,
    },
    isLoading: false,
    isTotalsLoading: false,
    actionInFlight: false,
    actionLabel: "",
    activeJobId: "",
    lastError: "",
    lastUpdatedMs: null,
    totalsUpdatedMs: null,
    searchQuery: loadStoredPrintHistorySearch(),
    statusFilter: loadStoredPrintHistoryStatusFilter(),
    sortMode: loadStoredPrintHistorySort(),
    pageSize: loadStoredPrintHistoryPageSize(),
    page: 1,
    visibleColumns: loadStoredPrintHistoryVisibleColumns(),
    timeInDays: loadStoredPrintHistoryTimeInDays(),
    lengthInKilometers: loadStoredPrintHistoryLengthInKilometers(),
    loadedLimit: loadStoredPrintHistoryLoadLimit(),
    statusViewMode: loadStoredPrintHistoryStatusView(),
    statusValueMode: loadStoredPrintHistoryStatusValue(),
    trendMode: loadStoredPrintHistoryTrendMode(),
    columnsMenuOpen: false,
    selectedJobIds: new Set(),
  };
}

function createDefaultPrettyGcodeState() {
  return {
    isLoading: false,
    loadingFile: "",
    activeFile: "",
    sourceLabel: "",
    sourceMode: "live",
    sourceTextLength: 0,
    lastError: "",
    lastLoadedAtMs: null,
    parseRequestId: 0,
    segments: [],
    extrudingSegmentIndices: [],
    bounds: null,
    extrusionCount: 0,
    followToolhead: true,
    showMirror: true,
    showNozzle: true,
    orbitWhenIdle: false,
    toolhead: { x: null, y: null, z: null },
    simulationProgress: 0,
    simulationPlaying: false,
    simulationSpeed: 1,
    simulationDurationMs: PRETTY_GCODE_SIM_MIN_DURATION_MS,
    simulationLastTickMs: null,
    layerZValues: [],
    segmentLayerIndices: [],
    segmentExtrusionOrderInLayer: [],
    layerExtrusionCounts: [],
    layerExtrusionEndCounts: [],
    totalLayers: 0,
    selectedLayerIndex: 0,
    layerSelectionPinned: false,
  };
}
function createDefaultManualProbeState() {
  return {
    isActive: false,
    zPosition: 0,
    zPositionLower: null,
    zPositionUpper: null,
    actionInFlight: null,
    snapshot: {},
  };
}
function createDefaultRunoutSensorsState() {
  return {
    objectKeys: [],
    sensorsByKey: {},
    loading: false,
    lastError: "",
    lastUpdatedMs: null,
  };
}

const initialClearedStatusFilename = loadStoredStatusClearedFilename();

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
  interface: createInterfaceState(),
  warnings: normalizeWarningsSettings(loadStoredWarningsSettings()),
  macros: createMacroState(),
  thermalPresets: loadStoredThermalPresets(),
  thermalPresetDialogPresetId: null,
  thermalPresetDialogDraft: null,
  dashboard: {
    showPrintProgress: loadStoredBool(DASHBOARD_VISIBILITY_STORAGE_KEYS["card-print-progress"], true),
    showTemperatures: loadStoredBool(DASHBOARD_VISIBILITY_STORAGE_KEYS["card-temperatures"], true),
    showMotion: loadStoredBool(DASHBOARD_VISIBILITY_STORAGE_KEYS["card-motion"], true),
    showQuickCommands: loadStoredBool(DASHBOARD_VISIBILITY_STORAGE_KEYS["card-quick-commands"], true),
    showMacros: loadStoredBool(DASHBOARD_VISIBILITY_STORAGE_KEYS["card-macros"], true),
    showRunoutSensors: loadStoredBool(DASHBOARD_VISIBILITY_STORAGE_KEYS["card-runout-sensors"], true),
    showMainCamera: loadStoredBool(DASHBOARD_VISIBILITY_STORAGE_KEYS["camera-main-card"], true),
    showToolheadCamera: loadStoredBool(DASHBOARD_VISIBILITY_STORAGE_KEYS["camera-toolhead-card"], true),
    showConsole: loadStoredBool(DASHBOARD_VISIBILITY_STORAGE_KEYS["card-dashboard-console"], true),
    showKlipperView: loadStoredBool(DASHBOARD_VISIBILITY_STORAGE_KEYS[KLIPPERVIEW_CARD_ID], true),
    layoutsByViewport: loadDashboardLayoutsByViewport(),
    settingsViewport: "desktop",
    layout: loadDashboardLayout(),
  },
  controls: {
    distance: Number(loadStoredChoice("controls_jog_distance", "10", CONTROL_DISTANCE_VALUES.map(String))),
    extrusionAmount: loadStoredPositiveNumber("controls_extrusion_amount", 10, { min: 0.1, max: 1000 }),
    fanSpeed: loadStoredPositiveNumber("controls_fan_speed", 100, { min: 0, max: 100 }),
    zOffsetSteps: [...CONTROL_Z_OFFSET_STEPS],
    zOffsetSaveOption: normalizeZOffsetSaveOption(localStorage.getItem(CONTROL_Z_OFFSET_SAVE_OPTION_STORAGE_KEY)),
    configSettings: {},
    tools: [{ label: "Hotend", command: "T0" }],
    keyboardActive: false,
    feedRateResetter: null,
    flowRateResetter: null,
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
  toolsMenu: createDefaultToolsMenuState(),
  timelapse: createDefaultTimelapseControlState(),
  timelapseMedia: createDefaultTimelapseMediaState(),
  timelapseSettings: createDefaultTimelapseSettingsState(),
  spoolman: createDefaultSpoolmanState(),
  updateManager: createDefaultUpdateManagerState(),
  endstops: createDefaultEndstopsState(),
  logFiles: createDefaultMachineLogFilesState(),
  runoutSensors: createDefaultRunoutSensorsState(),
  jobs: createDefaultJobsState(),
  printHistory: createDefaultPrintHistoryState(),
  prettyGcode: createDefaultPrettyGcodeState(),
  manualProbe: createDefaultManualProbeState(),
  console: {
    seenStoreEntryKeys: new Set(),
    pendingCommandCounts: new Map(),
    storeSyncFailed: false,
    autoscroll: loadStoredBool(CONSOLE_AUTOSCROLL_STORAGE_KEY, true),
    filter: normalizeConsoleFilter(localStorage.getItem(CONSOLE_FILTER_STORAGE_KEY)),
    searchQuery: "",
    hideTemps: loadStoredBool(CONSOLE_HIDE_TEMPS_STORAGE_KEY, false),
    rawOutput: loadStoredBool(CONSOLE_RAW_OUTPUT_STORAGE_KEY, false),
    hideTimelapse: loadStoredBool(CONSOLE_HIDE_TIMELAPSE_STORAGE_KEY, false),
    direction: normalizeConsoleDirection(localStorage.getItem(CONSOLE_DIRECTION_STORAGE_KEY)),
    entryDesign: normalizeConsoleEntryDesign(localStorage.getItem(CONSOLE_ENTRY_DESIGN_STORAGE_KEY)),
    height: normalizeConsoleHeight(localStorage.getItem(CONSOLE_HEIGHT_STORAGE_KEY)),
    customFilters: loadStoredConsoleCustomFilters(),
    filterDraftId: null,
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
    lastToolhead: {},
    lastFanSpeed: null,
    countdownTargetMs: null,
    fileClearedAfterComplete: !!initialClearedStatusFilename,
    clearedFilename: initialClearedStatusFilename,
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

function normalizeConsoleDirection(value) {
  const normalized = String(value || "bottom").trim().toLowerCase();
  return CONSOLE_DIRECTION_VALUES.includes(normalized) ? normalized : "bottom";
}

function normalizeConsoleEntryDesign(value) {
  const normalized = String(value || "default").trim().toLowerCase();
  return CONSOLE_ENTRY_DESIGN_VALUES.includes(normalized) ? normalized : "default";
}

function normalizeConsoleHeight(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return CONSOLE_DEFAULT_HEIGHT;
  return Math.min(CONSOLE_MAX_HEIGHT, Math.max(CONSOLE_MIN_HEIGHT, Math.round(numeric)));
}

function normalizeConsoleCustomFilterEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const id = String(entry.id || "").trim().slice(0, 64);
  const name = String(entry.name || "").trim().slice(0, 40);
  const pattern = String(entry.pattern || "").trim().slice(0, 120);
  const enabled = entry.enabled !== false;
  if (!id || !name || !pattern) return null;
  try {
    void new RegExp(pattern, "i");
  } catch {
    return null;
  }
  return { id, name, pattern, enabled };
}

function loadStoredConsoleCustomFilters() {
  try {
    const raw = localStorage.getItem(CONSOLE_CUSTOM_FILTERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed
      .map((entry) => normalizeConsoleCustomFilterEntry(entry))
      .filter((entry) => !!entry);
    return normalized.slice(0, 24);
  } catch {
    return [];
  }
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
  const newestOnTop = state.console.direction === "top";
  getConsoleInstances().forEach((instance) => {
    const logElement = instance.log;
    if (!logElement) return;

    while (logElement.children.length > CONSOLE_MAX_LINES) {
      const target = newestOnTop ? logElement.lastElementChild : logElement.firstElementChild;
      if (!target) break;
      logElement.removeChild(target);
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

function isTimelapseConsoleMessage(message) {
  const normalized = String(message || "").trim().toLowerCase();
  if (!normalized) return false;
  return normalized.includes("timelapse")
    || normalized.includes("snapshot")
    || normalized.includes("take_frame")
    || normalized.includes("render");
}

function doesConsoleMatchCustomFilter(message) {
  const sourceText = String(message || "");
  if (!sourceText) return false;

  const filters = Array.isArray(state.console.customFilters) ? state.console.customFilters : [];
  return filters.some((entry) => {
    if (!entry?.enabled) return false;
    try {
      return new RegExp(entry.pattern, "i").test(sourceText);
    } catch {
      return false;
    }
  });
}

function doesConsoleLineMatchFilter(line) {
  if (!line) return false;

  const filter = normalizeConsoleFilter(state.console.filter);
  if (filter !== "all" && line.dataset.consoleType !== filter) {
    return false;
  }

  const sourceText = String(line.dataset.consoleMessage || line.textContent || "");

  if (state.console.hideTemps && line.dataset.consoleType === "response") {
    if (isTemperatureConsoleMessage(sourceText)) {
      return false;
    }
  }

  if (state.console.hideTimelapse && line.dataset.consoleType === "command") {
    if (isTimelapseConsoleMessage(sourceText)) {
      return false;
    }
  }

  if (doesConsoleMatchCustomFilter(sourceText)) {
    return false;
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

function scrollConsoleToLatest() {
  const newestOnTop = state.console.direction === "top";
  getConsoleInstances().forEach((instance) => {
    if (!instance.log) return;
    instance.log.scrollTop = newestOnTop ? 0 : instance.log.scrollHeight;
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
    scrollConsoleToLatest();
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

  const newestOnTop = state.console.direction === "top";
  logElements.forEach((logElement, index) => {
    const lineToAppend = index === 0 ? line : line.cloneNode(true);
    applyConsoleLineVisibility(lineToAppend);
    if (newestOnTop) {
      logElement.prepend(lineToAppend);
    } else {
      logElement.appendChild(lineToAppend);
    }
  });

  trimConsoleLog();
  updateConsoleMeta();

  if (state.console.autoscroll && !state.console.paused) {
    scrollConsoleToLatest();
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
    scrollConsoleToLatest();
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

  if (els.settingsConsoleHideTemps) {
    els.settingsConsoleHideTemps.checked = state.console.hideTemps;
  }

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

function persistConsoleDisplaySettings() {
  localStorage.setItem(CONSOLE_DIRECTION_STORAGE_KEY, state.console.direction);
  localStorage.setItem(CONSOLE_ENTRY_DESIGN_STORAGE_KEY, state.console.entryDesign);
  localStorage.setItem(CONSOLE_HEIGHT_STORAGE_KEY, String(state.console.height));
}

function persistConsoleCustomFilters() {
  localStorage.setItem(CONSOLE_CUSTOM_FILTERS_STORAGE_KEY, JSON.stringify(state.console.customFilters || []));
}

function applyConsoleDisplaySettings() {
  const direction = normalizeConsoleDirection(state.console.direction);
  const entryDesign = normalizeConsoleEntryDesign(state.console.entryDesign);
  const height = normalizeConsoleHeight(state.console.height);

  state.console.direction = direction;
  state.console.entryDesign = entryDesign;
  state.console.height = height;

  document.documentElement.dataset.consoleDirection = direction;
  document.documentElement.dataset.consoleEntryDesign = entryDesign;
  document.documentElement.style.setProperty("--console-panel-height", String(height) + "px");

  getConsoleInstances().forEach((instance) => {
    const log = instance.log;
    if (!log) return;
    const previousDirection = log.dataset.consoleDirection || "bottom";
    if (previousDirection !== direction) {
      const lines = [...log.children].reverse();
      lines.forEach((line) => log.appendChild(line));
      log.dataset.consoleDirection = direction;
    }
  });

  if (!state.console.paused && state.console.autoscroll) {
    scrollConsoleToLatest();
  }
}

function resetConsoleFilterEditor() {
  state.console.filterDraftId = null;
  if (els.settingsConsoleFilterName) els.settingsConsoleFilterName.value = "";
  if (els.settingsConsoleFilterRegex) els.settingsConsoleFilterRegex.value = "";
  if (els.settingsConsoleFilterEnabled) els.settingsConsoleFilterEnabled.checked = true;
  if (els.settingsConsoleFilterEditor) {
    els.settingsConsoleFilterEditor.hidden = true;
  }
}

function openConsoleFilterEditor(entry = null) {
  state.console.filterDraftId = entry?.id || null;
  if (els.settingsConsoleFilterName) els.settingsConsoleFilterName.value = entry?.name || "";
  if (els.settingsConsoleFilterRegex) els.settingsConsoleFilterRegex.value = entry?.pattern || "";
  if (els.settingsConsoleFilterEnabled) els.settingsConsoleFilterEnabled.checked = entry?.enabled !== false;
  if (els.settingsConsoleFilterEditor) {
    els.settingsConsoleFilterEditor.hidden = false;
  }
  els.settingsConsoleFilterName?.focus();
}

function renderConsoleCustomFilterList() {
  const list = els.settingsConsoleFilterList;
  if (!list) return;

  const entries = Array.isArray(state.console.customFilters) ? state.console.customFilters : [];
  list.replaceChildren();

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "muted settings-console-empty";
    empty.textContent = "No custom filters configured.";
    list.appendChild(empty);
    return;
  }

  entries.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "settings-console-filter-item";

    const meta = document.createElement("div");
    meta.className = "settings-console-filter-meta";

    const title = document.createElement("strong");
    title.textContent = entry.name;
    meta.appendChild(title);

    const pattern = document.createElement("code");
    pattern.textContent = entry.pattern;
    meta.appendChild(pattern);

    const actions = document.createElement("div");
    actions.className = "settings-console-filter-actions";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.textContent = entry.enabled ? "Disable" : "Enable";
    toggle.addEventListener("click", () => {
      state.console.customFilters = entries.map((item) => item.id === entry.id ? { ...item, enabled: !item.enabled } : item);
      persistConsoleCustomFilters();
      renderConsoleCustomFilterList();
      refreshConsoleVisibility();
    });

    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => {
      openConsoleFilterEditor(entry);
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => {
      state.console.customFilters = entries.filter((item) => item.id !== entry.id);
      if (state.console.filterDraftId === entry.id) {
        resetConsoleFilterEditor();
      }
      persistConsoleCustomFilters();
      renderConsoleCustomFilterList();
      refreshConsoleVisibility();
    });

    actions.append(toggle, edit, remove);
    row.append(meta, actions);
    list.appendChild(row);
  });
}

function syncConsoleSettingsControls() {
  if (els.settingsConsoleDirection) {
    els.settingsConsoleDirection.value = normalizeConsoleDirection(state.console.direction);
  }

  if (els.settingsConsoleEntryDesign) {
    els.settingsConsoleEntryDesign.value = normalizeConsoleEntryDesign(state.console.entryDesign);
  }

  if (els.settingsConsoleHeight) {
    els.settingsConsoleHeight.value = String(normalizeConsoleHeight(state.console.height));
  }

  if (els.settingsConsoleHideTemps) {
    els.settingsConsoleHideTemps.checked = !!state.console.hideTemps;
  }

  if (els.settingsConsoleHideTimelapse) {
    els.settingsConsoleHideTimelapse.checked = !!state.console.hideTimelapse;
  }

  renderConsoleCustomFilterList();
}

function setConsoleHideTimelapse(enabled) {
  state.console.hideTimelapse = !!enabled;
  localStorage.setItem(CONSOLE_HIDE_TIMELAPSE_STORAGE_KEY, String(state.console.hideTimelapse));
  if (els.settingsConsoleHideTimelapse) {
    els.settingsConsoleHideTimelapse.checked = state.console.hideTimelapse;
  }
  refreshConsoleVisibility();
}

function saveConsoleFilterFromEditor() {
  const draftId = String(state.console.filterDraftId || "").trim();
  const name = String(els.settingsConsoleFilterName?.value || "").trim();
  const pattern = String(els.settingsConsoleFilterRegex?.value || "").trim();
  const enabled = !!els.settingsConsoleFilterEnabled?.checked;

  if (!name || !pattern) {
    appendConsole("Custom filter requires both name and regex pattern.", "warn");
    return;
  }

  const entry = normalizeConsoleCustomFilterEntry({
    id: draftId || `console-filter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    pattern,
    enabled,
  });

  if (!entry) {
    appendConsole("Custom filter regex is invalid.", "warn");
    return;
  }

  const entries = Array.isArray(state.console.customFilters) ? state.console.customFilters : [];
  const hasExisting = entries.some((item) => item.id === entry.id);
  state.console.customFilters = hasExisting
    ? entries.map((item) => item.id === entry.id ? entry : item)
    : [...entries, entry].slice(-24);

  persistConsoleCustomFilters();
  renderConsoleCustomFilterList();
  refreshConsoleVisibility();
  resetConsoleFilterEditor();
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
    renderControlsPanel();
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

function normalizeSettingsAnchor(value) {
  const anchor = String(value || "").trim();
  return SETTINGS_SUBNAV_ANCHORS.includes(anchor) ? anchor : "";
}

function setActiveSettingsSubnavAnchor(anchor) {
  const normalized = normalizeSettingsAnchor(anchor);
  let found = false;

  els.settingsSubnavItems.forEach((item) => {
    const itemAnchor = normalizeSettingsAnchor(item.dataset.settingsAnchor);
    const isActive = !!normalized && itemAnchor === normalized;
    item.classList.toggle("active", isActive);

    if (isActive) {
      item.setAttribute("aria-current", "location");
      found = true;
    } else {
      item.removeAttribute("aria-current");
    }
  });

  if (!found && els.settingsSubnavItems.length) {
    els.settingsSubnavItems[0].classList.add("active");
    els.settingsSubnavItems[0].setAttribute("aria-current", "location");
  }
}

function updateSettingsSubnavVisibility() {
  if (!els.settingsSubnav) return;

  const shouldShow = state.activeView === "settings" && !state.interface.sidebarCollapsed;
  els.settingsSubnav.hidden = !shouldShow;
  els.settingsSubnav.setAttribute("aria-hidden", String(!shouldShow));

  if (shouldShow) {
    queueSettingsSubnavSync();
  }
}

function scrollSettingsSectionIntoView(anchor, { behavior = "smooth" } = {}) {
  const normalized = normalizeSettingsAnchor(anchor);
  if (!normalized) return false;

  const target = els.settingsSections.find((section) =>
    normalizeSettingsAnchor(section.getAttribute("data-settings-section")) === normalized
  );

  if (!(target instanceof HTMLElement)) return false;

  setActiveSettingsSubnavAnchor(normalized);
  target.scrollIntoView({ behavior, block: "start", inline: "nearest" });
  return true;
}

function syncSettingsSubnavFromViewport() {
  if (state.activeView !== "settings") return;
  if (!els.settingsSections.length) return;

  const topOffset = 152;
  let activeAnchor = "";
  let bestScore = Number.POSITIVE_INFINITY;

  els.settingsSections.forEach((section) => {
    if (!(section instanceof HTMLElement)) return;

    const anchor = normalizeSettingsAnchor(section.dataset.settingsSection);
    if (!anchor) return;

    const rect = section.getBoundingClientRect();
    const delta = rect.top - topOffset;
    const score = delta <= 0 ? Math.abs(delta) * 0.25 : delta;

    if (score < bestScore) {
      bestScore = score;
      activeAnchor = anchor;
    }
  });

  if (activeAnchor) {
    setActiveSettingsSubnavAnchor(activeAnchor);
  }
}

function queueSettingsSubnavSync() {
  if (settingsSubnavScrollRaf !== null) return;

  settingsSubnavScrollRaf = window.requestAnimationFrame(() => {
    settingsSubnavScrollRaf = null;
    syncSettingsSubnavFromViewport();
  });
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

const themeWatermarkResolvedLogoUrls = new Map();
const themeWatermarkResolutionAttempted = new Set();
const themeWatermarkResolvePromises = new Map();

function probeImageUrl(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = url;
  });
}

async function resolveThemeWatermarkLogoUrl(themeName) {
  const candidates = Array.isArray(THEME_WATERMARK_LOGO_CANDIDATES[themeName])
    ? THEME_WATERMARK_LOGO_CANDIDATES[themeName]
    : [];

  for (const candidate of candidates) {
    try {
      const found = await probeImageUrl(candidate);
      if (found) return candidate;
    } catch {
      // Ignore probe failures and continue to next candidate.
    }
  }

  return "";
}

function applyThemeWatermarkLogo(themeName) {
  const cssVar = THEME_WATERMARK_CSS_VARIABLES[themeName];
  if (!cssVar) return;

  if (themeName === "pbhs") {
    const resolvedPbhsUrl = themeWatermarkResolvedLogoUrls.get("pbhs") || "";
    if (resolvedPbhsUrl.includes("/branding/poplar-bluff-high-school-logo")) {
      themeWatermarkResolvedLogoUrls.delete("pbhs");
      themeWatermarkResolutionAttempted.delete("pbhs");
    }
  }

  if (state.interface.theme !== themeName) {
    document.documentElement.style.removeProperty(cssVar);
    return;
  }

  if (themeWatermarkResolutionAttempted.has(themeName)) {
    const resolvedUrl = themeWatermarkResolvedLogoUrls.get(themeName) || "";
    if (resolvedUrl) {
      document.documentElement.style.setProperty(
        cssVar,
        getCssUrlValue(resolvedUrl)
      );
    } else {
      document.documentElement.style.removeProperty(cssVar);
    }
    return;
  }

  if (themeWatermarkResolvePromises.has(themeName)) return;

  const resolvePromise = resolveThemeWatermarkLogoUrl(themeName)
    .then((resolvedUrl) => {
      const normalizedResolvedUrl = resolvedUrl || "";
      themeWatermarkResolutionAttempted.add(themeName);
      themeWatermarkResolvedLogoUrls.set(themeName, normalizedResolvedUrl);

      if (state.interface.theme !== themeName) return;

      if (normalizedResolvedUrl) {
        document.documentElement.style.setProperty(
          cssVar,
          getCssUrlValue(normalizedResolvedUrl)
        );
      } else {
        document.documentElement.style.removeProperty(cssVar);
      }
    })
    .finally(() => {
      themeWatermarkResolvePromises.delete(themeName);
    });

  themeWatermarkResolvePromises.set(themeName, resolvePromise);
}

function applyInterfaceThemeWatermarkLogos() {
  Object.keys(THEME_WATERMARK_CSS_VARIABLES).forEach((themeName) => {
    applyThemeWatermarkLogo(themeName);
  });
}

function persistInterfaceThemeSettings() {
  localStorage.setItem("interface_theme", state.interface.theme);
  localStorage.setItem(INTERFACE_THEME_PRESET_STORAGE_KEY, state.interface.themePreset || INTERFACE_THEME_PRESET_CUSTOM);
  localStorage.setItem(
    INTERFACE_THEME_PALETTE_STORAGE_KEY,
    JSON.stringify(normalizeThemePalette(state.interface.themePalette, state.interface.theme))
  );
}

function persistInterfaceBackgroundImageSettings() {
  localStorage.setItem(INTERFACE_BACKGROUND_IMAGE_ENABLED_STORAGE_KEY, String(!!state.interface.backgroundImageEnabled));
  const url = normalizeInterfaceBackgroundImageUrl(state.interface.backgroundImageUrl);
  state.interface.backgroundImageUrl = url;

  if (url) {
    localStorage.setItem(INTERFACE_BACKGROUND_IMAGE_URL_STORAGE_KEY, url);
  } else {
    localStorage.removeItem(INTERFACE_BACKGROUND_IMAGE_URL_STORAGE_KEY);
  }
}

function getCssUrlValue(url) {
  const normalized = normalizeInterfaceBackgroundImageUrl(url);
  if (!normalized) return "none";
  const escaped = normalized.replace(/["\\\n\r]/g, "\\$&");
  return `url("${escaped}")`;
}

function applyInterfaceBackgroundImage() {
  const enabled = !!state.interface.backgroundImageEnabled;
  const url = normalizeInterfaceBackgroundImageUrl(state.interface.backgroundImageUrl);
  const hasImage = enabled && !!url;
  document.documentElement.style.setProperty("--app-bg-image", hasImage ? getCssUrlValue(url) : "none");
}

function syncInterfaceBackgroundImageControls() {
  if (els.interfaceBgImageEnabled) {
    els.interfaceBgImageEnabled.checked = !!state.interface.backgroundImageEnabled;
  }

  if (els.interfaceBgImageUrl) {
    els.interfaceBgImageUrl.value = normalizeInterfaceBackgroundImageUrl(state.interface.backgroundImageUrl);
    els.interfaceBgImageUrl.disabled = !state.interface.backgroundImageEnabled;
  }

  if (els.interfaceBgImageApply) {
    els.interfaceBgImageApply.disabled = !state.interface.backgroundImageEnabled;
  }
}

function applyThemePaletteOverrides() {
  const palette = normalizeThemePalette(state.interface.themePalette, state.interface.theme);
  state.interface.themePalette = palette;

  INTERFACE_THEME_COLOR_FIELDS.forEach((field) => {
    const value = normalizeThemeColorValue(palette[field.key], "");
    if (!value) {
      document.documentElement.style.removeProperty(field.cssVar);
      return;
    }

    document.documentElement.style.setProperty(field.cssVar, value);
  });
}

function syncThemeEditorControls() {
  if (els.themeCommunityPreset) {
    let presetId = COMMUNITY_THEME_PRESET_IDS.includes(state.interface.themePreset)
      ? state.interface.themePreset
      : INTERFACE_THEME_PRESET_CUSTOM;

    if (
      presetId === INTERFACE_THEME_PRESET_CUSTOM &&
      isThemePaletteMatchingBaseTheme(state.interface.theme, state.interface.themePalette)
    ) {
      presetId = getThemeBasePresetOptionId(state.interface.theme);
    }

    const hasPresetOption = [...els.themeCommunityPreset.options].some((option) => option.value === presetId);
    els.themeCommunityPreset.value = hasPresetOption ? presetId : INTERFACE_THEME_PRESET_CUSTOM;
  }

  INTERFACE_THEME_COLOR_FIELDS.forEach((field) => {
    const input = els[field.elKey];
    if (!input) return;

    input.value = normalizeThemeColorValue(
      state.interface.themePalette[field.key],
      getThemeBasePalette(state.interface.theme)[field.key]
    );
  });

  syncInterfaceBackgroundImageControls();
}

function setThemePaletteColor(colorKey, value, { persist = true } = {}) {
  const fallback = getThemeBasePalette(state.interface.theme)[colorKey] || "#000000";
  const nextColor = normalizeThemeColorValue(value, fallback);

  state.interface.themePalette = {
    ...state.interface.themePalette,
    [colorKey]: nextColor,
  };
  state.interface.themePreset = INTERFACE_THEME_PRESET_CUSTOM;

  applyInterfaceSettings();
  syncThemeEditorControls();

  if (persist) {
    persistInterfaceThemeSettings();
  }
}

function resetThemePaletteToBaseTheme({ persist = true } = {}) {
  state.interface.themePalette = getThemeBasePalette(state.interface.theme);
  state.interface.themePreset = INTERFACE_THEME_PRESET_CUSTOM;

  applyInterfaceSettings();
  syncThemeEditorControls();

  if (persist) {
    persistInterfaceThemeSettings();
  }
}

function applyThemePresetById(presetId, { persist = true } = {}) {
  const baseTheme = parseThemeBasePresetOptionId(presetId);
  if (baseTheme) {
    state.interface.theme = baseTheme;
    state.interface.themePreset = INTERFACE_THEME_PRESET_CUSTOM;
    state.interface.themePalette = getThemeBasePalette(baseTheme);

    applyInterfaceSettings();
    syncThemeEditorControls();

    if (persist) {
      persistInterfaceThemeSettings();
    }

    return true;
  }

  if (presetId === INTERFACE_THEME_PRESET_CUSTOM) {
    resetThemePaletteToBaseTheme({ persist });
    return true;
  }

  const preset = COMMUNITY_THEME_PRESETS.find((entry) => entry.id === presetId);
  if (!preset) return false;

  state.interface.theme = INTERFACE_THEMES.includes(preset.baseTheme) ? preset.baseTheme : DEFAULT_INTERFACE_THEME;
  state.interface.themePreset = preset.id;
  state.interface.themePalette = normalizeThemePalette(preset.palette, state.interface.theme);

  applyInterfaceSettings();
  syncThemeEditorControls();

  if (persist) {
    persistInterfaceThemeSettings();
  }

  return true;
}

function applyInterfaceSettings() {
  document.documentElement.dataset.theme = state.interface.theme;
  applyThemePaletteOverrides();
  applyInterfaceThemeWatermarkLogos();
  applyInterfaceBackgroundImage();
  document.documentElement.dataset.density = state.interface.density;
  document.body.classList.toggle("compact-mode", state.interface.compact);
  document.body.classList.toggle("sidebar-collapsed", state.interface.sidebarCollapsed);
  els.machineLayout?.classList.toggle("machine-side-collapsed", !!state.interface.machineSideCollapsed);
  updateSidebarToggleUi();
  updateMachineSideToggleUi();
  updateSettingsSubnavVisibility();
}

function isPrettyGcodeViewerVisible() {
  if (!els.prettyGcodeCard || !els.prettyGcodeCanvas) return false;
  if (els.prettyGcodeCard.classList.contains("card-hidden")) return false;
  return state.activeView === "pretty-gcode" || state.activeView === "dashboard";
}

function getDashboardRuntimeColumnId(columnIndex) {
  if (columnIndex === 0) return "dashboard-col-left";
  if (columnIndex === 1) return "dashboard-col-right";
  return `dashboard-col-${columnIndex + 1}`;
}

function getDashboardRuntimeColumns() {
  if (!els.dashboardCards) return [];
  return [...els.dashboardCards.querySelectorAll(".dashboard-column")];
}

function getDashboardCardElement(cardId) {
  switch (cardId) {
    case "card-print-progress":
      return els.cardPrintProgress;
    case "card-temperatures":
      return els.cardTemperatures;
    case "card-motion":
      return els.cardMotion;
    case "card-quick-commands":
      return els.cardQuickCommands;
    case "card-macros":
      return els.cardMacros;
    case "card-runout-sensors":
      return els.cardRunoutSensors;
    case "card-dashboard-console":
      return els.cardDashboardConsole;
    case "camera-main-card":
      return els.cardMainCamera;
    case "camera-toolhead-card":
      return els.cardToolheadCamera;
    case KLIPPERVIEW_CARD_ID:
      return els.prettyGcodeCard;
    default:
      return document.getElementById(cardId);
  }
}

function syncDashboardRuntimeColumns(columnCountCandidate) {
  if (!els.dashboardCards) return [];

  const requestedCount = Number(columnCountCandidate);
  const columnCount = Math.max(1, Math.min(6, Number.isFinite(requestedCount) ? Math.round(requestedCount) : 1));
  const existingById = new Map(
    getDashboardRuntimeColumns()
      .filter((column) => column.id)
      .map((column) => [column.id, column])
  );
  const nextColumns = [];

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const columnId = getDashboardRuntimeColumnId(columnIndex);
    let column = existingById.get(columnId) || document.getElementById(columnId);

    if (!column) {
      column = document.createElement("div");
      column.className = "dashboard-column";
      column.id = columnId;
    }

    column.dataset.dashboardRuntimeColumn = String(columnIndex);
    nextColumns.push(column);
  }

  els.dashboardCards.replaceChildren(...nextColumns);
  els.dashboardCards.style.gridTemplateColumns = `repeat(${columnCount}, minmax(0, 1fr))`;
  els.dashboardCards.dataset.dashboardColumns = String(columnCount);
  els.dashboardCards.classList.toggle("two-col", columnCount === 2);

  els.dashboardColLeft = nextColumns[0] || null;
  els.dashboardColRight = nextColumns[1] || null;

  return nextColumns;
}

function syncPrettyGcodeCardPlacement() {
  if (!els.prettyGcodeCard) return;

  if (state.activeView === "pretty-gcode") {
    if (els.prettyGcodeView && els.prettyGcodeCard.parentElement !== els.prettyGcodeView) {
      els.prettyGcodeView.appendChild(els.prettyGcodeCard);
    }
    return;
  }

  const runtimeViewport = getDashboardAppliedViewport();
  const runtimeLayout = getDashboardLayoutForViewport(runtimeViewport);
  const expectedColumnCount = runtimeLayout.columns?.length || getDashboardViewportColumnCount(runtimeViewport);
  const runtimeColumns = getDashboardRuntimeColumns().length === expectedColumnCount
    ? getDashboardRuntimeColumns()
    : syncDashboardRuntimeColumns(expectedColumnCount);
  const targetColumnIndex = Math.max(0, runtimeLayout.columns.findIndex((column) => (column || []).includes(KLIPPERVIEW_CARD_ID)));
  const targetColumn = runtimeColumns[targetColumnIndex] || runtimeColumns[0] || null;

  if (targetColumn && els.prettyGcodeCard.parentElement !== targetColumn) {
    targetColumn.appendChild(els.prettyGcodeCard);
  }
}

function applyDashboardLayout() {
  if (!els.dashboardCards) return;

  const runtimeViewport = getDashboardAppliedViewport();
  const runtimeLayout = getDashboardLayoutForViewport(runtimeViewport);
  const runtimeColumns = syncDashboardRuntimeColumns(runtimeLayout.columns?.length || getDashboardViewportColumnCount(runtimeViewport));
  const keepKlipperViewInViewer = state.activeView === "pretty-gcode";
  state.dashboard.layout = convertViewportLayoutToLegacyLayout(runtimeLayout, runtimeViewport);

  runtimeColumns.forEach((columnEl, columnIndex) => {
    const fragment = document.createDocumentFragment();
    const cardsInColumn = runtimeLayout.columns?.[columnIndex] || [];

    cardsInColumn.forEach((cardId) => {
      if (keepKlipperViewInViewer && cardId === KLIPPERVIEW_CARD_ID) return;
      const card = getDashboardCardElement(cardId);
      if (card) fragment.appendChild(card);
    });

    columnEl.appendChild(fragment);
  });

  syncPrettyGcodeCardPlacement();
}

function applyDashboardSettings() {
  const visibilityMap = [
    [els.cardPrintProgress, state.dashboard.showPrintProgress],
    [els.cardTemperatures, state.dashboard.showTemperatures],
    [els.cardMotion, state.dashboard.showMotion],
    [els.cardQuickCommands, state.dashboard.showQuickCommands],
    [els.cardMacros, state.dashboard.showMacros],
    [els.cardRunoutSensors, state.dashboard.showRunoutSensors],
    [els.cardMainCamera, state.dashboard.showMainCamera],
    [els.cardToolheadCamera, state.dashboard.showToolheadCamera],
    [els.cardDashboardConsole, state.dashboard.showConsole],
    [els.prettyGcodeCard, state.dashboard.showKlipperView],
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
  state.dashboard.layout = getRuntimeDashboardLegacyLayout(getDashboardAppliedViewport());
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
  const viewport = getDashboardAppliedViewport();
  state.dashboard.layout = normalizeDashboardLayout(state.dashboard.layout);
  const viewportLayout = convertLegacyLayoutToViewportLayout(state.dashboard.layout, viewport);
  setDashboardLayoutForViewport(viewport, viewportLayout, { persist: true });

  localStorage.setItem(DASHBOARD_LAYOUT_LEGACY_STORAGE_KEY, JSON.stringify(state.dashboard.layout));
  localStorage.setItem(DASHBOARD_LAYOUT_LEGACY_ORDER_STORAGE_KEY, JSON.stringify(flattenDashboardLayout(state.dashboard.layout)));

  applyDashboardLayout();
  applyDashboardSettings();
  renderSettingsDashboardLayout();
  closeDashboardLayoutDialog();
  appendConsole("Dashboard layout saved.");
}

function resetDashboardLayout() {
  const viewport = getDashboardAppliedViewport();
  const defaults = getDashboardDefaultLayoutForViewport(viewport);
  state.dashboard.layout = convertViewportLayoutToLegacyLayout(defaults, viewport);
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

function normalizeToolsMenuPowerDevices(payload) {
  const root = payload?.result?.devices ?? payload?.result ?? payload?.devices ?? payload;
  if (!Array.isArray(root)) return [];

  return root
    .map((entry) => {
      const device = String(entry?.device ?? entry?.name ?? "").trim();
      if (!device) return null;

      return {
        device,
        status: String(entry?.status ?? entry?.state ?? "unknown").trim().toLowerCase(),
        lockedWhilePrinting: !!entry?.locked_while_printing,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.device.localeCompare(b.device));
}

function normalizeToolsMenuServices(systemInfo) {
  const stateMap = systemInfo?.service_state;
  const available = Array.isArray(systemInfo?.available_services) ? systemInfo.available_services : [];
  const merged = new Map();

  if (stateMap && typeof stateMap === "object" && !Array.isArray(stateMap)) {
    Object.entries(stateMap).forEach(([name, meta]) => {
      const normalizedName = String(name || "").trim();
      if (!normalizedName) return;

      merged.set(normalizedName, {
        name: normalizedName,
        activeState: String(meta?.active_state ?? meta?.state ?? "unknown").trim().toLowerCase(),
        subState: String(meta?.sub_state ?? "").trim().toLowerCase(),
      });
    });
  }

  available.forEach((entry) => {
    const normalizedName = String(entry || "").trim();
    if (!normalizedName || merged.has(normalizedName)) return;

    merged.set(normalizedName, {
      name: normalizedName,
      activeState: "unknown",
      subState: "",
    });
  });

  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function isPrintActiveForSystemActions() {
  const printState = normalizePrinterState(
    state.printStatus?.lastPrintStats?.state
      || state.printStatus?.lastPrintStats?.status
      || els.printerState?.dataset?.state
  );

  return printState === "printing" || printState === "paused";
}

function setToolsMenuOpen(isOpen, { refresh = true } = {}) {
  const open = !!isOpen;
  state.toolsMenu.open = open;

  if (els.toolsMenuToggle) {
    els.toolsMenuToggle.setAttribute("aria-expanded", String(open));
  }

  if (els.toolsDrawerBackdrop) {
    els.toolsDrawerBackdrop.hidden = !open;
  }

  if (els.toolsDrawer) {
    els.toolsDrawer.setAttribute("aria-hidden", String(!open));
  }

  document.body.classList.toggle("tools-drawer-open", open);

  if (open && refresh) {
    void refreshToolsMenuData({ silent: true });
  }

  renderToolsMenu();
}

function renderToolsMenu() {
  const connected = !!state.client && state.connectionStatus === "connected";
  const busy = isPrintActiveForSystemActions();
  const supportsHostControl = !!state.toolsMenu.supportsHostControl;

  const hostRebootBtn = els.toolsDrawer?.querySelector('[data-tools-action="host-reboot"]');
  const hostShutdownBtn = els.toolsDrawer?.querySelector('[data-tools-action="host-shutdown"]');

  [hostRebootBtn, hostShutdownBtn].forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;

    button.disabled = !connected || busy || state.toolsMenu.actionInFlight || !supportsHostControl;
    if (!supportsHostControl) {
      button.title = "Host control is unavailable in containerized environments.";
    } else if (busy) {
      button.title = "Disabled while printing or paused.";
    } else {
      button.title = "";
    }
  });

  if (els.toolsPowerStatus) {
    if (!connected) {
      els.toolsPowerStatus.textContent = "Connect to Moonraker to load power devices.";
    } else if (state.toolsMenu.loading) {
      els.toolsPowerStatus.textContent = "Loading power devices...";
    } else if (!state.toolsMenu.powerDevices.length) {
      els.toolsPowerStatus.textContent = "No power devices reported by Moonraker.";
    } else {
      els.toolsPowerStatus.textContent = "";
    }
  }

  if (els.toolsPowerList) {
    els.toolsPowerList.innerHTML = "";

    state.toolsMenu.powerDevices.forEach((device) => {
      const item = document.createElement("div");
      item.className = "tools-power-item";

      const label = document.createElement("div");
      label.className = "tools-power-label";

      const name = document.createElement("span");
      name.className = "tools-power-name";
      name.textContent = device.device;

      const stateLabel = document.createElement("span");
      stateLabel.className = "tools-power-state";
      const normalizedStatus = String(device.status || "unknown").trim().toLowerCase();
      stateLabel.textContent = `State: ${normalizedStatus || "unknown"}`;

      label.append(name, stateLabel);

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "tools-power-toggle";
      toggle.dataset.toolsPowerDevice = device.device;
      toggle.dataset.toolsPowerAction = normalizedStatus === "on" ? "off" : "on";
      toggle.textContent = normalizedStatus === "on" ? "Turn Off" : "Turn On";

      const isDeviceUnavailable = ["error", "init"].includes(normalizedStatus);
      const isLocked = busy && device.lockedWhilePrinting;
      toggle.disabled = !connected || state.toolsMenu.loading || state.toolsMenu.actionInFlight || isDeviceUnavailable || isLocked;

      item.append(label, toggle);
      els.toolsPowerList.appendChild(item);
    });
  }

  if (els.toolsServicesStatus) {
    if (!connected) {
      els.toolsServicesStatus.textContent = "Connect to Moonraker to load services.";
    } else if (state.toolsMenu.loading) {
      els.toolsServicesStatus.textContent = "Loading services...";
    } else if (!state.toolsMenu.services.length) {
      els.toolsServicesStatus.textContent = "No services reported by Moonraker.";
    } else {
      els.toolsServicesStatus.textContent = "";
    }
  }

  if (els.toolsServicesList) {
    els.toolsServicesList.innerHTML = "";

    state.toolsMenu.services.forEach((service) => {
      const row = document.createElement("div");
      row.className = "tools-service-row";

      const head = document.createElement("div");
      head.className = "tools-service-head";

      const name = document.createElement("span");
      name.className = "tools-service-name";
      name.textContent = service.name;

      const serviceState = service.subState
        ? `${service.activeState} (${service.subState})`
        : service.activeState;

      const stateLabel = document.createElement("span");
      stateLabel.className = "tools-service-state";
      stateLabel.textContent = serviceState;

      head.append(name, stateLabel);

      const actions = document.createElement("div");
      actions.className = "tools-service-actions";

      const startButton = document.createElement("button");
      startButton.type = "button";
      startButton.className = "tools-service-btn";
      startButton.textContent = "Start";
      startButton.dataset.toolsServiceAction = "start";
      startButton.dataset.toolsServiceName = service.name;
      startButton.disabled = !connected || state.toolsMenu.loading || state.toolsMenu.actionInFlight || service.activeState !== "inactive";

      const restartButton = document.createElement("button");
      restartButton.type = "button";
      restartButton.className = "tools-service-btn";
      restartButton.textContent = "Restart";
      restartButton.dataset.toolsServiceAction = "restart";
      restartButton.dataset.toolsServiceName = service.name;
      restartButton.disabled = !connected || state.toolsMenu.loading || state.toolsMenu.actionInFlight || busy;

      const stopButton = document.createElement("button");
      stopButton.type = "button";
      stopButton.className = "tools-service-btn danger";
      stopButton.textContent = "Stop";
      stopButton.dataset.toolsServiceAction = "stop";
      stopButton.dataset.toolsServiceName = service.name;
      stopButton.disabled = !connected
        || state.toolsMenu.loading
        || state.toolsMenu.actionInFlight
        || busy
        || service.activeState === "inactive"
        || service.name.toLowerCase() === "moonraker";

      actions.append(startButton, restartButton, stopButton);
      row.append(head, actions);
      els.toolsServicesList.appendChild(row);
    });
  }

  if (connected && state.toolsMenu.lastError) {
    if (els.toolsPowerStatus && !els.toolsPowerStatus.textContent) {
      els.toolsPowerStatus.textContent = `Power update issue: ${state.toolsMenu.lastError}`;
    }
    if (els.toolsServicesStatus && !els.toolsServicesStatus.textContent) {
      els.toolsServicesStatus.textContent = `Service update issue: ${state.toolsMenu.lastError}`;
    }
  }
}

async function refreshToolsMenuData({ silent = false } = {}) {
  if (!state.toolsMenu) {
    state.toolsMenu = createDefaultToolsMenuState();
  }

  const connected = !!state.client && state.connectionStatus === "connected";

  if (!connected) {
    state.toolsMenu.loading = false;
    state.toolsMenu.powerDevices = [];
    state.toolsMenu.services = normalizeToolsMenuServices(state.machineLoads?.systemInfo || null);
    state.toolsMenu.supportsHostControl = true;
    if (!silent) {
      state.toolsMenu.lastError = "";
    }
    renderToolsMenu();
    return;
  }

  state.toolsMenu.loading = true;
  if (!silent) {
    state.toolsMenu.lastError = "";
  }
  renderToolsMenu();

  const [powerResult, systemInfoResult] = await Promise.allSettled([
    state.client.getMachinePowerDevices(),
    state.client.getMachineSystemInfo(),
  ]);

  const errors = [];

  if (powerResult.status === "fulfilled") {
    state.toolsMenu.powerDevices = normalizeToolsMenuPowerDevices(powerResult.value);
  } else {
    errors.push(powerResult.reason?.message || String(powerResult.reason));
  }

  let systemInfo = state.machineLoads?.systemInfo || null;

  if (systemInfoResult.status === "fulfilled") {
    systemInfo = systemInfoResult.value?.result?.system_info || systemInfoResult.value?.result || null;
    state.machineLoads.systemInfo = systemInfo;
  } else {
    errors.push(systemInfoResult.reason?.message || String(systemInfoResult.reason));
  }

  state.toolsMenu.services = normalizeToolsMenuServices(systemInfo);
  state.toolsMenu.supportsHostControl = String(systemInfo?.virtualization?.virt_type || "").trim().toLowerCase() !== "container";
  state.toolsMenu.lastError = errors[0] || "";
  state.toolsMenu.loading = false;

  renderToolsMenu();
}

async function runToolsHostAction(action) {
  if (!state.client || state.connectionStatus !== "connected") {
    appendConsole("Connect to Moonraker before running host actions.", "warn");
    return;
  }

  if (!state.toolsMenu.supportsHostControl) {
    appendConsole("Host actions are unavailable in this environment.", "warn");
    return;
  }

  if (isPrintActiveForSystemActions()) {
    appendConsole("Host actions are disabled while printing or paused.", "warn");
    return;
  }

  const confirmMessage = action === "reboot"
    ? "Reboot host now?"
    : "Shutdown host now?";

  if (!window.confirm(confirmMessage)) return;

  state.toolsMenu.actionInFlight = true;
  renderToolsMenu();

  try {
    if (action === "reboot") {
      await state.client.rebootHost();
      appendConsole("Host reboot requested.", "warn");
    } else {
      await state.client.shutdownHost();
      appendConsole("Host shutdown requested.", "warn");
    }

    setToolsMenuOpen(false, { refresh: false });
  } catch (error) {
    const message = error?.message || String(error);
    state.toolsMenu.lastError = message;
    appendConsole(`Host ${action} failed: ${message}`, "error");
    renderToolsMenu();
  } finally {
    state.toolsMenu.actionInFlight = false;
  }
}

async function runToolsServiceAction(serviceName, action) {
  const normalizedService = String(serviceName || "").trim();
  const normalizedAction = String(action || "").trim().toLowerCase();
  if (!normalizedService || !["start", "restart", "stop"].includes(normalizedAction)) return;

  if (!state.client || state.connectionStatus !== "connected") {
    appendConsole("Connect to Moonraker before running service actions.", "warn");
    return;
  }

  if (isPrintActiveForSystemActions() && ["restart", "stop"].includes(normalizedAction)) {
    appendConsole("Service restart/stop is disabled while printing or paused.", "warn");
    return;
  }

  const needsConfirm = ["restart", "stop"].includes(normalizedAction);
  if (needsConfirm) {
    const confirmed = window.confirm(`${normalizedAction.toUpperCase()} service "${normalizedService}"?`);
    if (!confirmed) return;
  }

  state.toolsMenu.actionInFlight = true;
  renderToolsMenu();

  try {
    await state.client.runMachineServiceAction(normalizedService, normalizedAction);
    appendConsole(`Service ${normalizedAction} requested: ${normalizedService}`, "info");
    setToolsMenuOpen(false, { refresh: false });
  } catch (error) {
    const message = error?.message || String(error);
    state.toolsMenu.lastError = message;
    appendConsole(`Service ${normalizedAction} failed (${normalizedService}): ${message}`, "error");
    renderToolsMenu();
  } finally {
    state.toolsMenu.actionInFlight = false;
    if (state.toolsMenu.open) {
      await refreshToolsMenuData({ silent: true });
    }
  }
}

function getTimelapseServiceEntry(systemInfo, serviceName) {
  const lookupCandidates = getTimelapseServiceLookupCandidates(serviceName);
  if (!lookupCandidates.length) return null;

  const services = normalizeToolsMenuServices(systemInfo);
  const exactMatch = services.find((entry) => lookupCandidates.includes(entry.name.toLowerCase()));
  if (exactMatch) return exactMatch;

  const lookupKeys = new Set(lookupCandidates.map((entry) => normalizeTimelapseServiceLookupKey(entry)));
  return services.find((entry) => lookupKeys.has(normalizeTimelapseServiceLookupKey(entry.name))) || null;
}

function formatTimelapseServiceState(activeState, subState) {
  const normalizedState = String(activeState || "unknown").trim().toLowerCase() || "unknown";
  const normalizedSub = String(subState || "").trim().toLowerCase();
  return normalizedSub ? `${normalizedState} (${normalizedSub})` : normalizedState;
}

function renderTimelapseControlView() {
  const connected = !!state.client && state.connectionStatus === "connected";
  const controlMode = normalizeTimelapseControlMode(state.timelapse.controlMode);
  const usingServiceMode = controlMode === TIMELAPSE_CONTROL_MODE_SERVICE;
  state.timelapse.controlMode = controlMode;

  const serviceName = normalizeTimelapseServiceName(state.timelapse.serviceName) || TIMELAPSE_SERVICE_NAME_DEFAULT;
  state.timelapse.serviceName = serviceName;

  if (els.timelapseControlMode && document.activeElement !== els.timelapseControlMode) {
    els.timelapseControlMode.value = controlMode;
  }

  if (els.timelapseServiceName && document.activeElement !== els.timelapseServiceName) {
    els.timelapseServiceName.value = serviceName;
  }

  if (els.timelapseServiceNameLabel) {
    els.timelapseServiceNameLabel.hidden = !usingServiceMode;
  }
  if (els.timelapseServiceName) {
    els.timelapseServiceName.hidden = !usingServiceMode;
  }
  if (els.timelapseServiceRefresh) {
    els.timelapseServiceRefresh.hidden = !usingServiceMode;
  }
  if (els.timelapseServiceActions) {
    els.timelapseServiceActions.hidden = !usingServiceMode;
  }
  if (els.timelapseExternalNote) {
    els.timelapseExternalNote.hidden = usingServiceMode;
  }

  const activeState = usingServiceMode
    ? (String(state.timelapse.serviceState || "unknown").trim().toLowerCase() || "unknown")
    : "external";
  const subState = usingServiceMode ? String(state.timelapse.serviceSubState || "").trim().toLowerCase() : "";
  const busy = usingServiceMode && !!(state.timelapse.loading || state.timelapse.actionInFlight);
  const printBusy = isPrintActiveForSystemActions();

  if (els.timelapseServiceStatus) {
    els.timelapseServiceStatus.textContent = formatTimelapseServiceState(activeState, subState);
    els.timelapseServiceStatus.dataset.state = activeState;
  }

  if (els.timelapseServiceDetail) {
    if (!usingServiceMode) {
      els.timelapseServiceDetail.textContent = "External recorder mode is active. Forge will not query Moonraker service state.";
    } else if (!connected) {
      els.timelapseServiceDetail.textContent = "Connect to Moonraker to query service state.";
    } else if (state.timelapse.loading) {
      els.timelapseServiceDetail.textContent = `Refreshing service "${serviceName}"...`;
    } else if (activeState === "missing") {
      els.timelapseServiceDetail.textContent = `Service "${serviceName}" was not found on this host.`;
    } else if (state.timelapse.lastUpdatedMs) {
      const stamp = new Date(state.timelapse.lastUpdatedMs).toLocaleTimeString();
      els.timelapseServiceDetail.textContent = `Last update: ${stamp}`;
    } else {
      els.timelapseServiceDetail.textContent = "Press Refresh to query the current service state.";
    }
  }

  if (els.timelapseServiceMessage) {
    const hideExternalInfoMessage = !usingServiceMode && !state.timelapse.lastError;
    els.timelapseServiceMessage.hidden = hideExternalInfoMessage;
    els.timelapseServiceMessage.textContent = hideExternalInfoMessage
      ? ""
      : (state.timelapse.lastError
        ? `Last error: ${state.timelapse.lastError}`
        : (state.timelapse.statusMessage || (usingServiceMode
          ? "Recorder output folders are configured in your timelapse recorder JSON config."
          : "Run the timelapse recorder script on your host to capture prints and generate timelapses.")));
  }

  if (els.timelapseServiceRefresh) {
    els.timelapseServiceRefresh.disabled = !usingServiceMode || busy;
  }

  if (!usingServiceMode) {
    if (els.timelapseServiceStart) {
      els.timelapseServiceStart.disabled = true;
    }
    if (els.timelapseServiceRestart) {
      els.timelapseServiceRestart.disabled = true;
    }
    if (els.timelapseServiceStop) {
      els.timelapseServiceStop.disabled = true;
    }
    return;
  }

  const missing = activeState === "missing";
  const inactive = activeState === "inactive";

  if (els.timelapseServiceStart) {
    els.timelapseServiceStart.disabled = !connected || busy || missing || !inactive;
  }

  if (els.timelapseServiceRestart) {
    els.timelapseServiceRestart.disabled = !connected || busy || missing || printBusy;
  }

  if (els.timelapseServiceStop) {
    els.timelapseServiceStop.disabled = !connected || busy || missing || inactive || printBusy;
  }
}

async function refreshTimelapseControlState({ silent = false } = {}) {
  const controlMode = normalizeTimelapseControlMode(state.timelapse.controlMode);
  const usingServiceMode = controlMode === TIMELAPSE_CONTROL_MODE_SERVICE;
  state.timelapse.controlMode = controlMode;

  if (!usingServiceMode) {
    state.timelapse.loading = false;
    state.timelapse.resolvedServiceName = "";
    state.timelapse.serviceState = "external";
    state.timelapse.serviceSubState = "";
    state.timelapse.lastUpdatedMs = Date.now();
    state.timelapse.lastError = "";
    state.timelapse.statusMessage = "External recorder mode enabled. Moonraker service checks are disabled.";
    renderTimelapseControlView();
    return;
  }

  const connected = !!state.client && state.connectionStatus === "connected";

  if (!connected) {
    state.timelapse.loading = false;
    state.timelapse.resolvedServiceName = "";
    state.timelapse.serviceState = "unknown";
    state.timelapse.serviceSubState = "";
    state.timelapse.lastUpdatedMs = null;
    if (!silent) {
      state.timelapse.lastError = "";
      state.timelapse.statusMessage = "Connect to Moonraker to query service state.";
    }
    renderTimelapseControlView();
    return;
  }

  state.timelapse.loading = true;
  if (!silent) {
    state.timelapse.lastError = "";
  }
  renderTimelapseControlView();

  try {
    const response = await state.client.getMachineSystemInfo();
    const systemInfo = response?.result?.system_info || response?.result || null;
    state.machineLoads.systemInfo = systemInfo;
    state.toolsMenu.services = normalizeToolsMenuServices(systemInfo);

    const serviceEntry = getTimelapseServiceEntry(systemInfo, state.timelapse.serviceName);
    if (serviceEntry) {
      const configuredName = normalizeTimelapseServiceName(state.timelapse.serviceName).toLowerCase();
      const resolvedName = normalizeTimelapseServiceName(serviceEntry.name);
      state.timelapse.serviceState = serviceEntry.activeState;
      state.timelapse.serviceSubState = serviceEntry.subState;
      state.timelapse.resolvedServiceName = resolvedName;
      state.timelapse.statusMessage = configuredName === resolvedName.toLowerCase()
        ? `Service ready: ${resolvedName}`
        : `Service ready: ${resolvedName} (matched from ${state.timelapse.serviceName})`;
    } else {
      const attempted = getTimelapseServiceLookupCandidates(state.timelapse.serviceName).join(", ");
      state.timelapse.resolvedServiceName = "";
      state.timelapse.serviceState = "missing";
      state.timelapse.serviceSubState = "";
      state.timelapse.statusMessage = attempted
        ? `Service not found. Tried: ${attempted}`
        : `Service not found: ${state.timelapse.serviceName}`;
    }

    state.timelapse.lastError = "";
    state.timelapse.lastUpdatedMs = Date.now();
  } catch (error) {
    const message = error?.message || String(error);
    state.timelapse.resolvedServiceName = "";
    state.timelapse.serviceState = "unknown";
    state.timelapse.serviceSubState = "";
    state.timelapse.lastError = message;
    state.timelapse.statusMessage = `Failed to refresh service state: ${message}`;
    if (!silent) {
      appendConsole(`Timelapse service refresh failed: ${message}`, "error");
    }
  } finally {
    state.timelapse.loading = false;
    renderTimelapseControlView();
  }
}

async function runTimelapseServiceAction(action) {
  const normalizedAction = String(action || "").trim().toLowerCase();
  if (!["start", "restart", "stop"].includes(normalizedAction)) return;

  const controlMode = normalizeTimelapseControlMode(state.timelapse.controlMode);
  if (controlMode !== TIMELAPSE_CONTROL_MODE_SERVICE) {
    state.timelapse.statusMessage = "Service actions are disabled in External Recorder mode.";
    appendConsole("Timelapse service actions are disabled in External Recorder mode.", "warn");
    renderTimelapseControlView();
    return;
  }

  const serviceName = normalizeTimelapseServiceName(state.timelapse.resolvedServiceName) || normalizeTimelapseServiceName(state.timelapse.serviceName);
  if (!serviceName) {
    state.timelapse.lastError = "Service name is required.";
    state.timelapse.statusMessage = "Enter a service name before running actions.";
    renderTimelapseControlView();
    return;
  }

  const connected = !!state.client && state.connectionStatus === "connected";
  if (!connected) {
    appendConsole("Connect to Moonraker before running timelapse service actions.", "warn");
    return;
  }

  if (isPrintActiveForSystemActions() && ["restart", "stop"].includes(normalizedAction)) {
    appendConsole("Timelapse service restart/stop is disabled while printing or paused.", "warn");
    return;
  }

  const needsConfirm = ["restart", "stop"].includes(normalizedAction);
  if (needsConfirm) {
    const confirmed = window.confirm(`${normalizedAction.toUpperCase()} service "${serviceName}"?`);
    if (!confirmed) return;
  }

  state.timelapse.actionInFlight = true;
  state.timelapse.lastError = "";
  state.timelapse.statusMessage = `Sending ${normalizedAction} to ${serviceName}...`;
  renderTimelapseControlView();

  try {
    await state.client.runMachineServiceAction(serviceName, normalizedAction);
    appendConsole(`Timelapse service ${normalizedAction} requested: ${serviceName}`, "info");
    state.timelapse.statusMessage = `Requested ${normalizedAction} for ${serviceName}.`;
  } catch (error) {
    const message = error?.message || String(error);
    state.timelapse.lastError = message;
    state.timelapse.statusMessage = `Action failed: ${message}`;
    appendConsole(`Timelapse service ${normalizedAction} failed: ${message}`, "error");
  } finally {
    state.timelapse.actionInFlight = false;
    await refreshTimelapseControlState({ silent: true });
  }
}

function setSpoolmanStatusText(element, message, level = "info") {
  if (!element) return;
  element.textContent = String(message || "").trim();
  element.dataset.level = String(level || "info").trim().toLowerCase() || "info";
}

function parseSpoolmanHealthState(payload) {
  const candidates = [
    payload?.status,
    payload?.state,
    payload?.result?.status,
    payload?.result?.state,
  ];

  const status = candidates
    .map((entry) => String(entry || "").trim().toLowerCase())
    .find(Boolean);

  if (!status) return "unknown";
  if (["ok", "healthy", "ready", "up"].includes(status)) return "healthy";
  if (["degraded", "warning"].includes(status)) return "warning";
  if (["error", "failed", "down", "unhealthy"].includes(status)) return "error";
  return status;
}

function getSpoolmanRequestHeaders(token) {
  const normalizedToken = normalizeSpoolmanApiToken(token);
  if (!normalizedToken) return null;
  return {
    Authorization: `Bearer ${normalizedToken}`,
  };
}

function formatSpoolmanWeight(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return "-";
  if (numeric >= 1000) return `${(numeric / 1000).toFixed(2)} kg`;
  return `${numeric.toFixed(1)} g`;
}

function formatSpoolmanLength(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return "-";
  if (numeric >= 1000) return `${(numeric / 1000).toFixed(2)} m`;
  return `${numeric.toFixed(0)} mm`;
}

function formatSpoolmanTemperature(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  return `${numeric.toFixed(0)} C`;
}

function formatSpoolmanTimestamp(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatSpoolmanRelativeDate(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return { text: "-", exact: "" };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((today.getTime() - target.getTime()) / dayMs);

  if (diffDays <= 0) return { text: "Today", exact: formatSpoolmanTimestamp(value) };
  if (diffDays === 1) return { text: "Yesterday", exact: formatSpoolmanTimestamp(value) };
  return { text: `${diffDays} days ago`, exact: formatSpoolmanTimestamp(value) };
}

function filamentWeightToLength(weight, filament) {
  const weightValue = Number(weight);
  const densityValue = Number(filament?.density);
  const diameterValue = Number(filament?.diameter);
  if (!Number.isFinite(weightValue) || weightValue < 0) return null;
  if (!Number.isFinite(densityValue) || densityValue <= 0) return null;
  if (!Number.isFinite(diameterValue) || diameterValue <= 0) return null;
  return (weightValue / densityValue / (Math.PI / 4 * diameterValue ** 2)) * 1000;
}

function normalizeSpoolmanColor(rawColor) {
  const value = String(rawColor || "").trim();
  if (!value) return "";
  return value.startsWith("#") ? value : `#${value}`;
}

function normalizeSpoolmanSpool(spool) {
  if (!spool || typeof spool !== "object") return null;

  const filament = spool.filament && typeof spool.filament === "object"
    ? spool.filament
    : {};
  const vendorName = String(filament?.vendor?.name || "").trim();
  const filamentName = String(filament?.name || "").trim();
  const initialWeight = spool.initial_weight ?? filament.weight ?? null;
  const remainingLength = spool.remaining_length ?? filamentWeightToLength(spool.remaining_weight, filament);
  const usedLength = spool.used_length ?? filamentWeightToLength(spool.used_weight, filament);
  const initialLength = initialWeight != null ? filamentWeightToLength(initialWeight, filament) : null;
  const progressRaw = Number.isFinite(Number(initialWeight)) && Number(initialWeight) > 0 && Number.isFinite(Number(spool.used_weight))
    ? ((Number(initialWeight) - Number(spool.used_weight)) / Number(initialWeight)) * 100
    : null;
  const progress = Number.isFinite(progressRaw)
    ? Math.max(0, Math.min(100, progressRaw))
    : null;

  return {
    ...spool,
    filament: {
      ...filament,
      color_hex: normalizeSpoolmanColor(filament?.color_hex),
    },
    filament_name: [vendorName, filamentName].filter(Boolean).join(" - ") || String(spool.id || "-"),
    initial_weight: initialWeight,
    remaining_length: remainingLength,
    used_length: usedLength,
    initial_length: initialLength,
    progress,
  };
}

function getSpoolmanFieldLabel(field) {
  const labels = {
    id: "ID",
    vendor: "Vendor",
    filament_name: "Filament",
    remaining_weight: "Remaining",
    used_weight: "Used",
    location: "Location",
    material: "Material",
    lot_nr: "Lot Nr",
    price: "Price",
    density: "Density",
    diameter: "Diameter",
    extruder_temp: "Extruder Temp",
    bed_temp: "Bed Temp",
    first_used: "First Used",
    last_used: "Last Used",
    comment: "Comment",
  };
  return labels[field] || field;
}

function getSpoolmanSupportedCameraOptions() {
  const options = [
    { value: "", label: "None" },
  ];

  if (state.camera?.enabled) {
    options.push({ value: "main-camera", label: "Main Camera" });
  }
  if (state.toolheadCamera?.enabled) {
    options.push({ value: "toolhead-camera", label: "Toolhead Camera" });
  }

  return options;
}

function buildSpoolmanDisplayValue(spool, field) {
  if (!spool) return { text: "-", subtext: "", title: "" };

  switch (field) {
    case "vendor":
      return { text: String(spool?.filament?.vendor?.name || "-"), subtext: "", title: "" };
    case "filament_name":
      return { text: String(spool.filament_name || "-"), subtext: "", title: "" };
    case "material":
      return { text: String(spool?.filament?.material || "-"), subtext: "", title: "" };
    case "first_used": {
      const relative = formatSpoolmanRelativeDate(spool.first_used);
      return { text: relative.text, subtext: "", title: relative.exact };
    }
    case "last_used": {
      const relative = formatSpoolmanRelativeDate(spool.last_used);
      return { text: relative.text, subtext: "", title: relative.exact };
    }
    case "price": {
      const numeric = Number(spool.price);
      if (!Number.isFinite(numeric)) return { text: "-", subtext: "", title: "" };
      const currency = String(state.spoolman.currency || "USD");
      try {
        return {
          text: new Intl.NumberFormat(undefined, { style: "currency", currency }).format(numeric),
          subtext: "",
          title: "",
        };
      } catch {
        return { text: `${numeric.toFixed(2)} ${currency}`, subtext: "", title: "" };
      }
    }
    case "density": {
      const numeric = Number(spool?.filament?.density);
      return { text: Number.isFinite(numeric) ? `${numeric}` : "-", subtext: "", title: "" };
    }
    case "diameter":
      return { text: formatSpoolmanLength(spool?.filament?.diameter), subtext: "", title: "" };
    case "extruder_temp":
      return { text: formatSpoolmanTemperature(spool?.filament?.settings_extruder_temp), subtext: "", title: "" };
    case "bed_temp":
      return { text: formatSpoolmanTemperature(spool?.filament?.settings_bed_temp), subtext: "", title: "" };
    case "remaining_weight": {
      const useLength = state.spoolman.settings?.remainingFilamentUnit === "length";
      if (useLength) {
        return {
          text: formatSpoolmanLength(spool.remaining_length),
          subtext: formatSpoolmanLength(spool.initial_length),
          title: "",
        };
      }
      return {
        text: formatSpoolmanWeight(spool.remaining_weight),
        subtext: formatSpoolmanWeight(spool.initial_weight),
        title: "",
      };
    }
    case "used_weight": {
      const useLength = state.spoolman.settings?.remainingFilamentUnit === "length";
      if (useLength) {
        return {
          text: formatSpoolmanLength(spool.used_length),
          subtext: formatSpoolmanLength(spool.initial_length),
          title: "",
        };
      }
      return {
        text: formatSpoolmanWeight(spool.used_weight),
        subtext: formatSpoolmanWeight(spool.initial_weight),
        title: "",
      };
    }
    default: {
      const rawValue = spool[field];
      const value = rawValue == null || rawValue === "" ? "-" : String(rawValue);
      return { text: value, subtext: "", title: "" };
    }
  }
}

function splitSpoolmanCardFields(fields) {
  const sanitized = normalizeSpoolmanCardFields(fields);
  const columnCount = sanitized.length > 1 ? 2 : 1;
  const elementsPerColumn = Math.ceil(sanitized.length / columnCount);
  return new Array(columnCount)
    .fill(null)
    .map((_, index) => sanitized.slice(index * elementsPerColumn, (index + 1) * elementsPerColumn));
}

function renderSpoolmanSelectOptions() {
  if (!els.spoolmanSelectId) return;

  const select = els.spoolmanSelectId;
  const activeSpoolId = Number(state.spoolman.activeSpoolId);
  const spools = Array.isArray(state.spoolman.spools)
    ? [...state.spoolman.spools]
    : [];
  const sorted = spools
    .map(normalizeSpoolmanSpool)
    .filter(Boolean)
    .sort((a, b) => String(a.filament_name || "").localeCompare(String(b.filament_name || ""), undefined, { numeric: true }));

  select.innerHTML = "";

  const noneOption = document.createElement("option");
  noneOption.value = "";
  noneOption.textContent = "None";
  select.appendChild(noneOption);

  sorted.forEach((spool) => {
    const option = document.createElement("option");
    option.value = String(spool.id);
    option.textContent = `${spool.id}: ${spool.filament_name || "Unnamed spool"}`;
    option.selected = Number.isFinite(activeSpoolId) && activeSpoolId > 0 && spool.id === activeSpoolId;
    select.appendChild(option);
  });

  if (els.spoolmanSelectHelp) {
    els.spoolmanSelectHelp.textContent = sorted.length
      ? "Select a spool to set it active in Moonraker."
      : "No spools were returned by Spoolman yet.";
  }
}

function renderSpoolmanSettingsCard() {
  const settings = state.spoolman.settings || { ...SPOOLMAN_SETTINGS_DEFAULTS };

  const cameraSelect = els.settingsSpoolmanAutoCamera;
  if (cameraSelect) {
    const options = getSpoolmanSupportedCameraOptions();
    const selected = String(settings.autoOpenQRDetectionCamera || "");
    const hasSelectedOption = options.some((entry) => entry.value === selected);
    if (selected && !hasSelectedOption) {
      options.push({ value: selected, label: selected });
    }
    cameraSelect.innerHTML = "";
    options.forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.value;
      option.textContent = entry.label;
      cameraSelect.appendChild(option);
    });
    if (document.activeElement !== cameraSelect) {
      cameraSelect.value = selected;
    }
  }

  if (els.settingsSpoolmanAutoDialog) {
    els.settingsSpoolmanAutoDialog.checked = !!settings.autoSpoolSelectionDialog;
  }
  if (els.settingsSpoolmanPreferDeviceCamera) {
    els.settingsSpoolmanPreferDeviceCamera.checked = !!settings.preferDeviceCamera;
  }
  if (els.settingsSpoolmanAutoSelectOnMatch) {
    els.settingsSpoolmanAutoSelectOnMatch.checked = !!settings.autoSelectSpoolOnMatch;
  }
  if (els.settingsSpoolmanWarnNotEnoughFilament) {
    els.settingsSpoolmanWarnNotEnoughFilament.checked = !!settings.warnOnNotEnoughFilament;
  }
  if (els.settingsSpoolmanWarnFilamentMismatch) {
    els.settingsSpoolmanWarnFilamentMismatch.checked = !!settings.warnOnFilamentTypeMismatch;
  }
  if (els.settingsSpoolmanRemainingUnit && document.activeElement !== els.settingsSpoolmanRemainingUnit) {
    els.settingsSpoolmanRemainingUnit.value = normalizeSpoolmanRemainingFilamentUnit(settings.remainingFilamentUnit);
  }
  if (els.settingsSpoolmanCardFields) {
    syncSpoolmanCardFieldInputs(settings.selectedCardFields);
    syncSpoolmanCardFieldApplyButton(settings.selectedCardFields);
  }

  const level = state.spoolman.lastError
    ? "error"
    : state.spoolman.connectionState === "connected"
      ? "info"
      : "warn";
  setSpoolmanStatusText(
    els.settingsSpoolmanStatus,
    state.spoolman.statusMessage || "Use Apply Selected Fields for card fields. Other Spoolman settings are saved with Save & Connect.",
    level
  );
}

function renderSpoolmanView() {
  const enabled = !!state.spoolman.enabled;
  const isBusy = !!(state.spoolman.loading || state.spoolman.testing || state.spoolman.actionInFlight);
  const isConnected = enabled && state.spoolman.connectionState === "connected";
  const activeSpool = normalizeSpoolmanSpool(state.spoolman.activeSpool);
  const fieldsContainer = els.spoolmanFieldsGrid;

  if (fieldsContainer) {
    fieldsContainer.innerHTML = "";

    if (state.spoolman.loading || state.spoolman.testing || state.spoolman.actionInFlight) {
      const row = document.createElement("p");
      row.className = "muted";
      row.textContent = "Refreshing Spoolman data...";
      fieldsContainer.appendChild(row);
    } else if (activeSpool) {
      const columns = splitSpoolmanCardFields(state.spoolman.settings?.selectedCardFields);
      columns.forEach((columnFields) => {
        const col = document.createElement("div");
        col.className = "spoolman-fields-column";

        columnFields.forEach((field) => {
          const row = document.createElement("p");
          row.className = "spoolman-field-row";

          const label = document.createElement("span");
          label.className = "spoolman-field-label";
          label.textContent = getSpoolmanFieldLabel(field);

          const valueWrap = document.createElement("strong");
          valueWrap.className = "spoolman-field-value";

          const valueInfo = buildSpoolmanDisplayValue(activeSpool, field);
          valueWrap.textContent = valueInfo.text;
          if (valueInfo.title) {
            valueWrap.title = valueInfo.title;
          }

          if (valueInfo.subtext) {
            const sub = document.createElement("small");
            sub.className = "spoolman-field-subvalue";
            sub.textContent = ` / ${valueInfo.subtext}`;
            valueWrap.appendChild(sub);
          }

          row.append(label, valueWrap);
          col.appendChild(row);
        });

        fieldsContainer.appendChild(col);
      });
    } else {
      const row = document.createElement("p");
      row.className = "muted";
      row.textContent = isConnected
        ? "Filament tracking is inactive. To get started, please select a spool."
        : "Spoolman server not available.";
      fieldsContainer.appendChild(row);
    }
  }

  const progress = Number(activeSpool?.progress);
  const hasProgress = Number.isFinite(progress);
  const progressValue = hasProgress ? Math.max(0, Math.min(100, progress)) : 0;
  const activeColor = String(activeSpool?.filament?.color_hex || "var(--accent)");

  if (els.spoolmanProgressLinear && els.spoolmanProgressLinearBar) {
    els.spoolmanProgressLinear.hidden = !activeSpool;
    els.spoolmanProgressLinearBar.style.width = `${progressValue.toFixed(1)}%`;
    els.spoolmanProgressLinearBar.style.background = activeColor || "var(--accent)";
  }

  if (els.spoolmanProgressRing && els.spoolmanProgressRingValue) {
    if (activeSpool && hasProgress) {
      els.spoolmanProgressRing.hidden = false;
      els.spoolmanProgressRing.style.setProperty("--spoolman-progress", `${progressValue.toFixed(1)}%`);
      els.spoolmanProgressRing.style.setProperty("--spoolman-color", activeColor || "var(--accent)");
      els.spoolmanProgressRingValue.textContent = `${Math.round(progressValue)}%`;
    } else {
      els.spoolmanProgressRing.hidden = true;
      els.spoolmanProgressRingValue.textContent = "--%";
    }
  }

  if (els.spoolmanVisualFallback) {
    els.spoolmanVisualFallback.hidden = !!activeSpool;
    els.spoolmanVisualFallback.textContent = isConnected
      ? "Filament tracking is inactive."
      : "Spoolman server not available.";
  }

  const messageLevel = state.spoolman.lastError
    ? "error"
    : isConnected
      ? "info"
      : "warn";
  setSpoolmanStatusText(
    els.spoolmanStatusMessage,
    state.spoolman.statusMessage || "Press Refresh to load Spoolman data.",
    messageLevel
  );

  if (els.spoolmanRefresh) {
    els.spoolmanRefresh.disabled = !enabled || isBusy;
  }
  if (els.spoolmanChangeSpool) {
    els.spoolmanChangeSpool.disabled = !enabled || isBusy || !isConnected;
  }

  if (els.spoolmanSelectApply) {
    els.spoolmanSelectApply.disabled = !enabled || isBusy || !isConnected;
  }
  if (els.spoolmanSelectClear) {
    els.spoolmanSelectClear.disabled = !enabled || isBusy || !isConnected;
  }

  renderSpoolmanSelectOptions();
}

function getSpoolmanSettingsDraftFromInputs() {
  const selectedCardFields = els.settingsSpoolmanCardFields
    ? getSelectedSpoolmanCardFieldsFromInputs()
    : state.spoolman.settings?.selectedCardFields;

  return {
    enabled: true,
    serverUrl: "",
    apiToken: "",
    connectionMode: SPOOLMAN_CONNECTION_PROXY,
    settings: {
      autoSpoolSelectionDialog: !!els.settingsSpoolmanAutoDialog?.checked,
      autoOpenQRDetectionCamera: String(els.settingsSpoolmanAutoCamera?.value || ""),
      preferDeviceCamera: !!els.settingsSpoolmanPreferDeviceCamera?.checked,
      autoSelectSpoolOnMatch: !!els.settingsSpoolmanAutoSelectOnMatch?.checked,
      warnOnNotEnoughFilament: !!els.settingsSpoolmanWarnNotEnoughFilament?.checked,
      warnOnFilamentTypeMismatch: !!els.settingsSpoolmanWarnFilamentMismatch?.checked,
      remainingFilamentUnit: normalizeSpoolmanRemainingFilamentUnit(els.settingsSpoolmanRemainingUnit?.value || ""),
      selectedCardFields: normalizeSpoolmanCardFields(selectedCardFields),
    },
  };
}

async function fetchSpoolmanDirect(path, { serverUrl, apiToken, method = "GET" } = {}) {
  const normalizedServerUrl = normalizeSpoolmanServerUrl(serverUrl);
  if (!normalizedServerUrl) {
    throw new Error("A Spoolman server URL is required for direct mode.");
  }

  const normalizedPath = String(path || "").trim();
  if (!normalizedPath.startsWith("/")) {
    throw new Error("Spoolman direct path must start with '/'.");
  }

  const response = await fetch(`${normalizedServerUrl}${normalizedPath}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(getSpoolmanRequestHeaders(apiToken) || {}),
    },
  });

  const text = await response.text().catch(() => "");
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const details = typeof parsed === "string"
      ? parsed
      : (parsed?.message || parsed?.error || "");
    const suffix = details ? `: ${String(details).slice(0, 180)}` : "";
    throw new Error(`Spoolman direct call failed (${response.status})${suffix}`);
  }

  return parsed;
}

async function fetchSpoolmanViaCurrentMode(path, { method = "GET", serverUrl = state.spoolman.serverUrl, apiToken = state.spoolman.apiToken } = {}) {
  const mode = getSpoolmanConnectionMode(serverUrl);

  if (mode === SPOOLMAN_CONNECTION_DIRECT) {
    return fetchSpoolmanDirect(path, {
      serverUrl,
      apiToken,
      method,
    });
  }

  if (!state.client || state.connectionStatus !== "connected") {
    throw new Error("Moonraker must be connected to use Spoolman proxy mode.");
  }

  return state.client.spoolmanProxy(path, {
    requestMethod: method,
  });
}

async function probeSpoolmanConnectivity({ enabled, serverUrl, apiToken, includeSpoolData = true } = {}) {
  const spoolmanEnabled = !!enabled;
  const normalizedServerUrl = normalizeSpoolmanServerUrl(serverUrl);
  const normalizedApiToken = normalizeSpoolmanApiToken(apiToken);

  if (!spoolmanEnabled) {
    return {
      mode: getSpoolmanConnectionMode(normalizedServerUrl),
      healthState: "disabled",
      info: null,
      currency: null,
      spools: [],
      activeSpoolId: null,
      activeSpool: null,
    };
  }

  const mode = getSpoolmanConnectionMode(normalizedServerUrl);

  if (mode === SPOOLMAN_CONNECTION_PROXY && (!state.client || state.connectionStatus !== "connected")) {
    throw new Error("Moonraker must be connected when Spoolman server URL is not set.");
  }

  const healthPayload = await fetchSpoolmanViaCurrentMode("/v1/health", {
    method: "GET",
    serverUrl: normalizedServerUrl,
    apiToken: normalizedApiToken,
  });
  const infoPayload = await fetchSpoolmanViaCurrentMode("/v1/info", {
    method: "GET",
    serverUrl: normalizedServerUrl,
    apiToken: normalizedApiToken,
  });
  let currencyPayload = null;
  try {
    currencyPayload = await fetchSpoolmanViaCurrentMode("/v1/setting/currency", {
      method: "GET",
      serverUrl: normalizedServerUrl,
      apiToken: normalizedApiToken,
    });
  } catch (error) {
    log.debug("Spoolman currency setting unavailable.", {
      error: error?.message || String(error),
    });
  }

  let activeSpoolId = null;
  let activeSpool = null;
  let spools = [];

  if (includeSpoolData) {
    try {
      const spoolPayload = await fetchSpoolmanViaCurrentMode("/v1/spool", {
        method: "GET",
        serverUrl: normalizedServerUrl,
        apiToken: normalizedApiToken,
      });
      spools = Array.isArray(spoolPayload) ? spoolPayload : [];
    } catch (error) {
      log.debug("Spoolman spool list unavailable.", {
        error: error?.message || String(error),
      });
    }
  }

  if (includeSpoolData && state.client && state.connectionStatus === "connected") {
    const activeSpoolResponse = await state.client.getSpoolmanActiveSpoolId();
    const candidateId = Number(activeSpoolResponse?.spool_id ?? activeSpoolResponse?.result?.spool_id ?? activeSpoolResponse);
    activeSpoolId = Number.isFinite(candidateId) && candidateId > 0 ? Math.round(candidateId) : null;

    if (activeSpoolId != null) {
      activeSpool = Array.isArray(spools)
        ? spools.find((spool) => Number(spool?.id) === activeSpoolId) || null
        : null;

      if (!activeSpool) {
        try {
          activeSpool = await fetchSpoolmanViaCurrentMode(`/v1/spool/${activeSpoolId}`, {
            method: "GET",
            serverUrl: normalizedServerUrl,
            apiToken: normalizedApiToken,
          });
        } catch (error) {
          log.debug("Active Spoolman spool details unavailable.", {
            error: error?.message || String(error),
          });
        }
      }
    }
  }

  return {
    mode,
    healthState: parseSpoolmanHealthState(healthPayload),
    info: infoPayload,
    currency: currencyPayload?.currency || currencyPayload?.result?.currency || null,
    spools,
    activeSpoolId,
    activeSpool,
  };
}

async function refreshSpoolmanState({ source = "user", silent = false } = {}) {
  const enabled = !!state.spoolman.enabled;
  state.spoolman.connectionMode = getSpoolmanConnectionMode(state.spoolman.serverUrl);

  if (!enabled) {
    state.spoolman.testing = false;
    state.spoolman.loading = false;
    state.spoolman.connectionState = "disabled";
    state.spoolman.lastError = "";
    state.spoolman.statusMessage = "Spoolman integration is disabled in Settings.";
    state.spoolman.currency = null;
    state.spoolman.spools = [];
    state.spoolman.activeSpoolId = null;
    state.spoolman.activeSpool = null;
    state.spoolman.healthState = "disabled";
    renderSpoolmanView();
    renderSpoolmanSettingsCard();
    return;
  }

  const isTest = source === "test";
  state.spoolman.testing = isTest;
  state.spoolman.loading = !isTest;
  state.spoolman.lastError = "";
  state.spoolman.connectionState = "checking";
  state.spoolman.statusMessage = isTest
    ? "Testing Spoolman connection..."
    : "Refreshing Spoolman data...";
  renderSpoolmanView();
  renderSpoolmanSettingsCard();

  try {
    const result = await probeSpoolmanConnectivity({
      enabled: true,
      serverUrl: state.spoolman.serverUrl,
      apiToken: state.spoolman.apiToken,
      includeSpoolData: true,
    });

    state.spoolman.connectionMode = result.mode;
    state.spoolman.connectionState = "connected";
    state.spoolman.healthState = result.healthState;
    state.spoolman.info = result.info;
    state.spoolman.currency = result.currency;
    state.spoolman.spools = Array.isArray(result.spools) ? result.spools : [];
    state.spoolman.activeSpoolId = result.activeSpoolId;
    state.spoolman.activeSpool = result.activeSpool;
    state.spoolman.lastError = "";
    state.spoolman.lastUpdatedMs = Date.now();

    const modeLabel = result.mode === SPOOLMAN_CONNECTION_DIRECT ? "Direct" : "Moonraker Proxy";
    const versionLabel = String(result.info?.version || "").trim()
      ? `, v${result.info.version}`
      : "";
    state.spoolman.statusMessage = isTest
      ? `Connection successful (${modeLabel}${versionLabel}).`
      : `Spoolman data refreshed (${modeLabel}${versionLabel}).`;

    if (!silent) {
      appendConsole(`Spoolman ${isTest ? "connection test" : "refresh"} successful.`, "info");
    }
  } catch (error) {
    const message = error?.message || String(error);
    state.spoolman.connectionState = "error";
    state.spoolman.lastError = message;
    state.spoolman.statusMessage = `Spoolman ${isTest ? "connection test" : "refresh"} failed: ${message}`;

    if (!silent) {
      appendConsole(`Spoolman ${isTest ? "connection test" : "refresh"} failed: ${message}`, "error");
    }
  } finally {
    state.spoolman.testing = false;
    state.spoolman.loading = false;
    renderSpoolmanView();
    renderSpoolmanSettingsCard();
  }
}

async function testSpoolmanSettingsDraft() {
  const draft = getSpoolmanSettingsDraftFromInputs();

  if (!draft.enabled) {
    setSpoolmanStatusText(
      els.settingsSpoolmanStatus,
      "Enable Spoolman integration to run a connection test.",
      "warn"
    );
    return;
  }

  setSpoolmanStatusText(els.settingsSpoolmanStatus, "Testing Spoolman connection...", "info");

  try {
    const result = await probeSpoolmanConnectivity({
      enabled: draft.enabled,
      serverUrl: draft.serverUrl,
      apiToken: draft.apiToken,
      includeSpoolData: false,
    });
    const modeLabel = result.mode === SPOOLMAN_CONNECTION_DIRECT ? "Direct" : "Moonraker Proxy";
    const versionLabel = String(result.info?.version || "").trim()
      ? `, v${result.info.version}`
      : "";
    setSpoolmanStatusText(
      els.settingsSpoolmanStatus,
      `Connection successful (${modeLabel}${versionLabel}).`,
      "info"
    );
  } catch (error) {
    const message = error?.message || String(error);
    setSpoolmanStatusText(
      els.settingsSpoolmanStatus,
      `Connection test failed: ${message}`,
      "error"
    );
  }
}

async function setSpoolmanActiveSpool(spoolId = null) {
  if (!state.spoolman.enabled) {
    state.spoolman.statusMessage = "Enable Spoolman integration before changing active spool.";
    renderSpoolmanView();
    renderSpoolmanSettingsCard();
    return;
  }

  if (!state.client || state.connectionStatus !== "connected") {
    state.spoolman.statusMessage = "Moonraker must be connected to set active spool.";
    state.spoolman.connectionState = "error";
    renderSpoolmanView();
    renderSpoolmanSettingsCard();
    return;
  }

  state.spoolman.actionInFlight = true;
  state.spoolman.lastError = "";
  state.spoolman.statusMessage = spoolId == null
    ? "Clearing active spool..."
    : `Setting active spool to ${spoolId}...`;
  renderSpoolmanView();
  renderSpoolmanSettingsCard();

  try {
    await state.client.setSpoolmanActiveSpoolId(spoolId);
    await refreshSpoolmanState({ source: "refresh", silent: true });
    state.spoolman.statusMessage = spoolId == null
      ? "Active spool cleared."
      : `Active spool set to ID ${spoolId}.`;
    renderSpoolmanView();
    renderSpoolmanSettingsCard();
    appendConsole(state.spoolman.statusMessage, "info");
  } catch (error) {
    const message = error?.message || String(error);
    state.spoolman.lastError = message;
    state.spoolman.connectionState = "error";
    state.spoolman.statusMessage = `Active spool update failed: ${message}`;
    renderSpoolmanView();
    renderSpoolmanSettingsCard();
    appendConsole(`Spoolman active spool update failed: ${message}`, "error");
  } finally {
    state.spoolman.actionInFlight = false;
    renderSpoolmanView();
    renderSpoolmanSettingsCard();
  }
}

async function runToolsPowerAction(deviceName, action) {
  const normalizedDevice = String(deviceName || "").trim();
  const normalizedAction = String(action || "").trim().toLowerCase();
  if (!normalizedDevice || !["on", "off", "toggle"].includes(normalizedAction)) return;

  if (!state.client || state.connectionStatus !== "connected") {
    appendConsole("Connect to Moonraker before changing power devices.", "warn");
    return;
  }

  state.toolsMenu.actionInFlight = true;
  renderToolsMenu();

  try {
    await state.client.setMachinePowerDevice(normalizedDevice, normalizedAction);
    appendConsole(`Power device ${normalizedDevice} set ${normalizedAction}.`, "info");
  } catch (error) {
    const message = error?.message || String(error);
    state.toolsMenu.lastError = message;
    appendConsole(`Power action failed (${normalizedDevice}): ${message}`, "error");
  } finally {
    state.toolsMenu.actionInFlight = false;
    if (state.toolsMenu.open) {
      await refreshToolsMenuData({ silent: true });
    }
  }
}

async function runToolsMenuAction(action) {
  const normalizedAction = String(action || "").trim().toLowerCase();

  switch (normalizedAction) {
    case "klipper-restart": {
      const sent = await executeGcodeAction("RESTART", {
        actionLabel: "Klipper restart",
        successMessage: "Klipper restart requested.",
      });
      if (sent) {
        setToolsMenuOpen(false, { refresh: false });
      }
      break;
    }
    case "klipper-firmware-restart": {
      const sent = await executeGcodeAction("FIRMWARE_RESTART", {
        actionLabel: "Klipper firmware restart",
        successMessage: "Klipper firmware restart requested.",
      });
      if (sent) {
        setToolsMenuOpen(false, { refresh: false });
      }
      break;
    }
    case "host-reboot": {
      await runToolsHostAction("reboot");
      break;
    }
    case "host-shutdown": {
      await runToolsHostAction("shutdown");
      break;
    }
    case "layout-adjust": {
      openDashboardLayoutDialog();
      setToolsMenuOpen(false, { refresh: false });
      break;
    }
    default:
      break;
  }
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

  if (status !== "connected") {
    state.toolsMenu.loading = false;
    state.toolsMenu.powerDevices = [];
    state.toolsMenu.lastError = "";
  } else if (state.toolsMenu.open) {
    void refreshToolsMenuData({ silent: true });
  }

  renderToolsMenu();
  renderTimelapseControlView();
  renderTimelapseMediaCard();
  renderTimelapseSettingsCard();
  renderSpoolmanView();
  renderSpoolmanSettingsCard();
  renderRunoutSensorsCard();
  if (status === "connected" && state.activeView === "timelapse") {
    if (!state.timelapseMedia.files.length && !state.timelapseMedia.directories.length && !state.timelapseMedia.isLoading) {
      void loadTimelapseMediaFiles({ source: "connect", silent: true });
    }
    void refreshTimelapseControlState({ silent: true });
  }
  if (status === "connected" && state.activeView === "spoolman") {
    void refreshSpoolmanState({ source: "connect", silent: true });
  }
  if (status === "connected" && state.activeView === "settings") {
    void refreshTimelapseSettings({ silent: true });
  }

  if (isPrettyGcodeViewerVisible()) {
    renderPrettyGcodeView();
  }
}

function setPrinterState(value) {
  const normalized = normalizePrinterState(value);
  const meta = PRINTER_STATE_META[normalized] || PRINTER_STATE_META.unknown;
  if (els.printerState) {
    els.printerState.dataset.state = normalized;
    els.printerState.textContent = meta.label;
  }
  if (els.printerDot) {
    els.printerDot.style.background = meta.color;
  }
  if (els.statusStateChip) {
    els.statusStateChip.dataset.state = normalized;
  }
  if (els.statusStateDot) {
    els.statusStateDot.style.background = meta.color;
  }
  if (els.statusPrinterState) {
    els.statusPrinterState.textContent = meta.label;
  }
  renderJobsJobControls();
  renderControlsPanel();
  renderStatusClearFileButton(state.printStatus.lastPrintStats);
  refreshMacroActionButtonState();
}

function encodeGcodeParamValue(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "\"\"";
  return `"${normalized.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
}

function normalizeRunoutSensorObjectKey(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";

  const lowered = normalized.toLowerCase();
  if (!RUNOUT_SENSOR_OBJECT_PREFIXES.some((prefix) => lowered.startsWith(prefix))) {
    return "";
  }

  return normalized;
}

function isRunoutSensorObjectKey(value) {
  return !!normalizeRunoutSensorObjectKey(value);
}

function getRunoutSensorNameFromObjectKey(objectKey) {
  const normalized = normalizeRunoutSensorObjectKey(objectKey);
  if (!normalized) return "";
  return normalized.split(/\s+/).pop() || "";
}

function formatRunoutSensorPrettyName(name) {
  const cleaned = String(name || "")
    .replace(/[_-]+/g, " ")
    .trim();

  if (!cleaned) return "Sensor";

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeRunoutSensorBoolean(value, fallback = null) {
  if (typeof value === "boolean") return value;
  if (value == null || value === "") return fallback;

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric !== 0;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["true", "on", "enabled", "yes", "detected", "triggered", "active"].includes(normalized)) return true;
  if (["false", "off", "disabled", "no", "open", "inactive"].includes(normalized)) return false;
  return fallback;
}

function sortRunoutSensorObjectKeys(objectKeys = []) {
  const deduped = [...new Set(
    (Array.isArray(objectKeys) ? objectKeys : [])
      .map((key) => normalizeRunoutSensorObjectKey(key))
      .filter(Boolean)
  )];

  deduped.sort((a, b) => {
    const aName = formatRunoutSensorPrettyName(getRunoutSensorNameFromObjectKey(a));
    const bName = formatRunoutSensorPrettyName(getRunoutSensorNameFromObjectKey(b));
    return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: "base" });
  });

  return deduped;
}

function setRunoutSensorObjectKeys(objectKeys = []) {
  const nextKeys = sortRunoutSensorObjectKeys(objectKeys);
  const previousKeys = Array.isArray(state.runoutSensors?.objectKeys) ? state.runoutSensors.objectKeys : [];
  const previousMap = state.runoutSensors?.sensorsByKey && typeof state.runoutSensors.sensorsByKey === "object"
    ? state.runoutSensors.sensorsByKey
    : {};

  const nextMap = {};
  nextKeys.forEach((key) => {
    const existing = previousMap[key] || {};
    const name = String(existing.name || getRunoutSensorNameFromObjectKey(key)).trim();
    nextMap[key] = {
      objectKey: key,
      name,
      prettyName: String(existing.prettyName || formatRunoutSensorPrettyName(name)),
      filamentDetected: normalizeRunoutSensorBoolean(existing.filamentDetected, null),
      enabled: normalizeRunoutSensorBoolean(existing.enabled, true),
      pending: !!existing.pending,
    };
  });

  state.runoutSensors.objectKeys = nextKeys;
  state.runoutSensors.sensorsByKey = nextMap;
  return nextKeys.join("|") !== previousKeys.join("|");
}

function getRunoutSensorEntries() {
  const keys = Array.isArray(state.runoutSensors?.objectKeys) ? state.runoutSensors.objectKeys : [];
  return keys
    .map((key) => state.runoutSensors.sensorsByKey?.[key])
    .filter((entry) => entry && typeof entry === "object");
}

function mergeRunoutSensorStatusSnapshot(statusSnapshot) {
  const snapshot = statusSnapshot && typeof statusSnapshot === "object" ? statusSnapshot : {};
  let changed = false;
  const currentKeys = new Set(Array.isArray(state.runoutSensors.objectKeys) ? state.runoutSensors.objectKeys : []);

  Object.entries(snapshot).forEach(([rawObjectKey, rawStatus]) => {
    const objectKey = normalizeRunoutSensorObjectKey(rawObjectKey);
    if (!objectKey) return;

    const prior = state.runoutSensors.sensorsByKey?.[objectKey] || null;
    const priorName = String(prior?.name || getRunoutSensorNameFromObjectKey(objectKey)).trim();
    const nextDetected = normalizeRunoutSensorBoolean(rawStatus?.filament_detected, prior?.filamentDetected ?? null);
    const nextEnabled = normalizeRunoutSensorBoolean(rawStatus?.enabled, prior?.enabled ?? true);

    const nextEntry = {
      objectKey,
      name: priorName,
      prettyName: String(prior?.prettyName || formatRunoutSensorPrettyName(priorName)),
      filamentDetected: nextDetected,
      enabled: nextEnabled,
      pending: !!prior?.pending,
    };

    if (
      !prior
      || prior.filamentDetected !== nextEntry.filamentDetected
      || prior.enabled !== nextEntry.enabled
      || prior.name !== nextEntry.name
      || prior.prettyName !== nextEntry.prettyName
    ) {
      state.runoutSensors.sensorsByKey = {
        ...state.runoutSensors.sensorsByKey,
        [objectKey]: nextEntry,
      };
      changed = true;
    }

    if (!currentKeys.has(objectKey)) {
      currentKeys.add(objectKey);
      changed = true;
    }
  });

  if (changed) {
    state.runoutSensors.objectKeys = sortRunoutSensorObjectKeys([...currentKeys]);
    state.runoutSensors.lastUpdatedMs = Date.now();
  }

  return changed;
}

function setRunoutSensorsStatusMessage(message, level = "info") {
  if (!els.runoutSensorStatus) return;
  els.runoutSensorStatus.textContent = String(message || "").trim();
  els.runoutSensorStatus.dataset.level = level;
}

function renderRunoutSensorsCard() {
  if (!els.runoutSensorList || !els.runoutSensorStatus) return;

  const sensors = getRunoutSensorEntries();
  const isConnected = state.connectionStatus === "connected";
  const isLoading = !!state.runoutSensors.loading;
  const hasError = !!state.runoutSensors.lastError;

  els.runoutSensorList.innerHTML = "";

  if (!sensors.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "runout-sensor-empty";

    const emptyMessage = document.createElement("p");
    emptyMessage.className = "muted";
    emptyMessage.textContent = isConnected
      ? (isLoading ? "Loading runout sensors..." : "No filament runout sensors detected.")
      : "Connect to Moonraker to load runout sensors.";
    emptyItem.appendChild(emptyMessage);
    els.runoutSensorList.appendChild(emptyItem);
  } else {
    sensors.forEach((sensor, index) => {
      const item = document.createElement("li");
      item.className = "runout-sensor-item";
      if (sensor.pending) {
        item.classList.add("is-pending");
      }

      const nameWrap = document.createElement("div");
      nameWrap.className = "runout-sensor-name-wrap";

      const nameEl = document.createElement("p");
      nameEl.className = "runout-sensor-name";
      nameEl.id = `runout-sensor-name-${index}`;
      nameEl.textContent = sensor.prettyName || "Sensor";
      nameWrap.appendChild(nameEl);

      const icon = document.createElement("span");
      icon.className = "runout-sensor-icon";
      icon.setAttribute("role", "img");

      if (sensor.filamentDetected === true) {
        icon.dataset.state = "detected";
        icon.setAttribute("aria-label", "Filament detected");
        icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"></circle><path d="m8.2 12.4 2.4 2.4 5.2-5.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
      } else if (sensor.filamentDetected === false) {
        icon.dataset.state = "runout";
        icon.setAttribute("aria-label", "Runout triggered");
        icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4.5 3.8 19.5h16.4L12 4.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path><path d="M12 9.4v4.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><circle cx="12" cy="16.9" r="1.1" fill="currentColor"></circle></svg>';
      } else {
        icon.dataset.state = "unknown";
        icon.setAttribute("aria-label", "Sensor state unknown");
        icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.8" stroke="currentColor" stroke-width="1.8"></circle><path d="M12 9.2v3.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><circle cx="12" cy="15.8" r="1.1" fill="currentColor"></circle></svg>';
      }

      const toggle = document.createElement("label");
      toggle.className = "runout-sensor-switch";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = sensor.enabled !== false;
      input.disabled = !isConnected || sensor.pending || isLoading;
      input.dataset.runoutSensorToggle = "true";
      input.dataset.runoutSensorKey = sensor.objectKey;
      input.setAttribute("aria-labelledby", nameEl.id);
      input.setAttribute("aria-label", `Toggle ${sensor.prettyName || "sensor"}`);
      input.title = input.checked ? "Disable sensor" : "Enable sensor";

      const slider = document.createElement("span");
      slider.className = "runout-sensor-switch-slider";
      slider.setAttribute("aria-hidden", "true");

      toggle.append(input, slider);
      item.append(nameWrap, icon, toggle);
      els.runoutSensorList.appendChild(item);
    });
  }

  if (!isConnected) {
    setRunoutSensorsStatusMessage("Connect to Moonraker to load runout sensor state.", "warn");
    return;
  }

  if (isLoading) {
    setRunoutSensorsStatusMessage("Loading runout sensors...", "info");
    return;
  }

  if (hasError) {
    setRunoutSensorsStatusMessage(`Runout sensor update issue: ${state.runoutSensors.lastError}`, "error");
    return;
  }

  if (!sensors.length) {
    setRunoutSensorsStatusMessage("No runout sensors found in printer objects.", "info");
    return;
  }

  const enabledCount = sensors.filter((entry) => entry.enabled !== false).length;
  setRunoutSensorsStatusMessage(
    `${sensors.length} sensor${sensors.length === 1 ? "" : "s"} loaded (${enabledCount} enabled).`,
    "info"
  );
}

async function setRunoutSensorEnabled(objectKey, enabled) {
  const normalizedKey = normalizeRunoutSensorObjectKey(objectKey);
  if (!normalizedKey) return false;

  const current = state.runoutSensors.sensorsByKey?.[normalizedKey];
  if (!current || current.pending || !current.name) return false;

  const targetEnabled = !!enabled;
  state.runoutSensors.sensorsByKey = {
    ...state.runoutSensors.sensorsByKey,
    [normalizedKey]: {
      ...current,
      pending: true,
    },
  };
  renderRunoutSensorsCard();

  const script = `SET_FILAMENT_SENSOR SENSOR=${encodeGcodeParamValue(current.name)} ENABLE=${targetEnabled ? 1 : 0}`;
  const actionLabel = `${targetEnabled ? "Enable" : "Disable"} runout sensor ${current.prettyName || current.name}`;
  const sent = await executeGcodeAction(script, { actionLabel });

  const latest = state.runoutSensors.sensorsByKey?.[normalizedKey] || current;
  state.runoutSensors.sensorsByKey = {
    ...state.runoutSensors.sensorsByKey,
    [normalizedKey]: {
      ...latest,
      enabled: sent ? targetEnabled : latest.enabled,
      pending: false,
    },
  };

  if (sent) {
    state.runoutSensors.lastError = "";
    state.runoutSensors.lastUpdatedMs = Date.now();
  } else {
    state.runoutSensors.lastError = `Failed to update ${current.prettyName || current.name}.`;
  }

  renderRunoutSensorsCard();
  return sent;
}

function getDashboardStatusQueryObjects() {
  const baseObjects = [
    "extruder",
    "heater_bed",
    "print_stats",
    "virtual_sdcard",
    "gcode_move",
    "motion_report",
    "toolhead",
    "manual_probe",
    "fan",
  ];
  const runoutObjects = Array.isArray(state.runoutSensors?.objectKeys) ? state.runoutSensors.objectKeys : [];
  return [...new Set([...baseObjects, ...runoutObjects])];
}

async function queryDashboardStatusSnapshot() {
  if (!state.client) {
    throw new Error("Moonraker is not connected.");
  }

  const objects = getDashboardStatusQueryObjects();
  if (typeof state.client.queryPrinterObjects === "function") {
    return state.client.queryPrinterObjects(objects);
  }
  return state.client.call(`/printer/objects/query?${objects.map((entry) => encodeURIComponent(entry)).join("&")}`);
}

async function refreshRunoutSensors({ source = "manual", silent = false } = {}) {
  if (!state.client) {
    state.runoutSensors.loading = false;
    renderRunoutSensorsCard();
    return [];
  }

  if (state.runoutSensors.loading) {
    return getRunoutSensorEntries();
  }

  state.runoutSensors.loading = true;
  if (!silent) {
    state.runoutSensors.lastError = "";
  }
  renderRunoutSensorsCard();

  try {
    const objectsResponse = await state.client.call("/printer/objects/list");
    const objects = Array.isArray(objectsResponse?.result?.objects)
      ? objectsResponse.result.objects
      : [];

    const runoutKeys = objects.filter((entry) => isRunoutSensorObjectKey(entry));
    setRunoutSensorObjectKeys(runoutKeys);

    if (runoutKeys.length) {
      let statusResponse;
      if (typeof state.client.queryPrinterObjects === "function") {
        statusResponse = await state.client.queryPrinterObjects(runoutKeys);
      } else {
        statusResponse = await state.client.call(`/printer/objects/query?${runoutKeys.map((key) => encodeURIComponent(key)).join("&")}`);
      }

      mergeRunoutSensorStatusSnapshot(statusResponse?.result?.status || {});
    }

    state.runoutSensors.lastUpdatedMs = Date.now();
    state.runoutSensors.lastError = "";
    log.info("Runout sensors refreshed.", { source, count: runoutKeys.length });
    return getRunoutSensorEntries();
  } catch (error) {
    const message = error?.message || String(error);
    state.runoutSensors.lastError = message;
    log.warn("Runout sensor refresh failed.", { source, error: message });
    return getRunoutSensorEntries();
  } finally {
    state.runoutSensors.loading = false;
    renderRunoutSensorsCard();
  }
}

function setStatusFilename(filename) {
  const normalized = typeof filename === "string" ? filename.trim() : "";
  const label = normalized || "No active file";
  state.printStatus.filename = normalized;

  if (!els.statusFileName) return;
  els.statusFileName.textContent = label;
  els.statusFileName.title = label;
}

function shouldShowStatusClearFileButton(printStats = null) {
  const stats = printStats && typeof printStats === "object" ? printStats : state.printStatus.lastPrintStats || {};
  const finishedState = normalizePrinterState(stats?.state || stats?.status);
  const uiState = normalizePrinterState(els.printerState?.dataset?.state || "");
  const rawFilename = String(stats?.filename || state.printStatus.filename || "").trim();
  const printActive = uiState === "printing" || uiState === "paused" || finishedState === "printing" || finishedState === "paused";

  return state.connectionStatus === "connected"
    && !printActive
    && !!rawFilename
    && !state.printStatus.fileClearedAfterComplete;
}
function renderStatusClearFileButton(printStats = null) {
  if (!els.statusClearFile) return;

  const show = shouldShowStatusClearFileButton(printStats);
  els.statusClearFile.hidden = !show;
  els.statusClearFile.disabled = !show;
}

function clearStatusCardValues() {
  setStatusFilename("");
  setStatusThumbnail("");

  if (els.progressBar) {
    els.progressBar.style.width = "0%";
  }

  if (els.progressText) {
    els.progressText.textContent = "0%";
  }

  if (els.statusProgressRingText) {
    els.statusProgressRingText.textContent = "0%";
  }

  if (els.statusProgressRing) {
    const radius = Number(els.statusProgressRing.getAttribute("r")) || 16;
    const circumference = 2 * Math.PI * radius;
    els.statusProgressRing.style.strokeDasharray = `${circumference}`;
    els.statusProgressRing.style.strokeDashoffset = `${circumference}`;
  }

  if (els.statusEtp) {
    els.statusEtp.textContent = "--:--:--";
  }

  if (els.statusFinish) {
    els.statusFinish.textContent = "--:--";
  }

  updateStatusCountdown(null);

  if (els.statusSpeed) {
    els.statusSpeed.textContent = "-- mm/s";
  }

  if (els.statusFlowrate) {
    els.statusFlowrate.textContent = "--%";
  }

  if (els.statusFilament) {
    els.statusFilament.textContent = "--";
  }

  if (els.statusLayer) {
    els.statusLayer.textContent = "Layer: --/--";
  }

  renderStatusThermalsAndFan();
}

function clearStatusFileFromCard() {
  const stats = state.printStatus.lastPrintStats || {};
  const finishedState = normalizePrinterState(stats?.state || stats?.status);
  const uiState = normalizePrinterState(els.printerState?.dataset?.state || "");
  const printActive = uiState === "printing" || uiState === "paused" || finishedState === "printing" || finishedState === "paused";
  const currentFilename = normalizeGcodePath(stats?.filename || state.printStatus.filename || "");

  if (printActive || !currentFilename) return;

  const persistedClearedFilename = persistStatusClearedFilename(currentFilename);
  state.printStatus.fileClearedAfterComplete = !!persistedClearedFilename;
  state.printStatus.clearedFilename = persistedClearedFilename;
  state.printStatus.lastPrintStats = {
    ...state.printStatus.lastPrintStats,
    filename: "",
  };
  clearStatusCardValues();
  renderStatusClearFileButton(stats);
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

  if (els.statusProgressRingText) {
    els.statusProgressRingText.textContent = `${pct}%`;
  }

  if (els.statusProgressRing) {
    const radius = Number(els.statusProgressRing.getAttribute("r")) || 16;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;
    els.statusProgressRing.style.strokeDasharray = `${circumference}`;
    els.statusProgressRing.style.strokeDashoffset = `${offset}`;
  }
}

function formatStatusTemperaturePair(current, target) {
  const currentValue = readFiniteNumber(current);
  const targetValue = readFiniteNumber(target);

  if (!Number.isFinite(currentValue) && !Number.isFinite(targetValue)) {
    return "--.-\u00B0C / --\u00B0C";
  }

  const currentLabel = Number.isFinite(currentValue) ? `${currentValue.toFixed(1)}\u00B0C` : "--.-\u00B0C";
  const targetLabel = Number.isFinite(targetValue) ? `${Math.max(0, Math.round(targetValue))}\u00B0C` : "--\u00B0C";
  return `${currentLabel} / ${targetLabel}`;
}

function normalizeStatusFanPercent(value) {
  const numeric = readFiniteNumber(value);
  if (!Number.isFinite(numeric)) return null;

  // Moonraker fan.speed is usually 0..1, but some integrations report 0..100.
  const scaled = numeric <= 1.000001 ? numeric * 100 : numeric;
  return Math.max(0, Math.min(100, Math.round(scaled)));
}

function renderStatusThermalsAndFan() {
  if (els.statusHotendSummary) {
    els.statusHotendSummary.textContent = `Nozzle ${formatStatusTemperaturePair(
      state.temperatures.hotend.current,
      state.temperatures.hotend.target
    )}`;
  }

  if (els.statusBedSummary) {
    els.statusBedSummary.textContent = `Bed ${formatStatusTemperaturePair(
      state.temperatures.bed.current,
      state.temperatures.bed.target
    )}`;
  }

  if (els.statusFanSpeed) {
    let fanPercent = normalizeStatusFanPercent(state.printStatus.lastFanSpeed);
    if (!Number.isFinite(fanPercent)) {
      fanPercent = normalizeFanSpeedPercent(state.controls.fanSpeed);
    }
    els.statusFanSpeed.textContent = Number.isFinite(fanPercent) ? `${fanPercent}%` : "--%";
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

function updateStatusFanSnapshot(fan = null) {
  const speedCandidate = fan && typeof fan === "object"
    ? fan.speed ?? fan.value ?? fan.speed_factor ?? null
    : null;
  const fanPercent = normalizeStatusFanPercent(speedCandidate);
  if (Number.isFinite(fanPercent)) {
    state.printStatus.lastFanSpeed = fanPercent;
  }
  renderStatusThermalsAndFan();
}

function updateStatusRatesAndFilament(printStats, gcodeMove = null, motionReport = null, toolhead = null) {
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

  if (toolhead && typeof toolhead === "object") {
    state.printStatus.lastToolhead = {
      ...state.printStatus.lastToolhead,
      ...toolhead,
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

function updateJobsListPrintSnapshot() {
  const current = getCurrentJobsPrintState();
  state.jobs.listPrintPath = normalizeGcodePath(current.filename);
  state.jobs.listPrintState = normalizePrinterState(current.state);
}

function shouldRenderJobsListFromStatusUpdate() {
  if (state.activeView !== "files") return false;

  const current = getCurrentJobsPrintState();
  const nextPath = normalizeGcodePath(current.filename);
  const nextState = normalizePrinterState(current.state);

  const changed = nextPath !== state.jobs.listPrintPath || nextState !== state.jobs.listPrintState;
  if (changed) {
    state.jobs.listPrintPath = nextPath;
    state.jobs.listPrintState = nextState;
  }

  return changed;
}

function updateStatusFileInfo(printStats, gcodeMove = null, motionReport = null, toolhead = null) {
  const stats = mergePrintStatsSnapshot(printStats);
  const rawFilename = typeof stats.filename === "string" ? stats.filename : "";
  const normalizedRaw = rawFilename.trim();
  const finishedState = normalizePrinterState(stats?.state || stats?.status);
  const printActive = finishedState === "printing" || finishedState === "paused";
  const normalizedPath = normalizeGcodePath(normalizedRaw);
  const clearedPath = normalizeGcodePath(state.printStatus.clearedFilename);

  if (printActive) {
    state.printStatus.fileClearedAfterComplete = false;
    state.printStatus.clearedFilename = "";
    persistStatusClearedFilename("");
  } else if (
    state.printStatus.fileClearedAfterComplete
    && normalizedPath
    && clearedPath
    && normalizedPath !== clearedPath
  ) {
    state.printStatus.fileClearedAfterComplete = false;
    state.printStatus.clearedFilename = "";
    persistStatusClearedFilename("");
  }

  const statusCardCleared = state.printStatus.fileClearedAfterComplete
    && !!normalizedPath
    && !printActive
    && (!clearedPath || normalizedPath === clearedPath);
  const filename = statusCardCleared ? "" : rawFilename;
  const normalized = filename.trim();
  const simulationMode = isPrettySimulationMode();

  if (statusCardCleared) {
    clearStatusCardValues();
    renderControlsPanel();
    renderJobsJobControls();
    renderStatusClearFileButton(stats);

    if (!simulationMode) {
      updatePrettyGcodeToolhead({ skipRender: !isPrettyGcodeViewerVisible() });
    }

    if (shouldRenderJobsListFromStatusUpdate()) {
      renderJobsList();
    }

    return;
  }

  setStatusFilename(filename);
  updateStatusTiming(stats);
  updateStatusRatesAndFilament(stats, gcodeMove, motionReport, toolhead);
  renderStatusLayer(stats);
  renderControlsPanel();
  renderJobsJobControls();
  renderStatusClearFileButton(stats);

  if (!simulationMode) {
    updatePrettyGcodeToolhead({ skipRender: !isPrettyGcodeViewerVisible() });
  }

  if (shouldRenderJobsListFromStatusUpdate()) {
    renderJobsList();
  }

  if (!normalized) {
    setStatusThumbnail("");

    if (!normalizedRaw) {
      if (!simulationMode && state.prettyGcode.activeFile) {
        void syncPrettyGcodeForActiveFile("");
      } else if (isPrettyGcodeViewerVisible()) {
        renderPrettyGcodeView();
      }
    }

    return;
  }

  if (!state.printStatus.metadataByFile.has(normalized)) {
    setStatusThumbnail("");
  }

  void syncStatusFileMetadata(normalized);

  if (!simulationMode && (isPrettyGcodeViewerVisible() || state.prettyGcode.activeFile)) {
    void syncPrettyGcodeForActiveFile(normalized);
  }
}
function switchView(viewName) {
  if (!isKnownView(viewName)) return;
  els.navItems.forEach((btn) => btn.classList.toggle("active", btn.dataset.view === viewName));
  els.views.forEach((view) => view.classList.toggle("active", view.id === `view-${viewName}`));
  els.pageTitle.textContent = VIEW_TITLES[viewName] || viewName.slice(0, 1).toUpperCase() + viewName.slice(1);
  state.activeView = viewName;
  syncPrettyGcodeCardPlacement();
  updateSettingsSubnavVisibility();
  if (viewName === "settings") {
    queueSettingsSubnavSync();
    renderSettingsDashboardLayout();
  }
  localStorage.setItem(ACTIVE_VIEW_STORAGE_KEY, viewName);

  if (isPrettyGcodeViewerVisible()) {
    renderPrettyGcodeView();
  }
}

function normalizeControlDistance(value) {
  const numeric = Number(value);
  const matched = CONTROL_DISTANCE_VALUES.find((candidate) => Math.abs(candidate - numeric) < 0.000001);
  return Number.isFinite(matched) ? matched : 10;
}

function formatControlNumber(value, decimals = 3) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0";
  if (Math.abs(numeric) < 0.000001) return "0";

  const rounded = Number(numeric.toFixed(decimals));
  return String(rounded);
}

function normalizeFanSpeedPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 100;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function fanSpeedPercentToPwm(percent) {
  const normalized = normalizeFanSpeedPercent(percent);
  return Math.round((normalized / 100) * 255);
}

function normalizeHomedAxes(value) {
  const axes = new Set();

  const addFromString = (raw) => {
    const normalized = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/[^xyz]/g, "");

    normalized.split("").forEach((axis) => {
      if (axis) {
        axes.add(axis);
      }
    });
  };

  if (value == null) {
    return axes;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => addFromString(entry));
    return axes;
  }

  if (value instanceof Set) {
    value.forEach((entry) => addFromString(entry));
    return axes;
  }

  if (typeof value === "object") {
    Object.entries(value).forEach(([key, raw]) => {
      const normalizedRaw = String(raw || "").trim().toLowerCase();
      const enabled = raw === true || raw === 1 || normalizedRaw === "true" || normalizedRaw === "homed";
      if (enabled) {
        addFromString(key);
      }
    });
    return axes;
  }

  addFromString(value);
  return axes;
}

function setControlsHomingClass(element, isHomed) {
  if (!(element instanceof HTMLElement)) return;

  element.classList.toggle("controls-homing-ready", !!isHomed);
  element.classList.toggle("controls-homing-pending", !isHomed);
}

function getControlsAvailability() {
  const printerState = String(els.printerState?.dataset?.state || "unknown").trim().toLowerCase();
  const connected = state.connectionStatus === "connected";
  const operational = connected && !["unknown", "connecting", "disconnected", "error"].includes(printerState);
  const printing = printerState === "printing";

  return { connected, operational, printing };
}

function clearControlsResetTimer(timerKey) {
  const handle = state.controls?.[timerKey];
  if (!handle) return;
  clearTimeout(handle);
  state.controls[timerKey] = null;
}

function scheduleControlsInputReset(timerKey, input) {
  clearControlsResetTimer(timerKey);

  state.controls[timerKey] = setTimeout(() => {
    if (input instanceof HTMLInputElement && document.activeElement !== input) {
      input.value = "";
    }
    state.controls[timerKey] = null;
  }, 5000);
}

function setControlsKeyboardActive(active) {
  const { operational, printing } = getControlsAvailability();
  const nextState = !!active && operational && !printing;

  state.controls.keyboardActive = nextState;
}

function setControlDistance(distance, { persist = true } = {}) {
  const normalized = normalizeControlDistance(distance);
  state.controls.distance = normalized;

  if (persist) {
    localStorage.setItem("controls_jog_distance", String(normalized));
  }

  renderControlDistanceButtons();
}

function renderControlDistanceButtons() {
  const selected = normalizeControlDistance(state.controls.distance);

  els.controlsDistanceButtons.forEach((button) => {
    const value = normalizeControlDistance(button.dataset.jogDistance);
    const active = Math.abs(value - selected) < 0.000001;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function updateControlsToolsFromConfig(settings = {}) {
  const rawKeys = Object.keys(settings || {});
  const toolIndices = [];

  rawKeys.forEach((key) => {
    const normalized = String(key || "").trim().toLowerCase();
    if (!normalized) return;

    if (normalized === "extruder") {
      toolIndices.push(0);
      return;
    }

    const match = normalized.match(/^extruder(\d+)$/);
    if (!match) return;

    const index = Number(match[1]);
    if (Number.isFinite(index) && index >= 0) {
      toolIndices.push(index);
    }
  });

  if (!toolIndices.length) {
    toolIndices.push(0);
  }

  const uniqueSorted = [...new Set(toolIndices)].sort((a, b) => a - b);
  state.controls.tools = uniqueSorted.map((index) => ({
    label: index === 0 ? "Hotend" : `Tool ${index}`,
    command: `T${index}`,
  }));

  renderControlsPanel();
}

function renderControlToolOptions() {
  if (!els.controlsToolRow || !els.controlsToolSelect) return;

  const tools = Array.isArray(state.controls.tools) && state.controls.tools.length
    ? state.controls.tools
    : [{ label: "Hotend", command: "T0" }];

  els.controlsToolSelect.innerHTML = "";

  tools.forEach((tool) => {
    const option = document.createElement("option");
    option.value = tool.command;
    option.textContent = tool.label;
    els.controlsToolSelect.appendChild(option);
  });

  els.controlsToolRow.hidden = tools.length <= 1;
}

function getControlsZOffsetStepButtons() {
  return [
    ...document.querySelectorAll('[data-control-zoffset-adjust]'),
  ];
}
function getControlsZOffsetSteps() {
  const rawSteps = Array.isArray(state.controls.zOffsetSteps)
    ? state.controls.zOffsetSteps
    : CONTROL_Z_OFFSET_STEPS;
  const unique = [...new Set(rawSteps
    .map((step) => Number(step))
    .filter((step) => Number.isFinite(step) && step > 0)
    .map((step) => Number(step.toFixed(4))))]
    .sort((a, b) => a - b);
  return unique.length ? unique : [...CONTROL_Z_OFFSET_STEPS];
}
function formatControlsZOffsetStep(step) {
  const numeric = Number(step);
  if (!Number.isFinite(numeric) || numeric <= 0) return "0.01";
  return String(Number(numeric.toFixed(4)));
}
function renderControlsZOffsetStepButtons() {
  if (!els.controlsZOffsetUpGroup || !els.controlsZOffsetDownGroup) return;
  const steps = getControlsZOffsetSteps();
  if (els.controlsZOffsetUpGroup.childElementCount !== steps.length) {
    els.controlsZOffsetUpGroup.innerHTML = "";
    steps.forEach((step) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "controls-zoffset-step";
      button.dataset.controlZoffsetAdjust = "up";
      button.dataset.controlZoffsetStep = formatControlsZOffsetStep(step);
      button.textContent = `+${formatControlsZOffsetStep(step)}`;
      els.controlsZOffsetUpGroup.appendChild(button);
    });
  }
  if (els.controlsZOffsetDownGroup.childElementCount !== steps.length) {
    els.controlsZOffsetDownGroup.innerHTML = "";
    steps.forEach((step) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "controls-zoffset-step";
      button.dataset.controlZoffsetAdjust = "down";
      button.dataset.controlZoffsetStep = formatControlsZOffsetStep(step);
      button.textContent = `-${formatControlsZOffsetStep(step)}`;
      els.controlsZOffsetDownGroup.appendChild(button);
    });
  }
}
function getControlsCurrentZOffset() {
  const homingOrigin = state.printStatus.lastGcodeMove?.homing_origin;
  const value = Array.isArray(homingOrigin) ? Number(homingOrigin[2]) : Number.NaN;
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 1000) / 1000;
}
function getControlsHomedAxesRaw() {
  const homedAxes = normalizeHomedAxes(state.printStatus.lastToolhead?.homed_axes);
  return ["x", "y", "z"].filter((axis) => homedAxes.has(axis)).join("");
}
function controlsShouldUseMoveFlag() {
  return getControlsHomedAxesRaw() === "xyz";
}
function getControlsAvailableGcodeCommands() {
  const commands = new Set();
  const helperEntries = Array.isArray(state.console.helperEntries) ? state.console.helperEntries : [];
  helperEntries.forEach((entry) => {
    const command = String(entry?.command || "").trim().toUpperCase();
    if (!command) return;
    commands.add(command);
  });
  return commands;
}
function hasControlsGcodeCommand(command) {
  const normalized = String(command || "").trim().toUpperCase();
  if (!normalized) return false;
  return getControlsAvailableGcodeCommands().has(normalized);
}
function getControlsZOffsetConfigSettings() {
  const settings = state.controls.configSettings;
  return settings && typeof settings === "object" ? settings : {};
}
function getControlsZOffsetStepperName(settings) {
  const kinematics = String(settings?.printer?.kinematics || "cartesian").trim().toLowerCase();
  return kinematics === "delta" ? "stepper_a" : "stepper_z";
}
function getControlsZOffsetEndstopPin(settings) {
  const stepperName = getControlsZOffsetStepperName(settings);
  return String(settings?.[stepperName]?.endstop_pin || "").trim();
}
function getControlsIsEndstopProbe() {
  const endstopPin = getControlsZOffsetEndstopPin(getControlsZOffsetConfigSettings());
  if (!endstopPin) return false;
  return endstopPin.replace(/\s+/g, "").includes("probe:z_virtual_endstop");
}
function getControlsAutoZOffsetSaveCommand() {
  if (getControlsIsEndstopProbe() && hasControlsGcodeCommand("Z_OFFSET_APPLY_PROBE")) {
    return "Z_OFFSET_APPLY_PROBE";
  }
  return "Z_OFFSET_APPLY_ENDSTOP";
}
function getControlsShowZOffsetSaveButton(zOffsetValue) {
  if (Math.abs(Number(zOffsetValue) || 0) < 0.000001) return false;
  const isEndstopProbe = getControlsIsEndstopProbe();
  if (isEndstopProbe && hasControlsGcodeCommand("Z_OFFSET_APPLY_PROBE")) return true;
  return !isEndstopProbe && hasControlsGcodeCommand("Z_OFFSET_APPLY_ENDSTOP");
}
function closeControlsZOffsetSaveDialog() {
  if (!(els.controlsZOffsetSaveDialog instanceof HTMLDialogElement)) return;
  if (!els.controlsZOffsetSaveDialog.open) return;
  els.controlsZOffsetSaveDialog.close();
}
function renderControlsZOffsetSaveDialog() {
  const printing = getControlsAvailability().printing;
  if (els.controlsZOffsetSaveDialogDescription) {
    els.controlsZOffsetSaveDialogDescription.textContent = printing
      ? "Z-offset was applied for the active print. Save Config is disabled while printing."
      : "Z-offset was applied. Save Config to make this value persistent after restart.";
  }
  if (els.controlsZOffsetSaveDialogSaveConfig) {
    els.controlsZOffsetSaveDialogSaveConfig.hidden = printing;
  }
  if (els.controlsZOffsetSaveDialogLater) {
    els.controlsZOffsetSaveDialogLater.hidden = printing;
  }
  if (els.controlsZOffsetSaveDialogOk) {
    els.controlsZOffsetSaveDialogOk.hidden = !printing;
  }
}
function openControlsZOffsetSaveDialog() {
  if (!(els.controlsZOffsetSaveDialog instanceof HTMLDialogElement)) return;
  renderControlsZOffsetSaveDialog();
  if (els.controlsZOffsetSaveDialog.open) return;
  els.controlsZOffsetSaveDialog.showModal();
}
function resetManualProbeState({ render = true } = {}) {
  state.manualProbe = createDefaultManualProbeState();
  if (render) {
    renderManualProbeDialog();
  }
}

function formatManualProbeZValue(value, { allowUnknown = false } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return allowUnknown ? "??????" : "0.000";
  }
  return numeric.toFixed(3);
}

function formatManualProbeStep(step) {
  const numeric = Number(step);
  if (!Number.isFinite(numeric) || numeric <= 0) return "0.01";
  return String(Number(numeric.toFixed(3)));
}

function getManualProbeSteps() {
  const normalized = [...new Set(MANUAL_PROBE_STEPS
    .map((step) => Number(step))
    .filter((step) => Number.isFinite(step) && step > 0)
    .map((step) => Number(step.toFixed(3))))]
    .sort((a, b) => a - b);

  return normalized.length ? normalized : [0.005, 0.01, 0.05, 0.1, 1];
}

function renderManualProbeStepButtons() {
  const renderGroup = (container, direction) => {
    if (!(container instanceof HTMLElement)) return;

    const steps = getManualProbeSteps();
    if (container.childElementCount === steps.length) return;

    container.innerHTML = "";

    steps.forEach((step, index) => {
      const label = formatManualProbeStep(step);
      const signed = direction === "up" ? `+${label}` : `-${label}`;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "manual-probe-step-btn";
      button.dataset.manualProbeTestz = signed;
      button.textContent = `${index === 0 ? (direction === "up" ? "\u2191 " : "\u2193 ") : ""}${signed}`;
      container.appendChild(button);
    });
  };

  renderGroup(els.manualProbeAdvancedUp, "up");
  renderGroup(els.manualProbeAdvancedDown, "down");
}

function closeManualProbeDialog() {
  if (!(els.manualProbeDialog instanceof HTMLDialogElement)) return;
  if (!els.manualProbeDialog.open) return;
  els.manualProbeDialog.close();
}

function renderManualProbeDialog() {
  if (!(els.manualProbeDialog instanceof HTMLDialogElement)) return;

  renderManualProbeStepButtons();

  if (els.manualProbeZLower) {
    els.manualProbeZLower.textContent = formatManualProbeZValue(state.manualProbe.zPositionLower, { allowUnknown: true });
  }
  if (els.manualProbeZCurrent) {
    els.manualProbeZCurrent.textContent = formatManualProbeZValue(state.manualProbe.zPosition);
  }
  if (els.manualProbeZUpper) {
    els.manualProbeZUpper.textContent = formatManualProbeZValue(state.manualProbe.zPositionUpper, { allowUnknown: true });
  }

  const active = !!state.manualProbe.isActive;
  const connected = state.connectionStatus === "connected";
  const actionInFlight = String(state.manualProbe.actionInFlight || "").trim().toLowerCase();
  const busy = !!actionInFlight;
  const controlsDisabled = !active || !connected || busy;

  els.manualProbeQuickButtons.forEach((button) => {
    if (button instanceof HTMLButtonElement) {
      button.disabled = controlsDisabled;
    }
  });

  const advancedButtons = [
    ...(els.manualProbeAdvancedUp?.querySelectorAll("button[data-manual-probe-testz]") || []),
    ...(els.manualProbeAdvancedDown?.querySelectorAll("button[data-manual-probe-testz]") || []),
  ];
  advancedButtons.forEach((button) => {
    if (button instanceof HTMLButtonElement) {
      button.disabled = controlsDisabled;
    }
  });

  if (els.manualProbeClose) {
    els.manualProbeClose.disabled = !active || !connected || busy;
  }

  if (els.manualProbeAbort) {
    els.manualProbeAbort.disabled = !active || !connected || busy;
    els.manualProbeAbort.textContent = busy && actionInFlight === "abort" ? "Aborting..." : "Abort";
  }

  if (els.manualProbeAccept) {
    els.manualProbeAccept.disabled = !active || !connected || busy;
    els.manualProbeAccept.textContent = busy && actionInFlight === "accept" ? "Accepting..." : "Accept";
  }

  if (active) {
    if (!els.manualProbeDialog.open) {
      els.manualProbeDialog.showModal();
    }
    return;
  }

  closeManualProbeDialog();
}

function mergeManualProbeStatusSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;

  const previous = state.manualProbe.snapshot && typeof state.manualProbe.snapshot === "object"
    ? state.manualProbe.snapshot
    : {};

  const merged = {
    ...previous,
    ...snapshot,
  };

  const isActive = !!merged.is_active;
  state.manualProbe.isActive = isActive;

  if (!isActive) {
    state.manualProbe.snapshot = {};
    state.manualProbe.zPosition = 0;
    state.manualProbe.zPositionLower = null;
    state.manualProbe.zPositionUpper = null;
    state.manualProbe.actionInFlight = null;
    renderManualProbeDialog();
    return;
  }

  state.manualProbe.snapshot = merged;
  state.manualProbe.zPosition = asFiniteNumber(merged.z_position, state.manualProbe.zPosition);
  state.manualProbe.zPositionLower = asFiniteNumber(merged.z_position_lower, state.manualProbe.zPositionLower);
  state.manualProbe.zPositionUpper = asFiniteNumber(merged.z_position_upper, state.manualProbe.zPositionUpper);

  renderManualProbeDialog();
}

async function executeManualProbeAction(script, { actionKey = "testz", actionLabel = "Manual probe", closeAfterSuccess = false } = {}) {
  if (!state.manualProbe.isActive || !state.client || state.connectionStatus !== "connected") {
    renderManualProbeDialog();
    return false;
  }

  state.manualProbe.actionInFlight = String(actionKey || "testz").trim().toLowerCase() || "testz";
  renderManualProbeDialog();

  const succeeded = await executeGcodeAction(script, { actionLabel });

  if (succeeded && closeAfterSuccess) {
    resetManualProbeState({ render: true });
    return true;
  }

  state.manualProbe.actionInFlight = null;
  renderManualProbeDialog();
  return succeeded;
}

async function requestManualProbeTestz(stepCommand) {
  const normalized = String(stepCommand || "").trim();
  if (!normalized) return false;
  if (!/^(?:--|-|\+|\+\+|[+-](?:\d+|\d*\.\d+))$/.test(normalized)) return false;

  return executeManualProbeAction(`TESTZ Z=${normalized}`, {
    actionKey: "testz",
    actionLabel: `Manual probe TESTZ ${normalized}`,
  });
}

async function requestManualProbeAbort() {
  return executeManualProbeAction("ABORT", {
    actionKey: "abort",
    actionLabel: "Manual probe ABORT",
    closeAfterSuccess: true,
  });
}

async function requestManualProbeAccept() {
  return executeManualProbeAction("ACCEPT", {
    actionKey: "accept",
    actionLabel: "Manual probe ACCEPT",
    closeAfterSuccess: true,
  });
}

function renderControlsPanel() {
  if (!els.controlsCard) return;

  const { operational, printing } = getControlsAvailability();
  const motionDisabled = !operational || printing;
  const commandDisabled = !operational;
  const homedAxes = normalizeHomedAxes(state.printStatus.lastToolhead?.homed_axes);
  const xHomed = homedAxes.has("x");
  const yHomed = homedAxes.has("y");
  const zHomed = homedAxes.has("z");
  const xyHomed = xHomed && yHomed;
  const allAxesHomed = xyHomed && zHomed;

  renderControlDistanceButtons();
  renderControlToolOptions();
  renderControlsZOffsetStepButtons();

  if (els.controlsExtrusionAmount) {
    if (document.activeElement !== els.controlsExtrusionAmount) {
      els.controlsExtrusionAmount.value = formatControlNumber(state.controls.extrusionAmount, 2);
    }
    els.controlsExtrusionAmount.disabled = motionDisabled;
  }

  if (els.controlsFeedrateInput) {
    if (!els.controlsFeedrateInput.value) {
      const speedFactor = Number(state.printStatus.lastGcodeMove?.speed_factor);
      els.controlsFeedrateInput.placeholder = Number.isFinite(speedFactor)
        ? String(Math.max(1, Math.round(speedFactor * 100)))
        : "100";
    }
    els.controlsFeedrateInput.disabled = commandDisabled;
  }

  if (els.controlsFlowrateInput) {
    if (!els.controlsFlowrateInput.value) {
      const flowFactor = Number(state.printStatus.lastGcodeMove?.extrude_factor);
      els.controlsFlowrateInput.placeholder = Number.isFinite(flowFactor)
        ? String(Math.max(1, Math.round(flowFactor * 100)))
        : "100";
    }
    els.controlsFlowrateInput.disabled = commandDisabled;
  }

  if (els.controlsFanSpeed) {
    const fanSpeed = normalizeFanSpeedPercent(state.controls.fanSpeed);
    state.controls.fanSpeed = fanSpeed;

    if (document.activeElement !== els.controlsFanSpeed) {
      els.controlsFanSpeed.value = String(fanSpeed);
    }

    els.controlsFanSpeed.disabled = commandDisabled;
  }

  if (els.controlsFanSpeedValue) {
    els.controlsFanSpeedValue.textContent = `${normalizeFanSpeedPercent(state.controls.fanSpeed)}%`;
  }

  renderStatusThermalsAndFan();

  const currentZOffset = getControlsCurrentZOffset();
  const showZOffsetSaveButton = getControlsShowZOffsetSaveButton(currentZOffset);
  const zOffsetButtons = getControlsZOffsetStepButtons();

  if (els.controlsZOffsetValue) {
    els.controlsZOffsetValue.textContent = Number(currentZOffset).toFixed(3);
  }

  zOffsetButtons.forEach((button) => {
    button.disabled = commandDisabled;
  });

  if (els.controlsZOffsetClear) {
    const canClear = Math.abs(currentZOffset) >= 0.000001;
    els.controlsZOffsetClear.hidden = !canClear;
    els.controlsZOffsetClear.disabled = commandDisabled || !canClear;
  }

  if (els.controlsZOffsetSave) {
    els.controlsZOffsetSave.hidden = !showZOffsetSaveButton;
    els.controlsZOffsetSave.disabled = commandDisabled || !showZOffsetSaveButton;
  }

  renderControlsZOffsetSaveDialog();

  els.controlsJogButtons.forEach((button) => {
    button.disabled = motionDisabled;
    const axis = String(button.dataset.controlJogAxis || "").trim().toLowerCase();
    const axisHomed = axis === "x" ? xHomed : axis === "y" ? yHomed : axis === "z" ? zHomed : allAxesHomed;
    setControlsHomingClass(button, axisHomed);
  });

  els.controlsHomeButtons.forEach((button) => {
    button.disabled = motionDisabled;
    const target = String(button.dataset.controlHome || "").trim().toLowerCase();
    const targetHomed = target === "xy" ? xyHomed : target === "z" ? zHomed : allAxesHomed;
    setControlsHomingClass(button, targetHomed);
  });

  els.controlsDistanceButtons.forEach((button) => {
    button.disabled = motionDisabled;
  });

  if (els.controlsFeedrateSet) els.controlsFeedrateSet.disabled = commandDisabled;
  if (els.controlsFlowrateSet) els.controlsFlowrateSet.disabled = commandDisabled;
  if (els.controlsExtrude) els.controlsExtrude.disabled = motionDisabled;
  if (els.controlsRetract) els.controlsRetract.disabled = motionDisabled;
  if (els.controlsToolSelect) els.controlsToolSelect.disabled = commandDisabled;
  if (els.controlsToolSet) els.controlsToolSet.disabled = commandDisabled;
  if (els.controlsMotorsOff) {
    els.controlsMotorsOff.disabled = motionDisabled;
    setControlsHomingClass(els.controlsMotorsOff, allAxesHomed);
  }
  if (els.controlsFanOn) els.controlsFanOn.disabled = commandDisabled;
  if (els.controlsFanOff) els.controlsFanOff.disabled = commandDisabled;

  if (motionDisabled) {
    setControlsKeyboardActive(false);
  }
}

function buildControlJogCommand(axis, directionMultiplier) {
  const normalizedAxis = String(axis || "").trim().toUpperCase();
  if (!["X", "Y", "Z"].includes(normalizedAxis)) return "";

  const direction = Number(directionMultiplier);
  if (!Number.isFinite(direction) || direction === 0) return "";

  const distance = normalizeControlDistance(state.controls.distance) * direction;
  return `G91\nG0 ${normalizedAxis}${formatControlNumber(distance, 3)} F6000\nG90`;
}

async function sendControlJogCommand(axis, directionMultiplier) {
  const script = buildControlJogCommand(axis, directionMultiplier);
  if (!script) return;

  await executeGcodeAction(script, {
    actionLabel: `Jog ${String(axis || "").toUpperCase()}${Number(directionMultiplier) > 0 ? "+" : "-"}`,
  });
}

async function refreshControlsToolheadSnapshot({ silent = true } = {}) {
  if (!state.client || state.connectionStatus !== "connected") {
    return normalizeHomedAxes(state.printStatus.lastToolhead?.homed_axes);
  }

  try {
    const response = await state.client.call("/printer/objects/query?toolhead");
    const toolhead = response?.result?.status?.toolhead || response?.result?.toolhead || null;

    if (toolhead && typeof toolhead === "object") {
      state.printStatus.lastToolhead = {
        ...state.printStatus.lastToolhead,
        ...toolhead,
      };
      renderControlsPanel();
    }
  } catch (error) {
    if (!silent) {
      const message = error?.message || String(error);
      appendConsole(`Toolhead refresh failed after homing: ${message}`, "warn");
    }
  }

  return normalizeHomedAxes(state.printStatus.lastToolhead?.homed_axes);
}

function getExpectedHomedAxesForHomeTarget(target) {
  const normalized = String(target || "").trim().toLowerCase();

  if (normalized === "xy") {
    return new Set(["x", "y"]);
  }

  if (normalized === "z") {
    return new Set(["z"]);
  }

  return new Set(["x", "y", "z"]);
}

function controlsHomedAxesMatch(homedAxes, expectedAxes) {
  if (!(expectedAxes instanceof Set) || !expectedAxes.size) return true;

  for (const axis of expectedAxes) {
    if (!homedAxes.has(axis)) {
      return false;
    }
  }

  return true;
}

async function waitForControlsHomingState(target, { timeoutMs = 15000, intervalMs = 500 } = {}) {
  const expectedAxes = getExpectedHomedAxesForHomeTarget(target);
  const deadline = Date.now() + Math.max(1000, timeoutMs);

  let homedAxes = await refreshControlsToolheadSnapshot({ silent: true });
  if (controlsHomedAxesMatch(homedAxes, expectedAxes)) {
    return true;
  }

  while (Date.now() < deadline) {
    await new Promise((resolve) => {
      setTimeout(resolve, Math.max(100, intervalMs));
    });

    homedAxes = await refreshControlsToolheadSnapshot({ silent: true });
    if (controlsHomedAxesMatch(homedAxes, expectedAxes)) {
      return true;
    }
  }

  return false;
}

async function sendControlHomeCommand(target) {
  const normalized = String(target || "").trim().toLowerCase();
  let script = "G28";

  if (normalized === "xy") {
    script = "G28 X Y";
  } else if (normalized === "z") {
    script = "G28 Z";
  }

  const sent = await executeGcodeAction(script, {
    actionLabel: `Home ${normalized || "all"}`,
  });

  if (!sent) return;

  const updated = await waitForControlsHomingState(normalized || "all");
  const detectedHomedAxes = getControlsHomedAxesRaw() || "(none)";
  if (!updated) {
    appendConsole(`Home command finished but homed axes did not fully update yet. Detected: ${detectedHomedAxes}`, "warn");
    void refreshControlsToolheadSnapshot({ silent: false });
    return;
  }

  appendConsole(`Homed axes detected: ${detectedHomedAxes}`, "info");
}

async function sendFeedRateCommand() {
  const rate = Number(els.controlsFeedrateInput?.value);
  if (!Number.isFinite(rate) || rate < 1) return;

  const sent = await executeGcodeAction(`M220 S${Math.round(rate)}`, {
    actionLabel: "Set feed rate modifier",
    successMessage: `Feed rate set to ${Math.round(rate)}%.`,
  });

  if (sent && els.controlsFeedrateInput) {
    els.controlsFeedrateInput.value = "";
    clearControlsResetTimer("feedRateResetter");
  }
}

async function sendFlowRateCommand() {
  const rate = Number(els.controlsFlowrateInput?.value);
  if (!Number.isFinite(rate) || rate < 1) return;

  const sent = await executeGcodeAction(`M221 S${Math.round(rate)}`, {
    actionLabel: "Set flow rate modifier",
    successMessage: `Flow rate set to ${Math.round(rate)}%.`,
  });

  if (sent && els.controlsFlowrateInput) {
    els.controlsFlowrateInput.value = "";
    clearControlsResetTimer("flowRateResetter");
  }
}

function syncExtrusionAmountFromInput() {
  if (!els.controlsExtrusionAmount) return;

  const parsed = Number(els.controlsExtrusionAmount.value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    els.controlsExtrusionAmount.value = formatControlNumber(state.controls.extrusionAmount, 2);
    return;
  }

  state.controls.extrusionAmount = Math.max(0.1, Math.min(1000, parsed));
  localStorage.setItem("controls_extrusion_amount", String(state.controls.extrusionAmount));
}

async function sendExtrusionCommand(direction) {
  syncExtrusionAmountFromInput();

  const dir = Number(direction);
  if (!Number.isFinite(dir) || dir === 0) return;

  const amount = state.controls.extrusionAmount * (dir > 0 ? 1 : -1);
  const script = `M83\nG1 E${formatControlNumber(amount, 3)} F300\nM82`;

  await executeGcodeAction(script, {
    actionLabel: dir > 0 ? "Extrude" : "Retract",
  });
}

async function sendToolSelectionCommand() {
  const command = String(els.controlsToolSelect?.value || "").trim();
  if (!command) return;

  await executeGcodeAction(command, {
    actionLabel: `Switch tool (${command})`,
  });
}

function buildControlsZOffsetAdjustCommand(direction, step) {
  const normalizedStep = formatControlsZOffsetStep(step);
  const moveSuffix = controlsShouldUseMoveFlag() ? ' MOVE=1' : '';
  const sign = direction === 'down' ? '-' : '+';
  return `SET_GCODE_OFFSET Z_ADJUST=${sign}${normalizedStep}${moveSuffix}`;
}

async function sendControlsZOffsetAdjust(direction, step) {
  const normalizedDirection = String(direction || '').trim().toLowerCase();
  if (!['up', 'down'].includes(normalizedDirection)) return;

  const script = buildControlsZOffsetAdjustCommand(normalizedDirection, step);
  const labelSign = normalizedDirection === 'down' ? '-' : '+';

  await executeGcodeAction(script, {
    actionLabel: `Z-offset ${labelSign}${formatControlsZOffsetStep(step)}`,
  });
}

async function clearControlsZOffset() {
  const moveSuffix = controlsShouldUseMoveFlag() ? ' MOVE=1' : '';
  await executeGcodeAction(`SET_GCODE_OFFSET Z=0${moveSuffix}`, {
    actionLabel: 'Clear Z-offset',
  });
}

function getControlsSelectedZOffsetSaveCommand() {
  const selected = normalizeZOffsetSaveOption(state.controls.zOffsetSaveOption);
  if (selected) return selected;
  return getControlsAutoZOffsetSaveCommand();
}

async function saveControlsZOffset() {
  const command = getControlsSelectedZOffsetSaveCommand();
  if (!command) {
    appendConsole('No supported Z-offset apply command available.', 'warn');
    return;
  }

  const sent = await executeGcodeAction(command, {
    actionLabel: 'Apply Z-offset',
  });

  if (!sent) return;
  openControlsZOffsetSaveDialog();
}

async function saveControlsZOffsetConfig() {
  const saved = await executeGcodeAction('SAVE_CONFIG', {
    actionLabel: 'Save Config',
  });

  if (!saved) return;
  closeControlsZOffsetSaveDialog();
}

async function sendControlsFanSpeed(percent, { persist = true, successMessage = null } = {}) {
  const normalized = normalizeFanSpeedPercent(percent);
  state.controls.fanSpeed = normalized;
  state.printStatus.lastFanSpeed = normalized;

  if (persist) {
    localStorage.setItem("controls_fan_speed", String(normalized));
  }

  renderControlsPanel();
  renderStatusThermalsAndFan();

  const sent = await executeGcodeAction(`M106 S${fanSpeedPercentToPwm(normalized)}`, {
    actionLabel: "Set fan speed",
    successMessage,
  });

  return sent;
}

function handleControlsKeyboardEvent(event) {
  if (!state.controls.keyboardActive) return;

  const target = event.target;
  if (target instanceof HTMLElement && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) {
    return;
  }

  let buttonId = "";
  let visualizeClick = true;

  switch (event.key) {
    case "ArrowLeft":
      buttonId = "control-xdec";
      break;
    case "ArrowUp":
      buttonId = "control-yinc";
      break;
    case "ArrowRight":
      buttonId = "control-xinc";
      break;
    case "ArrowDown":
      buttonId = "control-ydec";
      break;
    case "1":
      buttonId = "control-distance01";
      visualizeClick = false;
      break;
    case "2":
      buttonId = "control-distance1";
      visualizeClick = false;
      break;
    case "3":
      buttonId = "control-distance10";
      visualizeClick = false;
      break;
    case "4":
      buttonId = "control-distance100";
      visualizeClick = false;
      break;
    case "PageUp":
    case "w":
    case "W":
      buttonId = "control-zinc";
      break;
    case "PageDown":
    case "s":
    case "S":
      buttonId = "control-zdec";
      break;
    case "Home":
      buttonId = "control-xyhome";
      break;
    case "End":
      buttonId = "control-zhome";
      break;
    default:
      if (event.code === "Numpad1") {
        buttonId = "control-distance01";
        visualizeClick = false;
      } else if (event.code === "Numpad2") {
        buttonId = "control-distance1";
        visualizeClick = false;
      } else if (event.code === "Numpad3") {
        buttonId = "control-distance10";
        visualizeClick = false;
      } else if (event.code === "Numpad4") {
        buttonId = "control-distance100";
        visualizeClick = false;
      } else {
        return;
      }
  }

  const button = document.getElementById(buttonId);
  if (!(button instanceof HTMLButtonElement) || button.disabled) {
    event.preventDefault();
    return;
  }

  event.preventDefault();

  if (visualizeClick) {
    button.classList.add("controls-jog-btn-active");
    setTimeout(() => {
      button.classList.remove("controls-jog-btn-active");
    }, 150);
  }

  button.click();
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
      const statusResponse = await queryDashboardStatusSnapshot();
      const statusSnapshot = statusResponse?.result?.status || {};

      updateTemperatureSnapshotFromStatus(statusSnapshot);
      updateStatusFanSnapshot(statusSnapshot?.fan || null);

      const virtualSd = mergeVirtualSdSnapshot(statusSnapshot?.virtual_sdcard || null);
      renderStatusProgress(virtualSd);
      updateStatusFileInfo(
        statusSnapshot?.print_stats || {},
        statusSnapshot?.gcode_move || null,
        statusSnapshot?.motion_report || null,
        statusSnapshot?.toolhead || null
      );
      mergeManualProbeStatusSnapshot(statusSnapshot?.manual_probe || null);
      const runoutUpdated = mergeRunoutSensorStatusSnapshot(statusSnapshot);
      if (runoutUpdated) {
        renderRunoutSensorsCard();
      }
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
  const statusElements = [
    els.machineEndstopsStatus,
    els.controlsEndstopsStatus,
  ].filter(Boolean);

  statusElements.forEach((element) => {
    element.textContent = normalized;
    element.dataset.level = level;
  });
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

  const renderTargets = [
    {
      query: els.machineEndstopsQuery,
      summary: els.machineEndstopsSummary,
      list: els.machineEndstopsList,
    },
    {
      query: els.controlsEndstopsQuery,
      summary: els.controlsEndstopsSummary,
      list: els.controlsEndstopsList,
    },
  ];

  renderTargets.forEach((target) => {
    if (target.query) {
      target.query.disabled = !isConnected || endstopsState.queryInFlight;
      target.query.textContent = endstopsState.queryInFlight ? "Querying..." : "Query";
    }

    if (target.list) {
      target.list.innerHTML = "";

      if (!entries.length) {
        const empty = document.createElement("p");
        empty.className = "muted";
        empty.textContent = isConnected
          ? "No endstop data available yet."
          : "Endstop data is unavailable while disconnected.";
        target.list.appendChild(empty);
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
          target.list.appendChild(row);
        });
      }
    }

    if (target.summary) {
      if (!entries.length) {
        target.summary.textContent = "Press Query to check current endstop states.";
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

        target.summary.textContent = `${parts.join(" | ")}${lastLabel}`;
      }
    }
  });

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

function sanitizeUpdateManagerBackupSegment(value, fallback = "all") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function buildUpdateManagerBackupTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function formatUpdateManagerBackupRootPath(path) {
  const normalized = normalizeConfigPath(path);
  return normalized ? `config/${normalized}` : "config";
}

function extractRootFilePaths(fileResponse, rootName = "config") {
  const result = fileResponse?.result;
  const rawFiles = Array.isArray(result)
    ? result
    : Array.isArray(result?.files)
      ? result.files
      : [];

  const paths = new Set();

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
    const normalizedPath = normalizeConfigPath(relativePath);
    if (!normalizedPath || normalizedPath.endsWith("/")) return;

    paths.add(normalizedPath);
  });

  return [...paths].sort((a, b) => a.localeCompare(b));
}

async function ensureUpdateManagerBackupDirectory(path) {
  if (!state.client) {
    throw new Error("Connect to Moonraker before creating backups.");
  }

  const normalizedPath = normalizeConfigPath(path);
  if (!normalizedPath) return;

  try {
    await state.client.createDirectory("config", normalizedPath);
  } catch (error) {
    const message = error?.message || String(error);
    if (/already exists|exists|eexist/i.test(message)) {
      return;
    }

    throw new Error(`Failed to create backup directory ${formatUpdateManagerBackupRootPath(normalizedPath)}: ${message}`);
  }
}

async function ensureUpdateManagerBackupDirectoryTree(path) {
  const normalizedPath = normalizeConfigPath(path);
  if (!normalizedPath) return;

  const segments = normalizedPath.split("/").filter(Boolean);
  let cursor = "";

  for (const segment of segments) {
    cursor = cursor ? `${cursor}/${segment}` : segment;
    await ensureUpdateManagerBackupDirectory(cursor);
  }
}

async function createUpdateManagerPreflightBackup(name = null) {
  if (!state.client) {
    throw new Error("Connect to Moonraker before creating backups.");
  }

  const normalizedName = normalizeUpdaterName(name);
  const targetSegment = sanitizeUpdateManagerBackupSegment(normalizedName || "all", "all");
  const startedAt = new Date();
  const backupId = `${buildUpdateManagerBackupTimestamp(startedAt)}-${targetSegment}`;
  const backupDirectory = `${UPDATE_MANAGER_BACKUP_BASE_DIR}/${backupId}`;
  const filesDirectory = `${backupDirectory}/${UPDATE_MANAGER_BACKUP_FILES_DIRNAME}`;
  const dbBackupFilename = `${UPDATE_MANAGER_DB_BACKUP_PREFIX}-${backupId}.db`;

  appendUpdateManagerActivity(`Creating pre-update backup (${backupId})...`);
  setUpdateManagerStatusMessage("Creating pre-update backup...", "warn");

  await ensureUpdateManagerBackupDirectoryTree(backupDirectory);
  await ensureUpdateManagerBackupDirectoryTree(filesDirectory);

  let databaseBackupPath = "";
  let databaseBackupError = "";

  if (typeof state.client.createDatabaseBackup === "function") {
    try {
      const databaseBackup = await state.client.createDatabaseBackup(dbBackupFilename);
      databaseBackupPath = String(databaseBackup?.backup_path || dbBackupFilename).trim();
    } catch (error) {
      databaseBackupError = error?.message || String(error);
      appendUpdateManagerActivity(`Moonraker DB backup skipped: ${databaseBackupError}`, "warn");
      log.warn("Update manager preflight database backup failed.", {
        filename: dbBackupFilename,
        error: databaseBackupError,
      });
    }
  } else {
    databaseBackupError = "Moonraker database backup method unavailable.";
    appendUpdateManagerActivity("Moonraker DB backup skipped: client method unavailable.", "warn");
  }

  const configFilesResponse = await state.client.getConfigFiles();
  const backupPrefix = `${UPDATE_MANAGER_BACKUP_BASE_DIR}/`;
  const configFiles = extractRootFilePaths(configFilesResponse, "config")
    .filter((path) => path !== UPDATE_MANAGER_BACKUP_BASE_DIR && !path.startsWith(backupPrefix));

  const ensuredDirectories = new Set([filesDirectory]);

  for (const path of configFiles) {
    const sourcePath = normalizeConfigPath(path);
    if (!sourcePath) continue;

    const sourceDirectory = getConfigDirectory(sourcePath);
    const targetDirectory = sourceDirectory
      ? `${filesDirectory}/${sourceDirectory}`
      : filesDirectory;

    if (!ensuredDirectories.has(targetDirectory)) {
      await ensureUpdateManagerBackupDirectoryTree(targetDirectory);
      ensuredDirectories.add(targetDirectory);
    }

    const filename = sourcePath.split("/").pop();
    if (!filename) continue;

    try {
      const blob = await state.client.getFileBlob("config", sourcePath);
      await state.client.uploadFile("config", blob, targetDirectory, filename);
    } catch (error) {
      const message = error?.message || String(error);
      throw new Error(`Failed to back up config/${sourcePath}: ${message}`);
    }
  }

  const manifest = {
    type: "update-manager-preflight-backup",
    created_at: startedAt.toISOString(),
    backup_id: backupId,
    requested_updater: normalizedName || "all",
    config_backup_path: formatUpdateManagerBackupRootPath(filesDirectory),
    config_file_count: configFiles.length,
    database_backup: {
      filename: dbBackupFilename,
      backup_path: databaseBackupPath || null,
      error: databaseBackupPath ? null : (databaseBackupError || "Not available"),
    },
    files: configFiles,
  };

  await state.client.uploadFile(
    "config",
    new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" }),
    backupDirectory,
    UPDATE_MANAGER_BACKUP_MANIFEST_FILENAME
  );

  const successMessage = `Backup ready at ${formatUpdateManagerBackupRootPath(backupDirectory)} (${configFiles.length} file${configFiles.length === 1 ? "" : "s"}).`;
  appendUpdateManagerActivity(successMessage);
  setUpdateManagerStatusMessage(successMessage, "info");

  return {
    backupId,
    backupDirectory,
    filesDirectory,
    manifestPath: `${backupDirectory}/${UPDATE_MANAGER_BACKUP_MANIFEST_FILENAME}`,
    fileCount: configFiles.length,
    databaseBackupPath,
  };
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
    const backupSummary = await createUpdateManagerPreflightBackup(name);
    appendUpdateManagerActivity(
      `Pre-update backup created: ${formatUpdateManagerBackupRootPath(backupSummary.backupDirectory)}`
    );
    setUpdateManagerStatusMessage("Backup complete. Sending update request...", "warn");
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

  renderStatusThermalsAndFan();
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

function getTemperatureTargetPresetValues(sensorKey) {
  const key = sensorKey === "bed" ? "bed" : "hotend";
  const dynamicValues = (Array.isArray(state.thermalPresets) ? state.thermalPresets : [])
    .map((preset) => preset?.values?.[key])
    .filter((value) => value?.active)
    .map((value) => normalizeThermalPresetTemperature(value.value, key));

  if (dynamicValues.length) {
    const unique = [...new Set([0, ...dynamicValues])];
    return unique.sort((a, b) => a - b);
  }

  const fallback = Array.isArray(TEMPERATURE_PRESETS[key]) ? TEMPERATURE_PRESETS[key] : [0];
  const uniqueFallback = [...new Set(fallback.map((value) => normalizeThermalPresetTemperature(value, key)))];
  return uniqueFallback.sort((a, b) => a - b);
}
function buildTemperatureTargetMenu(sensorKey) {
  const menu = sensorKey === "hotend" ? els.tempHotendTargetMenu : els.tempBedTargetMenu;
  if (!menu) return;

  menu.innerHTML = "";
  const currentTarget = Math.round(state.temperatures[sensorKey].target || 0);

  getTemperatureTargetPresetValues(sensorKey).forEach((preset) => {
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
  let header = card.querySelector(":scope > .card-head, :scope > .camera-card-head, :scope > .controls-card-head");
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
  const movableNodes = [...header.children].filter((child) => (
    child !== title
    && !child.classList.contains("card-head-actions")
    && !child.classList.contains("controls-absolute-position")
  ));
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

function mergeMacroKeys(...lists) {
  const merged = [];
  const seen = new Set();

  lists.forEach((list) => {
    const source = Array.isArray(list) ? list : [];

    source.forEach((entry) => {
      let key = String(entry || "").trim();
      if (!key) return;

      if (!key.toLowerCase().startsWith("gcode_macro ")) {
        key = `gcode_macro ${key}`;
      }

      const normalized = key.replace(/^gcode_macro\s+/i, "gcode_macro ").trim();
      if (!normalized) return;

      const lowered = normalized.toLowerCase();
      if (seen.has(lowered)) return;

      seen.add(lowered);
      merged.push(normalized);
    });
  });

  return merged;
}

function extractMacroKeysFromConfigText(configText) {
  const source = String(configText || "");
  if (!source.trim()) return [];

  const keys = [];
  const matches = source.matchAll(/^\s*\[\s*gcode_macro\s+([^\]\r\n]+?)\s*\]\s*$/gmi);

  for (const match of matches) {
    const name = String(match?.[1] || "").trim();
    if (!name) continue;
    keys.push(`gcode_macro ${name}`);
  }

  return mergeMacroKeys(keys);
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
  resetManualProbeState({ render: true });
  state.runoutSensors.loading = false;
  state.runoutSensors.lastError = "";
  state.runoutSensors.sensorsByKey = Object.fromEntries(
    Object.entries(state.runoutSensors.sensorsByKey || {}).map(([key, value]) => ([
      key,
      value && typeof value === "object" ? { ...value, pending: false } : value,
    ]))
  );
  renderRunoutSensorsCard();

  if (printHistoryRefreshTimer) {
    clearTimeout(printHistoryRefreshTimer);
    printHistoryRefreshTimer = null;
  }

  resetPrintHistoryState({ preserveViewState: true });

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
      void loadMachineLogFiles({ source: "connect", silent: true });
      void loadPrintHistoryTotals({ silent: true });
      if (state.activeView === "history") {
        void loadPrintHistory({ source: "connect", silent: true });
      }
      if (state.activeView === "timelapse") {
        void loadTimelapseMediaFiles({ source: "connect", silent: true });
      }
        if (state.activeView === "spoolman") {
          void refreshSpoolmanState({ source: "connect", silent: true });
        }
        void refreshTimelapseSettings({ silent: true });
        void refreshRunoutSensors({ source: "connect", silent: true });
        log.info("Moonraker websocket connected.");
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
      state.jobs.workflowStatusMessage = "";
      state.jobs.workflowStatusLevel = "info";
      state.timelapseMedia.isLoading = false;
      state.timelapseMedia.actionInFlight = false;
      state.timelapseSettings.loading = false;
      state.timelapseSettings.saving = false;
      state.timelapseSettings.available = false;
      state.timelapseSettings.lastError = "";
      state.timelapseSettings.statusMessage = "Connect to Moonraker to load timelapse settings.";
      state.timelapseSettings.statusLevel = "warn";
      state.spoolman.loading = false;
      state.spoolman.testing = false;
      state.spoolman.actionInFlight = false;
      state.spoolman.activeSpoolId = null;
      state.spoolman.activeSpool = null;
      if (state.spoolman.enabled && getSpoolmanConnectionMode(state.spoolman.serverUrl) === SPOOLMAN_CONNECTION_PROXY) {
        state.spoolman.connectionState = "unknown";
        state.spoolman.statusMessage = "Connect to Moonraker to use Spoolman proxy mode.";
      }
      state.printHistory.isLoading = false;
      state.printHistory.isTotalsLoading = false;
      state.printHistory.actionInFlight = false;
      state.printHistory.actionLabel = "";
      state.printHistory.activeJobId = "";
      state.runoutSensors.loading = false;
      state.runoutSensors.sensorsByKey = Object.fromEntries(
        Object.entries(state.runoutSensors.sensorsByKey || {}).map(([key, value]) => ([
          key,
          value && typeof value === "object" ? { ...value, pending: false } : value,
        ]))
      );
      resetManualProbeState({ render: true });
      renderMachineLoadsCard();
      renderUpdateManagerCard();
      renderEndstopsCard();
      renderMachineLogFilesCard();
      renderJobsCard();
      renderTimelapseMediaCard();
      renderTimelapseSettingsCard();
      renderSpoolmanView();
      renderSpoolmanSettingsCard();
      renderRunoutSensorsCard();
      renderPrintHistoryCard();
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
      state.jobs.workflowStatusMessage = "";
      state.jobs.workflowStatusLevel = "info";
      state.timelapseMedia.isLoading = false;
      state.timelapseMedia.actionInFlight = false;
      state.timelapseSettings.loading = false;
      state.timelapseSettings.saving = false;
      state.timelapseSettings.available = false;
      state.timelapseSettings.lastError = "";
      state.timelapseSettings.statusMessage = "Moonraker websocket error. Timelapse settings are unavailable.";
      state.timelapseSettings.statusLevel = "error";
      state.spoolman.loading = false;
      state.spoolman.testing = false;
      state.spoolman.actionInFlight = false;
      state.spoolman.activeSpoolId = null;
      state.spoolman.activeSpool = null;
      if (state.spoolman.enabled && getSpoolmanConnectionMode(state.spoolman.serverUrl) === SPOOLMAN_CONNECTION_PROXY) {
        state.spoolman.connectionState = "error";
        state.spoolman.statusMessage = "Moonraker websocket error. Spoolman proxy mode is unavailable.";
      }
      state.printHistory.isLoading = false;
      state.printHistory.isTotalsLoading = false;
      state.printHistory.actionInFlight = false;
      state.printHistory.actionLabel = "";
      state.printHistory.activeJobId = "";
      state.runoutSensors.loading = false;
      state.runoutSensors.sensorsByKey = Object.fromEntries(
        Object.entries(state.runoutSensors.sensorsByKey || {}).map(([key, value]) => ([
          key,
          value && typeof value === "object" ? { ...value, pending: false } : value,
        ]))
      );
      resetManualProbeState({ render: true });
      renderMachineLoadsCard();
      renderUpdateManagerCard();
      renderEndstopsCard();
      renderMachineLogFilesCard();
      renderJobsCard();
      renderTimelapseMediaCard();
      renderTimelapseSettingsCard();
      renderSpoolmanView();
      renderSpoolmanSettingsCard();
      renderRunoutSensorsCard();
      renderPrintHistoryCard();
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

      updateStatusFileInfo(
        printStats,
        status?.gcode_move || null,
        status?.motion_report || null,
        status?.toolhead || null
      );
      mergeManualProbeStatusSnapshot(status?.manual_probe || null);
      const runoutUpdated = mergeRunoutSensorStatusSnapshot(status);
      if (runoutUpdated) {
        renderRunoutSensorsCard();
      }

      updateTemperatureSnapshotFromStatus(status);
      updateStatusFanSnapshot(status?.fan || null);

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
        fan: state.printStatus.lastFanSpeed ?? null,
      });
      return;
    }

    if (payload.method === "notify_history_changed") {
      schedulePrintHistoryRefresh(280);
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
  await refreshRunoutSensors({ source: "initial-connect", silent: true });

  try {
    const statusResponse = await queryDashboardStatusSnapshot();
    const statusSnapshot = statusResponse?.result?.status || {};
    const printStats = statusSnapshot.print_stats || {};
    const gcodeMove = statusSnapshot.gcode_move || null;
    const motionReport = statusSnapshot.motion_report || null;
    const toolhead = statusSnapshot.toolhead || null;
    const virtualSd = mergeVirtualSdSnapshot(statusSnapshot.virtual_sdcard || null);
    renderStatusProgress(virtualSd);
    const printerState = printStats.state || printStats.status || "ready";
    setPrinterState(printerState);
    updateStatusFileInfo(printStats, gcodeMove, motionReport, toolhead);
    mergeManualProbeStatusSnapshot(statusSnapshot.manual_probe || null);
    updateStatusFanSnapshot(statusSnapshot.fan || null);
    mergeRunoutSensorStatusSnapshot(statusSnapshot);
    renderRunoutSensorsCard();
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
    state.controls.configSettings = settings && typeof settings === "object" ? settings : {};
    updateControlsToolsFromConfig(settings);

    let macros = mergeMacroKeys(
      Object.keys(settings).filter((key) => String(key || "").toLowerCase().startsWith("gcode_macro "))
    );

    try {
      const printerConfigText = await state.client.getConfigFileText("printer.cfg");
      const printerConfigMacros = extractMacroKeysFromConfigText(printerConfigText);
      macros = mergeMacroKeys(macros, printerConfigMacros);
    } catch (fallbackError) {
      log.debug("printer.cfg macro parse fallback failed.", {
        error: fallbackError?.message || String(fallbackError),
      });
    }

    if (!macros.length) {
      try {
        const objectsResponse = await state.client.call("/printer/objects/list");
        const objects = Array.isArray(objectsResponse?.result?.objects)
          ? objectsResponse.result.objects
          : [];

        macros = mergeMacroKeys(
          objects.filter((entry) => String(entry || "").toLowerCase().startsWith("gcode_macro "))
        );
      } catch (fallbackError) {
        log.debug("Macro object list fallback failed.", {
          error: fallbackError?.message || String(fallbackError),
        });
      }
    }

    if (!macros.length) {
      try {
        const helpResponse = await state.client.call("/printer/gcode/help");
        const helperEntries = normalizeConsoleHelperEntries(helpResponse);
        const helperMacroNames = helperEntries
          .map((entry) => String(entry.command || "").trim())
          .filter((command) => command.includes("_"))
          .filter((command) => !/^[GMT]\d+$/i.test(command));

        macros = mergeMacroKeys(helperMacroNames.map((name) => `gcode_macro ${name}`));
      } catch (fallbackError) {
        log.debug("Macro gcode help fallback failed.", {
          error: fallbackError?.message || String(fallbackError),
        });
      }
    }

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

  try {
    const historyJobs = await loadPrintHistory({ source: "connect", silent: true });
    log.info("Print history loaded.", { count: historyJobs.length });
  } catch (error) {
    const message = error?.message || String(error);
    appendConsole(`Print history load failed: ${message}`, "error");
    log.error("Print history load failed.", { error: message });
  }

  await loadConfigFiles({ preserveSelection: true });
}

function persistMacroSettings() {
  const normalized = normalizeStoredMacroSettingsPayload({
    stored: state.macros.stored,
    categories: state.macros.categories,
  });

  state.macros.stored = normalized.stored;
  state.macros.categories = normalized.categories;
  localStorage.setItem(MACRO_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
}

function createMacroCategoryId() {
  return `macro-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMacroName(value) {
  return String(value || "").trim();
}

function normalizeMacroStorageName(value) {
  return normalizeMacroName(value).toLowerCase();
}

function getMacroNameFromKey(macroKey) {
  return String(macroKey || "").replace(/^gcode_macro\s+/i, "").trim();
}

function getMacroConfigForName(name) {
  const normalized = normalizeMacroStorageName(name);
  if (!normalized) return null;

  const settings = state.controls?.configSettings;
  if (!settings || typeof settings !== "object") return null;
  return settings[`gcode_macro ${normalized}`] || null;
}

function getMacroStoredEntry(name) {
  const normalized = normalizeMacroStorageName(name);
  if (!normalized) return null;

  const stored = Array.isArray(state.macros?.stored) ? state.macros.stored : [];
  return stored.find((entry) => entry.name === normalized) || null;
}

function getMacroDescription(configEntry) {
  const description = String(configEntry?.description || "").trim();
  if (!description || /^g-?code macro$/i.test(description)) return "";
  return description;
}

function buildMacroRuntimeEntry(macroKey, sourceIndex = 0) {
  const name = getMacroNameFromKey(macroKey);
  if (!name || name.startsWith("_")) return null;

  const nameLower = normalizeMacroStorageName(name);
  const stored = getMacroStoredEntry(name);
  const config = getMacroConfigForName(name);

  let categoryId = normalizeMacroCategoryId(stored?.categoryId);
  if (categoryId !== MACRO_DEFAULT_CATEGORY_ID) {
    const exists = state.macros.categories.some((category) => category.id === categoryId);
    if (!exists) {
      categoryId = MACRO_DEFAULT_CATEGORY_ID;
    }
  }

  const orderRaw = Number(stored?.order);
  return {
    key: `gcode_macro ${name}`,
    name,
    nameLower,
    alias: String(stored?.alias || "").trim(),
    description: getMacroDescription(config),
    visible: stored?.visible !== false,
    disabledWhilePrinting: !!stored?.disabledWhilePrinting,
    categoryId,
    color: normalizeMacroColor(stored?.color),
    order: Number.isFinite(orderRaw) && orderRaw >= 0 ? Math.round(orderRaw) : sourceIndex,
  };
}

function compareMacroEntries(a, b) {
  const orderA = Number.isFinite(Number(a?.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER;
  const orderB = Number.isFinite(Number(b?.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER;

  if (orderA !== orderB) return orderA - orderB;
  return String(a?.name || "").toLowerCase().localeCompare(String(b?.name || "").toLowerCase());
}

function getAllMacroRuntimeEntries() {
  const macroKeys = mergeMacroKeys(Array.isArray(state.macros?.keys) ? state.macros.keys : []);
  return macroKeys
    .map((macroKey, index) => buildMacroRuntimeEntry(macroKey, index))
    .filter(Boolean);
}

function getMacrosForCategory(categoryId, { searchQuery = "" } = {}) {
  const normalizedCategoryId = normalizeMacroCategoryId(categoryId);
  const normalizedSearch = String(searchQuery || "").trim().toLowerCase();

  return getAllMacroRuntimeEntries()
    .filter((macro) => normalizeMacroCategoryId(macro.categoryId) === normalizedCategoryId)
    .filter((macro) => {
      if (!normalizedSearch) return true;

      const haystack = [macro.name, macro.alias, macro.description]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      return haystack.includes(normalizedSearch);
    })
    .sort(compareMacroEntries);
}

function getMacroCategoryName(categoryId) {
  const normalizedCategoryId = normalizeMacroCategoryId(categoryId);
  if (normalizedCategoryId === MACRO_DEFAULT_CATEGORY_ID) {
    return "Uncategorized";
  }

  const category = state.macros.categories.find((entry) => entry.id === normalizedCategoryId);
  return category?.name || "Uncategorized";
}

function ensureSelectedMacroCategory() {
  const selectedId = normalizeMacroCategoryId(state.macros.selectedCategoryId);
  if (selectedId === MACRO_DEFAULT_CATEGORY_ID) {
    state.macros.selectedCategoryId = selectedId;
    return;
  }

  const exists = state.macros.categories.some((category) => category.id === selectedId);
  state.macros.selectedCategoryId = exists ? selectedId : MACRO_DEFAULT_CATEGORY_ID;
}

function getMacroGroupsForDashboard() {
  const groups = [];

  state.macros.categories.forEach((category) => {
    const macros = getMacrosForCategory(category.id).filter((macro) => macro.visible);
    if (!macros.length) return;

    groups.push({
      id: category.id,
      name: category.name,
      macros,
    });
  });

  const uncategorized = getMacrosForCategory(MACRO_DEFAULT_CATEGORY_ID).filter((macro) => macro.visible);
  if (uncategorized.length) {
    groups.push({
      id: MACRO_DEFAULT_CATEGORY_ID,
      name: groups.length ? "Uncategorized" : "",
      macros: uncategorized,
    });
  }

  return groups;
}

function applyMacroStoredPatch(collection, macroName, patch = {}) {
  const normalizedName = normalizeMacroStorageName(macroName);
  if (!normalizedName) return;

  const index = collection.findIndex((entry) => entry.name === normalizedName);
  const current = index >= 0 ? collection[index] : { name: normalizedName };
  const next = sanitizeMacroStoredEntry({
    ...current,
    ...patch,
    name: normalizedName,
  });

  if (!next) return;

  if (index >= 0) {
    collection.splice(index, 1, next);
  } else {
    collection.push(next);
  }
}

function updateMacroStoredEntries(mutator) {
  const working = [...(Array.isArray(state.macros.stored) ? state.macros.stored : [])];
  mutator(working);
  state.macros.stored = working;
  persistMacroSettings();
}

function moveMacroCategory(categoryId, direction) {
  const index = state.macros.categories.findIndex((category) => category.id === categoryId);
  if (index < 0) return;

  const targetIndex = index + Number(direction);
  if (targetIndex < 0 || targetIndex >= state.macros.categories.length) return;

  const next = [...state.macros.categories];
  const [moved] = next.splice(index, 1);
  next.splice(targetIndex, 0, moved);
  state.macros.categories = next;
  persistMacroSettings();
  renderMacros(state.macros.keys);
}

function addMacroCategory() {
  const input = window.prompt("Category name");
  const name = String(input || "").trim().slice(0, 40);
  if (!name) return;

  const duplicate = state.macros.categories.some((category) => category.name.toLowerCase() === name.toLowerCase());
  if (duplicate) {
    appendConsole(`Macro category already exists: ${name}`, "warn");
    return;
  }

  state.macros.categories.push({
    id: createMacroCategoryId(),
    name,
  });
  state.macros.selectedCategoryId = state.macros.categories[state.macros.categories.length - 1].id;
  persistMacroSettings();
  renderMacros(state.macros.keys);
}

function editMacroCategory(categoryId) {
  const category = state.macros.categories.find((entry) => entry.id === categoryId);
  if (!category) return;

  const input = window.prompt("Edit category name", category.name);
  const nextName = String(input || "").trim().slice(0, 40);
  if (!nextName) return;

  const duplicate = state.macros.categories.some(
    (entry) => entry.id !== category.id && entry.name.toLowerCase() === nextName.toLowerCase()
  );
  if (duplicate) {
    appendConsole(`Macro category already exists: ${nextName}`, "warn");
    return;
  }

  category.name = nextName;
  persistMacroSettings();
  renderMacros(state.macros.keys);
}

function removeMacroCategory(categoryId) {
  const category = state.macros.categories.find((entry) => entry.id === categoryId);
  if (!category) return;

  const confirmed = window.confirm(`Delete macro category "${category.name}"? Macros move to Uncategorized.`);
  if (!confirmed) return;

  state.macros.categories = state.macros.categories.filter((entry) => entry.id !== categoryId);

  updateMacroStoredEntries((collection) => {
    collection.forEach((entry) => {
      if (normalizeMacroCategoryId(entry.categoryId) === categoryId) {
        entry.categoryId = MACRO_DEFAULT_CATEGORY_ID;
      }
    });
  });

  ensureSelectedMacroCategory();
  renderMacros(state.macros.keys);
}

function moveMacroInSelectedCategory(macroName, direction) {
  const categoryId = normalizeMacroCategoryId(state.macros.selectedCategoryId);
  const macros = getMacrosForCategory(categoryId);
  const index = macros.findIndex((macro) => macro.nameLower === normalizeMacroStorageName(macroName));
  if (index < 0) return;

  const targetIndex = index + Number(direction);
  if (targetIndex < 0 || targetIndex >= macros.length) return;

  const nextOrder = [...macros];
  const [moved] = nextOrder.splice(index, 1);
  nextOrder.splice(targetIndex, 0, moved);

  updateMacroStoredEntries((collection) => {
    nextOrder.forEach((macro, orderIndex) => {
      applyMacroStoredPatch(collection, macro.nameLower, {
        categoryId,
        order: orderIndex,
      });
    });
  });

  renderMacros(state.macros.keys);
}

function setMacroVisibility(macroName, visible) {
  updateMacroStoredEntries((collection) => {
    applyMacroStoredPatch(collection, macroName, {
      visible: !!visible,
    });
  });

  renderMacros(state.macros.keys);
}

function setSelectedMacrosVisibility(visible) {
  const macros = getMacrosForCategory(state.macros.selectedCategoryId, {
    searchQuery: state.macros.searchQuery,
  });

  if (!macros.length) return;

  updateMacroStoredEntries((collection) => {
    macros.forEach((macro) => {
      applyMacroStoredPatch(collection, macro.nameLower, {
        visible: !!visible,
      });
    });
  });

  renderMacros(state.macros.keys);
}

function getMacroDialogDefaultColor() {
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  return normalizeMacroColor(accent) || "#ff8a3d";
}

function closeMacroSettingsDialog() {
  if (els.settingsMacroDialog?.open) {
    els.settingsMacroDialog.close();
  }
  state.macros.dialogMacroName = "";
}

function populateMacroDialogCategories(selectedCategoryId) {
  if (!els.settingsMacroCategory) return;

  els.settingsMacroCategory.innerHTML = "";

  const uncategorizedOption = document.createElement("option");
  uncategorizedOption.value = MACRO_DEFAULT_CATEGORY_ID;
  uncategorizedOption.textContent = "Uncategorized";
  els.settingsMacroCategory.appendChild(uncategorizedOption);

  state.macros.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    els.settingsMacroCategory.appendChild(option);
  });

  els.settingsMacroCategory.value = normalizeMacroCategoryId(selectedCategoryId);
}

function openMacroSettingsDialog(macroName) {
  const macro = getAllMacroRuntimeEntries().find((entry) => entry.nameLower === normalizeMacroStorageName(macroName));
  if (!macro || !els.settingsMacroDialog) return;

  state.macros.dialogMacroName = macro.nameLower;

  if (els.settingsMacroDialogTitle) {
    els.settingsMacroDialogTitle.textContent = macro.name.toUpperCase();
  }

  if (els.settingsMacroAlias) {
    els.settingsMacroAlias.value = macro.alias || "";
  }

  populateMacroDialogCategories(macro.categoryId);

  const defaultColor = getMacroDialogDefaultColor();
  state.macros.dialogColorDefault = defaultColor;

  if (els.settingsMacroColor) {
    els.settingsMacroColor.dataset.mode = macro.color ? "custom" : "default";
    els.settingsMacroColor.value = macro.color || defaultColor;
  }

  if (els.settingsMacroDisabledWhilePrinting) {
    els.settingsMacroDisabledWhilePrinting.checked = !!macro.disabledWhilePrinting;
  }

  if (els.settingsMacroVisible) {
    els.settingsMacroVisible.checked = !!macro.visible;
  }

  if (typeof els.settingsMacroDialog.showModal === "function") {
    if (!els.settingsMacroDialog.open) {
      els.settingsMacroDialog.showModal();
    }
  } else {
    els.settingsMacroDialog.setAttribute("open", "open");
  }
}

function saveMacroSettingsDialog() {
  const macroName = normalizeMacroStorageName(state.macros.dialogMacroName);
  if (!macroName) {
    closeMacroSettingsDialog();
    return;
  }

  const categoryValue = normalizeMacroCategoryId(els.settingsMacroCategory?.value);
  const categoryExists = categoryValue === MACRO_DEFAULT_CATEGORY_ID
    || state.macros.categories.some((category) => category.id === categoryValue);

  const colorMode = els.settingsMacroColor?.dataset?.mode === "custom" ? "custom" : "default";
  const colorValue = colorMode === "custom" ? normalizeMacroColor(els.settingsMacroColor?.value) : "";

  updateMacroStoredEntries((collection) => {
    applyMacroStoredPatch(collection, macroName, {
      alias: String(els.settingsMacroAlias?.value || "").trim().slice(0, 64),
      categoryId: categoryExists ? categoryValue : MACRO_DEFAULT_CATEGORY_ID,
      color: colorValue,
      disabledWhilePrinting: !!els.settingsMacroDisabledWhilePrinting?.checked,
      visible: !!els.settingsMacroVisible?.checked,
    });
  });

  closeMacroSettingsDialog();
  renderMacros(state.macros.keys);
}

function renderMacroSettingsCategoryList() {
  const list = els.settingsMacrosCategoryList;
  if (!list) return;

  ensureSelectedMacroCategory();
  list.replaceChildren();

  const runtime = getAllMacroRuntimeEntries();

  const categorySummaries = state.macros.categories.map((category) => {
    const categoryMacros = runtime
      .filter((macro) => normalizeMacroCategoryId(macro.categoryId) === category.id)
      .sort(compareMacroEntries);

    return {
      ...category,
      count: categoryMacros.length,
      visible: categoryMacros.filter((macro) => macro.visible).length,
    };
  });

  const uncategorizedMacros = runtime
    .filter((macro) => normalizeMacroCategoryId(macro.categoryId) === MACRO_DEFAULT_CATEGORY_ID)
    .sort(compareMacroEntries);

  const buildRow = (summary, { editable = false, index = -1 } = {}) => {
    const row = document.createElement("div");
    row.className = "settings-macros-category-item";

    const select = document.createElement("button");
    select.type = "button";
    select.className = "settings-macros-category-select";

    if (state.macros.selectedCategoryId === summary.id) {
      select.classList.add("is-active");
    }

    const name = document.createElement("span");
    name.textContent = summary.name;

    const chip = document.createElement("span");
    chip.className = "settings-macros-category-chip";
    chip.textContent = `${summary.visible} / ${summary.count}`;

    select.append(name, chip);
    select.addEventListener("click", () => {
      state.macros.selectedCategoryId = summary.id;
      renderMacroSettings();
    });

    row.appendChild(select);

    if (editable) {
      const actions = document.createElement("div");
      actions.className = "settings-macros-category-actions";

      const up = document.createElement("button");
      up.type = "button";
      up.textContent = "Up";
      up.disabled = index <= 0;
      up.addEventListener("click", () => moveMacroCategory(summary.id, -1));

      const down = document.createElement("button");
      down.type = "button";
      down.textContent = "Down";
      down.disabled = index >= categorySummaries.length - 1;
      down.addEventListener("click", () => moveMacroCategory(summary.id, 1));

      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Edit";
      edit.addEventListener("click", () => editMacroCategory(summary.id));

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "danger";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => removeMacroCategory(summary.id));

      actions.append(up, down, edit, remove);
      row.appendChild(actions);
    }

    return row;
  };

  categorySummaries.forEach((summary, index) => {
    list.appendChild(buildRow(summary, { editable: true, index }));
  });

  list.appendChild(buildRow({
    id: MACRO_DEFAULT_CATEGORY_ID,
    name: "Uncategorized",
    count: uncategorizedMacros.length,
    visible: uncategorizedMacros.filter((macro) => macro.visible).length,
  }));
}

function renderMacroSettingsMacroList() {
  const list = els.settingsMacrosItemList;
  if (!list) return;

  ensureSelectedMacroCategory();

  if (els.settingsMacrosSearch && els.settingsMacrosSearch.value !== state.macros.searchQuery) {
    els.settingsMacrosSearch.value = state.macros.searchQuery;
  }

  if (els.settingsMacrosSelectedCategory) {
    const label = getMacroCategoryName(state.macros.selectedCategoryId);
    els.settingsMacrosSelectedCategory.textContent = `${label} Macros`;
  }

  list.replaceChildren();

  const normalizedSearch = String(state.macros.searchQuery || "").trim();
  const macros = getMacrosForCategory(state.macros.selectedCategoryId, {
    searchQuery: normalizedSearch,
  });

  if (!macros.length) {
    const empty = document.createElement("p");
    empty.className = "muted settings-macros-empty";
    empty.textContent = normalizedSearch
      ? "No macros match this filter."
      : "No macros in this category.";
    list.appendChild(empty);
    return;
  }

  const reorderDisabled = normalizedSearch.length > 0;

  macros.forEach((macro, index) => {
    const row = document.createElement("div");
    row.className = "settings-macros-item";
    if (!macro.visible) {
      row.classList.add("is-hidden");
    }
    if (macro.color) {
      row.style.setProperty("--macro-color", macro.color);
    }

    const metaButton = document.createElement("button");
    metaButton.type = "button";
    metaButton.className = "settings-macros-item-meta";

    const title = document.createElement("strong");
    title.textContent = macro.name.toUpperCase();

    const subtitle = document.createElement("span");
    const details = [];
    if (macro.alias) details.push(`Alias: ${macro.alias}`);
    if (macro.description) details.push(macro.description);
    subtitle.textContent = details.length ? details.join(" | ") : "No description";

    metaButton.append(title, subtitle);
    metaButton.addEventListener("click", () => {
      openMacroSettingsDialog(macro.nameLower);
    });

    const controls = document.createElement("div");
    controls.className = "settings-macros-item-controls";

    const visibleLabel = document.createElement("label");
    visibleLabel.className = "settings-macros-visible";

    const visibleInput = document.createElement("input");
    visibleInput.type = "checkbox";
    visibleInput.checked = !!macro.visible;
    visibleInput.addEventListener("change", () => {
      setMacroVisibility(macro.nameLower, visibleInput.checked);
    });

    const visibleText = document.createElement("span");
    visibleText.textContent = "Visible";

    visibleLabel.append(visibleInput, visibleText);

    const settingsButton = document.createElement("button");
    settingsButton.type = "button";
    settingsButton.textContent = "Settings";
    settingsButton.addEventListener("click", () => {
      openMacroSettingsDialog(macro.nameLower);
    });

    const up = document.createElement("button");
    up.type = "button";
    up.textContent = "Up";
    up.disabled = reorderDisabled || index === 0;
    up.title = reorderDisabled ? "Clear search to reorder macros." : "";
    up.addEventListener("click", () => moveMacroInSelectedCategory(macro.nameLower, -1));

    const down = document.createElement("button");
    down.type = "button";
    down.textContent = "Down";
    down.disabled = reorderDisabled || index === macros.length - 1;
    down.title = reorderDisabled ? "Clear search to reorder macros." : "";
    down.addEventListener("click", () => moveMacroInSelectedCategory(macro.nameLower, 1));

    controls.append(visibleLabel, settingsButton, up, down);
    row.append(metaButton, controls);
    list.appendChild(row);
  });
}

function renderMacroSettings() {
  renderMacroSettingsCategoryList();
  renderMacroSettingsMacroList();
}

function refreshMacroActionButtonState() {
  const isPrinting = isPrintActiveForSystemActions();
  const byName = new Map(getAllMacroRuntimeEntries().map((entry) => [entry.nameLower, entry]));

  document.querySelectorAll(".macro-action-btn[data-macro-name]").forEach((button) => {
    const macroName = normalizeMacroStorageName(button.getAttribute("data-macro-name"));
    const macro = byName.get(macroName);
    if (!macro) {
      button.disabled = false;
      return;
    }

    button.disabled = !!(macro.disabledWhilePrinting && isPrinting);
  });
}

function renderMacroButtons(container, macroGroups) {
  if (!container) return;

  const groups = Array.isArray(macroGroups) ? macroGroups : [];
  container.innerHTML = "";

  if (!groups.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No macros found.";
    container.appendChild(empty);
    return;
  }

  const showGroupTitle = groups.length > 1 || groups.some((group) => String(group?.name || "").trim());

  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "macro-group";

    if (showGroupTitle) {
      const heading = document.createElement("h4");
      heading.className = "macro-group-title";
      heading.textContent = String(group.name || "Uncategorized").trim() || "Uncategorized";
      section.appendChild(heading);
    }

    const list = document.createElement("div");
    list.className = "macro-group-list";

    group.macros.forEach((macro) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "macro-action-btn";
      button.textContent = macro.alias || macro.name;
      button.dataset.macroName = macro.nameLower;
      button.title = macro.description
        ? `${macro.name} | ${macro.description}`
        : macro.name;

      if (macro.color) {
        button.style.setProperty("--macro-accent", macro.color);
        button.style.setProperty("--macro-contrast", getMacroColorContrastText(macro.color));
        button.classList.add("macro-action-btn-colored");
      }

      button.addEventListener("click", async () => {
        await executeGcodeAction(macro.name, {
          actionLabel: `Macro ${macro.name}`,
        });
      });

      list.appendChild(button);
    });

    section.appendChild(list);
    container.appendChild(section);
  });

  refreshMacroActionButtonState();
}

function renderMacros(macroKeys) {
  state.macros.keys = mergeMacroKeys(Array.isArray(macroKeys) ? macroKeys : []);
  ensureSelectedMacroCategory();

  const groups = getMacroGroupsForDashboard();
  renderMacroButtons(els.macroList, groups);
  renderMacroButtons(els.dashboardMacroList, groups);
  renderMacroSettings();
  refreshMacroActionButtonState();
  renderControlsPanel();
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

function normalizeTimelapseMediaPath(path) {
  return String(path || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^timelapse\//i, "")
    .replace(/\/+$/, "");
}

function normalizeTimelapseMediaDirectory(path) {
  return normalizeTimelapseMediaPath(path);
}

function getTimelapseMediaDirectory(path) {
  const normalized = normalizeTimelapseMediaPath(path);
  if (!normalized) return "";

  const parts = normalized.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
}

function getTimelapseMediaDisplayName(path) {
  const normalized = normalizeTimelapseMediaPath(path);
  if (!normalized) return "";

  const parts = normalized.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : normalized;
}

function formatTimelapseMediaRootPath(path) {
  const normalized = normalizeTimelapseMediaDirectory(path);
  return normalized ? `timelapse/${normalized}` : "timelapse/";
}
function setPrettyGcodeStatus(message, level = "info") {
  if (!els.prettyGcodeStatus) return;
  els.prettyGcodeStatus.textContent = String(message || "").trim();
  els.prettyGcodeStatus.dataset.level = level;
}

function isPrettySimulationMode() {
  return state.prettyGcode.sourceMode === "simulation";
}

function clampPrettyGcodeProgress(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

function estimatePrettyGcodeSimulationDurationMs(segmentCount, extrusionCount) {
  const segments = Math.max(0, Number(segmentCount) || 0);
  const extrusions = Math.max(0, Number(extrusionCount) || 0);
  const estimate = (segments * PRETTY_GCODE_SIM_BASE_SEGMENT_MS) + (extrusions * 30);
  return Math.max(PRETTY_GCODE_SIM_MIN_DURATION_MS, Math.min(PRETTY_GCODE_SIM_MAX_DURATION_MS, estimate));
}

function stopPrettyGcodeSimulationTicker() {
  if (!prettyGcodeSimulationTimer) return;
  clearInterval(prettyGcodeSimulationTimer);
  prettyGcodeSimulationTimer = null;
}

function pausePrettyGcodeSimulation({ render = true } = {}) {
  state.prettyGcode.simulationPlaying = false;
  state.prettyGcode.simulationLastTickMs = null;
  stopPrettyGcodeSimulationTicker();
  if (render && isPrettyGcodeViewerVisible()) {
    renderPrettyGcodeView();
  }
}

function getPrettySimulationToolhead(progress = state.prettyGcode.simulationProgress) {
  const segments = Array.isArray(state.prettyGcode.segments) ? state.prettyGcode.segments : [];
  if (!segments.length) {
    return { x: null, y: null, z: null };
  }

  const clamped = clampPrettyGcodeProgress(progress);
  const extrudingSegmentIndices = Array.isArray(state.prettyGcode.extrudingSegmentIndices)
    ? state.prettyGcode.extrudingSegmentIndices
    : [];

  if (extrudingSegmentIndices.length) {
    if (clamped <= 0) {
      const firstSegment = segments[extrudingSegmentIndices[0]] || segments[0];
      return {
        x: Number.isFinite(firstSegment?.x1) ? firstSegment.x1 : null,
        y: Number.isFinite(firstSegment?.y1) ? firstSegment.y1 : null,
        z: Number.isFinite(firstSegment?.z) ? firstSegment.z : null,
      };
    }

    const sampleIndex = Math.max(
      0,
      Math.min(extrudingSegmentIndices.length - 1, Math.round(clamped * (extrudingSegmentIndices.length - 1)))
    );
    const segment = segments[extrudingSegmentIndices[sampleIndex]];
    if (segment) {
      return {
        x: Number.isFinite(segment.x2) ? segment.x2 : null,
        y: Number.isFinite(segment.y2) ? segment.y2 : null,
        z: Number.isFinite(segment.z) ? segment.z : null,
      };
    }
  }

  const fallbackIndex = Math.max(0, Math.min(segments.length - 1, Math.round(clamped * (segments.length - 1))));
  const fallbackSegment = segments[fallbackIndex];
  return {
    x: Number.isFinite(fallbackSegment?.x2) ? fallbackSegment.x2 : null,
    y: Number.isFinite(fallbackSegment?.y2) ? fallbackSegment.y2 : null,
    z: Number.isFinite(fallbackSegment?.z) ? fallbackSegment.z : null,
  };
}

function startPrettyGcodeSimulation() {
  if (!isPrettySimulationMode()) {
    setPrettyGcodeStatus("Load a file with Simulation mode before pressing Play.", "warn");
    return false;
  }

  if (!state.prettyGcode.segments.length) {
    setPrettyGcodeStatus("No path loaded. Load a file first.", "warn");
    return false;
  }

  if (state.prettyGcode.simulationProgress >= 1) {
    state.prettyGcode.simulationProgress = 0;
  }

  stopPrettyGcodeSimulationTicker();
  state.prettyGcode.simulationPlaying = true;
  state.prettyGcode.simulationLastTickMs = Date.now();
  updatePrettyGcodeToolhead({ skipRender: true });

  prettyGcodeSimulationTimer = setInterval(() => {
    if (!isPrettySimulationMode() || !state.prettyGcode.simulationPlaying) {
      pausePrettyGcodeSimulation({ render: false });
      return;
    }

    const nowMs = Date.now();
    const lastMs = Number(state.prettyGcode.simulationLastTickMs) || nowMs;
    const deltaMs = Math.max(0, nowMs - lastMs);
    state.prettyGcode.simulationLastTickMs = nowMs;

    const durationMs = Math.max(1, Number(state.prettyGcode.simulationDurationMs) || PRETTY_GCODE_SIM_MIN_DURATION_MS);
    const speed = Math.max(0.1, Number(state.prettyGcode.simulationSpeed) || 1);
    const deltaProgress = (deltaMs * speed) / durationMs;

    state.prettyGcode.simulationProgress = clampPrettyGcodeProgress(state.prettyGcode.simulationProgress + deltaProgress);
    updatePrettyGcodeToolhead({ skipRender: true });

    if (state.prettyGcode.simulationProgress >= 1) {
      pausePrettyGcodeSimulation({ render: false });
    }

    if (isPrettyGcodeViewerVisible()) {
      renderPrettyGcodeView();
    }
  }, PRETTY_GCODE_SIM_TICK_MS);

  if (isPrettyGcodeViewerVisible()) {
    renderPrettyGcodeView();
  }

  return true;
}

function togglePrettyGcodeSimulationPlayback() {
  if (!isPrettySimulationMode()) {
    setPrettyGcodeStatus("Load a file and enter Simulation mode to use playback controls.", "warn");
    return false;
  }

  if (state.prettyGcode.simulationPlaying) {
    pausePrettyGcodeSimulation();
    return true;
  }

  return startPrettyGcodeSimulation();
}

function stepPrettyGcodeSimulation(deltaProgress) {
  if (!isPrettySimulationMode()) {
    setPrettyGcodeStatus("Load a file and enter Simulation mode to use rewind or fast forward.", "warn");
    return false;
  }

  if (!state.prettyGcode.segments.length) {
    setPrettyGcodeStatus("No path loaded. Load a file first.", "warn");
    return false;
  }

  pausePrettyGcodeSimulation({ render: false });
  state.prettyGcode.simulationProgress = clampPrettyGcodeProgress(
    state.prettyGcode.simulationProgress + (Number(deltaProgress) || 0)
  );
  updatePrettyGcodeToolhead({ skipRender: true });

  if (isPrettyGcodeViewerVisible()) {
    renderPrettyGcodeView();
  }

  return true;
}

function setPrettyGcodeProgressInputValue(progress) {
  if (!els.prettyGcodeProgress) return;
  els.prettyGcodeProgress.value = String(Math.round(clampPrettyGcodeProgress(progress) * 1000));
}

function buildPrettyGcodeLayerData(segments, extrudingSegmentIndices) {
  const sourceSegments = Array.isArray(segments) ? segments : [];
  if (!sourceSegments.length) {
    return {
      layerZValues: [],
      segmentLayerIndices: [],
      segmentExtrusionOrderInLayer: [],
      layerExtrusionCounts: [],
      layerExtrusionEndCounts: [],
      totalLayers: 0,
    };
  }

  const layerZValues = [];
  const candidateIndices = Array.isArray(extrudingSegmentIndices) && extrudingSegmentIndices.length
    ? extrudingSegmentIndices
    : sourceSegments.map((_, index) => index);

  for (const rawIndex of candidateIndices) {
    const index = Number(rawIndex);
    if (!Number.isInteger(index) || index < 0 || index >= sourceSegments.length) continue;

    const segment = sourceSegments[index];
    const z = Number(segment?.z);
    if (!Number.isFinite(z)) continue;

    let matchedIndex = -1;
    for (let i = 0; i < layerZValues.length; i += 1) {
      if (Math.abs(layerZValues[i] - z) <= PRETTY_GCODE_LAYER_Z_TOLERANCE) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex >= 0) {
      continue;
    }

    layerZValues.push(z);
  }

  if (!layerZValues.length) {
    return {
      layerZValues: [],
      segmentLayerIndices: [],
      segmentExtrusionOrderInLayer: [],
      layerExtrusionCounts: [],
      layerExtrusionEndCounts: [],
      totalLayers: 0,
    };
  }

  layerZValues.sort((a, b) => a - b);

  const findClosestLayerIndex = (z) => {
    if (!Number.isFinite(z)) return 0;

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < layerZValues.length; i += 1) {
      const distance = Math.abs(layerZValues[i] - z);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    return closestIndex;
  };

  const segmentLayerIndices = new Array(sourceSegments.length).fill(0);
  const segmentExtrusionOrderInLayer = new Array(sourceSegments.length).fill(0);
  const layerExtrusionCounts = new Array(layerZValues.length).fill(0);

  sourceSegments.forEach((segment, index) => {
    const layerIndex = findClosestLayerIndex(Number(segment?.z));
    segmentLayerIndices[index] = layerIndex;

    if (segment?.extruding) {
      layerExtrusionCounts[layerIndex] += 1;
      segmentExtrusionOrderInLayer[index] = layerExtrusionCounts[layerIndex];
    }
  });

  const layerExtrusionEndCounts = [];
  let runningExtrusions = 0;

  layerExtrusionCounts.forEach((count) => {
    runningExtrusions += Number(count) || 0;
    layerExtrusionEndCounts.push(runningExtrusions);
  });

  return {
    layerZValues,
    segmentLayerIndices,
    segmentExtrusionOrderInLayer,
    layerExtrusionCounts,
    layerExtrusionEndCounts,
    totalLayers: layerZValues.length,
  };
}

function clampPrettyGcodeLayerIndex(layerIndex) {
  const totalLayers = Number(state.prettyGcode.totalLayers) || 0;
  if (totalLayers <= 0) return 0;

  const numeric = Number(layerIndex);
  const rounded = Number.isFinite(numeric) ? Math.round(numeric) : 0;
  return Math.max(0, Math.min(totalLayers - 1, rounded));
}

function getPrettyGcodeAutoLayerIndex(progress = getPrettyGcodeProgress()) {
  const totalLayers = Number(state.prettyGcode.totalLayers) || 0;
  if (totalLayers <= 0) return 0;
  if (totalLayers === 1) return 0;

  const clampedProgress = clampPrettyGcodeProgress(progress);
  const layerExtrusionEndCounts = Array.isArray(state.prettyGcode.layerExtrusionEndCounts)
    ? state.prettyGcode.layerExtrusionEndCounts
    : [];
  const extrusionTotal = Math.max(0, Number(state.prettyGcode.extrusionCount) || 0);

  if (extrusionTotal > 0 && layerExtrusionEndCounts.length === totalLayers) {
    const printedExtrusions = Math.round(clampedProgress * extrusionTotal);
    for (let i = 0; i < layerExtrusionEndCounts.length; i += 1) {
      if (printedExtrusions <= layerExtrusionEndCounts[i]) {
        return i;
      }
    }
    return totalLayers - 1;
  }

  const layerZValues = Array.isArray(state.prettyGcode.layerZValues) ? state.prettyGcode.layerZValues : [];
  const toolheadZ = Number(state.prettyGcode.toolhead?.z);

  if (layerZValues.length === totalLayers && Number.isFinite(toolheadZ)) {
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < layerZValues.length; i += 1) {
      const distance = Math.abs(layerZValues[i] - toolheadZ);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  return clampPrettyGcodeLayerIndex(Math.round(clampedProgress * (totalLayers - 1)));
}

function refreshPrettyGcodeLayerSelection(progress = getPrettyGcodeProgress()) {
  const totalLayers = Number(state.prettyGcode.totalLayers) || 0;
  if (totalLayers <= 0) {
    state.prettyGcode.selectedLayerIndex = 0;
    state.prettyGcode.layerSelectionPinned = false;
    return 0;
  }

  if (state.prettyGcode.layerSelectionPinned) {
    state.prettyGcode.selectedLayerIndex = clampPrettyGcodeLayerIndex(state.prettyGcode.selectedLayerIndex);
    return state.prettyGcode.selectedLayerIndex;
  }

  const autoLayerIndex = getPrettyGcodeAutoLayerIndex(progress);
  state.prettyGcode.selectedLayerIndex = autoLayerIndex;
  return autoLayerIndex;
}

function setPrettyGcodeLayerSelection(layerIndex, { pin = true, render = true } = {}) {
  const totalLayers = Number(state.prettyGcode.totalLayers) || 0;
  if (totalLayers <= 0) {
    state.prettyGcode.selectedLayerIndex = 0;
    state.prettyGcode.layerSelectionPinned = false;
    return;
  }

  state.prettyGcode.selectedLayerIndex = clampPrettyGcodeLayerIndex(layerIndex);
  state.prettyGcode.layerSelectionPinned = !!pin;

  if (render && isPrettyGcodeViewerVisible()) {
    renderPrettyGcodeView();
  }
}

function renderPrettyGcodeLayerSlider(progress = getPrettyGcodeProgress()) {
  const totalLayers = Number(state.prettyGcode.totalLayers) || 0;
  const hasLayers = totalLayers > 0;
  const activeLayerIndex = hasLayers ? refreshPrettyGcodeLayerSelection(progress) : 0;
  const activeLayerNumber = hasLayers ? activeLayerIndex + 1 : 1;

  if (els.prettyGcodeLayerSlider) {
    els.prettyGcodeLayerSlider.min = "1";
    els.prettyGcodeLayerSlider.max = String(Math.max(1, totalLayers));
    els.prettyGcodeLayerSlider.step = "1";
    els.prettyGcodeLayerSlider.value = String(activeLayerNumber);
    els.prettyGcodeLayerSlider.disabled = !hasLayers || state.prettyGcode.isLoading;
    els.prettyGcodeLayerSlider.setAttribute("aria-valuenow", String(activeLayerNumber));
    els.prettyGcodeLayerSlider.setAttribute("aria-valuetext", hasLayers
      ? `Layer ${activeLayerNumber} of ${totalLayers}`
      : "No layers loaded");
  }

  if (els.prettyGcodeLayerTop) {
    els.prettyGcodeLayerTop.textContent = hasLayers ? `Layer ${totalLayers}` : "Layer --";
  }

  if (els.prettyGcodeLayerBottom) {
    els.prettyGcodeLayerBottom.textContent = "Layer 1";
  }

  return activeLayerIndex;
}

function setPrettyGcodeFileLabel(path) {
  if (!els.prettyGcodeFile) return;

  const sourceLabel = String(state.prettyGcode.sourceLabel || "").trim();
  if (sourceLabel) {
    els.prettyGcodeFile.textContent = sourceLabel;
    return;
  }

  const normalized = normalizeGcodePath(path);
  if (!normalized) {
    els.prettyGcodeFile.textContent = "No active print file.";
    return;
  }

  els.prettyGcodeFile.textContent = `gcodes/${normalized}`;
}

function getPrettyToolheadFromStatus() {
  const move = state.printStatus.lastGcodeMove || {};
  const position = Array.isArray(move?.gcode_position) ? move.gcode_position : [];

  const x = readFiniteNumber(position?.[0] ?? move?.position?.[0] ?? move?.gcode_x ?? move?.x);
  const y = readFiniteNumber(position?.[1] ?? move?.position?.[1] ?? move?.gcode_y ?? move?.y);
  const z = readFiniteNumber(position?.[2] ?? move?.position?.[2] ?? move?.gcode_z ?? move?.z);

  return {
    x: Number.isFinite(x) ? x : null,
    y: Number.isFinite(y) ? y : null,
    z: Number.isFinite(z) ? z : null,
  };
}

function getPrettyGcodeProgress() {
  if (isPrettySimulationMode()) {
    return clampPrettyGcodeProgress(state.prettyGcode.simulationProgress);
  }

  const activeFile = normalizeGcodePath(state.prettyGcode.activeFile);
  const currentFile = normalizeGcodePath(state.printStatus.lastPrintStats?.filename || state.printStatus.filename);
  if (!activeFile || !currentFile || activeFile !== currentFile) return 0;

  const progress = Number(state.printStatus.lastVirtualSd?.progress);
  if (!Number.isFinite(progress)) return 0;
  return Math.max(0, Math.min(1, progress));
}

function detectPrettyGcodeFeatureType(commentText) {
  const normalized = String(commentText || "").toLowerCase().trim();
  if (!normalized) return null;

  for (const matcher of PRETTY_GCODE_FEATURE_COMMENT_MATCHERS) {
    if (normalized.includes(matcher.term)) {
      return matcher.featureType;
    }
  }

  return null;
}

function parsePrettyGcodeText(text) {
  const lines = String(text || "").replace(/\r/g, "").split("\n");

  let x = 0;
  let y = 0;
  let z = 0;
  let e = 0;
  let absoluteXYZ = true;
  let absoluteE = true;
  let currentFeatureType = PRETTY_GCODE_FEATURE_TYPE_DEFAULT;

  const segments = [];
  const extrudingSegmentIndices = [];
  let extrusionCount = 0;

  let minX = null;
  let maxX = null;
  let minY = null;
  let maxY = null;

  const includePoint = (px, py) => {
    if (!Number.isFinite(px) || !Number.isFinite(py)) return;
    minX = minX === null ? px : Math.min(minX, px);
    maxX = maxX === null ? px : Math.max(maxX, px);
    minY = minY === null ? py : Math.min(minY, py);
    maxY = maxY === null ? py : Math.max(maxY, py);
  };

  for (const rawLine of lines) {
    if (segments.length >= PRETTY_GCODE_MAX_SEGMENTS) {
      break;
    }

    let line = String(rawLine || "");
    const semicolon = line.indexOf(";");
    if (semicolon >= 0) {
      const comment = line.slice(semicolon + 1);
      const featureType = detectPrettyGcodeFeatureType(comment);
      if (featureType) {
        currentFeatureType = featureType;
      }
      line = line.slice(0, semicolon);
    }

    line = line.trim();
    if (!line) continue;

    const tokens = line.split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;

    const command = tokens[0].toUpperCase();
    const params = {};

    for (let i = 1; i < tokens.length; i += 1) {
      const token = tokens[i];
      if (!token || token.length < 2) continue;
      const key = token[0].toUpperCase();
      const value = Number(token.slice(1));
      if (Number.isFinite(value)) {
        params[key] = value;
      }
    }

    if (command === "G90") {
      absoluteXYZ = true;
      continue;
    }

    if (command === "G91") {
      absoluteXYZ = false;
      continue;
    }

    if (command === "M82") {
      absoluteE = true;
      continue;
    }

    if (command === "M83") {
      absoluteE = false;
      continue;
    }

    if (command === "G92") {
      if (Object.prototype.hasOwnProperty.call(params, "X")) x = params.X;
      if (Object.prototype.hasOwnProperty.call(params, "Y")) y = params.Y;
      if (Object.prototype.hasOwnProperty.call(params, "Z")) z = params.Z;
      if (Object.prototype.hasOwnProperty.call(params, "E")) e = params.E;
      continue;
    }

    if (!["G0", "G1", "G2", "G3"].includes(command)) {
      continue;
    }

    const nextX = Object.prototype.hasOwnProperty.call(params, "X")
      ? (absoluteXYZ ? params.X : x + params.X)
      : x;
    const nextY = Object.prototype.hasOwnProperty.call(params, "Y")
      ? (absoluteXYZ ? params.Y : y + params.Y)
      : y;
    const nextZ = Object.prototype.hasOwnProperty.call(params, "Z")
      ? (absoluteXYZ ? params.Z : z + params.Z)
      : z;
    const nextE = Object.prototype.hasOwnProperty.call(params, "E")
      ? (absoluteE ? params.E : e + params.E)
      : e;

    const hasMotion = nextX !== x || nextY !== y;

    if (hasMotion) {
      const extruding = nextE > e + 0.00001;
      const featureType = extruding ? currentFeatureType : PRETTY_GCODE_FEATURE_TYPE_TRAVEL;

      segments.push({
        x1: x,
        y1: y,
        x2: nextX,
        y2: nextY,
        z: nextZ,
        extruding,
        featureType,
      });

      includePoint(x, y);
      includePoint(nextX, nextY);

      if (extruding) {
        extrusionCount += 1;
        extrudingSegmentIndices.push(segments.length - 1);
      }
    }

    x = nextX;
    y = nextY;
    z = nextZ;
    e = nextE;
  }

  const bounds = minX === null || minY === null || maxX === null || maxY === null
    ? null
    : {
        minX,
        minY,
        maxX,
        maxY,
      };

  return {
    segments,
    extrudingSegmentIndices,
    extrusionCount,
    bounds,
  };
}

function ensurePrettyGcodeCanvasSize() {
  if (!els.prettyGcodeCanvas) return { width: 0, height: 0, dpr: 1 };

  const rect = els.prettyGcodeCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const targetWidth = Math.max(1, Math.round(rect.width * dpr));
  const targetHeight = Math.max(1, Math.round(rect.height * dpr));

  return {
    width: Math.max(1, rect.width),
    height: Math.max(1, rect.height),
    dpr,
    targetWidth,
    targetHeight,
  };
}

function parsePrettyCssColor(styleValue, fallback = "#94a3b8") {
  const raw = String(styleValue || "").trim();
  const rgbaMatch = raw.match(/^rgba?\(([^)]+)\)$/i);

  if (rgbaMatch) {
    const parts = rgbaMatch[1].split(",").map((part) => part.trim());
    const r = Number(parts[0]);
    const g = Number(parts[1]);
    const b = Number(parts[2]);
    const a = parts.length > 3 ? Number(parts[3]) : 1;

    if ([r, g, b].every((value) => Number.isFinite(value))) {
      return {
        color: new THREE.Color(`rgb(${r}, ${g}, ${b})`),
        opacity: Number.isFinite(a) ? Math.max(0, Math.min(1, a)) : 1,
      };
    }
  }

  try {
    return {
      color: new THREE.Color(raw || fallback),
      opacity: 1,
    };
  } catch {
    return {
      color: new THREE.Color(fallback),
      opacity: 1,
    };
  }
}

function createPrettyLineMaterial(styleValue, opacityScale = 1) {
  const parsed = parsePrettyCssColor(styleValue);
  const opacity = Math.max(0, Math.min(1, parsed.opacity * opacityScale));

  return new THREE.LineBasicMaterial({
    color: parsed.color,
    transparent: opacity < 0.999,
    opacity,
  });
}

function requestPrettyGcodeThreeRender() {
  prettyGcodeThreeState.renderRequested = true;
}

function invalidatePrettyGcodeThreeGeometry() {
  prettyGcodeThreeState.geometryDirty = true;
  requestPrettyGcodeThreeRender();
}

function disposePrettyGcodeObjectTree(root) {
  if (!root) return;

  root.traverse((node) => {
    if (node?.geometry?.dispose) {
      node.geometry.dispose();
    }

    if (!node?.material) return;
    if (Array.isArray(node.material)) {
      node.material.forEach((material) => material?.dispose?.());
      return;
    }

    node.material.dispose?.();
  });

  root.clear();
}

function ensurePrettyGcodeThreeScene() {
  if (!els.prettyGcodeCanvas) return false;
  if (prettyGcodeThreeState.scene && prettyGcodeThreeState.renderer && prettyGcodeThreeState.camera) {
    return true;
  }

  const renderer = new THREE.WebGLRenderer({
    canvas: els.prettyGcodeCanvas,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: false,
  });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#050b14");

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 5000);
  camera.position.set(180, 160, 180);

  const controls = new OrbitControls(camera, els.prettyGcodeCanvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = true;
  controls.target.set(110, 0, 110);
  controls.update();

  controls.addEventListener("change", () => {
    prettyGcodeThreeState.lastInteractionMs = Date.now();
    requestPrettyGcodeThreeRender();
  });

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.62);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.68);
  keyLight.position.set(80, 220, 120);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x9cc5ff, 0.28);
  fillLight.position.set(-120, 130, -100);
  scene.add(fillLight);

  const printGroup = new THREE.Group();
  printGroup.name = "pretty-print-group";
  scene.add(printGroup);

  const mirrorGroup = new THREE.Group();
  mirrorGroup.name = "pretty-mirror-group";
  mirrorGroup.scale.set(1, -1, 1);
  scene.add(mirrorGroup);

  const grid = new THREE.GridHelper(220, 22, 0x334155, 0x1f2937);
  scene.add(grid);

  const bedPlaneGeometry = new THREE.PlaneGeometry(220, 220, 1, 1);
  bedPlaneGeometry.rotateX(-Math.PI / 2);
  const bedPlane = new THREE.Mesh(
    bedPlaneGeometry,
    new THREE.MeshBasicMaterial({
      color: new THREE.Color("#0b1727"),
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  bedPlane.position.y = -0.05;
  scene.add(bedPlane);

  const nozzleHeight = 14;
  const nozzleRadius = 4;
  const nozzleGeometry = new THREE.ConeGeometry(nozzleRadius, nozzleHeight, 22);
  const nozzleMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#f59e0b"),
    metalness: 0.42,
    roughness: 0.38,
    emissive: new THREE.Color("#7c2d12"),
    emissiveIntensity: 0.2,
  });
  const nozzleMesh = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
  nozzleMesh.rotation.x = Math.PI;
  nozzleMesh.visible = false;
  scene.add(nozzleMesh);

  prettyGcodeThreeState.renderer = renderer;
  prettyGcodeThreeState.scene = scene;
  prettyGcodeThreeState.camera = camera;
  prettyGcodeThreeState.controls = controls;
  prettyGcodeThreeState.printGroup = printGroup;
  prettyGcodeThreeState.mirrorGroup = mirrorGroup;
  prettyGcodeThreeState.bedGrid = grid;
  prettyGcodeThreeState.bedPlane = bedPlane;
  prettyGcodeThreeState.nozzleMesh = nozzleMesh;
  prettyGcodeThreeState.lastInteractionMs = Date.now();
  prettyGcodeThreeState.geometryDirty = true;
  prettyGcodeThreeState.renderRequested = true;

  const size = ensurePrettyGcodeCanvasSize();
  renderer.setPixelRatio(size.dpr);
  renderer.setSize(size.width, size.height, false);

  if (!prettyGcodeThreeState.animationFrame) {
    const tick = () => {
      prettyGcodeThreeState.animationFrame = window.requestAnimationFrame(tick);

      const isViewerVisible = isPrettyGcodeViewerVisible();
      if (!isViewerVisible || !prettyGcodeThreeState.renderer || !prettyGcodeThreeState.scene || !prettyGcodeThreeState.camera) {
        return;
      }

      let rotated = false;
      const nowMs = Date.now();
      const controlsInstance = prettyGcodeThreeState.controls;

      if (
        controlsInstance
        && state.prettyGcode.orbitWhenIdle
        && nowMs - prettyGcodeThreeState.lastInteractionMs > PRETTY_GCODE_3D_ORBIT_IDLE_SECONDS * 1000
      ) {
        controlsInstance.rotateLeft(0.0036);
        rotated = true;
      }

      const controlsChanged = !!controlsInstance?.update?.();
      if (rotated || controlsChanged) {
        requestPrettyGcodeThreeRender();
      }

      if (prettyGcodeThreeState.renderRequested) {
        prettyGcodeThreeState.renderer.render(prettyGcodeThreeState.scene, prettyGcodeThreeState.camera);
        prettyGcodeThreeState.renderRequested = false;
      }
    };

    tick();
  }

  return true;
}

function applyPrettyGcodeThreeBedLayout(bounds) {
  if (!prettyGcodeThreeState.scene || !bounds) return;

  const spanX = Math.max(60, Math.abs(bounds.maxX - bounds.minX) + 28);
  const spanZ = Math.max(60, Math.abs(bounds.maxY - bounds.minY) + 28);
  const centerX = (bounds.minX + bounds.maxX) * 0.5;
  const centerZ = (bounds.minY + bounds.maxY) * 0.5;

  prettyGcodeThreeState.bedCenter = { x: centerX, y: 0, z: centerZ };
  prettyGcodeThreeState.bedSize = {
    x: spanX,
    z: spanZ,
    y: Math.max(120, spanX, spanZ),
  };

  if (prettyGcodeThreeState.bedGrid) {
    prettyGcodeThreeState.scene.remove(prettyGcodeThreeState.bedGrid);
    prettyGcodeThreeState.bedGrid.geometry?.dispose?.();
    prettyGcodeThreeState.bedGrid.material?.dispose?.();
  }

  const divisions = Math.max(8, Math.min(70, Math.round(Math.max(spanX, spanZ) / 10)));
  const gridSize = Math.max(spanX, spanZ);
  const grid = new THREE.GridHelper(gridSize, divisions, 0x334155, 0x1f2937);
  grid.position.set(centerX, 0, centerZ);
  prettyGcodeThreeState.scene.add(grid);
  prettyGcodeThreeState.bedGrid = grid;

  if (prettyGcodeThreeState.bedPlane) {
    const plane = prettyGcodeThreeState.bedPlane;
    plane.scale.set(spanX / 220, 1, spanZ / 220);
    plane.position.set(centerX, -0.05, centerZ);
  }

  const camera = prettyGcodeThreeState.camera;
  const controls = prettyGcodeThreeState.controls;
  if (camera && controls) {
    const radius = Math.max(spanX, spanZ) * 0.9;
    controls.target.set(centerX, 0, centerZ);
    camera.position.set(centerX + radius, Math.max(80, radius * 0.75), centerZ + radius * 0.9);
    controls.update();
  }
}

function createPrettyLineObjectPair(positions, styleCurrent, styleHistory, styleFuture) {
  if (!Array.isArray(positions) || !positions.length) {
    return null;
  }

  const buildGeometry = () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  };

  const segmentCount = Math.floor(positions.length / 6);

  const current = new THREE.LineSegments(buildGeometry(), createPrettyLineMaterial(styleCurrent));
  const history = new THREE.LineSegments(buildGeometry(), createPrettyLineMaterial(styleHistory));
  const future = styleFuture
    ? new THREE.LineSegments(buildGeometry(), createPrettyLineMaterial(styleFuture))
    : null;

  const currentMirror = current.clone();
  currentMirror.material = createPrettyLineMaterial(styleCurrent, PRETTY_GCODE_3D_MIRROR_OPACITY_SCALE);

  const historyMirror = history.clone();
  historyMirror.material = createPrettyLineMaterial(styleHistory, PRETTY_GCODE_3D_MIRROR_OPACITY_SCALE);

  const futureMirror = future
    ? future.clone()
    : null;

  if (futureMirror) {
    futureMirror.material = createPrettyLineMaterial(styleFuture, PRETTY_GCODE_3D_MIRROR_OPACITY_SCALE);
  }

  return {
    segmentCount,
    current,
    history,
    future,
    currentMirror,
    historyMirror,
    futureMirror,
  };
}

function rebuildPrettyGcodeThreeGeometry() {
  const sceneReady = ensurePrettyGcodeThreeScene();
  if (!sceneReady) return;

  const pretty = state.prettyGcode;
  const segments = Array.isArray(pretty.segments) ? pretty.segments : [];
  const bounds = pretty.bounds;

  if (!prettyGcodeThreeState.printGroup || !prettyGcodeThreeState.mirrorGroup) return;

  disposePrettyGcodeObjectTree(prettyGcodeThreeState.printGroup);
  disposePrettyGcodeObjectTree(prettyGcodeThreeState.mirrorGroup);
  prettyGcodeThreeState.layerEntries = [];

  if (!segments.length || !bounds) {
    prettyGcodeThreeState.geometryDirty = false;
    requestPrettyGcodeThreeRender();
    return;
  }

  applyPrettyGcodeThreeBedLayout(bounds);

  const totalLayers = Math.max(1, Number(pretty.totalLayers) || 0);
  const segmentLayerIndices = Array.isArray(pretty.segmentLayerIndices) ? pretty.segmentLayerIndices : [];
  const segmentExtrusionOrderInLayer = Array.isArray(pretty.segmentExtrusionOrderInLayer)
    ? pretty.segmentExtrusionOrderInLayer
    : [];
  const hasLayerData = Number(pretty.totalLayers) > 0
    && segmentLayerIndices.length === segments.length
    && segmentExtrusionOrderInLayer.length === segments.length;

  const layers = Array.from({ length: totalLayers }, (_, layerIndex) => {
    const features = new Map();
    PRETTY_GCODE_FEATURE_TYPE_ORDER.forEach((featureType) => {
      features.set(featureType, {
        positions: [],
        orders: [],
      });
    });

    return {
      layerIndex,
      travelPositions: [],
      features,
      travelPair: null,
      featurePairs: new Map(),
    };
  });

  const toThree = (segment, useEnd = false) => {
    const x = useEnd ? segment.x2 : segment.x1;
    const y = Number(segment.z) || 0;
    const z = useEnd ? segment.y2 : segment.y1;
    return { x, y, z };
  };

  segments.forEach((segment, index) => {
    const layerIndexRaw = hasLayerData ? Number(segmentLayerIndices[index]) || 0 : 0;
    const layerIndex = Math.max(0, Math.min(layers.length - 1, layerIndexRaw));
    const layerBucket = layers[layerIndex];

    const p1 = toThree(segment, false);
    const p2 = toThree(segment, true);

    if (!segment.extruding) {
      layerBucket.travelPositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      return;
    }

    const featureType = PRETTY_GCODE_FEATURE_TYPE_ORDER.includes(segment.featureType)
      ? segment.featureType
      : PRETTY_GCODE_FEATURE_TYPE_DEFAULT;
    const featureBucket = layerBucket.features.get(featureType) || layerBucket.features.get(PRETTY_GCODE_FEATURE_TYPE_DEFAULT);

    featureBucket.positions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);

    const orderInLayer = hasLayerData
      ? (Number(segmentExtrusionOrderInLayer[index]) || featureBucket.orders.length + 1)
      : featureBucket.orders.length + 1;
    featureBucket.orders.push(orderInLayer);
  });

  layers.forEach((layerEntry) => {
    const travelPair = createPrettyLineObjectPair(
      layerEntry.travelPositions,
      PRETTY_GCODE_TRAVEL_RENDER_STYLE.current,
      PRETTY_GCODE_TRAVEL_RENDER_STYLE.history,
      null
    );

    if (travelPair) {
      layerEntry.travelPair = travelPair;
      prettyGcodeThreeState.printGroup.add(travelPair.current, travelPair.history);
      prettyGcodeThreeState.mirrorGroup.add(travelPair.currentMirror, travelPair.historyMirror);
    }

    PRETTY_GCODE_FEATURE_TYPE_ORDER.forEach((featureType) => {
      const bucket = layerEntry.features.get(featureType);
      if (!bucket || !bucket.positions.length) return;

      const style = PRETTY_GCODE_FEATURE_RENDER_STYLES[featureType] || PRETTY_GCODE_FEATURE_RENDER_STYLES[PRETTY_GCODE_FEATURE_TYPE_DEFAULT];
      const pair = createPrettyLineObjectPair(bucket.positions, style.current, style.history, PRETTY_GCODE_FUTURE_RENDER_STYLE);
      if (!pair) return;

      pair.orders = bucket.orders;
      layerEntry.featurePairs.set(featureType, pair);

      prettyGcodeThreeState.printGroup.add(pair.current, pair.history, pair.future);
      prettyGcodeThreeState.mirrorGroup.add(pair.currentMirror, pair.historyMirror, pair.futureMirror);
    });

    prettyGcodeThreeState.layerEntries.push(layerEntry);
  });

  prettyGcodeThreeState.geometryDirty = false;
  requestPrettyGcodeThreeRender();
}

function setLineDrawRange(lineObject, startSegment, segmentCount) {
  if (!lineObject?.geometry?.setDrawRange) return;
  const safeStart = Math.max(0, Number(startSegment) || 0);
  const safeCount = Math.max(0, Number(segmentCount) || 0);
  lineObject.geometry.setDrawRange(safeStart * 2, safeCount * 2);
}

function applyPrettyGcodeThreeVisibility(progress) {
  const pretty = state.prettyGcode;
  const totalLayers = Number(pretty.totalLayers) || 0;
  const activeLayerIndex = refreshPrettyGcodeLayerSelection(progress);
  const printedExtrusions = Math.round(progress * Math.max(1, Number(pretty.extrusionCount) || 0));
  const layerExtrusionEndCounts = Array.isArray(pretty.layerExtrusionEndCounts)
    ? pretty.layerExtrusionEndCounts
    : [];
  const manualLayerView = !!pretty.layerSelectionPinned;
  const mirrorEnabled = !!pretty.showMirror;

  const previousLayerPrintedCount = activeLayerIndex > 0
    ? Number(layerExtrusionEndCounts[activeLayerIndex - 1]) || 0
    : 0;
  const printedInActiveLayer = manualLayerView
    ? Number.POSITIVE_INFINITY
    : Math.max(0, printedExtrusions - previousLayerPrintedCount);

  prettyGcodeThreeState.layerEntries.forEach((layerEntry) => {
    const layerIndex = layerEntry.layerIndex;
    const isPast = layerIndex < activeLayerIndex;
    const isActive = layerIndex === activeLayerIndex;

    const travel = layerEntry.travelPair;
    if (travel) {
      travel.history.visible = isPast;
      travel.historyMirror.visible = isPast && mirrorEnabled;
      travel.current.visible = isActive;
      travel.currentMirror.visible = isActive && mirrorEnabled;
      setLineDrawRange(travel.history, 0, travel.segmentCount);
      setLineDrawRange(travel.current, 0, travel.segmentCount);
    }

    layerEntry.featurePairs.forEach((pair) => {
      if (isPast) {
        pair.history.visible = true;
        pair.historyMirror.visible = mirrorEnabled;
        pair.current.visible = false;
        pair.currentMirror.visible = false;
        pair.future.visible = false;
        pair.futureMirror.visible = false;
        setLineDrawRange(pair.history, 0, pair.segmentCount);
        return;
      }

      if (!isActive) {
        pair.history.visible = false;
        pair.historyMirror.visible = false;
        pair.current.visible = false;
        pair.currentMirror.visible = false;
        pair.future.visible = false;
        pair.futureMirror.visible = false;
        return;
      }

      pair.history.visible = false;
      pair.historyMirror.visible = false;

      if (manualLayerView) {
        pair.current.visible = true;
        pair.currentMirror.visible = mirrorEnabled;
        pair.future.visible = false;
        pair.futureMirror.visible = false;
        setLineDrawRange(pair.current, 0, pair.segmentCount);
        return;
      }

      let printedForFeature = 0;
      for (let i = 0; i < pair.orders.length; i += 1) {
        if ((Number(pair.orders[i]) || 0) <= printedInActiveLayer) {
          printedForFeature += 1;
        }
      }

      const futureCount = Math.max(0, pair.segmentCount - printedForFeature);

      pair.current.visible = printedForFeature > 0;
      pair.currentMirror.visible = printedForFeature > 0 && mirrorEnabled;
      pair.future.visible = futureCount > 0;
      pair.futureMirror.visible = futureCount > 0 && mirrorEnabled;

      setLineDrawRange(pair.current, 0, printedForFeature);
      setLineDrawRange(pair.future, printedForFeature, futureCount);
    });
  });

  if (prettyGcodeThreeState.mirrorGroup) {
    prettyGcodeThreeState.mirrorGroup.visible = mirrorEnabled;
  }
}

function updatePrettyGcodeNozzleMesh() {
  const nozzle = prettyGcodeThreeState.nozzleMesh;
  if (!nozzle) return;

  const toolhead = state.prettyGcode.toolhead || { x: null, y: null, z: null };
  const showNozzle = !!state.prettyGcode.showNozzle;

  if (!showNozzle || !Number.isFinite(toolhead.x) || !Number.isFinite(toolhead.y)) {
    nozzle.visible = false;
    return;
  }

  const bedSpan = Math.max(40, prettyGcodeThreeState.bedSize.x, prettyGcodeThreeState.bedSize.z);
  const nozzleHeight = Math.max(8, Math.min(20, bedSpan * 0.055));

  nozzle.scale.set(nozzleHeight / 14, nozzleHeight / 14, nozzleHeight / 14);
  nozzle.position.set(
    Number(toolhead.x),
    Number(toolhead.z) + nozzleHeight * 0.45,
    Number(toolhead.y)
  );
  nozzle.visible = true;
}

function renderPrettyGcodeCanvas() {
  if (!els.prettyGcodeCanvas) return;

  if (!ensurePrettyGcodeThreeScene()) {
    return;
  }

  const canvasInfo = ensurePrettyGcodeCanvasSize();
  if (prettyGcodeThreeState.renderer && prettyGcodeThreeState.camera) {
    prettyGcodeThreeState.renderer.setPixelRatio(canvasInfo.dpr);
    prettyGcodeThreeState.renderer.setSize(canvasInfo.width, canvasInfo.height, false);
    prettyGcodeThreeState.camera.aspect = Math.max(0.1, canvasInfo.width / Math.max(1, canvasInfo.height));
    prettyGcodeThreeState.camera.updateProjectionMatrix();
  }

  if (prettyGcodeThreeState.geometryDirty) {
    rebuildPrettyGcodeThreeGeometry();
  }

  const progress = getPrettyGcodeProgress();
  applyPrettyGcodeThreeVisibility(progress);
  updatePrettyGcodeNozzleMesh();
  requestPrettyGcodeThreeRender();
}

function renderPrettyGcodeView() {
  if (els.prettyGcodeFollow) {
    els.prettyGcodeFollow.checked = !!state.prettyGcode.followToolhead;
  }

  if (els.prettyGcodeShowMirror) {
    els.prettyGcodeShowMirror.checked = !!state.prettyGcode.showMirror;
  }

  if (els.prettyGcodeShowNozzle) {
    els.prettyGcodeShowNozzle.checked = !!state.prettyGcode.showNozzle;
  }

  if (els.prettyGcodeOrbitIdle) {
    els.prettyGcodeOrbitIdle.checked = !!state.prettyGcode.orbitWhenIdle;
  }

  const simulationMode = isPrettySimulationMode();
  const hasSegments = Array.isArray(state.prettyGcode.segments) && state.prettyGcode.segments.length > 0;

  setPrettyGcodeFileLabel(state.prettyGcode.activeFile);
  updatePrettyGcodeToolhead({ skipRender: true });

  const progress = getPrettyGcodeProgress();
  setPrettyGcodeProgressInputValue(progress);

  const activeLayerIndex = renderPrettyGcodeLayerSlider(progress);
  const totalLayers = Number(state.prettyGcode.totalLayers) || 0;
  const layerSummary = totalLayers > 0
    ? ` | Layer: ${activeLayerIndex + 1}/${totalLayers}${state.prettyGcode.layerSelectionPinned ? " (manual)" : ""}`
    : "";

  if (els.prettyGcodeMode) {
    els.prettyGcodeMode.textContent = simulationMode ? "Mode: Simulation" : "Mode: Live";
  }

  if (els.prettyGcodePlayPause) {
    els.prettyGcodePlayPause.textContent = state.prettyGcode.simulationPlaying ? "Pause" : "Play";
    els.prettyGcodePlayPause.disabled = !simulationMode || !hasSegments || state.prettyGcode.isLoading;
  }

  if (els.prettyGcodeRewind) {
    els.prettyGcodeRewind.disabled = !simulationMode || !hasSegments || state.prettyGcode.isLoading;
  }

  if (els.prettyGcodeFastForward) {
    els.prettyGcodeFastForward.disabled = !simulationMode || !hasSegments || state.prettyGcode.isLoading;
  }

  if (els.prettyGcodeProgress) {
    els.prettyGcodeProgress.disabled = !simulationMode || !hasSegments || state.prettyGcode.isLoading;
  }

  if (els.prettyGcodeLive) {
    els.prettyGcodeLive.disabled = !simulationMode;
  }

  if (els.prettyGcodeLoadFile) {
    els.prettyGcodeLoadFile.disabled = state.prettyGcode.isLoading;
  }

  if (!simulationMode && !state.client) {
    setPrettyGcodeStatus("Connect to Moonraker to use live print tracking.", "warn");
    renderPrettyGcodeCanvas();
    return;
  }

  if (!simulationMode && state.connectionStatus !== "connected") {
    setPrettyGcodeStatus("Moonraker disconnected. Reconnect to stream live path updates.", "warn");
    renderPrettyGcodeCanvas();
    return;
  }

  if (state.prettyGcode.isLoading) {
    setPrettyGcodeStatus(`Loading ${state.prettyGcode.loadingFile || "print file"}...`, "info");
    renderPrettyGcodeCanvas();
    return;
  }

  if (state.prettyGcode.lastError) {
    setPrettyGcodeStatus(`KlipperView failed: ${state.prettyGcode.lastError}`, "error");
    renderPrettyGcodeCanvas();
    return;
  }

  const segments = state.prettyGcode.segments || [];
  const percent = Math.round(progress * 1000) / 10;
  const toolhead = state.prettyGcode.toolhead || { x: null, y: null, z: null };
  const toolheadLabel = Number.isFinite(toolhead.x) && Number.isFinite(toolhead.y)
    ? ` | Toolhead: X${toolhead.x.toFixed(2)} Y${toolhead.y.toFixed(2)}`
    : "";

  if (!segments.length) {
    if (simulationMode) {
      setPrettyGcodeStatus("Load a GCode file and press Play to run simulation.", "info");
    } else {
      setPrettyGcodeStatus("No parsed path yet. Start a print or press Reload.", "info");
    }
  } else if (simulationMode) {
    const playState = state.prettyGcode.simulationPlaying ? "Playing" : "Paused";
    setPrettyGcodeStatus(
      `Simulation ${playState} | Progress: ${percent.toFixed(1)}%${layerSummary}${toolheadLabel}`,
      "info"
    );
  } else {
    setPrettyGcodeStatus(
      `Loaded ${segments.length.toLocaleString()} moves | Progress: ${percent.toFixed(1)}%${layerSummary}${toolheadLabel}`,
      "info"
    );
  }

  renderPrettyGcodeCanvas();
}

function applyPrettyGcodeParsedData(parsed, sourceTextLength) {
  state.prettyGcode.sourceTextLength = Number(sourceTextLength) || 0;
  state.prettyGcode.segments = Array.isArray(parsed?.segments) ? parsed.segments : [];
  state.prettyGcode.extrudingSegmentIndices = Array.isArray(parsed?.extrudingSegmentIndices)
    ? parsed.extrudingSegmentIndices
    : [];
  state.prettyGcode.bounds = parsed?.bounds || null;
  state.prettyGcode.extrusionCount = Number(parsed?.extrusionCount) || 0;

  const layerData = buildPrettyGcodeLayerData(state.prettyGcode.segments, state.prettyGcode.extrudingSegmentIndices);
  state.prettyGcode.layerZValues = layerData.layerZValues;
  state.prettyGcode.segmentLayerIndices = layerData.segmentLayerIndices;
  state.prettyGcode.segmentExtrusionOrderInLayer = layerData.segmentExtrusionOrderInLayer;
  state.prettyGcode.layerExtrusionCounts = layerData.layerExtrusionCounts;
  state.prettyGcode.layerExtrusionEndCounts = layerData.layerExtrusionEndCounts;
  state.prettyGcode.totalLayers = layerData.totalLayers;

  if (state.prettyGcode.layerSelectionPinned) {
    state.prettyGcode.selectedLayerIndex = clampPrettyGcodeLayerIndex(state.prettyGcode.selectedLayerIndex);
  } else {
    state.prettyGcode.selectedLayerIndex = getPrettyGcodeAutoLayerIndex();
  }

  invalidatePrettyGcodeThreeGeometry();
}

function clearPrettyGcodeParsedData() {
  state.prettyGcode.segments = [];
  state.prettyGcode.extrudingSegmentIndices = [];
  state.prettyGcode.bounds = null;
  state.prettyGcode.extrusionCount = 0;
  state.prettyGcode.sourceTextLength = 0;
  state.prettyGcode.layerZValues = [];
  state.prettyGcode.segmentLayerIndices = [];
  state.prettyGcode.segmentExtrusionOrderInLayer = [];
  state.prettyGcode.layerExtrusionCounts = [];
  state.prettyGcode.layerExtrusionEndCounts = [];
  state.prettyGcode.totalLayers = 0;
  state.prettyGcode.selectedLayerIndex = 0;
  state.prettyGcode.layerSelectionPinned = false;

  invalidatePrettyGcodeThreeGeometry();
}

async function loadPrettyGcodeSimulationFile(file) {
  const candidate = file || null;
  if (!candidate) return false;

  const displayName = String(candidate.name || "local-file.gcode").trim() || "local-file.gcode";

  pausePrettyGcodeSimulation({ render: false });

  const requestId = state.prettyGcode.parseRequestId + 1;
  state.prettyGcode.parseRequestId = requestId;
  state.prettyGcode.isLoading = true;
  state.prettyGcode.loadingFile = displayName;
  state.prettyGcode.lastError = "";
  state.prettyGcode.sourceMode = "simulation";
  state.prettyGcode.sourceLabel = `local/${displayName}`;
  state.prettyGcode.activeFile = displayName;
  state.prettyGcode.simulationProgress = 0;
  state.prettyGcode.simulationPlaying = false;
  state.prettyGcode.simulationLastTickMs = null;
  state.prettyGcode.layerSelectionPinned = false;
  state.prettyGcode.selectedLayerIndex = 0;

  renderPrettyGcodeView();

  try {
    const fileText = await candidate.text();
    if (requestId !== state.prettyGcode.parseRequestId) {
      return false;
    }

    const parsed = parsePrettyGcodeText(fileText);
    applyPrettyGcodeParsedData(parsed, String(fileText || "").length);
    state.prettyGcode.simulationDurationMs = estimatePrettyGcodeSimulationDurationMs(
      parsed.segments.length,
      parsed.extrusionCount
    );
    state.prettyGcode.lastLoadedAtMs = Date.now();
    state.prettyGcode.lastError = "";
    updatePrettyGcodeToolhead({ skipRender: true });
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    if (requestId === state.prettyGcode.parseRequestId) {
      state.prettyGcode.lastError = message;
      clearPrettyGcodeParsedData();
      state.prettyGcode.simulationDurationMs = PRETTY_GCODE_SIM_MIN_DURATION_MS;
    }
    return false;
  } finally {
    if (requestId === state.prettyGcode.parseRequestId) {
      state.prettyGcode.isLoading = false;
      state.prettyGcode.loadingFile = "";
      renderPrettyGcodeView();
    }
  }
}

async function requestPrettyGcodeSimulationFromHost(path) {
  const normalized = normalizeGcodePath(path);
  if (!normalized || !state.client || state.connectionStatus !== "connected") {
    setPrettyGcodeStatus("Connect to Moonraker to load host print files.", "warn");
    return false;
  }

  pausePrettyGcodeSimulation({ render: false });

  const requestId = state.prettyGcode.parseRequestId + 1;
  state.prettyGcode.parseRequestId = requestId;
  state.prettyGcode.isLoading = true;
  state.prettyGcode.loadingFile = normalized;
  state.prettyGcode.lastError = "";
  state.prettyGcode.sourceMode = "simulation";
  state.prettyGcode.sourceLabel = `gcodes/${normalized}`;
  state.prettyGcode.activeFile = normalized;
  state.prettyGcode.simulationProgress = 0;
  state.prettyGcode.simulationPlaying = false;
  state.prettyGcode.simulationLastTickMs = null;
  state.prettyGcode.layerSelectionPinned = false;
  state.prettyGcode.selectedLayerIndex = 0;

  if (isPrettyGcodeViewerVisible()) {
    renderPrettyGcodeView();
  }

  try {
    const fileText = await state.client.getFileText("gcodes", normalized);
    if (requestId !== state.prettyGcode.parseRequestId) {
      return false;
    }

    const parsed = parsePrettyGcodeText(fileText);
    applyPrettyGcodeParsedData(parsed, String(fileText || "").length);
    state.prettyGcode.simulationDurationMs = estimatePrettyGcodeSimulationDurationMs(
      parsed.segments.length,
      parsed.extrusionCount
    );
    state.prettyGcode.lastLoadedAtMs = Date.now();
    state.prettyGcode.lastError = "";
    updatePrettyGcodeToolhead({ skipRender: true });
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    if (requestId === state.prettyGcode.parseRequestId) {
      state.prettyGcode.lastError = message;
      clearPrettyGcodeParsedData();
      state.prettyGcode.simulationDurationMs = PRETTY_GCODE_SIM_MIN_DURATION_MS;
    }
    return false;
  } finally {
    if (requestId === state.prettyGcode.parseRequestId) {
      state.prettyGcode.isLoading = false;
      state.prettyGcode.loadingFile = "";
      if (isPrettyGcodeViewerVisible()) {
        renderPrettyGcodeView();
      }
    }
  }
}

async function loadPrettyGcodeFile(path, { force = false } = {}) {
  const normalized = normalizeGcodePath(path);
  if (!normalized || !state.client || state.connectionStatus !== "connected") {
    return false;
  }

  pausePrettyGcodeSimulation({ render: false });
  state.prettyGcode.sourceMode = "live";
  state.prettyGcode.sourceLabel = "";
  state.prettyGcode.simulationProgress = 0;
  state.prettyGcode.simulationPlaying = false;
  state.prettyGcode.simulationLastTickMs = null;

  if (
    !force
    && state.prettyGcode.activeFile === normalized
    && state.prettyGcode.isLoading
    && state.prettyGcode.loadingFile === normalized
  ) {
    return true;
  }

  if (
    !force
    && state.prettyGcode.activeFile === normalized
    && !state.prettyGcode.lastError
    && Number.isFinite(state.prettyGcode.lastLoadedAtMs)
  ) {
    return true;
  }

  const requestId = state.prettyGcode.parseRequestId + 1;
  state.prettyGcode.parseRequestId = requestId;
  state.prettyGcode.isLoading = true;
  state.prettyGcode.loadingFile = normalized;
  state.prettyGcode.lastError = "";
  state.prettyGcode.activeFile = normalized;

  renderPrettyGcodeView();

  try {
    const fileText = await state.client.getFileText("gcodes", normalized);
    if (requestId !== state.prettyGcode.parseRequestId) {
      return false;
    }

    const parsed = parsePrettyGcodeText(fileText);
    applyPrettyGcodeParsedData(parsed, String(fileText || "").length);
    state.prettyGcode.lastLoadedAtMs = Date.now();
    state.prettyGcode.lastError = "";
    state.prettyGcode.simulationDurationMs = estimatePrettyGcodeSimulationDurationMs(
      parsed.segments.length,
      parsed.extrusionCount
    );
    updatePrettyGcodeToolhead({ skipRender: true });
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    if (requestId === state.prettyGcode.parseRequestId) {
      state.prettyGcode.lastError = message;
      clearPrettyGcodeParsedData();
    }
    return false;
  } finally {
    if (requestId === state.prettyGcode.parseRequestId) {
      state.prettyGcode.isLoading = false;
      state.prettyGcode.loadingFile = "";
      renderPrettyGcodeView();
    }
  }
}

async function syncPrettyGcodeForActiveFile(path, { force = false } = {}) {
  const normalized = normalizeGcodePath(path);
  if (!normalized) {
    pausePrettyGcodeSimulation({ render: false });
    state.prettyGcode.activeFile = "";
    state.prettyGcode.sourceLabel = "";
    clearPrettyGcodeParsedData();
    state.prettyGcode.lastLoadedAtMs = null;
    state.prettyGcode.lastError = "";
    state.prettyGcode.simulationProgress = 0;
    state.prettyGcode.simulationDurationMs = PRETTY_GCODE_SIM_MIN_DURATION_MS;
    state.prettyGcode.simulationLastTickMs = null;
    state.prettyGcode.toolhead = { x: null, y: null, z: null };
    if (isPrettyGcodeViewerVisible()) {
      renderPrettyGcodeView();
    }
    return false;
  }

  const loaded = await loadPrettyGcodeFile(normalized, { force });
  if (isPrettyGcodeViewerVisible()) {
    renderPrettyGcodeView();
  }

  return loaded;
}

async function requestPrettyGcodeReload() {
  if (isPrettySimulationMode()) {
    if (!state.prettyGcode.segments.length) {
      setPrettyGcodeStatus("No simulation file loaded to restart.", "warn");
      return false;
    }

    pausePrettyGcodeSimulation({ render: false });
    state.prettyGcode.simulationProgress = 0;
    state.prettyGcode.simulationLastTickMs = null;
    state.prettyGcode.layerSelectionPinned = false;
    state.prettyGcode.selectedLayerIndex = 0;
    updatePrettyGcodeToolhead({ skipRender: true });
    if (isPrettyGcodeViewerVisible()) {
      renderPrettyGcodeView();
    }
    return true;
  }

  const filename = normalizeGcodePath(state.printStatus.lastPrintStats?.filename || state.printStatus.filename || state.prettyGcode.activeFile);
  if (!filename) {
    setPrettyGcodeStatus("No active print file to reload.", "warn");
    return false;
  }

  return syncPrettyGcodeForActiveFile(filename, { force: true });
}

async function requestPrettyGcodeLiveMode() {
  pausePrettyGcodeSimulation({ render: false });
  state.prettyGcode.sourceMode = "live";
  state.prettyGcode.sourceLabel = "";
  state.prettyGcode.simulationProgress = 0;
  state.prettyGcode.simulationLastTickMs = null;
  state.prettyGcode.layerSelectionPinned = false;
  state.prettyGcode.selectedLayerIndex = 0;

  const filename = normalizeGcodePath(state.printStatus.lastPrintStats?.filename || state.printStatus.filename);
  if (!filename || !state.client || state.connectionStatus !== "connected") {
    await syncPrettyGcodeForActiveFile("");
    updatePrettyGcodeToolhead({ skipRender: true });
    if (isPrettyGcodeViewerVisible()) {
      renderPrettyGcodeView();
    }
    return false;
  }

  const loaded = await syncPrettyGcodeForActiveFile(filename, { force: true });
  updatePrettyGcodeToolhead({ skipRender: true });
  if (isPrettyGcodeViewerVisible()) {
    renderPrettyGcodeView();
  }
  return loaded;
}
function updatePrettyGcodeToolhead({ skipRender = false } = {}) {
  if (isPrettySimulationMode()) {
    state.prettyGcode.toolhead = getPrettySimulationToolhead();
  } else {
    state.prettyGcode.toolhead = getPrettyToolheadFromStatus();
  }

  if (!skipRender && isPrettyGcodeViewerVisible()) {
    renderPrettyGcodeView();
  }
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

function ensureJobsDirectoryVisible(directoryPath, { openDirectory = false } = {}) {
  const normalizedDirectory = normalizeJobsDirectory(directoryPath);
  if (!normalizedDirectory) return;

  const directorySet = new Set(state.jobs.directories || []);
  addJobsDirectoryWithParents(directorySet, normalizedDirectory);
  state.jobs.directories = [...directorySet].sort((a, b) => a.localeCompare(b));

  if (openDirectory) {
    state.jobs.currentDirectory = normalizedDirectory;
  }
}

function mergeJobsDirectoriesFromDirectoryResponse(listing, directoryResponse, baseDirectory = "") {
  const files = Array.isArray(listing?.files) ? listing.files : [];
  const directories = new Set(Array.isArray(listing?.directories) ? listing.directories : []);
  const base = normalizeJobsDirectory(baseDirectory);

  const payload = directoryResponse?.result ?? directoryResponse ?? {};
  const rawDirs = Array.isArray(payload?.dirs)
    ? payload.dirs
    : Array.isArray(payload?.directories)
      ? payload.directories
      : [];

  rawDirs.forEach((entry) => {
    let candidatePath = typeof entry === "string"
      ? entry
      : String(entry?.dirname ?? entry?.path ?? entry?.filename ?? "").trim();

    candidatePath = normalizeJobsDirectory(candidatePath);
    if (!candidatePath) return;

    const lowerPath = candidatePath.toLowerCase();
    if (lowerPath === "gcodes") return;

    if (lowerPath.startsWith("gcodes/")) {
      candidatePath = normalizeJobsDirectory(candidatePath.slice("gcodes/".length));
    }

    if (!candidatePath) return;

    let fullPath = "";
    if (base && (candidatePath === base || candidatePath.startsWith(`${base}/`))) {
      fullPath = candidatePath;
    } else {
      fullPath = base ? normalizeJobsDirectory(`${base}/${candidatePath}`) : candidatePath;
    }

    if (!fullPath) return;
    addJobsDirectoryWithParents(directories, fullPath);
  });

  return {
    files,
    directories: [...directories].sort((a, b) => a.localeCompare(b)),
  };
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

async function prefetchJobsMetadata(entries, { concurrency = 4 } = {}) {
  if (!Array.isArray(entries) || !entries.length) return;
  if (!state.client) return;

  const pending = entries
    .map((entry) => normalizeGcodePath(typeof entry === "string" ? entry : entry?.path))
    .filter((path) => !!path && !state.jobs.metadataByPath.has(path) && !state.jobs.metadataLoading.has(path));

  if (!pending.length) return;

  const workerCount = Math.min(Math.max(1, Number(concurrency) || 1), 8, pending.length);
  let cursor = 0;
  const workers = Array.from({ length: workerCount }, async () => {
    while (cursor < pending.length) {
      const nextPath = pending[cursor];
      cursor += 1;
      await ensureJobsMetadata(nextPath);
    }
  });

  await Promise.allSettled(workers);
}

function persistJobsViewState() {
  localStorage.setItem(JOBS_SORT_STORAGE_KEY, normalizeJobsSort(state.jobs.sortMode));
  localStorage.setItem(JOBS_TYPE_FILTER_STORAGE_KEY, normalizeJobsTypeFilter(state.jobs.typeFilter));
  localStorage.setItem(JOBS_SEARCH_STORAGE_KEY, String(state.jobs.searchQuery || "").trim());
  localStorage.setItem(JOBS_DIRECTORY_STORAGE_KEY, normalizeJobsDirectory(state.jobs.currentDirectory));
  localStorage.setItem(JOBS_COLUMNS_STORAGE_KEY, JSON.stringify(normalizeJobsVisibleColumns(state.jobs.visibleColumns)));
}

function persistPrintHistoryViewState() {
  localStorage.setItem(PRINT_HISTORY_SEARCH_STORAGE_KEY, String(state.printHistory.searchQuery || "").trim());
  localStorage.setItem(PRINT_HISTORY_STATUS_STORAGE_KEY, normalizePrintHistoryStatusFilter(state.printHistory.statusFilter));
  localStorage.setItem(PRINT_HISTORY_SORT_STORAGE_KEY, normalizePrintHistorySort(state.printHistory.sortMode));
  localStorage.setItem(PRINT_HISTORY_PAGE_SIZE_STORAGE_KEY, String(normalizePrintHistoryPageSize(state.printHistory.pageSize)));
  localStorage.setItem(PRINT_HISTORY_COLUMNS_STORAGE_KEY, JSON.stringify(normalizePrintHistoryVisibleColumns(state.printHistory.visibleColumns)));
  localStorage.setItem(PRINT_HISTORY_TIME_DAYS_STORAGE_KEY, String(!!state.printHistory.timeInDays));
  localStorage.setItem(PRINT_HISTORY_LENGTH_KM_STORAGE_KEY, String(!!state.printHistory.lengthInKilometers));
  localStorage.setItem(PRINT_HISTORY_LOAD_LIMIT_STORAGE_KEY, String(normalizePrintHistoryLoadLimit(state.printHistory.loadedLimit)));
  localStorage.setItem(PRINT_HISTORY_STATUS_VIEW_STORAGE_KEY, normalizePrintHistoryStatusView(state.printHistory.statusViewMode));
  localStorage.setItem(PRINT_HISTORY_STATUS_VALUE_STORAGE_KEY, normalizePrintHistoryStatusValue(state.printHistory.statusValueMode));
  localStorage.setItem(PRINT_HISTORY_TREND_MODE_STORAGE_KEY, normalizePrintHistoryTrendMode(state.printHistory.trendMode));
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

function renderStatusPrintActions(current, { isConnected, busy } = {}) {
  const activeState = current && typeof current === "object" ? current : getCurrentJobsPrintState();
  const connected = typeof isConnected === "boolean" ? isConnected : state.connectionStatus === "connected";
  const actionsBusy = typeof busy === "boolean" ? busy : state.jobs.actionInFlight;
  const isPrinting = activeState.state === "printing";
  const isPaused = activeState.state === "paused";
  const activePrint = connected && (isPrinting || isPaused);

  if (els.statusPrintActions) {
    els.statusPrintActions.hidden = !activePrint;
  }

  if (els.statusPrintPause) {
    els.statusPrintPause.hidden = !isPrinting;
    els.statusPrintPause.disabled = !activePrint || actionsBusy || !isPrinting;
  }

  if (els.statusPrintResume) {
    els.statusPrintResume.hidden = !isPaused;
    els.statusPrintResume.disabled = !activePrint || actionsBusy || !isPaused;
  }

  if (els.statusPrintCancel) {
    els.statusPrintCancel.hidden = !activePrint;
    els.statusPrintCancel.disabled = !activePrint || actionsBusy;
  }
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

  renderStatusPrintActions(current, { isConnected, busy });
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

function normalizeJobsSelectionType(type) {
  const normalized = String(type || "").trim().toLowerCase();
  return normalized === "directory" || normalized === "file" ? normalized : "";
}

function normalizeJobsSelectionPath(path, type) {
  const normalizedType = normalizeJobsSelectionType(type);
  if (!normalizedType) return "";

  const rawPath = String(path ?? "").trim();
  if (normalizedType === "directory") {
    const normalizedDirectory = normalizeJobsDirectory(rawPath);
    if (normalizedDirectory) return normalizedDirectory;

    const lowered = rawPath.toLowerCase();
    if (!rawPath || rawPath === "/" || lowered === "gcodes" || lowered === "gcodes/") {
      return "/";
    }

    return "";
  }

  return normalizeGcodePath(rawPath);
}

function isJobsEntrySelected(path, type) {
  const normalizedType = normalizeJobsSelectionType(type);
  if (!normalizedType) return false;

  const selectedType = normalizeJobsSelectionType(state.jobs.selectedType);
  if (selectedType !== normalizedType) return false;

  const selectedPath = normalizeJobsSelectionPath(state.jobs.selectedPath, selectedType);
  const candidatePath = normalizeJobsSelectionPath(path, normalizedType);
  return !!selectedPath && !!candidatePath && selectedPath === candidatePath;
}

function setJobsEntrySelection(path, type) {
  const normalizedType = normalizeJobsSelectionType(type);
  const normalizedPath = normalizeJobsSelectionPath(path, normalizedType);

  if (!normalizedType || !normalizedPath) {
    state.jobs.selectedType = "";
    state.jobs.selectedPath = "";
    return;
  }

  state.jobs.selectedType = normalizedType;
  state.jobs.selectedPath = normalizedPath;
}

function applyJobsRowSelection(row, path, type) {
  setJobsEntrySelection(path, type);

  if (!els.fileList) return;

  els.fileList.querySelectorAll(".jobs-entry.is-selected").forEach((entry) => {
    entry.classList.remove("is-selected");
  });

  if (row && row.classList) {
    row.classList.add("is-selected");
  }
}


function bindJobsRowSelection(row, path, type) {
  if (!row) return;

  let selectedOnPointerDown = false;

  row.addEventListener("pointerdown", (event) => {
    if (Number(event?.button) !== 0) return;
    selectedOnPointerDown = true;
    applyJobsRowSelection(row, path, type);
  });

  row.addEventListener("click", () => {
    if (selectedOnPointerDown) {
      selectedOnPointerDown = false;
      return;
    }

    applyJobsRowSelection(row, path, type);
  });
}
function renderJobsList() {
  if (!els.fileList) return;
  updateJobsListPrintSnapshot();
  const hasJobsClient = !!state.client;
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
  if (!hasJobsClient) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Connect to Moonraker to browse print files.";
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

    if (isJobsEntrySelected(parentDirectory, "directory")) {
      row.classList.add("is-selected");
    }

    bindJobsRowSelection(row, parentDirectory, "directory");

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

    if (isJobsEntrySelected(entry.path, "directory")) {
      row.classList.add("is-selected");
    }

    bindJobsRowSelection(row, entry.path, "directory");

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
      applyJobsRowSelection(row, entry.path, "directory");
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

    if (isJobsEntrySelected(entry.path, "file")) {
      row.classList.add("is-selected");
    }

    bindJobsRowSelection(row, entry.path, "file");

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
    printButton.textContent = "Print";
    printButton.disabled = busy;
    printButton.addEventListener("click", async () => {
      await requestJobsFilePrint(entry.path);
    });

    const simulateButton = document.createElement("button");
    simulateButton.type = "button";
    simulateButton.className = "jobs-entry-btn";
    simulateButton.textContent = state.jobs.actionInFlight && state.jobs.activePath === entry.path && state.jobs.actionLabel === "simulate"
      ? "Loading..."
      : "Simulate";
    simulateButton.disabled = busy;
    simulateButton.addEventListener("click", async () => {
      await requestJobsFileSimulate(entry.path);
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

    actions.append(printButton, simulateButton, renameButton, moveButton, downloadButton, deleteButton);
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
  if (state.jobs.workflowStatusMessage) {
    setJobsStatusMessage(state.jobs.workflowStatusMessage, state.jobs.workflowStatusLevel || "info");
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
  if (state.jobs.isLoading) {
    setJobsStatusMessage("Loading print files...", "info");
    return;
  }
  if (state.connectionStatus !== "connected") {
    setJobsStatusMessage("Moonraker websocket is disconnected. File actions are running in degraded mode.", "warn");
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

  if (els.historySearch) {
    els.historySearch.value = String(state.printHistory.searchQuery || "");
  }

  if (els.historyStatusFilter) {
    els.historyStatusFilter.value = normalizePrintHistoryStatusFilter(state.printHistory.statusFilter);
  }

  if (els.historySort) {
    els.historySort.value = normalizePrintHistorySort(state.printHistory.sortMode);
  }

  if (els.historyPageSize) {
    els.historyPageSize.value = String(normalizePrintHistoryPageSize(state.printHistory.pageSize));
  }

  if (els.historyLoadLimit) {
    els.historyLoadLimit.value = String(normalizePrintHistoryLoadLimit(state.printHistory.loadedLimit));
  }

  if (els.historyTimeDays) {
    els.historyTimeDays.checked = !!state.printHistory.timeInDays;
  }

  if (els.historyLengthKm) {
    els.historyLengthKm.checked = !!state.printHistory.lengthInKilometers;
  }

  const hasJobsClient = !!state.client;
  const busy = state.jobs.isLoading || state.jobs.actionInFlight;

  if (els.jobsRefresh) {
    els.jobsRefresh.disabled = !hasJobsClient || busy;
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

  if (els.jobsFilterToggle) {
    els.jobsFilterToggle.disabled = busy;
  }

  if (els.jobsAddToggle) {
    els.jobsAddToggle.disabled = !hasJobsClient || busy;
  }

  if (els.jobsUploadBtn) {
    els.jobsUploadBtn.disabled = !hasJobsClient || busy;
  }

  if (els.jobsUploadFolderBtn) {
    els.jobsUploadFolderBtn.disabled = !hasJobsClient || busy;
  }

  if (els.jobsUploadPrintBtn) {
    els.jobsUploadPrintBtn.disabled = !hasJobsClient || busy;
  }

  if (els.jobsNewFolder) {
    els.jobsNewFolder.disabled = !hasJobsClient || busy;
  }

  if (els.jobsNewFolderDirect) {
    els.jobsNewFolderDirect.disabled = !hasJobsClient || busy;
  }

  if (els.jobsSearch) {
    els.jobsSearch.disabled = busy;
  }

  if (!hasJobsClient || busy) {
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
  if (!state.client) {
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
    let listing = extractJobsListing(response);

    const directoryTargets = [""];
    const currentDirectory = normalizeJobsDirectory(state.jobs.currentDirectory);
    if (currentDirectory) {
      directoryTargets.push(currentDirectory);
    }

    for (const target of directoryTargets) {
      try {
        const directoryResponse = await state.client.getGcodeDirectory(target, { extended: true });
        listing = mergeJobsDirectoriesFromDirectoryResponse(listing, directoryResponse, target);
      } catch (directoryError) {
        log.debug("GCode directory lookup failed during file refresh.", {
          directory: target || "gcodes",
          error: directoryError?.message || String(directoryError),
        });
      }
    }

    applyJobsListing(listing);
    state.jobs.lastError = "";
    state.jobs.lastUpdatedMs = Date.now();
    persistJobsViewState();

    if (source === "user") {
      appendConsole(`Loaded ${listing.files.length} print file${listing.files.length === 1 ? "" : "s"}.`, "info");
    }

    renderJobsCard();
    void prefetchJobsMetadata(listing.files);
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
  if (!normalizedPath || !state.client) return false;

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

  if (!source || !destination || !state.client) return false;
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
  if (!normalizedPath || !state.client) return false;

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
  if (!normalizedPath || !state.client) return false;

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

async function requestJobsFileSimulate(path) {
  const normalizedPath = normalizeGcodePath(path);
  if (!normalizedPath || !state.client) return false;

  state.jobs.actionInFlight = true;
  state.jobs.actionLabel = "simulate";
  state.jobs.activePath = normalizedPath;
  renderJobsCard();

  try {
    const loaded = await requestPrettyGcodeSimulationFromHost(normalizedPath);
    if (!loaded) {
      state.jobs.lastError = state.prettyGcode.lastError || "Failed to load simulation file.";
      renderJobsCard();
      return false;
    }

    state.jobs.lastError = "";
    appendConsole(`Loaded simulation file: ${formatJobsRootPath(normalizedPath)}`, "info");
    await requestViewChange("pretty-gcode");
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.jobs.lastError = message;
    appendConsole(`Simulation load failed (${normalizedPath}): ${message}`, "error");
    renderJobsCard();
    return false;
  } finally {
    state.jobs.actionInFlight = false;
    state.jobs.actionLabel = "";
    state.jobs.activePath = "";
    renderJobsCard();
  }
}

function setJobsWorkflowStatus(message, level = "warn") {
  state.jobs.workflowStatusMessage = String(message || "").trim();
  state.jobs.workflowStatusLevel = level;
  renderJobsCard();
}

function clearJobsWorkflowStatus() {
  state.jobs.workflowStatusMessage = "";
  state.jobs.workflowStatusLevel = "info";
}

function getJobsPrepareStageRank(stage) {
  return JOBS_PREPARE_STAGE_ORDER.indexOf(String(stage || "").trim().toLowerCase());
}

function getJobsPrepareStageText(stage, normalizedPath = "") {
  const normalizedStage = String(stage || "").trim().toLowerCase();
  const baseText = JOBS_PREPARE_STAGE_TEXT[normalizedStage] || "Preparing print";
  if (normalizedStage === "file_loaded" && normalizedPath) {
    return `${baseText}: ${formatJobsRootPath(normalizedPath)}`;
  }
  return baseText;
}

function inferJobsPrepareStageFromResponseLine(line) {
  const normalized = String(line || "").trim().toLowerCase();
  if (!normalized) return "";

  if (/\b(start(?:ing)?\s+print|prepare\s+complete|print\s+start\s+done)\b/.test(normalized)) {
    return "starting_print";
  }

  if (/\b(adaptive|bed\s*mesh|mesh\s*calib|mesh|probe|probing)\b/.test(normalized)) {
    return "adaptive_mesh";
  }

  if (/\b(home|homing|g28)\b/.test(normalized)) {
    return "homing";
  }

  if (/\b(nozzle|hotend|extruder)\b/.test(normalized) && /\b(standby|heat|heating|preheat|temp|temperature|target)\b/.test(normalized)) {
    return "heating_nozzle";
  }

  if (/\b(bed|heater_bed)\b/.test(normalized) && /\b(heat|heating|preheat|temp|temperature|target)\b/.test(normalized)) {
    return "heating_bed";
  }

  return "";
}

function isJobsPrepareErrorLine(line) {
  const normalized = String(line || "").trim();
  if (!normalized) return false;
  return normalized.startsWith("!!") || /^error\b/i.test(normalized);
}

function sanitizeJobsPrepareTemperature(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.round(numeric));
}

async function resolveJobsPrepareTemperatures(path) {
  const normalizedPath = normalizeGcodePath(path);
  if (!normalizedPath) {
    return { bedTemp: 0, hotendTemp: 0 };
  }

  if (!state.jobs.metadataByPath.has(normalizedPath)) {
    await ensureJobsMetadata(normalizedPath);
  }

  const metadata = state.jobs.metadataByPath.get(normalizedPath) || {};
  const metadataBed = sanitizeJobsPrepareTemperature(readFiniteNumber(metadata?.firstLayerBedTemp));
  const metadataHotend = sanitizeJobsPrepareTemperature(readFiniteNumber(metadata?.firstLayerExtruderTemp));
  const fallbackBed = sanitizeJobsPrepareTemperature(readFiniteNumber(state.temperatures?.bed?.target));
  const fallbackHotend = sanitizeJobsPrepareTemperature(readFiniteNumber(state.temperatures?.hotend?.target));

  const bedTemp = metadataBed ?? fallbackBed ?? 0;
  const hotendTemp = metadataHotend ?? fallbackHotend ?? 0;

  if (!(bedTemp > 0) || !(hotendTemp > 0)) {
    appendConsole(`Prepare macro temperature fallback in use for ${formatJobsRootPath(normalizedPath)} (BED=${bedTemp}, HOTEND=${hotendTemp}).`, "warn");
  }

  return {
    bedTemp,
    hotendTemp,
  };
}

function buildJobsPrepareMacroCommand({ bedTemp, hotendTemp, macroName = JOBS_PREPARE_PRINT_MACRO_NAME } = {}) {
  const normalizedMacro = String(macroName || JOBS_PREPARE_PRINT_MACRO_NAME).trim() || JOBS_PREPARE_PRINT_MACRO_NAME;
  const resolvedBedTemp = sanitizeJobsPrepareTemperature(bedTemp) ?? 0;
  const resolvedHotendTemp = sanitizeJobsPrepareTemperature(hotendTemp) ?? 0;
  return `${normalizedMacro} BED=${resolvedBedTemp} HOTEND=${resolvedHotendTemp}`;
}

function extractJobsSelectedFilenameFromSnapshot(snapshot) {
  const status = snapshot?.result?.status || {};
  const printStatsFilename = normalizeGcodePath(status?.print_stats?.filename);
  const virtualSdPath = normalizeGcodePath(
    status?.virtual_sdcard?.file_path
      || status?.virtual_sdcard?.filepath
      || status?.virtual_sdcard?.filename
  );
  return printStatsFilename || virtualSdPath || "";
}

function applyJobsPrepareStatusSnapshot(snapshot) {
  const status = snapshot?.result?.status || {};
  const virtualSd = mergeVirtualSdSnapshot(status?.virtual_sdcard || null);
  renderStatusProgress(virtualSd);
  updateStatusFanSnapshot(status?.fan || null);
  updateStatusFileInfo(
    status?.print_stats || {},
    status?.gcode_move || null,
    status?.motion_report || null,
    status?.toolhead || null
  );
}

async function queryJobsPrepareStatusSnapshot() {
  if (!state.client) {
    throw new Error("Moonraker is not connected.");
  }

  if (typeof state.client.queryPrinterObjects === "function") {
    return state.client.queryPrinterObjects(["print_stats", "virtual_sdcard", "gcode_move", "motion_report", "toolhead", "idle_timeout", "fan"]);
  }

  return state.client.call("/printer/objects/query?print_stats&virtual_sdcard&gcode_move&motion_report&toolhead&idle_timeout&fan");
}

async function verifyJobsSelectedFile(path, { attempts = 8, intervalMs = 220 } = {}) {
  const expectedPath = normalizeGcodePath(path);
  if (!expectedPath) return false;

  const maxAttempts = Math.max(1, Number(attempts) || 1);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const snapshot = await queryJobsPrepareStatusSnapshot();
    applyJobsPrepareStatusSnapshot(snapshot);

    const selectedPath = extractJobsSelectedFilenameFromSnapshot(snapshot);
    if (selectedPath === expectedPath) {
      return true;
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => {
        setTimeout(resolve, Math.max(100, Number(intervalMs) || 220));
      });
    }
  }

  throw new Error(`Printer did not report loaded file ${formatJobsRootPath(expectedPath)}.`);
}

async function waitForJobsPrepareReadyState(path, { intervalMs = 300 } = {}) {
  const expectedPath = normalizeGcodePath(path);

  while (true) {
    if (!state.client || state.connectionStatus !== "connected") {
      throw new Error("Moonraker disconnected during prepare sequence.");
    }

    const snapshot = await queryJobsPrepareStatusSnapshot();
    applyJobsPrepareStatusSnapshot(snapshot);

    const status = snapshot?.result?.status || {};
    const printStats = status?.print_stats || {};
    const printerState = normalizePrinterState(printStats?.state || printStats?.status || els.printerState?.dataset?.state || "unknown");
    const idleState = String(status?.idle_timeout?.state || "").trim().toLowerCase();
    const selectedPath = extractJobsSelectedFilenameFromSnapshot(snapshot) || normalizeGcodePath(state.printStatus.filename);

    if (printerState === "error" || printerState === "disconnected") {
      throw new Error(`Prepare sequence failed: printer entered ${printerState} state.`);
    }

    if (printerState === "cancelled") {
      throw new Error("Prepare sequence was cancelled.");
    }

    if (printerState === "printing" || printerState === "paused") {
      throw new Error("Prepare sequence was interrupted by an active print state.");
    }

    if (selectedPath && expectedPath && selectedPath !== expectedPath) {
      throw new Error(`Prepare sequence switched to a different file: ${formatJobsRootPath(selectedPath)}.`);
    }

    const idleReady = !idleState || idleState === "ready" || idleState === "idle";
    const printerReady = printerState === "ready" || printerState === "complete";

    if (idleReady && printerReady) {
      return true;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, Math.max(120, Number(intervalMs) || 300));
    });
  }
}

async function runJobsPrepareMacroWithProgress(path, macroCommand, { onStage = null } = {}) {
  if (!state.client) {
    throw new Error("Moonraker is not connected.");
  }

  let streamFailureMessage = "";

  const stopMessageListener = state.client.onMessage((payload) => {
    if (!payload || typeof payload !== "object") return;

    if (payload.method === "notify_gcode_response") {
      const [responseLine] = payload.params || [];
      splitConsoleMessageLines(responseLine).forEach((line) => {
        const stage = inferJobsPrepareStageFromResponseLine(line);
        if (stage && typeof onStage === "function") {
          onStage(stage);
        }

        if (!streamFailureMessage && isJobsPrepareErrorLine(line)) {
          const cleanLine = String(line || "").replace(/^!!\s*/, "").trim();
          streamFailureMessage = cleanLine
            ? `Prepare sequence failed: ${cleanLine}`
            : "Prepare sequence failed.";
        }
      });
      return;
    }

    if (payload.method === "notify_status_update") {
      const [status] = payload.params || [];
      const printStats = status?.print_stats || {};
      const printerState = normalizePrinterState(printStats?.state || printStats?.status || "");
      if (!streamFailureMessage && (printerState === "error" || printerState === "cancelled")) {
        streamFailureMessage = `Prepare sequence failed: printer entered ${printerState} state.`;
      }
    }
  });

  const stopConnectionListener = state.client.onConnectionState((status) => {
    if (streamFailureMessage) return;
    const normalized = String(status || "").trim().toLowerCase();
    if (normalized === "disconnected" || normalized === "error") {
      streamFailureMessage = "Moonraker disconnected during prepare sequence.";
    }
  });

  try {
    await state.client.runGcode(macroCommand);
  } catch (error) {
    const message = streamFailureMessage || error?.message || String(error);
    throw new Error(message);
  } finally {
    stopMessageListener();
    stopConnectionListener();
  }

  if (streamFailureMessage) {
    throw new Error(streamFailureMessage);
  }

  await waitForJobsPrepareReadyState(path);
}

async function runJobsPrepareAndStartPrint(path, { startPrintAfterPrepare = true } = {}) {
  const normalizedPath = normalizeGcodePath(path);
  if (!normalizedPath || !state.client) return false;

  setJobsEntrySelection(normalizedPath, "file");

  const stageState = { rank: -1 };
  const updateStage = (stageKey) => {
    const stageRank = getJobsPrepareStageRank(stageKey);
    if (stageRank < 0 || stageRank <= stageState.rank) return;
    stageState.rank = stageRank;

    const stageText = getJobsPrepareStageText(stageKey, normalizedPath);
    setJobsWorkflowStatus(stageText, "warn");
    appendConsole(`Prepare: ${stageText}`, "info");
  };

  await state.client.selectPrintFile(normalizedPath);
  await verifyJobsSelectedFile(normalizedPath);
  updateStage("file_loaded");

  const temperatures = await resolveJobsPrepareTemperatures(normalizedPath);
  const macroCommand = buildJobsPrepareMacroCommand(temperatures);

  updateStage("heating_bed");
  appendConsole(`Prepare macro started: ${macroCommand}`, "info");

  await runJobsPrepareMacroWithProgress(normalizedPath, macroCommand, { onStage: updateStage });

  if (!startPrintAfterPrepare) {
    setJobsWorkflowStatus("Prepare completed.", "info");
    appendConsole(`Prepare complete: ${formatJobsRootPath(normalizedPath)}`, "info");
    return true;
  }

  updateStage("starting_print");
  await state.client.startPrint(normalizedPath);
  appendConsole(`Started print: ${formatJobsRootPath(normalizedPath)}`, "info");
  return true;
}

async function requestJobsFilePrint(path) {
  const normalizedPath = normalizeGcodePath(path);
  if (!normalizedPath || !state.client) return false;

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
  clearJobsWorkflowStatus();
  renderJobsCard();

  try {
    await runJobsPrepareAndStartPrint(normalizedPath, { startPrintAfterPrepare: true });
    state.jobs.lastError = "";
    clearJobsWorkflowStatus();
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.jobs.lastError = message;
    appendConsole(`Prepare and print failed (${normalizedPath}): ${message}`, "error");
    return false;
  } finally {
    state.jobs.actionInFlight = false;
    state.jobs.actionLabel = "";
    state.jobs.activePath = "";
    clearJobsWorkflowStatus();
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

function getJobsFileExtension(filename) {
  const normalized = String(filename || "").trim().toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return normalized.slice(dotIndex);
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
  if (!state.client) return false;

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
    appendConsole(`Uploaded ${uploaded} file${uploaded === 1 ? "" : "s"}.`, "info");
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

function openJobsTextInputDialog({ title = "", label = "", confirmLabel = "Save", defaultValue = "" } = {}) {
  return new Promise((resolve) => {
    if (!document?.body) {
      resolve(null);
      return;
    }

    const dialog = document.createElement("dialog");
    dialog.className = "jobs-move-dialog";

    const card = document.createElement("article");
    card.className = "jobs-move-dialog-card";

    const heading = document.createElement("h3");
    heading.textContent = String(title || "Input");

    const inputId = "jobs-text-input-" + Date.now() + "-" + Math.round(Math.random() * 1000);

    const labelEl = document.createElement("label");
    labelEl.className = "jobs-move-dialog-label";
    labelEl.htmlFor = inputId;
    labelEl.textContent = String(label || "Value");

    const input = document.createElement("input");
    input.id = inputId;
    input.type = "text";
    input.className = "jobs-move-dialog-select";
    input.value = String(defaultValue || "");
    input.autocomplete = "off";

    const actions = document.createElement("div");
    actions.className = "actions jobs-move-dialog-actions";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";

    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.textContent = String(confirmLabel || "Save");

    actions.append(cancelButton, confirmButton);
    card.append(heading, labelEl, input, actions);
    dialog.appendChild(card);
    document.body.appendChild(dialog);

    let settled = false;
    const closeWith = (value) => {
      if (settled) return;
      settled = true;
      try {
        dialog.close();
      } catch {}
      dialog.remove();
      resolve(value);
    };

    cancelButton.addEventListener("click", () => closeWith(null));
    confirmButton.addEventListener("click", () => closeWith(String(input.value || "")));

    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeWith(null);
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        closeWith(null);
      }
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        closeWith(String(input.value || ""));
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeWith(null);
      }
    });

    const openPromptFallback = () => {
      const requested = typeof window.prompt === "function"
        ? window.prompt(String(title || "Input"), String(defaultValue || ""))
        : null;
      closeWith(requested === null ? null : String(requested));
    };
    if (typeof dialog.showModal === "function") {
      try {
        dialog.showModal();
        setTimeout(() => {
          input.focus();
          input.select();
        }, 0);
        return;
      } catch (error) {
        log.warn("Jobs text dialog failed to open, using prompt fallback.", {
          error: error?.message || String(error),
        });
      }
    }
    openPromptFallback();
  });
}

function openJobsFolderSelectDialog({
  title = "Move",
  label = "Destination folder",
  confirmLabel = "Move",
  options = [],
  defaultValue = "",
} = {}) {
  return new Promise((resolve) => {
    const dialog = els.jobsMoveFileDialog;
    const titleEl = els.jobsMoveFileTitle;
    const selectEl = els.jobsMoveFileSelect;
    const cancelEl = els.jobsMoveFileCancel;
    const confirmEl = els.jobsMoveFileConfirm;

    const entries = (Array.isArray(options) ? options : [])
      .map((entry) => ({
        value: String(entry?.value ?? ""),
        label: String(entry?.label ?? entry?.value ?? "").trim(),
      }))
      .filter((entry) => entry.label.length > 0);

    if (!(dialog instanceof HTMLDialogElement) || !selectEl || !cancelEl || !confirmEl || !entries.length) {
      const fallback = typeof window.prompt === "function"
        ? window.prompt(String(title || "Move"), String(defaultValue || ""))
        : null;
      resolve(fallback === null ? null : String(fallback));
      return;
    }

    if (titleEl) {
      titleEl.textContent = String(title || "Move");
    }

    const card = dialog.querySelector(".jobs-move-dialog-card");
    const labelEl = card?.querySelector(".jobs-move-dialog-label");
    if (labelEl) {
      labelEl.textContent = String(label || "Destination folder");
    }

    confirmEl.textContent = String(confirmLabel || "Move");

    selectEl.replaceChildren();
    entries.forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.value;
      option.textContent = entry.label;
      selectEl.appendChild(option);
    });

    const hasDefault = entries.some((entry) => entry.value === String(defaultValue || ""));
    selectEl.value = hasDefault ? String(defaultValue || "") : entries[0].value;

    let settled = false;
    const cleanup = () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("click", handleBackdrop);
      cancelEl.removeEventListener("click", handleCancelClick);
      confirmEl.removeEventListener("click", handleConfirmClick);
      selectEl.removeEventListener("keydown", handleKeydown);
    };

    const closeWith = (value) => {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        dialog.close();
      } catch {}
      resolve(value);
    };

    const handleCancel = (event) => {
      event.preventDefault();
      closeWith(null);
    };

    const handleBackdrop = (event) => {
      if (event.target === dialog) {
        closeWith(null);
      }
    };

    const handleCancelClick = () => closeWith(null);
    const handleConfirmClick = () => closeWith(String(selectEl.value || ""));
    const handleKeydown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        closeWith(String(selectEl.value || ""));
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeWith(null);
      }
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("click", handleBackdrop);
    cancelEl.addEventListener("click", handleCancelClick);
    confirmEl.addEventListener("click", handleConfirmClick);
    selectEl.addEventListener("keydown", handleKeydown);

    if (typeof dialog.showModal === "function") {
      try {
        dialog.showModal();
        setTimeout(() => {
          selectEl.focus();
        }, 0);
        return;
      } catch (error) {
        log.warn("Move folder select dialog failed to open, using prompt fallback.", {
          error: error?.message || String(error),
        });
      }
    }

    cleanup();
    const fallback = typeof window.prompt === "function"
      ? window.prompt(String(title || "Move"), String(defaultValue || ""))
      : null;
    resolve(fallback === null ? null : String(fallback));
  });
}

async function requestJobsCreateFolder() {
  if (!state.client) {
    setJobsStatusMessage("Moonraker client is unavailable.", "warn");
    return false;
  }

  const targetDefault = "new-folder";
  let requested = null;
  try {
    requested = await openJobsTextInputDialog({
      title: "Create Folder",
      label: "Folder name (relative to current directory)",
      confirmLabel: "Create",
      defaultValue: targetDefault,
    });
  } catch (error) {
    const message = error?.message || String(error);
    state.jobs.lastError = message;
    appendConsole(`Create folder prompt failed: ${message}`, "error");
    renderJobsCard();
    return false;
  }
  if (requested === null) {
    setJobsStatusMessage("Folder creation canceled.", "info");
    return false;
  }

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
    setJobsStatusMessage(`Created folder: ${formatJobsRootPath(fullPath)}`, "info");
    await loadJobsFiles({ source: "mkdir", silent: true });
    ensureJobsDirectoryVisible(fullPath, { openDirectory: true });
    persistJobsViewState();
    renderJobsCard();
    return true;
  } catch (error) {
    if (isJobsDirectoryAlreadyExistsError(error)) {
      state.jobs.lastError = "";
      appendConsole(`Folder already exists: ${formatJobsRootPath(fullPath)}`, "warn");
      setJobsStatusMessage(`Folder already exists: ${formatJobsRootPath(fullPath)}`, "warn");
      await loadJobsFiles({ source: "mkdir", silent: true });
      ensureJobsDirectoryVisible(fullPath, { openDirectory: true });
      persistJobsViewState();
      renderJobsCard();
      return true;
    }

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
  if (!state.client) return;

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
  if (!state.client) return false;

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

const PRINT_HISTORY_STATUS_META = {
  completed: { label: "Completed", className: "status-completed" },
  cancelled: { label: "Cancelled", className: "status-cancelled" },
  error: { label: "Error", className: "status-error" },
  interrupted: { label: "Interrupted", className: "status-interrupted" },
  klippy_shutdown: { label: "Klippy Shutdown", className: "status-interrupted" },
  klippy_disconnect: { label: "Klippy Disconnect", className: "status-interrupted" },
  server_exit: { label: "Server Exit", className: "status-interrupted" },
  printing: { label: "Printing", className: "status-printing" },
  in_progress: { label: "In Progress", className: "status-printing" },
  unknown: { label: "Unknown", className: "status-unknown" },
};

function normalizePrintHistoryStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "unknown";
  if (["complete", "completed", "success", "finished"].includes(normalized)) return "completed";
  if (["cancel", "cancelled", "canceled"].includes(normalized)) return "cancelled";
  if (["error", "failed", "failure"].includes(normalized)) return "error";
  if (["printing", "in_progress", "in progress", "running"].includes(normalized)) return "in_progress";
  if (PRINT_HISTORY_STATUS_FILTER_VALUES.includes(normalized)) return normalized;
  return "unknown";
}

function getPrintHistoryStatusInfo(status) {
  return PRINT_HISTORY_STATUS_META[normalizePrintHistoryStatus(status)] || PRINT_HISTORY_STATUS_META.unknown;
}

function toPrintHistoryTimestampMs(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
}

function toPrintHistoryNonNegative(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return numeric;
}

function normalizePrintHistoryExists(value) {
  if (typeof value === "boolean") return value;
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  if (["1", "true", "yes", "y", "exists", "available"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "missing", "deleted"].includes(normalized)) return false;
  return null;
}

function parsePrintHistoryJob(entry, index = 0) {
  if (!entry || typeof entry !== "object") return null;

  const metadata =
    (entry.metadata && typeof entry.metadata === "object" ? entry.metadata : null)
    || (entry.job?.metadata && typeof entry.job.metadata === "object" ? entry.job.metadata : null)
    || {};

  const filename = normalizeGcodePath(
    entry.filename || entry.file?.path || entry.path || entry.job?.filename || metadata.filename || ""
  );

  const displayName = getGcodeDisplayName(filename) || String(entry.filename || entry.path || "").trim() || `Job ${index + 1}`;
  const startTimeMs = toPrintHistoryTimestampMs(entry.start_time ?? entry.startTime ?? entry.print_start_time);
  let endTimeMs = toPrintHistoryTimestampMs(entry.end_time ?? entry.endTime ?? entry.print_end_time);
  const totalDuration = toPrintHistoryNonNegative(entry.total_duration ?? entry.totalDuration ?? entry.duration);
  const printDuration = toPrintHistoryNonNegative(entry.print_duration ?? entry.printDuration);

  if (!endTimeMs && startTimeMs && Number.isFinite(totalDuration) && totalDuration > 0) {
    endTimeMs = startTimeMs + Math.round(totalDuration * 1000);
  }

  const uid = String(entry.uid || entry.job_id || `${startTimeMs || Date.now()}-${displayName}-${index}`).trim();

  return {
    uid,
    jobId: String(entry.job_id || "").trim(),
    filename,
    displayName,
    status: normalizePrintHistoryStatus(entry.status ?? entry.state ?? entry.job_status),
    startTimeMs,
    endTimeMs,
    printDuration,
    totalDuration,
    filamentUsed: toPrintHistoryNonNegative(entry.filament_used ?? entry.filament_total ?? metadata.filament_total ?? metadata.filament_length),
    user: String(entry.user || entry.username || "").trim() || "--",
    exists: normalizePrintHistoryExists(entry.exists ?? entry.file_exists ?? metadata.exists),
    estimatedTime: toPrintHistoryNonNegative(entry.estimated_time ?? metadata.estimated_time),
    objectHeight: toPrintHistoryNonNegative(entry.object_height ?? metadata.object_height),
    layerHeight: toPrintHistoryNonNegative(entry.layer_height ?? metadata.layer_height),
    firstLayerHeight: toPrintHistoryNonNegative(entry.first_layer_height ?? metadata.first_layer_height),
    filamentType: String(entry.filament_type ?? metadata.filament_type ?? "").trim(),
    filamentName: String(entry.filament_name ?? metadata.filament_name ?? "").trim(),
    nozzleDiameter: toPrintHistoryNonNegative(entry.nozzle_diameter ?? metadata.nozzle_diameter),
    size: toPrintHistoryNonNegative(entry.size ?? metadata.size),
    modifiedMs: toPrintHistoryTimestampMs(entry.modified ?? metadata.modified ?? metadata.mtime),
    auxiliaryData: Array.isArray(entry.auxiliary_data)
      ? entry.auxiliary_data
      : (entry.auxiliary_data && typeof entry.auxiliary_data === "object" ? Object.entries(entry.auxiliary_data) : []),
  };
}

function extractPrintHistoryList(response) {
  const result = response?.result ?? response ?? {};
  const rawJobs = Array.isArray(result)
    ? result
    : Array.isArray(result.jobs)
      ? result.jobs
      : Array.isArray(result.history)
        ? result.history
        : [];

  const jobs = rawJobs.map((entry, index) => parsePrintHistoryJob(entry, index)).filter(Boolean);
  const countCandidate = Number(result.count ?? result.total ?? result.total_count ?? result.job_count);
  const totalCount = Number.isFinite(countCandidate) && countCandidate >= 0 ? Math.round(countCandidate) : jobs.length;
  return { jobs, totalCount };
}

function extractPrintHistoryTotals(response) {
  const result = response?.result ?? response ?? {};
  const source = result.job_totals && typeof result.job_totals === "object" ? result.job_totals : result;

  const read = (key, fallback = 0) => {
    const value = Number(source[key]);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  };

  return {
    total_jobs: Math.round(read("total_jobs", read("job_count", 0))),
    total_time: read("total_time", 0),
    total_print_time: read("total_print_time", read("total_print", 0)),
    total_filament_used: read("total_filament_used", read("filament_used", 0)),
    longest_job: read("longest_job", 0),
    longest_print: read("longest_print", 0),
  };
}

function getPrintHistorySelectionSet() {
  if (!(state.printHistory.selectedJobIds instanceof Set)) {
    state.printHistory.selectedJobIds = new Set(Array.isArray(state.printHistory.selectedJobIds) ? state.printHistory.selectedJobIds : []);
  }
  return state.printHistory.selectedJobIds;
}

function closePrintHistoryColumnsMenu() {
  state.printHistory.columnsMenuOpen = false;
  if (els.historyColumnsMenu) els.historyColumnsMenu.hidden = true;
  if (els.historyColumnsToggle) {
    els.historyColumnsToggle.setAttribute("aria-expanded", "false");
    els.historyColumnsToggle.classList.remove("is-active");
  }
}

function setPrintHistoryColumnsMenuOpen(isOpen) {
  state.printHistory.columnsMenuOpen = !!isOpen;
  if (els.historyColumnsMenu) els.historyColumnsMenu.hidden = !state.printHistory.columnsMenuOpen;
  if (els.historyColumnsToggle) {
    els.historyColumnsToggle.setAttribute("aria-expanded", state.printHistory.columnsMenuOpen ? "true" : "false");
    els.historyColumnsToggle.classList.toggle("is-active", state.printHistory.columnsMenuOpen);
  }
}

function getPrintHistoryVisibleColumns() {
  return normalizePrintHistoryVisibleColumns(state.printHistory.visibleColumns);
}

function togglePrintHistoryVisibleColumn(columnKey, enabled) {
  const normalizedKey = String(columnKey || "").trim().toLowerCase();
  if (!PRINT_HISTORY_COLUMN_KEYS.includes(normalizedKey)) return;

  const current = getPrintHistoryVisibleColumns();
  if (enabled) {
    if (current.includes(normalizedKey)) return;
    state.printHistory.visibleColumns = [...current, normalizedKey];
  } else {
    if (!current.includes(normalizedKey)) return;
    if (current.length <= 1) {
      setPrintHistoryStatusMessage("At least one history column must stay visible.", "warn");
      return;
    }
    state.printHistory.visibleColumns = current.filter((entry) => entry !== normalizedKey);
  }

  persistPrintHistoryViewState();
  renderPrintHistoryCard();
}

function renderPrintHistoryColumnsMenu() {
  if (!els.historyColumnsList) return;

  const active = getPrintHistoryVisibleColumns();
  els.historyColumnsList.innerHTML = "";

  PRINT_HISTORY_COLUMN_DEFINITIONS.forEach((definition) => {
    const row = document.createElement("label");
    row.className = "history-columns-row";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = active.includes(definition.key);
    input.addEventListener("change", () => {
      togglePrintHistoryVisibleColumn(definition.key, input.checked);
    });

    const text = document.createElement("span");
    text.textContent = definition.label;
    row.append(input, text);
    els.historyColumnsList.appendChild(row);
  });
}

function formatPrintHistoryDuration(seconds) {
  const numeric = Number(seconds);
  if (!Number.isFinite(numeric) || numeric < 0) return "--";
  if (state.printHistory.timeInDays) return `${(numeric / 86400).toFixed(2)} d`;
  return formatStatusDuration(numeric);
}

function formatPrintHistoryFilament(mm) {
  const numeric = Number(mm);
  if (!Number.isFinite(numeric) || numeric < 0) return "--";
  if (state.printHistory.lengthInKilometers) return `${(numeric / 1_000_000).toFixed(3)} km`;
  if (numeric >= 1000) return `${(numeric / 1000).toFixed(2)} m`;
  return `${Math.round(numeric)} mm`;
}

function formatPrintHistoryTimestamp(ms) {
  const numeric = Number(ms);
  if (!Number.isFinite(numeric) || numeric <= 0) return "--";
  return new Date(numeric).toLocaleString();
}

function formatPrintHistoryExists(exists) {
  if (exists === true) return "Yes";
  if (exists === false) return "No";
  return "--";
}

function formatPrintHistoryCell(job, columnKey) {
  if (columnKey === "status") return getPrintHistoryStatusInfo(job.status).label;
  if (columnKey === "start_time") return formatPrintHistoryTimestamp(job.startTimeMs);
  if (columnKey === "end_time") return formatPrintHistoryTimestamp(job.endTimeMs);
  if (columnKey === "print_duration") return formatPrintHistoryDuration(job.printDuration);
  if (columnKey === "total_duration") return formatPrintHistoryDuration(job.totalDuration);
  if (columnKey === "filament_used") return formatPrintHistoryFilament(job.filamentUsed);
  if (columnKey === "user") return job.user || "--";
  if (columnKey === "exists") return formatPrintHistoryExists(job.exists);
  if (columnKey === "estimated_time") return formatPrintHistoryDuration(job.estimatedTime);
  if (columnKey === "object_height") return formatJobsLength(job.objectHeight);
  if (columnKey === "layer_height") return formatJobsLength(job.layerHeight);
  if (columnKey === "first_layer_height") return formatJobsLength(job.firstLayerHeight);
  if (columnKey === "filament_type") return job.filamentType || "--";
  if (columnKey === "filament_name") return job.filamentName || "--";
  if (columnKey === "nozzle_diameter") return Number.isFinite(job.nozzleDiameter) ? `${job.nozzleDiameter.toFixed(2)} mm` : "--";
  if (columnKey === "size") return formatFileSize(job.size) || "--";
  if (columnKey === "modified") return formatJobsTimestamp(job.modifiedMs);
  if (columnKey === "auxiliary_data") {
    const count = Array.isArray(job.auxiliaryData) ? job.auxiliaryData.length : 0;
    return count > 0 ? `${count} entr${count === 1 ? "y" : "ies"}` : "--";
  }
  return "--";
}

function buildPrintHistorySearchIndex(job) {
  return [
    job.displayName,
    job.filename,
    job.uid,
    job.jobId,
    job.user,
    getPrintHistoryStatusInfo(job.status).label,
    job.filamentType,
    job.filamentName,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");
}

function doesPrintHistoryStatusMatch(status, filterMode) {
  const statusValue = normalizePrintHistoryStatus(status);
  const filter = normalizePrintHistoryStatusFilter(filterMode);
  if (filter === "all") return true;
  if (filter === "in_progress") return statusValue === "in_progress" || statusValue === "printing";
  return statusValue === filter;
}

function sortPrintHistoryJobs(entries) {
  const sortMode = normalizePrintHistorySort(state.printHistory.sortMode);
  const items = [...entries];

  items.sort((a, b) => {
    if (sortMode === "start_asc") return (Number(a.startTimeMs) || 0) - (Number(b.startTimeMs) || 0);
    if (sortMode === "end_desc") return (Number(b.endTimeMs) || 0) - (Number(a.endTimeMs) || 0);
    if (sortMode === "end_asc") return (Number(a.endTimeMs) || 0) - (Number(b.endTimeMs) || 0);
    if (sortMode === "total_desc") return (Number(b.totalDuration) || 0) - (Number(a.totalDuration) || 0);
    if (sortMode === "print_desc") return (Number(b.printDuration) || 0) - (Number(a.printDuration) || 0);
    if (sortMode === "filament_desc") return (Number(b.filamentUsed) || 0) - (Number(a.filamentUsed) || 0);
    if (sortMode === "name_asc") return a.displayName.localeCompare(b.displayName) || a.uid.localeCompare(b.uid);
    if (sortMode === "name_desc") return b.displayName.localeCompare(a.displayName) || a.uid.localeCompare(b.uid);
    if (sortMode === "status_asc") {
      const delta = getPrintHistoryStatusInfo(a.status).label.localeCompare(getPrintHistoryStatusInfo(b.status).label);
      return delta || ((Number(b.startTimeMs) || 0) - (Number(a.startTimeMs) || 0));
    }
    return (Number(b.startTimeMs) || 0) - (Number(a.startTimeMs) || 0);
  });

  return items;
}

function getFilteredPrintHistoryJobs() {
  const query = String(state.printHistory.searchQuery || "").trim().toLowerCase();
  const statusFilter = normalizePrintHistoryStatusFilter(state.printHistory.statusFilter);

  const filtered = (state.printHistory.jobs || []).filter((job) => {
    if (!doesPrintHistoryStatusMatch(job.status, statusFilter)) return false;
    if (!query) return true;
    return buildPrintHistorySearchIndex(job).includes(query);
  });

  return sortPrintHistoryJobs(filtered);
}

function getPaginatedPrintHistory(filtered) {
  const pageSize = normalizePrintHistoryPageSize(state.printHistory.pageSize);
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.max(1, Math.min(pageCount, Number(state.printHistory.page) || 1));

  state.printHistory.page = page;
  state.printHistory.pageSize = pageSize;

  const startIndex = (page - 1) * pageSize;
  return {
    total,
    page,
    pageSize,
    pageCount,
    pageItems: filtered.slice(startIndex, startIndex + pageSize),
  };
}

function setPrintHistoryStatusMessage(message, level = "info") {
  if (!els.historyStatus) return;
  els.historyStatus.textContent = String(message || "").trim();
  els.historyStatus.dataset.level = level;
}

function getPrintHistoryTotalsForDisplay() {
  const raw = state.printHistory.totals || {};
  const jobs = state.printHistory.jobs || [];

  const fallback = jobs.reduce((acc, job) => {
    acc.total_jobs += 1;
    acc.total_time += Number(job.totalDuration) || 0;
    acc.total_print_time += Number(job.printDuration) || 0;
    acc.total_filament_used += Number(job.filamentUsed) || 0;
    acc.longest_job = Math.max(acc.longest_job, Number(job.totalDuration) || 0);
    acc.longest_print = Math.max(acc.longest_print, Number(job.printDuration) || 0);
    return acc;
  }, {
    total_jobs: 0,
    total_time: 0,
    total_print_time: 0,
    total_filament_used: 0,
    longest_job: 0,
    longest_print: 0,
  });

  return {
    total_jobs: Number(raw.total_jobs) > 0 ? Math.round(Number(raw.total_jobs)) : Math.max(Number(state.printHistory.totalCount) || 0, fallback.total_jobs),
    total_time: Number(raw.total_time) > 0 ? Number(raw.total_time) : fallback.total_time,
    total_print_time: Number(raw.total_print_time) > 0 ? Number(raw.total_print_time) : fallback.total_print_time,
    total_filament_used: Number(raw.total_filament_used) >= 0 ? Number(raw.total_filament_used) : fallback.total_filament_used,
    longest_job: Number(raw.longest_job) > 0 ? Number(raw.longest_job) : fallback.longest_job,
    longest_print: Number(raw.longest_print) > 0 ? Number(raw.longest_print) : fallback.longest_print,
  };
}

function getPrintHistorySelectedJobs() {
  const selected = getPrintHistorySelectionSet();
  if (!selected.size) return [];
  return (state.printHistory.jobs || []).filter((job) => selected.has(job.uid));
}

function getPrintHistoryStatsContext() {
  const selectedJobs = getPrintHistorySelectedJobs();
  const useSelected = selectedJobs.length > 0;
  return {
    jobs: useSelected ? selectedJobs : (state.printHistory.jobs || []),
    useSelected,
    selectedCount: selectedJobs.length,
  };
}

function isPrintHistoryAllLoaded() {
  const loaded = (state.printHistory.jobs || []).length;
  const total = Math.max(Number(state.printHistory.totalCount) || 0, loaded);
  if (!state.printHistory.lastUpdatedMs && !state.printHistory.isLoading) return false;
  if (normalizePrintHistoryLoadLimit(state.printHistory.loadedLimit) === 0) return true;
  if (total <= 0) return true;
  return loaded >= total;
}

function formatPrintHistoryFilamentMeters(mm) {
  const numeric = Number(mm);
  if (!Number.isFinite(numeric) || numeric < 0) return "0.0 m";
  return `${Math.round((numeric / 1000) * 10) / 10} m`;
}

function formatPrintHistoryStatusMetricValue(value, valueMode) {
  const numeric = Number(value) || 0;
  if (valueMode === "filament") {
    if (numeric > 1000) return `${(Math.round((numeric / 1000) * 100) / 100).toFixed(2)} m`;
    return `${Math.round(numeric)} mm`;
  }
  if (valueMode === "time") {
    return formatStatusDuration(numeric);
  }
  return Math.round(numeric).toString();
}

function setHistorySegmentedButtonState(button, isActive) {
  if (!button) return;
  button.classList.toggle("is-active", !!isActive);
  button.setAttribute("aria-pressed", isActive ? "true" : "false");
}

function renderPrintHistoryStats() {
  if (!els.historyStatsTableBody) return;

  const totals = getPrintHistoryTotalsForDisplay();
  const context = getPrintHistoryStatsContext();
  const jobs = context.jobs;

  let rows;
  if (context.useSelected) {
    const selectedPrintTime = jobs.reduce((sum, job) => sum + (Number(job.printDuration) || 0), 0);
    const selectedLongestPrint = jobs.reduce((max, job) => Math.max(max, Number(job.printDuration) || 0), 0);
    const selectedAvgPrint = jobs.length > 0 ? Math.round(selectedPrintTime / jobs.length) : 0;
    const selectedFilament = jobs.reduce((sum, job) => sum + (Number(job.filamentUsed) || 0), 0);

    rows = [
      { title: "Selected Printtime", value: formatStatusDuration(selectedPrintTime) },
      { title: "Longest Printtime", value: formatStatusDuration(selectedLongestPrint) },
      { title: "Avg Printtime", value: formatStatusDuration(selectedAvgPrint) },
      { title: "Selected Filament Used", value: formatPrintHistoryFilamentMeters(selectedFilament) },
      { title: "Selected Jobs", value: context.selectedCount.toLocaleString() },
    ];
  } else {
    const avgPrint = totals.total_jobs > 0 ? Math.round(totals.total_print_time / totals.total_jobs) : 0;
    rows = [
      { title: "Total Printtime", value: formatStatusDuration(totals.total_print_time) },
      { title: "Longest Printtime", value: formatStatusDuration(totals.longest_print || totals.longest_job) },
      { title: "Avg Printtime", value: formatStatusDuration(avgPrint) },
      { title: "Total Filament Used", value: formatPrintHistoryFilamentMeters(totals.total_filament_used) },
      { title: "Total Jobs", value: totals.total_jobs.toLocaleString() },
    ];
  }

  els.historyStatsTableBody.innerHTML = "";
  rows.forEach((entry) => {
    const row = document.createElement("tr");

    const titleCell = document.createElement("td");
    titleCell.textContent = entry.title;

    const valueCell = document.createElement("td");
    valueCell.className = "history-stats-value-cell";
    valueCell.textContent = entry.value;

    row.append(titleCell, valueCell);
    els.historyStatsTableBody.appendChild(row);
  });
}

function setPrintHistoryChartMeta(element, message) {
  if (!element) return;
  element.textContent = String(message || "").trim();
}

function getPrintHistoryChartContext(canvas, { minHeight = 170 } = {}) {
  if (!(canvas instanceof HTMLCanvasElement)) return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const rect = canvas.getBoundingClientRect();
  const cssWidth = Math.max(260, Math.round(rect.width || canvas.clientWidth || 260));
  const cssHeight = Math.max(minHeight, Math.round(rect.height || canvas.clientHeight || minHeight));
  const dpr = window.devicePixelRatio || 1;
  const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
  const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  return {
    ctx,
    width: cssWidth,
    height: cssHeight,
  };
}

function getPrintHistoryStatusChartColor(status) {
  const normalized = normalizePrintHistoryStatus(status);
  const map = {
    completed: getThemeColorValue("--status-complete", "#bdbdbd"),
    in_progress: getThemeColorValue("--status-printing", "#eeeeee"),
    printing: getThemeColorValue("--status-printing", "#eeeeee"),
    cancelled: getThemeColorValue("--status-disconnected", "#616161"),
    other: getThemeColorValue("--status-idle", "#616161"),
  };
  return map[normalized] || getThemeColorValue("--chart-grid", "#424242");
}

function buildPrintHistoryStatusEntries(jobs, valueMode = "jobs") {
  const entries = new Map();

  (jobs || []).forEach((job) => {
    const status = normalizePrintHistoryStatus(job.status);
    const current = entries.get(status) || {
      status,
      label: getPrintHistoryStatusInfo(status).label,
      value: 0,
    };

    if (valueMode === "filament") {
      current.value += Number(job.filamentUsed) || 0;
    } else if (valueMode === "time") {
      current.value += Number(job.totalDuration) || 0;
    } else {
      current.value += 1;
    }

    entries.set(status, current);
  });

  return [...entries.values()]
    .filter((entry) => Number(entry.value) > 0)
    .sort((a, b) => Number(b.value) - Number(a.value));
}

function groupSmallPrintHistoryStatusEntries(entries, threshold = 0.05) {
  const source = Array.isArray(entries) ? [...entries] : [];
  if (source.length < 3) return source;

  const total = source.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
  if (total <= 0) return source;

  const limit = total * threshold;
  const small = source.filter((entry) => Number(entry.value) < limit);
  if (small.length < 2) return source;

  const remaining = source.filter((entry) => Number(entry.value) >= limit);
  remaining.push({
    status: "other",
    label: `Others (${small.length})`,
    value: small.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0),
  });

  return remaining.sort((a, b) => Number(b.value) - Number(a.value));
}

function drawPrintHistoryStatusDonutChart(canvas, entries, { valueMode = "jobs" } = {}) {
  const context = getPrintHistoryChartContext(canvas, { minHeight: 200 });
  if (!context) return;

  const { ctx, width, height } = context;
  const totalValue = (entries || []).reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);

  if (!entries || !entries.length || totalValue <= 0) {
    ctx.fillStyle = "rgba(148, 163, 184, 0.82)";
    ctx.font = "12px JetBrains Mono";
    ctx.textAlign = "center";
    ctx.fillText("No status distribution available", width / 2, height / 2);
    return;
  }

  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const outerRadius = Math.max(44, Math.floor(Math.min(width, height) * 0.32));
  const innerRadius = Math.max(24, Math.floor(outerRadius * 0.58));
  const midRadius = (outerRadius + innerRadius) / 2;
  const ringWidth = outerRadius - innerRadius;

  let startAngle = -Math.PI / 2;
  entries.forEach((entry) => {
    const value = Number(entry.value) || 0;
    if (value <= 0) return;
    const angle = (value / totalValue) * Math.PI * 2;
    const endAngle = startAngle + angle;

    ctx.beginPath();
    ctx.strokeStyle = getPrintHistoryStatusChartColor(entry.status);
    ctx.lineWidth = ringWidth;
    ctx.lineCap = "butt";
    ctx.arc(cx, cy, midRadius, startAngle, endAngle);
    ctx.stroke();

    startAngle = endAngle;
  });

  ctx.beginPath();
  ctx.fillStyle = "rgba(8, 13, 24, 0.78)";
  ctx.arc(cx, cy, innerRadius - 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(226, 232, 240, 0.9)";
  ctx.font = "600 11px JetBrains Mono";
  ctx.textAlign = "center";
  ctx.fillText(valueMode === "jobs" ? "Total Jobs" : valueMode === "filament" ? "Total Filament" : "Total Time", cx, cy - 7);
  ctx.font = "600 12px JetBrains Mono";
  ctx.fillText(formatPrintHistoryStatusMetricValue(totalValue, valueMode), cx, cy + 11);
}

function renderPrintHistoryStatusTable(entries, valueMode = "jobs") {
  if (!els.historyStatusTableBody) return;
  els.historyStatusTableBody.innerHTML = "";

  if (!entries.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 2;
    cell.className = "history-status-table-empty";
    cell.textContent = "No status distribution available";
    row.appendChild(cell);
    els.historyStatusTableBody.appendChild(row);
    return;
  }

  entries.forEach((entry) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = entry.label;

    const valueCell = document.createElement("td");
    valueCell.className = "history-status-table-value";
    valueCell.textContent = formatPrintHistoryStatusMetricValue(entry.value, valueMode);

    row.append(nameCell, valueCell);
    els.historyStatusTableBody.appendChild(row);
  });
}

function drawPrintHistorySimpleBarChart(canvas, {
  labels = [],
  values = [],
  color = "#bdbdbd",
  emptyMessage = "No chart data.",
}) {
  const context = getPrintHistoryChartContext(canvas, { minHeight: 175 });
  if (!context) return;

  const { ctx, width, height } = context;
  const numericValues = Array.isArray(values) ? values.map((value) => Number(value) || 0) : [];
  const hasData = numericValues.some((value) => value > 0);

  if (!labels.length || !numericValues.length || !hasData) {
    ctx.fillStyle = "rgba(148, 163, 184, 0.82)";
    ctx.font = "12px JetBrains Mono";
    ctx.textAlign = "center";
    ctx.fillText(emptyMessage, width / 2, height / 2);
    return;
  }

  const plot = { left: 36, right: 12, top: 14, bottom: 30 };
  const plotWidth = Math.max(1, width - plot.left - plot.right);
  const plotHeight = Math.max(1, height - plot.top - plot.bottom);

  const maxValue = Math.max(...numericValues, 1);
  const step = maxValue <= 5 ? 1 : Math.ceil(maxValue / 5);
  const axisMax = Math.max(step, Math.ceil(maxValue / step) * step);

  ctx.strokeStyle = "rgba(148, 163, 184, 0.24)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i += 1) {
    const y = plot.top + (plotHeight * i / 4);
    ctx.beginPath();
    ctx.moveTo(plot.left, y);
    ctx.lineTo(plot.left + plotWidth, y);
    ctx.stroke();

    const axisValue = Math.round(axisMax * (1 - (i / 4)));
    ctx.fillStyle = "rgba(226, 232, 240, 0.74)";
    ctx.font = "10px JetBrains Mono";
    ctx.textAlign = "right";
    ctx.fillText(String(axisValue), plot.left - 4, y + 3);
  }

  const slotWidth = plotWidth / numericValues.length;
  const barWidth = Math.max(4, Math.min(24, slotWidth * 0.64));

  numericValues.forEach((value, index) => {
    const normalized = axisMax > 0 ? value / axisMax : 0;
    const barHeight = Math.max(0, normalized * plotHeight);
    const x = plot.left + (slotWidth * index) + ((slotWidth - barWidth) / 2);
    const y = plot.top + plotHeight - barHeight;

    ctx.fillStyle = `${color}cc`;
    ctx.fillRect(x, y, barWidth, barHeight);

    const shouldDrawLabel = labels.length <= 8 || index % 2 === 0 || index === labels.length - 1;
    if (shouldDrawLabel) {
      ctx.fillStyle = "rgba(226, 232, 240, 0.78)";
      ctx.font = "10px JetBrains Mono";
      ctx.textAlign = "center";
      ctx.fillText(labels[index], x + (barWidth / 2), height - 8);
    }
  });
}

function getPrintHistoryFilamentUsageSeries(jobs) {
  const dayMs = 24 * 60 * 60 * 1000;
  const start = new Date();
  start.setDate(start.getDate() - 14);
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();

  const labels = [];
  const values = [];

  for (let i = 0; i <= 14; i += 1) {
    const stamp = startMs + (i * dayMs);
    const day = new Date(stamp);
    labels.push(`${day.getMonth() + 1}/${day.getDate()}`);
    values.push(0);
  }

  (jobs || []).forEach((job) => {
    const startTime = Number(job.startTimeMs);
    const filamentUsed = Number(job.filamentUsed) || 0;
    if (!Number.isFinite(startTime) || startTime < startMs || filamentUsed <= 0) return;

    const jobDay = new Date(startTime);
    jobDay.setHours(0, 0, 0, 0);
    const index = Math.round((jobDay.getTime() - startMs) / dayMs);
    if (index < 0 || index >= values.length) return;

    values[index] += Math.round(filamentUsed) / 1000;
  });

  return { labels, values };
}

function getPrintHistoryPrinttimeAverageSeries(jobs) {
  const labels = ["0-2h", "2-6h", "6-12h", "12-24h", ">24h"];
  const values = [0, 0, 0, 0, 0];

  const start = new Date();
  start.setDate(start.getDate() - 14);
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();

  (jobs || []).forEach((job) => {
    const status = normalizePrintHistoryStatus(job.status);
    const startTime = Number(job.startTimeMs);
    const durationHours = (Number(job.printDuration) || 0) / 3600;

    if (status !== "completed") return;
    if (!Number.isFinite(startTime) || startTime < startMs || durationHours <= 0) return;

    if (durationHours <= 2) values[0] += 1;
    else if (durationHours <= 6) values[1] += 1;
    else if (durationHours <= 12) values[2] += 1;
    else if (durationHours <= 24) values[3] += 1;
    else values[4] += 1;
  });

  return { labels, values };
}

function renderPrintHistoryStatsVisuals() {
  const context = getPrintHistoryStatsContext();
  const jobs = context.jobs;

  const statusViewMode = normalizePrintHistoryStatusView(state.printHistory.statusViewMode);
  const statusValueMode = normalizePrintHistoryStatusValue(state.printHistory.statusValueMode);
  const trendMode = normalizePrintHistoryTrendMode(state.printHistory.trendMode);

  setHistorySegmentedButtonState(els.historyStatusViewChart, statusViewMode === "chart");
  setHistorySegmentedButtonState(els.historyStatusViewTable, statusViewMode === "table");
  setHistorySegmentedButtonState(els.historyStatusValueJobs, statusValueMode === "jobs");
  setHistorySegmentedButtonState(els.historyStatusValueFilament, statusValueMode === "filament");
  setHistorySegmentedButtonState(els.historyStatusValueTime, statusValueMode === "time");
  setHistorySegmentedButtonState(els.historyTrendModeFilament, trendMode === "filament_usage");
  setHistorySegmentedButtonState(els.historyTrendModePrinttime, trendMode === "printtime_avg");

  if (els.historyStatusChartWrap) els.historyStatusChartWrap.hidden = statusViewMode !== "chart";
  if (els.historyStatusTableWrap) els.historyStatusTableWrap.hidden = statusViewMode !== "table";

  const statusEntriesRaw = buildPrintHistoryStatusEntries(jobs, statusValueMode);
  const statusEntries = groupSmallPrintHistoryStatusEntries(statusEntriesRaw, 0.05);

  if (statusViewMode === "table") {
    renderPrintHistoryStatusTable(statusEntries, statusValueMode);
  } else {
    drawPrintHistoryStatusDonutChart(els.historyChartStatusCanvas, statusEntries, { valueMode: statusValueMode });
  }

  if (trendMode === "printtime_avg") {
    const series = getPrintHistoryPrinttimeAverageSeries(jobs);
    drawPrintHistorySimpleBarChart(els.historyChartTrendCanvas, {
      labels: series.labels,
      values: series.values,
      color: "#bdbdbd",
      emptyMessage: "No completed jobs in last 14 days.",
    });

    const total = series.values.reduce((sum, value) => sum + (Number(value) || 0), 0);
    const maxValue = Math.max(...series.values, 0);
    const peakIndex = maxValue > 0 ? series.values.findIndex((value) => value === maxValue) : -1;
    const peakLabel = peakIndex >= 0 ? series.labels[peakIndex] : "--";

    setPrintHistoryChartMeta(
      els.historyChartTrendMeta,
      `Last 14 days | ${total.toLocaleString()} completed jobs | Peak bucket ${peakLabel} (${maxValue})`
    );
  } else {
    const series = getPrintHistoryFilamentUsageSeries(jobs);
    drawPrintHistorySimpleBarChart(els.historyChartTrendCanvas, {
      labels: series.labels,
      values: series.values,
      color: "#bdbdbd",
      emptyMessage: "No filament usage in last 14 days.",
    });

    const total = series.values.reduce((sum, value) => sum + (Number(value) || 0), 0);
    const maxValue = Math.max(...series.values, 0);
    setPrintHistoryChartMeta(
      els.historyChartTrendMeta,
      `Last 14 days | Total ${total.toFixed(1)} m | Peak day ${maxValue.toFixed(1)} m`
    );
  }
}
function renderPrintHistoryTable() {
  if (!els.historyTableHead || !els.historyTableBody) return;

  const visibleColumns = getPrintHistoryVisibleColumns();
  const filtered = getFilteredPrintHistoryJobs();
  const pagination = getPaginatedPrintHistory(filtered);
  const selected = getPrintHistorySelectionSet();

  if (els.historySummary) {
    const loaded = (state.printHistory.jobs || []).length;
    const total = Math.max(Number(state.printHistory.totalCount) || 0, loaded);
    els.historySummary.textContent = `${loaded.toLocaleString()} loaded | ${pagination.total.toLocaleString()} filtered | ${total.toLocaleString()} total | ${selected.size.toLocaleString()} selected`;
  }

  els.historyTableHead.innerHTML = "";
  els.historyTableBody.innerHTML = "";

  const headRow = document.createElement("tr");
  const selectTh = document.createElement("th");
  selectTh.className = "history-select-col";

  const selectAll = document.createElement("input");
  selectAll.type = "checkbox";
  selectAll.checked = pagination.pageItems.length > 0 && pagination.pageItems.every((entry) => selected.has(entry.uid));
  selectAll.indeterminate = !selectAll.checked && pagination.pageItems.some((entry) => selected.has(entry.uid));
  selectAll.addEventListener("change", () => {
    pagination.pageItems.forEach((entry) => {
      if (selectAll.checked) selected.add(entry.uid);
      else selected.delete(entry.uid);
    });
    renderPrintHistoryCard();
  });

  selectTh.appendChild(selectAll);
  headRow.appendChild(selectTh);

  visibleColumns.forEach((columnKey) => {
    const th = document.createElement("th");
    th.textContent = PRINT_HISTORY_COLUMN_DEFINITIONS.find((entry) => entry.key === columnKey)?.label || columnKey;
    headRow.appendChild(th);
  });

  const actionsTh = document.createElement("th");
  actionsTh.textContent = "Actions";
  actionsTh.className = "history-actions-col";
  headRow.appendChild(actionsTh);
  els.historyTableHead.appendChild(headRow);

  if (!pagination.pageItems.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = visibleColumns.length + 2;
    cell.className = "history-empty-cell";
    cell.textContent = state.printHistory.isLoading ? "Loading print history..." : "No print history entries match the current filters.";
    row.appendChild(cell);
    els.historyTableBody.appendChild(row);
  } else {
    pagination.pageItems.forEach((job) => {
      const row = document.createElement("tr");
      row.className = `history-row ${getPrintHistoryStatusInfo(job.status).className}`;

      const checkCell = document.createElement("td");
      checkCell.className = "history-select-col";

      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = selected.has(job.uid);
      check.addEventListener("change", () => {
        if (check.checked) selected.add(job.uid);
        else selected.delete(job.uid);
        renderPrintHistoryCard();
      });

      checkCell.appendChild(check);
      row.appendChild(checkCell);

      visibleColumns.forEach((columnKey) => {
        const cell = document.createElement("td");
        if (columnKey === "status") {
          const badge = document.createElement("span");
          badge.className = `history-status-pill ${getPrintHistoryStatusInfo(job.status).className}`;
          badge.textContent = formatPrintHistoryCell(job, columnKey);
          cell.appendChild(badge);
        } else {
          cell.textContent = formatPrintHistoryCell(job, columnKey);
        }
        row.appendChild(cell);
      });

      const actionCell = document.createElement("td");
      actionCell.className = "history-actions-col";

      const fileLabel = document.createElement("p");
      fileLabel.className = "history-row-name";
      fileLabel.textContent = job.filename || job.displayName || "--";

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "history-row-action danger";
      removeBtn.textContent = state.printHistory.actionInFlight && state.printHistory.activeJobId === job.uid ? "Removing..." : "Remove";
      removeBtn.disabled = state.printHistory.isLoading || state.printHistory.actionInFlight || state.connectionStatus !== "connected";
      removeBtn.addEventListener("click", async () => {
        const confirmed = window.confirm(`Remove history entry for "${job.filename || job.displayName}"? This cannot be undone.`);
        if (!confirmed) return;
        await requestPrintHistoryDeleteJob(job.uid);
      });

      actionCell.append(fileLabel, removeBtn);
      row.appendChild(actionCell);
      els.historyTableBody.appendChild(row);
    });
  }

  if (els.historyPageLabel) els.historyPageLabel.textContent = `Page ${pagination.page} of ${pagination.pageCount}`;
  if (els.historyPagePrev) els.historyPagePrev.disabled = pagination.page <= 1 || state.printHistory.isLoading;
  if (els.historyPageNext) els.historyPageNext.disabled = pagination.page >= pagination.pageCount || state.printHistory.isLoading;
}

function renderPrintHistoryStatus() {
  if (!state.client) return setPrintHistoryStatusMessage("Connect to Moonraker to manage print history.", "warn");
  if (state.connectionStatus !== "connected") return setPrintHistoryStatusMessage("Moonraker disconnected. Reconnect to manage print history.", "warn");
  if (state.printHistory.isLoading) return setPrintHistoryStatusMessage("Loading print history...", "info");
  if (state.printHistory.isTotalsLoading) return setPrintHistoryStatusMessage("Refreshing print history totals...", "info");
  if (state.printHistory.actionInFlight) return setPrintHistoryStatusMessage(`Running ${state.printHistory.actionLabel || "history action"}...`, "warn");
  if (state.printHistory.lastError) return setPrintHistoryStatusMessage(`Print history action failed: ${state.printHistory.lastError}`, "error");
  if (state.printHistory.lastUpdatedMs) return setPrintHistoryStatusMessage(`Last refreshed: ${new Date(state.printHistory.lastUpdatedMs).toLocaleTimeString()}`, "info");
  return setPrintHistoryStatusMessage("Press Refresh to load print history.", "info");
}

function renderPrintHistoryCard() {
  if (els.historySearch && els.historySearch.value !== String(state.printHistory.searchQuery || "")) {
    els.historySearch.value = String(state.printHistory.searchQuery || "");
  }
  if (els.historyStatusFilter) els.historyStatusFilter.value = normalizePrintHistoryStatusFilter(state.printHistory.statusFilter);
  if (els.historySort) els.historySort.value = normalizePrintHistorySort(state.printHistory.sortMode);
  if (els.historyPageSize) els.historyPageSize.value = String(normalizePrintHistoryPageSize(state.printHistory.pageSize));
  if (els.historyLoadLimit) els.historyLoadLimit.value = String(normalizePrintHistoryLoadLimit(state.printHistory.loadedLimit));
  state.printHistory.statusViewMode = normalizePrintHistoryStatusView(state.printHistory.statusViewMode);
  state.printHistory.statusValueMode = normalizePrintHistoryStatusValue(state.printHistory.statusValueMode);
  state.printHistory.trendMode = normalizePrintHistoryTrendMode(state.printHistory.trendMode);
  if (els.historyTimeDays) els.historyTimeDays.checked = !!state.printHistory.timeInDays;
  if (els.historyLengthKm) els.historyLengthKm.checked = !!state.printHistory.lengthInKilometers;

  const connected = state.connectionStatus === "connected";
  const busy = state.printHistory.isLoading || state.printHistory.actionInFlight;
  const hasRows = (state.printHistory.jobs || []).length > 0;
  const allLoaded = isPrintHistoryAllLoaded();
  const selectedCount = getPrintHistorySelectionSet().size;
  const statsControlsDisabled = busy || !hasRows;

  if (els.historyRefresh) {
    els.historyRefresh.disabled = !connected || busy;
    els.historyRefresh.classList.toggle("is-loading", state.printHistory.isLoading);
  }
  if (els.historyLoadAll) els.historyLoadAll.disabled = !connected || busy;
  if (els.historyExportCsv) els.historyExportCsv.disabled = !hasRows || state.printHistory.isLoading;
  if (els.historyRemoveSelected) els.historyRemoveSelected.disabled = !connected || busy || selectedCount === 0;
  if (els.historyRemoveAll) els.historyRemoveAll.disabled = !connected || busy || !hasRows;
  if (els.historyResetStats) els.historyResetStats.disabled = !connected || busy || state.printHistory.isTotalsLoading;
  if (els.historyColumnsToggle) els.historyColumnsToggle.disabled = busy;
  if (els.historySearch) els.historySearch.disabled = busy;
  if (els.historyStatusFilter) els.historyStatusFilter.disabled = busy;
  if (els.historySort) els.historySort.disabled = busy;
  if (els.historyPageSize) els.historyPageSize.disabled = busy;
  if (els.historyLoadLimit) els.historyLoadLimit.disabled = busy;
  if (els.historyStatsLoadAll) {
    els.historyStatsLoadAll.disabled = !connected || busy || allLoaded;
    els.historyStatsLoadAll.hidden = allLoaded;
  }

  [
    els.historyStatusViewChart,
    els.historyStatusViewTable,
    els.historyStatusValueJobs,
    els.historyStatusValueFilament,
    els.historyStatusValueTime,
    els.historyTrendModeFilament,
    els.historyTrendModePrinttime,
  ].forEach((button) => {
    if (!button) return;
    button.disabled = statsControlsDisabled;
  });

  if (!connected || busy) closePrintHistoryColumnsMenu();

  renderPrintHistoryColumnsMenu();
  renderPrintHistoryStats();
  renderPrintHistoryStatsVisuals();
  renderPrintHistoryTable();
  renderPrintHistoryStatus();
}

async function loadPrintHistoryTotals({ silent = true } = {}) {
  if (!state.client || state.connectionStatus !== "connected") {
    renderPrintHistoryCard();
    return state.printHistory.totals;
  }

  if (state.printHistory.isTotalsLoading) return state.printHistory.totals;

  state.printHistory.isTotalsLoading = true;
  renderPrintHistoryCard();

  try {
    const response = await state.client.getHistoryTotals();
    state.printHistory.totals = extractPrintHistoryTotals(response);
    state.printHistory.totalsUpdatedMs = Date.now();
    state.printHistory.lastError = "";
    renderPrintHistoryCard();
    return state.printHistory.totals;
  } catch (error) {
    const message = error?.message || String(error);
    state.printHistory.lastError = message;
    if (!silent) appendConsole(`Print history totals load failed: ${message}`, "error");
    renderPrintHistoryCard();
    return state.printHistory.totals;
  } finally {
    state.printHistory.isTotalsLoading = false;
    renderPrintHistoryCard();
  }
}

async function loadPrintHistory({ source = "user", silent = false, forceLimit = null } = {}) {
  if (!state.client || state.connectionStatus !== "connected") {
    renderPrintHistoryCard();
    return [];
  }

  if (state.printHistory.isLoading) return state.printHistory.jobs || [];

  state.printHistory.isLoading = true;
  state.printHistory.lastError = "";
  renderPrintHistoryCard();

  const limit = forceLimit == null
    ? normalizePrintHistoryLoadLimit(state.printHistory.loadedLimit)
    : normalizePrintHistoryLoadLimit(forceLimit);

  try {
    const [listResponse] = await Promise.all([
      state.client.getHistoryList(limit > 0 ? { limit } : {}),
      loadPrintHistoryTotals({ silent: true }),
    ]);

    const { jobs, totalCount } = extractPrintHistoryList(listResponse);
    state.printHistory.jobs = jobs;
    state.printHistory.totalCount = Math.max(totalCount, jobs.length);
    state.printHistory.loadedLimit = limit;
    state.printHistory.page = 1;
    state.printHistory.lastError = "";
    state.printHistory.lastUpdatedMs = Date.now();

    const selected = getPrintHistorySelectionSet();
    const known = new Set(jobs.map((job) => job.uid));
    [...selected].forEach((uid) => {
      if (!known.has(uid)) selected.delete(uid);
    });

    persistPrintHistoryViewState();

    if (source === "user") {
      appendConsole(`Loaded ${jobs.length.toLocaleString()} print history entr${jobs.length === 1 ? "y" : "ies"}.`, "info");
    }

    renderPrintHistoryCard();
    return jobs;
  } catch (error) {
    const message = error?.message || String(error);
    state.printHistory.lastError = message;
    if (!silent) appendConsole(`Print history load failed: ${message}`, "error");
    renderPrintHistoryCard();
    return [];
  } finally {
    state.printHistory.isLoading = false;
    renderPrintHistoryCard();
  }
}

async function requestPrintHistoryDeleteJob(uid) {
  const normalizedUid = String(uid || "").trim();
  if (!normalizedUid || !state.client || state.connectionStatus !== "connected") return false;

  state.printHistory.actionInFlight = true;
  state.printHistory.actionLabel = normalizedUid === "all" ? "remove all history" : "remove history entry";
  state.printHistory.activeJobId = normalizedUid;
  renderPrintHistoryCard();

  try {
    await state.client.deleteHistoryJob(normalizedUid);
    if (normalizedUid === "all") getPrintHistorySelectionSet().clear();
    else getPrintHistorySelectionSet().delete(normalizedUid);

    state.printHistory.lastError = "";
    appendConsole(
      normalizedUid === "all" ? "All print history entries removed." : `Removed print history entry ${normalizedUid}.`,
      "warn"
    );

    await loadPrintHistory({ source: "delete", silent: true });
    await loadPrintHistoryTotals({ silent: true });
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.printHistory.lastError = message;
    appendConsole(`Print history delete failed: ${message}`, "error");
    renderPrintHistoryCard();
    return false;
  } finally {
    state.printHistory.actionInFlight = false;
    state.printHistory.actionLabel = "";
    state.printHistory.activeJobId = "";
    renderPrintHistoryCard();
  }
}

async function requestPrintHistoryDeleteSelected() {
  const selected = [...getPrintHistorySelectionSet()];
  if (!selected.length || !state.client || state.connectionStatus !== "connected") return false;

  const confirmed = window.confirm(`Remove ${selected.length} selected history entr${selected.length === 1 ? "y" : "ies"}? This cannot be undone.`);
  if (!confirmed) return false;

  state.printHistory.actionInFlight = true;
  state.printHistory.actionLabel = "remove selected history";
  renderPrintHistoryCard();

  try {
    let removed = 0;
    for (const uid of selected) {
      try {
        await state.client.deleteHistoryJob(uid);
        getPrintHistorySelectionSet().delete(uid);
        removed += 1;
      } catch (error) {
        log.warn("Failed to remove history entry", { uid, error: error?.message || String(error) });
      }
    }

    if (removed > 0) {
      appendConsole(`Removed ${removed} selected history entr${removed === 1 ? "y" : "ies"}.`, "warn");
      state.printHistory.lastError = "";
      await loadPrintHistory({ source: "delete", silent: true });
      await loadPrintHistoryTotals({ silent: true });
      return true;
    }

    state.printHistory.lastError = "No selected history entries could be removed.";
    appendConsole(state.printHistory.lastError, "error");
    renderPrintHistoryCard();
    return false;
  } finally {
    state.printHistory.actionInFlight = false;
    state.printHistory.actionLabel = "";
    state.printHistory.activeJobId = "";
    renderPrintHistoryCard();
  }
}

async function requestPrintHistoryDeleteAll() {
  if (!state.client || state.connectionStatus !== "connected") return false;
  const count = (state.printHistory.jobs || []).length;
  if (!count) return false;

  const confirmed = window.confirm("Remove all print history entries? This cannot be undone.");
  if (!confirmed) return false;

  return requestPrintHistoryDeleteJob("all");
}

async function requestPrintHistoryResetTotals() {
  if (!state.client || state.connectionStatus !== "connected") return false;

  const confirmed = window.confirm("Reset print history totals? Existing job entries stay intact.");
  if (!confirmed) return false;

  state.printHistory.actionInFlight = true;
  state.printHistory.actionLabel = "reset history totals";
  renderPrintHistoryCard();

  try {
    await state.client.resetHistoryTotals();
    state.printHistory.lastError = "";
    appendConsole("Print history totals reset.", "warn");
    await loadPrintHistoryTotals({ silent: true });
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.printHistory.lastError = message;
    appendConsole(`Print history totals reset failed: ${message}`, "error");
    renderPrintHistoryCard();
    return false;
  } finally {
    state.printHistory.actionInFlight = false;
    state.printHistory.actionLabel = "";
    renderPrintHistoryCard();
  }
}

function requestPrintHistoryExportCsv() {
  const selected = getPrintHistorySelectionSet();
  const base = getFilteredPrintHistoryJobs();
  const entries = selected.size ? base.filter((entry) => selected.has(entry.uid)) : base;

  if (!entries.length) {
    setPrintHistoryStatusMessage("No history rows available for CSV export.", "warn");
    return false;
  }

  const columns = getPrintHistoryVisibleColumns();
  const headers = ["uid", "file", ...columns, "job_id"];

  const escapeValue = (value) => {
    const text = String(value ?? "");
    if (text.includes('"') || text.includes(",") || text.includes("\n")) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const lines = [headers, ...entries.map((job) => [
    job.uid,
    job.filename || job.displayName,
    ...columns.map((columnKey) => formatPrintHistoryCell(job, columnKey)),
    job.jobId || "",
  ])]
    .map((row) => row.map((value) => escapeValue(value)).join(","))
    .join("\n");

  const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `print-history-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  appendConsole(`Exported ${entries.length} print history entr${entries.length === 1 ? "y" : "ies"} to CSV.`, "info");
  return true;
}

function schedulePrintHistoryRefresh(delayMs = 320) {
  if (printHistoryRefreshTimer) clearTimeout(printHistoryRefreshTimer);

  printHistoryRefreshTimer = setTimeout(() => {
    printHistoryRefreshTimer = null;
    if (!state.client) return;
    void loadPrintHistory({ source: "notify", silent: true });
    void loadPrintHistoryTotals({ silent: true });
  }, Math.max(80, Number(delayMs) || 320));
}

function resetPrintHistoryState({ preserveViewState = true } = {}) {
  const preserved = preserveViewState
    ? {
      searchQuery: state.printHistory.searchQuery,
      statusFilter: state.printHistory.statusFilter,
      sortMode: state.printHistory.sortMode,
      pageSize: state.printHistory.pageSize,
      visibleColumns: getPrintHistoryVisibleColumns(),
      timeInDays: !!state.printHistory.timeInDays,
      lengthInKilometers: !!state.printHistory.lengthInKilometers,
      loadedLimit: state.printHistory.loadedLimit,
      statusViewMode: state.printHistory.statusViewMode,
      statusValueMode: state.printHistory.statusValueMode,
      trendMode: state.printHistory.trendMode,
    }
    : null;

  state.printHistory = createDefaultPrintHistoryState();

  if (preserved) {
    state.printHistory.searchQuery = String(preserved.searchQuery || "").trim();
    state.printHistory.statusFilter = normalizePrintHistoryStatusFilter(preserved.statusFilter);
    state.printHistory.sortMode = normalizePrintHistorySort(preserved.sortMode);
    state.printHistory.pageSize = normalizePrintHistoryPageSize(preserved.pageSize);
    state.printHistory.visibleColumns = normalizePrintHistoryVisibleColumns(preserved.visibleColumns);
    state.printHistory.timeInDays = !!preserved.timeInDays;
    state.printHistory.lengthInKilometers = !!preserved.lengthInKilometers;
    state.printHistory.loadedLimit = normalizePrintHistoryLoadLimit(preserved.loadedLimit);
    state.printHistory.statusViewMode = normalizePrintHistoryStatusView(preserved.statusViewMode);
    state.printHistory.statusValueMode = normalizePrintHistoryStatusValue(preserved.statusValueMode);
    state.printHistory.trendMode = normalizePrintHistoryTrendMode(preserved.trendMode);
  }

  renderPrintHistoryCard();
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
    if (!state.client) {
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

  if (viewName === "history") {
    if (!state.client || state.connectionStatus !== "connected") {
      renderPrintHistoryCard();
      return;
    }

    if (!(state.printHistory.jobs || []).length && !state.printHistory.isLoading) {
      await loadPrintHistory({ source: "view", silent: true });
    } else {
      renderPrintHistoryCard();
    }

    return;
  }
  if (viewName === "timelapse") {
    renderTimelapseControlView();
    renderTimelapseMediaCard();

    if (!state.client || state.connectionStatus !== "connected") {
      return;
    }

    if (!state.timelapseMedia.files.length && !state.timelapseMedia.directories.length && !state.timelapseMedia.isLoading) {
      await loadTimelapseMediaFiles({ source: "view", silent: true });
    } else {
      state.timelapseMedia.currentDirectory = normalizeTimelapseMediaCurrentDirectory(state.timelapseMedia.currentDirectory);
      renderTimelapseMediaCard();
    }

    await refreshTimelapseControlState({ silent: true });
    return;
  }
  if (viewName === "spoolman") {
    renderSpoolmanView();
    renderSpoolmanSettingsCard();

    if (!state.client || state.connectionStatus !== "connected") {
      return;
    }

    await refreshSpoolmanState({ source: "view", silent: true });
    return;
  }
  if (viewName === "pretty-gcode") {
    updatePrettyGcodeToolhead({ skipRender: true });

    if (isPrettySimulationMode() && state.prettyGcode.segments.length) {
      renderPrettyGcodeView();
      return;
    }

    if (!state.client || state.connectionStatus !== "connected") {
      renderPrettyGcodeView();
      return;
    }

    const activeFilename = normalizeGcodePath(
      state.printStatus.lastPrintStats?.filename || state.printStatus.filename || state.prettyGcode.activeFile
    );

    if (!activeFilename) {
      await syncPrettyGcodeForActiveFile("");
      renderPrettyGcodeView();
      return;
    }

    await syncPrettyGcodeForActiveFile(activeFilename);
    return;
  }

  if (viewName === "settings") {
    renderTimelapseSettingsCard();

    if (state.connectionStatus === "connected") {
      void refreshTimelapseSettings({ silent: true });
    }

    return;
  }

  if (viewName !== "configuration") return;

  if (!state.client) {
    setConfigStatus("Connect to Moonraker from Settings to manage configuration files.", "warn");
    return;
  }

  if (!state.config.files.length) {  await loadConfigFiles({ preserveSelection: true });
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

    appendConsole(`Config uploaded: ${file.name}`, "info");  await loadConfigFiles({ preserveSelection: true });

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
    appendConsole(`Config file created: ${normalizedPath}`, "info");  await loadConfigFiles({ preserveSelection: true });
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

async function runButtonPendingAction(button, action, { pendingText = "", minPendingMs = 250 } = {}) {
  if (typeof action !== "function") return false;

  const isButton = button instanceof HTMLButtonElement;
  if (isButton && button.dataset.actionPending === "true") {
    return false;
  }

  const originalText = isButton ? button.textContent : "";
  const startedAt = Date.now();

  if (isButton) {
    button.dataset.actionPending = "true";
    button.classList.add("is-pending");
    button.setAttribute("aria-busy", "true");
    if (pendingText) {
      button.textContent = pendingText;
    }
  }

  try {
    return await action();
  } finally {
    const elapsed = Date.now() - startedAt;
    const minDelay = Math.max(0, Number(minPendingMs) || 0);
    if (elapsed < minDelay) {
      await new Promise((resolve) => {
        setTimeout(resolve, minDelay - elapsed);
      });
    }

    if (isButton && button.isConnected) {
      if (pendingText) {
        button.textContent = originalText;
      }
      button.classList.remove("is-pending");
      button.removeAttribute("aria-busy");
      delete button.dataset.actionPending;
    }
  }
}

function wireEvents() {
  if (hasWiredGlobalEvents) return;
  hasWiredGlobalEvents = true;
  els.navItems.forEach((btn) => {
    btn.addEventListener("click", async () => {
      await requestViewChange(btn.dataset.view);
    });
  });

  els.settingsSubnavItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      const anchor = normalizeSettingsAnchor(item.dataset.settingsAnchor);
      if (!anchor) return;

      const scrolled = scrollSettingsSectionIntoView(anchor);
      if (!scrolled) {
        setActiveSettingsSubnavAnchor(anchor);
      }
    });
  });

  els.timelapseServiceRefresh?.addEventListener("click", async () => {
    await refreshTimelapseControlState();
  });

  els.timelapseControlMode?.addEventListener("change", () => {
    state.timelapse.controlMode = normalizeTimelapseControlMode(els.timelapseControlMode?.value);
    localStorage.setItem(TIMELAPSE_CONTROL_MODE_STORAGE_KEY, state.timelapse.controlMode);
    state.timelapse.resolvedServiceName = "";
    state.timelapse.serviceSubState = "";
    state.timelapse.serviceState = state.timelapse.controlMode === TIMELAPSE_CONTROL_MODE_EXTERNAL ? "external" : "unknown";
    state.timelapse.lastError = "";
    state.timelapse.statusMessage = state.timelapse.controlMode === TIMELAPSE_CONTROL_MODE_EXTERNAL
      ? "External recorder mode enabled. Moonraker service checks are disabled."
      : "Connect to Moonraker to query service state.";
    if (state.timelapse.controlMode === TIMELAPSE_CONTROL_MODE_EXTERNAL) {
      appendConsole("Timelapse switched to External Recorder mode.", "info");
    }
    renderTimelapseControlView();
    void refreshTimelapseControlState({ silent: true });
  });

  els.timelapseServiceName?.addEventListener("change", () => {
    state.timelapse.serviceName = normalizeTimelapseServiceName(els.timelapseServiceName?.value) || TIMELAPSE_SERVICE_NAME_DEFAULT;
    state.timelapse.resolvedServiceName = "";
    localStorage.setItem(TIMELAPSE_SERVICE_NAME_STORAGE_KEY, state.timelapse.serviceName);
    state.timelapse.lastError = "";
    renderTimelapseControlView();
    if (state.connectionStatus === "connected") {
      void refreshTimelapseControlState({ silent: true });
    }
  });

  els.timelapseServiceName?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    els.timelapseServiceName?.blur();
    els.timelapseServiceName?.dispatchEvent(new Event("change"));
  });

  els.timelapseServiceStart?.addEventListener("click", async () => {
    await runTimelapseServiceAction("start");
  });

  els.timelapseServiceRestart?.addEventListener("click", async () => {
    await runTimelapseServiceAction("restart");
  });

  els.timelapseServiceStop?.addEventListener("click", async () => {
    await runTimelapseServiceAction("stop");
  });

  els.timelapseMediaRefresh?.addEventListener("click", async () => {
    await loadTimelapseMediaFiles({ source: "user" });
  });

  els.timelapseMediaNewFolder?.addEventListener("click", async () => {
    await requestTimelapseMediaCreateFolder();
  });

  els.timelapseMediaSort?.addEventListener("change", () => {
    state.timelapseMedia.sortMode = normalizeTimelapseMediaSort(els.timelapseMediaSort?.value);
    persistTimelapseMediaViewState();
    renderTimelapseMediaCard();
  });

  els.spoolmanRefresh?.addEventListener("click", async () => {
    await refreshSpoolmanState({ source: "refresh" });
  });

  els.spoolmanChangeSpool?.addEventListener("click", () => {
    renderSpoolmanSelectOptions();
    if (els.spoolmanSelectDialog && typeof els.spoolmanSelectDialog.showModal === "function") {
      els.spoolmanSelectDialog.showModal();
    }
  });

  els.spoolmanSelectClose?.addEventListener("click", () => {
    els.spoolmanSelectDialog?.close();
  });

  els.spoolmanSelectDialog?.addEventListener("click", (event) => {
    if (event.target === els.spoolmanSelectDialog) {
      els.spoolmanSelectDialog?.close();
    }
  });

  els.spoolmanSelectApply?.addEventListener("click", async () => {
    const value = Number(els.spoolmanSelectId?.value);
    if (!Number.isFinite(value) || value <= 0) {
      state.spoolman.statusMessage = "Select a valid spool before applying.";
      state.spoolman.lastError = "Invalid spool ID.";
      renderSpoolmanView();
      renderSpoolmanSettingsCard();
      return;
    }
    await setSpoolmanActiveSpool(Math.round(value));
    els.spoolmanSelectDialog?.close();
  });

  els.spoolmanSelectClear?.addEventListener("click", async () => {
    await setSpoolmanActiveSpool(null);
    els.spoolmanSelectDialog?.close();
  });

  const syncSpoolmanSettingsPreview = () => {
    const draft = getSpoolmanSettingsDraftFromInputs();
    state.spoolman.settings = {
      ...draft.settings,
      selectedCardFields: [...draft.settings.selectedCardFields],
    };
    renderSpoolmanView();
    renderSpoolmanSettingsCard();
  };

  [
    els.settingsSpoolmanAutoDialog,
    els.settingsSpoolmanAutoCamera,
    els.settingsSpoolmanPreferDeviceCamera,
    els.settingsSpoolmanAutoSelectOnMatch,
    els.settingsSpoolmanWarnNotEnoughFilament,
    els.settingsSpoolmanWarnFilamentMismatch,
    els.settingsSpoolmanRemainingUnit,
  ].forEach((input) => {
    input?.addEventListener("change", syncSpoolmanSettingsPreview);
  });

  (els.settingsSpoolmanCardFieldToggles || []).forEach((input) => {
    input?.addEventListener("change", () => {
      syncSpoolmanCardFieldApplyButton(state.spoolman.settings?.selectedCardFields);
    });
  });

  els.settingsSpoolmanFieldsApply?.addEventListener("click", () => {
    const selectedCardFields = getSelectedSpoolmanCardFieldsFromInputs();
    state.spoolman.settings = {
      ...state.spoolman.settings,
      selectedCardFields: [...selectedCardFields],
    };
    localStorage.setItem(SPOOLMAN_CARD_FIELDS_STORAGE_KEY, JSON.stringify(state.spoolman.settings.selectedCardFields));
    state.spoolman.statusMessage = "Spoolman card fields applied.";
    state.spoolman.lastError = "";
    renderSpoolmanView();
    renderSpoolmanSettingsCard();
  });

  els.settingsSpoolmanReset?.addEventListener("click", () => {
    state.spoolman.settings = {
      ...SPOOLMAN_SETTINGS_DEFAULTS,
      selectedCardFields: [...SPOOLMAN_SETTINGS_DEFAULTS.selectedCardFields],
    };
    state.spoolman.statusMessage = "Spoolman settings reset to defaults.";
    state.spoolman.lastError = "";
    renderSpoolmanView();
    renderSpoolmanSettingsCard();
  });

  window.addEventListener("scroll", () => {
    if (state.activeView !== "settings") return;
    queueSettingsSubnavSync();
  }, { passive: true });

  window.addEventListener("resize", () => {
    handleDashboardViewportResize();
  });

  els.sidebarToggle?.addEventListener("click", toggleSidebar);
  els.machineSideToggle?.addEventListener("click", toggleMachineSideColumn);

  els.toolsMenuToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    setToolsMenuOpen(!state.toolsMenu.open);
  });

  els.toolsMenuClose?.addEventListener("click", () => {
    setToolsMenuOpen(false, { refresh: false });
  });

  els.toolsDrawerBackdrop?.addEventListener("click", () => {
    setToolsMenuOpen(false, { refresh: false });
  });

  els.toolsDrawer?.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const actionButton = target.closest("[data-tools-action]");
    if (actionButton instanceof HTMLButtonElement && !actionButton.disabled) {
      await runToolsMenuAction(actionButton.dataset.toolsAction);
      return;
    }

    const serviceButton = target.closest("[data-tools-service-action]");
    if (serviceButton instanceof HTMLButtonElement && !serviceButton.disabled) {
      await runToolsServiceAction(serviceButton.dataset.toolsServiceName, serviceButton.dataset.toolsServiceAction);
      return;
    }

    const powerButton = target.closest("[data-tools-power-action]");
    if (powerButton instanceof HTMLButtonElement && !powerButton.disabled) {
      await runToolsPowerAction(powerButton.dataset.toolsPowerDevice, powerButton.dataset.toolsPowerAction);
    }
  });

  els.statusClearFile?.addEventListener("click", () => {
    clearStatusFileFromCard();
  });

  els.statusPrintPause?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    await runButtonPendingAction(button, () => requestJobsPrintAction("pause"), {
      pendingText: "Pausing...",
      minPendingMs: 300,
    });
  });

  els.statusPrintResume?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    await runButtonPendingAction(button, () => requestJobsPrintAction("resume"), {
      pendingText: "Resuming...",
      minPendingMs: 300,
    });
  });

  els.statusPrintCancel?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    await runButtonPendingAction(button, () => requestJobsPrintAction("cancel"), {
      pendingText: "Canceling...",
      minPendingMs: 300,
    });
  });

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

  els.controlsEndstopsQuery?.addEventListener("click", async () => {
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

  const loadCompleteHistory = async () => {
    state.printHistory.loadedLimit = 0;
    persistPrintHistoryViewState();
    await loadPrintHistory({ source: "user", forceLimit: 0 });
  };

  els.historyRefresh?.addEventListener("click", async () => {
    await loadPrintHistory({ source: "user" });
  });

  els.historyLoadAll?.addEventListener("click", async () => {
    await loadCompleteHistory();
  });

  els.historyStatsLoadAll?.addEventListener("click", async () => {
    await loadCompleteHistory();
  });

  els.historyStatusViewChart?.addEventListener("click", () => {
    state.printHistory.statusViewMode = "chart";
    persistPrintHistoryViewState();
    renderPrintHistoryCard();
  });

  els.historyStatusViewTable?.addEventListener("click", () => {
    state.printHistory.statusViewMode = "table";
    persistPrintHistoryViewState();
    renderPrintHistoryCard();
  });

  els.historyStatusValueJobs?.addEventListener("click", () => {
    state.printHistory.statusValueMode = "jobs";
    persistPrintHistoryViewState();
    renderPrintHistoryCard();
  });

  els.historyStatusValueFilament?.addEventListener("click", () => {
    state.printHistory.statusValueMode = "filament";
    persistPrintHistoryViewState();
    renderPrintHistoryCard();
  });

  els.historyStatusValueTime?.addEventListener("click", () => {
    state.printHistory.statusValueMode = "time";
    persistPrintHistoryViewState();
    renderPrintHistoryCard();
  });

  els.historyTrendModeFilament?.addEventListener("click", () => {
    state.printHistory.trendMode = "filament_usage";
    persistPrintHistoryViewState();
    renderPrintHistoryCard();
  });

  els.historyTrendModePrinttime?.addEventListener("click", () => {
    state.printHistory.trendMode = "printtime_avg";
    persistPrintHistoryViewState();
    renderPrintHistoryCard();
  });

  els.historyExportCsv?.addEventListener("click", () => {
    requestPrintHistoryExportCsv();
  });

  els.historyRemoveSelected?.addEventListener("click", async () => {
    await requestPrintHistoryDeleteSelected();
  });

  els.historyRemoveAll?.addEventListener("click", async () => {
    await requestPrintHistoryDeleteAll();
  });

  els.historyResetStats?.addEventListener("click", async () => {
    await requestPrintHistoryResetTotals();
  });

  els.historyTimeDays?.addEventListener("change", () => {
    state.printHistory.timeInDays = !!els.historyTimeDays?.checked;
    persistPrintHistoryViewState();
    renderPrintHistoryCard();
  });

  els.historyLengthKm?.addEventListener("change", () => {
    state.printHistory.lengthInKilometers = !!els.historyLengthKm?.checked;
    persistPrintHistoryViewState();
    renderPrintHistoryCard();
  });

  els.historySearch?.addEventListener("input", () => {
    state.printHistory.searchQuery = String(els.historySearch?.value || "").trim();
    state.printHistory.page = 1;
    persistPrintHistoryViewState();
    renderPrintHistoryCard();
  });

  els.historySearch?.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    state.printHistory.searchQuery = "";
    state.printHistory.page = 1;
    if (els.historySearch) {
      els.historySearch.value = "";
      els.historySearch.blur();
    }
    persistPrintHistoryViewState();
    renderPrintHistoryCard();
  });

  els.historyStatusFilter?.addEventListener("change", () => {
    state.printHistory.statusFilter = normalizePrintHistoryStatusFilter(els.historyStatusFilter?.value);
    state.printHistory.page = 1;
    persistPrintHistoryViewState();
    renderPrintHistoryCard();
  });

  els.historySort?.addEventListener("change", () => {
    state.printHistory.sortMode = normalizePrintHistorySort(els.historySort?.value);
    state.printHistory.page = 1;
    persistPrintHistoryViewState();
    renderPrintHistoryCard();
  });

  els.historyPageSize?.addEventListener("change", () => {
    state.printHistory.pageSize = normalizePrintHistoryPageSize(els.historyPageSize?.value);
    state.printHistory.page = 1;
    persistPrintHistoryViewState();
    renderPrintHistoryCard();
  });

  els.historyLoadLimit?.addEventListener("change", async () => {
    state.printHistory.loadedLimit = normalizePrintHistoryLoadLimit(els.historyLoadLimit?.value);
    state.printHistory.page = 1;
    persistPrintHistoryViewState();
    await loadPrintHistory({ source: "user", forceLimit: state.printHistory.loadedLimit });
  });

  els.historyColumnsToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    setPrintHistoryColumnsMenuOpen(!state.printHistory.columnsMenuOpen);
  });

  els.historyPagePrev?.addEventListener("click", () => {
    state.printHistory.page = Math.max(1, Number(state.printHistory.page || 1) - 1);
    renderPrintHistoryCard();
  });

  els.historyPageNext?.addEventListener("click", () => {
    state.printHistory.page = Math.max(1, Number(state.printHistory.page || 1) + 1);
    renderPrintHistoryCard();
  });
  els.prettyGcodeFollow?.addEventListener("change", () => {
    state.prettyGcode.followToolhead = !!els.prettyGcodeFollow?.checked;
    renderPrettyGcodeView();
  });
  els.prettyGcodeShowMirror?.addEventListener("change", () => {
    state.prettyGcode.showMirror = !!els.prettyGcodeShowMirror?.checked;
    requestPrettyGcodeThreeRender();
    if (isPrettyGcodeViewerVisible()) {
      renderPrettyGcodeView();
    }
  });

  els.prettyGcodeShowNozzle?.addEventListener("change", () => {
    state.prettyGcode.showNozzle = !!els.prettyGcodeShowNozzle?.checked;
    requestPrettyGcodeThreeRender();
    if (isPrettyGcodeViewerVisible()) {
      renderPrettyGcodeView();
    }
  });

  els.prettyGcodeOrbitIdle?.addEventListener("change", () => {
    state.prettyGcode.orbitWhenIdle = !!els.prettyGcodeOrbitIdle?.checked;
    prettyGcodeThreeState.lastInteractionMs = Date.now();
    requestPrettyGcodeThreeRender();
    if (isPrettyGcodeViewerVisible()) {
      renderPrettyGcodeView();
    }
  });

  els.prettyGcodeReload?.addEventListener("click", async () => {
    await requestPrettyGcodeReload();
  });

  els.prettyGcodeLoadFile?.addEventListener("click", async () => {
    if (!state.client || state.connectionStatus !== "connected") {
      setPrettyGcodeStatus("Connect to Moonraker to browse host GCode files.", "warn");
      return;
    }

    await requestViewChange("files");
    setJobsStatusMessage("Choose a GCode file and click Simulate to load it in KlipperView.", "info");
  });

  els.prettyGcodeLoadInput?.addEventListener("change", async (event) => {
    const input = event.currentTarget;
    const file = input?.files?.[0] || null;
    input.value = "";
    if (!file) return;
    await loadPrettyGcodeSimulationFile(file);
  });

  els.prettyGcodeLive?.addEventListener("click", async () => {
    await requestPrettyGcodeLiveMode();
  });

  els.prettyGcodeRewind?.addEventListener("click", () => {
    stepPrettyGcodeSimulation(-PRETTY_GCODE_SIM_STEP_DELTA);
  });

  els.prettyGcodePlayPause?.addEventListener("click", () => {
    togglePrettyGcodeSimulationPlayback();
  });

  els.prettyGcodeFastForward?.addEventListener("click", () => {
    stepPrettyGcodeSimulation(PRETTY_GCODE_SIM_STEP_DELTA);
  });

  els.prettyGcodeProgress?.addEventListener("input", (event) => {
    if (!isPrettySimulationMode()) return;
    const input = event.currentTarget;
    const raw = Number(input?.value);
    const progress = Number.isFinite(raw) ? raw / 1000 : 0;

    pausePrettyGcodeSimulation({ render: false });
    state.prettyGcode.simulationProgress = clampPrettyGcodeProgress(progress);
    state.prettyGcode.layerSelectionPinned = false;
    updatePrettyGcodeToolhead({ skipRender: true });
    if (isPrettyGcodeViewerVisible()) {
      renderPrettyGcodeView();
    }
  });

  els.prettyGcodeLayerSlider?.addEventListener("pointerdown", () => {
    els.prettyGcodeLayerSlider?.focus();
  });

  els.prettyGcodeLayerSlider?.addEventListener("input", (event) => {
    const input = event.currentTarget;
    const layerNumber = Number(input?.value);
    if (!Number.isFinite(layerNumber)) return;

    setPrettyGcodeLayerSelection(layerNumber - 1, { pin: true, render: false });
    renderPrettyGcodeView();
  });

  els.prettyGcodeLayerSlider?.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    event.preventDefault();
    const step = event.key === "ArrowUp" ? 1 : -1;
    const currentValue = Number(els.prettyGcodeLayerSlider?.value || 1);
    const maxValue = Number(els.prettyGcodeLayerSlider?.max || 1);
    const nextValue = Math.max(1, Math.min(maxValue, currentValue + step));

    setPrettyGcodeLayerSelection(nextValue - 1, { pin: true, render: false });
    renderPrettyGcodeView();
  });

  window.addEventListener("resize", () => {
    if (isPrettyGcodeViewerVisible()) {
      renderPrettyGcodeView();
    }

    if (state.activeView === "history") {
      renderPrintHistoryStatsVisuals();
    }
  });

  els.jobsSortToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    toggleJobsToolbarMenu(els.jobsSortMenu, els.jobsSortToggle);
  });

  els.jobsColumnsToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    toggleJobsToolbarMenu(els.jobsColumnsMenu, els.jobsColumnsToggle);
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
    openFileInputPicker(els.jobsUploadInput);
  });

  els.jobsUploadFolderBtn?.addEventListener("click", () => {
    closeJobsToolbarMenus();
    openFileInputPicker(els.jobsUploadFolderInput);
  });

  els.jobsUploadPrintBtn?.addEventListener("click", () => {
    closeJobsToolbarMenus();
    openFileInputPicker(els.jobsUploadPrintInput);
  });

  els.headerUploadPrintBtn?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    await runButtonPendingAction(button, async () => {
      openFileInputPicker(els.jobsUploadPrintInput);
      return true;
    }, {
      pendingText: "Opening...",
      minPendingMs: 180,
    });
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

  els.jobsCard?.addEventListener("dragenter", (event) => {
    if (!jobsDataTransferHasFiles(event.dataTransfer)) return;
    if (!state.client) return;

    event.preventDefault();
    state.jobs.uploadDragDepth += 1;
    updateJobsDragTarget(true);
  });

  els.jobsCard?.addEventListener("dragover", (event) => {
    if (!jobsDataTransferHasFiles(event.dataTransfer)) return;
    if (!state.client) return;

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

  els.jobsNewFolderDirect?.addEventListener("click", async () => {
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

  els.jobsPause?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    await runButtonPendingAction(button, () => requestJobsPrintAction("pause"), {
      pendingText: "Pausing...",
      minPendingMs: 300,
    });
  });

  els.jobsResume?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    await runButtonPendingAction(button, () => requestJobsPrintAction("resume"), {
      pendingText: "Resuming...",
      minPendingMs: 300,
    });
  });

  els.jobsCancel?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    await runButtonPendingAction(button, () => requestJobsPrintAction("cancel"), {
      pendingText: "Canceling...",
      minPendingMs: 300,
    });
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
    openFileInputPicker(els.configUploadInput);
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

  els.themeCommunityApply?.addEventListener("click", () => {
    const presetId = String(els.themeCommunityPreset?.value || "").trim();
    const applied = applyThemePresetById(presetId);
    if (applied) {
      const selectedLabel = String(els.themeCommunityPreset?.selectedOptions?.[0]?.textContent || presetId).trim();
      appendConsole(`Theme preset applied: ${selectedLabel}`, "info");
    }
  });

  els.themePaletteReset?.addEventListener("click", () => {
    resetThemePaletteToBaseTheme();
    appendConsole("Theme colors reset to the current base theme.", "info");
  });

  INTERFACE_THEME_COLOR_FIELDS.forEach((field) => {
    const input = els[field.elKey];
    if (!input) return;

    input.addEventListener("input", () => {
      setThemePaletteColor(field.key, input.value);
    });
  });

  els.interfaceBgImageEnabled?.addEventListener("change", () => {
    state.interface.backgroundImageEnabled = !!els.interfaceBgImageEnabled.checked;
    state.interface.backgroundImageUrl = normalizeInterfaceBackgroundImageUrl(els.interfaceBgImageUrl?.value || "");

    persistInterfaceBackgroundImageSettings();
    applyInterfaceSettings();
    syncInterfaceBackgroundImageControls();
  });

  els.interfaceBgImageApply?.addEventListener("click", () => {
    state.interface.backgroundImageEnabled = !!els.interfaceBgImageEnabled?.checked;
    state.interface.backgroundImageUrl = normalizeInterfaceBackgroundImageUrl(els.interfaceBgImageUrl?.value || "");
    persistInterfaceBackgroundImageSettings();
    applyInterfaceSettings();
    syncInterfaceBackgroundImageControls();
    appendConsole("Background image settings applied.", "info");
  });

  els.interfaceBgImageUrl?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    els.interfaceBgImageApply?.click();
  });

  els.interfaceBgImageClear?.addEventListener("click", () => {
    state.interface.backgroundImageEnabled = false;
    state.interface.backgroundImageUrl = "";
    persistInterfaceBackgroundImageSettings();
    applyInterfaceSettings();
    syncInterfaceBackgroundImageControls();
    appendConsole("Background image cleared.", "info");
  });

  els.settingsConsoleDirection?.addEventListener("change", () => {
    state.console.direction = normalizeConsoleDirection(els.settingsConsoleDirection?.value);
    persistConsoleDisplaySettings();
    applyConsoleDisplaySettings();
  });

  els.settingsConsoleEntryDesign?.addEventListener("change", () => {
    state.console.entryDesign = normalizeConsoleEntryDesign(els.settingsConsoleEntryDesign?.value);
    persistConsoleDisplaySettings();
    applyConsoleDisplaySettings();
  });

  els.settingsConsoleHeight?.addEventListener("change", () => {
    state.console.height = normalizeConsoleHeight(els.settingsConsoleHeight?.value);
    persistConsoleDisplaySettings();
    applyConsoleDisplaySettings();
    syncConsoleSettingsControls();
  });

  els.settingsConsoleHideTemps?.addEventListener("change", () => {
    setConsoleHideTemps(!!els.settingsConsoleHideTemps?.checked);
  });

  els.settingsConsoleHideTimelapse?.addEventListener("change", () => {
    setConsoleHideTimelapse(!!els.settingsConsoleHideTimelapse?.checked);
  });

  els.settingsConsoleFilterAdd?.addEventListener("click", () => {
    openConsoleFilterEditor();
  });

  els.settingsConsoleFilterCancel?.addEventListener("click", () => {
    resetConsoleFilterEditor();
  });

  els.settingsConsoleFilterSave?.addEventListener("click", () => {
    saveConsoleFilterFromEditor();
  });

  els.settingsConsoleFilterRegex?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    saveConsoleFilterFromEditor();
  });

  els.settingsMacrosCategoryAdd?.addEventListener("click", () => {
    addMacroCategory();
  });

  els.settingsMacrosSearch?.addEventListener("input", () => {
    state.macros.searchQuery = String(els.settingsMacrosSearch?.value || "");
    renderMacroSettingsMacroList();
  });

  els.settingsMacrosSearch?.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    state.macros.searchQuery = "";
    if (els.settingsMacrosSearch) {
      els.settingsMacrosSearch.value = "";
      els.settingsMacrosSearch.blur();
    }
    renderMacroSettingsMacroList();
  });

  els.settingsMacrosAllOn?.addEventListener("click", () => {
    setSelectedMacrosVisibility(true);
  });

  els.settingsMacrosAllOff?.addEventListener("click", () => {
    setSelectedMacrosVisibility(false);
  });

  els.settingsMacroColor?.addEventListener("input", () => {
    els.settingsMacroColor.dataset.mode = "custom";
  });

  els.settingsMacroColorReset?.addEventListener("click", () => {
    if (!els.settingsMacroColor) return;
    els.settingsMacroColor.dataset.mode = "default";
    els.settingsMacroColor.value = state.macros.dialogColorDefault || getMacroDialogDefaultColor();
  });

  els.settingsMacroClose?.addEventListener("click", () => {
    closeMacroSettingsDialog();
  });

  els.settingsMacroCancel?.addEventListener("click", () => {
    closeMacroSettingsDialog();
  });

  els.settingsMacroSave?.addEventListener("click", () => {
    saveMacroSettingsDialog();
  });

  els.settingsMacroDialog?.addEventListener("click", (event) => {
    if (event.target === els.settingsMacroDialog) {
      closeMacroSettingsDialog();
    }
  });

  els.settingsMacroDialog?.addEventListener("close", () => {
    state.macros.dialogMacroName = "";
  });

  els.settingsDashboardViewportButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const viewport = normalizeDashboardViewport(button.dataset.dashboardViewport);
      state.dashboard.settingsViewport = viewport;
      renderSettingsDashboardLayout();
    });
  });

  els.settingsDashboardReset?.addEventListener("click", () => {
    const viewport = normalizeDashboardViewport(state.dashboard.settingsViewport);
    resetDashboardLayoutForViewport(viewport);
    renderSettingsDashboardLayout();
    appendConsole(`Dashboard layout reset for ${viewport}.`, "info");
  });

  els.settingsWarningCpuThrottled?.addEventListener("change", () => {
    state.warnings.warnOnCpuThrottled = !!els.settingsWarningCpuThrottled?.checked;
    persistWarningsSettings();
  });

  els.settingsWarningStepperDriverOverheating?.addEventListener("change", () => {
    state.warnings.warnOnStepperDriverOverheating = !!els.settingsWarningStepperDriverOverheating?.checked;
    persistWarningsSettings();
  });

  els.settingsWarningReset?.addEventListener("click", () => {
    state.warnings = normalizeWarningsSettings(WARNINGS_SETTINGS_DEFAULTS);
    persistWarningsSettings();
    syncWarningsSettingsControls();
    appendConsole("Warning settings reset.", "info");
  });
  els.settingsThermalPresetAdd?.addEventListener("click", () => {
    openThermalPresetDialog();
  });

  els.settingsThermalPresetClose?.addEventListener("click", () => {
    closeThermalPresetDialog();
  });

  els.settingsThermalPresetCancel?.addEventListener("click", () => {
    closeThermalPresetDialog();
  });

  els.settingsThermalPresetSave?.addEventListener("click", () => {
    saveThermalPresetDialog();
  });

  els.settingsThermalPresetName?.addEventListener("input", () => {
    if (!state.thermalPresetDialogDraft) return;
    state.thermalPresetDialogDraft.name = String(els.settingsThermalPresetName?.value || "").trim().slice(0, 64);
  });

  els.settingsThermalPresetGcode?.addEventListener("input", () => {
    if (!state.thermalPresetDialogDraft) return;
    state.thermalPresetDialogDraft.gcode = String(els.settingsThermalPresetGcode?.value || "").trim().slice(0, 4000);
  });

  els.settingsThermalPresetHotendActive?.addEventListener("change", () => {
    if (!state.thermalPresetDialogDraft) return;
    state.thermalPresetDialogDraft.values.hotend.active = !!els.settingsThermalPresetHotendActive?.checked;
    syncThermalPresetDialogInputs();
  });

  els.settingsThermalPresetBedActive?.addEventListener("change", () => {
    if (!state.thermalPresetDialogDraft) return;
    state.thermalPresetDialogDraft.values.bed.active = !!els.settingsThermalPresetBedActive?.checked;
    syncThermalPresetDialogInputs();
  });

  els.settingsThermalPresetHotendValue?.addEventListener("input", () => {
    if (!state.thermalPresetDialogDraft) return;
    state.thermalPresetDialogDraft.values.hotend.value = normalizeThermalPresetTemperature(
      els.settingsThermalPresetHotendValue?.value,
      "hotend"
    );
  });

  els.settingsThermalPresetBedValue?.addEventListener("input", () => {
    if (!state.thermalPresetDialogDraft) return;
    state.thermalPresetDialogDraft.values.bed.value = normalizeThermalPresetTemperature(
      els.settingsThermalPresetBedValue?.value,
      "bed"
    );
  });

  [els.settingsThermalPresetHotendValue, els.settingsThermalPresetBedValue].forEach((input) => {
    input?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      saveThermalPresetDialog();
    });
  });

  els.settingsThermalPresetDialog?.addEventListener("click", (event) => {
    if (event.target === els.settingsThermalPresetDialog) {
      closeThermalPresetDialog();
    }
  });

  els.settingsThermalPresetDialog?.addEventListener("close", () => {
    state.thermalPresetDialogPresetId = null;
    state.thermalPresetDialogDraft = null;
  });

  els.settingsTimelapseRefresh?.addEventListener("click", async () => {
    await refreshTimelapseSettings({ silent: false });
  });

  els.settingsTimelapseEnabled?.addEventListener("change", () => {
    void saveTimelapseSettingsPatch({ enabled: !!els.settingsTimelapseEnabled?.checked });
  });

  els.settingsTimelapseAutorender?.addEventListener("change", () => {
    void saveTimelapseSettingsPatch({ autorender: !!els.settingsTimelapseAutorender?.checked });
  });

  els.settingsTimelapseCamera?.addEventListener("change", () => {
    const camera = String(els.settingsTimelapseCamera?.value || "").trim();
    void saveTimelapseSettingsPatch({ camera: camera || null });
  });

  els.settingsTimelapseMode?.addEventListener("change", () => {
    const mode = normalizeTimelapseSettingsMode(els.settingsTimelapseMode?.value);
    void saveTimelapseSettingsPatch({ mode });
  });

  els.settingsTimelapseHyperlapseCycle?.addEventListener("change", () => {
    saveTimelapseNumberSettingFromInput("hyperlapse_cycle", els.settingsTimelapseHyperlapseCycle);
  });

  els.settingsTimelapsePreviewImage?.addEventListener("change", () => {
    void saveTimelapseSettingsPatch({ previewimage: !!els.settingsTimelapsePreviewImage?.checked });
  });

  els.settingsTimelapseSaveFrames?.addEventListener("change", () => {
    void saveTimelapseSettingsPatch({ saveframes: !!els.settingsTimelapseSaveFrames?.checked });
  });

  els.settingsTimelapseStreamDelayCompensation?.addEventListener("change", () => {
    saveTimelapseNumberSettingFromInput("stream_delay_compensation", els.settingsTimelapseStreamDelayCompensation);
  });

  els.settingsTimelapseGcodeVerbose?.addEventListener("change", () => {
    void saveTimelapseSettingsPatch({ gcode_verbose: !!els.settingsTimelapseGcodeVerbose?.checked });
  });

  els.settingsTimelapseParkhead?.addEventListener("change", () => {
    void saveTimelapseSettingsPatch({ parkhead: !!els.settingsTimelapseParkhead?.checked });
  });

  els.settingsTimelapseParkpos?.addEventListener("change", () => {
    const parkpos = normalizeTimelapseSettingsParkpos(els.settingsTimelapseParkpos?.value);
    void saveTimelapseSettingsPatch({ parkpos });
  });

  els.settingsTimelapseParkCustomPosX?.addEventListener("change", () => {
    saveTimelapseNumberSettingFromInput("park_custom_pos_x", els.settingsTimelapseParkCustomPosX);
  });

  els.settingsTimelapseParkCustomPosY?.addEventListener("change", () => {
    saveTimelapseNumberSettingFromInput("park_custom_pos_y", els.settingsTimelapseParkCustomPosY);
  });

  els.settingsTimelapseParkCustomPosDz?.addEventListener("change", () => {
    saveTimelapseNumberSettingFromInput("park_custom_pos_dz", els.settingsTimelapseParkCustomPosDz);
  });

  els.settingsTimelapseParkTravelSpeed?.addEventListener("change", () => {
    saveTimelapseNumberSettingFromInput("park_travel_speed", els.settingsTimelapseParkTravelSpeed);
  });

  els.settingsTimelapseFwRetract?.addEventListener("change", () => {
    void saveTimelapseSettingsPatch({ fw_retract: !!els.settingsTimelapseFwRetract?.checked });
  });

  els.settingsTimelapseParkRetractSpeed?.addEventListener("change", () => {
    saveTimelapseNumberSettingFromInput("park_retract_speed", els.settingsTimelapseParkRetractSpeed);
  });

  els.settingsTimelapseParkRetractDistance?.addEventListener("change", () => {
    saveTimelapseNumberSettingFromInput("park_retract_distance", els.settingsTimelapseParkRetractDistance);
  });

  els.settingsTimelapseParkExtrudeSpeed?.addEventListener("change", () => {
    saveTimelapseNumberSettingFromInput("park_extrude_speed", els.settingsTimelapseParkExtrudeSpeed);
  });

  els.settingsTimelapseParkExtrudeDistance?.addEventListener("change", () => {
    saveTimelapseNumberSettingFromInput("park_extrude_distance", els.settingsTimelapseParkExtrudeDistance);
  });

  els.settingsTimelapseParkTime?.addEventListener("change", () => {
    saveTimelapseNumberSettingFromInput("park_time", els.settingsTimelapseParkTime);
  });

  els.settingsTimelapseVariableFps?.addEventListener("change", () => {
    void saveTimelapseSettingsPatch({ variable_fps: !!els.settingsTimelapseVariableFps?.checked });
  });

  els.settingsTimelapseTargetLength?.addEventListener("change", () => {
    saveTimelapseNumberSettingFromInput("targetlength", els.settingsTimelapseTargetLength);
  });

  els.settingsTimelapseVariableFpsMin?.addEventListener("change", () => {
    saveTimelapseNumberSettingFromInput("variable_fps_min", els.settingsTimelapseVariableFpsMin);
  });

  els.settingsTimelapseVariableFpsMax?.addEventListener("change", () => {
    saveTimelapseNumberSettingFromInput("variable_fps_max", els.settingsTimelapseVariableFpsMax);
  });

  els.settingsTimelapseOutputFramerate?.addEventListener("change", () => {
    saveTimelapseNumberSettingFromInput("output_framerate", els.settingsTimelapseOutputFramerate);
  });

  els.settingsTimelapseDuplicateLastFrame?.addEventListener("change", () => {
    saveTimelapseNumberSettingFromInput("duplicatelastframe", els.settingsTimelapseDuplicateLastFrame);
  });

  els.settingsTimelapseConstantRateFactor?.addEventListener("change", () => {
    saveTimelapseNumberSettingFromInput("constant_rate_factor", els.settingsTimelapseConstantRateFactor);
  });

  els.settingsTimelapsePixelformat?.addEventListener("change", () => {
    void saveTimelapseSettingsPatch({ pixelformat: String(els.settingsTimelapsePixelformat?.value || "").trim() });
  });

  els.settingsTimelapseTimeFormatCode?.addEventListener("change", () => {
    void saveTimelapseSettingsPatch({ time_format_code: String(els.settingsTimelapseTimeFormatCode?.value || "").trim() });
  });

  els.settingsTimelapseExtraOutputParams?.addEventListener("change", () => {
    void saveTimelapseSettingsPatch({ extraoutputparams: String(els.settingsTimelapseExtraOutputParams?.value || "") });
  });

  els.settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const url = els.moonrakerUrl.value.trim();
    if (!url) return;

    state.moonrakerUrl = url;
    state.interface.compact = els.interfaceCompact.checked;
    state.interface.density = INTERFACE_DENSITIES.includes(els.interfaceDensity.value) ? els.interfaceDensity.value : "comfortable";
    state.interface.backgroundImageEnabled = !!els.interfaceBgImageEnabled?.checked;
    state.interface.backgroundImageUrl = normalizeInterfaceBackgroundImageUrl(els.interfaceBgImageUrl?.value || "");
    state.warnings.warnOnCpuThrottled = !!els.settingsWarningCpuThrottled?.checked;
    state.warnings.warnOnStepperDriverOverheating = !!els.settingsWarningStepperDriverOverheating?.checked;
    state.dashboard.showPrintProgress = els.dashShowPrintProgress?.checked ?? state.dashboard.showPrintProgress;
    state.dashboard.showTemperatures = els.dashShowTemperatures?.checked ?? state.dashboard.showTemperatures;
    state.dashboard.showMotion = els.dashShowMotion?.checked ?? state.dashboard.showMotion;
    state.dashboard.showQuickCommands = els.dashShowQuickCommands?.checked ?? state.dashboard.showQuickCommands;
    state.dashboard.showMacros = els.dashShowMacros?.checked ?? state.dashboard.showMacros;
    state.dashboard.showRunoutSensors = els.dashShowRunoutSensors?.checked ?? state.dashboard.showRunoutSensors;
    state.dashboard.showMainCamera = els.dashShowMainCamera?.checked ?? state.dashboard.showMainCamera;
    state.dashboard.showToolheadCamera = els.dashShowToolheadCamera?.checked ?? state.dashboard.showToolheadCamera;
    state.dashboard.showConsole = els.dashShowConsole?.checked ?? state.dashboard.showConsole;
    state.dashboard.showKlipperView = els.dashShowKlipperView?.checked ?? state.dashboard.showKlipperView;

    state.camera.enabled = els.cameraEnabled.checked;
    state.camera.url = els.cameraUrl.value.trim();
    state.camera.renderMode = els.cameraRenderMode.value === CAMERA_MODES.IFRAME ? CAMERA_MODES.IFRAME : CAMERA_MODES.IMAGE;

    state.toolheadCamera.enabled = els.toolheadCameraEnabled.checked;
    state.toolheadCamera.url = els.toolheadCameraUrl.value.trim();
    state.toolheadCamera.renderMode = els.toolheadCameraRenderMode.value === CAMERA_MODES.IFRAME ? CAMERA_MODES.IFRAME : CAMERA_MODES.IMAGE;
    const spoolmanDraft = getSpoolmanSettingsDraftFromInputs();
    state.spoolman.enabled = true;
    state.spoolman.serverUrl = "";
    state.spoolman.apiToken = "";
    state.spoolman.settings = {
      ...spoolmanDraft.settings,
      selectedCardFields: [...spoolmanDraft.settings.selectedCardFields],
    };
    state.spoolman.connectionMode = SPOOLMAN_CONNECTION_PROXY;
    state.spoolman.connectionState = "unknown";
    state.spoolman.healthState = "unknown";
    state.spoolman.lastError = "";
    state.spoolman.statusMessage = "Spoolman settings saved. Use Refresh to verify.";

    localStorage.setItem("moonraker_url", state.moonrakerUrl);
    persistInterfaceThemeSettings();
    persistInterfaceBackgroundImageSettings();
    localStorage.setItem("interface_compact", String(state.interface.compact));
    localStorage.setItem("interface_density", state.interface.density);
    localStorage.setItem("interface_sidebar_collapsed", String(state.interface.sidebarCollapsed));
    localStorage.setItem(MACHINE_SIDE_COLLAPSED_STORAGE_KEY, String(state.interface.machineSideCollapsed));
    persistWarningsSettings();
    persistDashboardVisibilityState();
    persistDashboardLayoutsByViewport();
    state.dashboard.layout = getRuntimeDashboardLegacyLayout();
    localStorage.setItem(DASHBOARD_LAYOUT_LEGACY_STORAGE_KEY, JSON.stringify(state.dashboard.layout));
    localStorage.setItem(DASHBOARD_LAYOUT_LEGACY_ORDER_STORAGE_KEY, JSON.stringify(flattenDashboardLayout(state.dashboard.layout)));
    localStorage.setItem("camera_enabled", String(state.camera.enabled));
    localStorage.setItem("camera_url", state.camera.url);
    localStorage.setItem("camera_render_mode", state.camera.renderMode);
    localStorage.setItem("toolhead_camera_enabled", String(state.toolheadCamera.enabled));
    localStorage.setItem("toolhead_camera_url", state.toolheadCamera.url);
    localStorage.setItem("toolhead_camera_render_mode", state.toolheadCamera.renderMode);
    localStorage.setItem(SPOOLMAN_ENABLED_STORAGE_KEY, "true");
    localStorage.removeItem(SPOOLMAN_SERVER_URL_STORAGE_KEY);
    localStorage.removeItem(SPOOLMAN_API_TOKEN_STORAGE_KEY);
    localStorage.setItem(SPOOLMAN_AUTO_DIALOG_STORAGE_KEY, String(state.spoolman.settings.autoSpoolSelectionDialog));
    localStorage.setItem(SPOOLMAN_AUTO_QR_CAMERA_STORAGE_KEY, String(state.spoolman.settings.autoOpenQRDetectionCamera || ""));
    localStorage.setItem(SPOOLMAN_PREFER_DEVICE_CAMERA_STORAGE_KEY, String(state.spoolman.settings.preferDeviceCamera));
    localStorage.setItem(SPOOLMAN_AUTO_SELECT_ON_MATCH_STORAGE_KEY, String(state.spoolman.settings.autoSelectSpoolOnMatch));
    localStorage.setItem(SPOOLMAN_WARN_NOT_ENOUGH_STORAGE_KEY, String(state.spoolman.settings.warnOnNotEnoughFilament));
    localStorage.setItem(SPOOLMAN_WARN_MISMATCH_STORAGE_KEY, String(state.spoolman.settings.warnOnFilamentTypeMismatch));
    localStorage.setItem(SPOOLMAN_REMAINING_UNIT_STORAGE_KEY, state.spoolman.settings.remainingFilamentUnit);
    localStorage.setItem(SPOOLMAN_CARD_FIELDS_STORAGE_KEY, JSON.stringify(state.spoolman.settings.selectedCardFields));

    applyInterfaceSettings();
    applyDashboardLayout();
    applyDashboardSettings();
    renderCameraCards();
    renderSpoolmanView();
    renderSpoolmanSettingsCard();
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

    const clickedHistoryToolbar = target instanceof Element && !!target.closest("#history-feature-panel");
    const clickedHistoryHead = target instanceof Element && !!target.closest(".history-head-actions");
    if (!clickedHistoryToolbar && !clickedHistoryHead) {
      closePrintHistoryColumnsMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeJobsToolbarMenus();
      closePrintHistoryColumnsMenu();
      if (state.toolsMenu.open) {
        setToolsMenuOpen(false, { refresh: false });
      }
      closeControlsZOffsetSaveDialog();

      if (els.manualProbeDialog?.open && state.manualProbe.isActive) {
        event.preventDefault();
        void requestManualProbeAbort();
      }
    }
  });
  els.quickGcode.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const command = btn.dataset.gcode;
      if (!command) return;

      await runButtonPendingAction(btn, () => executeGcodeAction(command, {
        actionLabel: `Quick command ${command}`,
      }), {
        pendingText: "Sending...",
        minPendingMs: 300,
      });
    });
  });

  els.controlsDistanceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const distance = button.dataset.jogDistance;
      if (!distance) return;
      setControlDistance(distance, { persist: true });
    });
  });

  els.controlsJogButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const axis = button.dataset.controlJogAxis;
      const direction = Number(button.dataset.controlJogDir);
      if (!axis || !Number.isFinite(direction)) return;
      await sendControlJogCommand(axis, direction);
    });
  });

  els.controlsHomeButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const target = button.dataset.controlHome;
      await sendControlHomeCommand(target || "all");
    });
  });

  els.controlsFeedrateSet?.addEventListener("click", async () => {
    await sendFeedRateCommand();
  });

  els.controlsFlowrateSet?.addEventListener("click", async () => {
    await sendFlowRateCommand();
  });

  els.controlsFeedrateInput?.addEventListener("focus", () => {
    clearControlsResetTimer("feedRateResetter");
  });

  els.controlsFeedrateInput?.addEventListener("blur", () => {
    scheduleControlsInputReset("feedRateResetter", els.controlsFeedrateInput);
  });

  els.controlsFlowrateInput?.addEventListener("focus", () => {
    clearControlsResetTimer("flowRateResetter");
  });

  els.controlsFlowrateInput?.addEventListener("blur", () => {
    scheduleControlsInputReset("flowRateResetter", els.controlsFlowrateInput);
  });

  els.controlsFeedrateInput?.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    await sendFeedRateCommand();
  });

  els.controlsFlowrateInput?.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    await sendFlowRateCommand();
  });

  els.controlsExtrusionAmount?.addEventListener("change", () => {
    syncExtrusionAmountFromInput();
    renderControlsPanel();
  });

  els.controlsExtrusionAmount?.addEventListener("blur", () => {
    syncExtrusionAmountFromInput();
    renderControlsPanel();
  });

  els.controlsExtrude?.addEventListener("click", async () => {
    await sendExtrusionCommand(1);
  });

  els.controlsRetract?.addEventListener("click", async () => {
    await sendExtrusionCommand(-1);
  });

  els.controlsToolSet?.addEventListener("click", async () => {
    await sendToolSelectionCommand();
  });

  const handleControlsZOffsetStepClick = async (event) => {
    const target = event.target instanceof Element
      ? event.target.closest("button[data-control-zoffset-adjust][data-control-zoffset-step]")
      : null;
    if (!(target instanceof HTMLButtonElement) || target.disabled) return;

    const direction = String(target.dataset.controlZoffsetAdjust || "").trim().toLowerCase();
    const step = Number(target.dataset.controlZoffsetStep);
    if (!Number.isFinite(step) || step <= 0) return;

    await sendControlsZOffsetAdjust(direction, step);
  };

  els.controlsZOffsetUpGroup?.addEventListener("click", async (event) => {
    await handleControlsZOffsetStepClick(event);
  });

  els.controlsZOffsetDownGroup?.addEventListener("click", async (event) => {
    await handleControlsZOffsetStepClick(event);
  });

  els.controlsZOffsetClear?.addEventListener("click", async () => {
    await clearControlsZOffset();
  });

  els.controlsZOffsetSave?.addEventListener("click", async () => {
    await saveControlsZOffset();
  });

  els.controlsZOffsetSaveDialogSaveConfig?.addEventListener("click", async () => {
    await saveControlsZOffsetConfig();
  });

  els.controlsZOffsetSaveDialogLater?.addEventListener("click", () => {
    closeControlsZOffsetSaveDialog();
  });

  els.controlsZOffsetSaveDialogOk?.addEventListener("click", () => {
    closeControlsZOffsetSaveDialog();
  });

  els.controlsZOffsetSaveDialog?.addEventListener("click", (event) => {
    if (event.target === els.controlsZOffsetSaveDialog) {
      closeControlsZOffsetSaveDialog();
    }
  });

  const handleManualProbeButtonClick = async (event) => {
    const target = event.target instanceof Element
      ? event.target.closest("button[data-manual-probe-testz]")
      : null;
    if (!(target instanceof HTMLButtonElement) || target.disabled) return;

    const stepCommand = String(target.dataset.manualProbeTestz || "").trim();
    if (!stepCommand) return;

    await requestManualProbeTestz(stepCommand);
  };

  els.manualProbeDialog?.addEventListener("click", async (event) => {
    await handleManualProbeButtonClick(event);
  });

  els.manualProbeClose?.addEventListener("click", async () => {
    await requestManualProbeAbort();
  });

  els.manualProbeAbort?.addEventListener("click", async () => {
    await requestManualProbeAbort();
  });

  els.manualProbeAccept?.addEventListener("click", async () => {
    await requestManualProbeAccept();
  });

  els.manualProbeDialog?.addEventListener("click", async (event) => {
    if (event.target === els.manualProbeDialog) {
      await requestManualProbeAbort();
    }
  });

  els.manualProbeDialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    void requestManualProbeAbort();
  });

  els.controlsFanOn?.addEventListener("click", async () => {
    await sendControlsFanSpeed(100, { successMessage: "Fan speed set to 100%." });
  });

  els.controlsFanOff?.addEventListener("click", async () => {
    await sendControlsFanSpeed(0, { successMessage: "Fan speed set to 0%." });
  });

  els.controlsFanSpeed?.addEventListener("input", () => {
    state.controls.fanSpeed = normalizeFanSpeedPercent(els.controlsFanSpeed?.value);
    renderControlsPanel();
  });

  els.controlsFanSpeed?.addEventListener("change", async () => {
    const value = normalizeFanSpeedPercent(els.controlsFanSpeed?.value);
    await sendControlsFanSpeed(value);
  });

  els.controlsKeyboardSurface?.addEventListener("focus", () => {
    setControlsKeyboardActive(true);
  });

  els.controlsKeyboardSurface?.addEventListener("blur", () => {
    setControlsKeyboardActive(false);
  });

  els.controlsCard?.addEventListener("mouseenter", () => {
    if (els.controlsKeyboardSurface) {
      els.controlsKeyboardSurface.focus();
    }
    setControlsKeyboardActive(true);
  });

  els.controlsCard?.addEventListener("mouseleave", () => {
    setControlsKeyboardActive(false);
  });

  els.controlsKeyboardSurface?.addEventListener("keydown", (event) => {
    handleControlsKeyboardEvent(event);
  });

  els.runoutSensorList?.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.runoutSensorToggle !== "true") return;

    const sensorKey = normalizeRunoutSensorObjectKey(target.dataset.runoutSensorKey || "");
    if (!sensorKey) {
      renderRunoutSensorsCard();
      return;
    }

    void setRunoutSensorEnabled(sensorKey, target.checked);
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
  syncThemeEditorControls();
  els.interfaceCompact.checked = state.interface.compact;
  els.interfaceDensity.value = state.interface.density;
  runtimeDashboardViewport = getDashboardRuntimeViewport();
  state.dashboard.settingsViewport = runtimeDashboardViewport;
  state.dashboard.layout = getRuntimeDashboardLegacyLayout(runtimeDashboardViewport);
  syncDashboardVisibilityInputs();
  syncWarningsSettingsControls();
  renderSettingsDashboardLayout();
  renderThermalPresetSettingsList();
  renderTimelapseControlView();
  renderTimelapseMediaCard();
  renderTimelapseSettingsCard();
  renderSpoolmanView();
  renderSpoolmanSettingsCard();
  renderRunoutSensorsCard();

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

  if (els.historySearch) {
    els.historySearch.value = String(state.printHistory.searchQuery || "");
  }

  if (els.historyStatusFilter) {
    els.historyStatusFilter.value = normalizePrintHistoryStatusFilter(state.printHistory.statusFilter);
  }

  if (els.historySort) {
    els.historySort.value = normalizePrintHistorySort(state.printHistory.sortMode);
  }

  if (els.historyPageSize) {
    els.historyPageSize.value = String(normalizePrintHistoryPageSize(state.printHistory.pageSize));
  }

  if (els.historyLoadLimit) {
    els.historyLoadLimit.value = String(normalizePrintHistoryLoadLimit(state.printHistory.loadedLimit));
  }

  if (els.historyTimeDays) {
    els.historyTimeDays.checked = !!state.printHistory.timeInDays;
  }

  if (els.historyLengthKm) {
    els.historyLengthKm.checked = !!state.printHistory.lengthInKilometers;
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
  syncConsoleSettingsControls();
  resetConsoleFilterEditor();
  applyConsoleDisplaySettings();
  renderMacroSettings();

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
  renderTimelapseMediaCard();
  renderPrintHistoryCard();
  renderPrettyGcodeView();
  wireEvents();

  try {
    await restoreTemperatureHistoryForSession();
  } catch (error) {
    log.debug("Temperature history restore failed.", { error: error?.message || String(error) });
  }

  initializeTemperaturePanel();
  applyInterfaceSettings();
  applyDashboardSettings();
  renderCameraCards();
  setControlDistance(state.controls.distance, { persist: false });
  state.controls.fanSpeed = normalizeFanSpeedPercent(state.controls.fanSpeed);
  renderControlsPanel();
  renderStatusThermalsAndFan();
  renderManualProbeDialog();
  setToolsMenuOpen(false, { refresh: false });

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






















function setTimelapseMediaStatusMessage(message, level = "info") {
  if (!els.timelapseMediaStatus) return;
  els.timelapseMediaStatus.textContent = String(message || "").trim();
  els.timelapseMediaStatus.dataset.level = level;
}

function persistTimelapseMediaViewState() {
  localStorage.setItem(TIMELAPSE_MEDIA_SORT_STORAGE_KEY, normalizeTimelapseMediaSort(state.timelapseMedia.sortMode));
  localStorage.setItem(TIMELAPSE_MEDIA_DIRECTORY_STORAGE_KEY, normalizeTimelapseMediaDirectory(state.timelapseMedia.currentDirectory));
}

function addTimelapseMediaDirectoryWithParents(directorySet, directoryPath) {
  const normalized = normalizeTimelapseMediaDirectory(directoryPath);
  if (!normalized) return;

  const segments = normalized.split("/").filter(Boolean);
  if (!segments.length) return;

  let prefix = "";
  segments.forEach((segment) => {
    prefix = prefix ? `${prefix}/${segment}` : segment;
    directorySet.add(prefix);
  });
}

function extractTimelapseMediaListing(fileResponse) {
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

    const normalizedPath = normalizeTimelapseMediaPath(candidatePath);
    if (!normalizedPath) return;

    const isDirectory = entryType === "directory" || String(candidatePath || "").trim().endsWith("/");
    if (isDirectory) {
      addTimelapseMediaDirectoryWithParents(directories, normalizedPath);
      return;
    }

    const sizeValue = Number(entry?.size);
    const size = Number.isFinite(sizeValue) && sizeValue >= 0 ? sizeValue : 0;
    const modifiedMs = toGcodeTimestampMs(entry?.modified ?? entry?.mtime ?? entry?.date ?? entry?.time);

    byPath.set(normalizedPath, {
      path: normalizedPath,
      displayName: getTimelapseMediaDisplayName(normalizedPath),
      directory: getTimelapseMediaDirectory(normalizedPath),
      size,
      modifiedMs,
    });

    const parentDirectory = getTimelapseMediaDirectory(normalizedPath);
    if (parentDirectory) {
      addTimelapseMediaDirectoryWithParents(directories, parentDirectory);
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

function mergeTimelapseMediaDirectoriesFromDirectoryResponse(listing, directoryResponse, baseDirectory = "") {
  const files = Array.isArray(listing?.files) ? listing.files : [];
  const directories = new Set(Array.isArray(listing?.directories) ? listing.directories : []);
  const base = normalizeTimelapseMediaDirectory(baseDirectory);

  const payload = directoryResponse?.result ?? directoryResponse ?? {};
  const rawDirs = Array.isArray(payload?.dirs)
    ? payload.dirs
    : Array.isArray(payload?.directories)
      ? payload.directories
      : [];

  rawDirs.forEach((entry) => {
    let candidatePath = typeof entry === "string"
      ? entry
      : String(entry?.dirname ?? entry?.path ?? entry?.filename ?? "").trim();

    candidatePath = normalizeTimelapseMediaDirectory(candidatePath);
    if (!candidatePath) return;

    const lowerPath = candidatePath.toLowerCase();
    if (lowerPath === "timelapse") return;

    if (lowerPath.startsWith("timelapse/")) {
      candidatePath = normalizeTimelapseMediaDirectory(candidatePath.slice("timelapse/".length));
    }

    if (!candidatePath) return;

    let fullPath = "";
    if (base && (candidatePath === base || candidatePath.startsWith(`${base}/`))) {
      fullPath = candidatePath;
    } else {
      fullPath = base ? normalizeTimelapseMediaDirectory(`${base}/${candidatePath}`) : candidatePath;
    }

    if (!fullPath) return;
    addTimelapseMediaDirectoryWithParents(directories, fullPath);
  });

  return {
    files,
    directories: [...directories].sort((a, b) => a.localeCompare(b)),
  };
}

function applyTimelapseMediaListing(listing) {
  const files = Array.isArray(listing?.files) ? listing.files : [];
  const directories = Array.isArray(listing?.directories) ? listing.directories : [];

  state.timelapseMedia.files = files;
  state.timelapseMedia.directories = directories;
  state.timelapseMedia.currentDirectory = normalizeTimelapseMediaCurrentDirectory(state.timelapseMedia.currentDirectory);
}

function doesTimelapseMediaDirectoryExist(directory) {
  const normalizedDirectory = normalizeTimelapseMediaDirectory(directory);
  if (!normalizedDirectory) return true;

  if ((state.timelapseMedia.directories || []).some((entry) => normalizeTimelapseMediaDirectory(entry) === normalizedDirectory)) {
    return true;
  }

  return (state.timelapseMedia.files || []).some((entry) => {
    const path = normalizeTimelapseMediaPath(entry.path);
    return path.startsWith(`${normalizedDirectory}/`);
  });
}

function normalizeTimelapseMediaCurrentDirectory(directoryCandidate = state.timelapseMedia.currentDirectory) {
  let directory = normalizeTimelapseMediaDirectory(directoryCandidate);
  if (!directory) return "";

  while (directory && !doesTimelapseMediaDirectoryExist(directory)) {
    const segments = directory.split("/");
    segments.pop();
    directory = segments.join("/");
  }

  return directory;
}

function setTimelapseMediaDirectory(directory, { persist = true } = {}) {
  state.timelapseMedia.currentDirectory = normalizeTimelapseMediaCurrentDirectory(directory);

  if (persist) {
    persistTimelapseMediaViewState();
  }

  renderTimelapseMediaCard();
}

function deriveTimelapseMediaDirectoryEntries() {
  const currentDirectory = normalizeTimelapseMediaDirectory(state.timelapseMedia.currentDirectory);
  const directoryPrefix = currentDirectory ? `${currentDirectory}/` : "";
  const directories = new Map();
  const files = [];

  const ensureDirectory = (path) => {
    const normalizedPath = normalizeTimelapseMediaDirectory(path);
    if (!normalizedPath) return;

    const displayName = getTimelapseMediaDisplayName(normalizedPath) || normalizedPath;

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
    const normalizedPath = normalizeTimelapseMediaDirectory(path);
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

  (state.timelapseMedia.directories || []).forEach((directoryPath) => {
    const childPath = getImmediateChildDirectory(directoryPath);
    if (!childPath || childPath === currentDirectory) return;
    ensureDirectory(childPath);
  });

  (state.timelapseMedia.files || []).forEach((entry) => {
    const normalizedPath = normalizeTimelapseMediaPath(entry.path);
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

function sortTimelapseMediaDirectories(entries) {
  return [...entries].sort((a, b) => a.path.localeCompare(b.path));
}

function sortTimelapseMediaFiles(entries) {
  const sortMode = normalizeTimelapseMediaSort(state.timelapseMedia.sortMode);
  const items = [...entries];

  items.sort((a, b) => {
    if (sortMode === "name_asc") {
      return a.displayName.localeCompare(b.displayName) || a.path.localeCompare(b.path);
    }

    if (sortMode === "name_desc") {
      return b.displayName.localeCompare(a.displayName) || b.path.localeCompare(a.path);
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

function getTimelapseMediaParentDirectory(path) {
  const normalized = normalizeTimelapseMediaDirectory(path);
  if (!normalized) return "";
  const segments = normalized.split("/").filter(Boolean);
  segments.pop();
  return segments.join("/");
}

function normalizeTimelapseMediaSelectionType(type) {
  const normalized = String(type || "").trim().toLowerCase();
  return normalized === "directory" || normalized === "file" ? normalized : "";
}

function normalizeTimelapseMediaSelectionPath(path, type) {
  const normalizedType = normalizeTimelapseMediaSelectionType(type);
  if (!normalizedType) return "";

  const rawPath = String(path ?? "").trim();
  if (normalizedType === "directory") {
    const normalizedDirectory = normalizeTimelapseMediaDirectory(rawPath);
    if (normalizedDirectory) return normalizedDirectory;

    const lowered = rawPath.toLowerCase();
    if (!rawPath || rawPath === "/" || lowered === "timelapse" || lowered === "timelapse/") {
      return "/";
    }

    return "";
  }

  return normalizeTimelapseMediaPath(rawPath);
}

function isTimelapseMediaEntrySelected(path, type) {
  const normalizedType = normalizeTimelapseMediaSelectionType(type);
  if (!normalizedType) return false;

  const selectedType = normalizeTimelapseMediaSelectionType(state.timelapseMedia.selectedType);
  if (selectedType !== normalizedType) return false;

  const selectedPath = normalizeTimelapseMediaSelectionPath(state.timelapseMedia.selectedPath, selectedType);
  const candidatePath = normalizeTimelapseMediaSelectionPath(path, normalizedType);
  return !!selectedPath && !!candidatePath && selectedPath === candidatePath;
}

function setTimelapseMediaEntrySelection(path, type) {
  const normalizedType = normalizeTimelapseMediaSelectionType(type);
  const normalizedPath = normalizeTimelapseMediaSelectionPath(path, normalizedType);

  if (!normalizedType || !normalizedPath) {
    state.timelapseMedia.selectedType = "";
    state.timelapseMedia.selectedPath = "";
    return;
  }

  state.timelapseMedia.selectedType = normalizedType;
  state.timelapseMedia.selectedPath = normalizedPath;
}

function applyTimelapseMediaRowSelection(row, path, type) {
  setTimelapseMediaEntrySelection(path, type);

  if (!els.timelapseMediaFileList) return;

  els.timelapseMediaFileList.querySelectorAll(".jobs-entry.is-selected").forEach((entry) => {
    entry.classList.remove("is-selected");
  });

  if (row && row.classList) {
    row.classList.add("is-selected");
  }
}

function bindTimelapseMediaRowSelection(row, path, type) {
  if (!row) return;

  let selectedOnPointerDown = false;

  row.addEventListener("pointerdown", (event) => {
    if (Number(event?.button) !== 0) return;
    selectedOnPointerDown = true;
    applyTimelapseMediaRowSelection(row, path, type);
  });

  row.addEventListener("click", () => {
    if (selectedOnPointerDown) {
      selectedOnPointerDown = false;
      return;
    }

    applyTimelapseMediaRowSelection(row, path, type);
  });
}

function renderTimelapseMediaSummary() {
  if (!els.timelapseMediaSummary) return;

  const totalFiles = state.timelapseMedia.files.length;
  const totalFolders = state.timelapseMedia.directories.length;
  const totalSize = state.timelapseMedia.files.reduce((sum, entry) => sum + (Number(entry.size) || 0), 0);
  const directory = normalizeTimelapseMediaDirectory(state.timelapseMedia.currentDirectory);
  const label = directory ? `timelapse/${directory}` : "timelapse/";
  const sizeLabel = totalSize > 0 ? ` | Total: ${formatFileSize(totalSize)}` : "";

  const fileLabel = `${totalFiles} media file${totalFiles === 1 ? "" : "s"}`;
  const folderLabel = `${totalFolders} folder${totalFolders === 1 ? "" : "s"}`;
  els.timelapseMediaSummary.textContent = `${fileLabel} | ${folderLabel} in ${label}${sizeLabel}`;
}

function renderTimelapseMediaPathDisplay() {
  if (!els.timelapseMediaPathDisplay) return;
  const directory = normalizeTimelapseMediaDirectory(state.timelapseMedia.currentDirectory);
  const pathLabel = directory ? `/${directory}` : "/";
  els.timelapseMediaPathDisplay.textContent = pathLabel;
  els.timelapseMediaPathDisplay.title = formatTimelapseMediaRootPath(directory);
}

function renderTimelapseMediaBreadcrumbs() {
  if (!els.timelapseMediaBreadcrumbs) return;

  const breadcrumbs = [];
  const currentDirectory = normalizeTimelapseMediaDirectory(state.timelapseMedia.currentDirectory);

  breadcrumbs.push({ label: "timelapse", path: "" });

  if (currentDirectory) {
    const parts = currentDirectory.split("/").filter(Boolean);
    let prefix = "";

    parts.forEach((part) => {
      prefix = prefix ? `${prefix}/${part}` : part;
      breadcrumbs.push({ label: part, path: prefix });
    });
  }

  els.timelapseMediaBreadcrumbs.innerHTML = "";

  breadcrumbs.forEach((crumb, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "jobs-breadcrumb-btn";
    button.textContent = crumb.label;
    button.disabled = crumb.path === currentDirectory;
    button.addEventListener("click", () => {
      setTimelapseMediaDirectory(crumb.path);
    });
    els.timelapseMediaBreadcrumbs.appendChild(button);

    if (index < breadcrumbs.length - 1) {
      const separator = document.createElement("span");
      separator.className = "jobs-breadcrumb-sep";
      separator.textContent = "/";
      els.timelapseMediaBreadcrumbs.appendChild(separator);
    }
  });
}

function renderTimelapseMediaSidebar() {
  if (!els.timelapseMediaFolderList) return;

  const container = els.timelapseMediaFolderList;
  container.innerHTML = "";

  if (!state.client) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Connect to Moonraker to browse folders.";
    container.appendChild(empty);
    return;
  }

  const busy = state.timelapseMedia.isLoading || state.timelapseMedia.actionInFlight;
  const currentDirectory = normalizeTimelapseMediaDirectory(state.timelapseMedia.currentDirectory);

  const appendFolderButton = (label, path, depth = 0) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "timelapse-media-folder-btn";
    button.textContent = label;
    button.title = formatTimelapseMediaRootPath(path);
    button.disabled = busy;
    button.style.setProperty("--folder-depth", String(Math.max(0, depth)));
    button.classList.toggle("is-active", path === currentDirectory);
    button.addEventListener("click", () => {
      setTimelapseMediaDirectory(path);
    });
    container.appendChild(button);
  };

  appendFolderButton("timelapse/", "", 0);

  const sorted = [...(state.timelapseMedia.directories || [])].sort((a, b) => a.localeCompare(b));
  sorted.forEach((directoryPath) => {
    const normalizedPath = normalizeTimelapseMediaDirectory(directoryPath);
    if (!normalizedPath) return;

    const depth = Math.max(0, normalizedPath.split("/").filter(Boolean).length);
    const label = getTimelapseMediaDisplayName(normalizedPath) || normalizedPath;
    appendFolderButton(label, normalizedPath, depth);
  });
}

function renderTimelapseMediaList() {
  if (!els.timelapseMediaFileList) return;

  const list = els.timelapseMediaFileList;
  const hasClient = !!state.client;
  const busy = state.timelapseMedia.isLoading || state.timelapseMedia.actionInFlight;
  const currentDirectory = normalizeTimelapseMediaDirectory(state.timelapseMedia.currentDirectory);
  const parentDirectory = getTimelapseMediaParentDirectory(currentDirectory);

  const { directories, files } = deriveTimelapseMediaDirectoryEntries();
  const sortedDirectories = sortTimelapseMediaDirectories(directories);
  const sortedFiles = sortTimelapseMediaFiles(files);
  const showParentEntry = !!currentDirectory;

  list.innerHTML = "";

  if (!hasClient) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Connect to Moonraker to browse videos and timelapses.";
    list.appendChild(empty);
    return;
  }

  if (state.timelapseMedia.isLoading) {
    const loading = document.createElement("p");
    loading.className = "muted";
    loading.textContent = "Loading videos and timelapses...";
    list.appendChild(loading);
    return;
  }

  if (!showParentEntry && !sortedDirectories.length && !sortedFiles.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No videos or timelapses found in this directory.";
    list.appendChild(empty);
    return;
  }

  if (showParentEntry) {
    const row = document.createElement("article");
    row.className = "jobs-entry jobs-entry-folder jobs-entry-parent";

    if (isTimelapseMediaEntrySelected(parentDirectory, "directory")) {
      row.classList.add("is-selected");
    }

    bindTimelapseMediaRowSelection(row, parentDirectory, "directory");

    const body = document.createElement("div");
    body.className = "jobs-entry-body";

    const title = document.createElement("p");
    title.className = "jobs-entry-title";
    title.textContent = "..";

    const detail = document.createElement("p");
    detail.className = "jobs-entry-detail muted";
    detail.textContent = `Up to ${formatTimelapseMediaRootPath(parentDirectory)}`;

    body.append(title, detail);

    const actions = document.createElement("div");
    actions.className = "jobs-entry-actions";

    const upButton = document.createElement("button");
    upButton.type = "button";
    upButton.className = "jobs-entry-btn";
    upButton.textContent = "^";
    upButton.disabled = busy;
    upButton.addEventListener("click", () => {
      setTimelapseMediaDirectory(parentDirectory);
    });

    actions.append(upButton);
    row.append(body, actions);
    list.appendChild(row);
  }

  sortedDirectories.forEach((entry) => {
    const row = document.createElement("article");
    row.className = "jobs-entry jobs-entry-folder";

    if (isTimelapseMediaEntrySelected(entry.path, "directory")) {
      row.classList.add("is-selected");
    }

    bindTimelapseMediaRowSelection(row, entry.path, "directory");

    const body = document.createElement("div");
    body.className = "jobs-entry-body";

    const title = document.createElement("p");
    title.className = "jobs-entry-title";
    title.textContent = entry.displayName;
    title.title = formatTimelapseMediaRootPath(entry.path);

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
      applyTimelapseMediaRowSelection(row, entry.path, "directory");
      setTimelapseMediaDirectory(entry.path);
    });

    const moveButton = document.createElement("button");
    moveButton.type = "button";
    moveButton.className = "jobs-entry-btn";
    moveButton.textContent = "Move";
    moveButton.disabled = busy;
    moveButton.addEventListener("click", async () => {
      await requestTimelapseMediaFolderMove(entry.path);
    });

    actions.append(openButton, moveButton);
    row.append(body, actions);
    list.appendChild(row);
  });

  sortedFiles.forEach((entry) => {
    const row = document.createElement("article");
    row.className = "jobs-entry jobs-entry-folder timelapse-media-entry-file";

    if (isTimelapseMediaEntrySelected(entry.path, "file")) {
      row.classList.add("is-selected");
    }

    bindTimelapseMediaRowSelection(row, entry.path, "file");

    const body = document.createElement("div");
    body.className = "jobs-entry-body";

    const title = document.createElement("p");
    title.className = "jobs-entry-title";
    title.textContent = entry.displayName;
    title.title = formatTimelapseMediaRootPath(entry.path);

    const detail = document.createElement("p");
    detail.className = "jobs-entry-detail muted";
    detail.textContent = `${formatFileSize(entry.size) || "--"} | Modified: ${formatJobsTimestamp(entry.modifiedMs)}`;

    body.append(title, detail);

    const actions = document.createElement("div");
    actions.className = "jobs-entry-actions";

    const moveButton = document.createElement("button");
    moveButton.type = "button";
    moveButton.className = "jobs-entry-btn";
    moveButton.textContent = "Move";
    moveButton.disabled = busy;
    moveButton.addEventListener("click", async () => {
      await requestTimelapseMediaFileMove(entry.path);
    });

    const downloadButton = document.createElement("button");
    downloadButton.type = "button";
    downloadButton.className = "jobs-entry-btn";
    downloadButton.textContent = "Download";
    downloadButton.disabled = busy;
    downloadButton.addEventListener("click", async () => {
      await requestTimelapseMediaFileDownload(entry.path);
    });

    actions.append(moveButton, downloadButton);
    row.append(body, actions);
    list.appendChild(row);
  });
}

function renderTimelapseMediaStatus() {
  if (!state.client) {
    setTimelapseMediaStatusMessage("Connect to Moonraker to manage videos and timelapses.", "warn");
    return;
  }

  if (state.timelapseMedia.actionInFlight) {
    setTimelapseMediaStatusMessage("Running video library action...", "warn");
    return;
  }

  if (state.timelapseMedia.lastError) {
    setTimelapseMediaStatusMessage(`Video library action failed: ${state.timelapseMedia.lastError}`, "error");
    return;
  }

  if (state.timelapseMedia.isLoading) {
    setTimelapseMediaStatusMessage("Loading videos and timelapses...", "info");
    return;
  }

  if (state.connectionStatus !== "connected") {
    setTimelapseMediaStatusMessage("Moonraker websocket is disconnected. Video actions are running in degraded mode.", "warn");
    return;
  }

  if (state.timelapseMedia.lastUpdatedMs) {
    setTimelapseMediaStatusMessage(`Last refreshed: ${new Date(state.timelapseMedia.lastUpdatedMs).toLocaleTimeString()}`, "info");
    return;
  }

  setTimelapseMediaStatusMessage("Press Refresh to load videos and timelapses.", "info");
}

function renderTimelapseMediaCard() {
  const hasClient = !!state.client;
  const busy = state.timelapseMedia.isLoading || state.timelapseMedia.actionInFlight;

  if (els.timelapseMediaSort) {
    els.timelapseMediaSort.value = normalizeTimelapseMediaSort(state.timelapseMedia.sortMode);
    els.timelapseMediaSort.disabled = busy;
  }

  if (els.timelapseMediaRefresh) {
    els.timelapseMediaRefresh.disabled = !hasClient || busy;
    els.timelapseMediaRefresh.classList.toggle("is-loading", state.timelapseMedia.isLoading);
    els.timelapseMediaRefresh.title = state.timelapseMedia.isLoading ? "Loading..." : "Refresh";
    els.timelapseMediaRefresh.setAttribute("aria-label", state.timelapseMedia.isLoading ? "Loading video list" : "Refresh video list");
  }

  if (els.timelapseMediaNewFolder) {
    els.timelapseMediaNewFolder.disabled = !hasClient || busy;
  }

  renderTimelapseMediaSummary();
  renderTimelapseMediaPathDisplay();
  renderTimelapseMediaBreadcrumbs();
  renderTimelapseMediaSidebar();
  renderTimelapseMediaList();
  renderTimelapseMediaStatus();
}

async function loadTimelapseMediaFiles({ source = "user", silent = false } = {}) {
  if (!state.client) {
    renderTimelapseMediaCard();
    return [];
  }

  if (state.timelapseMedia.isLoading) {
    return state.timelapseMedia.files || [];
  }

  state.timelapseMedia.isLoading = true;
  state.timelapseMedia.lastError = "";
  renderTimelapseMediaCard();

  try {
    const response = await state.client.getFilesByRoot("timelapse");
    let listing = extractTimelapseMediaListing(response);

    const directoryTargets = [""];
    const currentDirectory = normalizeTimelapseMediaDirectory(state.timelapseMedia.currentDirectory);
    if (currentDirectory) {
      directoryTargets.push(currentDirectory);
    }

    for (const target of directoryTargets) {
      try {
        const fullPath = target ? `timelapse/${target}` : "timelapse";
        const directoryResponse = await state.client.getDirectory(fullPath, { extended: true });
        listing = mergeTimelapseMediaDirectoriesFromDirectoryResponse(listing, directoryResponse, target);
      } catch (directoryError) {
        log.debug("Timelapse directory lookup failed during video refresh.", {
          directory: target || "timelapse",
          error: directoryError?.message || String(directoryError),
        });
      }
    }

    applyTimelapseMediaListing(listing);
    state.timelapseMedia.lastError = "";
    state.timelapseMedia.lastUpdatedMs = Date.now();
    persistTimelapseMediaViewState();

    if (source === "user") {
      appendConsole(`Loaded ${listing.files.length} video file${listing.files.length === 1 ? "" : "s"}.`, "info");
    }

    renderTimelapseMediaCard();
    return listing.files;
  } catch (error) {
    const message = error?.message || String(error);
    state.timelapseMedia.lastError = message;

    if (!silent) {
      appendConsole(`Video library load failed: ${message}`, "error");
    }

    renderTimelapseMediaCard();
    return [];
  } finally {
    state.timelapseMedia.isLoading = false;
    renderTimelapseMediaCard();
  }
}

function remapTimelapseMediaCurrentDirectoryForMove(sourcePath, destinationPath) {
  const source = normalizeTimelapseMediaDirectory(sourcePath);
  const destination = normalizeTimelapseMediaDirectory(destinationPath);
  const current = normalizeTimelapseMediaDirectory(state.timelapseMedia.currentDirectory);

  if (!source || !destination || !current) return;

  if (current === source) {
    state.timelapseMedia.currentDirectory = destination;
    persistTimelapseMediaViewState();
    return;
  }

  if (current.startsWith(`${source}/`)) {
    const suffix = current.slice(source.length + 1);
    state.timelapseMedia.currentDirectory = suffix ? `${destination}/${suffix}` : destination;
    persistTimelapseMediaViewState();
  }
}

async function requestTimelapseMediaPathMove(sourcePath, destinationPath, { entryType = "file", mode = "move" } = {}) {
  const normalize = entryType === "directory" ? normalizeTimelapseMediaDirectory : normalizeTimelapseMediaPath;
  const source = normalize(sourcePath);
  const destination = normalize(destinationPath);

  if (!source || !destination || !state.client) return false;
  if (source === destination) return false;

  if (entryType === "directory" && destination.startsWith(`${source}/`)) {
    setTimelapseMediaStatusMessage("Cannot move a folder into itself.", "warn");
    return false;
  }

  state.timelapseMedia.actionInFlight = true;
  state.timelapseMedia.actionLabel = mode;
  state.timelapseMedia.activePath = source;
  renderTimelapseMediaCard();

  try {
    await state.client.moveFile("timelapse", source, destination);
    state.timelapseMedia.lastError = "";

    if (entryType === "directory") {
      remapTimelapseMediaCurrentDirectoryForMove(source, destination);
    }

    const label = mode === "rename" ? "Renamed" : "Moved";
    const noun = entryType === "directory" ? "folder" : "video";
    appendConsole(`${label} ${noun}: ${formatTimelapseMediaRootPath(source)} -> ${formatTimelapseMediaRootPath(destination)}`, "info");

    await loadTimelapseMediaFiles({ source: mode, silent: true });
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.timelapseMedia.lastError = message;

    const noun = entryType === "directory" ? "Folder" : "Video";
    const verb = mode === "rename" ? "rename" : "move";
    appendConsole(`${noun} ${verb} failed (${source}): ${message}`, "error");
    renderTimelapseMediaCard();
    return false;
  } finally {
    state.timelapseMedia.actionInFlight = false;
    state.timelapseMedia.actionLabel = "";
    state.timelapseMedia.activePath = "";
    renderTimelapseMediaCard();
  }
}

function getTimelapseMediaMoveDestinationOptions({ excludeDirectoryPrefix = "" } = {}) {
  const excluded = normalizeTimelapseMediaDirectory(excludeDirectoryPrefix);
  const directorySet = new Set([""]);
  const currentDirectory = normalizeTimelapseMediaDirectory(state.timelapseMedia.currentDirectory);

  if (currentDirectory) {
    directorySet.add(currentDirectory);
  }

  (state.timelapseMedia.directories || []).forEach((directoryPath) => {
    const normalized = normalizeTimelapseMediaDirectory(directoryPath);
    if (!normalized) return;

    if (excluded && (normalized === excluded || normalized.startsWith(`${excluded}/`))) {
      return;
    }

    directorySet.add(normalized);
  });

  const options = [...directorySet]
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({
      value,
      label: formatTimelapseMediaRootPath(value),
    }));

  if (!options.length) {
    options.push({
      value: "",
      label: "timelapse/",
    });
  }

  return options;
}

async function requestTimelapseMediaFileMove(path) {
  const normalizedPath = normalizeTimelapseMediaPath(path);
  if (!normalizedPath) return false;

  const filename = getTimelapseMediaDisplayName(normalizedPath);
  if (!filename) return false;

  const currentDirectory = getTimelapseMediaDirectory(normalizedPath);
  const requested = await openJobsFolderSelectDialog({
    title: "Move Timelapse Video",
    label: "Destination folder",
    confirmLabel: "Move",
    options: getTimelapseMediaMoveDestinationOptions(),
    defaultValue: currentDirectory,
  });
  if (requested === null) return false;

  const targetDirectory = normalizeTimelapseMediaDirectory(requested);
  const destination = targetDirectory ? `${targetDirectory}/${filename}` : filename;
  return requestTimelapseMediaPathMove(normalizedPath, destination, { entryType: "file", mode: "move" });
}

async function requestTimelapseMediaFolderMove(path) {
  const normalizedPath = normalizeTimelapseMediaDirectory(path);
  if (!normalizedPath) return false;

  const folderName = getTimelapseMediaDisplayName(normalizedPath);
  if (!folderName) return false;

  const currentParent = getTimelapseMediaParentDirectory(normalizedPath);
  const requested = await openJobsFolderSelectDialog({
    title: "Move Timelapse Folder",
    label: "Destination parent folder",
    confirmLabel: "Move",
    options: getTimelapseMediaMoveDestinationOptions({ excludeDirectoryPrefix: normalizedPath }),
    defaultValue: currentParent,
  });
  if (requested === null) return false;

  const targetParent = normalizeTimelapseMediaDirectory(requested);
  const destination = targetParent ? `${targetParent}/${folderName}` : folderName;
  return requestTimelapseMediaPathMove(normalizedPath, destination, { entryType: "directory", mode: "move" });
}

async function requestTimelapseMediaFileDownload(path) {
  const normalizedPath = normalizeTimelapseMediaPath(path);
  if (!normalizedPath || !state.client) return false;

  state.timelapseMedia.actionInFlight = true;
  state.timelapseMedia.actionLabel = "download";
  state.timelapseMedia.activePath = normalizedPath;
  renderTimelapseMediaCard();

  try {
    const fileBlob = await state.client.getFileBlob("timelapse", normalizedPath);
    const fileName = getTimelapseMediaDisplayName(normalizedPath) || "video.mp4";
    const url = URL.createObjectURL(fileBlob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
    state.timelapseMedia.lastError = "";
    appendConsole(`Downloaded media file: ${formatTimelapseMediaRootPath(normalizedPath)}`, "info");
    return true;
  } catch (error) {
    const message = error?.message || String(error);
    state.timelapseMedia.lastError = message;
    appendConsole(`Media download failed (${normalizedPath}): ${message}`, "error");
    return false;
  } finally {
    state.timelapseMedia.actionInFlight = false;
    state.timelapseMedia.actionLabel = "";
    state.timelapseMedia.activePath = "";
    renderTimelapseMediaCard();
  }
}

async function requestTimelapseMediaCreateFolder() {
  if (!state.client) {
    setTimelapseMediaStatusMessage("Moonraker client is unavailable.", "warn");
    return false;
  }

  let requested = null;
  try {
    requested = await openJobsTextInputDialog({
      title: "Create Video Folder",
      label: "Folder name (relative to current directory)",
      confirmLabel: "Create",
      defaultValue: "new-folder",
    });
  } catch (error) {
    const message = error?.message || String(error);
    state.timelapseMedia.lastError = message;
    appendConsole(`Create video folder prompt failed: ${message}`, "error");
    renderTimelapseMediaCard();
    return false;
  }

  if (requested === null) {
    setTimelapseMediaStatusMessage("Folder creation canceled.", "info");
    return false;
  }

  const normalizedName = normalizeTimelapseMediaDirectory(requested);
  if (!normalizedName) {
    setTimelapseMediaStatusMessage("Enter a valid folder name.", "warn");
    return false;
  }

  const currentDirectory = normalizeTimelapseMediaDirectory(state.timelapseMedia.currentDirectory);
  const fullPath = currentDirectory ? `${currentDirectory}/${normalizedName}` : normalizedName;

  state.timelapseMedia.actionInFlight = true;
  state.timelapseMedia.actionLabel = "mkdir";
  state.timelapseMedia.activePath = fullPath;
  renderTimelapseMediaCard();

  try {
    await state.client.createDirectory("timelapse", fullPath);
    state.timelapseMedia.lastError = "";
    appendConsole(`Created video folder: ${formatTimelapseMediaRootPath(fullPath)}`, "info");
    setTimelapseMediaStatusMessage(`Created folder: ${formatTimelapseMediaRootPath(fullPath)}`, "info");
    await loadTimelapseMediaFiles({ source: "mkdir", silent: true });
    setTimelapseMediaDirectory(fullPath);
    persistTimelapseMediaViewState();
    renderTimelapseMediaCard();
    return true;
  } catch (error) {
    if (isJobsDirectoryAlreadyExistsError(error)) {
      state.timelapseMedia.lastError = "";
      appendConsole(`Video folder already exists: ${formatTimelapseMediaRootPath(fullPath)}`, "warn");
      setTimelapseMediaStatusMessage(`Folder already exists: ${formatTimelapseMediaRootPath(fullPath)}`, "warn");
      await loadTimelapseMediaFiles({ source: "mkdir", silent: true });
      setTimelapseMediaDirectory(fullPath);
      persistTimelapseMediaViewState();
      renderTimelapseMediaCard();
      return true;
    }

    const message = error?.message || String(error);
    state.timelapseMedia.lastError = message;
    appendConsole(`Create video folder failed (${fullPath}): ${message}`, "error");
    renderTimelapseMediaCard();
    return false;
  } finally {
    state.timelapseMedia.actionInFlight = false;
    state.timelapseMedia.actionLabel = "";
    state.timelapseMedia.activePath = "";
    renderTimelapseMediaCard();
  }
}

