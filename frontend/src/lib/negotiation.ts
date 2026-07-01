/**
 * Shared negotiation contract.
 *
 * These types are the wire format the streaming backend will emit over SSE. The
 * mock scenario below implements the same shape so the UI is fully interactive
 * before the agent layer is wired up — later we swap the mock stream for the
 * live endpoint without touching the components.
 */

export type PartySide = "a" | "b";

export interface Party {
  id: string;
  name: string;
  role: string;
  side: PartySide;
}

export interface Item {
  id: string;
  label: string;
}

export interface Allocation {
  /** item id -> party id */
  items: Record<string, string>;
  /** party id -> net cash (negative = pays a side-payment), in $k */
  cash: Record<string, number>;
}

export interface FairnessReport {
  utilities: Record<string, number>;
  proportional: boolean;
  envyFree: boolean;
  maxEnvy: number;
  paretoEfficient: boolean;
  nashWelfare: number;
  certifiedFair: boolean;
}

export type NegotiationEvent =
  | {
      type: "session_started";
      parties: Party[];
      items: Item[];
      cashPool: number;
      dispute: string;
    }
  | { type: "intake"; text: string }
  | {
      type: "proposal";
      round: number;
      partyId: string;
      kind: "opening" | "counter";
      allocation: Allocation;
      report: FairnessReport;
      rationale: string;
    }
  | { type: "mediator"; round: number; text: string; contested: string[] }
  | { type: "concession"; round: number; partyId: string; text: string }
  | { type: "fairness_update"; round: number; report: FairnessReport }
  | {
      type: "settlement";
      allocation: Allocation;
      report: FairnessReport;
      rationale: Record<string, string>;
    };

export interface NegotiationScript {
  parties: Party[];
  items: Item[];
  cashPool: number;
  events: NegotiationEvent[];
}

/* -------------------------------------------------------------------------- */
/* Flagship demo: two cofounders restructuring their split.                    */
/* -------------------------------------------------------------------------- */

const AVA = "ava";
const BEN = "ben";

const parties: Party[] = [
  { id: AVA, name: "Ava Chen", role: "CEO & co-founder", side: "a" },
  { id: BEN, name: "Ben Ortiz", role: "CTO & co-founder", side: "b" },
];

const items: Item[] = [
  { id: "ip", label: "Core IP & patents" },
  { id: "ctrl", label: "CTO seat & technical control" },
  { id: "contracts", label: "Enterprise contracts" },
  { id: "brand", label: "Brand, domain & socials" },
];

const CASH_POOL = 200; // $200k treasury to divide

function report(
  ua: number,
  ub: number,
  opts: Partial<FairnessReport> & { maxEnvy: number },
): FairnessReport {
  const certified =
    !!opts.envyFree && !!opts.proportional && !!opts.paretoEfficient;
  return {
    utilities: { [AVA]: ua, [BEN]: ub },
    proportional: !!opts.proportional,
    envyFree: !!opts.envyFree,
    maxEnvy: opts.maxEnvy,
    paretoEfficient: !!opts.paretoEfficient,
    nashWelfare: Math.round(Math.max(ua, 0) * Math.max(ub, 0)),
    certifiedFair: certified,
  };
}

export const cofounderScenario: NegotiationScript = {
  parties,
  items,
  cashPool: CASH_POOL,
  events: [
    {
      type: "session_started",
      parties,
      items,
      cashPool: CASH_POOL,
      dispute:
        "Ava and Ben are restructuring their startup. They must divide control, IP, contracts, the brand, and a $200k treasury — each privately values these very differently.",
    },
    {
      type: "intake",
      text: "Structured the dispute: 4 indivisible assets, $200k divisible treasury, 2 parties. Private valuations elicited from each side.",
    },
    // Round 1 — Ava opens greedily.
    {
      type: "proposal",
      round: 1,
      partyId: AVA,
      kind: "opening",
      allocation: {
        items: { ip: AVA, ctrl: AVA, contracts: AVA, brand: AVA },
        cash: { [AVA]: 140, [BEN]: 60 },
      },
      report: report(375, 60, { maxEnvy: 315 }),
      rationale:
        "I founded and led this company. I should retain the IP, the contracts, the brand and technical direction — Ben is fairly bought out with $60k.",
    },
    {
      type: "mediator",
      round: 1,
      text: "This opening leaves Ben with severe envy (315) and hands the CTO seat to Ava, who values it least. The technical control and IP are the real contested assets.",
      contested: ["ctrl", "ip"],
    },
    // Round 2 — Ben counters, over-correcting.
    {
      type: "proposal",
      round: 2,
      partyId: BEN,
      kind: "counter",
      allocation: {
        items: { ip: BEN, ctrl: BEN, contracts: AVA, brand: AVA },
        cash: { [AVA]: 80, [BEN]: 120 },
      },
      report: report(205, 280, { maxEnvy: 25 }),
      rationale:
        "The technology is the company. I take the IP and the CTO seat to lead product; Ava keeps the contracts and brand she manages.",
    },
    {
      type: "mediator",
      round: 2,
      text: "Envy is down to 25 — much closer. But the IP now sits with Ben, though Ava values it more, leaving value on the table. And Ava is just under her fair share. I propose the efficient swap: Ben keeps the CTO seat he values most, Ava takes the IP she values most, and we settle the gap in cash.",
      contested: ["ip"],
    },
    // Round 3 — concessions resolve the contested assets efficiently.
    {
      type: "concession",
      round: 3,
      partyId: BEN,
      text: "Ben concedes the IP to Ava — she values it more, so the company is worth more with her holding it.",
    },
    {
      type: "concession",
      round: 3,
      partyId: AVA,
      text: "Ava concedes the CTO seat & technical control to Ben, who values it five times more.",
    },
    {
      type: "fairness_update",
      round: 3,
      report: report(257.5, 257.5, {
        maxEnvy: 0,
        envyFree: true,
        proportional: true,
        paretoEfficient: true,
      }),
    },
    // Settlement.
    {
      type: "settlement",
      allocation: {
        items: { ip: AVA, ctrl: BEN, contracts: AVA, brand: AVA },
        cash: { [AVA]: 42.5, [BEN]: 157.5 },
      },
      report: report(257.5, 257.5, {
        maxEnvy: 0,
        envyFree: true,
        proportional: true,
        paretoEfficient: true,
      }),
      rationale: {
        [AVA]:
          "You keep the IP, enterprise contracts and brand — the assets you value and manage — plus $42.5k. Your outcome (257.5) is identical to Ben's: neither of you would trade places.",
        [BEN]:
          "You take the CTO seat & full technical control you value most, plus $157.5k in cash to balance the assets Ava retained. Your outcome (257.5) matches Ava's exactly — a settlement with no envy.",
      },
    },
  ],
};
