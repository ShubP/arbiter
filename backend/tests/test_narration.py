"""Tests for narrators — including the Qwen path with a mock generator.

The LLM path is exercised without any network by injecting a fake generate
function. The point: swapping in the LLM narrator changes the *wording* but never
the fairness of the outcome (the settlement stays certified).
"""

from arbiter.director import run_negotiation
from arbiter.narration import LLMNarrator, TemplateNarrator
from arbiter.scenarios import COFOUNDER_SCENARIO


def test_template_narrator_produces_the_default_settlement():
    events = list(run_negotiation(COFOUNDER_SCENARIO, TemplateNarrator()))
    assert events[-1]["type"] == "settlement"
    assert events[-1]["report"]["certifiedFair"] is True


def test_llm_narrator_uses_generated_text_but_keeps_the_outcome_fair():
    calls: list[str] = []

    def fake_generate(system: str, user: str, model: str) -> str:
        calls.append(model)
        return "MOCK-ADVOCACY"

    events = list(run_negotiation(COFOUNDER_SCENARIO, LLMNarrator(fake_generate)))

    # The generated text shows up in the advocate proposals...
    proposals = [e for e in events if e["type"] == "proposal"]
    assert all(p["rationale"] == "MOCK-ADVOCACY" for p in proposals)
    # ...the generator was actually invoked...
    assert calls
    # ...and the math still certifies a fair settlement.
    assert events[-1]["report"]["certifiedFair"] is True


def test_llm_narrator_falls_back_to_templates_on_error():
    def broken_generate(system: str, user: str, model: str) -> str:
        raise RuntimeError("Qwen unavailable")

    events = list(run_negotiation(COFOUNDER_SCENARIO, LLMNarrator(broken_generate)))

    # Falls back to non-empty templated prose; outcome unaffected.
    opening = next(
        e for e in events if e["type"] == "proposal" and e["kind"] == "opening"
    )
    assert opening["rationale"]
    assert "claiming every asset" in opening["rationale"]
    assert events[-1]["report"]["certifiedFair"] is True
