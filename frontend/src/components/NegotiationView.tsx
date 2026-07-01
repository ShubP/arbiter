"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Item, Party } from "@/lib/negotiation";
import { partyColor } from "@/lib/palette";
import { AdvocatePanel } from "./AdvocatePanel";
import { Balance } from "./Balance";
import { FairnessConsole } from "./FairnessConsole";
import { FairnessDial } from "./FairnessDial";
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

  const shown = parties.length >= 2 ? parties : PLACEHOLDER;
  const twoParty = shown.length === 2;
  const heldItems = (partyId: string): Item[] =>
    allocation ? items.filter((it) => allocation.items[it.id] === partyId) : [];

  const panel = (party: Party, i: number, align?: "left" | "right") => (
    <AdvocatePanel
      key={party.id}
      party={party}
      color={partyColor(i)}
      heldItems={heldItems(party.id)}
      cash={allocation?.cash[party.id]}
      utility={report?.utilities[party.id]}
      align={align}
      active={activeParty === party.id}
    />
  );

  return (
    <div className="w-full">
      {twoParty ? (
        <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
          {panel(shown[0], 0, "left")}
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
          {panel(shown[1], 1, "right")}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center rounded-xl border border-ink-line bg-ink-raised/40 py-6">
            <FairnessDial report={report} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p, i) => panel(p, i))}
          </div>
        </div>
      )}

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
