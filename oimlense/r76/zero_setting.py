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


@dataclass(frozen=True)
class ZeroTrackingResult:
    load: Decimal
    indication: Decimal
    additional_load: Decimal
    e: Decimal
    correction_rate: Decimal
    maximum_correction_rate: Decimal
    zero_error: Decimal
    accuracy_limit: Decimal
    equilibrium_stable: bool
    accuracy_passed: bool
    correction_rate_passed: bool
    equilibrium_passed: bool
    passed: bool
    source: str
    source_clause: str


def calculate_zero_tracking(
    load: Decimal,
    indication: Decimal,
    additional_load: Decimal,
    e: Decimal,
    correction_rate: Decimal,
    equilibrium_stable: bool,
) -> ZeroTrackingResult:
    """
    Evaluate automatic zero-tracking according to OIML R 76-1.

    Accuracy calculation follows A.4.2.3.2 and A.4.4.3:
        P = I + 1/2 e - ΔL
        E = P - L

    Automatic zero-setting / zero-tracking accuracy limit:
        |E| <= 0.25 e

    Zero-tracking correction rate requirement:
        <= 0.5 d/second

    The UI supplies the observed correction rate in d/second.
    """
    load = Decimal(str(load))
    indication = Decimal(str(indication))
    additional_load = Decimal(str(additional_load))
    e = Decimal(str(e))
    correction_rate = Decimal(str(correction_rate))

    if load < 0:
        raise ValueError("Test load cannot be negative.")

    if e <= 0:
        raise ValueError(
            "Verification scale interval e must be greater than zero."
        )

    if additional_load < 0:
        raise ValueError("Additional load cannot be negative.")

    if correction_rate < 0:
        raise ValueError("Zero-tracking correction rate cannot be negative.")

    if not isinstance(equilibrium_stable, bool):
        raise ValueError(
            "equilibrium_stable must be a boolean."
        )

    # OIML R 76-1 A.4.4.3:
    # P = I + 1/2 e - ΔL
    indicated_load = (
        indication
        + (Decimal("0.5") * e)
        - additional_load
    )

    # E = P - L
    zero_error = indicated_load - load

    # OIML R 76-1 4.5.2:
    # automatic zero-setting / zero-tracking accuracy <= ±0.25e
    accuracy_limit = Decimal("0.25") * e

    # OIML R 76-1 4.5.7:
    # zero-tracking corrections <= 0.5 d/second
    maximum_correction_rate = Decimal("0.5")

    accuracy_passed = abs(zero_error) <= accuracy_limit
    correction_rate_passed = correction_rate <= maximum_correction_rate
    equilibrium_passed = equilibrium_stable

    return ZeroTrackingResult(
        load=load,
        indication=indication,
        additional_load=additional_load,
        e=e,
        correction_rate=correction_rate,
        maximum_correction_rate=maximum_correction_rate,
        zero_error=zero_error,
        accuracy_limit=accuracy_limit,
        equilibrium_stable=equilibrium_stable,
        accuracy_passed=accuracy_passed,
        correction_rate_passed=correction_rate_passed,
        equilibrium_passed=equilibrium_passed,
        passed=(
            accuracy_passed
            and correction_rate_passed
            and equilibrium_passed
        ),
        source="OIML R 76-1:2006",
        source_clause="4.5.2 / 4.5.7 / A.4.2.3.2 / A.4.4.3",
    )
