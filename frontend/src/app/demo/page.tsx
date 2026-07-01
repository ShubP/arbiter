import type { Metadata } from "next";
import { NegotiationStage } from "@/components/NegotiationStage";

export const metadata: Metadata = {
  title: "Live demo · Arbiter",
  description:
    "Watch two AI advocates negotiate a provably fair settlement in real time.",
};

export default function DemoPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="chamber-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

      <header className="mx-auto max-w-3xl px-6 pb-8 pt-16 text-center">
        <p className="font-sans text-xs uppercase tracking-[0.35em] text-brass">
          The negotiation table
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-parchment sm:text-5xl">
          Convene the advocates
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-parchment/65">
          Two cofounders are dividing control, IP and a $200k treasury. Press the
          button and watch their advocates propose, counter, and concede until the
          math certifies a settlement with zero envy.
        </p>
      </header>

      <section className="px-4 pb-24 sm:px-6">
        <NegotiationStage />
      </section>
    </main>
  );
}
