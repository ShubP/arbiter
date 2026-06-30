# Arbiter — Design Spec

**Date:** 2026-06-30
**Hackathon:** Global AI Hackathon Series with Qwen Cloud
**Track:** Track 3 — Agent Society
**Submission deadline:** 2026-07-08 (8 days)
**Builder:** Solo (full-stack + LangGraph experience)

---

## 1. One-liner

> Every side of a dispute gets its own AI advocate. The advocates negotiate a
> provably fair settlement in under a minute — and Arbiter shows the
> game-theory math that proves it's fair.

**Flagship demo:** two cofounders dissolving/restructuring a startup split equity,
IP, cash, and roles. (The engine handles any multi-party asset/issue division;
this is the headline story for the demo and video.)

## 2. Why this wins (mapping to judging criteria)

| Criterion | Weight | How Arbiter scores |
|---|---|---|
| Technical Depth & Engineering | 30% | LangGraph multi-agent orchestration on Qwen; a deterministic, tested **Fairness Engine** implementing real fair-division algorithms (envy-freeness, Nash welfare, proportionality); streaming negotiation; reproducible eval harness. |
| Innovation & AI Creativity | 30% | Agents with **genuinely opposing objectives** negotiate (not theatrical debate). Conflict is adjudicated by **math, not LLM vibes**. "Give every side an AI lawyer" is a fresh, magnetic framing not seen in recent winners. |
| Problem Value & Impact | 25% | Disputes (cofounder splits, estates, contracts) are a universal, high-stakes pain point. Clear productization path; open-source fairness tooling has community value. |
| Presentation & Documentation | 15% | Live "negotiation table" UI with a real-time fairness meter; settlement certificate artifact; architecture diagram; clear eval charts. |

**The required measurable baseline (Track 3):** Arbiter's multi-agent negotiation
vs. a single Qwen agent told "divide this fairly," across a suite of synthetic
disputes. Target headline: *Arbiter reaches envy-free settlements materially more
often and at higher joint (Nash) welfare than a single agent.*

## 3. The agent society

| Agent | Role | Knows | Produces |
|---|---|---|---|
| **Intake Agent** | Parse messy NL dispute + each party's *private* priorities into a structured problem. Handle ambiguity, ask clarifying questions if needed. | Public dispute description + each party's private brief | Structured problem: parties, assets/issues, per-party valuations, hard constraints |
| **Advocate Agent** (one per party) | Maximize *its* party's outcome within honesty + fairness rules. Propose, counter, concede. | Only its own party's private valuations + constraints | Proposals, counters, concessions, justifications |
| **Mediator Agent** | Run negotiation rounds, spotlight contested items, break deadlocks, steer toward best joint outcome. | Public proposals (not private valuations) | Round structure, compromise suggestions, deadlock resolution |
| **Referee Agent** | Certify final deal, write each party's personalized rationale, seal audit log. | Final allocation + fairness certificate | Settlement Agreement + audit log |

**Information asymmetry is deliberate:** advocates hold private valuations the
mediator cannot see. This makes the negotiation *real* — the mediator must
elicit and reconcile hidden preferences, which is the core of authentic
multi-agent negotiation.

## 4. The innovation — math-adjudicated conflict resolution

A **Fairness Engine** (pure Python + numpy, fully unit-tested, *no LLM*) scores any
proposed allocation on formal fair-division criteria:

- **Proportionality** — each party gets ≥ 1/n of total value *by their own valuation*.
- **Envy-freeness** — no party prefers another party's bundle to its own.
- **Nash welfare** — product of parties' utilities (the standard joint-fairness objective).
- **Equitability** — parties' subjective satisfaction levels are balanced.
- **Pareto-efficiency** — no allocation makes someone better off without making another worse off.

The advocates and mediator **query this engine as a tool** during negotiation
(e.g., "if I trade the car for $8k, is the result still envy-free?"). The agents
argue; the math adjudicates. This is the engineering-depth centerpiece and the
trust story.

