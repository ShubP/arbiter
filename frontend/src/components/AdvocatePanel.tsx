"use client";

import { motion } from "framer-motion";
import type { Item, Party } from "@/lib/negotiation";

interface AdvocatePanelProps {
  party: Party;
  color: string;
  heldItems: Item[];
  lockedItems?: Set<string>;
  cash: number | undefined;
  utility: number | undefined;
  align?: "left" | "right";
  active: boolean;
}

export function AdvocatePanel({
  party,
  color,
  heldItems,
  lockedItems,
  cash,
  utility,
  align = "left",
  active,
}: AdvocatePanelProps) {
  const right = align === "right";
  return (
    <motion.section
      layout
      className="rounded-xl border border-ink-line bg-ink-raised/70 p-5 backdrop-blur-sm transition-shadow"
      style={{
        boxShadow: active ? `0 0 40px -12px ${color}` : "none",
        borderColor: active ? color : undefined,
      }}
      aria-label={`${party.name}, advocate`}
    >
      <div className={`flex items-center gap-2 ${right ? "flex-row-reverse" : ""}`}>
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div className={right ? "text-right" : ""}>
          <p
            className="font-display text-lg leading-tight"
            style={{ color }}
          >
            {party.name}
          </p>
          {party.role && (
            <p className="text-xs text-parchment/50">{party.role}</p>
          )}
        </div>
      </div>

      <div
        className={`mt-4 flex items-baseline gap-2 ${right ? "justify-end" : ""}`}
      >
        <span className="font-mono text-3xl font-semibold text-parchment">
          {utility === undefined ? "—" : Math.round(utility)}
        </span>
        <span className="text-xs uppercase tracking-wide text-parchment/40">
          value
        </span>
      </div>

      <ul className={`mt-4 space-y-1.5 ${right ? "text-right" : ""}`}>
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
              {lockedItems?.has(item.id) && (
                <span title="Red-line: kept by this party" className="mr-1">
                  🔒
                </span>
              )}
              {item.label}
            </motion.li>
          ))
        )}
      </ul>

      {cash !== undefined && cash !== 0 && (
        <p
          className={`mt-3 font-mono text-sm ${
            cash > 0 ? "text-accord" : "text-tension"
          } ${right ? "text-right" : ""}`}
        >
          {cash > 0 ? "+" : "−"}${Math.abs(cash)}k cash
        </p>
      )}
    </motion.section>
  );
}
