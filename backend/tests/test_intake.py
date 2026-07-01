"""Tests for natural-language intake (parsing logic, mock LLM)."""

import pytest

from arbiter.intake import structure_dispute
from arbiter.scenarios import scenario_from_payload

_JSON = (
    '{"parties":["Ada","Bo"],"items":["Car","Boat"],'
    '"valuations":{"Ada":{"Car":80,"Boat":20},"Bo":{"Car":30,"Boat":90}},'
    '"cashPool":10}'
)


def test_structure_dispute_builds_a_runnable_payload():
    payload = structure_dispute(
        "Ada and Bo split a car and a boat", lambda s, u, m: _JSON
    )
    assert [p["name"] for p in payload["parties"]] == ["Ada", "Bo"]
    assert [i["label"] for i in payload["items"]] == ["Car", "Boat"]
    assert payload["valuations"]["p0"]["item_0"] == 80.0
    assert payload["valuations"]["p1"]["item_1"] == 90.0
    assert payload["cashPool"] == 10.0
    # It must be a valid, runnable dispute.
    scenario_from_payload(payload)


def test_structure_dispute_tolerates_code_fences():
    fenced = f"```json\n{_JSON}\n```"
    payload = structure_dispute("...", lambda s, u, m: fenced)
    assert len(payload["parties"]) == 2


def test_structure_dispute_defaults_missing_valuations_to_50():
    partial = '{"parties":["A","B"],"items":["X"],"valuations":{"A":{"X":70}}}'
    payload = structure_dispute("...", lambda s, u, m: partial)
    assert payload["valuations"]["p1"]["item_0"] == 50.0  # B's missing value


def test_structure_dispute_raises_on_non_json():
    with pytest.raises(ValueError):
        structure_dispute("...", lambda s, u, m: "sorry, I can't help")


def test_structure_dispute_raises_without_enough_parties():
    solo = '{"parties":["Only"],"items":["X"],"valuations":{"Only":{"X":50}}}'
    with pytest.raises(ValueError):
        structure_dispute("...", lambda s, u, m: solo)
