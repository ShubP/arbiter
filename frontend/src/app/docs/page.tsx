import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Docs · Arbiter",
  description:
    "How Arbiter works: the agent society, the fairness math, the API and MCP.",
};

const CRITERIA = [
  {
    term: "Envy-free",
    def: "No party would prefer another party's bundle to its own. The headline guarantee — it's why both sides accept the deal.",
  },
  {
    term: "Proportional",
    def: "Each party gets at least its fair 1/n share of the pot, measured in that party's own valuation.",
  },
  {
    term: "Pareto-efficient",
    def: "No reallocation could make someone better off without making another worse off — no value is left on the table.",
  },
  {
    term: "Nash welfare",
    def: "The product of the parties' utilities. Maximizing it is the standard objective for a balanced, jointly fair outcome.",
  },
];

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-sans text-xs uppercase tracking-[0.35em] text-brass">
        Documentation
      </p>
      <h1 className="mt-4 font-display text-4xl text-parchment">
        How Arbiter works
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-parchment/70">
        Arbiter resolves &ldquo;who gets what&rdquo; disputes by giving each side
        its own AI advocate, letting them negotiate, and certifying the result
        with game theory instead of opinion.
      </p>

      <Section title="The flow">
        <ol className="space-y-4">
          <Step n="1" title="Intake">
            The dispute — parties, assets, an optional cash pool, and each
            party&rsquo;s private valuations — is structured into a formal
            problem. You can pick a preset, build one by hand, or describe it in
            plain English and let an intake agent structure it.
          </Step>
          <Step n="2" title="Advocacy">
            Each party is represented by an advocate agent that sees{" "}
            <em>only</em> its own side&rsquo;s private valuations. Advocates open
            with proposals, then counter and concede across rounds.
          </Step>
          <Step n="3" title="Mediation">
            A neutral mediator spotlights contested assets, breaks deadlocks, and
            steers toward the efficient division — querying the fairness engine to
            check whether each move keeps the deal envy-free.
          </Step>
          <Step n="4" title="Certification">
            A referee finalizes the settlement and the engine issues a
            certificate. If it isn&rsquo;t envy-free, proportional{" "}
            <em>and</em> efficient, it isn&rsquo;t certified.
          </Step>
        </ol>
      </Section>

      <Section title="The fairness engine">
        <p className="text-parchment/70">
          The engine is deterministic, unit-tested, and free of any LLM. It is the
          source of truth for whether a settlement is fair, and it computes the
          provably-fair target the mediator steers toward. It is also exposed over
          the Model Context Protocol, so the agents call the same math you can
          audit.
        </p>
        <dl className="mt-6 space-y-4">
          {CRITERIA.map((c) => (
            <div
              key={c.term}
              className="rounded-lg border border-ink-line bg-ink-raised/40 p-4"
            >
              <dt className="font-display text-lg text-brass-bright">{c.term}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-parchment/65">
                {c.def}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm text-parchment/60">
          For two parties with transferable cash the solver is provably fair:
          assign each asset to whoever values it most (efficiency), then equalize
          utilities with a single cash side-payment (which removes all envy).
        </p>
      </Section>

      <Section title="Architecture">
        <div className="overflow-hidden rounded-xl border border-ink-line bg-ink-raised/40 p-3">
          <Image
            src="/architecture.png"
            alt="Arbiter architecture: frontend, FastAPI backend on Alibaba Cloud, fairness engine over MCP, Qwen Cloud."
            width={1560}
            height={360}
            className="h-auto w-full"
          />
        </div>
        <p className="mt-4 text-parchment/70">
          A Next.js frontend streams the negotiation over SSE from a FastAPI
          backend on Alibaba Cloud. The event source is pluggable: a deterministic
          director runs for free, and the Qwen agent society slots in behind the
          same contract. The fairness engine is shared, exposed over MCP.
        </p>
      </Section>

      <Section title="Qwen Cloud">
        <p className="text-parchment/70">
          The advocate, mediator, and referee agents run on Qwen via the DashScope
          API. Model routing uses stronger models for mediation and adjudication
          and lighter ones for intake; agents use function calling to query the
          fairness engine mid-negotiation and structured outputs so every proposal
          is machine-valid.
        </p>
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl text-parchment">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brass/15 font-mono text-sm text-brass">
        {n}
      </span>
      <div>
        <h3 className="font-display text-lg text-parchment">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-parchment/65">
          {children}
        </p>
      </div>
    </li>
  );
}
