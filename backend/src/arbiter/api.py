"""FastAPI backend for Arbiter.

Exposes the negotiation as a live, streamable service. The event source behind
``/negotiate`` is pluggable: today it is the deterministic, engine-driven director
(no LLM required); the Qwen agent society slots in behind the same event contract.
"""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .director import run_negotiation
from .scenarios import COFOUNDER_SCENARIO

app = FastAPI(
    title="Arbiter API",
    description="AI advocates negotiate provably fair settlements.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok"}


@app.get("/negotiate")
async def negotiate(delay: float = 1.4) -> StreamingResponse:
    """Stream the flagship negotiation as Server-Sent Events.

    Each event is one line of ``data: <json>`` matching the frontend contract.
    ``delay`` (seconds between events) paces the stream for the live UI; tests
    pass ``delay=0``.
    """

    async def event_stream() -> AsyncIterator[str]:
        for event in run_negotiation(COFOUNDER_SCENARIO):
            yield f"data: {json.dumps(event)}\n\n"
            if delay:
                await asyncio.sleep(delay)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
