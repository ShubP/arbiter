"""Tests for the Fairness Engine MCP server.

The server exposes the deterministic fairness math as MCP tools so that any
MCP-capable host (the Arbiter agents, Claude, Qwen, an IDE) can call it over the
open protocol. We test the tool functions directly, plus that the server registers
the expected toolset.
"""

import asyncio

from arbiter.mcp_server import (
    build_server,
    check_envy_free,
    evaluate,
    proportional_shares,
    suggest_fair_allocation,
)

_FAIR_DISPUTE = {
    "parties": ["alice", "bob"],
    "items": ["x", "y"],
    "valuations": {
        "alice": {"x": 70.0, "y": 30.0},
        "bob": {"x": 30.0, "y": 70.0},
    },
    "cash_pool": 0.0,
}
_FAIR_ALLOCATION = {
    "items": {"x": "alice", "y": "bob"},
    "cash": {"alice": 0.0, "bob": 0.0},
}


def test_evaluate_tool_certifies_a_fair_allocation():
    result = evaluate(_FAIR_DISPUTE, _FAIR_ALLOCATION)
    assert result["certified_fair"] is True
    assert result["utilities"] == {"alice": 70.0, "bob": 70.0}


def test_check_envy_free_tool_reports_zero_envy():
    result = check_envy_free(_FAIR_DISPUTE, _FAIR_ALLOCATION)
    assert result["envy_free"] is True
    assert result["max_envy"] == 0.0


def test_suggest_fair_allocation_tool_returns_a_certified_deal():
    out = suggest_fair_allocation(_FAIR_DISPUTE)
    assert out["report"]["certified_fair"] is True
    assert set(out["allocation"]["items"]) == {"x", "y"}


def test_proportional_shares_tool_reports_each_partys_fair_share():
    shares = proportional_shares(_FAIR_DISPUTE)
    assert shares == {"alice": 50.0, "bob": 50.0}


def test_server_registers_the_expected_tools():
    server = build_server()
    tools = asyncio.run(server.list_tools())
    names = {t.name for t in tools}
    assert {
        "evaluate",
        "check_envy_free",
        "suggest_fair_allocation",
        "proportional_shares",
    } <= names
