"""Tests for the Qwen (Alibaba Cloud DashScope) client configuration."""

import pytest

from arbiter.llm import DASHSCOPE_BASE_URL, MODELS, get_client


def test_get_client_targets_the_alibaba_dashscope_endpoint():
    client = get_client(api_key="sk-test")
    assert str(client.base_url).startswith(DASHSCOPE_BASE_URL)


def test_get_client_reads_the_key_from_the_environment(monkeypatch):
    monkeypatch.setenv("DASHSCOPE_API_KEY", "sk-env")
    client = get_client()
    assert client.api_key == "sk-env"


def test_get_client_errors_clearly_without_a_key(monkeypatch):
    monkeypatch.delenv("DASHSCOPE_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="DASHSCOPE_API_KEY"):
        get_client()


def test_model_routing_defines_a_model_for_each_role():
    assert {"intake", "advocate", "mediator", "referee"} <= set(MODELS)
