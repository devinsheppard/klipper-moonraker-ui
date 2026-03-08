<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

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

const activeView = ref<ViewName>("dashboard");
const moonrakerUrl = ref("/moonraker");
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

let statusPollTimer: number | undefined;
let consolePollTimer: number | undefined;

const navItems: { key: ViewName; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "console", label: "Console" },
  { key: "macros", label: "Macros" },
  { key: "files", label: "Files" },
  { key: "settings", label: "Settings" },
];

const viewTitle: Record<ViewName, string> = {
  dashboard: "Dashboard",
  console: "Console",
  macros: "Macros",
  files: "Files",
  settings: "Settings",
};

async function fetchJson(path: string, init?: RequestInit) {
  const res = await fetch(`${moonrakerUrl.value}${path}`, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 160)}`);
  }
  return res.json();
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
    const data = await fetchJson("/server/gcode_store?count=200");
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
  } catch (err) {
    lastError.value = err instanceof Error ? err.message : String(err);
  } finally {
    runningMacro.value = null;
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
  }, 2000);

  consolePollTimer = window.setInterval(() => {
    void fetchConsoleStore();
  }, 2500);
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
    await Promise.all([fetchPrinterStatus(), fetchConsoleStore(), fetchMacros()]);
    startPolling();
  } catch (err) {
    connectionState.value = "Disconnected";
    lastError.value = err instanceof Error ? err.message : String(err);
    stopPolling();
  }
}

onMounted(() => {
  void testConnection();
});

onUnmounted(() => {
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

    <main class="content">
      <header class="topbar">
        <h2>{{ viewTitle[activeView] }}</h2>
        <div class="status-chip">{{ connectionState }}</div>
      </header>

      <section v-if="activeView === 'dashboard'" class="dashboard-grid">
        <article class="card">
          <h3>Printer State</h3>
          <p class="big">{{ printerState }}</p>
          <p class="muted">{{ fileName }}</p>
        </article>

        <article class="card">
          <h3>Progress</h3>
          <div class="bar-wrap">
            <div class="bar-fill" :style="{ width: `${progressPct}%` }"></div>
          </div>
          <p class="big">{{ progressPct }}%</p>
        </article>

        <article class="card">
          <h3>Temperatures</h3>
          <p>Hotend: <strong>{{ hotendTemp !== null ? `${hotendTemp.toFixed(1)} C` : "--" }}</strong></p>
          <p>Bed: <strong>{{ bedTemp !== null ? `${bedTemp.toFixed(1)} C` : "--" }}</strong></p>
        </article>
      </section>

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
        <h3>Files</h3>
        <p>File manager will go here.</p>
      </section>

      <section v-else class="card">
        <h3>Settings</h3>
        <p class="muted">Moonraker Base URL (proxy mode)</p>
        <input v-model="moonrakerUrl" type="text" class="settings-input" />
        <div class="settings-actions">
          <button @click="testConnection">Test Connection</button>
        </div>
        <p class="muted settings-note">Use <code>/moonraker</code> when Vite proxy is enabled.</p>
        <p v-if="lastError" class="error-text">{{ lastError }}</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.macro-btn {
  text-align: left;
}

.settings-input {
  width: 100%;
  margin-bottom: 10px;
}

.settings-actions {
  display: flex;
  gap: 8px;
}

.settings-note {
  margin-top: 10px;
}

.error-text {
  color: #fca5a5;
  margin-top: 8px;
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
}
</style>
