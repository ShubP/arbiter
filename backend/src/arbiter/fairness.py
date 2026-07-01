"""The deterministic Fairness Engine.

Pure functions over Dispute/Allocation that compute classical fair-division
criteria. No LLM, no randomness — this is the math that adjudicates the agents'
negotiation.
"""

from __future__ import annotations

from dataclasses import dataclass

from .domain import Allocation, Dispute


def utility(dispute: Dispute, allocation: Allocation, party: str) -> float:
    """Return ``party``'s utility under ``allocation``.

    Utility = sum of the party's valuations of the items it receives + its net cash.
    """
    items_value = sum(
        dispute.valuations[party][item]
        for item, owner in allocation.items.items()
        if owner == party
    )
    return items_value + allocation.cash.get(party, 0.0)


def total_pot_value(dispute: Dispute, party: str) -> float:
    """Total value ``party`` assigns to the entire pot (all items + all cash)."""
    items_total = sum(dispute.valuations[party][item] for item in dispute.items)
    return items_total + dispute.cash_pool


def proportional_share(dispute: Dispute, party: str) -> float:
    """The fair 1/n share of the pot, measured in ``party``'s own valuation."""
    return total_pot_value(dispute, party) / len(dispute.parties)


def is_proportional(
    dispute: Dispute, allocation: Allocation, tol: float = 1e-9
) -> bool:
    """True iff every party receives at least its proportional share."""
    return all(
        utility(dispute, allocation, p) >= proportional_share(dispute, p) - tol
        for p in dispute.parties
    )


def bundle_value(
    dispute: Dispute, allocation: Allocation, evaluator: str, owner: str
) -> float:
    """Value ``evaluator`` assigns to ``owner``'s bundle (items + net cash).

    Items are valued through the *evaluator*'s eyes; cash is valued 1:1.
    """
    items_value = sum(
        dispute.valuations[evaluator][item]
        for item, holder in allocation.items.items()
        if holder == owner
    )
    return items_value + allocation.cash.get(owner, 0.0)


def envy(dispute: Dispute, allocation: Allocation, envier: str, other: str) -> float:
    """How much ``envier`` envies ``other`` (positive = envy, <=0 = none)."""
    own = bundle_value(dispute, allocation, evaluator=envier, owner=envier)
    theirs = bundle_value(dispute, allocation, evaluator=envier, owner=other)
    return theirs - own


def max_envy(dispute: Dispute, allocation: Allocation) -> float:
    """The largest envy any party feels toward any other (0.0 if envy-free)."""
    envies = [
        envy(dispute, allocation, envier, other)
        for envier in dispute.parties
        for other in dispute.parties
        if envier != other
    ]
    return max([0.0, *envies])


def is_envy_free(dispute: Dispute, allocation: Allocation, tol: float = 1e-9) -> bool:
    """True iff no party prefers another party's bundle to its own."""
    return max_envy(dispute, allocation) <= tol


def _utilities(dispute: Dispute, allocation: Allocation) -> list[float]:
    return [utility(dispute, allocation, p) for p in dispute.parties]


def utilitarian_welfare(dispute: Dispute, allocation: Allocation) -> float:
    """Sum of all parties' utilities (total value created)."""
    return sum(_utilities(dispute, allocation))


def egalitarian_welfare(dispute: Dispute, allocation: Allocation) -> float:
    """The worst-off party's utility (max-min fairness)."""
    return min(_utilities(dispute, allocation))


def nash_welfare(dispute: Dispute, allocation: Allocation) -> float:
    """Product of utilities — the standard joint-fairness objective.

    Returns 0.0 if any party has non-positive utility, since the product would be
    undefined or non-rewarding in that regime.
    """
    utils = _utilities(dispute, allocation)
    if any(u <= 0 for u in utils):
        return 0.0
    product = 1.0
    for u in utils:
        product *= u
    return product


def max_item_welfare(dispute: Dispute) -> float:
    """Best achievable total item value: each item to whoever values it most."""
    return sum(
        max(dispute.valuations[p][item] for p in dispute.parties)
        for item in dispute.items
    )


def item_welfare(dispute: Dispute, allocation: Allocation) -> float:
    """Total item value under ``allocation`` (as valued by each item's owner)."""
    return sum(
        dispute.valuations[owner][item] for item, owner in allocation.items.items()
    )


def is_pareto_efficient(
    dispute: Dispute, allocation: Allocation, tol: float = 1e-9
) -> bool:
    """True iff no reallocation could help someone without hurting another.

    With quasi-linear utilities and freely transferable cash, this holds exactly
    when every item is assigned to a party that values it most (so total value is
    maximized and cash can redistribute the surplus). Cash transfers are therefore
    irrelevant to efficiency.
    """
    return item_welfare(dispute, allocation) >= max_item_welfare(dispute) - tol


@dataclass(frozen=True)
class FairnessReport:
    """A complete fairness assessment of one allocation.

    ``certified_fair`` is the headline seal: it is True only when the allocation
    is simultaneously envy-free, proportional, and Pareto-efficient.
    """

    utilities: dict[str, float]
    proportional: bool
    envy_free: bool
    max_envy: float
    pareto_efficient: bool
    nash_welfare: float
    utilitarian_welfare: float
    egalitarian_welfare: float
    certified_fair: bool


def evaluate_allocation(
    dispute: Dispute, allocation: Allocation, tol: float = 1e-9
) -> FairnessReport:
    """Score an allocation on every fairness criterion and issue a certificate."""
    proportional = is_proportional(dispute, allocation, tol)
    envy_free = is_envy_free(dispute, allocation, tol)
    pareto_efficient = is_pareto_efficient(dispute, allocation, tol)
    return FairnessReport(
        utilities={p: utility(dispute, allocation, p) for p in dispute.parties},
        proportional=proportional,
        envy_free=envy_free,
        max_envy=max_envy(dispute, allocation),
        pareto_efficient=pareto_efficient,
        nash_welfare=nash_welfare(dispute, allocation),
        utilitarian_welfare=utilitarian_welfare(dispute, allocation),
        egalitarian_welfare=egalitarian_welfare(dispute, allocation),
        certified_fair=proportional and envy_free and pareto_efficient,
    )
