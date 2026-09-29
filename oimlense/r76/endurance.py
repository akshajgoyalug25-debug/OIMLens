from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from oimlense.r76.weighing_series import calculate_weighing_series


@dataclass(frozen=True)
class EnduranceResult:
    accuracy_class: str
    max_capacity: Decimal
    endurance_load: Decimal
    cycles: int
    intrinsic_error: Decimal
    durability_error: Decimal
    mpe: Decimal
    before_passed: bool
    after_passed: bool
    passed: bool
    source: str
    source_clause: str


def calculate_endurance(
    *,
    accuracy_class: str,
    max_capacity: Decimal,
    e: Decimal,
    cycles: int,
    before: list[dict[str, Any]],
    after: list[dict[str, Any]],
) -> EnduranceResult:

    accuracy_class = str(accuracy_class).upper().strip()
    max_capacity = Decimal(str(max_capacity))
    e = Decimal(str(e))
    cycles = int(cycles)

    if accuracy_class not in {"II", "III", "IIII"}:
        raise ValueError(
            "A.6 endurance applies only to classes II, III and IIII."
        )

    if max_capacity <= 0:
        raise ValueError("max_capacity must be greater than zero.")

    if max_capacity > Decimal("100"):
        raise ValueError(
            "A.6 endurance applies only when Max is 100 kg or less."
        )

    if e <= 0:
        raise ValueError("e must be greater than zero.")

    if cycles != 100000:
        raise ValueError(
            "A.6 requires exactly 100000 loading cycles."
        )

    endurance_load = max_capacity * Decimal("0.5")

    min_obs = min(len(before), len(after))
    if min_obs < 1:
        raise ValueError("Endurance before and after observation series cannot be empty.")

    # A.4.4.1 weighing test before endurance.
    before_result = calculate_weighing_series(
        accuracy_class=accuracy_class,
        max_capacity=max_capacity,
        e=e,
        observations=before,
        minimum_observations=min_obs,
    )

    # A.4.4.1 weighing test after endurance.
    after_result = calculate_weighing_series(
        accuracy_class=accuracy_class,
        max_capacity=max_capacity,
        e=e,
        observations=after,
        minimum_observations=min_obs,
    )

    before_errors = [
        item.corrected_error
        for item in before_result.observations
    ]

    after_errors = [
        item.corrected_error
        for item in after_result.observations
    ]

    intrinsic_error = max(
        before_errors,
        key=lambda x: abs(x),
    )

    durability_error = max(
        (
            abs(after_error - before_error)
            for before_error, after_error
            in zip(before_errors, after_errors)
        ),
        default=Decimal("0"),
    )

    # Durability error is assessed against the applicable MPE.
    mpe = max(
        (item.mpe for item in after_result.observations),
        default=Decimal("0"),
    )

    passed = (
        before_result.passed
        and after_result.passed
        and durability_error <= abs(mpe)
    )

    return EnduranceResult(
        accuracy_class=accuracy_class,
        max_capacity=max_capacity,
        endurance_load=endurance_load,
        cycles=cycles,
        intrinsic_error=intrinsic_error,
        durability_error=durability_error,
        mpe=mpe,
        before_passed=before_result.passed,
        after_passed=after_result.passed,
        passed=passed,
        source="OIML R 76-1:2006",
        source_clause="A.6 / 3.9.4.3",
    )
