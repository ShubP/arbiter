"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { FairnessReport, Item, Party } from "@/lib/negotiation";
import { AdvocatePanel } from "./AdvocatePanel";
import { Balance } from "./Balance";
import { SettlementCertificate } from "./SettlementCertificate";
import { TranscriptFeed } from "./TranscriptFeed";
import type { NegotiationState } from "./useNegotiation";

const PLACEHOLDER: Party[] = [
  { id: "a", name: "Party A", role: "Advocate", side: "a" },
  { id: "b", name: "Party B", role: "Advocate", side: "b" },
];

export function NegotiationView(state: NegotiationState) {
  const {
    parties,
    items,
    transcript,
    report,
    allocation,
    settlement,
    activeParty,
    phase,
    error,
  } = state;

  const shown = parties.length === 2 ? parties : PLACEHOLDER;
  const heldItems = (partyId: string): Item[] =>
    allocation ? items.filter((it) => allocation.items[it.id] === partyId) : [];

  return (
    <div className="w-full">
      <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <AdvocatePanel
          party={shown[0]}
          heldItems={heldItems(shown[0].id)}
          cash={allocation?.cash[shown[0].id]}
          utility={report?.utilities[shown[0].id]}
          align="left"
          active={activeParty === shown[0].id}
        />

        <div className="flex flex-col items-center justify-between rounded-xl border border-ink-line bg-ink-raised/40 px-6 py-4">
          <div className="h-52 w-72">
            <Balance
              utilityA={report?.utilities[shown[0].id] ?? 0}
              utilityB={report?.utilities[shown[1].id] ?? 0}
              certified={report?.certifiedFair ?? false}
            />
          </div>
          <FairnessConsole report={report} />
        </div>

        <AdvocatePanel
          party={shown[1]}
          heldItems={heldItems(shown[1].id)}
          cash={allocation?.cash[shown[1].id]}
          utility={report?.utilities[shown[1].id]}
          align="right"
          active={activeParty === shown[1].id}
        />
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-tension/40 bg-tension/10 px-4 py-3 text-center text-sm text-tension">
          {error}
        </p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="max-h-[26rem] min-h-[16rem] overflow-hidden rounded-xl border border-ink-line bg-ink-raised/30 p-4">
          {transcript.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <p className="max-w-xs text-sm text-parchment/35">
                {phase === "running"
                  ? "Convening the advocates…"
                  : "The negotiation transcript appears here, turn by turn."}
              </p>
            </div>
          ) : (
            <TranscriptFeed entries={transcript} />
          )}
        </div>
        <div className="min-h-[16rem]">
          <AnimatePresence mode="wait">
            {settlement ? (
              <SettlementCertificate
                key="cert"
                parties={shown}
                items={items}
                allocation={settlement.allocation}
                report={settlement.report}
                rationale={settlement.rationale}
              />
            ) : (
              <motion.div
                key="placeholder"
                exit={{ opacity: 0 }}
                className="flex h-full items-center justify-center rounded-xl border border-dashed border-ink-line/70 p-8 text-center"
              >
                <p className="max-w-xs text-sm text-parchment/40">
                  The signed settlement, with its fairness certificate, appears
                  here once the advocates reach agreement.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function FairnessConsole({ report }: { report: FairnessReport | null }) {
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
