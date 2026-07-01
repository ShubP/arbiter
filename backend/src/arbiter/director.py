"""Deterministic, engine-driven negotiation director.

Produces the frontend event contract (camelCase) with real fairness reports at
every step, converging on the solver's provably fair settlement. This is the
non-LLM event source for the streaming API; the Qwen agent society will later
emit the same events with richer, generated rationales.
"""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any

from . import fairness
from .domain import Allocation, Dispute
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


def _cash_phrase(amount: float) -> str:
    """Human wording for a net cash amount (receives / pays a side-payment)."""
    if amount >= 0:
        return f"receives ${amount:g}k"
    return f"pays ${-amount:g}k"


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


def run_negotiation(scenario: Scenario) -> Iterator[dict[str, Any]]:
    """Yield the full negotiation as an ordered stream of contract events."""
    dispute = scenario.dispute
    p0, p1 = dispute.parties
    meta = {m.id: m for m in scenario.parties}
    labels = scenario.item_labels

    yield {
        "type": "session_started",
        "parties": [
            {"id": m.id, "name": m.name, "role": m.role, "side": m.side}
            for m in scenario.parties
        ],
        "items": [{"id": i, "label": labels[i]} for i in dispute.items],
        "cashPool": dispute.cash_pool,
        "dispute": scenario.description,
    }

    yield {
        "type": "intake",
        "text": (
            f"Structured the dispute: {len(dispute.items)} indivisible assets, "
            f"${int(dispute.cash_pool)}k divisible treasury, "
            f"{len(dispute.parties)} parties. Private valuations elicited."
        ),
    }

    # Round 1 — opening: p0 grabs everything.
    opening = _all_to(dispute, p0, cash_share=0.7)
    yield {
        "type": "proposal",
        "round": 1,
        "partyId": p0,
        "kind": "opening",
        "allocation": _alloc_payload(opening),
        "report": _report_payload(dispute, opening),
        "rationale": (
            f"{meta[p0].name} opens by claiming every asset, offering "
            f"{meta[p1].name} only a cash buyout."
        ),
    }

    contested = [i for i in dispute.items if _highest_valuer(dispute, i) != p0]
    contested_text = ", ".join(labels[i] for i in contested) or "the assets"
    yield {
        "type": "mediator",
        "round": 1,
        "text": (
            f"This opening leaves {meta[p1].name} with heavy envy. "
            f"{contested_text} sit with the party who values them least."
        ),
        "contested": contested,
    }

    # Round 2 — counter: p1 grabs everything instead.
    counter = _all_to(dispute, p1, cash_share=0.7)
    yield {
        "type": "proposal",
        "round": 2,
        "partyId": p1,
        "kind": "counter",
        "allocation": _alloc_payload(counter),
        "report": _report_payload(dispute, counter),
        "rationale": (
            f"{meta[p1].name} counters by claiming everything instead — "
            "an equal and opposite extreme."
        ),
    }

    settlement = solve_fair_division(dispute)
    yield {
        "type": "mediator",
        "round": 2,
        "text": (
            "Both openings are extremes. I propose the efficient division: each "
            "asset goes to whoever values it most, with cash settling the "
            "difference so neither side envies the other."
        ),
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
                "text": (
                    f"{meta[p1].name} concedes {labels[item]} to "
                    f"{meta[final_owner].name}, who values it more."
                ),
            }
    yield {
        "type": "concession",
        "round": 3,
        "partyId": p0,
        "text": (
            f"{meta[p0].name} {_cash_phrase(settlement.cash[p0])} to balance the "
            "assets retained."
        ),
    }

    yield {
        "type": "fairness_update",
        "round": 3,
        "report": _report_payload(dispute, settlement),
    }

    utilities = {
        m.id: fairness.utility(dispute, settlement, m.id) for m in scenario.parties
    }
    rationale: dict[str, str] = {}
    for m in scenario.parties:
        held = [labels[i] for i in dispute.items if settlement.items[i] == m.id]
        held_text = ", ".join(held) if held else "no assets"
        rationale[m.id] = (
            f"{m.name} keeps {held_text} and {_cash_phrase(settlement.cash[m.id])}. "
            f"Final outcome {utilities[m.id]:g} — identical to the other party, "
            "so neither would trade places."
        )

    yield {
        "type": "settlement",
        "allocation": _alloc_payload(settlement),
        "report": _report_payload(dispute, settlement),
        "rationale": rationale,
    }
