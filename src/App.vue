<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

type ViewName = "dashboard" | "console" | "macros" | "files" | "settings";

type GcodeStoreEntry = {
  message?: string;
  time?: number;
  type?: string;
};

type MacroItem = {
  name: string;
  command: string;
};

type FileItem = {
  path: string;
  size?: number;
  modified?: number;
};

type SettingsState = {
  autoConnect: boolean;
  confirmFileDelete: boolean;
  statusPollMs: number;
  consolePollMs: number;
  consoleLineLimit: number;
  consoleAutoRefresh: boolean;
  autoRefreshFiles: boolean;
  filesSortMode: "name_asc" | "name_desc" | "date_desc";
  showDashboardProgress: boolean;
  showDashboardTemps: boolean;
  showDashboardState: boolean;
  compactLayout: boolean;
  uiAnimations: boolean;
  notifyOnActions: boolean;
  cameraEnabled: boolean;
  cameraUrl: string;
  cameraRenderMode: "image" | "iframe";
  showHiddenFiles: boolean;
};

const SETTINGS_KEY = "forge_settings_v1";
const MOONRAKER_URL_KEY = "forge_moonraker_url";

const defaultSettings: SettingsState = {
  autoConnect: true,
  confirmFileDelete: true,
  statusPollMs: 2000,
  consolePollMs: 2500,
  consoleLineLimit: 200,
  consoleAutoRefresh: true,
  autoRefreshFiles: false,
  filesSortMode: "name_asc",
  showDashboardProgress: true,
  showDashboardTemps: true,
  showDashboardState: true,
  compactLayout: false,
  uiAnimations: true,
  notifyOnActions: false,
  cameraEnabled: false,
  cameraUrl: "",
  cameraRenderMode: "image",
  showHiddenFiles: false,
};

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    return { ...defaultSettings, ...parsed };
  } catch {
    return { ...defaultSettings };
  }
}

const activeView = ref<ViewName>("dashboard");
const moonrakerUrl = ref(localStorage.getItem(MOONRAKER_URL_KEY) ?? "/moonraker");
const settings = ref<SettingsState>(loadSettings());

const connectionState = ref("Disconnected");
const lastError = ref("");

const printerState = ref("unknown");
const progressPct = ref(0);
const fileName = ref("No active file");
const hotendTemp = ref<number | null>(null);
const bedTemp = ref<number | null>(null);

const consoleInput = ref("");
const consoleLines = ref<string[]>([]);
const isSendingCommand = ref(false);

const macros = ref<MacroItem[]>([]);
const isLoadingMacros = ref(false);
const runningMacro = ref<string | null>(null);

const files = ref<FileItem[]>([]);
const isLoadingFiles = ref(false);
const fileActionPath = ref<string | null>(null);
const jobAction = ref<"pause" | "resume" | "cancel" | null>(null);
const cameraLoadError = ref(false);
const isCameraFullscreen = ref(false);

let statusPollTimer: number | undefined;
let consolePollTimer: number | undefined;
let filePollTimer: number | undefined;

const navItems: { key: ViewName; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "console", label: "Console" },
  { key: "macros", label: "Macros" },
  { key: "files", label: "GCode Files" },
  { key: "settings", label: "Settings" },
];

const viewTitle: Record<ViewName, string> = {
  dashboard: "Dashboard",
  console: "Console",
  macros: "Macros",
  files: "GCode Files",
  settings: "Settings",
};

const statusIntervalMs = computed(() => Math.max(750, settings.value.statusPollMs));
const consoleIntervalMs = computed(() => Math.max(750, settings.value.consolePollMs));
const consoleLineLimit = computed(() => Math.min(500, Math.max(25, settings.value.consoleLineLimit)));
const cameraPreviewUrl = computed(() => settings.value.cameraUrl.trim());

watch(moonrakerUrl, (value) => {
  localStorage.setItem(MOONRAKER_URL_KEY, value);
});

watch(
  settings,
  (value) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
  },
  { deep: true },
);

watch(
  () => [
    statusIntervalMs.value,
    consoleIntervalMs.value,
    settings.value.consoleAutoRefresh,
    settings.value.autoRefreshFiles,
  ],
  () => {
    if (connectionState.value === "Connected") startPolling();
  },
);

