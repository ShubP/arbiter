"""Tests for the deterministic Fairness Engine.

Domain model (quasi-linear utilities, cash as a 1:1 numeraire):
- A Dispute has parties, indivisible items, each party's private valuations of
  each item, and an optional divisible cash pool.
- An Allocation assigns each item to exactly one party and gives each party a net
  cash amount (sum of net cash == cash_pool; side-payments net to zero).
- A party's utility = sum of its valuations of the items it receives + its net cash.
"""

from arbiter.domain import Allocation, Dispute
from arbiter.fairness import (
    bundle_value,
    egalitarian_welfare,
    evaluate_allocation,
    is_envy_free,
    is_pareto_efficient,
    is_proportional,
    max_envy,
    nash_welfare,
    proportional_share,
    utilitarian_welfare,
    utility,
)


def test_utility_sums_valued_items_plus_cash():
    dispute = Dispute(
        parties=("alice", "bob"),
        items=("car", "laptop"),
        valuations={
            "alice": {"car": 100.0, "laptop": 40.0},
            "bob": {"car": 80.0, "laptop": 60.0},
        },
        cash_pool=0.0,
    )
    allocation = Allocation(
        items={"car": "alice", "laptop": "bob"},
        cash={"alice": 0.0, "bob": 0.0},
    )

    assert utility(dispute, allocation, "alice") == 100.0
    assert utility(dispute, allocation, "bob") == 60.0


def test_utility_includes_net_cash_side_payment():
    dispute = Dispute(
        parties=("alice", "bob"),
        items=("car",),
        valuations={"alice": {"car": 100.0}, "bob": {"car": 100.0}},
        cash_pool=0.0,
    )
    # Alice keeps the car but pays Bob a $50 side-payment.
    allocation = Allocation(items={"car": "alice"}, cash={"alice": -50.0, "bob": 50.0})

    assert utility(dispute, allocation, "alice") == 50.0
    assert utility(dispute, allocation, "bob") == 50.0


def test_proportional_share_is_equal_split_of_own_total_valuation():
    dispute = Dispute(
        parties=("alice", "bob"),
        items=("car", "laptop"),
        valuations={
            "alice": {"car": 60.0, "laptop": 40.0},
            "bob": {"car": 50.0, "laptop": 50.0},
        },
        cash_pool=0.0,
    )
    # Each party values the whole pot at 100; fair share for 2 parties = 50.
    assert proportional_share(dispute, "alice") == 50.0
    assert proportional_share(dispute, "bob") == 50.0


def test_proportional_share_includes_cash_pool():
    dispute = Dispute(
        parties=("alice", "bob"),
        items=("car",),
        valuations={"alice": {"car": 100.0}, "bob": {"car": 100.0}},
        cash_pool=40.0,
    )
    # Total pot value to each = 100 (car) + 40 (cash) = 140; share = 70.
    assert proportional_share(dispute, "alice") == 70.0


def test_is_proportional_true_when_every_party_meets_its_share():
    dispute = Dispute(
        parties=("alice", "bob"),
        items=("car", "laptop"),
        valuations={
            "alice": {"car": 60.0, "laptop": 40.0},
            "bob": {"car": 50.0, "laptop": 50.0},
        },
        cash_pool=0.0,
    )
    allocation = Allocation(
        items={"car": "alice", "laptop": "bob"},
        cash={"alice": 0.0, "bob": 0.0},
    )
    # Alice gets 60 (>= 50), Bob gets 50 (>= 50).
    assert is_proportional(dispute, allocation) is True


def test_is_proportional_false_when_a_party_is_below_its_share():
    dispute = Dispute(
        parties=("alice", "bob"),
        items=("car", "laptop"),
        valuations={
            "alice": {"car": 60.0, "laptop": 40.0},
            "bob": {"car": 50.0, "laptop": 50.0},
        },
        cash_pool=0.0,
    )
    allocation = Allocation(
        items={"car": "bob", "laptop": "bob"},
        cash={"alice": 0.0, "bob": 0.0},
    )
    # Alice gets nothing (0 < 50).
    assert is_proportional(dispute, allocation) is False


# --- Envy-freeness -----------------------------------------------------------


def _complementary_dispute() -> Dispute:
    """Two parties with opposite preferences over two items."""
    return Dispute(
        parties=("alice", "bob"),
        items=("x", "y"),
        valuations={
            "alice": {"x": 70.0, "y": 30.0},
            "bob": {"x": 30.0, "y": 70.0},
        },
        cash_pool=0.0,
    )


def test_bundle_value_is_evaluators_valuation_of_owners_items_plus_cash():
    dispute = _complementary_dispute()
    allocation = Allocation(items={"x": "alice", "y": "bob"}, cash={"bob": 0.0})
    # Alice's own bundle {x} is worth 70 to Alice.
    assert bundle_value(dispute, allocation, evaluator="alice", owner="alice") == 70.0
    # Bob's bundle {y}, as valued by Alice, is worth 30 to Alice.
    assert bundle_value(dispute, allocation, evaluator="alice", owner="bob") == 30.0


