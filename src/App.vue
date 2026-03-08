<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

type ViewName = "dashboard" | "console" | "macros" | "files" | "settings";

const activeView = ref<ViewName>("dashboard");
const moonrakerUrl = ref("/moonraker");
const connectionState = ref("Disconnected");
const lastError = ref("");

const printerState = ref("unknown");
const progressPct = ref(0);
const fileName = ref("No active file");
const hotendTemp = ref<number | null>(null);
const bedTemp = ref<number | null>(null);

let pollTimer: number | undefined;

const navItems: { key: ViewName; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "console", label: "Console" },
  { key: "macros", label: "Macros" },
  { key: "files", label: "Files" },
  { key: "settings", label: "Settings" },
];

async function fetchPrinterStatus() {
  try {
    const res = await fetch(
      `${moonrakerUrl.value}/printer/objects/query?print_stats&extruder&heater_bed`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
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

function startPolling() {
  if (pollTimer) window.clearInterval(pollTimer);
  pollTimer = window.setInterval(() => {
    void fetchPrinterStatus();
  }, 2000);
}

function stopPolling() {
  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = undefined;
  }
}

async function testConnection() {
  connectionState.value = "Connecting...";
  lastError.value = "";
  try {
    const res = await fetch(`${moonrakerUrl.value}/server/info`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 140)}`);
    }

    const data = await res.json();
    if (!data?.result) throw new Error("Unexpected response payload");

    connectionState.value = "Connected";
    await fetchPrinterStatus();
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
        <h2>{{ activeView[0].toUpperCase() + activeView.slice(1) }}</h2>
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
        <p>G-code console panel will go here.</p>
      </section>

      <section v-else-if="activeView === 'macros'" class="card">
        <h3>Macros</h3>
        <p>Macro list and actions will go here.</p>
      </section>

      <section v-else-if="activeView === 'files'" class="card">
        <h3>Files</h3>
        <p>File manager will go here.</p>
      </section>

      <section v-else class="card">
        <h3>Settings</h3>
        <p class="muted">Moonraker Base URL (proxy mode)</p>
        <input v-model="moonrakerUrl" type="text" style="width: 100%; margin-bottom: 10px;" />
        <button @click="testConnection">Test Connection</button>
        <p class="muted" style="margin-top: 10px;">Use <code>/moonraker</code> when Vite proxy is enabled.</p>
        <p v-if="lastError" style="color: #fca5a5; margin-top: 8px;">{{ lastError }}</p>
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
@media (max-width: 980px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
