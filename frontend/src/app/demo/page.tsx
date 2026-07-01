"use client";

import { motion } from "framer-motion";
import { DisputeBuilder } from "@/components/DisputeBuilder";
import { fadeUp, stagger } from "@/components/motion";
import { NegotiationView } from "@/components/NegotiationView";
import { useNegotiation } from "@/components/useNegotiation";

export default function DemoPage() {
  const negotiation = useNegotiation();

  return (
    <main className="relative overflow-hidden">
      <div className="chamber-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

      <motion.header
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="mx-auto max-w-3xl px-6 pb-8 pt-16 text-center"
      >
        <motion.p
          variants={fadeUp}
          className="font-sans text-xs uppercase tracking-[0.35em] text-brass"
        >
          The negotiation table
        </motion.p>
        <motion.h1
          variants={fadeUp}
          className="mt-4 font-display text-4xl leading-tight text-parchment sm:text-5xl"
        >
          Bring a dispute. Watch it settle.
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="mx-auto mt-4 max-w-xl text-parchment/65"
        >
          Pick a preset or define your own — name the sides, list the assets, and
          say what each is worth to each side. Their advocates negotiate until the
          math certifies a fair split.
        </motion.p>
      </motion.header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-24 sm:px-6 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start">
        <div className="lg:sticky lg:top-20">
          <DisputeBuilder
            onRun={negotiation.run}
            running={negotiation.phase === "running"}
          />
        </div>
        <NegotiationView {...negotiation} />
      </section>
    </main>
  );
}
