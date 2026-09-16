"use client";

import type { AuditEntry } from "@/lib/auditLog";

const STATUS_STYLES: Record<AuditEntry["status"], string> = {
  success: "text-primary-container",
  automated: "text-secondary",
  blocked: "text-error font-bold",
};

const STATUS_LABEL: Record<AuditEntry["status"], string> = {
  success: "SUCCESS_200",
  automated: "AUTOMATED",
  blocked: "BLOCKED_DROP",
};

export default function AuditLogTable({ entries }: { entries: AuditEntry[] }) {
  function handleExportSyslog() {
    const lines = entries.map(
      (e) =>
        `${e.timestamp}\t${e.principal}\t${e.action}\t${e.target}\t${e.sourceIp}\t${e.status}`
    );
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admin-audit-log.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-card-bg p-5 rounded-2xl border border-border-line shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-secondary">history_edu</span>
          <h2 className="text-base font-bold text-white">Session Security Log</h2>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="px-2 py-1 rounded bg-card-bg-subtle text-primary-container">
            LOGGED THIS SESSION: {entries.length}
          </span>
          <button
            type="button"
            onClick={handleExportSyslog}
            className="px-3 py-1 rounded bg-card-bg-subtle hover:bg-slate-700 text-slate-300 border border-border-line transition-colors"
          >
            Export Syslog
          </button>
        </div>
      </div>

      <p className="text-xs text-on-surface-variant -mt-2">
        Logged for this browser session only — there&apos;s no backend audit
        store yet, so this resets on reload. Entries below reflect actions
        actually taken on this screen, plus a few seeded historical rows.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border-line">
        <table className="w-full text-left font-mono text-[11px]">
          <thead>
            <tr className="bg-card-bg-subtle text-on-surface-variant">
              <th className="py-2.5 px-3">TIMESTAMP</th>
              <th className="py-2.5 px-3">PRINCIPAL</th>
              <th className="py-2.5 px-3">ACTION EVENT</th>
              <th className="py-2.5 px-3">TARGET</th>
              <th className="py-2.5 px-3">SOURCE IP</th>
              <th className="py-2.5 px-3 text-right">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-line text-slate-300">
            {entries.map((e, i) => (
              <tr key={e.id} className={i % 2 === 0 ? "bg-card-bg-subtle/40" : ""}>
                <td className="py-2.5 px-3 text-on-surface-variant">
                  {new Date(e.timestamp).toLocaleString([], {
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </td>
                <td className="py-2.5 px-3 text-primary-container">{e.principal}</td>
                <td className="py-2.5 px-3 font-semibold text-white">{e.action}</td>
                <td className="py-2.5 px-3">{e.target}</td>
                <td className="py-2.5 px-3 text-on-surface-variant">{e.sourceIp}</td>
                <td className={`py-2.5 px-3 text-right ${STATUS_STYLES[e.status]}`}>
                  {STATUS_LABEL[e.status]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}