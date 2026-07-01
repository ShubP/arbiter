"""Core domain types for the Fairness Engine.

Utilities are quasi-linear: cash is a 1:1 numeraire that every party values at face.
A party's utility for a bundle = sum of its private valuations of the items in the
bundle + the net cash it receives.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Dispute:
    """A fair-division problem instance.

    Attributes:
        parties: the disputing parties (e.g., ("alice", "bob")).
        items: indivisible items to allocate (each goes to exactly one party).
        valuations: party -> item -> how much that party privately values the item.
        cash_pool: divisible external cash to distribute (party net-cash sums to this).
    """

    parties: tuple[str, ...]
    items: tuple[str, ...]
    valuations: dict[str, dict[str, float]]
    cash_pool: float = 0.0


@dataclass(frozen=True)
class Allocation:
    """An assignment of items and net cash to parties.

    Attributes:
        items: item -> the party that receives it.
        cash: party -> net cash received (negative = pays a side-payment).
              The sum across parties equals the dispute's cash_pool.
    """

    items: dict[str, str]
    cash: dict[str, float] = field(default_factory=dict)
