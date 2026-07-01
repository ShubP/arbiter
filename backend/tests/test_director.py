"""Tests for the deterministic, engine-driven negotiation director.

The director produces the same event contract the frontend consumes (camelCase),
with real fairness reports computed by the engine at every step. It is the
non-LLM event source for the SSE endpoint; the Qwen society will later emit the
same events with richer natural-language rationales.
"""

from arbiter.director import run_negotiation
from arbiter.scenarios import COFOUNDER_SCENARIO


def test_negotiation_opens_with_a_session_and_ends_in_settlement():
    events = list(run_negotiation(COFOUNDER_SCENARIO))
    assert events[0]["type"] == "session_started"
    assert events[-1]["type"] == "settlement"


def test_settlement_is_certified_fair_with_equal_outcomes():
    events = list(run_negotiation(COFOUNDER_SCENARIO))
    settlement = events[-1]
    report = settlement["report"]
    assert report["certifiedFair"] is True
    utilities = list(report["utilities"].values())
    assert utilities[0] == utilities[1]


def test_negotiation_includes_proposals_mediation_and_concessions():
    types = [e["type"] for e in run_negotiation(COFOUNDER_SCENARIO)]
    assert "proposal" in types
    assert "mediator" in types
    assert "concession" in types


def test_every_report_uses_the_frontend_camelcase_contract():
    for event in run_negotiation(COFOUNDER_SCENARIO):
        report = event.get("report")
        if report is not None:
            assert {
                "utilities",
                "envyFree",
                "maxEnvy",
                "paretoEfficient",
                "nashWelfare",
                "certifiedFair",
            } <= set(report)


def test_session_started_carries_display_metadata():
    session = next(iter(run_negotiation(COFOUNDER_SCENARIO)))
    assert session["cashPool"] == 200
    assert {p["id"] for p in session["parties"]} == {"ava", "ben"}
    assert all("label" in item for item in session["items"])
