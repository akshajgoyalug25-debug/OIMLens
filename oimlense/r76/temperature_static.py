from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from oimlense.r76.mpe_engine import (
    MPECalculation,
    WeighingErrorResult,
    calculate_mpe,
    calculate_weighing_error,
)


@dataclass(frozen=True)
class StaticTemperatureObservation:
    temperature: Decimal
    load: Decimal
    indication: Decimal
    additional_load: Decimal
    zero_error: Decimal
    mpe: MPECalculation
    weighing_error: WeighingErrorResult


@dataclass(frozen=True)
class TemperatureStaticResult:
    observations: tuple[StaticTemperatureObservation, ...]
    passed: bool
    worst_corrected_error: Decimal
    mpe: Decimal
    source: str
    source_clause: str


def calculate_temperature_static(
    *,
    accuracy_class: str,
    max_capacity: Decimal,
    e: Decimal,
    observations: list[dict[str, Any]],
) -> TemperatureStaticResult:
    """
    OIML R 76-1:2006 A.5.3.1.

    Static-temperature weighing observations are evaluated using
    the normal R76 weighing-performance calculation from A.4.4.3.

    Each observation contains:
        temperature
        load
        indication
        additional_load
        zero_error
    """

    accuracy_class = str(accuracy_class).upper()
    max_capacity = Decimal(str(max_capacity))
    e = Decimal(str(e))

    if accuracy_class not in {"I", "II", "III", "IIII"}:
        raise ValueError(
            f"Unsupported accuracy class: {accuracy_class}"
        )

    if max_capacity <= 0:
        raise ValueError(
            "Maximum capacity must be greater than zero."
        )

    if e <= 0:
        raise ValueError(
            "Verification scale interval e must be greater than zero."
        )

    if not observations:
        raise ValueError(
            "At least one static-temperature observation is required."
        )

    normalized: list[StaticTemperatureObservation] = []

    for index, item in enumerate(observations, start=1):
        if not isinstance(item, dict):
            raise ValueError(
                f"Temperature static observation #{index} "
                "must be an object."
            )

        required = {
            "temperature",
            "load",
            "indication",
        }

        missing = sorted(required - item.keys())

        if missing:
            raise ValueError(
                f"Temperature static observation #{index} "
                f"is missing: {', '.join(missing)}"
            )

        temperature = Decimal(str(item["temperature"]))
        load = Decimal(str(item["load"]))
        indication = Decimal(str(item["indication"]))
        additional_load = Decimal(
            str(item.get("additional_load", "0"))
        )
        zero_error = Decimal(str(item.get("zero_error", "0")))

        if load < 0 or load > max_capacity:
            raise ValueError(f"Static temperature observation #{index} load must be between 0 and Max.")

        mpe = calculate_mpe(
            accuracy_class=accuracy_class,
            load=load,
            e=e,
            max_capacity=max_capacity,
        )

        weighing_error = calculate_weighing_error(
            indication=indication,
            additional_load=additional_load,
            load=load,
            e=e,
            zero_error=zero_error,
            mpe=mpe.mpe,
        )

        normalized.append(
            StaticTemperatureObservation(
                temperature=temperature,
                load=load,
                indication=indication,
                additional_load=additional_load,
                zero_error=zero_error,
                mpe=mpe,
                weighing_error=weighing_error,
            )
        )

    passed = all(
        observation.weighing_error.passed
        for observation in normalized
    )

    worst_corrected_error = max(
        (
            abs(
                observation.weighing_error.corrected_error
            )
            for observation in normalized
        ),
        default=Decimal("0"),
    )

    max_mpe = max(
        (observation.mpe.mpe for observation in normalized),
        default=Decimal("0"),
    )

    return TemperatureStaticResult(
        observations=tuple(normalized),
        passed=passed,
        worst_corrected_error=worst_corrected_error,
        mpe=max_mpe,
        source="OIML R 76-1:2006",
        source_clause="A.5.3.1 / A.4.4.3",
    )
