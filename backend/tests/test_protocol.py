"""Tests for the emergent, engine-refereed negotiation protocol."""

from arbiter.narration import LLMNarrator
from arbiter.protocol import run_negotiation
from arbiter.scenarios import COFOUNDER_SCENARIO, make_scenario


def _types(events):
    return [e["type"] for e in events]


def test_two_party_negotiation_settles_certified_fair():
    events = list(run_negotiation(COFOUNDER_SCENARIO))
    assert events[0]["type"] == "session_started"
    assert events[-1]["type"] == "settlement"
    assert events[-1]["report"]["certifiedFair"] is True


def test_negotiation_contains_real_moves_openings_demands_concessions():
    events = list(run_negotiation(COFOUNDER_SCENARIO))
    openings = [e for e in events if e.get("kind") == "opening"]
    demands = [e for e in events if e.get("kind") == "counter"]
    concessions = [e for e in events if e["type"] == "concession"]
    assert len(openings) == 2  # one opening claim per party
    assert demands  # advocates actually demand assets
    assert concessions  # and assets change hands


def test_settlement_is_pareto_efficient_each_asset_to_its_highest_valuer():
    events = list(run_negotiation(COFOUNDER_SCENARIO))
    settlement = events[-1]
    dispute = COFOUNDER_SCENARIO.dispute
    for item, owner in settlement["allocation"]["items"].items():
        best = max(dispute.parties, key=lambda p: dispute.valuations[p][item])
        assert dispute.valuations[owner][item] == dispute.valuations[best][item]


def test_mediator_denies_a_demand_for_an_asset_valued_more_by_its_holder():
    # party_b's most-wanted asset (gem) is valued even more by party_a, who holds
    # everything at the start — so the mediator must deny that grab.
    scenario = make_scenario(
        id="deny",
        title="deny",
        description="",
        parties=[
            ("a", "Alex", "", "a"),
            ("b", "Bailey", "", "b"),
        ],
        items=[("gem", "Gem"), ("mug", "Mug"), ("pen", "Pen")],
        valuations={
            "a": {"gem": 100.0, "mug": 1.0, "pen": 1.0},
            "b": {"gem": 90.0, "mug": 50.0, "pen": 50.0},
        },
    )
    events = list(run_negotiation(scenario))
    denials = [
        e for e in events if e["type"] == "mediator" and "stays put" in e["text"]
    ]
    assert denials  # the mediator adjudicated a demand down
    assert events[-1]["type"] == "settlement"


def test_three_party_negotiation_terminates_and_is_efficient():
    scenario = make_scenario(
        id="trio",
        title="trio",
        description="",
        parties=[
            ("a", "Ada", "", "a"),
            ("b", "Ben", "", "b"),
            ("c", "Cy", "", "a"),
        ],
        items=[("x", "X"), ("y", "Y"), ("z", "Z")],
        valuations={
            "a": {"x": 90.0, "y": 10.0, "z": 20.0},
            "b": {"x": 20.0, "y": 80.0, "z": 30.0},
            "c": {"x": 15.0, "y": 25.0, "z": 95.0},
        },
        cash_pool=60.0,
    )
    events = list(run_negotiation(scenario))
    assert events[-1]["type"] == "settlement"
    items = events[-1]["allocation"]["items"]
    # Each asset ends with its highest valuer (efficient).
    assert items == {"x": "a", "y": "b", "z": "c"}
    assert events[-1]["report"]["paretoEfficient"] is True


def test_constraint_keeps_an_asset_with_its_required_party():
    # Alex values the house more, but Bailey has a red-line to keep it.
    scenario = make_scenario(
        id="con",
        title="con",
        description="",
        parties=[("a", "Alex", "", "a"), ("b", "Bailey", "", "b")],
        items=[("house", "House"), ("car", "Car")],
        valuations={
            "a": {"house": 100.0, "car": 90.0},
            "b": {"house": 40.0, "car": 30.0},
        },
        constraints={"house": "b"},
    )
    settlement = list(run_negotiation(scenario))[-1]
    assert settlement["allocation"]["items"]["house"] == "b"  # red-line honored
    assert settlement["allocation"]["items"]["car"] == "a"  # rest stays efficient


def test_llm_narrator_voices_moves_without_changing_fairness():
    def fake_generate(system: str, user: str, model: str) -> str:
        return "MOCK"

    events = list(run_negotiation(COFOUNDER_SCENARIO, LLMNarrator(fake_generate)))
    assert events[-1]["report"]["certifiedFair"] is True
    proposals = [e for e in events if e["type"] == "proposal"]
    assert all(p["rationale"] == "MOCK" for p in proposals)
