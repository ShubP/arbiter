"""Tests for preset scenarios and building a scenario from user input."""

import pytest

from arbiter.director import run_negotiation
from arbiter.scenarios import (
    PRESETS,
    InvalidDispute,
    scenario_from_payload,
    scenario_to_payload,
)


def _valid_payload() -> dict:
    return {
        "title": "Two friends split a boat and a cabin",
        "parties": [
            {"id": "a", "name": "Alex", "role": "Co-owner"},
            {"id": "b", "name": "Bailey", "role": "Co-owner"},
        ],
        "items": [
            {"id": "boat", "label": "The boat"},
            {"id": "cabin", "label": "The cabin"},
        ],
        "valuations": {
            "a": {"boat": 40.0, "cabin": 80.0},
            "b": {"boat": 70.0, "cabin": 50.0},
        },
        "cashPool": 0.0,
    }


def test_presets_round_trip_through_payload():
    for preset in PRESETS:
        payload = scenario_to_payload(preset)
        rebuilt = scenario_from_payload(payload)
        assert rebuilt.dispute == preset.dispute


def test_scenario_from_payload_builds_a_runnable_dispute():
    scenario = scenario_from_payload(_valid_payload())
    events = list(run_negotiation(scenario))
    assert events[-1]["type"] == "settlement"
    assert events[-1]["report"]["certifiedFair"] is True


def test_scenario_from_payload_requires_two_parties():
    payload = _valid_payload()
    payload["parties"] = payload["parties"][:1]
    with pytest.raises(InvalidDispute):
        scenario_from_payload(payload)


def test_scenario_from_payload_requires_at_least_one_item():
    payload = _valid_payload()
    payload["items"] = []
    with pytest.raises(InvalidDispute):
        scenario_from_payload(payload)


def test_scenario_from_payload_rejects_missing_valuations():
    payload = _valid_payload()
    del payload["valuations"]["a"]["cabin"]
    with pytest.raises(InvalidDispute):
        scenario_from_payload(payload)


def test_scenario_from_payload_rejects_negative_valuations():
    payload = _valid_payload()
    payload["valuations"]["a"]["boat"] = -5.0
    with pytest.raises(InvalidDispute):
        scenario_from_payload(payload)


def test_scenario_from_payload_assigns_sides_by_order():
    scenario = scenario_from_payload(_valid_payload())
    assert scenario.parties[0].side == "a"
    assert scenario.parties[1].side == "b"
