"""Run the fairness benchmark and render the headline comparison.

Usage:
    python scripts/benchmark.py [--num-disputes N] [--num-items K] [--seed S]

Benchmarks each registered allocation strategy over a distribution of synthetic
disputes and prints a comparison table. If matplotlib is available it also saves a
grouped bar chart to ``eval/results/fairness_benchmark.png``.

Strategy registry note: the deterministic strategies (naive baseline, provably-fair
solver) always run. The LLM strategies (single Qwen agent, full Arbiter society)
register automatically once the agent layer and an API key are available.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from arbiter.baselines import naive_split
from arbiter.eval import BenchmarkResult, Strategy, run_benchmark
from arbiter.generator import generate_dispute
from arbiter.solver import solve_fair_division

RESULTS_DIR = Path(__file__).resolve().parents[1].parent / "eval" / "results"


def build_strategies() -> dict[str, Strategy]:
    """Assemble the strategies to benchmark (LLM ones added when available)."""
    strategies: dict[str, Strategy] = {
        "Naive split (baseline)": naive_split,
        "Arbiter solver (fair target)": solve_fair_division,
    }
    return strategies


def print_table(results: list[BenchmarkResult]) -> None:
    headers = ["Strategy", "Envy-free", "Proportional", "Pareto", "Nash", "MaxEnvy"]
    widths = [30, 10, 13, 8, 10, 9]
    line = "  ".join(h.ljust(w) for h, w in zip(headers, widths, strict=True))
    print(line)
    print("-" * len(line))
    for r in results:
        row = [
            r.strategy.ljust(widths[0]),
            f"{r.pct_envy_free:.0%}".ljust(widths[1]),
            f"{r.pct_proportional:.0%}".ljust(widths[2]),
            f"{r.pct_pareto_efficient:.0%}".ljust(widths[3]),
            f"{r.mean_nash_welfare:,.0f}".ljust(widths[4]),
            f"{r.mean_max_envy:,.1f}".ljust(widths[5]),
        ]
        print("  ".join(row))


def save_chart(results: list[BenchmarkResult], path: Path) -> bool:
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        return False

    metrics = ["Envy-free", "Proportional", "Pareto-efficient"]
    keys = ["pct_envy_free", "pct_proportional", "pct_pareto_efficient"]
    x = range(len(metrics))
    width = 0.8 / max(len(results), 1)

    fig, ax = plt.subplots(figsize=(8, 4.5))
    for i, r in enumerate(results):
        values = [getattr(r, k) * 100 for k in keys]
        offsets = [xi + i * width for xi in x]
        ax.bar(offsets, values, width, label=r.strategy)

    ax.set_ylabel("% of disputes satisfying criterion")
    ax.set_title(f"Fairness by strategy ({results[0].num_disputes} disputes)")
    ax.set_xticks([xi + width * (len(results) - 1) / 2 for xi in x])
    ax.set_xticklabels(metrics)
    ax.set_ylim(0, 105)
    ax.legend()
    fig.tight_layout()
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=130)
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Arbiter fairness benchmark")
    parser.add_argument("--num-disputes", type=int, default=100)
    parser.add_argument("--num-items", type=int, default=6)
    parser.add_argument("--cash-pool", type=float, default=50.0)
    parser.add_argument("--seed", type=int, default=0)
    args = parser.parse_args()

    disputes = [
        generate_dispute(
            seed=args.seed + i,
            num_items=args.num_items,
            cash_pool=args.cash_pool,
        )
        for i in range(args.num_disputes)
    ]

    results = run_benchmark(build_strategies(), disputes)
    print(f"\nBenchmark over {args.num_disputes} disputes "
          f"({args.num_items} items each)\n")
    print_table(results)

    chart_path = RESULTS_DIR / "fairness_benchmark.png"
    if save_chart(results, chart_path):
        print(f"\nChart saved to {chart_path}")
    else:
        print("\n(matplotlib not installed — skipped chart)")


if __name__ == "__main__":
    main()
