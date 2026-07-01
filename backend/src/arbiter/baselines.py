"""Baseline allocation strategies for benchmarking.

These stand in for "unsophisticated" division approaches so the harness can show
how much fairness the math-grounded solver (and, later, the agent society) adds.
"""

from __future__ import annotations

from .domain import Allocation, Dispute


def naive_split(dispute: Dispute) -> Allocation:
    """Round-robin the items and split the cash pool evenly.

    A plausible "just divide it up" heuristic that ignores who values what — so it
    routinely leaves value on the table and creates envy.
    """
    parties = dispute.parties
    items = {
        item: parties[index % len(parties)] for index, item in enumerate(dispute.items)
    }
    share = dispute.cash_pool / len(parties)
    cash = {party: share for party in parties}
    return Allocation(items=items, cash=cash)
