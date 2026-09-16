export interface AuditEntry {
  id: string;
  timestamp: string; // ISO
  principal: string;
  action: string;
  target: string;
  sourceIp: string;
  status: "success" | "automated" | "blocked";
}

/**
 * Seed history so the Audit tab isn't empty on first load. Real entries
 * (added via newAuditEntry, called from app/(protected)/admin/page.tsx)
 * get prepended on top of this during the session — there's no backend
 * audit log yet, so nothing here persists across a page reload.
 */
export const SEED_AUDIT_LOG: AuditEntry[] = [
  {
    id: "seed-1",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    principal: "daemon::telemetry-ingest",
    action: "QNH_BAROMETRIC_NORMALIZATION",
    target: "All Operational Nodes",
    sourceIp: "127.0.0.1 (Local Pipe)",
    status: "automated",
  },
  {
    id: "seed-2",
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    principal: "thoko@unima.ac.mw",
    action: "SENSOR_CALIBRATION_OFFSET",
    target: "CC-SHT31-TEMP (+0.04C)",
    sourceIp: "41.70.19.88",
    status: "success",
  },
  {
    id: "seed-3",
    timestamp: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
    principal: "UNKNOWN_ACTOR",
    action: "SSH_PORT_KNOCK_REJECTED",
    target: "Edge Gateway 22/tcp",
    sourceIp: "185.220.101.5",
    status: "blocked",
  },
];

export function newAuditEntry(
  principal: string,
  action: string,
  target: string,
  status: AuditEntry["status"] = "success"
): AuditEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    principal,
    action,
    target,
    sourceIp: "127.0.0.1 (This Session)",
    status,
  };
}