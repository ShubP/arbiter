"""Tests for the fair-division solver.

The solver computes the objective "fair target" allocation that the mediator uses
to seed and steer negotiation. For two parties with quasi-linear utilities and
transferable cash it is provably envy-free, proportional, and Pareto-efficient:
assign each item to its highest valuer (efficiency), then use a cash side-payment
to equalize utilities (which, given the efficient assignment, guarantees no envy).
"""

from arbiter.domain import Dispute
from arbiter.fairness import evaluate_allocation
from arbiter.generator import generate_dispute
from arbiter.solver import solve_fair_division


def _complementary_dispute() -> Dispute:
    return Dispute(
        parties=("alice", "bob"),
        items=("x", "y"),
        valuations={
            "alice": {"x": 70.0, "y": 30.0},
            "bob": {"x": 30.0, "y": 70.0},
        },
        cash_pool=0.0,
    )


def test_solver_gives_each_item_to_its_highest_valuer():
    allocation = solve_fair_division(_complementary_dispute())
    assert allocation.items == {"x": "alice", "y": "bob"}


def test_solver_uses_cash_to_equalize_lopsided_valuations():
    # Both want the car; Alice values it more, so she keeps it and pays Bob.
    dispute = Dispute(
        parties=("alice", "bob"),
        items=("car",),
        valuations={"alice": {"car": 100.0}, "bob": {"car": 60.0}},
        cash_pool=0.0,
    )

    allocation = solve_fair_division(dispute)

    assert allocation.items == {"car": "alice"}
    # Equalize to (100 + 0)/2 = 50: Alice pays 50, Bob receives 50.
    assert allocation.cash["alice"] == -50.0
    assert allocation.cash["bob"] == 50.0


def test_solver_output_is_certified_fair():
    report = evaluate_allocation(
        _complementary_dispute(), solve_fair_division(_complementary_dispute())
    )
    assert report.certified_fair is True


def test_solver_net_cash_sums_to_the_cash_pool():
    dispute = Dispute(
        parties=("alice", "bob"),
        items=("house", "car"),
        valuations={
            "alice": {"house": 300.0, "car": 20.0},
            "bob": {"house": 250.0, "car": 30.0},
        },
        cash_pool=100.0,
    )

    allocation = solve_fair_division(dispute)

    assert sum(allocation.cash.values()) == 100.0


def test_solver_honors_a_constraint_even_against_efficiency():
    # Both want the car; Alice values it more, but Bob has a red-line to keep it.
    dispute = Dispute(
        parties=("alice", "bob"),
        items=("car",),
        valuations={"alice": {"car": 100.0}, "bob": {"car": 60.0}},
        cash_pool=0.0,
    )

    allocation = solve_fair_division(dispute, {"car": "bob"})

    assert allocation.items["car"] == "bob"
    # Utilities still equalize: target (60+0)/2 = 30; Bob pays 30, Alice receives 30.
    assert allocation.cash["bob"] == -30.0
    assert allocation.cash["alice"] == 30.0


def test_solver_is_certified_fair_across_many_random_disputes():
    # The provable guarantee, exercised over a whole distribution of instances.
    for seed in range(200):
        dispute = generate_dispute(
            seed=seed, num_items=6, max_value=100.0, cash_pool=50.0
        )
        report = evaluate_allocation(dispute, solve_fair_division(dispute))
        assert report.certified_fair, f"seed {seed} was not certified fair"
