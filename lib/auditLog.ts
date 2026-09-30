export interface AuditEntry {
  id: string;
  timestamp: string; // ISO
  principal: string;
  action: string;
  target: string;
  sourceIp: string;
  status: "success" | "automated" | "blocked";
}


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