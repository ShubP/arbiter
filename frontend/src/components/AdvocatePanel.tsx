"use client";

import { motion } from "framer-motion";
import type { Item, Party } from "@/lib/negotiation";

interface AdvocatePanelProps {
  party: Party;
  heldItems: Item[];
  cash: number | undefined;
  utility: number | undefined;
  align: "left" | "right";
  active: boolean;
}

const SIDE = {
  a: {
    text: "text-party-a",
    ring: "ring-party-a/40",
    dot: "bg-party-a",
    glow: "shadow-[0_0_40px_-12px_var(--color-party-a)]",
  },
  b: {
    text: "text-party-b",
    ring: "ring-party-b/40",
    dot: "bg-party-b",
    glow: "shadow-[0_0_40px_-12px_var(--color-party-b)]",
  },
} as const;

export function AdvocatePanel({
  party,
  heldItems,
  cash,
  utility,
  align,
  active,
}: AdvocatePanelProps) {
  const s = SIDE[party.side];
  return (
    <motion.section
      layout
      className={`rounded-xl border border-ink-line bg-ink-raised/70 p-5 ring-1 backdrop-blur-sm transition-shadow ${
        s.ring
      } ${active ? s.glow : "shadow-none"}`}
      aria-label={`${party.name}, advocate`}
    >
      <div
        className={`flex items-center gap-2 ${
          align === "right" ? "flex-row-reverse text-right" : ""
        }`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
        <div className={align === "right" ? "text-right" : ""}>
          <p className={`font-display text-lg leading-tight ${s.text}`}>
            {party.name}
          </p>
          <p className="text-xs text-parchment/50">{party.role}</p>
        </div>
      </div>

      <div
        className={`mt-4 flex items-baseline gap-2 ${
          align === "right" ? "justify-end" : ""
        }`}
      >
        <span className="font-mono text-3xl font-semibold text-parchment">
          {utility === undefined ? "—" : Math.round(utility)}
        </span>
        <span className="text-xs uppercase tracking-wide text-parchment/40">
          value
        </span>
      </div>

      <ul className={`mt-4 space-y-1.5 ${align === "right" ? "text-right" : ""}`}>
        {heldItems.length === 0 ? (
          <li className="text-xs italic text-parchment/30">no assets yet</li>
        ) : (
          heldItems.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-parchment/80"
            >
              {item.label}
            </motion.li>
          ))
        )}
      </ul>

      {cash !== undefined && cash !== 0 && (
        <p
          className={`mt-3 font-mono text-sm ${
            cash > 0 ? "text-accord" : "text-tension"
          } ${align === "right" ? "text-right" : ""}`}
        >
          {cash > 0 ? "+" : "−"}${Math.abs(cash)}k cash
        </p>
      )}
    </motion.section>
  );
}
