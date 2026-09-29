from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class EccentricityObservation:
    location: str
    load: Decimal
    indication: Decimal
    additional_load: Decimal
    zero_error: Decimal
    raw_error: Decimal
    corrected_error: Decimal
    mpe: Decimal
    passed: bool


@dataclass(frozen=True)
class EccentricityResult:
    observations: tuple[EccentricityObservation, ...]
    passed: bool
    worst_corrected_error: Decimal
    mpe: Decimal
    source: str
    source_clause: str


def calculate_eccentricity(
    observations: list[dict],
    e: Decimal,
    mpe: Decimal,
) -> EccentricityResult:
    """
    OIML R 76-1:2006 A.4.7

    For each eccentricity measurement:
        E  = I + 1/2 e - ΔL - L
        Ec = E - E0

    E0 is the error at or near zero determined prior
    to each eccentricity measurement.
    """

    if e <= 0:
        raise ValueError("Verification scale interval e must be greater than zero.")

    if not observations:
        raise ValueError("At least one eccentricity observation is required.")

    absolute_mpe = abs(mpe)
    results = []

    for index, item in enumerate(observations, 1):
        if "location" not in item or "load" not in item or "indication" not in item:
            raise ValueError(f"Eccentricity observation #{index} missing required fields.")

        location = str(item["location"])
        load = Decimal(str(item["load"]))
        indication = Decimal(str(item["indication"]))
        additional_load = Decimal(str(item.get("additional_load", "0")))
        zero_error = Decimal(str(item.get("zero_error", "0")))

        if load < 0:
            raise ValueError(f"Eccentricity load cannot be negative: {load}")

        raw_error = (
            indication
            + (Decimal("0.5") * e)
            - additional_load
            - load
        )

        corrected_error = raw_error - zero_error
        passed = abs(corrected_error) <= absolute_mpe

        results.append(
            EccentricityObservation(
                location=location,
                load=load,
                indication=indication,
                additional_load=additional_load,
                zero_error=zero_error,
                raw_error=raw_error,
                corrected_error=corrected_error,
                mpe=absolute_mpe,
                passed=passed,
            )
        )

    worst_error = max(
        (abs(obs.corrected_error) for obs in results),
        default=Decimal("0"),
    )

    return EccentricityResult(
        observations=tuple(results),
        passed=all(item.passed for item in results),
        worst_corrected_error=worst_error,
        mpe=absolute_mpe,
        source="OIML R 76-1:2006 / R76-2:2007",
        source_clause="3.6.2 / A.4.7 / R76-2 Section 3",
    )
