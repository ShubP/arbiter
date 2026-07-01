"use client";

import { DisputeBuilder } from "@/components/DisputeBuilder";
import { NegotiationView } from "@/components/NegotiationView";
import { useNegotiation } from "@/components/useNegotiation";

export default function DemoPage() {
  const negotiation = useNegotiation();

  return (
    <main className="relative overflow-hidden">
      <div className="chamber-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

      <header className="mx-auto max-w-3xl px-6 pb-8 pt-16 text-center">
        <p className="font-sans text-xs uppercase tracking-[0.35em] text-brass">
          The negotiation table
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-parchment sm:text-5xl">
          Bring a dispute. Watch it settle.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-parchment/65">
          Pick a preset or define your own — name the two sides, list the assets,
          and say what each is worth to each side. Their advocates negotiate until
          the math certifies a fair split.
        </p>
      </header>

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
