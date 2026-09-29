from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class CreepResult:
    initial_error: Decimal
    error_at_15_min: Decimal
    error_at_30_min: Decimal
    change_0_to_30: Decimal
    change_15_to_30: Decimal
    threshold_0_to_30: Decimal
    threshold_15_to_30: Decimal
    temperature_change: Decimal
    max_temperature_change: Decimal
    duration_minutes: Decimal
    early_termination_allowed: bool
    passed: bool
    source: str
    source_clause: str
    accuracy_class: str | None = None
    load_close_to_max: bool = True


def calculate_creep(
    initial_error: Decimal,
    error_at_15_min: Decimal,
    error_at_30_min: Decimal,
    temperature_change: Decimal,
    duration_minutes: Decimal = Decimal("30"),
    e: Decimal = Decimal("0.01"),
    accuracy_class: str | None = None,
    load: Decimal | None = None,
    max_capacity: Decimal | None = None,
) -> CreepResult:
    """
    OIML R 76-1:2006 A.4.11.1
    """
    return calculate_creep_with_scale_interval(
        e=e,
        initial_error=initial_error,
        error_at_15_min=error_at_15_min,
        error_at_30_min=error_at_30_min,
        temperature_change=temperature_change,
        duration_minutes=duration_minutes,
        accuracy_class=accuracy_class,
        load=load,
        max_capacity=max_capacity,
    )


def calculate_creep_with_scale_interval(
    e: Decimal,
    initial_error: Decimal,
    error_at_15_min: Decimal,
    error_at_30_min: Decimal,
    temperature_change: Decimal,
    duration_minutes: Decimal = Decimal("30"),
    accuracy_class: str | None = None,
    load: Decimal | None = None,
    max_capacity: Decimal | None = None,
) -> CreepResult:
    """
    Deterministic implementation of R76-1 A.4.11.1.
    """

    if e <= 0:
        raise ValueError("Verification scale interval e must be greater than zero.")

    if duration_minutes <= 0:
        raise ValueError("Test duration must be greater than zero.")

    if accuracy_class is not None:
        accuracy_class_upper = str(accuracy_class).upper().strip()
        if accuracy_class_upper not in {"II", "III", "IIII"}:
            raise ValueError("Creep test A.4.11.1 is applicable only to classes II, III and IIII.")
    else:
        accuracy_class_upper = None

    load_close_to_max = True
    if load is not None and max_capacity is not None:
        load = Decimal(str(load))
        max_capacity = Decimal(str(max_capacity))
        if max_capacity <= 0:
            raise ValueError("Max capacity must be greater than zero.")
        # Load must be close to Max (at least 90% Max or within 5e of Max)
        load_close_to_max = load >= (max_capacity * Decimal("0.9")) or abs(load - max_capacity) <= (Decimal("5") * e)
        if not load_close_to_max:
            raise ValueError(f"Creep test load {load} must be close to Max capacity ({max_capacity}).")

    temperature_change = abs(Decimal(str(temperature_change)))

    change_0_to_30 = abs(Decimal(str(error_at_30_min)) - Decimal(str(initial_error)))
    change_15_to_30 = abs(Decimal(str(error_at_30_min)) - Decimal(str(error_at_15_min)))

    threshold_0_to_30 = Decimal("0.5") * Decimal(str(e))
    threshold_15_to_30 = Decimal("0.2") * Decimal(str(e))

    temperature_ok = temperature_change <= Decimal("2")

    # Early termination after 30 minutes is allowed ONLY if:
    # - indication difference during first 30 min < 0.5e (strict <)
    # - difference between 15 and 30 min < 0.2e (strict <)
    # - temperature condition satisfied
    early_termination_allowed = (
        duration_minutes >= Decimal("30")
        and change_0_to_30 < threshold_0_to_30
        and change_15_to_30 < threshold_15_to_30
        and temperature_ok
    )

    full_test_completed = duration_minutes >= Decimal("240") and change_0_to_30 <= threshold_0_to_30

    passed = (
        temperature_ok
        and load_close_to_max
        and (early_termination_allowed or full_test_completed)
    )

    return CreepResult(
        initial_error=Decimal(str(initial_error)),
        error_at_15_min=Decimal(str(error_at_15_min)),
        error_at_30_min=Decimal(str(error_at_30_min)),
        change_0_to_30=change_0_to_30,
        change_15_to_30=change_15_to_30,
        threshold_0_to_30=threshold_0_to_30,
        threshold_15_to_30=threshold_15_to_30,
        temperature_change=temperature_change,
        max_temperature_change=Decimal("2"),
        duration_minutes=Decimal(str(duration_minutes)),
        early_termination_allowed=early_termination_allowed,
        passed=passed,
        source="OIML R 76-1:2006",
        source_clause="A.4.11.1 / 3.9.4.1",
        accuracy_class=accuracy_class_upper,
        load_close_to_max=load_close_to_max,
    )
