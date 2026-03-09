import { MoonrakerClient } from "./moonraker.js";

const CAMERA_MODES = {
  IMAGE: "image",
  IFRAME: "iframe",
};

const INTERFACE_THEMES = ["ocean", "ember", "graphite"];
const INTERFACE_DENSITIES = ["comfortable", "compact"];
const CARD_COLLAPSE_KEY_PREFIX = "card_collapsed_";

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
  tempHotend: document.getElementById("temp-hotend"),
  tempBed: document.getElementById("temp-bed"),
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
  pause: document.getElementById("btn-pause"),
  resume: document.getElementById("btn-resume"),
  cancel: document.getElementById("btn-cancel"),
  home: document.getElementById("btn-home"),
  jog: [...document.querySelectorAll("[data-jog]")],
  quickGcode: [...document.querySelectorAll("[data-gcode]")],
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

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const state = {
  client: null,
  moonrakerUrl: localStorage.getItem("moonraker_url") || "http://127.0.0.1:7125",
  interface: {
    theme: loadStoredChoice("interface_theme", "ocean", INTERFACE_THEMES),
    compact: loadStoredBool("interface_compact", false),
    density: loadStoredChoice("interface_density", "comfortable", INTERFACE_DENSITIES),
    sidebarCollapsed: loadStoredBool("interface_sidebar_collapsed", false),
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
};

function appendConsole(message) {
  const line = document.createElement("div");
  line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
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

function toggleSidebar() {
  state.interface.sidebarCollapsed = !state.interface.sidebarCollapsed;
  localStorage.setItem("interface_sidebar_collapsed", String(state.interface.sidebarCollapsed));
  applyInterfaceSettings();
}

function setConnectionUi(status) {
  els.connectionPill.textContent = status;
  if (status === "connected") {
    els.connectionPill.style.borderColor = "rgba(34, 197, 94, 0.7)";
    els.connectionText.textContent = state.moonrakerUrl;
  } else {
    els.connectionPill.style.borderColor = "rgba(148, 163, 184, 0.22)";
  }
}

function setPrinterState(value) {
  const normalized = value || "unknown";
  els.printerState.textContent = normalized;
  els.printerDot.style.background = normalized === "printing" ? "#22c55e" : "#64748b";
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
  let header = card.querySelector(":scope > .camera-card-head");
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
  const titleText =
    card.querySelector(":scope > .card-head > h2, :scope > .card-head > h3")?.textContent?.trim() ||
    card.querySelector(":scope h2, :scope h3")?.textContent?.trim() ||
    card.id ||
    `card-${index + 1}`;

  return `${CARD_COLLAPSE_KEY_PREFIX}${slugify(`${viewId}-${card.id || titleText}-${index}`)}`;
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
  if (state.client?.ws && state.client.ws.readyState <= 1) {
    try {
      state.client.ws.close();
    } catch (error) {
      console.warn("Previous websocket close failed", error);
    }
  }

  state.client = new MoonrakerClient(state.moonrakerUrl);
  setConnectionUi("connecting");

  state.client.onConnectionState((status) => setConnectionUi(status));

  state.client.onMessage((payload) => {
    if (payload.method !== "notify_status_update") return;

    const [status] = payload.params || [];
    const printStats = status?.print_stats || {};
    const extruder = status?.extruder || {};
    const bed = status?.heater_bed || {};

    if (typeof printStats.progress === "number") {
      const pct = Math.max(0, Math.min(100, Math.round(printStats.progress * 100)));
      els.progressBar.style.width = `${pct}%`;
      els.progressText.textContent = `${pct}%`;
    }

    if (typeof extruder.temperature === "number") {
      els.tempHotend.textContent = `${extruder.temperature.toFixed(1)} C`;
    }

    if (typeof bed.temperature === "number") {
      els.tempBed.textContent = `${bed.temperature.toFixed(1)} C`;
    }

    setPrinterState(printStats.state);
  });

  state.client.connectWebSocket();

  try {
    const macroResponse = await state.client.getMacros();
    const settings = macroResponse?.result?.status?.configfile?.settings || {};
    const macros = Object.keys(settings).filter((k) => k.startsWith("gcode_macro "));
    renderMacros(macros);
  } catch (error) {
    appendConsole(`Macro load failed: ${error.message}`);
  }

  try {
    const fileResponse = await state.client.getFiles();
    renderFiles(fileResponse?.result || []);
  } catch (error) {
    appendConsole(`File list load failed: ${error.message}`);
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
      if (!state.client) return;
      await state.client.runGcode(name);
      appendConsole(`Macro executed: ${name}`);
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
    row.className = "temp-item";
    row.innerHTML = `<strong>${file.path}</strong><div class=\"muted\">${Math.round((file.size || 0) / 1024)} KB</div>`;
    els.fileList.appendChild(row);
  });
}

function wireEvents() {
  els.navItems.forEach((btn) => btn.addEventListener("click", () => switchView(btn.dataset.view)));
  els.sidebarToggle?.addEventListener("click", toggleSidebar);

  els.settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const url = els.moonrakerUrl.value.trim();
    if (!url) return;

    state.moonrakerUrl = url;
    state.interface.theme = INTERFACE_THEMES.includes(els.interfaceTheme.value) ? els.interfaceTheme.value : "ocean";
    state.interface.compact = els.interfaceCompact.checked;
    state.interface.density = INTERFACE_DENSITIES.includes(els.interfaceDensity.value) ? els.interfaceDensity.value : "comfortable";

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
    localStorage.setItem("camera_enabled", String(state.camera.enabled));
    localStorage.setItem("camera_url", state.camera.url);
    localStorage.setItem("camera_render_mode", state.camera.renderMode);
    localStorage.setItem("toolhead_camera_enabled", String(state.toolheadCamera.enabled));
    localStorage.setItem("toolhead_camera_url", state.toolheadCamera.url);
    localStorage.setItem("toolhead_camera_render_mode", state.toolheadCamera.renderMode);

    applyInterfaceSettings();
    renderCameraCards();
    appendConsole("Settings saved.");
    await connectMoonraker();
  });

  els.consoleForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const command = els.consoleInput.value.trim();
    if (!command || !state.client) return;

    await state.client.runGcode(command);
    appendConsole(`> ${command}`);
    els.consoleInput.value = "";
  });

  els.quickGcode.forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!state.client) return;
      await state.client.runGcode(btn.dataset.gcode);
      appendConsole(`> ${btn.dataset.gcode}`);
    });
  });

  els.jog.forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!state.client) return;
      const script = inferAxisCommand(btn.dataset.jog);
      await state.client.runGcode(script);
      appendConsole(`Jogged ${btn.dataset.jog}`);
    });
  });

  els.pause.addEventListener("click", async () => {
    if (!state.client) return;
    await state.client.runGcode("PAUSE");
  });

  els.resume.addEventListener("click", async () => {
    if (!state.client) return;
    await state.client.runGcode("RESUME");
  });

  els.cancel.addEventListener("click", async () => {
    if (!state.client) return;
    await state.client.runGcode("CANCEL_PRINT");
  });

  els.home.addEventListener("click", async () => {
    if (!state.client) return;
    await state.client.runGcode("G28");
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

  els.cameraEnabled.checked = state.camera.enabled;
  els.cameraUrl.value = state.camera.url;
  els.cameraRenderMode.value = state.camera.renderMode;

  els.toolheadCameraEnabled.checked = state.toolheadCamera.enabled;
  els.toolheadCameraUrl.value = state.toolheadCamera.url;
  els.toolheadCameraRenderMode.value = state.toolheadCamera.renderMode;

  setupCollapsibleCards();
  applyInterfaceSettings();
  renderCameraCards();
  wireEvents();

  connectMoonraker().catch((error) => {
    setConnectionUi("error");
    appendConsole(`Connect failed: ${error.message}`);
  });
}

init();
