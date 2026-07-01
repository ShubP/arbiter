import { NegotiationStage } from "@/components/NegotiationStage";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="chamber-grid pointer-events-none absolute inset-0 -z-10 opacity-40" />

      {/* Hero */}
      <header className="mx-auto max-w-4xl px-6 pb-10 pt-20 text-center">
        <p className="font-sans text-xs uppercase tracking-[0.35em] text-brass">
          Track 3 · Agent Society
        </p>
        <h1 className="mt-5 font-display text-5xl leading-[1.05] text-parchment sm:text-6xl">
          Every side gets an advocate.
          <br />
          <span className="text-brass-bright">The math makes it fair.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-parchment/70">
          Arbiter gives each party in a dispute its own AI advocate. They
          negotiate — proposing, countering, conceding — while a mediator steers
          and a game-theory engine certifies the result. Watch two cofounders
          divide control, IP and a $200k treasury, and reach a settlement with{" "}
          <span className="text-parchment">provably zero envy</span>.
        </p>
      </header>

      {/* Stage */}
      <section className="px-4 pb-24 sm:px-6">
        <NegotiationStage />
      </section>

      {/* Footer strip */}
      <footer className="border-t border-ink-line/60 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-parchment/40 sm:flex-row">
          <p>
            Advocates &amp; mediator run on{" "}
            <span className="text-parchment/70">Qwen</span> · fairness
            adjudicated by a deterministic engine exposed over{" "}
            <span className="text-parchment/70">MCP</span>.
          </p>
          <p className="font-mono">
            envy-free · proportional · Pareto-efficient
          </p>
        </div>
      </footer>
    </main>
  );
}
