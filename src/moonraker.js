const JSONRPC = "2.0";

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
      body: JSON.stringify({}),
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
      this.send({ method: "printer.objects.subscribe", params: { objects: { print_stats: null, extruder: null, heater_bed: null, toolhead: null } } });
    });

    this.ws.addEventListener("close", () => this.setConnectionState("disconnected"));
    this.ws.addEventListener("error", () => this.setConnectionState("error"));

    this.ws.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data);
        this.wsCallbacks.forEach((cb) => cb(payload));
      } catch (error) {
        console.error("Invalid websocket payload", error);
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
}