**Negotiation protocol (the conflict-resolution mechanism):**
1. **Round 0 — Elicitation:** Intake produces structured private valuations per party.
2. **Round 1 — Opening:** each advocate submits an opening proposal maximizing its party.
3. **Mediator diff:** compute overlap/conflict; surface contested items.
4. **Rounds 2..n — Negotiation:** advocates trade items + offer cash compensation; each
   move logged as a concession with a justification. Mediator nudges toward the
   Nash-optimal region using the Fairness Engine. Backbone seeded by a classic
   fair-division procedure (adjusted-winner / sequential allocation) so the search
   is principled, not random.
5. **Termination:** when envy-free (or max rounds / mediator declares best-achievable);
   Fairness Engine issues the certificate.

## 5. Measurable evaluation (de-risk first — build Day 1–2)

- **Dataset:** a generator producing N synthetic disputes (varied #items, valuation
  spreads, constraints). Reproducible with a fixed seed.
- **Baseline:** single Qwen agent, one prompt: "divide these assets fairly," returns an allocation.
- **Treatment:** full Arbiter negotiation.
- **Metrics per dispute:** average envy, % envy-free, Nash welfare, proportionality
  satisfaction %, Pareto-efficiency.
- **Output:** a results table + chart (matplotlib) showing the society beats the single agent.

This harness is deterministic (the Fairness Engine is math) and is built *first* so
the central claim is proven before UI/polish work begins.

## 6. The artifact + demo UI

