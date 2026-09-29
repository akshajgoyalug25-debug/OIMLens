from decimal import Decimal

import pytest

from oimlense.r76.multi_interval import (
    MultiIntervalRange,
    select_range,
    calculate_multi_interval_mpe,
)


def make_example_ranges():
    return [
        MultiIntervalRange(
            min_capacity=Decimal("0.020"),
            max_capacity=Decimal("2"),
            e=Decimal("0.001"),
        ),
        MultiIntervalRange(
            min_capacity=Decimal("2"),
            max_capacity=Decimal("5"),
            e=Decimal("0.002"),
        ),
        MultiIntervalRange(
            min_capacity=Decimal("5"),
            max_capacity=Decimal("15"),
            e=Decimal("0.010"),
        ),
    ]


def test_select_first_range():
    result = select_range(
        load=Decimal("1"),
        ranges=make_example_ranges(),
    )

    assert result.e == Decimal("0.001")
    assert result.min_capacity == Decimal("0.020")
    assert result.max_capacity == Decimal("2")
    assert result.load_intervals == Decimal("1000")


def test_select_second_range():
    result = select_range(
        load=Decimal("3"),
        ranges=make_example_ranges(),
    )

    assert result.e == Decimal("0.002")
    assert result.min_capacity == Decimal("2")
    assert result.max_capacity == Decimal("5")
    assert result.load_intervals == Decimal("1500")


def test_select_third_range():
    result = select_range(
        load=Decimal("10"),
        ranges=make_example_ranges(),
    )

    assert result.e == Decimal("0.010")
    assert result.min_capacity == Decimal("5")
    assert result.max_capacity == Decimal("15")
    assert result.load_intervals == Decimal("1000")


def test_boundary_at_two_kg_uses_first_range():
    result = select_range(
        load=Decimal("2"),
        ranges=make_example_ranges(),
    )

    assert result.e == Decimal("0.001")


def test_boundary_at_five_kg_uses_second_range():
    result = select_range(
        load=Decimal("5"),
        ranges=make_example_ranges(),
    )

    assert result.e == Decimal("0.002")


def test_load_outside_ranges_fails():
    with pytest.raises(ValueError):
        select_range(
            load=Decimal("16"),
            ranges=make_example_ranges(),
        )


def test_empty_ranges_fail():
    with pytest.raises(ValueError):
        select_range(
            load=Decimal("1"),
            ranges=[],
        )


def test_multi_interval_mpe_at_one_kg():
    _, result = calculate_multi_interval_mpe(
        accuracy_class="III",
        load=Decimal("1"),
        ranges=make_example_ranges(),
    )

    assert result.e == Decimal("0.001")
    assert result.mpe == Decimal("0.001")


def test_multi_interval_mpe_at_three_kg():
    _, result = calculate_multi_interval_mpe(
        accuracy_class="III",
        load=Decimal("3"),
        ranges=make_example_ranges(),
    )

    assert result.e == Decimal("0.002")
    assert result.mpe == Decimal("0.002")


def test_multi_interval_mpe_at_ten_kg():
    _, result = calculate_multi_interval_mpe(
        accuracy_class="III",
        load=Decimal("10"),
        ranges=make_example_ranges(),
    )

    assert result.e == Decimal("0.010")
    assert result.mpe == Decimal("0.010")


def test_r76_multi_interval_example_mpe_zones():
    ranges = make_example_ranges()

    test_cases = [
        (Decimal("0.500"), Decimal("0.0005")),
        (Decimal("1.000"), Decimal("0.001")),
        (Decimal("2.000"), Decimal("0.001")),
        (Decimal("2.001"), Decimal("0.002")),
        (Decimal("4.000"), Decimal("0.002")),
        (Decimal("4.001"), Decimal("0.003")),
        (Decimal("5.000"), Decimal("0.003")),
        (Decimal("5.001"), Decimal("0.010")),
        (Decimal("15.000"), Decimal("0.010")),
    ]

    for load, expected_mpe in test_cases:
        _, result = calculate_multi_interval_mpe(
            accuracy_class="III",
            load=load,
            ranges=ranges,
        )

        assert result.mpe == expected_mpe, (
            f"Load {load} kg: expected MPE {expected_mpe}, "
            f"got {result.mpe}"
        )
