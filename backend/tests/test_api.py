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
