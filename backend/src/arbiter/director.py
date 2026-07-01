"""Engine-driven negotiation: structure from the math, prose from a narrator.

``run_negotiation`` computes the entire negotiation — proposals, contested assets,
concessions, and the certified-fair settlement — from the fairness engine, and
delegates only the wording to a Narrator. The default TemplateNarrator needs no
LLM; passing an LLMNarrator voices the same negotiation with Qwen.
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


def _all_to(dispute: Dispute, party: str, cash_share: float) -> Allocation:
    """A greedy allocation: one party takes every item and most of the cash."""
    other = next(p for p in dispute.parties if p != party)
    return Allocation(
        items={item: party for item in dispute.items},
        cash={
            party: round(dispute.cash_pool * cash_share, 1),
            other: round(dispute.cash_pool * (1 - cash_share), 1),
        },
    )


def run_negotiation(
    scenario: Scenario, narrator: Narrator | None = None
) -> Iterator[dict[str, Any]]:
    """Yield the full negotiation as an ordered stream of contract events."""
    narrator = narrator or TemplateNarrator()
    dispute = scenario.dispute
    p0, p1 = dispute.parties

    yield {
        "type": "session_started",
        "parties": [
            {"id": m.id, "name": m.name, "role": m.role, "side": m.side}
            for m in scenario.parties
        ],
        "items": [{"id": i, "label": scenario.item_labels[i]} for i in dispute.items],
        "cashPool": dispute.cash_pool,
        "dispute": scenario.description,
    }

    yield {"type": "intake", "text": narrator.intake(scenario)}

    # Round 1 — opening: p0 grabs everything.
    opening = _all_to(dispute, p0, cash_share=0.7)
    opening_report = _report_payload(dispute, opening)
    yield {
        "type": "proposal",
        "round": 1,
        "partyId": p0,
        "kind": "opening",
        "allocation": _alloc_payload(opening),
        "report": opening_report,
        "rationale": narrator.opening(scenario, p0, opening_report),
    }

    contested = [i for i in dispute.items if _highest_valuer(dispute, i) != p0]
    yield {
        "type": "mediator",
        "round": 1,
        "text": narrator.mediation_opening(scenario, contested),
        "contested": contested,
    }

    # Round 2 — counter: p1 grabs everything instead.
    counter = _all_to(dispute, p1, cash_share=0.7)
    counter_report = _report_payload(dispute, counter)
    yield {
        "type": "proposal",
        "round": 2,
        "partyId": p1,
        "kind": "counter",
        "allocation": _alloc_payload(counter),
        "report": counter_report,
        "rationale": narrator.counter(scenario, p1, counter_report),
    }

    settlement = solve_fair_division(dispute)
    yield {
        "type": "mediator",
        "round": 2,
        "text": narrator.mediation_propose(scenario),
        "contested": [],
    }

    # Round 3 — concessions that move each item to its final, efficient owner.
    for item in dispute.items:
        final_owner = settlement.items[item]
        if final_owner != p1:
            yield {
                "type": "concession",
                "round": 3,
                "partyId": p1,
                "text": narrator.concession_item(scenario, p1, item, final_owner),
            }
    yield {
        "type": "concession",
        "round": 3,
        "partyId": p0,
        "text": narrator.concession_balance(scenario, p0, settlement.cash[p0]),
    }

    yield {
        "type": "fairness_update",
        "round": 3,
        "report": _report_payload(dispute, settlement),
    }

    rationale: dict[str, str] = {}
    for m in scenario.parties:
        held = [i for i in dispute.items if settlement.items[i] == m.id]
        utility = fairness.utility(dispute, settlement, m.id)
        rationale[m.id] = narrator.settlement(
            scenario, m.id, held, settlement.cash[m.id], utility
        )

    yield {
        "type": "settlement",
        "allocation": _alloc_payload(settlement),
        "report": _report_payload(dispute, settlement),
        "rationale": rationale,
    }
