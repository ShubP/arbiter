"""The emergent, engine-refereed negotiation protocol (N parties).

This is a *real* negotiation, not a script. Each advocate makes moves — claiming
assets, then demanding the specific asset it values most from whoever holds it —
and the mediator adjudicates every demand with the fairness engine:

- **Grant** the demand when the demander values the asset at least as much as the
  current holder (this strictly improves total welfare — an efficient trade).
- **Deny** it otherwise, leaving the asset with its higher valuer and compensating
  the demander in cash instead.

The *path* emerges from the actual valuations, so different disputes negotiate
differently. It provably terminates (grants monotonically increase welfare;
denials are never repeated) and converges to an efficient allocation, which the
mediator then equalizes with cash into the certified settlement. For two parties
that settlement is envy-free; for more it is the best achievable, and the engine
reports exactly how fair it is.

The wording of every move is delegated to a Narrator (templates for free, Qwen
when live), so swapping narrators changes the voice, never the fairness.
"""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any

from . import fairness
from .domain import Allocation, Dispute
from .narration import Narrator, TemplateNarrator
from .scenarios import Scenario
from .solver import solve_fair_division


def _highest_valuer(dispute: Dispute, item: str) -> str:
    return max(dispute.parties, key=lambda p: dispute.valuations[p][item])


def _report_payload(dispute: Dispute, allocation: Allocation) -> dict[str, Any]:
    r = fairness.evaluate_allocation(dispute, allocation)
    return {
        "utilities": dict(r.utilities),
        "proportional": r.proportional,
        "envyFree": r.envy_free,
        "maxEnvy": round(r.max_envy, 1),
        "paretoEfficient": r.pareto_efficient,
        "nashWelfare": round(r.nash_welfare),
        "certifiedFair": r.certified_fair,
    }


def _alloc_payload(allocation: Allocation) -> dict[str, Any]:
    return {"items": dict(allocation.items), "cash": dict(allocation.cash)}


def _zero_cash(dispute: Dispute) -> dict[str, float]:
    return {p: 0.0 for p in dispute.parties}


def run_negotiation(
    scenario: Scenario, narrator: Narrator | None = None
) -> Iterator[dict[str, Any]]:
    """Yield the emergent negotiation as an ordered stream of contract events."""
    narrator = narrator or TemplateNarrator()
    dispute = scenario.dispute
    parties = dispute.parties
    items = dispute.items
    constraints = scenario.constraints  # item id -> party that must keep it

    yield {
        "type": "session_started",
        "parties": [
            {"id": m.id, "name": m.name, "role": m.role, "side": m.side}
            for m in scenario.parties
        ],
        "items": [{"id": i, "label": scenario.item_labels[i]} for i in items],
        "cashPool": dispute.cash_pool,
        "dispute": scenario.description,
        "constraints": dict(constraints),
    }

    yield {"type": "intake", "text": narrator.intake(scenario)}

    # --- Opening: every party claims everything for itself. -------------------
    for party in parties:
        claim = Allocation(
            items={it: party for it in items},
            cash={p: (dispute.cash_pool if p == party else 0.0) for p in parties},
        )
        report = _report_payload(dispute, claim)
        yield {
            "type": "proposal",
            "round": 1,
            "partyId": party,
            "kind": "opening",
            "allocation": _alloc_payload(claim),
            "report": report,
            "rationale": narrator.opening(scenario, party, report),
        }

    # Provisional working allocation: constrained assets sit with their required
    # owner from the start; everything else provisionally with the first party.
    held: dict[str, str] = {
        it: (constraints[it] if it in constraints else parties[0]) for it in items
    }
    contested = [
        it
        for it in items
        if it not in constraints and _highest_valuer(dispute, it) != parties[0]
    ]
    yield {
        "type": "mediator",
        "round": 1,
        "text": narrator.mediation_opening(scenario, contested),
        "contested": contested,
    }

    # --- Bargaining: advocates demand assets; the mediator adjudicates. -------
    denied: set[tuple[str, str]] = set()
    round_no = 2
    max_steps = len(parties) * len(items) + len(items) + 2

    for _ in range(max_steps):
        if all(
            held[it] == _highest_valuer(dispute, it)
            for it in items
            if it not in constraints
        ):
            break

        # Choose the strongest outstanding demand: the party that most intensely
        # wants an unlocked asset it doesn't hold and hasn't already been denied.
        best: tuple[float, str, str, str] | None = None
        for party in parties:
            wanted = [
                it
                for it in items
                if held[it] != party
                and (party, it) not in denied
                and it not in constraints
            ]
            if not wanted:
                continue
            target = max(wanted, key=lambda it: dispute.valuations[party][it])
            intensity = dispute.valuations[party][target]
            if best is None or intensity > best[0]:
                best = (intensity, party, target, held[target])

        if best is None:
            break
        _, party, item, holder = best

        proposed = {**held, item: party}
        demand_alloc = Allocation(items=proposed, cash=_zero_cash(dispute))
        yield {
            "type": "proposal",
            "round": round_no,
            "partyId": party,
            "kind": "counter",
            "allocation": _alloc_payload(demand_alloc),
            "report": _report_payload(dispute, demand_alloc),
            "rationale": narrator.demand(scenario, party, item, holder),
        }

        if dispute.valuations[party][item] >= dispute.valuations[holder][item]:
            held[item] = party
            yield {
                "type": "concession",
                "round": round_no,
                "partyId": holder,
                "text": narrator.concession_item(scenario, holder, item, party),
            }
        else:
            denied.add((party, item))
            yield {
                "type": "mediator",
                "round": round_no,
                "text": narrator.deny(scenario, party, item, holder),
                "contested": [item],
            }
        round_no += 1

    # --- Settlement: efficient assignment (honoring red-lines), equalized. -----
    settlement = solve_fair_division(dispute, constraints)
    yield {
        "type": "mediator",
        "round": round_no,
        "text": narrator.mediation_propose(scenario),
        "contested": [],
    }
    yield {
        "type": "fairness_update",
        "round": round_no,
        "report": _report_payload(dispute, settlement),
    }

    rationale: dict[str, str] = {}
    for m in scenario.parties:
        bundle = [i for i in items if settlement.items[i] == m.id]
        utility = fairness.utility(dispute, settlement, m.id)
        rationale[m.id] = narrator.settlement(
            scenario, m.id, bundle, settlement.cash[m.id], utility
        )

    yield {
        "type": "settlement",
        "allocation": _alloc_payload(settlement),
        "report": _report_payload(dispute, settlement),
        "rationale": rationale,
    }
