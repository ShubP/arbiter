"""Qwen access via Alibaba Cloud DashScope.

This is Arbiter's integration point with Alibaba Cloud. Qwen models are reached
through DashScope's OpenAI-compatible endpoint, so we use the OpenAI SDK pointed
at the Alibaba Cloud base URL. The negotiating agents (advocates, mediator,
referee) and the natural-language intake all call Qwen through ``get_client``.

Set ``DASHSCOPE_API_KEY`` in the environment (never commit it).
"""

from __future__ import annotations

import os

from openai import OpenAI

# Alibaba Cloud DashScope, OpenAI-compatible mode (international endpoint).
# Override with DASHSCOPE_BASE_URL (e.g. for Token Plan keys, which use
# token-plan.ap-southeast-1.maas.aliyuncs.com — see the hackathon quickstart).
DASHSCOPE_BASE_URL = os.environ.get(
    "DASHSCOPE_BASE_URL",
    "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
)

# Deliberate model routing over the hackathon's Qwen Cloud catalog: the strongest
# reasoner where adjudication matters, balanced models for advocacy, and the fast
# tier for intake — cost-aware token spend per role.
MODELS: dict[str, str] = {
    "intake": os.environ.get("ARBITER_MODEL_INTAKE", "qwen3.6-flash"),
    "advocate": os.environ.get("ARBITER_MODEL_ADVOCATE", "qwen3.7-plus"),
    "mediator": os.environ.get("ARBITER_MODEL_MEDIATOR", "qwen3.7-max"),
    "referee": os.environ.get("ARBITER_MODEL_REFEREE", "qwen3.7-max"),
}


def get_client(api_key: str | None = None) -> OpenAI:
    """Return an OpenAI-compatible client pointed at Alibaba Cloud DashScope.

    Args:
        api_key: DashScope API key; falls back to ``DASHSCOPE_API_KEY`` in the env.

    Raises:
        RuntimeError: if no key is available.
    """
    key = api_key or os.environ.get("DASHSCOPE_API_KEY")
    if not key:
        raise RuntimeError(
            "DASHSCOPE_API_KEY is not set — export it or pass api_key explicitly."
        )
    return OpenAI(api_key=key, base_url=DASHSCOPE_BASE_URL)


def model_for(role: str) -> str:
    """The Qwen model chosen for a given agent role."""
    return MODELS.get(role, "qwen-plus")


def make_generate(client: OpenAI):
    """Build a token-frugal ``(system, user, model) -> text`` generator on Qwen."""

    def generate(system: str, user: str, model: str) -> str:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.7,
            max_tokens=160,
        )
        return (response.choices[0].message.content or "").strip()

    return generate
