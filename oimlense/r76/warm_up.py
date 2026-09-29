
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from oimlense.r76.mpe_engine import calculate_mpe


@dataclass(frozen=True)
class WarmUpObservation:
    minutes: Decimal
    zero_error: Decimal
    load: Decimal
    indication: Decimal
    additional_load: Decimal
    error: Decimal
    corrected_error: Decimal
    mpe: Decimal
    passed: bool


@dataclass(frozen=True)
class WarmUpResult:
    observations: tuple[WarmUpObservation, ...]
    disconnected_hours: Decimal
    weighing_result_available_during_warmup: bool
    passed: bool
    measured_error: Decimal
    mpe: Decimal
    source: str
    source_clause: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "observations": [
                {
                    "minutes": item.minutes,
                    "zero_error": item.zero_error,
                    "load": item.load,
                    "indication": item.indication,
                    "additional_load": item.additional_load,
                    "error": item.error,
                    "corrected_error": item.corrected_error,
                    "mpe": item.mpe,
                    "passed": item.passed,
                }
                for item in self.observations
            ],
            "disconnected_hours": self.disconnected_hours,
            "weighing_result_available_during_warmup": (
                self.weighing_result_available_during_warmup
            ),
            "passed": self.passed,
            "measured_error": self.measured_error,
            "mpe": self.mpe,
            "source": self.source,
            "source_clause": self.source_clause,
        }


def calculate_warm_up(
    accuracy_class: str,
    e: Decimal,
    max_capacity: Decimal,
    disconnected_hours: Decimal,
    weighing_result_available_during_warmup: bool,
    observations: list[dict[str, Any]],
    is_electronic: bool = True,
) -> WarmUpResult:

    if not is_electronic:
        raise ValueError("Warm-up test A.5.2 applies only to electronic instruments.")

    accuracy_class = accuracy_class.upper()
    e = Decimal(str(e))
    max_capacity = Decimal(str(max_capacity))
    disconnected_hours = Decimal(str(disconnected_hours))

    if e <= 0:
        raise ValueError("Verification scale interval e must be greater than zero.")

    if max_capacity <= 0:
        raise ValueError("Maximum capacity must be greater than zero.")

    if disconnected_hours < 8:
        raise ValueError(
            "OIML R 76-1 A.5.2 requires at least 8 hours of disconnection "
            "before the warm-up test."
        )

    if not observations:
        raise ValueError("At least one warm-up observation is required.")

    results = []

    for item in observations:
        minutes = Decimal(str(item["minutes"]))
        zero_error = Decimal(str(item.get("zero_error", "0")))
        load = Decimal(str(item["load"]))
        indication = Decimal(str(item["indication"]))
        additional_load = Decimal(str(item.get("additional_load", "0")))

        if load < 0:
            raise ValueError("Warm-up test load cannot be negative.")

        if load > max_capacity:
            raise ValueError("Warm-up test load cannot exceed maximum capacity.")

        error = (
            indication
            + Decimal("0.5") * e
            - additional_load
            - load
        )

        corrected_error = error - zero_error

        mpe = calculate_mpe(
            accuracy_class=accuracy_class,
            load=load,
            e=e,
            max_capacity=max_capacity,
        ).mpe

        passed = abs(corrected_error) <= mpe

        results.append(
            WarmUpObservation(
                minutes=minutes,
                zero_error=zero_error,
                load=load,
                indication=indication,
                additional_load=additional_load,
                error=error,
                corrected_error=corrected_error,
                mpe=mpe,
                passed=passed,
            )
        )

    # Validate that observations include the key 0, 5, 15, 30 min checkpoints if 4+ observations provided
    obs_minutes = [obs.minutes for obs in results]
    target_times = [Decimal("0"), Decimal("5"), Decimal("15"), Decimal("30")]
    if len(results) >= 4:
        for t in target_times:
            if not any(abs(m - t) <= Decimal("2") for m in obs_minutes):
                raise ValueError(f"Warm-up test observations should include checkpoint near {t} minutes.")

    overall_passed = (
        not weighing_result_available_during_warmup
        and all(item.passed for item in results)
    )

    measured_error = max(
        (abs(item.corrected_error) for item in results),
        default=Decimal("0"),
    )

    max_mpe = max(
        (item.mpe for item in results),
        default=Decimal("0"),
    )

    return WarmUpResult(
        observations=tuple(results),
        disconnected_hours=disconnected_hours,
        weighing_result_available_during_warmup=(
            weighing_result_available_during_warmup
        ),
        passed=overall_passed,
        measured_error=measured_error,
        mpe=max_mpe,
        source="OIML R 76-1:2006",
        source_clause="A.5.2 / 5.3.5",
    )
