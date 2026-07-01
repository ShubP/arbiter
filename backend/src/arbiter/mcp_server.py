"""Fairness Engine exposed as a Model Context Protocol (MCP) server.

This publishes the deterministic fair-division math as MCP tools so that any
MCP-capable host — the Arbiter advocate/mediator agents, Claude, Qwen, or an IDE —
can invoke ``evaluate``, ``check_envy_free``, ``suggest_fair_allocation``, and
``proportional_shares`` over the open protocol instead of hard-wired calls.

Run as a stdio MCP server:
    python -m arbiter.mcp_server
"""

from __future__ import annotations

from typing import Any

from mcp.server.fastmcp import FastMCP

from . import fairness
from .serialization import (
    allocation_from_dict,
    allocation_to_dict,
    dispute_from_dict,
    report_to_dict,
)
from .solver import solve_fair_division


def evaluate(dispute: dict[str, Any], allocation: dict[str, Any]) -> dict[str, Any]:
    """Score an allocation on every fairness criterion and issue a certificate.

    Args:
        dispute: {parties, items, valuations, cash_pool}.
        allocation: {items: {item: party}, cash: {party: net_cash}}.

    Returns a full fairness report including ``certified_fair``.
    """
    d = dispute_from_dict(dispute)
    a = allocation_from_dict(allocation)
    return report_to_dict(fairness.evaluate_allocation(d, a))


def check_envy_free(
    dispute: dict[str, Any], allocation: dict[str, Any]
) -> dict[str, Any]:
    """Check whether an allocation is envy-free and quantify the worst envy."""
    d = dispute_from_dict(dispute)
    a = allocation_from_dict(allocation)
    return {
        "envy_free": fairness.is_envy_free(d, a),
        "max_envy": fairness.max_envy(d, a),
    }


def suggest_fair_allocation(dispute: dict[str, Any]) -> dict[str, Any]:
    """Propose a provably fair target allocation for the dispute.

    Returns the suggested allocation and its fairness report. Agents use this as a
    negotiation anchor; it is envy-free and Pareto-efficient for two parties.
    """
    d = dispute_from_dict(dispute)
    allocation = solve_fair_division(d)
    report = fairness.evaluate_allocation(d, allocation)
    return {
        "allocation": allocation_to_dict(allocation),
        "report": report_to_dict(report),
    }


def proportional_shares(dispute: dict[str, Any]) -> dict[str, float]:
    """Return each party's proportional (fair 1/n) share of the pot."""
    d = dispute_from_dict(dispute)
    return {p: fairness.proportional_share(d, p) for p in d.parties}


def build_server() -> FastMCP:
    """Construct the FastMCP server with all fairness tools registered."""
    server = FastMCP("arbiter-fairness")
    server.tool()(evaluate)
    server.tool()(check_envy_free)
    server.tool()(suggest_fair_allocation)
    server.tool()(proportional_shares)
    return server


def main() -> None:
    build_server().run()


if __name__ == "__main__":
    main()
