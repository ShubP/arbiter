"""Tests for baseline (non-society) allocation strategies used in benchmarking."""

from arbiter.baselines import naive_split
from arbiter.generator import generate_dispute


def test_naive_split_assigns_every_item_to_a_party():
    dispute = generate_dispute(seed=5, num_items=6)
    allocation = naive_split(dispute)
    assert set(allocation.items) == set(dispute.items)
    assert all(owner in dispute.parties for owner in allocation.items.values())


def test_naive_split_cash_sums_to_the_pool():
    dispute = generate_dispute(seed=5, num_items=6, cash_pool=120.0)
    allocation = naive_split(dispute)
    assert sum(allocation.cash.values()) == 120.0
