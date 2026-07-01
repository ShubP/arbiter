"""FastAPI backend for Arbiter.

Exposes the negotiation as a live, streamable service. The event source behind
``/negotiate`` is pluggable: today it is the deterministic, engine-driven director
(no LLM required); the Qwen agent society slots in behind the same event contract.
"""

from __future__ import annotations

import asyncio
import json
import os
from collections.abc import AsyncIterator
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .director import run_negotiation
from .llm import get_client, make_generate
from .narration import LLMNarrator, Narrator, TemplateNarrator
from .scenarios import (
    COFOUNDER_SCENARIO,
    PRESETS,
    InvalidDispute,
    Scenario,
    scenario_from_payload,
    scenario_to_payload,
)

# Load DASHSCOPE_API_KEY (and friends) from a local .env when present.
load_dotenv()

app = FastAPI(
    title="Arbiter API",
    description="AI advocates negotiate provably fair settlements.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok"}


@app.get("/presets")
def presets() -> list[dict[str, Any]]:
    """The built-in dispute scenarios, as loadable payloads."""
    return [scenario_to_payload(p) for p in PRESETS]


def _live_qwen_available() -> bool:
    return bool(os.environ.get("DASHSCOPE_API_KEY"))


@app.get("/capabilities")
def capabilities() -> dict[str, bool]:
    """Tell the client which optional features are available on this deployment."""
    return {"liveQwen": _live_qwen_available()}


def _narrator(live: bool) -> Narrator:
    """Pick the narrator: Qwen advocates when requested and a key is configured."""
    if live and _live_qwen_available():
        try:
            return LLMNarrator(make_generate(get_client()))
        except Exception:
            return TemplateNarrator()
    return TemplateNarrator()


def _stream(
    scenario: Scenario, delay: float, narrator: Narrator
) -> StreamingResponse:
    async def event_stream() -> AsyncIterator[str]:
        for event in run_negotiation(scenario, narrator):
            yield f"data: {json.dumps(event)}\n\n"
            if delay:
                await asyncio.sleep(delay)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/negotiate")
async def negotiate_default(delay: float = 1.4) -> StreamingResponse:
    """Stream the flagship (cofounder) negotiation as Server-Sent Events."""
    return _stream(COFOUNDER_SCENARIO, delay, TemplateNarrator())


class NegotiateRequest(BaseModel):
    dispute: dict[str, Any] | None = None
    delay: float = 1.4
    live: bool = False


@app.post("/negotiate")
async def negotiate_custom(request: NegotiateRequest) -> StreamingResponse:
    """Stream a negotiation for a custom dispute (or the default if none given).

    The ``dispute`` payload matches the preset shape: parties, items, per-party
    valuations, and an optional cash pool. Set ``live`` to voice the advocates
    with Qwen (when a key is configured). Invalid disputes return 422.
    """
    if request.dispute is None:
        scenario = COFOUNDER_SCENARIO
    else:
        try:
            scenario = scenario_from_payload(request.dispute)
        except InvalidDispute as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
    return _stream(scenario, request.delay, _narrator(request.live))
