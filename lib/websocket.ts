/**
 * Single WebSocket connection owner. Per coding-standards.md §3: components
 * subscribe to this rather than each opening their own socket.
 *
 * Reconnection behavior (system-architecture.md §4, post-Sprint-1 audit
 * Finding #10, CONFIRMED): on reconnect, re-fetch current state via REST
 * (apiFetch) BEFORE resuming live updates — never silently resume from just
 * the next pushed message, since that risks showing a stale value with no
 * indication of how stale it is (NFR-3.2).
 *
 * Message shapes from the backend (api-specification.md §7):
 *   {"station_id": ..., "reading": {...}}      - new telemetry
 *   {"station_id": ..., "status": "offline"}    - staleness detected
 */

type MessageHandler = (data: unknown) => void;

export class DashboardSocket {
  private ws: WebSocket | null = null;
  private handlers = new Set<MessageHandler>();
  private subscribedStations = new Set<string>();

  connect() {
    const url = process.env.NEXT_PUBLIC_WS_URL ?? "/ws";
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      // TODO (frontend developer): on (re)connect, first re-fetch via apiFetch
      // for every station in this.subscribedStations, THEN re-send subscribe
      // messages and resume live updates. Do not skip the re-fetch step.
      for (const stationId of this.subscribedStations) {
        this.ws?.send(JSON.stringify({ subscribe: stationId }));
      }
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handlers.forEach((h) => h(data));
    };

    this.ws.onclose = () => {
      // TODO (frontend developer): reconnect with backoff
    };
  }

  subscribe(stationId: string, handler: MessageHandler) {
    this.subscribedStations.add(stationId);
    this.handlers.add(handler);
    this.ws?.send(JSON.stringify({ subscribe: stationId }));
    return () => this.handlers.delete(handler);
  }
}

export const dashboardSocket = new DashboardSocket();
