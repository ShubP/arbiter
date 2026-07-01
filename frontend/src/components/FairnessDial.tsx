"use client";

import { motion } from "framer-motion";
import type { FairnessReport } from "@/lib/negotiation";

/** N-party fairness centerpiece: an envy ring that greens as envy → 0, plus the
 * certificate seal. Used when there are more than two parties (where a two-pan
 * balance no longer fits). */
export function FairnessDial({ report }: { report: FairnessReport | null }) {
  const maxEnvy = report ? report.maxEnvy : null;
  const certified = report?.certifiedFair ?? false;
  // 0 envy → full green ring; higher envy → less filled, warmer.
  const fill = maxEnvy === null ? 0 : Math.max(0, 1 - Math.min(maxEnvy, 200) / 200);
  const ringColor = certified
    ? "var(--color-accord)"
    : maxEnvy && maxEnvy > 40
      ? "var(--color-tension)"
      : "var(--color-brass)";
  const C = 2 * Math.PI * 52;

  const chips: Array<[string, boolean | undefined]> = [
    ["envy-free", report?.envyFree],
    ["proportional", report?.proportional],
    ["efficient", report?.paretoEfficient],
  ];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 130 130" className="h-40 w-40">
        <circle
          cx="65"
          cy="65"
          r="52"
          fill="none"
          stroke="var(--color-ink-line)"
          strokeWidth="8"
        />
        <motion.circle
          cx="65"
          cy="65"
          r="52"
          fill="none"
          stroke={ringColor}
          strokeWidth="8"
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - fill) }}
          transition={{ type: "spring", stiffness: 60, damping: 16 }}
        />
        <text
          x="65"
          y="60"
          textAnchor="middle"
          className="font-mono"
          fontSize="22"
          fontWeight="600"
          fill="var(--color-parchment)"
        >
          {maxEnvy === null ? "—" : Math.round(maxEnvy)}
        </text>
        <text
          x="65"
          y="78"
          textAnchor="middle"
          className="font-sans"
          fontSize="8"
          letterSpacing="1.5"
          fill="var(--color-parchment)"
          opacity="0.5"
        >
          MAX ENVY
        </text>
      </svg>

      <motion.div
        initial={false}
        animate={{ opacity: certified ? 1 : 0, y: certified ? 0 : -4 }}
        className="mt-1 rounded-full border border-brass px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-brass"
      >
        Certified fair
      </motion.div>

      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
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
