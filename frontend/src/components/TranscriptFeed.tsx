"use client";

import { AnimatePresence, motion } from "framer-motion";

export interface TranscriptEntry {
  id: number;
  speaker: "intake" | "mediator" | "party";
  label: string;
  text: string;
  round?: number;
  color?: string; // for party speakers
}

const FIXED_STYLE: Record<"intake" | "mediator", { badge: string; name: string }> =
  {
    intake: { badge: "bg-ink-line text-parchment/70", name: "text-parchment/60" },
    mediator: { badge: "bg-brass/20 text-brass-bright", name: "text-brass" },
  };

export function TranscriptFeed({ entries }: { entries: TranscriptEntry[] }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm tracking-wide text-parchment/70">
          The negotiation
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-parchment/30">
          append-only record
        </span>
      </div>
      <ol className="flex-1 space-y-3 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {entries.map((entry) => {
            const fixed =
              entry.speaker === "party" ? null : FIXED_STYLE[entry.speaker];
            return (
              <motion.li
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="rounded-lg border border-ink-line/60 bg-ink/40 p-3"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                      fixed ? fixed.badge : ""
                    }`}
                    style={
                      fixed
                        ? undefined
                        : { backgroundColor: `${entry.color}33`, color: entry.color }
                    }
                  >
                    {entry.round ? `R${entry.round}` : "—"}
                  </span>
                  <span
                    className={`text-xs font-semibold ${fixed ? fixed.name : ""}`}
                    style={fixed ? undefined : { color: entry.color }}
                  >
                    {entry.label}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-parchment/85">
                  {entry.text}
                </p>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </div>
  );
}
