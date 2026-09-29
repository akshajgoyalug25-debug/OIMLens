from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any


@dataclass(frozen=True)
class TemperatureObservation:
    temperature: Decimal
    indication: Decimal
    additional_load: Decimal
    p: Decimal


@dataclass(frozen=True)
class TemperatureIntervalResult:
    temperature_1: Decimal
    temperature_2: Decimal
    delta_temperature: Decimal
    p1: Decimal
    p2: Decimal
    delta_p: Decimal
    change_per_required_interval: Decimal
    passed: bool


@dataclass(frozen=True)
class TemperatureZeroResult:
    accuracy_class: str
    observations: tuple[TemperatureObservation, ...]
    intervals: tuple[TemperatureIntervalResult, ...]
    required_temperature_interval_c: Decimal
    e: Decimal
    passed: bool
    worst_change_per_required_interval: Decimal
    source: str
    source_clause: str


def _decimal(value: Any) -> Decimal:
    return Decimal(str(value))


def calculate_temperature_zero_effect(
    *,
    accuracy_class: str,
    observations: list[dict[str, Any]],
    e: Decimal,
) -> TemperatureZeroResult:
    accuracy_class = accuracy_class.upper()
    e = _decimal(e)

    if accuracy_class not in {"I", "II", "III", "IIII"}:
        raise ValueError(f"Unsupported accuracy class: {accuracy_class}")

    if e <= 0:
        raise ValueError(
            "Verification scale interval e must be greater than zero."
        )

    if len(observations) < 2:
        raise ValueError(
            "At least two temperature observations are required."
        )

    required_interval = (
        Decimal("1")
        if accuracy_class == "I"
        else Decimal("5")
    )

    normalized_observations: list[TemperatureObservation] = []

    for index, item in enumerate(observations, start=1):
        try:
            temperature = _decimal(item["temperature"])
            indication = _decimal(item["indication"])
            additional_load = _decimal(item.get("additional_load", 0))
        except (KeyError, TypeError, ValueError) as exc:
            raise ValueError(
                f"Invalid temperature observation #{index}."
            ) from exc

        p = (
            indication
            + (Decimal("0.5") * e)
            - additional_load
        )

        normalized_observations.append(
            TemperatureObservation(
                temperature=temperature,
                indication=indication,
                additional_load=additional_load,
                p=p,
            )
        )

    temperatures = [
        observation.temperature
        for observation in normalized_observations
    ]

    if len(set(temperatures)) != len(temperatures):
        raise ValueError(
            "Temperature observations must use different temperatures."
        )

    intervals: list[TemperatureIntervalResult] = []

    for first, second in zip(
        normalized_observations,
        normalized_observations[1:],
    ):
        delta_temperature = abs(
            second.temperature - first.temperature
        )

        if delta_temperature == 0:
            raise ValueError(
                "Consecutive temperature observations must be different."
            )

        delta_p = abs(second.p - first.p)

        change_per_required_interval = (
            delta_p
            * required_interval
            / delta_temperature
        )

        passed = change_per_required_interval <= e

        intervals.append(
            TemperatureIntervalResult(
                temperature_1=first.temperature,
                temperature_2=second.temperature,
                delta_temperature=delta_temperature,
                p1=first.p,
                p2=second.p,
                delta_p=delta_p,
                change_per_required_interval=(
                    change_per_required_interval
                ),
                passed=passed,
            )
        )

    worst_change = max(
        (
            interval.change_per_required_interval
            for interval in intervals
        ),
        default=Decimal("0"),
    )

    passed = all(interval.passed for interval in intervals)

    return TemperatureZeroResult(
        accuracy_class=accuracy_class,
        observations=tuple(normalized_observations),
        intervals=tuple(intervals),
        required_temperature_interval_c=required_interval,
        e=e,
        passed=passed,
        worst_change_per_required_interval=worst_change,
        source="OIML R 76-1:2006",
        source_clause="A.5.3.2 / 3.9.2.3",
    )
