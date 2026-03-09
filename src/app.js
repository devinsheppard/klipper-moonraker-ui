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
  "card-print-progress": "Print Progress",
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
  pause: document.getElementById("btn-pause"),
  resume: document.getElementById("btn-resume"),
  cancel: document.getElementById("btn-cancel"),
  home: document.getElementById("btn-home"),
  jog: [...document.querySelectorAll("[data-jog]")],
  quickGcode: [...document.querySelectorAll("[data-gcode]")],
};

let layoutDraggedCardId = null;
let layoutDraggedFromColumn = null;

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
      log.info("Moonraker websocket connected.");
      return;
    }

    if (status === "disconnected") {
      appendConsole("Moonraker disconnected.", "warn");
      log.warn("Moonraker websocket disconnected.");
      return;
    }

    if (status === "error") {
      appendConsole("Moonraker websocket error.", "error");
      log.error("Moonraker websocket error.");
      return;
    }

    log.debug("Moonraker connection status update.", { status });
  });

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

    const reportedPrinterState = printStats.state || printStats.status;
    if (reportedPrinterState) {
      setPrinterState(reportedPrinterState);
    }

    log.debug("Status update received.", {
      printerState: reportedPrinterState || null,
      progress: printStats.progress ?? null,
      hotend: extruder.temperature ?? null,
      bed: bed.temperature ?? null,
    });
  });

  state.client.connectWebSocket();

  try {
    const statusResponse = await state.client.call("/printer/objects/query?print_stats");
    const printStats = statusResponse?.result?.status?.print_stats || {};
    const printerState = printStats.state || printStats.status || "ready";
    setPrinterState(printerState);
    log.debug("Initial printer state loaded.", { printerState });
  } catch (error) {
    const message = error?.message || String(error);
    appendConsole(`Printer state load failed: ${message}`, "error");
    log.error("Printer state load failed.", { error: message });
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
    row.className = "temp-item";
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

  els.pause.addEventListener("click", async () => {
    await executeGcodeAction("PAUSE", {
      actionLabel: "Pause print",
      successMessage: "Pause command sent.",
    });
  });

  els.resume.addEventListener("click", async () => {
    await executeGcodeAction("RESUME", {
      actionLabel: "Resume print",
      successMessage: "Resume command sent.",
    });
  });

  els.cancel.addEventListener("click", async () => {
    await executeGcodeAction("CANCEL_PRINT", {
      actionLabel: "Cancel print",
      successMessage: "Cancel command sent.",
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



