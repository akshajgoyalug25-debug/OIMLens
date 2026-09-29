
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from oimlense.r76.mpe_engine import calculate_mpe


@dataclass(frozen=True)
class TiltObservationResult:
    direction: str
    tilt_zero_difference: Decimal
    low_load: Decimal
    low_difference: Decimal
    low_mpe: Decimal
    max_load: Decimal
    max_difference: Decimal
    max_mpe: Decimal
    no_load_passed: bool
    low_load_passed: bool
    max_load_passed: bool
    passed: bool


@dataclass(frozen=True)
class TiltResult:
    accuracy_class: str
    e: Decimal
    max_capacity: Decimal
    observations: tuple[TiltObservationResult, ...]
    no_load_limit: Decimal
    passed: bool
    measured_error: Decimal
    mpe: Decimal
    source: str
    source_clause: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "accuracy_class": self.accuracy_class,
            "e": self.e,
            "max_capacity": self.max_capacity,
            "observations": [
                {
                    "direction": item.direction,
                    "tilt_zero_difference": item.tilt_zero_difference,
                    "low_load": item.low_load,
                    "low_difference": item.low_difference,
                    "low_mpe": item.low_mpe,
                    "max_load": item.max_load,
                    "max_difference": item.max_difference,
                    "max_mpe": item.max_mpe,
                    "no_load_passed": item.no_load_passed,
                    "low_load_passed": item.low_load_passed,
                    "max_load_passed": item.max_load_passed,
                    "passed": item.passed,
                }
                for item in self.observations
            ],
            "no_load_limit": self.no_load_limit,
            "passed": self.passed,
            "measured_error": self.measured_error,
            "mpe": self.mpe,
            "source": self.source,
            "source_clause": self.source_clause,
        }


def calculate_tilt(
    accuracy_class: str,
    e: Decimal,
    max_capacity: Decimal,
    reference_zero: Decimal,
    reference_low_indication: Decimal,
    low_load: Decimal,
    reference_max_indication: Decimal,
    directions: list[dict[str, Any]],
    is_direct_sales: bool = False,
) -> TiltResult:

    accuracy_class = accuracy_class.upper()
    e = Decimal(str(e))
    max_capacity = Decimal(str(max_capacity))
    reference_zero = Decimal(str(reference_zero))
    reference_low_indication = Decimal(str(reference_low_indication))
    low_load = Decimal(str(low_load))
    reference_max_indication = Decimal(str(reference_max_indication))

    if e <= 0:
        raise ValueError("Verification scale interval e must be greater than zero.")

    if max_capacity <= 0:
        raise ValueError("Maximum capacity must be greater than zero.")

    if low_load <= 0:
        raise ValueError("Low test load must be greater than zero.")

    if low_load > max_capacity:
        raise ValueError("Low test load cannot exceed maximum capacity.")

    if accuracy_class == "I":
        raise ValueError(
            "Tilting test A.5.1 is applicable only to classes II, III and IIII."
        )

    low_mpe = calculate_mpe(
        accuracy_class=accuracy_class,
        load=low_load,
        e=e,
        max_capacity=max_capacity,
    ).mpe

    max_mpe = calculate_mpe(
        accuracy_class=accuracy_class,
        load=max_capacity,
        e=e,
        max_capacity=max_capacity,
    ).mpe

    no_load_limit = Decimal("2") * e

    observation_results = []

    for item in directions:
        direction = str(item["direction"])

        tilted_zero = Decimal(str(item["tilted_zero"]))
        tilted_low = Decimal(str(item["tilted_low"]))
        tilted_max = Decimal(str(item["tilted_max"]))

        # R76 combined procedure:
        # correct loaded tilted indication for the zero deviation
        # present at the tilted position.
        tilt_zero_difference = tilted_zero - reference_zero

        reference_low_error = (
            reference_low_indication
            + Decimal("0.5") * e
            - low_load
        )

        tilted_low_error = (
            tilted_low
            + Decimal("0.5") * e
            - low_load
        )

        low_difference = (
            tilted_low_error
            - (tilted_zero - reference_zero)
            - reference_low_error
        )

        reference_max_error = (
            reference_max_indication
            + Decimal("0.5") * e
            - max_capacity
        )

        tilted_max_error = (
            tilted_max
            + Decimal("0.5") * e
            - max_capacity
        )

        max_difference = (
            tilted_max_error
            - (tilted_zero - reference_zero)
            - reference_max_error
        )

        # Class II has an exception for the no-load requirement
        # unless it is used for direct sales to the public.
        no_load_applicable = accuracy_class != "II" or is_direct_sales

        no_load_passed = (
            abs(tilt_zero_difference) <= no_load_limit
            if no_load_applicable
            else True
        )

        low_load_passed = abs(low_difference) <= low_mpe
        max_load_passed = abs(max_difference) <= max_mpe

        observation_results.append(
            TiltObservationResult(
                direction=direction,
                tilt_zero_difference=tilt_zero_difference,
                low_load=low_load,
                low_difference=low_difference,
                low_mpe=low_mpe,
                max_load=max_capacity,
                max_difference=max_difference,
                max_mpe=max_mpe,
                no_load_passed=no_load_passed,
                low_load_passed=low_load_passed,
                max_load_passed=max_load_passed,
                passed=(
                    no_load_passed
                    and low_load_passed
                    and max_load_passed
                ),
            )
        )

    overall_passed = all(item.passed for item in observation_results)

    measured_error = Decimal("0")
    measured_limit = max(
        (
            max(
                no_load_limit,
                item.low_mpe,
                item.max_mpe,
            )
            for item in observation_results
        ),
        default=Decimal("0"),
    )

    for item in observation_results:
        candidates = [
            (abs(item.tilt_zero_difference), no_load_limit),
            (abs(item.low_difference), item.low_mpe),
            (abs(item.max_difference), item.max_mpe),
        ]

        for error_value, limit_value in candidates:
            if error_value > measured_error:
                measured_error = error_value
                measured_limit = limit_value

    return TiltResult(
        accuracy_class=accuracy_class,
        e=e,
        max_capacity=max_capacity,
        observations=tuple(observation_results),
        no_load_limit=no_load_limit,
        passed=overall_passed,
        measured_error=measured_error,
        mpe=measured_limit,
        source="OIML R 76-1:2006",
        source_clause="A.5.1 / 3.9.1.1",
    )
