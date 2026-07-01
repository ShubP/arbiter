import type { FairnessReport } from "@/lib/negotiation";

/** Compact fairness readout shown under the two-party Balance. */
export function FairnessConsole({ report }: { report: FairnessReport | null }) {
  const chips: Array<[string, boolean | undefined]> = [
    ["envy-free", report?.envyFree],
    ["proportional", report?.proportional],
    ["efficient", report?.paretoEfficient],
  ];
  return (
    <div className="mt-2 w-full">
      <div className="flex items-center justify-center gap-2 font-mono text-xs text-parchment/60">
        <span>max envy</span>
        <span className="text-parchment">
          {report ? Math.round(report.maxEnvy) : "—"}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {chips.map(([label, ok]) => (
          <span
            key={label}
            className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
              ok ? "bg-accord/20 text-accord" : "bg-ink-line/60 text-parchment/40"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
