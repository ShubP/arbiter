"""JSON (de)serialization for domain types.

This is the shared wire format used by both the MCP fairness server and the HTTP
API, keeping the agent layer decoupled from the Python domain objects.
"""

from __future__ import annotations

from typing import Any

from .domain import Allocation, Dispute
from .fairness import FairnessReport


def dispute_from_dict(data: dict[str, Any]) -> Dispute:
    """Rebuild a Dispute from a plain JSON-style dict."""
    return Dispute(
        parties=tuple(data["parties"]),
        items=tuple(data["items"]),
        valuations={
            party: {item: float(v) for item, v in items.items()}
            for party, items in data["valuations"].items()
        },
        cash_pool=float(data.get("cash_pool", 0.0)),
    )


def allocation_from_dict(data: dict[str, Any]) -> Allocation:
    """Rebuild an Allocation from a plain JSON-style dict."""
    return Allocation(
        items=dict(data["items"]),
        cash={party: float(amount) for party, amount in data.get("cash", {}).items()},
    )


def dispute_to_dict(dispute: Dispute) -> dict[str, Any]:
    """Serialize a Dispute to a plain JSON-style dict."""
    return {
        "parties": list(dispute.parties),
        "items": list(dispute.items),
        "valuations": {
            party: dict(items) for party, items in dispute.valuations.items()
        },
        "cash_pool": dispute.cash_pool,
    }


def allocation_to_dict(allocation: Allocation) -> dict[str, Any]:
    """Serialize an Allocation to a plain JSON-style dict."""
    return {"items": dict(allocation.items), "cash": dict(allocation.cash)}


def report_to_dict(report: FairnessReport) -> dict[str, Any]:
    """Serialize a FairnessReport to a plain JSON-style dict."""
    return {
        "utilities": dict(report.utilities),
        "proportional": report.proportional,
        "envy_free": report.envy_free,
        "max_envy": report.max_envy,
        "pareto_efficient": report.pareto_efficient,
        "nash_welfare": report.nash_welfare,
        "utilitarian_welfare": report.utilitarian_welfare,
        "egalitarian_welfare": report.egalitarian_welfare,
        "certified_fair": report.certified_fair,
    }
