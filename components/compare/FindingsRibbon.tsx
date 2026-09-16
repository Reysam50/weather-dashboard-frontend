import type { Finding } from "@/lib/compareData";

export default function FindingsRibbon({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) return null;

  return (
    <div className="bg-[#080c14] rounded-xl p-4 shadow-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border border-border-line">
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-card-bg-subtle text-secondary">
          <span className="material-symbols-outlined text-[20px]">insights</span>
        </div>
        <span className="font-mono text-xs uppercase text-white font-bold tracking-wider">
          Atmospheric Diagnostics &amp; Findings
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {findings.map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-card-bg shadow-sm"
          >
            <span className={`material-symbols-outlined text-[16px] ${f.color}`}>{f.icon}</span>
            <span className="font-mono text-[11px] text-slate-200">
              <strong className={`${f.color} font-semibold`}>{f.label}:</strong> {f.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}