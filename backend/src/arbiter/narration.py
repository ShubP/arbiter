"""Narrators turn a negotiation's structural steps into human language.

The negotiation's *structure* — who proposes what, which assets are contested, how
concessions land on the certified-fair settlement — is computed by the fairness
engine and is identical no matter who narrates. A Narrator only supplies the prose.

- ``TemplateNarrator``: deterministic templated text (free, no LLM).
- ``LLMNarrator``: Qwen-generated advocacy/mediation, with automatic fallback to
  the templated text on any error.

This is the "agents argue, the math decides" split: swapping narrators never
changes the fairness of the outcome, only how persuasively it is voiced.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any, Protocol

from .llm import model_for
from .scenarios import Scenario

# (system_prompt, user_prompt, model) -> generated text
GenerateFn = Callable[[str, str, str], str]


def _name(scenario: Scenario, party_id: str) -> str:
    return next(m.name for m in scenario.parties if m.id == party_id)


def _other(scenario: Scenario, party_id: str) -> str:
    return next(m.id for m in scenario.parties if m.id != party_id)


def cash_phrase(amount: float) -> str:
    """Human wording for a net cash amount."""
    if amount >= 0:
        return f"receives ${amount:g}k"
    return f"pays ${-amount:g}k"


class Narrator(Protocol):
    def intake(self, scenario: Scenario) -> str: ...
    def opening(
        self, scenario: Scenario, party_id: str, report: dict[str, Any]
    ) -> str: ...
    def demand(
        self, scenario: Scenario, party_id: str, item_id: str, holder_id: str
    ) -> str: ...
    def deny(
        self, scenario: Scenario, party_id: str, item_id: str, holder_id: str
    ) -> str: ...
    def mediation_opening(self, scenario: Scenario, contested: list[str]) -> str: ...
    def counter(
        self, scenario: Scenario, party_id: str, report: dict[str, Any]
    ) -> str: ...
    def mediation_propose(self, scenario: Scenario) -> str: ...
    def concession_item(
        self, scenario: Scenario, conceding: str, item_id: str, receiving: str
    ) -> str: ...
    def concession_balance(
        self, scenario: Scenario, party_id: str, cash: float
    ) -> str: ...
    def settlement(
        self,
        scenario: Scenario,
        party_id: str,
        held: list[str],
        cash: float,
        utility: float,
    ) -> str: ...


class TemplateNarrator:
    """Deterministic, LLM-free narration."""

    def intake(self, scenario: Scenario) -> str:
        d = scenario.dispute
        return (
            f"Structured the dispute: {len(d.items)} indivisible assets, "
            f"${int(d.cash_pool)}k divisible treasury, {len(d.parties)} parties. "
            "Private valuations elicited."
        )

    def opening(self, scenario: Scenario, party_id: str, report: dict[str, Any]) -> str:
        return (
            f"{_name(scenario, party_id)} opens aggressively, claiming every asset "
            "for their side."
        )

    def demand(
        self, scenario: Scenario, party_id: str, item_id: str, holder_id: str
    ) -> str:
        return (
            f"{_name(scenario, party_id)} pushes for "
            f"{scenario.item_labels[item_id]}, currently held by "
            f"{_name(scenario, holder_id)}."
        )

    def deny(
        self, scenario: Scenario, party_id: str, item_id: str, holder_id: str
    ) -> str:
        return (
            f"{_name(scenario, holder_id)} values {scenario.item_labels[item_id]} "
            f"more than {_name(scenario, party_id)}, so it stays put — "
            f"{_name(scenario, party_id)} is balanced in cash instead."
        )

    def mediation_opening(self, scenario: Scenario, contested: list[str]) -> str:
        contested_text = (
            ", ".join(scenario.item_labels[i] for i in contested) or "the assets"
        )
        loser = scenario.parties[1].name
        return (
            f"This opening leaves {loser} with heavy envy. {contested_text} sit "
            "with the party who values them least."
        )

    def counter(self, scenario: Scenario, party_id: str, report: dict[str, Any]) -> str:
        return (
            f"{_name(scenario, party_id)} counters by claiming everything instead "
            "— an equal and opposite extreme."
        )

    def mediation_propose(self, scenario: Scenario) -> str:
        return (
            "Both openings are extremes. I propose the efficient division: each "
            "asset goes to whoever values it most, with cash settling the "
            "difference so neither side envies the other."
        )

    def concession_item(
        self, scenario: Scenario, conceding: str, item_id: str, receiving: str
    ) -> str:
        return (
            f"{_name(scenario, conceding)} concedes "
            f"{scenario.item_labels[item_id]} to {_name(scenario, receiving)}, "
            "who values it more."
        )

    def concession_balance(self, scenario: Scenario, party_id: str, cash: float) -> str:
        return (
            f"{_name(scenario, party_id)} {cash_phrase(cash)} to balance the "
            "assets retained."
        )

    def settlement(
        self,
        scenario: Scenario,
        party_id: str,
        held: list[str],
        cash: float,
        utility: float,
    ) -> str:
        held_text = (
            ", ".join(scenario.item_labels[i] for i in held) if held else "no assets"
        )
        return (
            f"{_name(scenario, party_id)} keeps {held_text} and {cash_phrase(cash)}. "
            f"Final outcome {utility:g} — identical to the other party, so neither "
            "would trade places."
        )


class LLMNarrator:
    """Qwen-generated narration, falling back to templates on any error."""

    def __init__(self, generate: GenerateFn):
        self._generate = generate
        self._fallback = TemplateNarrator()

    def _gen(self, system: str, user: str, role: str, fallback: str) -> str:
        try:
            text = self._generate(system, user, model_for(role)).strip()
            return text or fallback
        except Exception:
            return fallback

    def intake(self, scenario: Scenario) -> str:
        return self._fallback.intake(scenario)

    def demand(
        self, scenario: Scenario, party_id: str, item_id: str, holder_id: str
    ) -> str:
        system = (
            "You are a sharp advocate. In one first-person sentence, demand a "
            "specific asset you value, currently held by another party. No preamble."
        )
        user = (
            f"You represent {_name(scenario, party_id)}. Demand "
            f"{scenario.item_labels[item_id]}, currently held by "
            f"{_name(scenario, holder_id)}."
        )
        return self._gen(
            system,
            user,
            "advocate",
            self._fallback.demand(scenario, party_id, item_id, holder_id),
        )

    def deny(
        self, scenario: Scenario, party_id: str, item_id: str, holder_id: str
    ) -> str:
        return self._fallback.deny(scenario, party_id, item_id, holder_id)

    def opening(self, scenario: Scenario, party_id: str, report: dict[str, Any]) -> str:
        system = (
            "You are a sharp advocate representing one party in an asset dispute. "
            "Write one or two vivid, first-person sentences arguing your client's "
            "opening claim. Be persuasive and concrete; no preamble."
        )
        d = scenario.dispute
        assets = ", ".join(scenario.item_labels[i] for i in d.items)
        user = (
            f"You represent {_name(scenario, party_id)}. Your opening move claims "
            f"all assets ({assets}) and offers "
            f"{_name(scenario, _other(scenario, party_id))} a cash buyout. "
            "Argue for it."
        )
        return self._gen(
            system, user, "advocate", self._fallback.opening(scenario, party_id, report)
        )

    def mediation_opening(self, scenario: Scenario, contested: list[str]) -> str:
        system = (
            "You are a neutral, incisive mediator. In one or two sentences, name "
            "the problem with the latest one-sided offer and the contested assets. "
            "No preamble."
        )
        contested_text = (
            ", ".join(scenario.item_labels[i] for i in contested) or "the assets"
        )
        user = (
            f"{scenario.parties[0].name} just claimed everything, leaving "
            f"{scenario.parties[1].name} with almost nothing. Contested assets: "
            f"{contested_text}. Point out the unfairness."
        )
        return self._gen(
            system,
            user,
            "mediator",
            self._fallback.mediation_opening(scenario, contested),
        )

    def counter(self, scenario: Scenario, party_id: str, report: dict[str, Any]) -> str:
        system = (
            "You are a sharp advocate for the other party. Write one or two "
            "first-person sentences countering with your own aggressive claim. "
            "No preamble."
        )
        user = (
            f"You represent {_name(scenario, party_id)}. Counter the first party's "
            "land-grab by claiming the assets yourself. Argue for it."
        )
        return self._gen(
            system, user, "advocate", self._fallback.counter(scenario, party_id, report)
        )

    def mediation_propose(self, scenario: Scenario) -> str:
        system = (
            "You are a neutral mediator. In one or two sentences, propose the "
            "efficient resolution: each asset to whoever values it most, with cash "
            "balancing the difference so neither envies the other. No preamble."
        )
        user = (
            "Both sides have made extreme claims. Propose the efficient, envy-free "
            "division."
        )
        return self._gen(
            system, user, "mediator", self._fallback.mediation_propose(scenario)
        )

    def concession_item(
        self, scenario: Scenario, conceding: str, item_id: str, receiving: str
    ) -> str:
        return self._fallback.concession_item(scenario, conceding, item_id, receiving)

    def concession_balance(self, scenario: Scenario, party_id: str, cash: float) -> str:
        return self._fallback.concession_balance(scenario, party_id, cash)

    def settlement(
        self,
        scenario: Scenario,
        party_id: str,
        held: list[str],
        cash: float,
        utility: float,
    ) -> str:
        return self._fallback.settlement(scenario, party_id, held, cash, utility)
