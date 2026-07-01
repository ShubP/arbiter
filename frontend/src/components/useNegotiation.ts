"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { streamNegotiation } from "@/lib/api";
import {
  type Allocation,
  cofounderScenario,
  type DisputePayload,
  type FairnessReport,
  type Item,
  type NegotiationEvent,
  type Party,
} from "@/lib/negotiation";
import { partyColor } from "@/lib/palette";
import type { TranscriptEntry } from "./TranscriptFeed";

export type Phase = "idle" | "running" | "settled" | "error";
type Source = "live" | "demo" | null;

const DEMO_DELAY: Record<NegotiationEvent["type"], number> = {
  session_started: 400,
  intake: 1200,
  proposal: 2000,
  mediator: 1900,
  concession: 1400,
  fairness_update: 1300,
  settlement: 400,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface NegotiationState {
  phase: Phase;
  source: Source;
  error: string | null;
  parties: Party[];
  items: Item[];
  constraints: Record<string, string>;
  transcript: TranscriptEntry[];
  report: FairnessReport | null;
  allocation: Allocation | null;
  settlement: Extract<NegotiationEvent, { type: "settlement" }> | null;
  activeParty: string | null;
  run: (dispute: DisputePayload | null, live?: boolean) => void;
}

export function useNegotiation(): NegotiationState {
  const [phase, setPhase] = useState<Phase>("idle");
  const [source, setSource] = useState<Source>(null);
  const [error, setError] = useState<string | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [constraints, setConstraints] = useState<Record<string, string>>({});
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [report, setReport] = useState<FairnessReport | null>(null);
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [settlement, setSettlement] = useState<
    Extract<NegotiationEvent, { type: "settlement" }> | null
  >(null);
  const [activeParty, setActiveParty] = useState<string | null>(null);

  const runId = useRef(0);
  const counter = useRef(0);
  const partyName = useRef<Record<string, string>>({});
  const partyColorMap = useRef<Record<string, string>>({});

  const applyEvent = useCallback(
    (event: NegotiationEvent) => {
    switch (event.type) {
      case "session_started":
        setParties(event.parties);
        setItems(event.items);
        setConstraints(event.constraints ?? {});
        partyName.current = Object.fromEntries(
          event.parties.map((p) => [p.id, p.name]),
        );
        partyColorMap.current = Object.fromEntries(
          event.parties.map((p, i) => [p.id, partyColor(i)]),
        );
        break;
      case "intake":
        setTranscript((t) => [
          ...t,
          { id: counter.current++, speaker: "intake", label: "Intake", text: event.text },
        ]);
        break;
      case "proposal":
        setAllocation(event.allocation);
        setReport(event.report);
        setActiveParty(event.partyId);
        setTranscript((t) => [
          ...t,
          {
            id: counter.current++,
            speaker: "party",
            color: partyColorMap.current[event.partyId],
            label: `${partyName.current[event.partyId] ?? event.partyId} · ${event.kind}`,
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
            id: counter.current++,
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
            id: counter.current++,
            speaker: "party",
            color: partyColorMap.current[event.partyId],
            label: `${partyName.current[event.partyId] ?? event.partyId} concedes`,
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
    },
    [],
  );

  const runDemo = useCallback(async () => {
    const myRun = runId.current;
    setSource("demo");
    for (const event of cofounderScenario.events) {
      if (runId.current !== myRun) return;
      await sleep(DEMO_DELAY[event.type]);
      if (runId.current !== myRun) return;
      applyEvent(event);
    }
  }, [applyEvent]);

  const run = useCallback(
    (dispute: DisputePayload | null, live = false) => {
      const myRun = ++runId.current;
      setPhase("running");
      setSource(null);
      setError(null);
      counter.current = 0;
      setTranscript([]);
      setReport(null);
      setAllocation(null);
      setSettlement(null);
      setActiveParty(null);
      setParties([]);
      setItems([]);
      setConstraints({});

      streamNegotiation(
        dispute,
        (event) => {
          if (runId.current !== myRun) return;
          setSource("live");
          applyEvent(event);
        },
        live,
      ).catch((err: Error) => {
        if (runId.current !== myRun) return;
        // Offline: fall back to the built-in demo only for the default run.
        if (dispute === null) {
          void runDemo();
        } else {
          setPhase("error");
          setError(
            err.message.includes("valid")
              ? err.message
              : "Couldn't reach the negotiation service. Start the backend and try again.",
          );
        }
      });
    },
    [applyEvent, runDemo],
  );

  useEffect(() => () => void runId.current++, []);

  return {
    phase,
    source,
    error,
    parties,
    items,
    constraints,
    transcript,
    report,
    allocation,
    settlement,
    activeParty,
    run,
  };
}
