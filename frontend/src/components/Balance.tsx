"use client";

import { motion } from "framer-motion";

interface BalanceProps {
  utilityA: number;
  utilityB: number;
  certified: boolean;
}

const CX = 160;
const CY = 120;
const ARM = 120;
const DISC = 30;

/** Signature element: a scale that tilts toward the heavier side and levels
 * as the two parties' outcomes converge, then seals when certified fair. */
export function Balance({ utilityA, utilityB, certified }: BalanceProps) {
  // Positive angle drops the right (B) side; negative drops the left (A) side.
  const raw = (utilityB - utilityA) / 20;
  const angle = certified ? 0 : Math.max(-16, Math.min(16, raw));

  return (
    <svg
      viewBox="0 0 320 260"
      className="h-full w-full"
      role="img"
      aria-label={`Balance of outcomes: Ava ${Math.round(
        utilityA,
      )}, Ben ${Math.round(utilityB)}${certified ? ", certified fair" : ""}`}
    >
      {/* Stand */}
      <line
        x1={CX}
        y1={CY}
        x2={CX}
        y2={228}
        stroke="var(--color-ink-line)"
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path
        d={`M ${CX - 34} 228 L ${CX + 34} 228 L ${CX + 22} 236 L ${
          CX - 22
        } 236 Z`}
        fill="var(--color-ink-line)"
      />
      {/* Fulcrum */}
      <path
        d={`M ${CX} ${CY - 14} L ${CX + 12} ${CY} L ${CX - 12} ${CY} Z`}
        fill="var(--color-brass)"
      />

      {/* Beam + pans, tilting as one group. */}
      <motion.g
        animate={{ rotate: angle }}
        transition={{ type: "spring", stiffness: 60, damping: 14 }}
        style={{ transformOrigin: `${CX}px ${CY}px` }}
      >
        <line
          x1={CX - ARM}
          y1={CY}
          x2={CX + ARM}
          y2={CY}
          stroke="var(--color-parchment)"
          strokeWidth={5}
          strokeLinecap="round"
        />
        {[
          { cx: CX - ARM, fill: "var(--color-party-a)", value: utilityA },
          { cx: CX + ARM, fill: "var(--color-party-b)", value: utilityB },
        ].map((pan) => (
          <g key={pan.cx}>
            <circle
              cx={pan.cx}
              cy={CY}
              r={DISC}
              fill={pan.fill}
              opacity={0.92}
            />
            {/* Counter-rotate the label so the number stays upright. */}
            <motion.text
              x={pan.cx}
              y={CY + 5}
              textAnchor="middle"
              className="font-mono"
              fontSize={17}
              fontWeight={600}
              fill="#141b2e"
              animate={{ rotate: -angle }}
              transition={{ type: "spring", stiffness: 60, damping: 14 }}
              style={{ transformOrigin: `${pan.cx}px ${CY}px` }}
            >
              {Math.round(pan.value)}
            </motion.text>
          </g>
        ))}
      </motion.g>

      {/* Brass seal, stamped on certification. */}
      <motion.g
        initial={false}
        animate={{
          scale: certified ? 1 : 0,
          opacity: certified ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 240, damping: 16 }}
        style={{ transformOrigin: `${CX}px ${CY + 46}px` }}
      >
        <circle
          cx={CX}
          cy={CY + 46}
          r={26}
          fill="none"
          stroke="var(--color-brass)"
          strokeWidth={2}
        />
        <circle
          cx={CX}
          cy={CY + 46}
          r={21}
          fill="var(--color-brass)"
          opacity={0.14}
        />
        <text
          x={CX}
          y={CY + 44}
          textAnchor="middle"
          className="font-sans"
          fontSize={8}
          letterSpacing={1}
          fill="var(--color-brass-bright)"
        >
          CERTIFIED
        </text>
        <text
          x={CX}
          y={CY + 54}
          textAnchor="middle"
          className="font-sans"
          fontSize={8}
          letterSpacing={1}
          fill="var(--color-brass-bright)"
        >
          FAIR
        </text>
      </motion.g>
    </svg>
  );
}
