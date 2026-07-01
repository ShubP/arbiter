"""Tests for JSON (de)serialization of domain types.

These conversions are the wire format for the MCP fairness server and the HTTP
API, so they must round-trip losslessly.
"""

from arbiter.domain import Allocation, Dispute
from arbiter.fairness import evaluate_allocation
from arbiter.serialization import (
    allocation_from_dict,
    dispute_from_dict,
    report_to_dict,
)


def test_dispute_from_dict_rebuilds_the_dispute():
    payload = {
        "parties": ["alice", "bob"],
        "items": ["car", "laptop"],
        "valuations": {
            "alice": {"car": 100.0, "laptop": 40.0},
            "bob": {"car": 80.0, "laptop": 60.0},
        },
        "cash_pool": 25.0,
    }

    dispute = dispute_from_dict(payload)

    assert dispute == Dispute(
        parties=("alice", "bob"),
        items=("car", "laptop"),
        valuations={
            "alice": {"car": 100.0, "laptop": 40.0},
            "bob": {"car": 80.0, "laptop": 60.0},
        },
        cash_pool=25.0,
    )


def test_dispute_from_dict_defaults_cash_pool_to_zero():
    dispute = dispute_from_dict(
        {
            "parties": ["a", "b"],
            "items": ["x"],
            "valuations": {"a": {"x": 1.0}, "b": {"x": 1.0}},
        }
    )
    assert dispute.cash_pool == 0.0


def test_allocation_from_dict_rebuilds_the_allocation():
    payload = {
        "items": {"car": "alice", "laptop": "bob"},
        "cash": {"alice": -10.0, "bob": 10.0},
    }
    assert allocation_from_dict(payload) == Allocation(
        items={"car": "alice", "laptop": "bob"},
        cash={"alice": -10.0, "bob": 10.0},
    )


def test_report_to_dict_is_json_friendly_and_complete():
    dispute = Dispute(
        parties=("alice", "bob"),
        items=("x", "y"),
        valuations={
            "alice": {"x": 70.0, "y": 30.0},
            "bob": {"x": 30.0, "y": 70.0},
        },
    )
    allocation = Allocation(
        items={"x": "alice", "y": "bob"}, cash={"alice": 0.0, "bob": 0.0}
    )

    data = report_to_dict(evaluate_allocation(dispute, allocation))

    assert data["certified_fair"] is True
    assert data["envy_free"] is True
    assert data["utilities"] == {"alice": 70.0, "bob": 70.0}
    # Must be plain JSON types only.
    assert isinstance(data["nash_welfare"], float)
