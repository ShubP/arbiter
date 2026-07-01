"""Dispute scenarios: presets plus construction from arbitrary user input.

A Scenario pairs a Dispute (the math) with display metadata (party names/roles,
human item labels, a description) so the negotiation can be narrated to people.
The same structure powers both the built-in presets and a user's custom dispute.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .domain import Dispute


@dataclass(frozen=True)
class PartyMeta:
    id: str
    name: str
    role: str
    side: str  # "a" | "b"


@dataclass(frozen=True)
class Scenario:
    dispute: Dispute
    description: str
    parties: tuple[PartyMeta, ...]
    item_labels: dict[str, str]
    id: str = ""
    title: str = ""


def make_scenario(
    *,
    id: str,
    title: str,
    description: str,
    parties: list[tuple[str, str, str, str]],  # (id, name, role, side)
    items: list[tuple[str, str]],  # (id, label)
    valuations: dict[str, dict[str, float]],
    cash_pool: float = 0.0,
) -> Scenario:
    """Construct a Scenario from plain tuples (used by presets and the builder)."""
    party_ids = tuple(p[0] for p in parties)
    item_ids = tuple(i[0] for i in items)
    return Scenario(
        dispute=Dispute(
            parties=party_ids,
            items=item_ids,
            valuations={p: dict(valuations[p]) for p in party_ids},
            cash_pool=cash_pool,
        ),
        description=description,
        parties=tuple(PartyMeta(*p) for p in parties),
        item_labels={i[0]: i[1] for i in items},
        id=id,
        title=title,
    )


# --- Preset library ----------------------------------------------------------

COFOUNDER_SCENARIO = make_scenario(
    id="cofounder",
    title="Cofounder equity & asset split",
    description=(
        "Ava and Ben are restructuring their startup. They must divide control, "
        "IP, contracts, the brand, and a $200k treasury — each privately values "
        "these very differently."
    ),
    parties=[
        ("ava", "Ava Chen", "CEO & co-founder", "a"),
        ("ben", "Ben Ortiz", "CTO & co-founder", "b"),
    ],
    items=[
        ("ip", "Core IP & patents"),
        ("ctrl", "CTO seat & technical control"),
        ("contracts", "Enterprise contracts"),
        ("brand", "Brand, domain & socials"),
    ],
    valuations={
        "ava": {"ip": 90.0, "ctrl": 20.0, "contracts": 70.0, "brand": 55.0},
        "ben": {"ip": 60.0, "ctrl": 100.0, "contracts": 40.0, "brand": 35.0},
    },
    cash_pool=200.0,
)

ESTATE_SCENARIO = make_scenario(
    id="estate",
    title="Dividing a family estate",
    description=(
        "Two siblings, Maya and Leo, must divide their late parent's estate — the "
        "family home, a vintage car, an art collection, and $120k in savings — "
        "without a feud."
    ),
    parties=[
        ("maya", "Maya", "Elder sibling", "a"),
        ("leo", "Leo", "Younger sibling", "b"),
    ],
    items=[
        ("home", "The family home"),
        ("car", "Vintage car"),
        ("art", "Art collection"),
    ],
    valuations={
        "maya": {"home": 95.0, "car": 30.0, "art": 75.0},
        "leo": {"home": 80.0, "car": 85.0, "art": 40.0},
    },
    cash_pool=120.0,
)

FREELANCE_SCENARIO = make_scenario(
    id="freelance",
    title="Freelancers splitting a studio",
    description=(
        "Two freelancers closing their joint studio divide the client book, the "
        "equipment, the studio lease, and the shared brand."
    ),
    parties=[
        ("nour", "Nour", "Designer", "a"),
        ("sam", "Sam", "Developer", "b"),
    ],
    items=[
        ("clients", "Client book"),
        ("gear", "Equipment & hardware"),
        ("lease", "Studio lease"),
        ("brand", "Studio brand & site"),
    ],
    valuations={
        "nour": {"clients": 80.0, "gear": 30.0, "lease": 45.0, "brand": 70.0},
        "sam": {"clients": 65.0, "gear": 90.0, "lease": 40.0, "brand": 35.0},
    },
    cash_pool=0.0,
)

BAND_SCENARIO = make_scenario(
    id="band",
    title="A band splits up (3 members)",
    description=(
        "Three bandmates are going separate ways and must divide the band name, "
        "the tour van, the recording gear, the back-catalog masters, and $90k in "
        "royalties — each cares about very different things."
    ),
    parties=[
        ("remy", "Remy", "Singer", "a"),
        ("sasha", "Sasha", "Drummer", "b"),
        ("theo", "Theo", "Producer", "c"),
    ],
    items=[
        ("name", "Band name & rights"),
        ("van", "Tour van"),
        ("gear", "Recording gear"),
        ("masters", "Back-catalog masters"),
    ],
    valuations={
        "remy": {"name": 90.0, "van": 20.0, "gear": 30.0, "masters": 60.0},
        "sasha": {"name": 40.0, "van": 80.0, "gear": 30.0, "masters": 50.0},
        "theo": {"name": 30.0, "van": 30.0, "gear": 95.0, "masters": 55.0},
    },
    cash_pool=90.0,
)

PRESETS: tuple[Scenario, ...] = (
    COFOUNDER_SCENARIO,
    ESTATE_SCENARIO,
    BAND_SCENARIO,
    FREELANCE_SCENARIO,
)


# --- Serialization to/from the wire payload ----------------------------------


def scenario_to_payload(scenario: Scenario) -> dict[str, Any]:
    """Serialize a Scenario to the JSON payload the frontend uses."""
    d = scenario.dispute
    return {
        "id": scenario.id,
        "title": scenario.title,
        "description": scenario.description,
        "parties": [
            {"id": m.id, "name": m.name, "role": m.role, "side": m.side}
            for m in scenario.parties
        ],
        "items": [{"id": i, "label": scenario.item_labels[i]} for i in d.items],
        "valuations": {p: dict(d.valuations[p]) for p in d.parties},
        "cashPool": d.cash_pool,
    }


class InvalidDispute(ValueError):
    """Raised when a user-supplied dispute payload is malformed."""


def scenario_from_payload(payload: dict[str, Any]) -> Scenario:
    """Build a Scenario from a user-supplied payload, validating as we go."""
    parties_raw = payload.get("parties") or []
    items_raw = payload.get("items") or []
    valuations_raw = payload.get("valuations") or {}

    if not 2 <= len(parties_raw) <= 6:
        raise InvalidDispute("A dispute needs between two and six parties.")
    if len(items_raw) < 1:
        raise InvalidDispute("Add at least one asset to divide.")

    sides = ["a", "b", "c", "d", "e", "f"]
    parties: list[tuple[str, str, str, str]] = []
    for idx, p in enumerate(parties_raw):
        pid = str(p.get("id") or f"party_{idx}")
        name = str(p.get("name") or f"Party {idx + 1}").strip()
        if not name:
            raise InvalidDispute("Every party needs a name.")
        parties.append((pid, name, str(p.get("role") or ""), sides[idx]))

    items: list[tuple[str, str]] = []
    for idx, it in enumerate(items_raw):
        iid = str(it.get("id") or f"item_{idx}")
        label = str(it.get("label") or "").strip()
        if not label:
            raise InvalidDispute("Every asset needs a label.")
        items.append((iid, label))

    valuations: dict[str, dict[str, float]] = {}
    for pid, _, _, _ in parties:
        row = valuations_raw.get(pid, {})
        valuations[pid] = {}
        for iid, _ in items:
            try:
                value = float(row[iid])
            except (KeyError, TypeError, ValueError) as exc:
                raise InvalidDispute(
                    "Each party must value every asset with a number."
                ) from exc
            if value < 0:
                raise InvalidDispute("Valuations cannot be negative.")
            valuations[pid][iid] = value

    try:
        cash_pool = float(payload.get("cashPool", 0.0) or 0.0)
    except (TypeError, ValueError) as exc:
        raise InvalidDispute("Cash pool must be a number.") from exc
    if cash_pool < 0:
        raise InvalidDispute("Cash pool cannot be negative.")

    return make_scenario(
        id=str(payload.get("id") or "custom"),
        title=str(payload.get("title") or "Custom dispute"),
        description=str(payload.get("description") or ""),
        parties=parties,
        items=items,
        valuations=valuations,
        cash_pool=cash_pool,
    )
