<h1 align="center">⚖️ Arbiter</h1>

<p align="center">
  <b>Every side of a dispute gets its own AI advocate.</b><br/>
  They negotiate a <i>provably fair</i> settlement in under a minute — and Arbiter shows the game-theory math that proves it.
</p>

<p align="center">
  <a href="#license"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-22c55e.svg"></a>
  <img alt="Track" src="https://img.shields.io/badge/Track%203-Agent%20Society-6366f1.svg">
  <img alt="Powered by Qwen" src="https://img.shields.io/badge/Powered%20by-Qwen%20Cloud-7c3aed.svg">
</p>

---

> Built for the **Global AI Hackathon Series with Qwen Cloud** — **Track 3: Agent Society**.

## The problem

High-stakes splits — cofounders dividing equity, families dividing an estate, partners
dividing assets — are slow, expensive, and feel unfair because each side only sees its own
perspective. A single "neutral AI" that dictates a verdict isn't trusted: there's no advocacy
and no proof the outcome is fair.

## The idea

Arbiter is a **society of negotiating agents**:

- 🧑‍⚖️ **Advocate agents** — one per party, each holding that party's *private* valuations,
  fighting to maximize *their* side within honesty + fairness rules.
- 🤝 **Mediator agent** — runs structured negotiation rounds, surfaces contested items,
  breaks deadlocks, steers toward the best joint outcome.
- 📐 **Fairness Engine** — a deterministic, unit-tested module (exposed over **MCP**) that
  scores every proposal on real fair-division criteria: **envy-freeness, proportionality,
  Nash welfare, Pareto-efficiency**. The agents argue; the math adjudicates.
- ✅ **Referee agent** — certifies the final deal and writes each party's personalized rationale.

The result is a **Settlement Agreement** with a fairness certificate and a full audit log —
and, measurably, a fairer outcome than a single agent dictating a verdict.

## Why it's different

- **Real opposing objectives** → authentic negotiation, not theatrical debate.
- **Math-adjudicated conflict resolution** → trust comes from proofs, not vibes.
- **A measurable win** → benchmarked against a single-agent baseline on a suite of disputes.

## Tech

LangGraph · Qwen (DashScope / Alibaba Cloud) · Model Context Protocol (MCP) · FastAPI (SSE
streaming) · Next.js + Tailwind + shadcn/ui · SQLite.

See [docs/superpowers/specs/2026-06-30-arbiter-design.md](docs/superpowers/specs/2026-06-30-arbiter-design.md)
for the full design.

## Status

🚧 Under active development for the hackathon (deadline 2026-07-08). See the spec for the
phased build plan.

## License

[MIT](LICENSE) © 2026 Shub Pereira
