"""Fair-division solver — the objective "fair target" for the negotiation.

Given fully-specified valuations, this computes a provably fair allocation that
the mediator uses to seed and steer the agents' negotiation. It is the classical
result for two-agent division with transferable utility:

1. **Efficiency:** assign each item to the party that values it most, so no value
   is wasted (Pareto-efficient with quasi-linear utilities).
2. **Equity + envy-freeness:** apply a single cash side-payment so both parties
   end with equal utility. Because every item already sits with its highest
   valuer, equalizing utility also removes all envy.

The solver is deliberately separate from the LLM layer: it provides the guarantees
and the target, while the agents handle messy natural-language elicitation,
constraints, and advocacy. See the design spec for why both are needed.
"""

from __future__ import annotations

from .domain import Allocation, Dispute


def solve_fair_division(dispute: Dispute) -> Allocation:
    """Return a fair-target allocation (envy-free + Pareto-efficient for 2 parties)."""
    # 1. Efficiency: each item to its highest valuer (stable tie-break to the
    #    earliest-listed party).
    items: dict[str, str] = {}
    for item in dispute.items:
        winner = max(
            dispute.parties,
            key=lambda p, it=item: dispute.valuations[p][it],
        )
        items[item] = winner

    # Each party's realized value from the items it received.
    items_value = {
        p: sum(dispute.valuations[p][it] for it, owner in items.items() if owner == p)
        for p in dispute.parties
    }

    # 2. Equity: cash transfers that equalize utilities. With target utility
    #    t = (sum of realized item values + cash pool) / n, set cash_p = t - value_p.
    #    Then sum(cash) = n*t - sum(values) = cash_pool, as required.
    n = len(dispute.parties)
    target = (sum(items_value.values()) + dispute.cash_pool) / n
    cash = {p: target - items_value[p] for p in dispute.parties}

    return Allocation(items=items, cash=cash)
