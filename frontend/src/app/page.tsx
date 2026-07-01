import Link from "next/link";
import { HeroBalance } from "@/components/HeroBalance";

const STEPS = [
  {
    n: "01",
    title: "Define the dispute",
    body: "Name the parties and the assets to divide — plus any cash. Each side privately says how much they value each asset. Different values are different ideas of what's fair.",
  },
  {
    n: "02",
    title: "Advocates negotiate",
    body: "Each side gets its own AI advocate that knows only that side's priorities and fights for it — proposing, countering, conceding — while a neutral mediator steers.",
  },
  {
    n: "03",
    title: "The math certifies",
    body: "A deterministic fairness engine checks every offer. The settlement is provably envy-free: neither side would trade places. Trust comes from proof, not opinion.",
  },
];

const DIFFERENTIATORS = [
  {
    title: "Real opposing objectives",
    body: "Advocates hold private, conflicting valuations — so this is an authentic negotiation, not personas politely agreeing.",
  },
  {
    title: "Math adjudicates, not vibes",
    body: "Envy-freeness, proportionality and Nash welfare are computed, not asserted. Every settlement ships with a certificate.",
  },
  {
    title: "A measurable win",
    body: "Benchmarked against a single agent dividing the same assets — the society reaches fair outcomes far more often.",
  },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <div className="chamber-grid pointer-events-none absolute inset-0 -z-10 opacity-40" />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:pt-28">
        <div>
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-brass">
            Track 3 · Agent Society · Qwen Cloud
          </p>
          <h1 className="mt-5 font-display text-5xl leading-[1.04] text-parchment sm:text-6xl">
            Every side gets an advocate.
            <br />
            <span className="text-brass-bright">The math makes it fair.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-parchment/70">
            Arbiter gives each party in a dispute its own AI advocate. They
            negotiate a settlement in under a minute — and a game-theory engine
            proves it's fair, with zero envy on either side.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="rounded-full bg-brass px-6 py-3 text-sm font-semibold uppercase tracking-widest text-ink transition hover:bg-brass-bright"
            >
              Convene a negotiation
            </Link>
            <Link
              href="/docs"
              className="rounded-full border border-ink-line px-6 py-3 text-sm font-semibold uppercase tracking-widest text-parchment/80 transition hover:border-parchment/40 hover:text-parchment"
            >
              How it works
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-line bg-ink-raised/40 p-6">
          <HeroBalance />
          <p className="mt-2 text-center font-mono text-xs text-parchment/45">
            the scale levels as envy → 0, then certifies
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-3xl text-parchment">How it works</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="rounded-xl border border-ink-line bg-ink-raised/40 p-6"
            >
              <span className="font-mono text-sm text-brass">{step.n}</span>
              <h3 className="mt-3 font-display text-xl text-parchment">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-parchment/65">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why different */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-3xl text-parchment">
          Not another chatbot
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {DIFFERENTIATORS.map((d) => (
            <div key={d.title} className="border-t border-brass/40 pt-5">
              <h3 className="font-display text-lg text-brass-bright">
                {d.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-parchment/65">
                {d.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Proof band */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl border border-ink-line bg-ink-raised/40 p-8 sm:p-10">
          <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="font-display text-3xl text-parchment">
                Fairness you can check
              </h2>
              <p className="mt-3 max-w-lg text-parchment/65">
                Every settlement is certified against real fair-division criteria.
                The engine is exposed over MCP, so the negotiating agents call the
                same math you can audit.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 font-mono text-xs">
                {["envy-free", "proportional", "Pareto-efficient", "Nash welfare"].map(
                  (t) => (
                    <span
                      key={t}
                      className="rounded-full bg-accord/15 px-3 py-1 text-accord"
                    >
                      {t}
                    </span>
                  ),
                )}
              </div>
            </div>
            <div className="flex gap-8 sm:border-l sm:border-ink-line sm:pl-8">
              <Stat value="100%" label="envy-free settlements" />
              <Stat value="0" label="envy at close" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-8 text-center">
        <h2 className="font-display text-4xl text-parchment">
          See two advocates reach a fair deal.
        </h2>
        <Link
          href="/demo"
          className="mt-6 inline-block rounded-full bg-brass px-8 py-3 text-sm font-semibold uppercase tracking-widest text-ink transition hover:bg-brass-bright"
        >
          Convene the table
        </Link>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-mono text-4xl font-semibold text-brass-bright">{value}</p>
      <p className="mt-1 max-w-[7rem] text-xs text-parchment/50">{label}</p>
    </div>
  );
}
