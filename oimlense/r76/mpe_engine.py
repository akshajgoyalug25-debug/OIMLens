from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from oimlense.r76.rulepack import load_mpe_tables


@dataclass(frozen=True)
class MPECalculation:
    accuracy_class: str
    load: Decimal
    e: Decimal
    max_capacity: Decimal
    n: Decimal
    load_intervals: Decimal
    mpe_multiplier: Decimal
    mpe: Decimal
    base_mpe: Decimal
    in_service: bool
    formula: str
    source: str
    source_clause: str


@dataclass(frozen=True)
class WeighingErrorResult:
    indication: Decimal
    additional_load: Decimal
    load: Decimal
    e: Decimal
    raw_error: Decimal
    zero_error: Decimal
    corrected_error: Decimal
    mpe: Decimal
    passed: bool
    source: str
    source_clause: str


def _load_mpe_steps():
    table = load_mpe_tables()
    classes = table["classes"]

    steps = {}

    for accuracy_class, config in classes.items():
        converted = []

        for step in config["steps"]:
            limit = step["max_intervals"]
            multiplier = Decimal(str(step["multiplier"]))

            converted.append(
                (
                    None if limit is None else Decimal(str(limit)),
                    multiplier,
                )
            )

        steps[accuracy_class.upper()] = tuple(converted)

    return steps


_MPE_STEPS = _load_mpe_steps()


def calculate_n(max_capacity: Decimal, e: Decimal) -> Decimal:
    if e <= 0:
        raise ValueError("Verification scale interval e must be greater than zero.")

    if max_capacity <= 0:
        raise ValueError("Maximum capacity must be greater than zero.")

    return max_capacity / e


def _get_multiplier(accuracy_class: str, load_intervals: Decimal) -> Decimal:
    accuracy_class = accuracy_class.upper()

    if accuracy_class not in _MPE_STEPS:
        raise ValueError(f"Unsupported accuracy class: {accuracy_class}")

    for limit, multiplier in _MPE_STEPS[accuracy_class]:
        if limit is None or load_intervals <= limit:
            return multiplier

    raise ValueError(
        f"Load of {load_intervals} verification intervals exceeds "
        f"the configured Table 6 range for class {accuracy_class}."
    )


def calculate_mpe(
    accuracy_class: str,
    load: Decimal,
    e: Decimal,
    max_capacity: Decimal,
    in_service: bool = False,
) -> MPECalculation:
    """
    OIML R 76-1:2006 Table 6.

    n = Max / e is the instrument's number of verification scale
    intervals.

    The MPE for an individual weighing is determined from the
    actual load m expressed as verification intervals:

        load_intervals = load / e

    If in_service is True, the MPE is twice the initial verification MPE (clause 3.5.2).
    """

    if load < 0:
        raise ValueError("Load cannot be negative.")

    if max_capacity <= 0:
        raise ValueError("Maximum capacity must be greater than zero.")

    if e <= 0:
        raise ValueError("Verification scale interval e must be greater than zero.")

    if load > max_capacity:
        raise ValueError("Load cannot exceed maximum capacity.")

    accuracy_class_upper = accuracy_class.upper()
    n = calculate_n(max_capacity, e)

    # Class limits validation per Table 3
    if accuracy_class_upper == "I":
        if n < Decimal("50000"):
            raise ValueError(f"Class I instrument requires n >= 50000 (got {n}).")
    elif accuracy_class_upper == "II":
        if n < Decimal("100") or n > Decimal("100000"):
            raise ValueError(f"Class II instrument requires 100 <= n <= 100000 (got {n}).")
    elif accuracy_class_upper == "III":
        if n < Decimal("100") or n > Decimal("10000"):
            raise ValueError(f"Class III instrument requires 100 <= n <= 10000 (got {n}).")
    elif accuracy_class_upper == "IIII":
        if n < Decimal("100") or n > Decimal("1000"):
            raise ValueError(f"Class IIII instrument requires 100 <= n <= 1000 (got {n}).")
    else:
        raise ValueError(f"Unsupported accuracy class: {accuracy_class}")

    load_intervals = load / e

    multiplier = _get_multiplier(
        accuracy_class_upper,
        load_intervals,
    )

    base_mpe = Decimal(str(multiplier)) * e
    mpe = base_mpe * Decimal("2") if in_service else base_mpe

    return MPECalculation(
        accuracy_class=accuracy_class_upper,
        load=load,
        e=e,
        max_capacity=max_capacity,
        n=n,
        load_intervals=load_intervals,
        mpe_multiplier=multiplier,
        mpe=mpe,
        base_mpe=base_mpe,
        in_service=in_service,
        formula="MPE = multiplier × e",
        source="OIML R 76-1:2006",
        source_clause="Table 6 / 3.5.1" + (" / 3.5.2" if in_service else ""),
    )


def calculate_weighing_error(
    indication: Decimal,
    additional_load: Decimal,
    load: Decimal,
    e: Decimal,
    zero_error: Decimal,
    mpe: Decimal,
) -> WeighingErrorResult:
    """
    R76-2 Section 1 / R76-1 A.4.4.3

    E = I + 1/2 e - ΔL - L

    Ec = E - E0
    """

    raw_error = (
        indication
        + (Decimal("0.5") * e)
        - additional_load
        - load
    )

    corrected_error = raw_error - zero_error
    passed = abs(corrected_error) <= abs(mpe)

    return WeighingErrorResult(
        indication=indication,
        additional_load=additional_load,
        load=load,
        e=e,
        raw_error=raw_error,
        zero_error=zero_error,
        corrected_error=corrected_error,
        mpe=mpe,
        passed=passed,
        source="OIML R 76-1:2006 / R76-2:2007",
        source_clause="A.4.4.3 / R76-2 Section 1",
    )
