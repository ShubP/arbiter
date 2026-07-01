import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About · Arbiter",
  description:
    "Arbiter is a multi-agent negotiation system built for the Qwen Cloud hackathon, Track 3: Agent Society.",
};

const STACK = [
  ["Negotiation", "Qwen (DashScope) advocates, mediator, referee"],
  ["Coordination", "LangGraph orchestration behind an SSE event contract"],
  ["Fairness", "Deterministic engine (envy-free · Nash · Pareto), exposed over MCP"],
  ["Backend", "FastAPI · Server-Sent Events · deployed on Alibaba Cloud ECS"],
  ["Frontend", "Next.js · Tailwind · Framer Motion"],
  ["Quality", "pytest + ruff; test-driven fairness engine"],
];

const ROADMAP = [
  ["Done", "Fairness engine, solver, benchmark, MCP server"],
  ["Done", "FastAPI SSE backend + engine-driven negotiation director"],
  ["Done", "Multi-page site with the live negotiation table"],
  ["Next", "Qwen agent society + natural-language intake"],
  ["Next", "Custom-dispute builder and preset gallery"],
  ["Next", "Alibaba Cloud deployment + measured single-agent baseline"],
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-sans text-xs uppercase tracking-[0.35em] text-brass">
        About the project
      </p>
      <h1 className="mt-4 font-display text-4xl text-parchment">
        A society of advocates, adjudicated by math
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-parchment/70">
        Arbiter is a multi-agent negotiation system built for the{" "}
        <span className="text-parchment">Global AI Hackathon with Qwen Cloud</span>
        , Track 3: Agent Society. It tackles a universal, high-stakes problem —
        dividing assets when each side sees fairness differently — and resolves it
        with agents that genuinely represent opposing interests, refereed by
        game-theoretic fairness math.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-parchment">The idea</h2>
        <p className="mt-4 text-parchment/70">
          A single &ldquo;neutral AI&rdquo; that dictates a verdict isn&rsquo;t
          trusted — there&rsquo;s no advocacy and no proof. Arbiter instead gives
          every side a partisan advocate, lets them negotiate, and certifies the
          outcome against real criteria: envy-freeness, proportionality, and
          Pareto-efficiency. The result is a settlement both sides can accept,
          with a certificate to back it.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-parchment">Tech stack</h2>
        <dl className="mt-4 divide-y divide-ink-line/60 overflow-hidden rounded-xl border border-ink-line">
          {STACK.map(([k, v]) => (
            <div
              key={k}
              className="grid grid-cols-[8rem_1fr] gap-4 bg-ink-raised/30 px-5 py-3.5"
            >
              <dt className="text-sm font-medium text-brass-bright">{k}</dt>
              <dd className="text-sm text-parchment/70">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-parchment">Roadmap</h2>
        <ul className="mt-4 space-y-2.5">
          {ROADMAP.map(([status, item], idx) => (
            <li key={idx} className="flex items-center gap-3">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  status === "Done"
                    ? "bg-accord/20 text-accord"
                    : "bg-brass/15 text-brass"
                }`}
              >
                {status}
              </span>
              <span className="text-sm text-parchment/70">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border border-ink-line bg-ink-raised/40 p-8">
        <h2 className="font-display text-2xl text-parchment">Explore the code</h2>
        <p className="mt-3 text-parchment/70">
          Arbiter is open source under the MIT license. The repository contains the
          fairness engine and its test suite, the MCP server, the FastAPI backend,
          and this site.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="https://github.com/ShubP/arbiter"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-brass-bright"
          >
            View on GitHub
          </a>
          <Link
            href="/demo"
            className="rounded-full border border-ink-line px-5 py-2.5 text-sm font-semibold text-parchment/80 transition hover:border-parchment/40 hover:text-parchment"
          >
            Run the demo
          </Link>
        </div>
      </section>
    </main>
  );
}
