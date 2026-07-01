"""Benchmark harness: score allocation strategies over a distribution of disputes.

A *strategy* is any callable ``Dispute -> Allocation`` (a baseline, the solver, a
single Qwen agent, or the full Arbiter society). The harness runs a strategy over
many disputes, evaluates each result with the Fairness Engine, and aggregates the
outcomes into a single comparable ``BenchmarkResult``.
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from dataclasses import dataclass

from .domain import Allocation, Dispute
from .fairness import FairnessReport, evaluate_allocation

Strategy = Callable[[Dispute], Allocation]


@dataclass(frozen=True)
class BenchmarkResult:
    """Aggregated fairness outcomes for one strategy across many disputes."""

    strategy: str
    num_disputes: int
    pct_envy_free: float
    pct_proportional: float
    pct_pareto_efficient: float
    mean_max_envy: float
    mean_nash_welfare: float
    mean_egalitarian_welfare: float
    mean_utilitarian_welfare: float


def _fraction(flags: Sequence[bool]) -> float:
    return sum(1 for f in flags if f) / len(flags)


def _mean(values: Sequence[float]) -> float:
    return sum(values) / len(values)


def summarize(strategy: str, reports: Sequence[FairnessReport]) -> BenchmarkResult:
    """Aggregate per-dispute fairness reports into one benchmark result."""
    if not reports:
        raise ValueError("cannot summarize an empty set of reports")
    return BenchmarkResult(
        strategy=strategy,
        num_disputes=len(reports),
        pct_envy_free=_fraction([r.envy_free for r in reports]),
        pct_proportional=_fraction([r.proportional for r in reports]),
        pct_pareto_efficient=_fraction([r.pareto_efficient for r in reports]),
        mean_max_envy=_mean([r.max_envy for r in reports]),
        mean_nash_welfare=_mean([r.nash_welfare for r in reports]),
        mean_egalitarian_welfare=_mean([r.egalitarian_welfare for r in reports]),
        mean_utilitarian_welfare=_mean([r.utilitarian_welfare for r in reports]),
    )


def benchmark_strategy(
    strategy_name: str,
    strategy: Strategy,
    disputes: Sequence[Dispute],
) -> BenchmarkResult:
    """Run ``strategy`` over ``disputes`` and summarize the fairness outcomes."""
    reports = [evaluate_allocation(dispute, strategy(dispute)) for dispute in disputes]
    return summarize(strategy_name, reports)


def run_benchmark(
    strategies: dict[str, Strategy],
    disputes: Sequence[Dispute],
) -> list[BenchmarkResult]:
    """Benchmark several named strategies over the same set of disputes."""
    return [
        benchmark_strategy(name, strategy, disputes)
        for name, strategy in strategies.items()
    ]
