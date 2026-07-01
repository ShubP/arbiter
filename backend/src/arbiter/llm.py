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
DASHSCOPE_BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"

# Deliberate model routing: stronger models where reasoning matters most,
# lighter models for cheaper steps — cost-aware given a limited token budget.
MODELS: dict[str, str] = {
    "intake": "qwen-turbo",
    "advocate": "qwen-plus",
    "mediator": "qwen-max",
    "referee": "qwen-max",
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
