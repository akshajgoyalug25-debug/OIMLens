from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class MultiIntervalRange:
    min_capacity: Decimal
    max_capacity: Decimal
    e: Decimal


@dataclass(frozen=True)
class MultiIntervalSelection:
    load: Decimal
    min_capacity: Decimal
    max_capacity: Decimal
    e: Decimal
    load_intervals: Decimal


def select_range(
    load: Decimal,
    ranges: list[MultiIntervalRange],
) -> MultiIntervalSelection:
    """
    Select the applicable verification scale interval for a load.

    OIML R 76-1:2006, clause 3.3:
    For a multi-interval instrument, each partial weighing range
    has its own verification scale interval.

    The applicable e is determined by the load being applied.
    """

    if load < 0:
        raise ValueError("Load cannot be negative.")

    if not ranges:
        raise ValueError("At least one multi-interval range is required.")

    ordered = sorted(ranges, key=lambda r: r.min_capacity)

    previous_max = None

    for index, range in enumerate(ordered):
        if range.min_capacity < 0:
            raise ValueError("Range minimum cannot be negative.")

        if range.max_capacity <= range.min_capacity:
            raise ValueError(
                "Range maximum must be greater than range minimum."
            )

        if range.e <= 0:
            raise ValueError(
                "Verification scale interval e must be greater than zero."
            )

        if previous_max is not None and range.min_capacity != previous_max:
            raise ValueError(
                "Multi-interval ranges must connect without gaps or overlaps."
            )

        previous_max = range.max_capacity

        if range.min_capacity <= load <= range.max_capacity:
            load_intervals = load / range.e

            return MultiIntervalSelection(
                load=load,
                min_capacity=range.min_capacity,
                max_capacity=range.max_capacity,
                e=range.e,
                load_intervals=load_intervals,
            )

    raise ValueError(
        f"Load {load} is outside the configured multi-interval ranges."
    )


def calculate_multi_interval_mpe(
    accuracy_class: str,
    load: Decimal,
    ranges: list[MultiIntervalRange],
):
    """
    Select the applicable multi-interval range and calculate the
    Table 6 MPE using that range's verification scale interval.

    OIML R 76-1:2006 clauses 3.3 and 3.5.
    """

    from oimlense.r76.mpe_engine import calculate_mpe

    ordered_ranges = sorted(ranges, key=lambda r: r.min_capacity)

    selected = select_range(
        load=load,
        ranges=ordered_ranges,
    )

    max_capacity = ordered_ranges[-1].max_capacity

    mpe_result = calculate_mpe(
        accuracy_class=accuracy_class,
        load=load,
        e=selected.e,
        max_capacity=selected.max_capacity,
    )

    return selected, mpe_result
