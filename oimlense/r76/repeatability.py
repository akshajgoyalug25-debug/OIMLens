from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from oimlense.r76.mpe_engine import calculate_mpe, calculate_weighing_error


@dataclass(frozen=True)
class RepeatabilitySeries:
    target_load: Decimal
    observations: tuple[Decimal, ...]
    indications: tuple[Decimal, ...]
    errors: tuple[Decimal, ...]
    max_error: Decimal
    min_error: Decimal
    error_range: Decimal
    mpe: Decimal
    passed: bool


@dataclass(frozen=True)
class RepeatabilityResult:
    series: tuple[RepeatabilitySeries, ...]
    passed: bool
    source: str
    source_clause: str


def _calculate_series(
    *,
    accuracy_class: str,
    max_capacity: Decimal,
    e: Decimal,
    observations: list[dict[str, Any]],
) -> RepeatabilitySeries:
    if not observations:
        raise ValueError("Repeatability series cannot be empty.")

    loads = []
    indications = []
    errors = []

    for index, item in enumerate(observations, 1):
        if "load" not in item or "indication" not in item:
            raise ValueError(
                f"Repeatability observation #{index} requires load and indication."
            )

        load = Decimal(str(item["load"]))
        indication = Decimal(str(item["indication"]))
        additional_load = Decimal(str(item.get("additional_load", "0")))
        zero_error = Decimal(str(item.get("zero_error", "0")))

        mpe = calculate_mpe(
            accuracy_class=accuracy_class,
            load=load,
            e=e,
            max_capacity=max_capacity,
        ).mpe

        error = calculate_weighing_error(
            indication=indication,
            additional_load=additional_load,
            load=load,
            e=e,
            zero_error=zero_error,
            mpe=mpe,
        ).corrected_error

        loads.append(load)
        indications.append(indication)
        errors.append(error)

    target_load = sum(loads) / Decimal(len(loads))

    # Every weighing in a repeatability series must be at approximately
    # the same load. Allow a tolerance of one verification scale interval.
    for load in loads:
        if abs(load - target_load) > e:
            raise ValueError(
                "All observations in a repeatability series must use "
                "approximately the same test load."
            )

    mpe = calculate_mpe(
        accuracy_class=accuracy_class,
        load=target_load,
        e=e,
        max_capacity=max_capacity,
    ).mpe

    max_error = max(errors)
    min_error = min(errors)
    error_range = max_error - min_error

    passed = (
        all(abs(error) <= abs(mpe) for error in errors)
        and error_range <= abs(mpe)
    )

    return RepeatabilitySeries(
        target_load=target_load,
        observations=tuple(loads),
        indications=tuple(indications),
        errors=tuple(errors),
        max_error=max_error,
        min_error=min_error,
        error_range=error_range,
        mpe=mpe,
        passed=passed,
    )


def calculate_repeatability(
    *,
    accuracy_class: str,
    max_capacity: Decimal,
    e: Decimal,
    series: list[list[dict[str, Any]]],
    mode: str = "type_approval",
) -> RepeatabilityResult:
    accuracy_class = str(accuracy_class).upper().strip()
    max_capacity = Decimal(str(max_capacity))
    e = Decimal(str(e))
    mode = str(mode).lower().strip()

    if max_capacity <= 0:
        raise ValueError("max_capacity must be greater than zero.")

    if e <= 0:
        raise ValueError("e must be greater than zero.")

    if mode not in {"type_approval", "verification"}:
        raise ValueError(f"Unsupported repeatability mode: {mode}")

    if mode == "verification":
        if len(series) != 1:
            raise ValueError(
                "Verification repeatability requires exactly one series around 80% Max."
            )

        required_count = 3 if accuracy_class in {"III", "IIII"} else 6

        if len(series[0]) < required_count:
            raise ValueError(
                f"Verification repeatability series requires at least {required_count} weighings "
                f"for class {accuracy_class}."
            )

        result = _calculate_series(
            accuracy_class=accuracy_class,
            max_capacity=max_capacity,
            e=e,
            observations=series[0],
        )

        # Verify series is around 80% Max (allow tolerance of 10% Max or 5e)
        target_tolerance = max(max_capacity * Decimal("0.1"), Decimal("5") * e)
        if abs(result.target_load - max_capacity * Decimal("0.8")) > target_tolerance:
            raise ValueError(
                "Verification repeatability series load must be approximately 80% Max."
            )

        return RepeatabilityResult(
            series=(result,),
            passed=result.passed,
            source="OIML R 76-1:2006",
            source_clause="A.4.10 / 3.6.1",
        )

    # mode == "type_approval"
    if len(series) != 2:
        raise ValueError(
            "Type approval repeatability requires two series: "
            "approximately 50% Max and approximately 100% Max."
        )

    required_count = 10 if max_capacity < Decimal("1000") else 3

    results = []

    for index, observations in enumerate(series, 1):
        if len(observations) < required_count:
            raise ValueError(
                f"Repeatability series {index} requires at least "
                f"{required_count} weighings for this Max capacity."
            )

        result = _calculate_series(
            accuracy_class=accuracy_class,
            max_capacity=max_capacity,
            e=e,
            observations=observations,
        )

        results.append(result)

    # Verify that the two series are actually around 50% and 100% Max.
    if not (
        abs(results[0].target_load - max_capacity * Decimal("0.5")) <= max(e, max_capacity * Decimal("0.05"))
    ):
        raise ValueError(
            "First repeatability series must be approximately 50% Max."
        )

    if not (
        abs(results[1].target_load - max_capacity) <= max(e, max_capacity * Decimal("0.05"))
    ):
        raise ValueError(
            "Second repeatability series must be approximately 100% Max."
        )

    return RepeatabilityResult(
        series=tuple(results),
        passed=all(item.passed for item in results),
        source="OIML R 76-1:2006",
        source_clause="A.4.10 / 3.6.1",
    )