- **Artifact:** a **Settlement Agreement** (markdown/PDF) — the allocation, each party's
  personalized rationale, a **fairness certificate** ("✓ envy-free ✓ proportional,
  Nash welfare 0.91"), and the full negotiation transcript (audit log).
- **UI — the live negotiation table** (Next.js): parties around a table, proposal/counter
  bubbles appear in real time (streamed from the backend), a **contested-items board**,
  and a **fairness meter that climbs** as the deal improves, ending in the settlement card.
  This is the scroll-stopping demo moment.

## 7. Tech stack & architecture

- **Orchestration:** LangGraph (Python). Each agent is a node; the mediator drives a
  loop with a conditional-edge termination check.
- **Models:** Qwen via DashScope (Alibaba Cloud), OpenAI-compatible endpoint
  `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`. Strong model
  (e.g., qwen-max / qwen3) for advocates + mediator; smaller for intake.
- **Fairness Engine:** pure Python + numpy, deterministic, unit-tested. Also exposed as an
  **MCP server** (`arbiter-fairness-mcp`) so agents consume it over the MCP protocol.
- **Backend:** FastAPI; `/negotiate` endpoint streams the debate via SSE so the UI is live.
  Acts as an **MCP client** to the fairness server.
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, with a deliberate
  visual design (custom palette/typography, motion via Framer Motion for the live negotiation
  table). Built with the `frontend-design` skill so it looks intentional, not templated.
- **Persistence:** SQLite (MVP) storing sessions + transcripts. Upgrade path to Alibaba Cloud RDS.
- **Deployment:** Alibaba Cloud ECS runs the FastAPI backend, which calls DashScope
  (Qwen) — natively satisfying "backend running on Alibaba Cloud" + "use of Alibaba
  Cloud services/APIs." Optional: Alibaba Cloud RDS/OSS to strengthen the proof.

**Data flow:** UI → FastAPI `/negotiate` → LangGraph graph (Intake → Advocates ↔
Mediator loop, querying Fairness Engine → Referee) → streamed events back to UI →
final Settlement Agreement persisted to SQLite.

## 7a. Sophisticated Qwen Cloud API usage (Technical Depth, 30%)

This section directly answers the rubric: *"Does the project make sophisticated use of
Qwen Cloud APIs (e.g., custom skills, MCP integrations)? Does it demonstrate
algorithmic or engineering innovation?"*

- **MCP integration (headline):** the Fairness Engine is exposed as a standalone
  **MCP server** (`arbiter-fairness-mcp`) advertising tools like `evaluate_allocation`,
  `check_envy_free`, `nash_welfare`, `suggest_pareto_improvement`. The agent layer connects
  as an **MCP client**, so advocates/mediator invoke fairness math through the open MCP
  protocol — not hard-wired calls. This makes the engine reusable by any MCP-capable host
  (Claude, Qwen, IDEs) and is a clean, demonstrable "MCP integration." The same engine
  remains importable as a plain Python module (tested core + MCP surface = robust fallback).
- **Qwen function calling / tool use:** advocates and mediator are tool-using agents. Every
  proposal is validated by a tool round-trip ("if I trade the car for $8k, is it still
  envy-free?"). We measure **tool-call accuracy** as an engineering metric.
- **Structured outputs (JSON schema):** intake parsing and every proposal/counter use Qwen's
  JSON/structured-output mode against strict schemas, so the negotiation state is always
  machine-valid (no brittle regex parsing of free text).
- **Multimodal intake via `qwen-vl` (stretch, high-impact):** upload a term sheet, cap table,
  or a photo of an asset list; `qwen-vl-max` extracts the structured assets/valuations. Shows
  Qwen's multimodal capability and removes manual data entry in the demo.
- **Deliberate model routing (performance optimization):** `qwen-max`/`qwen3` for the
  mediator + referee (hardest reasoning), `qwen-plus` for advocates, `qwen-turbo` for intake.
  We log tokens + latency + cost per role to show thoughtful, cost-aware adoption.
- **Context caching:** the shared, static negotiation rules/system context is sent once and
  cached across the many advocate/mediator turns, cutting tokens and latency per round.
- **Streaming:** token streaming powers the live negotiation-table UI.

**Algorithmic innovation:** the Fairness Engine implements real fair-division algorithms
(envy-freeness checks, Nash-welfare maximization, adjusted-winner / sequential-allocation
seeding) and couples them to LLM negotiation — a genuinely novel hybrid of classical
mechanism design and agentic dialogue.

## 8. Scope (YAGNI-guarded)

**MVP (must ship):**
- 2 parties, mixed assets (cash + indivisible items), cofounder-split flagship scenario.
- Fairness Engine + eval harness proving the single-agent win.
- LangGraph society (Intake, 2 Advocates, Mediator, Referee) on Qwen.
- FastAPI streaming + Next.js negotiation-table UI.
- Settlement Agreement artifact.
- Deployed on Alibaba Cloud ECS.

**Stretch (only if time):**
- N-party disputes; additional scenario presets (estate, contract).
- Human-in-the-loop: a party can reject/flag and re-run with new constraints.
- Voice narration of the negotiation; PDF export.

**Explicitly out of scope:** video generation, hardware/edge, real legal validity,
authentication/multi-tenant, payment.

## 9. Submission checklist (Devpost requirements)

- [ ] Public repo + OSS license (MIT) visible in About section.
- [ ] Architecture diagram (Qwen Cloud → backend → DB → frontend).
- [ ] ~3-min demo video (YouTube/Vimeo, public).
- [ ] Alibaba Cloud deployment proof: a linked code file using Alibaba services/APIs
      + a short separate recording showing the backend running on Alibaba Cloud.
- [ ] Text description of features/functionality.
- [ ] Track identified: Track 3 — Agent Society.
- [ ] Optional: blog post on the build journey (extra prize eligibility).

## 10. 8-day plan (high level — detailed plan to follow)

- **Day 1–2:** Fairness Engine + synthetic dispute generator + eval harness + single-agent
  baseline. *Prove the win early.*
- **Day 3–4:** LangGraph society on Qwen (intake, advocates, mediator, referee); negotiation protocol.
- **Day 5:** FastAPI + SSE streaming; wire society to API.
- **Day 6:** Next.js negotiation-table UI.
- **Day 7:** Deploy to Alibaba Cloud ECS; run eval; generate charts; polish.
- **Day 8:** Demo video, architecture diagram, README/docs, deployment-proof recording, submit.

## 11. Key risks & mitigations

| Risk | Mitigation |
|---|---|
| Negotiation doesn't converge / loops | Hard max-round cap; mediator forces best-achievable; Fairness Engine always returns a certifiable allocation as fallback. |
| Single-agent baseline accidentally ties Arbiter | Tune dispute difficulty (more items, sharper valuation conflicts) where coordination matters; report across a distribution, not one case. |
| Alibaba Cloud credits delayed | Build/test locally against DashScope-compatible API; deployment is a thin final step (ECS + env vars). |
| LLM nondeterminism makes demo flaky | Seeded scenarios, low temperature for mediator/referee, ret/fallback logic; pre-recorded backup run for the video. |
| Solo time pressure | Eval + engine first (deterministic, high-value); UI is the last layer and can degrade gracefully to a transcript view. |
