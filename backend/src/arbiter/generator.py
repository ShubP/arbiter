"""Synthetic dispute generator for the evaluation harness.

Produces reproducible, seed-controlled fair-division instances so the eval harness
can benchmark Arbiter against a single-agent baseline over a distribution of
disputes rather than a single cherry-picked case.
"""

from __future__ import annotations

import random

from .domain import Dispute


def generate_dispute(
    seed: int,
    num_items: int = 5,
    num_parties: int = 2,
    max_value: float = 100.0,
    cash_pool: float = 0.0,
) -> Dispute:
    """Generate a reproducible dispute for the given seed and shape parameters.

    Each party independently values each item at a random amount in [1, max_value],
    which naturally creates the preference conflicts that make division non-trivial.
    """
    rng = random.Random(seed)
    parties = tuple(f"party_{i}" for i in range(num_parties))
    items = tuple(f"item_{j}" for j in range(num_items))
    valuations = {
        party: {item: float(rng.randint(1, int(max_value))) for item in items}
        for party in parties
    }
    return Dispute(
        parties=parties,
        items=items,
        valuations=valuations,
        cash_pool=cash_pool,
    )
