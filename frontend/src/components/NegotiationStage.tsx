"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Allocation,
  type FairnessReport,
  cofounderScenario,
  type Item,
  type NegotiationEvent,
  type Party,
} from "@/lib/negotiation";
import { AdvocatePanel } from "./AdvocatePanel";
import { Balance } from "./Balance";
import { SettlementCertificate } from "./SettlementCertificate";
import { TranscriptFeed, type TranscriptEntry } from "./TranscriptFeed";

type Phase = "idle" | "running" | "settled";

const DELAY: Record<NegotiationEvent["type"], number> = {
  session_started: 700,
  intake: 1300,
  proposal: 2100,
  mediator: 2000,
  concession: 1500,
  fairness_update: 1400,
  settlement: 600,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function partyName(parties: Party[], id: string) {
  return parties.find((p) => p.id === id)?.name ?? id;
}

export function NegotiationStage() {
  const { parties, items, events } = cofounderScenario;
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [report, setReport] = useState<FairnessReport | null>(null);
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [settlement, setSettlement] = useState<
    Extract<NegotiationEvent, { type: "settlement" }> | null
  >(null);
  const [activeParty, setActiveParty] = useState<string | null>(null);
  const runId = useRef(0);

  const heldItems = useCallback(
    (partyId: string): Item[] =>
      allocation
        ? items.filter((it) => allocation.items[it.id] === partyId)
        : [],
    [allocation, items],
  );

  const run = useCallback(async () => {
    const myRun = ++runId.current;
    setPhase("running");
    setTranscript([]);
    setReport(null);
    setAllocation(null);
    setSettlement(null);
    setActiveParty(null);
    let counter = 0;

    for (const event of events) {
      if (runId.current !== myRun) return; // superseded by a restart
      await sleep(DELAY[event.type]);
      if (runId.current !== myRun) return;

      switch (event.type) {
        case "intake":
          setTranscript((t) => [
            ...t,
            { id: counter++, speaker: "intake", label: "Intake", text: event.text },
          ]);
          break;
        case "proposal":
          setAllocation(event.allocation);
          setReport(event.report);
          setActiveParty(event.partyId);
          setTranscript((t) => [
            ...t,
            {
              id: counter++,
              speaker: event.partyId as "ava" | "ben",
              label: `${partyName(parties, event.partyId)} · ${event.kind}`,
              text: event.rationale,
              round: event.round,
            },
          ]);
          break;
        case "mediator":
          setActiveParty(null);
          setTranscript((t) => [
            ...t,
            {
              id: counter++,
              speaker: "mediator",
              label: "Mediator",
              text: event.text,
              round: event.round,
            },
          ]);
          break;
        case "concession":
          setActiveParty(event.partyId);
          setTranscript((t) => [
            ...t,
            {
              id: counter++,
              speaker: event.partyId as "ava" | "ben",
              label: `${partyName(parties, event.partyId)} concedes`,
              text: event.text,
              round: event.round,
            },
          ]);
          break;
        case "fairness_update":
          setReport(event.report);
          break;
        case "settlement":
          setAllocation(event.allocation);
          setReport(event.report);
          setSettlement(event);
          setActiveParty(null);
          setPhase("settled");
          break;
      }
    }
  }, [events, parties]);

  useEffect(() => () => void runId.current++, []); // cancel on unmount

  const certified = report?.certifiedFair ?? false;

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Fairness console + balance + advocates */}
      <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <AdvocatePanel
          party={parties[0]}
          heldItems={heldItems(parties[0].id)}
          cash={allocation?.cash[parties[0].id]}
          utility={report?.utilities[parties[0].id]}
          align="left"
          active={activeParty === parties[0].id}
        />

        <div className="flex flex-col items-center justify-between rounded-xl border border-ink-line bg-ink-raised/40 px-6 py-4">
          <div className="h-52 w-72">
            <Balance
              utilityA={report?.utilities[parties[0].id] ?? 0}
              utilityB={report?.utilities[parties[1].id] ?? 0}
              certified={certified}
            />
          </div>
          <FairnessConsole report={report} />
        </div>

        <AdvocatePanel
          party={parties[1]}
          heldItems={heldItems(parties[1].id)}
          cash={allocation?.cash[parties[1].id]}
          utility={report?.utilities[parties[1].id]}
          align="right"
          active={activeParty === parties[1].id}
        />
      </div>

      {/* Control */}
      <div className="my-6 flex justify-center">
        <button
          type="button"
          onClick={run}
          disabled={phase === "running"}
          className="group relative rounded-full bg-brass px-8 py-3 font-sans text-sm font-semibold uppercase tracking-widest text-ink transition hover:bg-brass-bright disabled:cursor-not-allowed disabled:opacity-60"
        >
          {phase === "idle" && "Convene the table"}
          {phase === "running" && "Negotiating…"}
          {phase === "settled" && "Replay negotiation"}
        </button>
      </div>

      {/* Transcript + settlement */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="max-h-[26rem] min-h-[16rem] overflow-hidden rounded-xl border border-ink-line bg-ink-raised/30 p-4">
          <TranscriptFeed entries={transcript} />
        </div>
        <div className="min-h-[16rem]">
          <AnimatePresence mode="wait">
            {settlement ? (
              <SettlementCertificate
                key="cert"
                parties={parties}
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
              ok
                ? "bg-accord/20 text-accord"
                : "bg-ink-line/60 text-parchment/40"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
