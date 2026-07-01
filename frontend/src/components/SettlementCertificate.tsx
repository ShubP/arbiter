"use client";

import { motion } from "framer-motion";
import type {
  Allocation,
  FairnessReport,
  Item,
  Party,
} from "@/lib/negotiation";

interface SettlementCertificateProps {
  parties: Party[];
  items: Item[];
  allocation: Allocation;
  report: FairnessReport;
  rationale: Record<string, string>;
}

function Seal() {
  return (
    <div className="relative grid h-20 w-20 place-items-center">
      <div className="absolute inset-0 rounded-full border-2 border-brass" />
      <div className="absolute inset-1.5 rounded-full border border-brass/50" />
      <span className="text-center font-sans text-[9px] font-semibold uppercase leading-tight tracking-widest text-brass">
        Certified
        <br />
        fair
      </span>
    </div>
  );
}

export function SettlementCertificate({
  parties,
  items,
  allocation,
  report,
  rationale,
}: SettlementCertificateProps) {
  const itemLabel = (id: string) =>
    items.find((i) => i.id === id)?.label ?? id;
  const heldBy = (partyId: string) =>
    Object.entries(allocation.items)
      .filter(([, owner]) => owner === partyId)
      .map(([itemId]) => itemLabel(itemId));

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="paper relative overflow-hidden rounded-2xl p-8 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-[#8a7a52]">
            Settlement Agreement
          </p>
          <h2 className="mt-1 font-display text-3xl text-[#2a2418]">
            A fair division, agreed
          </h2>
        </div>
        <Seal />
      </div>

      <div className="my-6 grid gap-5 sm:grid-cols-2">
        {parties.map((party) => (
          <div
            key={party.id}
            className="rounded-lg border border-[#c9bfa4] bg-[#f6f1e4] p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-lg text-[#2a2418]">
                {party.name}
              </p>
              <p className="font-mono text-sm text-[#5a5138]">
                {Math.round(report.utilities[party.id])} value
              </p>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-[#3a3320]">
              {heldBy(party.id).map((label) => (
                <li key={label}>• {label}</li>
              ))}
              <li className="font-mono text-[#6a5f3e]">
                {allocation.cash[party.id] >= 0 ? "+" : "−"}$
                {Math.abs(allocation.cash[party.id])}k cash
              </li>
            </ul>
            <p className="mt-3 border-t border-[#d8cfb5] pt-3 text-xs leading-relaxed text-[#5a5138]">
              {rationale[party.id]}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["Envy-free", report.envyFree],
          ["Proportional", report.proportional],
          ["Pareto-efficient", report.paretoEfficient],
        ].map(([label, ok]) => (
          <span
            key={label as string}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              ok
                ? "bg-[#2a2418] text-[#e4c375]"
                : "bg-[#c05640]/15 text-[#c05640]"
            }`}
          >
            {ok ? "✓" : "✗"} {label}
          </span>
        ))}
        <span className="rounded-full bg-[#2a2418]/5 px-3 py-1 font-mono text-xs text-[#5a5138]">
          Nash welfare {report.nashWelfare.toLocaleString()}
        </span>
      </div>
    </motion.article>
  );
}
