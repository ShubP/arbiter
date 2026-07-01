"""FastAPI backend for Arbiter.

Exposes the negotiation as a live, streamable service. The event source behind
``/negotiate`` is pluggable: today it is the deterministic, engine-driven director
(no LLM required); the Qwen agent society slots in behind the same event contract.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
