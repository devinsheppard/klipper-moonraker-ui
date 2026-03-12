import { createLogger } from "./logger.js";

const JSONRPC = "2.0";
const log = createLogger("moonraker");

function normalizePathSegments(path) {
  return String(path || "")
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean);
}

function encodePathForUrl(path) {
  return normalizePathSegments(path).map((segment) => encodeURIComponent(segment)).join("/");
}

function splitPath(path) {
  const segments = normalizePathSegments(path);
  if (!segments.length) {
    return { directory: "", filename: "" };
  }

  const filename = segments[segments.length - 1];
  const directory = segments.slice(0, -1).join("/");
  return { directory, filename };
}

export class MoonrakerClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.ws = null;
    this.requestId = 0;
    this.wsCallbacks = new Set();
    this.stateCallbacks = new Set();
  }

  onMessage(cb) {
    this.wsCallbacks.add(cb);
    return () => this.wsCallbacks.delete(cb);
  }

  onConnectionState(cb) {
    this.stateCallbacks.add(cb);
    return () => this.stateCallbacks.delete(cb);
  }

  setConnectionState(state) {
    this.stateCallbacks.forEach((cb) => cb(state));
  }

  async rpc(method, params = {}) {
    const response = await fetch(`${this.baseUrl}/printer/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...params }),
    });

    if (!response.ok) {
      throw new Error(`Moonraker call failed: ${method}`);
    }

    return response.json();
  }

  async call(path, options = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, options);
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const details = text ? `: ${text.slice(0, 200)}` : "";
      const error = new Error(`Moonraker call failed (${response.status}): ${path}${details}`);
      error.status = response.status;
      throw error;
    }

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  connectWebSocket() {
    const wsUrl = this.baseUrl.replace("http://", "ws://").replace("https://", "wss://") + "/websocket";
    this.ws = new WebSocket(wsUrl);

    this.ws.addEventListener("open", () => {
      this.setConnectionState("connected");
      this.send({ method: "printer.objects.subscribe", params: { objects: { print_stats: null, virtual_sdcard: null, gcode_move: null, motion_report: null, extruder: null, heater_bed: null, toolhead: null, manual_probe: null, stepper_enable: null } } });
    });

    this.ws.addEventListener("close", () => this.setConnectionState("disconnected"));
    this.ws.addEventListener("error", () => this.setConnectionState("error"));

    this.ws.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data);
        this.wsCallbacks.forEach((cb) => cb(payload));
      } catch (error) {
        log.error("Invalid websocket payload", error);
      }
    });
  }

  send({ method, params = {} }) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(JSON.stringify({
      jsonrpc: JSONRPC,
      method,
      params,
      id: ++this.requestId,
    }));
  }

  async runGcode(script) {
    return this.call("/printer/gcode/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script }),
    });
  }

  async getMacros() {
    return this.call("/printer/objects/query?configfile");
  }

  async getFiles() {
    return this.call("/server/files/list");
  }

  async getFilesByRoot(root) {
    const normalizedRoot = String(root || "").trim();
    if (!normalizedRoot) {
      throw new Error("A file root is required.");
    }

    return this.call(`/server/files/list?root=${encodeURIComponent(normalizedRoot)}`);
  }

  async getConfigFiles() {
    return this.getFilesByRoot("config");
  }

  async getLogFiles() {
    return this.getFilesByRoot("logs");
  }

  async getGcodeFiles() {
    return this.getFilesByRoot("gcodes");
  }

  async getFileMetadata(path) {
    const normalizedPath = normalizePathSegments(path).join("/");
    if (!normalizedPath) {
      throw new Error("A file path is required.");
    }

    return this.call(`/server/files/metadata?filename=${encodeURIComponent(normalizedPath)}`);
  }

  async startPrint(path) {
    const normalizedPath = normalizePathSegments(path).join("/");
    if (!normalizedPath) {
      throw new Error("A print file path is required.");
    }

    const attempts = [
      {
        path: "/printer/print/start",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: normalizedPath }),
      },
      {
        path: `/printer/print/start?filename=${encodeURIComponent(normalizedPath)}`,
        method: "POST",
      },
    ];

    let lastError = null;

    for (const attempt of attempts) {
      try {
        const response = await fetch(`${this.baseUrl}${attempt.path}`, {
          method: attempt.method,
          headers: attempt.headers,
          body: attempt.body,
        });

        if (response.ok) {
          return true;
        }

        lastError = new Error(`Moonraker call failed: ${attempt.method} ${attempt.path}`);
      } catch (error) {
        lastError = error;
      }
    }

    try {
      await this.runGcode(`SDCARD_PRINT_FILE FILENAME=\"${normalizedPath.replace(/\"/g, '\\\"')}\"`);
      return true;
    } catch (error) {
      lastError = error;
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    throw new Error(`Failed to start print: ${normalizedPath}`);
  }

  async pausePrint() {
    try {
      await this.call("/printer/print/pause", { method: "POST" });
      return true;
    } catch {
      await this.runGcode("PAUSE");
      return true;
    }
  }

  async resumePrint() {
    try {
      await this.call("/printer/print/resume", { method: "POST" });
      return true;
    } catch {
      await this.runGcode("RESUME");
      return true;
    }
  }

  async cancelPrint() {
    try {
      await this.call("/printer/print/cancel", { method: "POST" });
      return true;
    } catch {
      await this.runGcode("CANCEL_PRINT");
      return true;
    }
  }
  async getHistoryList(params = {}) {
    const payload = params && typeof params === "object" ? params : {};
    const query = new URLSearchParams();

    ["start", "limit", "before", "since", "order"].forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(payload, key)) return;
      const value = payload[key];
      if (value == null || value === "") return;
      query.set(key, String(value));
    });

    const queryString = query.toString();
    const path = queryString ? `/server/history/list?${queryString}` : "/server/history/list";

    try {
      return await this.call(path);
    } catch (error) {
      const status = Number(error?.status);
      if (!Number.isFinite(status) || ![404, 405, 501].includes(status)) {
        throw error;
      }

      return this.call("/server/history/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
  }

  async getHistoryTotals() {
    try {
      return await this.call("/server/history/totals");
    } catch (error) {
      const status = Number(error?.status);
      if (!Number.isFinite(status) || ![404, 405, 501].includes(status)) {
        throw error;
      }

      return this.call("/server/history/totals", { method: "POST" });
    }
  }

  async deleteHistoryJob(uid) {
    const normalized = String(uid || "").trim();
    if (!normalized) {
      throw new Error("A history job id is required.");
    }

    const payload = normalized === "all" ? { all: true } : { uid: normalized };

    try {
      return await this.call("/server/history/delete_job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const status = Number(error?.status);
      if (!Number.isFinite(status) || ![404, 405, 501].includes(status)) {
        throw error;
      }

      const query = normalized === "all" ? "all=true" : `uid=${encodeURIComponent(normalized)}`;
      return this.call(`/server/history/delete_job?${query}`, { method: "POST" });
    }
  }

  async resetHistoryTotals() {
    try {
      return await this.call("/server/history/reset_totals", { method: "POST" });
    } catch (error) {
      const status = Number(error?.status);
      if (!Number.isFinite(status) || ![404, 405, 501].includes(status)) {
        throw error;
      }

      return this.call("/server/history/reset_totals");
    }
  }

  async getServerInfo() {
    return this.call("/server/info");
  }

  async getMachineSystemInfo() {
    return this.call("/machine/system_info");
  }

  async getMachineProcStats() {
    return this.call("/machine/proc_stats");
  }

  async rebootHost() {
    return this.call("/machine/reboot", { method: "POST" });
  }

  async shutdownHost() {
    return this.call("/machine/shutdown", { method: "POST" });
  }

  async getMachinePowerDevices() {
    return this.call("/machine/device_power/devices");
  }

  async setMachinePowerDevice(device, state) {
    const normalizedDevice = String(device || "").trim();
    const normalizedState = String(state || "").trim().toLowerCase();
    if (!normalizedDevice) {
      throw new Error("A power device name is required.");
    }
    if (!["on", "off", "toggle"].includes(normalizedState)) {
      throw new Error(`Unsupported power state: ${normalizedState}`);
    }

    try {
      return await this.call(
        `/machine/device_power/device?device=${encodeURIComponent(normalizedDevice)}&action=${encodeURIComponent(normalizedState)}`,
        { method: "POST" }
      );
    } catch (error) {
      const status = Number(error?.status);
      if (!Number.isFinite(status) || ![404, 405, 422, 501].includes(status)) {
        throw error;
      }

      return this.call("/machine/device_power/device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device: normalizedDevice,
          action: normalizedState,
        }),
      });
    }
  }

  async runMachineServiceAction(service, action) {
    const normalizedService = String(service || "").trim();
    const normalizedAction = String(action || "").trim().toLowerCase();
    if (!normalizedService) {
      throw new Error("A service name is required.");
    }
    if (!["start", "restart", "stop"].includes(normalizedAction)) {
      throw new Error(`Unsupported service action: ${normalizedAction}`);
    }

    try {
      return await this.call(
        `/machine/services/${normalizedAction}?service=${encodeURIComponent(normalizedService)}`,
        { method: "POST" }
      );
    } catch (error) {
      const status = Number(error?.status);
      if (!Number.isFinite(status) || ![404, 405, 422, 501].includes(status)) {
        throw error;
      }

      return this.call(`/machine/services/${normalizedAction}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: normalizedService,
        }),
      });
    }
  }

  async getMcuAndSystemStats() {
    return this.call("/printer/objects/query?mcu&system_stats");
  }

  async getEndstopsStatus() {
    return this.call("/printer/query_endstops/status");
  }

  async getMachineUpdateStatus() {
    return this.call("/machine/update/status");
  }

  async refreshMachineUpdates(name = null) {
    const payload = name ? { name: String(name).trim() } : {};
    return this.call("/machine/update/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async upgradeMachineUpdates(name = null) {
    const payload = name ? { name: String(name).trim() } : {};

    try {
      return await this.call("/machine/update/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const status = Number(error?.status);
      if (!Number.isFinite(status) || ![404, 405, 501].includes(status)) {
        throw error;
      }

      const normalizedName = String(name || "").trim().toLowerCase();

      if (!normalizedName) {
        return this.call("/machine/update/full", {
          method: "POST",
        });
      }

      if (normalizedName === "system" || normalizedName === "moonraker" || normalizedName === "klipper") {
        return this.call(`/machine/update/${normalizedName}`, {
          method: "POST",
        });
      }

      return this.call("/machine/update/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalizedName }),
      });
    }
  }

  async recoverMachineUpdater(name, { hard = false } = {}) {
    const normalizedName = String(name || "").trim();
    if (!normalizedName) {
      throw new Error("An updater name is required for recover.");
    }

    return this.call("/machine/update/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: normalizedName,
        hard: !!hard,
      }),
    });
  }

  async rollbackMachineUpdater(name) {
    const normalizedName = String(name || "").trim();
    if (!normalizedName) {
      throw new Error("An updater name is required for rollback.");
    }

    return this.call("/machine/update/rollback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: normalizedName }),
    });
  }

  async getFileText(root, path) {
    const normalizedRoot = String(root || "").trim();
    const encodedPath = encodePathForUrl(path);
    if (!normalizedRoot || !encodedPath) {
      throw new Error("A file root and path are required.");
    }

    const response = await fetch(`${this.baseUrl}/server/files/${encodeURIComponent(normalizedRoot)}/${encodedPath}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Moonraker call failed: /server/files/${normalizedRoot}/${encodedPath}`);
    }

    return response.text();
  }

  async getFileBlob(root, path) {
    const normalizedRoot = String(root || "").trim();
    const encodedPath = encodePathForUrl(path);
    if (!normalizedRoot || !encodedPath) {
      throw new Error("A file root and path are required.");
    }

    const response = await fetch(`${this.baseUrl}/server/files/${encodeURIComponent(normalizedRoot)}/${encodedPath}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Moonraker call failed: /server/files/${normalizedRoot}/${encodedPath}`);
    }

    return response.blob();
  }

  async getConfigFileText(path) {
    return this.getFileText("config", path);
  }

  async uploadFile(root, file, directory = "", filename = "") {
    const formData = new FormData();
    formData.append("root", root);

    const normalizedDirectory = normalizePathSegments(directory).join("/");
    if (normalizedDirectory) {
      formData.append("path", normalizedDirectory);
    }

    const uploadName = filename || file?.name || "upload.txt";
    formData.append("file", file, uploadName);

    return this.call("/server/files/upload", {
      method: "POST",
      body: formData,
    });
  }

  async createDirectory(root, path) {
    const normalizedRoot = String(root || "").trim();
    const normalizedPath = normalizePathSegments(path).join("/");

    if (!normalizedRoot || !normalizedPath) {
      throw new Error("A file root and directory path are required.");
    }

    const prefixedPath = `${normalizedRoot}/${normalizedPath}`;

    const attempts = [
      {
        path: `/server/files/directory?path=${encodeURIComponent(prefixedPath)}`,
        method: "POST",
      },
      {
        path: "/server/files/directory",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: prefixedPath }),
      },
      {
        path: `/server/files/mkdir?path=${encodeURIComponent(prefixedPath)}`,
        method: "POST",
      },
      {
        path: "/server/files/mkdir",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: prefixedPath }),
      },
    ];

    let lastError = null;

    for (const attempt of attempts) {
      try {
        const response = await fetch(`${this.baseUrl}${attempt.path}`, {
          method: attempt.method,
          headers: attempt.headers,
          body: attempt.body,
        });

        if (response.ok) {
          return true;
        }

        lastError = new Error(`Moonraker call failed: ${attempt.method} ${attempt.path}`);
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    throw new Error(`Failed to create directory: ${prefixedPath}`);
  }

  async moveFile(root, sourcePath, destinationPath) {
    const normalizedRoot = String(root || "").trim();
    const normalizedSource = normalizePathSegments(sourcePath).join("/");
    const normalizedDestination = normalizePathSegments(destinationPath).join("/");

    if (!normalizedRoot || !normalizedSource || !normalizedDestination) {
      throw new Error("A file root, source path, and destination path are required.");
    }

    const prefixedSource = `${normalizedRoot}/${normalizedSource}`;
    const prefixedDestination = `${normalizedRoot}/${normalizedDestination}`;

    const attempts = [
      {
        path: "/server/files/move",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: prefixedSource,
          dest: prefixedDestination,
        }),
      },
      {
        path: "/server/files/move",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: normalizedSource,
          dest: normalizedDestination,
          root: normalizedRoot,
        }),
      },
      {
        path: "/server/files/move",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          src: prefixedSource,
          dst: prefixedDestination,
        }),
      },
      {
        path: `/server/files/move?source=${encodeURIComponent(prefixedSource)}&dest=${encodeURIComponent(prefixedDestination)}`,
        method: "POST",
      },
      {
        path: `/server/files/move?source=${encodeURIComponent(normalizedSource)}&dest=${encodeURIComponent(normalizedDestination)}&root=${encodeURIComponent(normalizedRoot)}`,
        method: "POST",
      },
    ];

    let lastError = null;

    for (const attempt of attempts) {
      try {
        const response = await fetch(`${this.baseUrl}${attempt.path}`, {
          method: attempt.method,
          headers: attempt.headers,
          body: attempt.body,
        });

        if (response.ok) {
          return true;
        }

        lastError = new Error(`Moonraker call failed: ${attempt.method} ${attempt.path}`);
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    throw new Error(`Failed to move path: ${prefixedSource} -> ${prefixedDestination}`);
  }

  async deleteDirectory(root, path, { force = true } = {}) {
    const normalizedRoot = String(root || "").trim();
    const normalizedPath = normalizePathSegments(path).join("/");

    if (!normalizedRoot || !normalizedPath) {
      throw new Error("A file root and directory path are required.");
    }

    const prefixedPath = `${normalizedRoot}/${normalizedPath}`;
    const forceSuffix = force ? "&force=true" : "";

    const attempts = [
      {
        path: `/server/files/directory?path=${encodeURIComponent(prefixedPath)}${forceSuffix}`,
        method: "DELETE",
      },
      {
        path: `/server/files/delete_directory?path=${encodeURIComponent(prefixedPath)}${forceSuffix}`,
        method: "DELETE",
      },
      {
        path: `/server/files/delete_directory?path=${encodeURIComponent(prefixedPath)}${forceSuffix}`,
        method: "POST",
      },
      {
        path: "/server/files/delete_directory",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: prefixedPath,
          force: !!force,
        }),
      },
      {
        path: "/server/files/directory",
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: prefixedPath,
          force: !!force,
        }),
      },
      {
        path: "/server/files/directory",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: prefixedPath,
          action: "delete",
          force: !!force,
        }),
      },
    ];

    let lastError = null;

    for (const attempt of attempts) {
      try {
        const response = await fetch(`${this.baseUrl}${attempt.path}`, {
          method: attempt.method,
          headers: attempt.headers,
          body: attempt.body,
        });

        if (response.ok) {
          return true;
        }

        lastError = new Error(`Moonraker call failed: ${attempt.method} ${attempt.path}`);
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    throw new Error(`Failed to delete directory: ${prefixedPath}`);
  }
  async saveConfigFileText(path, content) {
    const { directory, filename } = splitPath(path);
    if (!filename) {
      throw new Error("A config file path is required.");
    }

    const blob = new Blob([content ?? ""], { type: "text/plain" });
    return this.uploadFile("config", blob, directory.length ? directory : "", filename);
  }

  async deleteFile(root, path) {
    const normalizedRoot = String(root || "").trim();
    const normalizedPath = normalizePathSegments(path).join("/");

    if (!normalizedRoot || !normalizedPath) {
      throw new Error("A file root and path are required.");
    }

    const encodedPath = encodePathForUrl(normalizedPath);
    const prefixedPath = `${normalizedRoot}/${normalizedPath}`;
    const attempts = [
      { path: `/server/files/${encodeURIComponent(normalizedRoot)}/${encodedPath}`, method: "DELETE" },
      { path: `/server/files/${encodeURIComponent(normalizedRoot)}/${encodedPath}`, method: "POST" },
      { path: `/server/files/delete_file?path=${encodeURIComponent(normalizedPath)}`, method: "DELETE" },
      { path: `/server/files/delete_file?path=${encodeURIComponent(prefixedPath)}`, method: "DELETE" },
      { path: `/server/files/delete?path=${encodeURIComponent(normalizedPath)}`, method: "DELETE" },
      { path: `/server/files/delete?path=${encodeURIComponent(prefixedPath)}`, method: "DELETE" },
      { path: `/server/files/delete_file?path=${encodeURIComponent(normalizedPath)}`, method: "POST" },
      { path: `/server/files/delete_file?path=${encodeURIComponent(prefixedPath)}`, method: "POST" },
      { path: `/server/files/delete?path=${encodeURIComponent(normalizedPath)}`, method: "POST" },
      { path: `/server/files/delete?path=${encodeURIComponent(prefixedPath)}`, method: "POST" },
    ];

    let lastError = null;

    for (const attempt of attempts) {
      try {
        const response = await fetch(`${this.baseUrl}${attempt.path}`, {
          method: attempt.method,
        });

        if (response.ok) {
          return true;
        }

        lastError = new Error(`Moonraker call failed: ${attempt.method} ${attempt.path}`);
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    throw new Error(`Failed to delete file: ${normalizedRoot}/${normalizedPath}`);
  }

  async deleteConfigFile(path) {
    return this.deleteFile("config", path);
  }

  async deleteLogFile(path) {
    return this.deleteFile("logs", path);
  }
}





