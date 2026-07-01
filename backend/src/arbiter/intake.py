"""Natural-language intake: turn a plain-English dispute into a structured payload.

An intake agent (Qwen) reads a free-text description and extracts the parties, the
assets, each party's valuations, and any cash pool. The result is the same payload
the builder produces, so it flows straight into the negotiation. The LLM call is
injected as a ``generate`` function so the parsing logic is testable without a key.
"""

from __future__ import annotations

import json
from typing import Any

from .narration import GenerateFn

_SYSTEM = (
    "You convert a description of an asset-division dispute into JSON. "
    "Output ONLY valid JSON, no markdown, with exactly this shape: "
    '{"parties": ["Name1", "Name2"], "items": ["Asset A", "Asset B"], '
    '"valuations": {"Name1": {"Asset A": 70, "Asset B": 30}, '
    '"Name2": {"Asset A": 40, "Asset B": 60}}, "cashPool": 0}. '
    "Include 2-6 parties and at least one asset. Each valuation is 0-100 = how "
    "much that party values that asset; infer sensible numbers from the text. "
    "cashPool is any shared money to split (0 if none)."
)


def _extract_json(text: str) -> dict[str, Any]:
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("No JSON object found in the model output.")
    return json.loads(text[start : end + 1])


def structure_dispute(text: str, generate: GenerateFn) -> dict[str, Any]:
    """Parse a free-text dispute into a builder-shaped payload.

    Raises ValueError if the description can't be turned into a valid dispute.
    """
    raw = generate(_SYSTEM, text.strip(), "qwen-plus")
    try:
        data = _extract_json(raw)
    except (ValueError, json.JSONDecodeError) as exc:
        raise ValueError("Couldn't understand that description.") from exc

    names = [str(p) for p in data.get("parties", [])]
    labels = [str(i) for i in data.get("items", [])]
    if len(names) < 2 or len(labels) < 1:
        raise ValueError("Need at least two parties and one asset.")

    valuations_by_name = data.get("valuations", {})
    parties = [{"id": f"p{i}", "name": name} for i, name in enumerate(names)]
    items = [{"id": f"item_{j}", "label": label} for j, label in enumerate(labels)]
    valuations = {
        f"p{i}": {
            f"item_{j}": float(valuations_by_name.get(name, {}).get(label, 50))
            for j, label in enumerate(labels)
        }
        for i, name in enumerate(names)
    }

    try:
        cash_pool = float(data.get("cashPool", 0) or 0)
    except (TypeError, ValueError):
        cash_pool = 0.0

    return {
        "title": "Described dispute",
        "parties": parties,
        "items": items,
        "valuations": valuations,
        "cashPool": cash_pool,
    }
