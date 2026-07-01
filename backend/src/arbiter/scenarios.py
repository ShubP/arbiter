"""Presentation-ready dispute scenarios.

A Scenario pairs a Dispute (the math) with display metadata (party names/roles,
human item labels, a description) so the negotiation can be narrated to people.
"""

from __future__ import annotations

from dataclasses import dataclass

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


COFOUNDER_SCENARIO = Scenario(
    dispute=Dispute(
        parties=("ava", "ben"),
        items=("ip", "ctrl", "contracts", "brand"),
        valuations={
            "ava": {"ip": 90.0, "ctrl": 20.0, "contracts": 70.0, "brand": 55.0},
            "ben": {"ip": 60.0, "ctrl": 100.0, "contracts": 40.0, "brand": 35.0},
        },
        cash_pool=200.0,
    ),
    description=(
        "Ava and Ben are restructuring their startup. They must divide control, "
        "IP, contracts, the brand, and a $200k treasury — each privately values "
        "these very differently."
    ),
    parties=(
        PartyMeta("ava", "Ava Chen", "CEO & co-founder", "a"),
        PartyMeta("ben", "Ben Ortiz", "CTO & co-founder", "b"),
    ),
    item_labels={
        "ip": "Core IP & patents",
        "ctrl": "CTO seat & technical control",
        "contracts": "Enterprise contracts",
        "brand": "Brand, domain & socials",
    },
)
