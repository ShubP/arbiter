"""Tests for the synthetic dispute generator used by the evaluation harness."""

from arbiter.generator import generate_dispute


def test_generator_is_deterministic_for_a_given_seed():
    a = generate_dispute(seed=7)
    b = generate_dispute(seed=7)
    assert a == b


def test_generator_varies_with_the_seed():
    assert generate_dispute(seed=1) != generate_dispute(seed=2)


def test_generator_respects_shape_parameters():
    dispute = generate_dispute(seed=3, num_items=6, cash_pool=250.0)
    assert len(dispute.parties) == 2
    assert len(dispute.items) == 6
    assert dispute.cash_pool == 250.0
    # Every party values every item.
    for party in dispute.parties:
        assert set(dispute.valuations[party]) == set(dispute.items)


def test_generated_valuations_are_positive():
    dispute = generate_dispute(seed=99, num_items=8)
    for party in dispute.parties:
        for value in dispute.valuations[party].values():
            assert value > 0
