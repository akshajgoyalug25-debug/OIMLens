from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class ZeroRangeResult:
    positive_range: Decimal
    negative_range: Decimal
    initial_range: Decimal
    overall_range: Decimal
    max_capacity: Decimal
    initial_limit: Decimal
    overall_limit: Decimal
    initial_passed: bool
    overall_passed: bool
    passed: bool
    source: str
    source_clause: str


@dataclass(frozen=True)
class ZeroAccuracyResult:
    load: Decimal
    indication: Decimal
    additional_load: Decimal
    e: Decimal
    zero_error: Decimal
    limit: Decimal
    passed: bool
    source: str
    source_clause: str


def calculate_zero_range(
    positive_range: Decimal,
    negative_range: Decimal,
    overall_range: Decimal,
    max_capacity: Decimal,
) -> ZeroRangeResult:
    positive_range = Decimal(str(positive_range))
    negative_range = Decimal(str(negative_range))
    overall_range = Decimal(str(overall_range))
    max_capacity = Decimal(str(max_capacity))

    if positive_range < 0:
        raise ValueError("Positive zero-setting range cannot be negative.")

    if negative_range < 0:
        raise ValueError("Negative zero-setting range cannot be negative.")

    if overall_range < 0:
        raise ValueError("Overall zero-setting range cannot be negative.")

    if max_capacity <= 0:
        raise ValueError("Maximum capacity must be greater than zero.")

    initial_range = positive_range + negative_range

    initial_limit = Decimal("0.20") * max_capacity
    overall_limit = Decimal("0.04") * max_capacity

    initial_passed = initial_range <= initial_limit
    overall_passed = overall_range <= overall_limit

    return ZeroRangeResult(
        positive_range=positive_range,
        negative_range=negative_range,
        initial_range=initial_range,
        overall_range=overall_range,
        max_capacity=max_capacity,
        initial_limit=initial_limit,
        overall_limit=overall_limit,
        initial_passed=initial_passed,
        overall_passed=overall_passed,
        passed=initial_passed and overall_passed,
        source="OIML R 76-1:2006",
        source_clause="A.4.2.1 / 4.5.1",
    )


def calculate_zero_accuracy(
    load: Decimal,
    indication: Decimal,
    additional_load: Decimal,
    e: Decimal,
    zero_type: str = "automatic",
) -> ZeroAccuracyResult:
    load = Decimal(str(load))
    indication = Decimal(str(indication))
    additional_load = Decimal(str(additional_load))
    e = Decimal(str(e))
    zero_type_clean = str(zero_type).lower().strip()

    if load < 0:
        raise ValueError("Load cannot be negative.")

    if e <= 0:
        raise ValueError("Verification scale interval e must be greater than zero.")

    # OIML R 76-1 A.4.4.3:
    # E = I + 1/2 e - ΔL - L
    zero_error = (
        indication
        + (Decimal("0.5") * e)
        - additional_load
        - load
    )

    # Clause 4.5.2: 0.25e for automatic / zero-tracking, 0.5e for initial non-automatic zero setting
    if zero_type_clean == "initial_non_automatic":
        limit = Decimal("0.50") * e
        source_clause = "A.4.2.3 / 4.5.2 (initial non-automatic)"
    else:
        limit = Decimal("0.25") * e
        source_clause = "A.4.2.3 / 4.5.2 / A.4.4.3"

    return ZeroAccuracyResult(
        load=load,
        indication=indication,
        additional_load=additional_load,
        e=e,
        zero_error=zero_error,
        limit=limit,
        passed=abs(zero_error) <= limit,
        source="OIML R 76-1:2006",
        source_clause=source_clause,
    )
