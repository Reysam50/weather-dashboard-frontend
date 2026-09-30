/**
 * Single WebSocket connection owner. Per coding-standards.md §3: components
 * subscribe to this rather than each opening their own socket — in practice
 * that means going through the useLiveTelemetry hook, not this class
 * directly.
 *
 * Message shapes from the backend (api-specification.md §7):
 *   {"station_id": ..., "reading": {...}}      - new telemetry
 *   {"station_id": ..., "status": "offline"}   - staleness detected
 */

export interface ReadingMessage {
  station_id: string;
  reading: Record<string, unknown>;
}
export interface StatusMessage {
  station_id: string;
  status: "online" | "offline";
}
export type SocketMessage = ReadingMessage | StatusMessage;

type MessageHandler = (data: SocketMessage) => void;
type ResyncHandler = () => void;
export type SocketConnectionState = "connecting" | "open" | "closed";
type ConnectionStateHandler = (state: SocketConnectionState) => void;

const MAX_RECONNECT_DELAY_MS = 30_000;
const BASE_RECONNECT_DELAY_MS = 1_000;

export class DashboardSocket {
  private ws: WebSocket | null = null;
  private handlers = new Set<MessageHandler>();
  private resyncHandlers = new Set<ResyncHandler>();
  private connectionStateHandlers = new Set<ConnectionStateHandler>();
  private subscribedStations = new Set<string>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = true;
  private connectionState: SocketConnectionState = "closed";

  connect() {
    if (typeof WebSocket === "undefined") return; // SSR guard
    this.manuallyClosed = false;
    if (this.ws && this.connectionState !== "closed") return; // already connecting/open
    this.openSocket();
  }

  disconnect() {
    this.manuallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  /**
   * Registers a station's interest in live updates. Sends the subscribe
   * message immediately if already connected; otherwise it's sent as soon
   * as the socket opens (see openSocket's onopen below). Returns an
   * unsubscribe function that stops delivering messages to this handler —
   * it does not tell the server to stop pushing for this station, since
   * another subscriber elsewhere in the app may still want them.
   */
  subscribe(stationId: string, handler: MessageHandler) {
    this.subscribedStations.add(stationId);
    this.handlers.add(handler);
    if (this.connectionState === "open") {
      this.ws?.send(JSON.stringify({ subscribe: stationId }));
    }
    return () => {
      this.handlers.delete(handler);
    };
  }

  /**
   * Registers a callback to run once per successful (re)connect, BEFORE
   * subscribe messages are resent. Per system-architecture.md §4 (post-
   * Sprint-1 audit Finding #10, CONFIRMED): on reconnect, re-fetch current
   * state via REST before resuming live updates — never silently resume
   * from just the next pushed message, since that risks showing a stale
   * value with no indication of how stale it is (NFR-3.2). Callers
   * (useLiveTelemetry) pass their own apiFetch-based re-fetch here.
   */
  onResync(handler: ResyncHandler) {
    this.resyncHandlers.add(handler);
    return () => this.resyncHandlers.delete(handler);
  }

  /** Fires immediately with the current state, then on every change — lets
   * a hook show "reconnecting…" rather than silently going stale. */
  onConnectionStateChange(handler: ConnectionStateHandler) {
    this.connectionStateHandlers.add(handler);
    handler(this.connectionState);
    return () => this.connectionStateHandlers.delete(handler);
  }

  private setConnectionState(state: SocketConnectionState) {
    this.connectionState = state;
    this.connectionStateHandlers.forEach((h) => h(state));
  }

  private openSocket() {
    const url = process.env.NEXT_PUBLIC_WS_URL ?? "/ws";
    this.setConnectionState("connecting");
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      if (this.ws !== ws) return; // a newer socket superseded this one
      this.reconnectAttempt = 0;
      this.setConnectionState("open");
      this.resyncHandlers.forEach((h) => h());
      for (const stationId of this.subscribedStations) {
        ws.send(JSON.stringify({ subscribe: stationId }));
      }
    };

    ws.onmessage = (event) => {
      if (this.ws !== ws) return;
      try {
        const data = JSON.parse(event.data) as SocketMessage;
        this.handlers.forEach((h) => h(data));
      } catch {
        // Malformed message from the server — ignore it rather than crash
        // the whole socket over one bad frame.
      }
    };

    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.setConnectionState("closed");
      if (this.manuallyClosed) return;
      const delay = Math.min(MAX_RECONNECT_DELAY_MS, BASE_RECONNECT_DELAY_MS * 2 ** this.reconnectAttempt);
      this.reconnectAttempt += 1;
      this.reconnectTimer = setTimeout(() => this.openSocket(), delay);
    };

    ws.onerror = () => {
      // Let onclose (which always fires after onerror for a WebSocket)
      // own the actual reconnect scheduling, so it isn't done twice.
      ws.close();
    };
  }
}

export const dashboardSocket = new DashboardSocket();