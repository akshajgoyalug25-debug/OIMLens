from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from oimlense.r76.mpe_engine import calculate_mpe


@dataclass(frozen=True)
class VoltageObservation:
    voltage: Decimal
    load: Decimal
    indication: Decimal
    additional_load: Decimal
    zero_error: Decimal
    error: Decimal
    corrected_error: Decimal
    mpe: Decimal
    passed: bool


@dataclass(frozen=True)
class VoltageVariationResult:
    test_code: str
    lower_voltage: Decimal
    upper_voltage: Decimal
    observations: tuple[VoltageObservation, ...]
    passed: bool
    measured_error: Decimal
    mpe: Decimal
    source: str
    source_clause: str


def _decimal(value: object) -> Decimal:
    return Decimal(str(value))


def _make_observation(
    *,
    voltage: Decimal,
    load: Decimal,
    indication: Decimal,
    additional_load: Decimal,
    zero_error: Decimal,
    accuracy_class: str,
    e: Decimal,
    max_capacity: Decimal,
) -> VoltageObservation:

    error = (
        indication
        + (Decimal("0.5") * e)
        - additional_load
        - load
    )

    corrected_error = error - zero_error

    mpe_result = calculate_mpe(
        accuracy_class=accuracy_class,
        load=load,
        e=e,
        max_capacity=max_capacity,
    )

    passed = abs(corrected_error) <= mpe_result.mpe

    return VoltageObservation(
        voltage=voltage,
        load=load,
        indication=indication,
        additional_load=additional_load,
        zero_error=zero_error,
        error=error,
        corrected_error=corrected_error,
        mpe=mpe_result.mpe,
        passed=passed,
    )


def _validate(
    *,
    accuracy_class: str,
    e: Decimal,
    max_capacity: Decimal,
    nominal_voltage: Decimal,
    lower_voltage: Decimal,
    upper_voltage: Decimal,
    observations: list[dict],
) -> None:
    if accuracy_class.upper() not in {"I", "II", "III", "IIII"}:
        raise ValueError(f"Unsupported accuracy class: {accuracy_class}")

    if e <= 0:
        raise ValueError("e must be greater than zero.")

    if max_capacity <= 0:
        raise ValueError("Maximum capacity must be greater than zero.")

    if nominal_voltage <= 0:
        raise ValueError("Nominal voltage must be greater than zero.")

    if lower_voltage >= upper_voltage:
        raise ValueError("Lower voltage must be below upper voltage.")

    if not observations:
        raise ValueError("Voltage observations are required.")

    required_voltages = {
        nominal_voltage,
        lower_voltage,
        upper_voltage,
    }

    actual_voltages = {
        _decimal(item["voltage"])
        for item in observations
    }

    missing_voltages = required_voltages - actual_voltages

    if missing_voltages:
        raise ValueError(
            "Missing voltage observations for: "
            + ", ".join(str(v) for v in sorted(missing_voltages))
        )

    minimum_high_load = max_capacity / Decimal("2")
    ten_e = Decimal("10") * e

    # OIML R 76-1:2006 A.5.4 requires:
    # - a 10e test load
    # - one load between 1/2 Max and Max
    #
    # Both loads must be tested at each of:
    # - reference/nominal voltage
    # - lower voltage limit
    # - upper voltage limit
    voltage_loads: dict[Decimal, list[Decimal]] = {
        nominal_voltage: [],
        lower_voltage: [],
        upper_voltage: [],
    }

    for item in observations:
        voltage = _decimal(item["voltage"])
        load = _decimal(item["load"])

        if load <= 0 or load > max_capacity:
            raise ValueError(
                f"Test load {load} is outside the instrument capacity."
            )

        if voltage in voltage_loads:
            voltage_loads[voltage].append(load)

    for voltage, loads in voltage_loads.items():
        if not any(abs(load - ten_e) <= e * Decimal("0.01") for load in loads):
            raise ValueError(
                f"Voltage {voltage} requires a 10e load ({ten_e})."
            )

        if not any(
            minimum_high_load <= load <= max_capacity
            for load in loads
        ):
            raise ValueError(
                f"Voltage {voltage} requires a test load "
                f"between 1/2 Max ({minimum_high_load}) "
                f"and Max ({max_capacity})."
            )

