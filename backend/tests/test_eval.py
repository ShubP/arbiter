"""Tests for the benchmark aggregation harness."""

from arbiter.eval import BenchmarkResult, benchmark_strategy, summarize
from arbiter.fairness import FairnessReport
from arbiter.generator import generate_dispute
from arbiter.solver import solve_fair_division


def _report(*, envy_free, proportional, pareto, max_envy, nash, egal, util):
    return FairnessReport(
        utilities={},
        proportional=proportional,
        envy_free=envy_free,
        max_envy=max_envy,
        pareto_efficient=pareto,
        nash_welfare=nash,
        utilitarian_welfare=util,
        egalitarian_welfare=egal,
        certified_fair=envy_free and proportional and pareto,
    )


def test_summarize_computes_percentages_and_means():
    reports = [
        _report(
            envy_free=True,
            proportional=True,
            pareto=True,
            max_envy=0.0,
            nash=100.0,
            egal=10.0,
            util=20.0,
        ),
        _report(
            envy_free=False,
            proportional=True,
            pareto=False,
            max_envy=40.0,
            nash=0.0,
            egal=0.0,
            util=20.0,
        ),
    ]

    result = summarize("demo", reports)

    assert isinstance(result, BenchmarkResult)
    assert result.strategy == "demo"
    assert result.num_disputes == 2
    assert result.pct_envy_free == 0.5
    assert result.pct_proportional == 1.0
    assert result.pct_pareto_efficient == 0.5
    assert result.mean_max_envy == 20.0
    assert result.mean_nash_welfare == 50.0
    assert result.mean_egalitarian_welfare == 5.0
    assert result.mean_utilitarian_welfare == 20.0


def test_benchmark_strategy_runs_a_strategy_over_disputes():
    disputes = [generate_dispute(seed=s, num_items=5) for s in range(10)]

    result = benchmark_strategy("solver", solve_fair_division, disputes)

    # The provably-fair solver should be envy-free on every generated dispute.
    assert result.num_disputes == 10
    assert result.pct_envy_free == 1.0
    assert result.pct_pareto_efficient == 1.0
