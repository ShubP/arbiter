# Submission kit — Devpost draft, video script, checklist

Working draft for the Global AI Hackathon Series with Qwen Cloud. Official final
submission: **July 9, 2026, 2 PM PT** (per the hackathon PDF) — we target
**July 8** to leave margin. Video length: **1–3 minutes max**.

Live-verified setup: pay-as-you-go DashScope endpoint
(`dashscope-intl.aliyuncs.com/compatible-mode/v1`) with the hackathon catalog —
`qwen3.7-max` (mediator/referee), `qwen3.7-plus` (advocates), `qwen3.6-flash`
(intake). Free tier: 70M+ tokens.

---

## Track

**Track 3 — Agent Society.**

## One-liner (Devpost tagline)

> Every side of a dispute gets its own AI advocate. They negotiate a provably fair
> settlement in under a minute — and the game-theory math proves it.

## Devpost description (draft)

**The problem.** High-stakes splits — cofounders dividing equity, siblings dividing
an estate, a band splitting its catalog — are slow, expensive, and feel unfair
because each side only sees its own perspective. A single "neutral AI" that dictates
a verdict isn't trusted: there's no advocacy, and no proof the outcome is fair.

**What Arbiter does.** Arbiter convenes a society of agents around your dispute.
Each party (2–6) gets an advocate that knows only that side's private valuations and
fights for it — opening with claims, then demanding the assets it values most. A
neutral mediator adjudicates every demand by calling a deterministic **fairness
engine** (exposed over **MCP**): efficient trades are granted, inefficient grabs are
denied and compensated in cash. The negotiation path *emerges from the valuations* —
different disputes negotiate differently — and converges on a settlement scored
against real fair-division criteria: **envy-freeness, proportionality, Nash welfare,
Pareto-efficiency**. The result is a downloadable Settlement Agreement with a
fairness certificate and a full transcript.

**How agents resolve conflict (the Track 3 core).** Conflicts between advocates are
resolved by mechanism, not by vibes: the mediator grants a demand exactly when it
increases total welfare, denies it otherwise, and cash side-payments equalize the
outcome. Humans stay in the loop through **red-lines** ("I must keep the house") —
honored by the mediator, with the fairness cost reported honestly (a constrained
settlement is sealed *best effort*, never falsely *certified fair*).

**The measurable gain.** Over 200 seeded disputes, a naive split is envy-free 28% of
the time (Pareto-efficient: 2%). Arbiter's engine-refereed agent society reaches
envy-free, proportional, Pareto-efficient settlements **100%** of the time at ~60%
higher Nash welfare (chart in the repo; reproducible with one command).

**Qwen Cloud usage.** Advocates, mediator and referee are voiced by Qwen through
Alibaba Cloud DashScope's OpenAI-compatible API, with cost-aware model routing per
role (qwen-max for mediation/adjudication, qwen-plus for advocacy, qwen-turbo for
intake). A Qwen intake agent turns a plain-English description of a dispute into a
structured, runnable case. The fairness engine is published as an **MCP server** so
any MCP host — including the agents — calls the same auditable math. Everything
degrades gracefully: with zero LLM calls the deterministic engine keeps the entire
product functional.

**Stack.** FastAPI (SSE streaming) + deterministic fairness engine (78 tests) on
Alibaba Cloud ECS · Qwen via DashScope · MCP · Next.js 16 + Tailwind + Framer Motion.

## Required submission items (checklist)

- [ ] **Public repo + OSS license** — MIT, visible in the About section →
      https://github.com/ShubP/arbiter ✅ (make sure the repo About shows the license)
- [ ] **Architecture diagram** — `docs/architecture.png`, embedded in README ✅
- [ ] **Text description** — this file's draft ✅
- [ ] **Track identified** — Track 3 ✅
- [ ] **Proof of Alibaba Cloud deployment** — link to
      [`backend/src/arbiter/llm.py`](../backend/src/arbiter/llm.py) (DashScope
      integration) **+ short screen recording** showing the backend running on the
      ECS instance (terminal with `docker compose ps` + `curl /health` on the public
      IP + the Alibaba Cloud console). ⬜ *needs the deployed instance*
- [ ] **~3-min demo video** — YouTube/Vimeo, public. ⬜ *script below*
- [ ] Optional: blog/social post for the Blog Post Prize. ⬜

## 3-minute video script

**0:00–0:25 — The hook (voice over the landing page).**
"When two cofounders split a company, or siblings divide an estate, everyone has a
different idea of what's fair — and nobody trusts a single AI to just decide. So we
built Arbiter: every side gets its own AI advocate, they negotiate, and game theory
proves the result is fair."

**0:25–1:10 — The flagship run (demo page, cofounder preset).**
Click *Convene*. Narrate as events stream: "Ava's advocate opens by claiming
everything. Ben's counters. Watch the mediator: Ben demands the CTO seat — he values
it 100, Ava only 20 — so the trade is granted. Every move is checked by a fairness
engine the agents call over MCP." Point at the balance leveling, the envy readout
hitting zero, the seal stamping. "Envy-free, proportional, Pareto-efficient —
certified, and downloadable."

**1:10–1:50 — It's a real tool (build your own).**
Type a quick 2-party dispute (or use *Describe it* with Qwen intake if the key is
live). Add a red-line lock: "Priya must keep the lake house — even though Owen
values it more. The mediator honors the red-line, and look: the engine is honest.
This one can't be envy-free, so it's sealed *best effort*, with the exact envy
shown. No fake certificates."

**1:50–2:20 — The society is bigger than a duel (band preset, 3 parties).**
Run the 3-way band split. "Three advocates, one mediator, emergent bargaining —
each asset ends with whoever values it most, cash equalizes the rest, all three
walk away with identical outcomes."

**2:20–2:50 — The proof (README chart + architecture).**
Show the benchmark chart: "Across 200 disputes, naive splitting is envy-free 28% of
the time. Arbiter: 100%, with ~60% higher joint welfare." Flash the architecture
diagram: "Qwen on Alibaba Cloud voices the agents; a deterministic MCP fairness
server referees them; the backend streams it live from Alibaba Cloud ECS."

**2:50–3:00 — Close.**
"Arbiter — every side gets an advocate, and the math makes it fair. Track 3, built
on Qwen Cloud."

## Deployment-proof recording (separate, ~40s)

1. Alibaba Cloud console: show the ECS instance (name, public IP, status Running).
2. SSH terminal on the instance: `docker compose ps` (backend + frontend up).
3. `curl http://<PUBLIC_IP>:8000/health` → `{"status":"ok"}`.
4. Browser: open `http://<PUBLIC_IP>:3000/demo`, run a preset briefly.
5. Show `backend/src/arbiter/llm.py` in the repo (the DashScope base URL) and the
   matching `DASHSCOPE_API_KEY` env var name in `docker-compose.yml`.
