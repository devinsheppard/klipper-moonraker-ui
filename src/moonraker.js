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
      throw new Error(`Moonraker call failed: ${path}`);
    }
    return response.json();
  }

  connectWebSocket() {
    const wsUrl = this.baseUrl.replace("http://", "ws://").replace("https://", "wss://") + "/websocket";
    this.ws = new WebSocket(wsUrl);

    this.ws.addEventListener("open", () => {
      this.setConnectionState("connected");
      this.send({ method: "printer.objects.subscribe", params: { objects: { print_stats: null, virtual_sdcard: null, gcode_move: null, motion_report: null, extruder: null, heater_bed: null, toolhead: null } } });
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

  async getServerInfo() {
    return this.call("/server/info");
  }

  async getMachineSystemInfo() {
    return this.call("/machine/system_info");
  }

  async getMachineProcStats() {
    return this.call("/machine/proc_stats");
  }

  async getMcuAndSystemStats() {
    return this.call("/printer/objects/query?mcu&system_stats");
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

  async saveConfigFileText(path, content) {
    const { directory, filename } = splitPath(path);
    if (!filename) {
      throw new Error("A config file path is required.");
    }

    const blob = new Blob([content ?? ""], { type: "text/plain" });
    return this.uploadFile("config", blob, directory.length ? directory : "", filename);
  }

  async deleteConfigFile(path) {
    const normalizedPath = normalizePathSegments(path).join("/");
    if (!normalizedPath) {
      throw new Error("A config file path is required.");
    }

    const encodedPath = encodePathForUrl(normalizedPath);
    const prefixedPath = `config/${normalizedPath}`;
    const attempts = [
      { path: `/server/files/config/${encodedPath}`, method: "DELETE" },
      { path: `/server/files/config/${encodedPath}`, method: "POST" },
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

    throw new Error(`Failed to delete config file: ${normalizedPath}`);
  }
}