def calculate_voltage_variation(
    *,
    test_code: str,
    accuracy_class: str,
    e: Decimal,
    max_capacity: Decimal,
    nominal_voltage: Decimal,
    lower_voltage: Decimal,
    upper_voltage: Decimal,
    observations: list[dict],
    source_clause: str,
) -> VoltageVariationResult:

    _validate(
        accuracy_class=accuracy_class,
        e=e,
        max_capacity=max_capacity,
        nominal_voltage=nominal_voltage,
        lower_voltage=lower_voltage,
        upper_voltage=upper_voltage,
        observations=observations,
    )

    converted: list[VoltageObservation] = []

    for item in observations:
        converted.append(
            _make_observation(
                voltage=_decimal(item["voltage"]),
                load=_decimal(item["load"]),
                indication=_decimal(item["indication"]),
                additional_load=_decimal(
                    item.get("additional_load", 0)
                ),
                zero_error=_decimal(
                    item.get("zero_error", 0)
                ),
                accuracy_class=accuracy_class,
                e=e,
                max_capacity=max_capacity,
            )
        )

    passed = all(item.passed for item in converted)

    worst = max(
        converted,
        key=lambda item: abs(item.corrected_error),
    )

    return VoltageVariationResult(
        test_code=test_code,
        lower_voltage=lower_voltage,
        upper_voltage=upper_voltage,
        observations=tuple(converted),
        passed=passed,
        measured_error=abs(worst.corrected_error),
        mpe=worst.mpe,
        source="OIML R 76-1:2006",
        source_clause=source_clause,
    )


def calculate_ac_mains_voltage(
    *,
    accuracy_class: str,
    e: Decimal,
    max_capacity: Decimal,
    nominal_voltage: Decimal,
    observations: list[dict],
    minimum_voltage: Decimal | None = None,
    maximum_voltage: Decimal | None = None,
) -> VoltageVariationResult:

    lower = (
        minimum_voltage
        if minimum_voltage is not None
        else nominal_voltage * Decimal("0.85")
    )

    upper = (
        maximum_voltage
        if maximum_voltage is not None
        else nominal_voltage * Decimal("1.10")
    )

    return calculate_voltage_variation(
        test_code="VOLTAGE_AC",
        accuracy_class=accuracy_class,
        e=e,
        max_capacity=max_capacity,
        nominal_voltage=nominal_voltage,
        lower_voltage=lower,
        upper_voltage=upper,
        observations=observations,
        source_clause="A.5.4.1",
    )


def calculate_external_supply_voltage(
    *,
    accuracy_class: str,
    e: Decimal,
    max_capacity: Decimal,
    nominal_voltage: Decimal,
    min_operating_voltage: Decimal,
    observations: list[dict],
    maximum_voltage: Decimal | None = None,
) -> VoltageVariationResult:

    upper = (
        maximum_voltage
        if maximum_voltage is not None
        else nominal_voltage * Decimal("1.20")
    )

    return calculate_voltage_variation(
        test_code="VOLTAGE_EXTERNAL",
        accuracy_class=accuracy_class,
        e=e,
        max_capacity=max_capacity,
        nominal_voltage=nominal_voltage,
        lower_voltage=min_operating_voltage,
        upper_voltage=upper,
        observations=observations,
        source_clause="A.5.4.2",
    )


def calculate_battery_voltage(
    *,
    accuracy_class: str,
    e: Decimal,
    max_capacity: Decimal,
    nominal_voltage: Decimal,
    min_operating_voltage: Decimal,
    observations: list[dict],
    maximum_voltage: Decimal | None = None,
) -> VoltageVariationResult:

    upper = (
        maximum_voltage
        if maximum_voltage is not None
        else nominal_voltage
    )

    return calculate_voltage_variation(
        test_code="VOLTAGE_BATTERY",
        accuracy_class=accuracy_class,
        e=e,
        max_capacity=max_capacity,
        nominal_voltage=nominal_voltage,
        lower_voltage=min_operating_voltage,
        upper_voltage=upper,
        observations=observations,
        source_clause="A.5.4.3",
    )


def calculate_vehicle_battery_voltage(
    *,
    accuracy_class: str,
    e: Decimal,
    max_capacity: Decimal,
    nominal_voltage: Decimal,
    min_operating_voltage: Decimal,
    observations: list[dict],
) -> VoltageVariationResult:

    if nominal_voltage == Decimal("12"):
        upper = Decimal("16")
    elif nominal_voltage == Decimal("24"):
        upper = Decimal("32")
    else:
        raise ValueError(
            "Vehicle battery nominal voltage must be 12 V or 24 V."
        )

    return calculate_voltage_variation(
        test_code="VOLTAGE_VEHICLE",
        accuracy_class=accuracy_class,
        e=e,
        max_capacity=max_capacity,
        nominal_voltage=nominal_voltage,
        lower_voltage=min_operating_voltage,
        upper_voltage=upper,
        observations=observations,
        source_clause="A.5.4.4",
    )
