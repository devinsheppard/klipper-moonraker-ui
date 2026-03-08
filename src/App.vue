<script setup lang="ts">
import { onMounted, ref } from "vue";

type ViewName = "dashboard" | "console" | "macros" | "files" | "settings";

const activeView = ref<ViewName>("dashboard");
const moonrakerUrl = ref("/moonraker");
const connectionState = ref("Disconnected");
const lastError = ref("");

const navItems: { key: ViewName; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "console", label: "Console" },
  { key: "macros", label: "Macros" },
  { key: "files", label: "Files" },
  { key: "settings", label: "Settings" },
];

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
  } catch (err) {
    connectionState.value = "Disconnected";
    lastError.value = err instanceof Error ? err.message : String(err);
  }
}

onMounted(() => {
  void testConnection();
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

      <section v-if="activeView === 'dashboard'" class="card">
        <h3>Dashboard</h3>
        <p>Printer controls and live status will go here.</p>
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
