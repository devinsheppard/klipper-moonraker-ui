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

  async callJsonRpc(method, params = {}) {
    const response = await fetch(`${this.baseUrl}/server/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: JSONRPC,
        method,
        params,
        id: ++this.requestId,
      }),
    });

    const rawBody = await response.text().catch(() => "");
    let payload = null;
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      const details = payload?.error?.message || (rawBody ? rawBody.slice(0, 200) : "");
      const suffix = details ? `: ${details}` : "";
      throw new Error(`Moonraker JSON-RPC failed (${response.status}): ${method}${suffix}`);
    }

    if (payload?.error) {
      const message = payload?.error?.message || "Unknown error";
      const error = new Error(`Moonraker JSON-RPC failed: ${method}: ${message}`);
      error.code = payload?.error?.code;
      throw error;
    }

    if (payload && Object.prototype.hasOwnProperty.call(payload, "result")) {
      return payload.result;
    }

    return payload;
  }

  parseSpoolmanProxyResponse(payload) {
    const normalized = payload?.response ?? payload;

    if (normalized?.error) {
      const rawError = normalized.error;
      const message = typeof rawError === "string"
        ? rawError
        : String(rawError?.message || "Unknown spoolman proxy error");
      throw new Error(`Spoolman proxy error: ${message}`);
    }

    if (normalized && Object.prototype.hasOwnProperty.call(normalized, "result")) {
      return normalized.result;
    }

    return normalized;
  }

  async spoolmanProxy(path, { requestMethod = "GET", body = null, useV2Response = true } = {}) {
    const normalizedPath = String(path || "").trim();
    if (!normalizedPath.startsWith("/")) {
      throw new Error("Spoolman proxy path must start with '/'.");
    }

    const method = String(requestMethod || "GET").trim().toUpperCase() || "GET";
    const params = {
      path: normalizedPath,
      request_method: method,
    };

    if (useV2Response != null) {
      params.use_v2_response = !!useV2Response;
    }

    if (body != null) {
      params.body = body;
    }

    const result = await this.callJsonRpc("server.spoolman.proxy", params);
    return this.parseSpoolmanProxyResponse(result);
  }

  async getSpoolmanHealth() {
    return this.spoolmanProxy("/v1/health");
  }

  async getSpoolmanInfo() {
    return this.spoolmanProxy("/v1/info");
  }

  async getSpoolmanSpools() {
    return this.spoolmanProxy("/v1/spool");
  }

  async getSpoolmanSpool(spoolId) {
    const numericId = Number(spoolId);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      throw new Error(`Invalid spool ID: ${spoolId}`);
    }
    return this.spoolmanProxy(`/v1/spool/${Math.round(numericId)}`);
  }

  async getSpoolmanActiveSpoolId() {
    const result = await this.callJsonRpc("server.spoolman.get_spool_id", {});
    const numericId = Number(result?.spool_id ?? result?.result?.spool_id ?? result);

    return {
      spool_id: Number.isFinite(numericId) && numericId > 0
        ? Math.round(numericId)
        : null,
    };
  }

  async setSpoolmanActiveSpoolId(spoolId = null) {
    let normalizedId = null;

    if (spoolId != null && spoolId !== "") {
      const numericId = Number(spoolId);
      if (!Number.isFinite(numericId) || numericId <= 0) {
        throw new Error(`Invalid spool ID: ${spoolId}`);
      }
      normalizedId = Math.round(numericId);
    }

    const params = { spool_id: normalizedId };
    const result = await this.callJsonRpc("server.spoolman.post_spool_id", params);
    const responseId = Number(result?.spool_id ?? result?.result?.spool_id ?? normalizedId);

    return {
      spool_id: Number.isFinite(responseId) && responseId > 0
        ? Math.round(responseId)
        : null,
    };
  }

  async callWebSocketJsonRpc(method, params = {}, { timeoutMs = 5000 } = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Moonraker websocket is not connected: ${method}`);
    }

    const requestId = ++this.requestId;

    return new Promise((resolve, reject) => {
      let done = false;

      const cleanup = () => {
        if (timer) {
          clearTimeout(timer);
        }
        unsubscribe();
      };

      const finishResolve = (value) => {
        if (done) return;
        done = true;
        cleanup();
        resolve(value);
      };

      const finishReject = (error) => {
        if (done) return;
        done = true;
        cleanup();
        reject(error);
      };

      const unsubscribe = this.onMessage((payload) => {
        if (!payload || payload.id !== requestId) {
          return;
        }

        if (payload.error) {
          const message = payload?.error?.message || "Unknown error";
          const rpcError = new Error(`Moonraker websocket JSON-RPC failed: ${method}: ${message}`);
          rpcError.code = payload?.error?.code;
          finishReject(rpcError);
          return;
        }

        if (Object.prototype.hasOwnProperty.call(payload, "result")) {
          finishResolve(payload.result);
          return;
        }

        finishResolve(payload);
      });

      const timer = setTimeout(() => {
        finishReject(new Error(`Moonraker websocket JSON-RPC timed out: ${method}`));
      }, Math.max(1000, Number(timeoutMs) || 5000));

      try {
        this.ws.send(JSON.stringify({
          jsonrpc: JSONRPC,
          method,
          params,
          id: requestId,
        }));
      } catch (error) {
        finishReject(error);
      }
    });
  }

  connectWebSocket() {
    const wsUrl = this.baseUrl.replace("http://", "ws://").replace("https://", "wss://") + "/websocket";
    this.ws = new WebSocket(wsUrl);

    this.ws.addEventListener("open", () => {
      this.setConnectionState("connected");
      this.send({ method: "printer.objects.subscribe", params: { objects: { print_stats: null, virtual_sdcard: null, gcode_move: null, motion_report: null, extruder: null, heater_bed: null, toolhead: null, manual_probe: null, stepper_enable: null, bed_mesh: null } } });
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

  async getDirectory(path, { extended = true } = {}) {
    const normalizedPath = normalizePathSegments(path).join("/");
    if (!normalizedPath) {
      throw new Error("A directory path is required.");
    }

    let lastError = null;
    const query = `path=${encodeURIComponent(normalizedPath)}${extended ? "&extended=true" : ""}`;

    try {
      return await this.call(`/server/files/directory?${query}`);
    } catch (error) {
      lastError = error;
    }

    if (extended) {
      try {
        return await this.call(`/server/files/directory?path=${encodeURIComponent(normalizedPath)}`);
      } catch (error) {
        lastError = error;
      }
    }

    const rpcParams = extended
      ? { path: normalizedPath, extended: true }
      : { path: normalizedPath };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        return await this.callWebSocketJsonRpc("server.files.get_directory", rpcParams);
      } catch (error) {
        lastError = error;
      }
    }

    try {
      return await this.callJsonRpc("server.files.get_directory", rpcParams);
    } catch (error) {
      lastError = error;
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    throw new Error(`Failed to read directory: ${normalizedPath}`);
  }

  async getGcodeDirectory(path = "", options = {}) {
    const normalizedPath = normalizePathSegments(path).join("/");
    const prefixedPath = normalizedPath ? `gcodes/${normalizedPath}` : "gcodes";
    return this.getDirectory(prefixedPath, options);
  }

  async getFileMetadata(path) {
    const normalizedPath = normalizePathSegments(path).join("/");
    if (!normalizedPath) {
      throw new Error("A file path is required.");
    }

    return this.call(`/server/files/metadata?filename=${encodeURIComponent(normalizedPath)}`);
  }

  async queryPrinterObjects(objects = []) {
    const objectList = Array.isArray(objects)
      ? objects
      : String(objects || "")
        .split(/[,&]/)
        .map((entry) => String(entry || "").trim())
        .filter(Boolean);

    const query = objectList
      .map((entry) => String(entry || "").trim())
      .filter(Boolean)
      .map((entry) => encodeURIComponent(entry))
      .join("&");

    if (!query) {
      throw new Error("At least one printer object is required.");
    }

    return this.call(`/printer/objects/query?${query}`);
  }

  async getTimelapseSettings() {
    return this.callJsonRpc("machine.timelapse.get_settings", {});
  }

  async saveTimelapseSettings(settingsPatch = {}) {
    const payload = settingsPatch && typeof settingsPatch === "object" ? settingsPatch : {};
    return this.callJsonRpc("machine.timelapse.post_settings", payload);
  }

  async getWebcamsList() {
    let lastError = null;

    try {
      return await this.call("/server/webcams/list");
    } catch (error) {
      lastError = error;
    }

    try {
      return await this.callJsonRpc("server.webcams.list", {});
    } catch (error) {
      lastError = error;
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    throw new Error("Failed to list webcams.");
  }

  async selectPrintFile(path) {
    const normalizedPath = normalizePathSegments(path).join("/");
    if (!normalizedPath) {
      throw new Error("A print file path is required.");
    }

    const escapedPath = normalizedPath.replace(/\"/g, "\\\"");
    const attempts = [
      `M23 "${escapedPath}"`,
      `M23 ${normalizedPath}`,
      `M23 /${normalizedPath}`,
    ];

    let lastError = null;

    for (const command of attempts) {
      try {
        await this.runGcode(command);
        return true;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    throw new Error(`Failed to select print file: ${normalizedPath}`);
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

  async createDatabaseBackup(filename) {
    const normalizedFilename = String(filename || "").trim();
    if (!normalizedFilename) {
      throw new Error("A backup filename is required.");
    }

    let lastError = null;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        return await this.callWebSocketJsonRpc("server.database.post_backup", {
          filename: normalizedFilename,
        });
      } catch (error) {
        lastError = error;
      }
    }

    try {
      return await this.callJsonRpc("server.database.post_backup", {
        filename: normalizedFilename,
      });
    } catch (error) {
      lastError = error;
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    throw new Error(`Failed to create database backup: ${normalizedFilename}`);
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
    const { directory: parentPath, filename: directoryName } = splitPath(normalizedPath);
    const prefixedParentPath = parentPath ? `${normalizedRoot}/${parentPath}` : normalizedRoot;

    const attempts = [
      {
        path: `/server/files/directory?path=${encodeURIComponent(prefixedPath)}`,
        method: "POST",
      },
      {
        path: `/server/files/directory?path=${encodeURIComponent(prefixedParentPath)}&dirname=${encodeURIComponent(directoryName)}`,
        method: "POST",
      },
      {
        path: "/server/files/directory",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: prefixedPath }),
      },
      {
        path: "/server/files/directory",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: prefixedParentPath, dirname: directoryName }),
      },
      {
        path: "/server/files/directory",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ root: normalizedRoot, path: parentPath, dirname: directoryName }),
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

        const detailsText = await response.text().catch(() => "");
        const details = detailsText ? `: ${detailsText.slice(0, 200)}` : "";
        lastError = new Error(`Moonraker call failed (${response.status}): ${attempt.method} ${attempt.path}${details}`);
      } catch (error) {
        lastError = error;
      }
    }

    const rpcAttempts = [
      { method: "server.files.post_directory", params: { path: prefixedPath } },
      { method: "server.files.post_directory", params: { path: `${prefixedPath}/` } },
      { method: "server.files.post_directory", params: { path: prefixedParentPath, dirname: directoryName } },
      { method: "server.files.post_directory", params: { path: prefixedPath, make_parents: true } },
    ];

    const canUseWebSocketRpc = !!this.ws && this.ws.readyState === WebSocket.OPEN;

    for (const attempt of rpcAttempts) {
      if (canUseWebSocketRpc) {
        try {
          await this.callWebSocketJsonRpc(attempt.method, attempt.params);
          return true;
        } catch (error) {
          lastError = error;
        }
      }

      try {
        await this.callJsonRpc(attempt.method, attempt.params);
        return true;
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

    const rpcAttempts = [
      {
        method: "server.files.move",
        params: { source: prefixedSource, dest: prefixedDestination },
      },
      {
        method: "server.files.move",
        params: { source: normalizedSource, dest: normalizedDestination, root: normalizedRoot },
      },
      {
        method: "server.files.move",
        params: { src: prefixedSource, dst: prefixedDestination },
      },
    ];

    for (const attempt of rpcAttempts) {
      try {
        await this.callJsonRpc(attempt.method, attempt.params);
        return true;
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

    const rpcAttempts = [
      {
        method: "server.files.delete_directory",
        params: { path: prefixedPath, force: !!force },
      },
      {
        method: "server.files.delete_directory",
        params: { path: normalizedPath, root: normalizedRoot, force: !!force },
      },
    ];

    for (const attempt of rpcAttempts) {
      try {
        await this.callJsonRpc(attempt.method, attempt.params);
        return true;
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

    const rpcAttempts = [
      {
        method: "server.files.delete_file",
        params: { path: prefixedPath },
      },
      {
        method: "server.files.delete_file",
        params: { path: normalizedPath, root: normalizedRoot },
      },
    ];

    for (const attempt of rpcAttempts) {
      try {
        await this.callJsonRpc(attempt.method, attempt.params);
        return true;
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