def test_is_envy_free_when_each_party_prefers_its_own_bundle():
    dispute = _complementary_dispute()
    allocation = Allocation(
        items={"x": "alice", "y": "bob"},
        cash={"alice": 0.0, "bob": 0.0},
    )
    # Alice: own 70 vs Bob's 30 -> no envy. Bob: own 70 vs Alice's 30 -> no envy.
    assert is_envy_free(dispute, allocation) is True
    assert max_envy(dispute, allocation) == 0.0


def test_is_envy_free_false_and_max_envy_quantifies_the_worst_envy():
    dispute = _complementary_dispute()
    allocation = Allocation(
        items={"x": "bob", "y": "alice"},
        cash={"alice": 0.0, "bob": 0.0},
    )
    # Alice has {y}=30 but values Bob's {x} at 70 -> envy 40.
    assert is_envy_free(dispute, allocation) is False
    assert max_envy(dispute, allocation) == 40.0


def test_cash_side_payment_can_eliminate_envy():
    dispute = Dispute(
        parties=("alice", "bob"),
        items=("car",),
        valuations={"alice": {"car": 100.0}, "bob": {"car": 100.0}},
        cash_pool=0.0,
    )
    # Alice keeps the car (worth 100) and pays Bob 50. Both end at utility 50.
    allocation = Allocation(items={"car": "alice"}, cash={"alice": -50.0, "bob": 50.0})
    assert is_envy_free(dispute, allocation) is True


# --- Welfare objectives ------------------------------------------------------


def test_utilitarian_welfare_is_sum_of_utilities():
    dispute = _complementary_dispute()
    allocation = Allocation(
        items={"x": "alice", "y": "bob"}, cash={"alice": 0.0, "bob": 0.0}
    )
    assert utilitarian_welfare(dispute, allocation) == 140.0


def test_egalitarian_welfare_is_the_minimum_utility():
    dispute = _complementary_dispute()
    allocation = Allocation(
        items={"x": "alice", "y": "alice"}, cash={"alice": 0.0, "bob": 0.0}
    )
    # Alice 100, Bob 0 -> egalitarian welfare = 0.
    assert egalitarian_welfare(dispute, allocation) == 0.0


def test_nash_welfare_is_product_of_utilities():
    dispute = _complementary_dispute()
    allocation = Allocation(
        items={"x": "alice", "y": "bob"}, cash={"alice": 0.0, "bob": 0.0}
    )
    assert nash_welfare(dispute, allocation) == 70.0 * 70.0


def test_nash_welfare_is_zero_when_any_party_has_nonpositive_utility():
    dispute = _complementary_dispute()
    allocation = Allocation(
        items={"x": "alice", "y": "alice"}, cash={"alice": 0.0, "bob": 0.0}
    )
    # Bob has utility 0, so the product (Nash welfare) collapses to 0.
    assert nash_welfare(dispute, allocation) == 0.0


# --- Pareto efficiency -------------------------------------------------------


def test_pareto_efficient_when_each_item_goes_to_its_highest_valuer():
    dispute = _complementary_dispute()  # alice values x most, bob values y most
    allocation = Allocation(
        items={"x": "alice", "y": "bob"}, cash={"alice": 0.0, "bob": 0.0}
    )
    assert is_pareto_efficient(dispute, allocation) is True


def test_not_pareto_efficient_when_an_item_goes_to_a_lower_valuer():
    dispute = _complementary_dispute()
    allocation = Allocation(
        items={"x": "bob", "y": "alice"}, cash={"alice": 0.0, "bob": 0.0}
    )
    # Both items are with the party that values them less -> value is left on the table.
    assert is_pareto_efficient(dispute, allocation) is False


def test_pareto_efficiency_ignores_cash_transfers():
    dispute = _complementary_dispute()
    # Efficient item assignment; cash side-payments don't change efficiency.
    allocation = Allocation(
        items={"x": "alice", "y": "bob"}, cash={"alice": -20.0, "bob": 20.0}
    )
    assert is_pareto_efficient(dispute, allocation) is True


# --- Full report / certificate -----------------------------------------------


def test_evaluate_allocation_reports_all_metrics_and_certifies_a_fair_deal():
    dispute = _complementary_dispute()
    allocation = Allocation(
        items={"x": "alice", "y": "bob"}, cash={"alice": 0.0, "bob": 0.0}
    )

    report = evaluate_allocation(dispute, allocation)

    assert report.utilities == {"alice": 70.0, "bob": 70.0}
    assert report.proportional is True
    assert report.envy_free is True
    assert report.max_envy == 0.0
    assert report.pareto_efficient is True
    assert report.nash_welfare == 70.0 * 70.0
    assert report.utilitarian_welfare == 140.0
    assert report.egalitarian_welfare == 70.0
    # A deal that is envy-free, proportional AND efficient earns the certificate.
    assert report.certified_fair is True


def test_evaluate_allocation_withholds_certificate_from_an_unfair_deal():
    dispute = _complementary_dispute()
    allocation = Allocation(
        items={"x": "bob", "y": "alice"}, cash={"alice": 0.0, "bob": 0.0}
    )

    report = evaluate_allocation(dispute, allocation)

    assert report.envy_free is False
    assert report.pareto_efficient is False
    assert report.certified_fair is False
