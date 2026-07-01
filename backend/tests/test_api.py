"""Tests for the FastAPI backend."""

import json

from fastapi.testclient import TestClient

from arbiter.api import app

client = TestClient(app)


def test_health_endpoint_reports_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def _sse_events(text: str) -> list[dict]:
    return [
        json.loads(line[len("data: ") :])
        for line in text.splitlines()
        if line.startswith("data: ")
    ]


def test_negotiate_streams_sse_events_ending_in_a_certified_settlement():
    response = client.get("/negotiate?delay=0")
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]

    events = _sse_events(response.text)
    assert events[0]["type"] == "session_started"
    assert events[-1]["type"] == "settlement"
    assert events[-1]["report"]["certifiedFair"] is True


def test_presets_endpoint_lists_scenarios():
    response = client.get("/presets")
    assert response.status_code == 200
    presets = response.json()
    assert len(presets) >= 2
    first = presets[0]
    assert {"id", "title", "description", "parties", "items", "valuations"} <= set(
        first
    )


def test_negotiate_post_runs_a_custom_dispute():
    payload = {
        "dispute": {
            "title": "Split a car and a laptop",
            "parties": [
                {"id": "a", "name": "Alex"},
                {"id": "b", "name": "Bailey"},
            ],
            "items": [
                {"id": "car", "label": "Car"},
                {"id": "laptop", "label": "Laptop"},
            ],
            "valuations": {
                "a": {"car": 90.0, "laptop": 30.0},
                "b": {"car": 40.0, "laptop": 80.0},
            },
            "cashPool": 0.0,
        },
        "delay": 0,
    }
    response = client.post("/negotiate", json=payload)
    assert response.status_code == 200
    events = _sse_events(response.text)
    assert events[0]["type"] == "session_started"
    assert {p["name"] for p in events[0]["parties"]} == {"Alex", "Bailey"}
    assert events[-1]["type"] == "settlement"
    assert events[-1]["report"]["certifiedFair"] is True


def test_negotiate_post_rejects_an_invalid_dispute():
    payload = {"dispute": {"parties": [{"id": "a", "name": "Solo"}], "items": []}}
    response = client.post("/negotiate", json=payload)
    assert response.status_code == 422