watch(
  () => [settings.value.cameraEnabled, settings.value.cameraUrl, settings.value.cameraRenderMode],
  () => {
    cameraLoadError.value = false;
  },
);

function openCameraFullscreen() {
  if (!cameraPreviewUrl.value) return;
  isCameraFullscreen.value = true;
}

function closeCameraFullscreen() {
  isCameraFullscreen.value = false;
}

function onGlobalKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    closeCameraFullscreen();
  }
}
function notify(message: string) {
  if (!settings.value.notifyOnActions) return;
  window.setTimeout(() => {
    window.alert(message);
  }, 0);
}

async function fetchJson(path: string, init?: RequestInit) {
  const res = await fetch(`${moonrakerUrl.value}${path}`, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function formatBytes(bytes?: number): string {
  if (typeof bytes !== "number" || bytes < 0) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(epochSeconds?: number): string {
  if (typeof epochSeconds !== "number") return "--";
  return new Date(epochSeconds * 1000).toLocaleString();
}

function withGcodesPrefix(path: string): string {
  return path.startsWith("gcodes/") ? path : `gcodes/${path}`;
}

function sortedFiles(input: FileItem[]): FileItem[] {
  const list = [...input];

  if (settings.value.showHiddenFiles === false) {
    const filtered = list.filter((item) => !item.path.split("/").some((part) => part.startsWith(".")));
    list.length = 0;
    list.push(...filtered);
  }

  if (settings.value.filesSortMode === "name_desc") {
    return list.sort((a, b) => b.path.localeCompare(a.path));
  }

  if (settings.value.filesSortMode === "date_desc") {
    return list.sort((a, b) => (b.modified ?? 0) - (a.modified ?? 0));
  }

  return list.sort((a, b) => a.path.localeCompare(b.path));
}

async function fetchPrinterStatus() {
  try {
    const data = await fetchJson("/printer/objects/query?print_stats&extruder&heater_bed");
    const status = data?.result?.status;
    if (!status) return;

    const ps = status.print_stats ?? {};
    const ex = status.extruder ?? {};
    const bed = status.heater_bed ?? {};

    printerState.value = ps.state ?? "unknown";
    progressPct.value = Math.max(0, Math.min(100, Math.round((ps.progress ?? 0) * 100)));
    fileName.value = ps.filename || "No active file";
    hotendTemp.value = typeof ex.temperature === "number" ? ex.temperature : null;
    bedTemp.value = typeof bed.temperature === "number" ? bed.temperature : null;
  } catch (err) {
    lastError.value = err instanceof Error ? err.message : String(err);
  }
}

function formatConsoleLine(entry: GcodeStoreEntry): string {
  const timestamp = entry.time ? new Date(entry.time * 1000).toLocaleTimeString() : "--:--:--";
  const type = entry.type ? entry.type.toUpperCase() : "LOG";
  const message = entry.message ?? "";
  return `[${timestamp}] ${type}: ${message}`;
}

async function fetchConsoleStore() {
  try {
    const data = await fetchJson(`/server/gcode_store?count=${consoleLineLimit.value}`);
    const store = data?.result?.gcode_store;
    if (!Array.isArray(store)) return;

    consoleLines.value = (store as GcodeStoreEntry[]).map(formatConsoleLine);
  } catch (err) {
    lastError.value = err instanceof Error ? err.message : String(err);
  }
}

async function fetchMacros() {
  if (connectionState.value !== "Connected" && connectionState.value !== "Connecting...") return;

  isLoadingMacros.value = true;
  try {
    const data = await fetchJson("/printer/objects/list");
    const objects = data?.result?.objects;
    if (!Array.isArray(objects)) {
      macros.value = [];
      return;
    }

    macros.value = objects
      .filter((obj): obj is string => typeof obj === "string" && obj.startsWith("gcode_macro "))
      .map((obj) => obj.replace("gcode_macro ", "").trim())
      .filter((name) => name.length > 0)
      .map((name) => ({ name, command: name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    lastError.value = err instanceof Error ? err.message : String(err);
  } finally {
    isLoadingMacros.value = false;
  }
}

async function fetchFiles() {
  if (connectionState.value !== "Connected" && connectionState.value !== "Connecting...") return;

  isLoadingFiles.value = true;
  try {
    const data = await fetchJson("/server/files/list?root=gcodes");
    const list = data?.result;
    if (!Array.isArray(list)) {
      files.value = [];
      return;
    }

    files.value = sortedFiles(list.filter((item): item is FileItem => typeof item?.path === "string"));
  } catch (err) {
    lastError.value = err instanceof Error ? err.message : String(err);
  } finally {
    isLoadingFiles.value = false;
  }
}

async function runMacro(macro: MacroItem) {
  if (connectionState.value !== "Connected") return;

  runningMacro.value = macro.name;
  lastError.value = "";

  try {
    await fetchJson("/printer/gcode/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script: macro.command }),
    });

    await fetchConsoleStore();
    notify(`Macro '${macro.name}' executed.`);
  } catch (err) {
    lastError.value = err instanceof Error ? err.message : String(err);
  } finally {
    runningMacro.value = null;
  }
}

async function runJobAction(action: "pause" | "resume" | "cancel") {
  if (connectionState.value !== "Connected") return;

  jobAction.value = action;
  lastError.value = "";

  const script = action === "pause" ? "PAUSE" : action === "resume" ? "RESUME" : "CANCEL_PRINT";

  try {
    await fetchJson("/printer/gcode/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script }),
    });

    await Promise.all([fetchPrinterStatus(), fetchConsoleStore()]);
    notify(`Print ${action} requested.`);
  } catch (err) {
    lastError.value = err instanceof Error ? err.message : String(err);
  } finally {
    jobAction.value = null;
  }
}

async function startPrint(file: FileItem) {
  if (connectionState.value !== "Connected") return;

  fileActionPath.value = file.path;
  lastError.value = "";

  try {
    await fetchJson(`/printer/print/start?filename=${encodeURIComponent(file.path)}`, {
      method: "POST",
    });

    await Promise.all([fetchPrinterStatus(), fetchConsoleStore()]);
    notify(`Print started: ${file.path}`);
  } catch (err) {
    lastError.value = err instanceof Error ? err.message : String(err);
  } finally {
    fileActionPath.value = null;
  }
}

async function deleteFile(file: FileItem) {
  if (connectionState.value !== "Connected") return;

  if (settings.value.confirmFileDelete) {
    const confirmed = window.confirm(`Delete file '${file.path}'?`);
    if (!confirmed) return;
  }

  fileActionPath.value = file.path;
  lastError.value = "";

  const relativePath = file.path.startsWith("gcodes/") ? file.path.slice(7) : file.path;
  const prefixedPath = withGcodesPrefix(relativePath);
  const encodedRelativePath = relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const attempts: Array<() => Promise<unknown>> = [
    () => fetchJson(`/server/files/gcodes/${encodedRelativePath}`, { method: "DELETE" }),
    () => fetchJson(`/server/files/gcodes/${encodedRelativePath}`, { method: "POST" }),
    () => fetchJson(`/server/files/delete_file?path=${encodeURIComponent(relativePath)}`, { method: "DELETE" }),
    () => fetchJson(`/server/files/delete_file?path=${encodeURIComponent(prefixedPath)}`, { method: "DELETE" }),
    () => fetchJson(`/server/files/delete?path=${encodeURIComponent(relativePath)}`, { method: "DELETE" }),
    () => fetchJson(`/server/files/delete?path=${encodeURIComponent(prefixedPath)}`, { method: "DELETE" }),
    () => fetchJson(`/server/files/delete_file?path=${encodeURIComponent(relativePath)}`, { method: "POST" }),
    () => fetchJson(`/server/files/delete_file?path=${encodeURIComponent(prefixedPath)}`, { method: "POST" }),
    () => fetchJson(`/server/files/delete?path=${encodeURIComponent(relativePath)}`, { method: "POST" }),
    () => fetchJson(`/server/files/delete?path=${encodeURIComponent(prefixedPath)}`, { method: "POST" }),
  ];

  let deleted = false;
  let lastDeleteError: unknown = null;

  for (const attempt of attempts) {
    try {
      await attempt();
      deleted = true;
      break;
    } catch (err) {
      lastDeleteError = err;
    }
  }

  try {
    if (!deleted) {
      throw (lastDeleteError instanceof Error ? lastDeleteError : new Error("Delete failed on all endpoints"));
    }

    await fetchFiles();
    notify(`File deleted: ${file.path}`);
  } catch (err) {
    lastError.value = err instanceof Error ? err.message : String(err);
  } finally {
    fileActionPath.value = null;
  }
}

async function sendGcode() {
  const script = consoleInput.value.trim();
  if (!script || connectionState.value !== "Connected") return;

  isSendingCommand.value = true;
  lastError.value = "";

  try {
    await fetchJson("/printer/gcode/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script }),
    });

    consoleInput.value = "";
    await fetchConsoleStore();
  } catch (err) {
    lastError.value = err instanceof Error ? err.message : String(err);
  } finally {
    isSendingCommand.value = false;
  }
}

function startPolling() {
  stopPolling();

  statusPollTimer = window.setInterval(() => {
    void fetchPrinterStatus();
  }, statusIntervalMs.value);

  if (settings.value.consoleAutoRefresh) {
    consolePollTimer = window.setInterval(() => {
      void fetchConsoleStore();
    }, consoleIntervalMs.value);
  }

  if (settings.value.autoRefreshFiles) {
    filePollTimer = window.setInterval(() => {
      void fetchFiles();
    }, 8000);
  }
}

function stopPolling() {
  if (statusPollTimer) {
    window.clearInterval(statusPollTimer);
    statusPollTimer = undefined;
  }

  if (consolePollTimer) {
    window.clearInterval(consolePollTimer);
    consolePollTimer = undefined;
  }

  if (filePollTimer) {
    window.clearInterval(filePollTimer);
    filePollTimer = undefined;
  }
}

async function testConnection() {
  connectionState.value = "Connecting...";
  lastError.value = "";

  try {
    const data = await fetchJson("/server/info", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!data?.result) throw new Error("Unexpected response payload");

    connectionState.value = "Connected";
    await Promise.all([fetchPrinterStatus(), fetchConsoleStore(), fetchMacros(), fetchFiles()]);
    startPolling();
  } catch (err) {
    connectionState.value = "Disconnected";
    lastError.value = err instanceof Error ? err.message : String(err);
    stopPolling();
  }
}

function resetSettings() {
  const confirmed = window.confirm("Reset Forge UI settings to defaults?");
  if (!confirmed) return;

  settings.value = { ...defaultSettings };
}

onMounted(() => {
  window.addEventListener("keydown", onGlobalKeydown);

  if (settings.value.autoConnect) {
    void testConnection();
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", onGlobalKeydown);
  stopPolling();
});
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-dot" />
        <h1>Forge UI</h1>
      </div>
      <p class="muted">Custom Klipper + Moonraker frontend</p>

      <nav class="nav">
        <button
          v-for="item in navItems"
          :key="item.key"
          :class="['nav-item', { active: activeView === item.key }]"
          @click="activeView = item.key"
        >
          {{ item.label }}
        </button>
      </nav>
    </aside>

    <main class="content" :class="{ compact: settings.compactLayout, noanim: !settings.uiAnimations }">
      <header class="topbar">
        <h2>{{ viewTitle[activeView] }}</h2>
        <div class="status-chip">{{ connectionState }}</div>
      </header>

      <section v-if="activeView === 'dashboard'" class="dashboard-grid">
        <article v-if="settings.showDashboardState" class="card">
          <h3>Printer State</h3>
          <p class="big">{{ printerState }}</p>
          <p class="muted">{{ fileName }}</p>
        </article>

        <article v-if="settings.showDashboardProgress" class="card">
          <h3>Progress</h3>
          <div class="bar-wrap">
            <div class="bar-fill" :style="{ width: `${progressPct}%` }"></div>
          </div>
          <p class="big">{{ progressPct }}%</p>
        </article>

        <article v-if="settings.showDashboardTemps" class="card">
          <h3>Temperatures</h3>
          <p>Hotend: <strong>{{ hotendTemp !== null ? `${hotendTemp.toFixed(1)} C` : "--" }}</strong></p>
          <p>Bed: <strong>{{ bedTemp !== null ? `${bedTemp.toFixed(1)} C` : "--" }}</strong></p>
        </article>

        <article v-if="settings.cameraEnabled" class="card camera-card">
          <div class="camera-title-row"><h3>Camera</h3><button type="button" @click="openCameraFullscreen" :disabled="!cameraPreviewUrl">Fullscreen</button></div>
          <p v-if="!cameraPreviewUrl" class="muted">Set a Camera URL in Settings to enable preview.</p>
          <div v-else-if="settings.cameraRenderMode === 'iframe'" class="camera-iframe-wrap">
            <iframe
              class="camera-frame"
              :src="cameraPreviewUrl"
              title="Printer camera feed"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
          </div>
          <div v-else-if="cameraLoadError" class="camera-error-wrap">
            <p class="muted">Camera stream could not be loaded.</p>
            <a :href="cameraPreviewUrl" target="_blank" rel="noreferrer">Open Stream URL</a>
            <button type="button" @click="cameraLoadError = false">Retry Preview</button>
          </div>
          <img
            v-else
            class="camera-preview"
            :src="cameraPreviewUrl"
            alt="Printer camera feed"
            loading="lazy"
            @error="cameraLoadError = true"
          />
        </article>
      </section>

      <div v-if="isCameraFullscreen && cameraPreviewUrl" class="camera-modal-overlay" @click.self="closeCameraFullscreen">
        <button type="button" class="camera-modal-close" @click="closeCameraFullscreen">Close</button>
        <iframe
          v-if="settings.cameraRenderMode === 'iframe'"
          class="camera-modal-frame"
          :src="cameraPreviewUrl"
          title="Printer camera fullscreen feed"
          loading="lazy"
          referrerpolicy="no-referrer"
        />
        <img
          v-else
          class="camera-modal-image"
          :src="cameraPreviewUrl"
          alt="Printer camera fullscreen feed"
          loading="lazy"
        />
      </div>
      <section v-else-if="activeView === 'console'" class="card">
        <h3>Console</h3>
        <div class="console-log" role="log" aria-live="polite">
          <p v-if="!consoleLines.length" class="muted">No console entries yet.</p>
          <p v-for="(line, idx) in consoleLines" :key="`${idx}-${line}`" class="console-line">{{ line }}</p>
        </div>

        <form class="console-form" @submit.prevent="sendGcode">
          <input
            v-model="consoleInput"
            type="text"
            placeholder="Enter G-code, e.g. M105"
            :disabled="connectionState !== 'Connected'"
          />
          <button type="submit" :disabled="connectionState !== 'Connected' || isSendingCommand">
            {{ isSendingCommand ? "Sending..." : "Send" }}
          </button>
          <button type="button" @click="fetchConsoleStore" :disabled="connectionState !== 'Connected'">Refresh</button>
        </form>
      </section>

      <section v-else-if="activeView === 'macros'" class="card">
        <h3>Macros</h3>
        <p class="muted">Loaded from Moonraker object registry.</p>
        <div class="macro-actions">
          <button type="button" @click="fetchMacros" :disabled="connectionState !== 'Connected' || isLoadingMacros">
            {{ isLoadingMacros ? "Refreshing..." : "Refresh Macros" }}
          </button>
        </div>
        <div v-if="isLoadingMacros" class="muted">Loading macros...</div>
        <div v-else-if="!macros.length" class="muted">No macros found.</div>
        <div v-else class="macro-grid">
          <button
            v-for="macro in macros"
            :key="macro.name"
            type="button"
            class="macro-btn"
            :disabled="connectionState !== 'Connected' || runningMacro === macro.name"
            @click="runMacro(macro)"
          >
            {{ runningMacro === macro.name ? `Running ${macro.name}...` : macro.name }}
          </button>
        </div>
      </section>

      <section v-else-if="activeView === 'files'" class="card">
        <h3>GCode Files</h3>
        <p class="muted">G-code files from Moonraker virtual SD.</p>
        <div class="file-actions">
          <button type="button" @click="fetchFiles" :disabled="connectionState !== 'Connected' || isLoadingFiles">
            {{ isLoadingFiles ? "Refreshing..." : "Refresh Files" }}
          </button>
          <button
            type="button"
            :disabled="connectionState !== 'Connected' || jobAction === 'pause'"
            @click="runJobAction('pause')"
          >
            {{ jobAction === "pause" ? "Pausing..." : "Pause" }}
          </button>
          <button
            type="button"
            :disabled="connectionState !== 'Connected' || jobAction === 'resume'"
            @click="runJobAction('resume')"
          >
            {{ jobAction === "resume" ? "Resuming..." : "Resume" }}
          </button>
          <button
            type="button"
            class="danger-btn"
            :disabled="connectionState !== 'Connected' || jobAction === 'cancel'"
            @click="runJobAction('cancel')"
          >
            {{ jobAction === "cancel" ? "Canceling..." : "Cancel" }}
          </button>
        </div>
        <div v-if="isLoadingFiles" class="muted">Loading files...</div>
        <div v-else-if="!files.length" class="muted">No files found.</div>
        <div v-else class="file-grid">
          <article v-for="file in files" :key="file.path" class="file-card">
            <p class="file-path">{{ file.path }}</p>
            <p class="muted">{{ formatBytes(file.size) }} - {{ formatDate(file.modified) }}</p>
            <div class="file-row-actions">
              <button
                type="button"
                :disabled="connectionState !== 'Connected' || fileActionPath === file.path"
                @click="startPrint(file)"
              >
                {{ fileActionPath === file.path ? "Working..." : "Print" }}
              </button>
              <button
                type="button"
                class="danger-btn"
                :disabled="connectionState !== 'Connected' || fileActionPath === file.path"
                @click="deleteFile(file)"
              >
                Delete
              </button>
            </div>
          </article>
        </div>
        <p v-if="lastError" class="error-text">{{ lastError }}</p>
      </section>

      <section v-else class="settings-layout">
        <article class="card">
          <h3>Connection</h3>
          <label class="setting-row">
            <span>Moonraker Base URL</span>
            <input v-model="moonrakerUrl" type="text" class="settings-input" />
          </label>
          <label class="setting-row checkbox-row">
            <span>Auto-connect on startup</span>
            <input v-model="settings.autoConnect" type="checkbox" />
          </label>
          <div class="settings-actions">
            <button @click="testConnection">Test Connection</button>
          </div>
        </article>

        <article class="card">
          <h3>Interface</h3>
          <label class="setting-row checkbox-row">
            <span>Compact layout</span>
            <input v-model="settings.compactLayout" type="checkbox" />
          </label>
          <label class="setting-row checkbox-row">
            <span>Enable UI animations</span>
            <input v-model="settings.uiAnimations" type="checkbox" />
          </label>
          <p class="muted">Fluidd-like interface toggles can be expanded later (theme, language, panels).</p>
        </article>

        <article class="card">
          <h3>Dashboard</h3>
          <label class="setting-row checkbox-row">
            <span>Show Printer State card</span>
            <input v-model="settings.showDashboardState" type="checkbox" />
          </label>
          <label class="setting-row checkbox-row">
            <span>Show Progress card</span>
            <input v-model="settings.showDashboardProgress" type="checkbox" />
          </label>
          <label class="setting-row checkbox-row">
            <span>Show Temperatures card</span>
            <input v-model="settings.showDashboardTemps" type="checkbox" />
          </label>
        </article>

        <article class="card">
          <h3>Console</h3>
          <label class="setting-row checkbox-row">
            <span>Auto-refresh console</span>
            <input v-model="settings.consoleAutoRefresh" type="checkbox" />
          </label>
          <label class="setting-row">
            <span>Console poll interval (ms)</span>
            <input v-model.number="settings.consolePollMs" type="number" min="750" step="250" />
          </label>
          <label class="setting-row">
            <span>Stored console lines</span>
            <input v-model.number="settings.consoleLineLimit" type="number" min="25" max="500" step="25" />
          </label>
        </article>

        <article class="card">
          <h3>G-Code Files</h3>
          <label class="setting-row checkbox-row">
            <span>Confirm before delete</span>
            <input v-model="settings.confirmFileDelete" type="checkbox" />
          </label>
          <label class="setting-row checkbox-row">
            <span>Auto-refresh files list</span>
            <input v-model="settings.autoRefreshFiles" type="checkbox" />
          </label>
          <label class="setting-row checkbox-row">
            <span>Show hidden files</span>
            <input v-model="settings.showHiddenFiles" type="checkbox" />
          </label>
          <label class="setting-row">
            <span>Sort mode</span>
            <select v-model="settings.filesSortMode">
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="date_desc">Date (Newest)</option>
            </select>
          </label>
        </article>
        <article class="card">
          <h3>Camera</h3>
          <label class="setting-row checkbox-row">
            <span>Enable camera panel</span>
            <input v-model="settings.cameraEnabled" type="checkbox" />
          </label>
          <label class="setting-row">
            <span>Camera URL</span>
            <input v-model="settings.cameraUrl" type="text" placeholder="http://.../stream" />
          </label>
          <label class="setting-row">
            <span>Renderer</span>
            <select v-model="settings.cameraRenderMode">
              <option value="image">Image (MJPEG/Snapshot)</option>
              <option value="iframe">Iframe (Web UI stream)</option>
            </select>
          </label>
          <p class="muted">If preview is black, switch renderer to Iframe.</p>
        </article>

        <article class="card">
          <h3>Notifications</h3>
          <label class="setting-row checkbox-row">
            <span>Notify on actions</span>
            <input v-model="settings.notifyOnActions" type="checkbox" />
          </label>
        </article>

        <article class="card">
          <h3>Advanced</h3>
          <label class="setting-row">
            <span>Status poll interval (ms)</span>
            <input v-model.number="settings.statusPollMs" type="number" min="750" step="250" />
          </label>
          <div class="settings-actions">
            <button class="danger-btn" @click="resetSettings">Reset Settings</button>
          </div>
          <p class="muted">Settings are auto-saved locally in your browser.</p>
          <p v-if="lastError" class="error-text">{{ lastError }}</p>
        </article>
      </section>
    </main>
  </div>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.big {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 8px 0;
}

.bar-wrap {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.7);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #06b6d4, #22c55e);
}

.console-log {
  min-height: 240px;
  max-height: 420px;
  overflow: auto;
  background: rgba(4, 10, 24, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 10px;
}

.console-line {
  font-family: "Consolas", "Courier New", monospace;
  font-size: 0.85rem;
  line-height: 1.35;
  margin: 0 0 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

.console-form {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
}

.macro-actions {
  margin-bottom: 10px;
}

.macro-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px;
}

.macro-btn {
  text-align: left;
}

.file-actions {
  margin-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.file-card {
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 12px;
  padding: 10px;
  background: rgba(4, 10, 24, 0.46);
}

.file-path {
  margin: 0 0 4px;
  font-weight: 600;
  word-break: break-all;
}

.file-row-actions {
  display: flex;
  gap: 8px;
}

.settings-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.setting-row {
  display: grid;
  gap: 6px;
  margin-bottom: 10px;
}

.checkbox-row {
  grid-template-columns: 1fr auto;
  align-items: center;
}

.settings-input,
select {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(4, 10, 24, 0.82);
  color: #e2e8f0;
  border-radius: 10px;
  padding: 9px 10px;
}

.settings-actions {
  display: flex;
  gap: 8px;
}

.danger-btn {
  border-color: rgba(248, 113, 113, 0.65);
}


.camera-card {
  min-height: 260px;
}

.camera-preview {
  width: 100%;
  min-height: 200px;
  max-height: 320px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(4, 10, 24, 0.72);
}

.camera-error-wrap {
  display: grid;
  gap: 6px;
}

.camera-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.camera-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: #000;
}

.camera-modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 61;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(2, 6, 23, 0.72);
}

.camera-modal-frame,
.camera-modal-image {
  width: 100vw;
  height: 100vh;
  border: 0;
  border-radius: 0;
  background: #000;
  display: block;
}

.camera-modal-image {
  object-fit: contain;
}
.content.compact .card {
  padding: 12px;
  border-radius: 12px;
}

.content.noanim * {
  transition: none !important;
  animation: none !important;
}

@media (max-width: 980px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .console-form {
    grid-template-columns: 1fr;
  }

  .macro-grid {
    grid-template-columns: 1fr;
  }

  .file-grid {
    grid-template-columns: 1fr;
  }

  .settings-layout {
    grid-template-columns: 1fr;
  }
}

.camera-iframe-wrap {
  width: 100%;
}

.camera-frame {
  width: 100%;
  min-height: 260px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 12px;
  background: rgba(4, 10, 24, 0.72);
}
</style>

