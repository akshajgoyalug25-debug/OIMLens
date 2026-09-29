from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from oimlense.r76.mpe_engine import calculate_mpe, calculate_weighing_error


@dataclass(frozen=True)
class WeighingObservationResult:
    load: Decimal
    indication: Decimal
    additional_load: Decimal
    zero_error: Decimal
    error: Decimal
    corrected_error: Decimal
    mpe: Decimal
    passed: bool


@dataclass(frozen=True)
class WeighingSeriesResult:
    observations: tuple[WeighingObservationResult, ...]
    passed: bool
    source: str
    source_clause: str


def calculate_weighing_series(
    *,
    accuracy_class: str,
    max_capacity: Decimal,
    e: Decimal,
    observations: list[dict[str, Any]],
    minimum_observations: int = 5,
    in_service: bool = False,
) -> WeighingSeriesResult:
    accuracy_class = str(accuracy_class).upper().strip()
    max_capacity = Decimal(str(max_capacity))
    e = Decimal(str(e))

    if max_capacity <= 0:
        raise ValueError("max_capacity must be greater than zero.")

    if e <= 0:
        raise ValueError("e must be greater than zero.")

    if len(observations) < minimum_observations:
        raise ValueError(
            f"At least {minimum_observations} different test loads are required."
        )

    results = []

    for index, item in enumerate(observations, 1):
        required = {"load", "indication"}
        missing = required - item.keys()

        if missing:
            raise ValueError(
                f"Observation #{index} is missing: {', '.join(sorted(missing))}"
            )

        load = Decimal(str(item["load"]))
        indication = Decimal(str(item["indication"]))
        additional_load = Decimal(str(item.get("additional_load", "0")))
        zero_error = Decimal(str(item.get("zero_error", "0")))

        if load < 0 or load > max_capacity:
            raise ValueError(
                f"Observation #{index}: load must be between 0 and Max."
            )

        mpe_result = calculate_mpe(
            accuracy_class=accuracy_class,
            load=load,
            e=e,
            max_capacity=max_capacity,
            in_service=in_service,
        )

        error_result = calculate_weighing_error(
            indication=indication,
            additional_load=additional_load,
            load=load,
            e=e,
            zero_error=zero_error,
            mpe=mpe_result.mpe,
        )

        results.append(
            WeighingObservationResult(
                load=load,
                indication=indication,
                additional_load=additional_load,
                zero_error=zero_error,
                error=error_result.raw_error,
                corrected_error=error_result.corrected_error,
                mpe=mpe_result.mpe,
                passed=error_result.passed,
            )
        )

    loads = [item.load for item in results]

    if len(set(loads)) != len(loads):
        raise ValueError("Each weighing observation must use a different test load.")

    if not any(load == 0 for load in loads):
        raise ValueError("The weighing series must include the zero/Min point.")

    if not any(load == max_capacity for load in loads):
        raise ValueError("The weighing series must include Max.")

    return WeighingSeriesResult(
        observations=tuple(results),
        passed=all(item.passed for item in results),
        source="OIML R 76-1:2006",
        source_clause="A.4.4.1 / 3.5 / 3.9.1" + (" / 3.5.2" if in_service else ""),
    )
