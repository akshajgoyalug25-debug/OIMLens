from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any


@dataclass(frozen=True)
class R76ExecutionResult:
    code: str
    name: str
    category: str
    source_clause: str
    report_clause: str | None
    status: str
    result: Any = None
    message: str | None = None


from oimlense.r76.weighing_series import calculate_weighing_series
from oimlense.r76.rulepack import get_test_definition
from oimlense.r76.mpe_engine import calculate_mpe, calculate_weighing_error
from oimlense.r76.eccentricity import calculate_eccentricity
from oimlense.r76.discrimination import (
    check_analog_discrimination,
    check_digital_discrimination,
    check_non_self_indicating_discrimination,
    calculate_discrimination,
)
from oimlense.r76.sensitivity import check_sensitivity
from oimlense.r76.repeatability import calculate_repeatability
from oimlense.r76.creep import calculate_creep_with_scale_interval
from oimlense.r76.zero_return import calculate_zero_return
from oimlense.r76.temperature import calculate_temperature_zero_effect
from oimlense.r76.temperature_static import calculate_temperature_static
from oimlense.r76.endurance import calculate_endurance
from oimlense.r76.zero_setting import (
    calculate_zero_range,
    calculate_zero_accuracy,
    calculate_zero_tracking,
)
from oimlense.r76.tilting import calculate_tilt
from oimlense.r76.warm_up import calculate_warm_up
from oimlense.r76.voltage_variation import (
    calculate_ac_mains_voltage,
    calculate_external_supply_voltage,
    calculate_battery_voltage,
    calculate_vehicle_battery_voltage,
)


_IMPLEMENTED_CODES = {
    # Weighing & Zero (1-25)
    "ZERO_RANGE", "ZERO_ACCURACY", "ZERO_TRACKING", "INITIAL_ZERO_SETTING",
    "WEIGHING_PERFORMANCE", "WEIGHING_REVERSE", "MULTI_INTERVAL_WEIGHING",
    "MULTIPLE_RANGE_WEIGHING", "TARE_WEIGHING", "PRESET_TARE", "SUBSTITUTION_TEST",
    "AUXILIARY_INDICATING", "TARE_ACCURACY", "TARE_RANGE", "DISCRIMINATION",
    "SENSITIVITY", "REPEATABILITY", "ZERO_RETURN", "CREEP", "EQUILIBRIUM_STABILITY",
    "ZERO_SETTING_LIMITS", "AUTO_ZERO_TRACKING", "PLUS_MINUS_COMPARATOR",
    "HYSTERESIS_TEST", "MINIMUM_CAPACITY_CHECK",
    # Mechanical & Construction (26-40)
    "ECCENTRIC_LOADING", "ECCENTRIC_ROLLING", "ENDURANCE", "LOCKING_POSITIONS",
    "LEVEL_INDICATOR", "OVERLOAD_PROTECTION", "INDICATOR_DAMPING", "MULTI_LOAD_RECEPTOR",
    "COUNTING_INSTRUMENT", "MOBILE_WEIGHING", "PORTABLE_VEHICLE", "CORNER_LOAD_ADJUSTMENT",
    "VIBRATION_RESISTANCE", "BEAM_ROBERVAL_CHECK", "STEELYARD_POISE_LIMIT",
    # Environmental & Influence Factors (41-55)
    "TILTING_STATIC", "TILTING_MOBILE", "WARM_UP", "TEMPERATURE_STATIC",
    "TEMPERATURE_ZERO", "DAMP_HEAT_STEADY", "SPAN_STABILITY", "BAROMETRIC_PRESSURE",
    "WARM_UP_ZERO_DRIFT", "HIGH_HUMIDITY_STORAGE", "LOW_TEMP_OPERATION",
    "HIGH_TEMP_OPERATION", "TEMP_RAMP_CYCLING", "OPEN_AIR_WIND_EFFECT", "SOLAR_RADIATION_SHIELD",
    # Electrical & Disturbances (56-68)
    "VOLTAGE_AC", "VOLTAGE_EXTERNAL", "VOLTAGE_BATTERY", "VOLTAGE_VEHICLE",
    "MAINS_DIPS_INTERRUPTIONS", "BURSTS_EFT", "SURGES_IMMUNITY", "ELECTROSTATIC_DISCHARGE",
    "RADIATED_RF_IMMUNITY", "CONDUCTED_RF_IMMUNITY", "MAGNETIC_FIELD",
    "POWER_FREQUENCY_VARIATION", "POWER_DC_SUPPLY",
    # Markings, Software, Documentation (69-78)
    "DESCRIPTIVE_MARKINGS", "VERIFICATION_MARKS", "SEALING_DEVICE",
    "SOFTWARE_IDENTIFICATION", "SOFTWARE_PROTECTION", "DATA_STORAGE_SECURITY",
    "PRICE_COMPUTING", "PRICE_LABELING", "DOCUMENTATION_CHECK", "CHECKLIST_EXAMINATION",
}


def _execute_inspection_test(code: str, inputs: dict[str, Any]) -> R76ExecutionResult:
    test = get_test_definition(code)

    inspection_value = inputs.get("inspection_passed")

    if inspection_value is None:
        inspection_value = inputs.get("passed")

    if inspection_value is None:
        raise ValueError(
            f"{code} requires inspection_passed=True or False."
        )

    if not isinstance(inspection_value, bool):
        raise ValueError(
            f"{code} inspection_passed must be a boolean."
        )

    notes = str(
        inputs.get(
            "notes",
            inputs.get(
                "remarks",
                "Visual/technical inspection completed.",
            ),
        )
    )

    passed = inspection_value

    return R76ExecutionResult(
        code=code,
        name=test["name"],
        category=test.get("category", "inspection"),
        source_clause=test.get("source_clause", "A.4"),
        report_clause=test.get("report_clause"),
        status="PASS" if passed else "FAIL",
        result={
            "passed": passed,
            "inspection_passed": passed,
            "notes": notes,
            "test_code": code,
            "accuracy_class": str(inputs.get("accuracy_class", "III")),
            "max_capacity": (
                float(inputs["max_capacity"])
                if inputs.get("max_capacity") is not None
                else None
            ),
            "e": (
                float(inputs["e"])
                if inputs.get("e") is not None
                else None
            ),
        },
        message=(
            f"Inspection requirement for {test['name']} "
            f"{'satisfied (PASS)' if passed else 'failed (FAIL)'}."
        ),
    )
def _execute_influence_test(
    code: str,
    inputs: dict[str, Any],
) -> R76ExecutionResult:
    test = get_test_definition(code)

    e_value = inputs.get("e")

    if e_value is None:
        raise ValueError(
            f"{code} requires e (verification scale interval)."
        )

    measured_error = inputs.get("measured_error")

    if measured_error is None:
        measured_error = inputs.get("error")

    if measured_error is None:
        raise ValueError(
            f"{code} requires measured_error."
        )

    mpe_value = inputs.get("mpe")

    if mpe_value is None:
        mpe_value = 0.5 * float(e_value)

    measured_error = float(measured_error)
    mpe_value = float(mpe_value)
    e_value = float(e_value)

    passed = abs(measured_error) <= mpe_value

    return R76ExecutionResult(
        code=code,
        name=test["name"],
        category=test.get("category", "environmental"),
        source_clause=test.get("source_clause", "A.5"),
        report_clause=test.get("report_clause"),
        status="PASS" if passed else "FAIL",
        result={
            "passed": passed,
            "measured_error": measured_error,
            "mpe": mpe_value,
            "e": e_value,
            "absolute_error": abs(measured_error),
            "calculation": (
                f"|{measured_error}| <= {mpe_value}"
            ),
            "test_code": code,
        },
        message=(
            f"Influence test {test['name']} "
            f"{'passed' if passed else 'failed'}; "
            f"error={measured_error}, MPE=±{mpe_value}."
        ),
    )
def _execute_disturbance_test(
    code: str,
    inputs: dict[str, Any],
) -> R76ExecutionResult:
    test = get_test_definition(code)

    if "significant_fault" not in inputs:
        raise ValueError(
            f"{code} requires significant_fault=True or False."
        )

    significant_fault = inputs["significant_fault"]

    if not isinstance(significant_fault, bool):
        raise ValueError(
            f"{code} significant_fault must be a boolean."
        )

    e_value = inputs.get("e")

    if e_value is None:
        raise ValueError(
            f"{code} requires e (verification scale interval)."
        )

    e_value = float(e_value)
    passed = not significant_fault

    return R76ExecutionResult(
        code=code,
        name=test["name"],
        category=test.get("category", "electrical"),
        source_clause=test.get("source_clause", "A.5"),
        report_clause=test.get("report_clause"),
        status="PASS" if passed else "FAIL",
        result={
            "passed": passed,
            "significant_fault": significant_fault,
            "e": e_value,
            "mpe": e_value,
            "test_code": code,
            "calculation": (
                "PASS because no significant fault was detected"
                if passed
                else "FAIL because a significant fault was detected"
            ),
        },
        message=(
            f"Disturbance test {test['name']} "
            f"{'passed (no significant fault)' if passed else 'failed (significant fault detected)'}."
        ),
    )
def _execute_generic_metrological_test(
    code: str,
    inputs: dict[str, Any],
) -> R76ExecutionResult:
    test = get_test_definition(code)

    e_value = inputs.get("e")

    if e_value is None:
        raise ValueError(
            f"{code} requires e (verification scale interval)."
        )

    measured_error = inputs.get("measured_error")

    if measured_error is None:
        measured_error = inputs.get("error")

    if measured_error is None:
        raise ValueError(
            f"{code} requires measured_error."
        )

    mpe_value = inputs.get("mpe")

    if mpe_value is None:
        mpe_value = 0.5 * float(e_value)

    measured_error = float(measured_error)
    mpe_value = float(mpe_value)
    e_value = float(e_value)

    passed = abs(measured_error) <= mpe_value

    return R76ExecutionResult(
        code=code,
        name=test["name"],
        category=test.get("category", "weighing"),
        source_clause=test.get("source_clause", "A.4"),
        report_clause=test.get("report_clause"),
        status="PASS" if passed else "FAIL",
        result={
            "passed": passed,
            "measured_error": measured_error,
            "mpe": mpe_value,
            "e": e_value,
            "absolute_error": abs(measured_error),
            "calculation": (
                f"|{measured_error}| <= {mpe_value}"
            ),
            "test_code": code,
        },
        message=(
            f"Procedure {test['name']} "
            f"{'passed' if passed else 'failed'}; "
            f"error={measured_error}, MPE=±{mpe_value}."
        ),
    )
def _execute_weighing_performance(inputs: dict[str, Any]) -> R76ExecutionResult:
    required = {
        "accuracy_class",
        "max_capacity",
        "e",
        "observations",
    }

    missing = sorted(required - inputs.keys())
    if missing:
        raise ValueError(
            "Missing WEIGHING_PERFORMANCE inputs: "
            + ", ".join(missing)
        )

    result = calculate_weighing_series(
        accuracy_class=inputs["accuracy_class"],
        max_capacity=inputs["max_capacity"],
        e=inputs["e"],
        observations=inputs["observations"],
        minimum_observations=10,
        in_service=bool(inputs.get("in_service", False)),
    )

    test = get_test_definition("WEIGHING_PERFORMANCE")

    return R76ExecutionResult(
        code=test["code"],
        name=test["name"],
        category=test["category"],
        source_clause=test["source_clause"],
        report_clause=test.get("report_clause"),
        status="PASS" if result.passed else "FAIL",
        result=result,
    )

def _execute_eccentric_loading(inputs: dict[str, Any]) -> R76ExecutionResult:
    required = {
        "observations",
        "e",
        "mpe",
    }

    missing = sorted(required - inputs.keys())

    if missing:
        raise ValueError(
            "Missing ECCENTRIC_LOADING inputs: "
            + ", ".join(missing)
        )

    result = calculate_eccentricity(
        observations=inputs["observations"],
        e=inputs["e"],
        mpe=inputs["mpe"],
    )

    test = get_test_definition("ECCENTRIC_LOADING")

    return R76ExecutionResult(
        code=test["code"],
        name=test["name"],
        category=test["category"],
        source_clause=test["source_clause"],
        report_clause=test.get("report_clause"),
        status="PASS" if result.passed else "FAIL",
        result=result,
    )


def _execute_discrimination(inputs: dict[str, Any]) -> R76ExecutionResult:
    """
    Execute OIML R76 A.4.8 discrimination.

    New UI/API format:
      observations = [
        {load, initial_indication, final_indication}
      ]

    Legacy format is also accepted for backwards-compatible unit tests.
    """

    if "test_type" not in inputs:
        raise ValueError("Missing DISCRIMINATION input: test_type")

    test_type = str(inputs["test_type"]).strip().lower()

    if test_type not in {"digital", "analog", "non_self_indicating"}:
        raise ValueError(
            f"Unsupported DISCRIMINATION test_type: {test_type}"
        )

    # Backwards-compatible single-observation interface.
    # The full R76 UI uses the 3-observation format below.
    if "observations" not in inputs:
        if test_type in {"digital", "analog"}:
            if (
                "initial_indication" in inputs
                and "final_indication" in inputs
            ):
                if test_type == "digital":
                    result = check_digital_discrimination(
                        initial_indication=inputs["initial_indication"],
                        final_indication=inputs["final_indication"],
                        d=inputs["d"],
                    )
                else:
                    result = check_analog_discrimination(
                        initial_indication=inputs["initial_indication"],
                        final_indication=inputs["final_indication"],
                        mpe=inputs["mpe"],
                    )

                return R76ExecutionResult(
                    code="DISCRIMINATION",
                    name="Discrimination",
                    category="performance",
                    source_clause=result.source_clause,
                    report_clause="A.4.8",
                    status="PASS" if result.passed else "FAIL",
                    result=result,
                )

        if (
            test_type == "non_self_indicating"
            and "visible_displacement" in inputs
        ):
            result = check_non_self_indicating_discrimination(
                visible_displacement=inputs["visible_displacement"],
                mpe=inputs["mpe"],
            )

            return R76ExecutionResult(
                code="DISCRIMINATION",
                name="Discrimination",
                category="performance",
                source_clause=result.source_clause,
                report_clause="A.4.8",
                status="PASS" if result.passed else "FAIL",
                result=result,
            )

        raise ValueError("Missing DISCRIMINATION input: observations")

    observations = inputs["observations"]

    if not isinstance(observations, (list, tuple)):
        raise ValueError("DISCRIMINATION observations must be a list.")

    if len(observations) != 3:
        raise ValueError(
            "DISCRIMINATION requires exactly 3 observations: "
            "Min, intermediate load, and Max."
        )

    min_capacity = inputs.get("min_capacity")
    max_capacity = inputs.get("max_capacity")

    if min_capacity is None:
        raise ValueError("Missing DISCRIMINATION input: min_capacity")

    if max_capacity is None:
        raise ValueError("Missing DISCRIMINATION input: max_capacity")

    min_capacity = Decimal(str(min_capacity))
    max_capacity = Decimal(str(max_capacity))

    if min_capacity < 0:
        raise ValueError("min_capacity must be non-negative.")

    if max_capacity <= min_capacity:
        raise ValueError("max_capacity must be greater than min_capacity.")

    loads = []

    for index, observation in enumerate(observations, start=1):
        if not isinstance(observation, dict):
            raise ValueError(
                f"DISCRIMINATION observation {index} must be an object."
            )

        if "load" not in observation:
            raise ValueError(
                f"DISCRIMINATION observation {index} is missing load."
            )

        load = Decimal(str(observation["load"]))
        loads.append(load)

    if loads[0] != min_capacity:
        raise ValueError(
            "DISCRIMINATION observation 1 must use Min capacity."
        )

    if loads[2] != max_capacity:
        raise ValueError(
            "DISCRIMINATION observation 3 must use Max capacity."
        )

    if not (min_capacity < loads[1] < max_capacity):
        raise ValueError(
            "DISCRIMINATION observation 2 must be strictly between "
            "Min and Max capacity."
        )

    if len(set(loads)) != 3:
        raise ValueError(
            "DISCRIMINATION requires three distinct load conditions."
        )

    if test_type == "digital":
        if "d" not in inputs:
            raise ValueError("Missing DISCRIMINATION input: d")

        result = calculate_discrimination(
            test_type=test_type,
            observations=observations,
            d=inputs["d"],
        )

    else:
        if "mpe" not in inputs:
            raise ValueError("Missing DISCRIMINATION input: mpe")

        result = calculate_discrimination(
            test_type=test_type,
            observations=observations,
            mpe=inputs["mpe"],
        )

    return R76ExecutionResult(
        code="DISCRIMINATION",
        name="Discrimination",
        category="performance",
        source_clause=result.source_clause,
        report_clause="A.4.8",
        status="PASS" if result.passed else "FAIL",
        result=result,
    )

def _execute_sensitivity(inputs: dict[str, Any]) -> R76ExecutionResult:
    if "observations" in inputs:
        result = check_sensitivity(
            accuracy_class=inputs["accuracy_class"],
            max_capacity=inputs["max_capacity"],
            observations=inputs["observations"],
            e=inputs.get("e"),
            mpe=inputs.get("mpe"),
        )
    else:
        required = {
            "accuracy_class",
            "max_capacity",
            "mpe",
            "permanent_displacement_mm",
        }

        missing = sorted(required - inputs.keys())

        if missing:
            raise ValueError(
                "Missing SENSITIVITY inputs: "
                + ", ".join(missing)
            )

        result = check_sensitivity(
            accuracy_class=inputs["accuracy_class"],
            max_capacity=inputs["max_capacity"],
            mpe=inputs["mpe"],
            permanent_displacement_mm=inputs["permanent_displacement_mm"],
        )

    test = get_test_definition("SENSITIVITY")

    return R76ExecutionResult(
        code=test["code"],
        name=test["name"],
        category=test["category"],
        source_clause=test["source_clause"],
        report_clause=test.get("report_clause"),
        status="PASS" if result.passed else "FAIL",
        result=result,
    )


def _execute_repeatability(inputs: dict[str, Any]) -> R76ExecutionResult:
    required = {
        "accuracy_class",
        "max_capacity",
        "e",
        "series",
    }

    missing = sorted(required - inputs.keys())
    if missing:
        raise ValueError(
            "Missing REPEATABILITY inputs: "
            + ", ".join(missing)
        )

    result = calculate_repeatability(
        accuracy_class=inputs["accuracy_class"],
        max_capacity=inputs["max_capacity"],
        e=inputs["e"],
        series=inputs["series"],
        mode=inputs.get("mode", "type_approval"),
    )

    test = get_test_definition("REPEATABILITY")

    return R76ExecutionResult(
        code=test["code"],
        name=test["name"],
        category=test["category"],
        source_clause=test["source_clause"],
        report_clause=test.get("report_clause"),
        status="PASS" if result.passed else "FAIL",
        result=result,
    )

def _execute_creep(inputs: dict[str, Any]) -> R76ExecutionResult:
    required = {
        "e",
        "initial_error",
        "error_at_15_min",
        "error_at_30_min",
        "temperature_change",
    }

    missing = sorted(required - inputs.keys())

    if missing:
        raise ValueError(
            "Missing CREEP inputs: "
            + ", ".join(missing)
        )

    result = calculate_creep_with_scale_interval(
        e=inputs["e"],
        initial_error=inputs["initial_error"],
        error_at_15_min=inputs["error_at_15_min"],
        error_at_30_min=inputs["error_at_30_min"],
        temperature_change=inputs["temperature_change"],
        duration_minutes=inputs.get(
            "duration_minutes",
            Decimal("30"),
        ),
        accuracy_class=inputs.get("accuracy_class"),
        load=inputs.get("load"),
        max_capacity=inputs.get("max_capacity"),
    )

    test = get_test_definition("CREEP")

    return R76ExecutionResult(
        code=test["code"],
        name=test["name"],
        category=test["category"],
        source_clause=test["source_clause"],
        report_clause=test.get("report_clause"),
        status="PASS" if result.passed else "FAIL",
        result=result,
    )


def _execute_zero_return(inputs: dict[str, Any]) -> R76ExecutionResult:
    required = {
        "initial_indication",
        "initial_additional_load",
        "indication_30_min",
        "additional_load_30_min",
        "e",
    }

    missing = sorted(required - inputs.keys())

    if missing:
        raise ValueError(
            "Missing ZERO_RETURN inputs: "
            + ", ".join(missing)
        )

    result = calculate_zero_return(
        initial_indication=inputs["initial_indication"],
        initial_additional_load=inputs["initial_additional_load"],
        indication_30_min=inputs["indication_30_min"],
        additional_load_30_min=inputs["additional_load_30_min"],
        e=inputs["e"],
        indication_35_min=inputs.get("indication_35_min"),
        additional_load_35_min=inputs.get("additional_load_35_min"),
        e1=inputs.get("e1"),
        accuracy_class=inputs.get("accuracy_class"),
    )

    test = get_test_definition("ZERO_RETURN")

    return R76ExecutionResult(
        code=test["code"],
        name=test["name"],
        category=test["category"],
        source_clause=test["source_clause"],
        report_clause=test.get("report_clause"),
        status="PASS" if result.passed else "FAIL",
        result=result,
    )


def _execute_zero_range(inputs: dict[str, Any]) -> R76ExecutionResult:
    required = {
        "positive_range",
        "negative_range",
        "overall_range",
        "max_capacity",
    }
    missing = sorted(required - inputs.keys())

    if missing:
        raise ValueError(
            "Missing ZERO_RANGE inputs: "
            + ", ".join(missing)
        )

    result = calculate_zero_range(
        positive_range=Decimal(str(inputs["positive_range"])),
        negative_range=Decimal(str(inputs["negative_range"])),
        overall_range=Decimal(str(inputs["overall_range"])),
        max_capacity=Decimal(str(inputs["max_capacity"])),
    )

    test = get_test_definition("ZERO_RANGE")

    return R76ExecutionResult(
        code=test["code"],
        name=test["name"],
        category=test["category"],
        source_clause=test["source_clause"],
        report_clause=test.get("report_clause"),
        status="PASS" if result.passed else "FAIL",
        result=result,
    )


def _execute_zero_accuracy(inputs: dict[str, Any]) -> R76ExecutionResult:
    required = {
        "load",
        "indication",
        "additional_load",
        "e",
    }
    missing = sorted(required - inputs.keys())

    if missing:
        raise ValueError(
            "Missing ZERO_ACCURACY inputs: "
            + ", ".join(missing)
        )

    result = calculate_zero_accuracy(
        load=Decimal(str(inputs["load"])),
        indication=Decimal(str(inputs["indication"])),
        additional_load=Decimal(str(inputs["additional_load"])),
        e=Decimal(str(inputs["e"])),
    )

    test = get_test_definition("ZERO_ACCURACY")

    return R76ExecutionResult(
        code=test["code"],
        name=test["name"],
        category=test["category"],
        source_clause=test["source_clause"],
        report_clause=test.get("report_clause"),
        status="PASS" if result.passed else "FAIL",
        result=result,
    )


def _execute_zero_tracking(inputs: dict[str, Any]) -> R76ExecutionResult:
    required = {
        "load",
        "indication",
        "additional_load",
        "e",
        "correction_rate",
        "equilibrium_stable",
    }

    missing = sorted(required - inputs.keys())

    if missing:
        raise ValueError(
            "Missing ZERO_TRACKING inputs: " + ", ".join(missing)
        )

    result = calculate_zero_tracking(
        load=Decimal(str(inputs["load"])),
        indication=Decimal(str(inputs["indication"])),
        additional_load=Decimal(str(inputs["additional_load"])),
        e=Decimal(str(inputs["e"])),
        correction_rate=Decimal(str(inputs["correction_rate"])),
        equilibrium_stable=inputs["equilibrium_stable"],
    )

    test = get_test_definition("ZERO_TRACKING")

    return R76ExecutionResult(
        code=test["code"],
        name=test["name"],
        category=test["category"],
        source_clause=test["source_clause"],
        report_clause=test.get("report_clause"),
        status="PASS" if result.passed else "FAIL",
        result=result,
        message=(
            f"Zero-tracking test "
            f"{'passed' if result.passed else 'failed'}."
        ),
    )


def _execute_tilt(inputs: dict[str, Any], code: str = "TILT") -> R76ExecutionResult:
    required = {
        "accuracy_class",
        "e",
        "max_capacity",
        "reference_zero",
        "reference_low_indication",
        "low_load",
        "reference_max_indication",
        "directions",
    }

    missing = sorted(required - inputs.keys())

    if missing:
        raise ValueError(
            f"Missing {code} inputs: " + ", ".join(missing)
        )

    result = calculate_tilt(
        accuracy_class=str(inputs["accuracy_class"]),
        e=Decimal(str(inputs["e"])),
        max_capacity=Decimal(str(inputs["max_capacity"])),
        reference_zero=Decimal(str(inputs["reference_zero"])),
        reference_low_indication=Decimal(
            str(inputs["reference_low_indication"])
        ),
        low_load=Decimal(str(inputs["low_load"])),
        reference_max_indication=Decimal(
            str(inputs["reference_max_indication"])
        ),
        directions=list(inputs["directions"]),
    )

    test = get_test_definition(code if code in {"TILT", "TILTING_STATIC", "TILTING_MOBILE"} else "TILT")

    return R76ExecutionResult(
        code=code,
        name=test["name"],
        category=test["category"],
        source_clause=test["source_clause"],
        report_clause=test.get("report_clause"),
        status="PASS" if result.passed else "FAIL",
        result=result,
    )


def _execute_warm_up(inputs: dict[str, Any], code: str = "WARM_UP") -> R76ExecutionResult:
    required = {
        "accuracy_class",
        "e",
        "max_capacity",
        "disconnected_hours",
        "weighing_result_available_during_warmup",
        "observations",
    }

    missing = sorted(required - inputs.keys())

    if missing:
        raise ValueError(
            f"Missing {code} inputs: " + ", ".join(missing)
        )

    result = calculate_warm_up(
        accuracy_class=str(inputs["accuracy_class"]),
        e=Decimal(str(inputs["e"])),
        max_capacity=Decimal(str(inputs["max_capacity"])),
        disconnected_hours=Decimal(
            str(inputs["disconnected_hours"])
        ),
        weighing_result_available_during_warmup=bool(
            inputs["weighing_result_available_during_warmup"]
        ),
        observations=list(inputs["observations"]),
    )

    test = get_test_definition(code if code in {"WARM_UP", "WARM_UP_ZERO_DRIFT"} else "WARM_UP")

    return R76ExecutionResult(
        code=code,
        name=test["name"],
        category=test["category"],
        source_clause=test["source_clause"],
        report_clause=test.get("report_clause"),
        status="PASS" if result.passed else "FAIL",
        result=result,
    )



def _execute_endurance(inputs):
    required = [
        "accuracy_class",
        "max_capacity",
        "e",
        "cycles",
        "before",
        "after",
    ]

    missing = [key for key in required if key not in inputs]
    if missing:
        raise ValueError(
            f"ENDURANCE requires: {', '.join(missing)}"
        )

    result = calculate_endurance(
        accuracy_class=inputs["accuracy_class"],
        max_capacity=inputs["max_capacity"],
        e=inputs["e"],
        cycles=inputs["cycles"],
        before=inputs["before"],
        after=inputs["after"],
    )

    return R76ExecutionResult(
        code="ENDURANCE",
        name="Endurance test",
        category="durability",
        source_clause=result.source_clause,
        report_clause="A.6",
        status="PASS" if result.passed else "FAIL",
        result={
            "accuracy_class": str(result.accuracy_class),
            "max_capacity": str(result.max_capacity),
            "endurance_load": str(result.endurance_load),
            "cycles": result.cycles,
            "intrinsic_error": str(result.intrinsic_error),
            "durability_error": str(result.durability_error),
            "mpe": str(result.mpe),
            "passed": result.passed,
            "source": result.source,
            "source_clause": result.source_clause,
        },
        message=(
            f"Durability error = {result.durability_error}; "
            f"MPE = {result.mpe}"
        ),
    )


def _execute_temperature_static(inputs: dict[str, Any], code: str = "TEMPERATURE_STATIC") -> R76ExecutionResult:
    inputs = dict(inputs)

    if "observations" not in inputs:
        raise ValueError(
            f"Missing {code} observations."
        )

    observations = inputs.pop("observations")

    if not isinstance(observations, list):
        raise ValueError(
            f"{code} observations must be a list."
        )

    required = {
        "accuracy_class",
        "e",
        "max_capacity",
    }

    missing = sorted(required - inputs.keys())

    if missing:
        raise ValueError(
            f"Missing {code} inputs: "
            + ", ".join(missing)
        )

    result = calculate_temperature_static(
        accuracy_class=str(inputs["accuracy_class"]),
        max_capacity=Decimal(str(inputs["max_capacity"])),
        e=Decimal(str(inputs["e"])),
        observations=observations,
    )

    test = get_test_definition(code if code in {"TEMPERATURE_STATIC", "LOW_TEMP_OPERATION", "HIGH_TEMP_OPERATION", "TEMP_RAMP_CYCLING"} else "TEMPERATURE_STATIC")

    return R76ExecutionResult(
        code=code,
        name=test["name"],
        category=test["category"],
        source_clause=test["source_clause"],
        report_clause=test.get("report_clause"),
        status="PASS" if result.passed else "FAIL",
        result=result,
    )


def _execute_temperature_zero(inputs: dict[str, Any]) -> R76ExecutionResult:
    inputs = dict(inputs)

    if "observations" not in inputs:
        raise ValueError(
            "Missing TEMPERATURE_ZERO observations."
        )

    observations = inputs.pop("observations")

    if not isinstance(observations, list):
        raise ValueError(
            "TEMPERATURE_ZERO observations must be a list."
        )

    numeric_keys = {
        "e",
    }

    for key in numeric_keys:
        if key in inputs and inputs[key] is not None:
            inputs[key] = Decimal(str(inputs[key]))

    normalized_observations = []

    for index, observation in enumerate(observations, start=1):
        if not isinstance(observation, dict):
            raise ValueError(
                f"Temperature observation #{index} must be an object."
            )

        item = dict(observation)

        for key in (
            "temperature",
            "indication",
            "additional_load",
        ):
            if key not in item:
                raise ValueError(
                    f"Temperature observation #{index} is missing "
                    f"{key}."
                )

            item[key] = Decimal(str(item[key]))

        normalized_observations.append(item)

    required = {
        "accuracy_class",
        "e",
    }

    missing = sorted(required - inputs.keys())

    if missing:
        raise ValueError(
            "Missing TEMPERATURE_ZERO inputs: "
            + ", ".join(missing)
        )

    result = calculate_temperature_zero_effect(
        accuracy_class=inputs["accuracy_class"],
        observations=normalized_observations,
        e=inputs["e"],
    )

    test = get_test_definition("TEMPERATURE_ZERO")

    return R76ExecutionResult(
        code=test["code"],
        name=test["name"],
        category=test["category"],
        source_clause=test["source_clause"],
        report_clause=test.get("report_clause"),
        status="PASS" if result.passed else "FAIL",
        result=result,
    )


def _execute_voltage(inputs: dict[str, Any], code: str, requested_code: str | None = None) -> R76ExecutionResult:
    inputs = dict(inputs)
    target_code = requested_code or code

    numeric_keys = {
        "e",
        "max_capacity",
        "nominal_voltage",
        "minimum_voltage",
        "maximum_voltage",
        "min_operating_voltage",
    }

    for key in numeric_keys:
        if key in inputs and inputs[key] is not None:
            inputs[key] = Decimal(str(inputs[key]))

    observations = inputs.pop("observations", None)

    if not observations:
        raise ValueError(
            f"Missing voltage observations for {target_code}."
        )

    if not isinstance(observations, list):
        raise ValueError(
            f"Voltage observations for {target_code} must be a list."
        )

    common = {
        "accuracy_class": inputs["accuracy_class"],
        "e": inputs["e"],
        "max_capacity": inputs["max_capacity"],
        "nominal_voltage": inputs["nominal_voltage"],
        "observations": observations,
    }

    if code == "VOLTAGE_AC":
        result = calculate_ac_mains_voltage(
            **common,
            minimum_voltage=inputs.get("minimum_voltage"),
            maximum_voltage=inputs.get("maximum_voltage"),
        )

    elif code == "VOLTAGE_EXTERNAL":
        result = calculate_external_supply_voltage(
            **common,
            min_operating_voltage=inputs["min_operating_voltage"],
            maximum_voltage=inputs.get("maximum_voltage"),
        )

    elif code == "VOLTAGE_BATTERY":
        result = calculate_battery_voltage(
            **common,
            min_operating_voltage=inputs["min_operating_voltage"],
            maximum_voltage=inputs.get("maximum_voltage"),
        )

    elif code == "VOLTAGE_VEHICLE":
        result = calculate_vehicle_battery_voltage(
            **common,
            min_operating_voltage=inputs["min_operating_voltage"],
        )

    else:
        raise ValueError(f"Unsupported voltage test: {code}")

    test = get_test_definition(target_code)

    return R76ExecutionResult(
        code=target_code,
        name=test["name"],
        category=test["category"],
        source_clause=test["source_clause"],
        report_clause=test.get("report_clause"),
        status="PASS" if result.passed else "FAIL",
        result=result,
        message=(
            "All voltage-variation observations are within MPE."
            if result.passed
            else "One or more voltage-variation observations exceed MPE."
        ),
    )

def _decimalize_r76_inputs(value):
    """
    Convert incoming floating-point numbers to Decimal recursively.

    R76 calculations use Decimal for measurement arithmetic. Keeping
    integers as integers preserves things such as cycle counts and
    durations used by range()/integer logic.
    """
    if isinstance(value, float):
        return Decimal(str(value))

    if isinstance(value, dict):
        return {
            key: _decimalize_r76_inputs(item)
            for key, item in value.items()
        }

    if isinstance(value, list):
        return [_decimalize_r76_inputs(item) for item in value]

    if isinstance(value, tuple):
        return tuple(_decimalize_r76_inputs(item) for item in value)

    return value


def execute_test(code: str, **inputs: Any) -> R76ExecutionResult:
    inputs = _decimalize_r76_inputs(inputs)
    test = get_test_definition(code)

    normalized_code = test["code"]

    if normalized_code not in _IMPLEMENTED_CODES:
        return R76ExecutionResult(
            code=normalized_code,
            name=test["name"],
            category=test["category"],
            source_clause=test["source_clause"],
            report_clause=test.get("report_clause"),
            status="NOT_IMPLEMENTED",
            message=(
                "The R76 test is defined in the rulepack, "
                "but its deterministic calculator has not yet been implemented."
            ),
        )

    if normalized_code == "WEIGHING_PERFORMANCE":
        return _execute_weighing_performance(inputs)

    if normalized_code == "ECCENTRIC_LOADING":
        return _execute_eccentric_loading(inputs)

    if normalized_code == "DISCRIMINATION":
        return _execute_discrimination(inputs)

    if normalized_code == "SENSITIVITY":
        return _execute_sensitivity(inputs)

    if normalized_code == "REPEATABILITY":
        return _execute_repeatability(inputs)

    if normalized_code == "CREEP":
        return _execute_creep(inputs)

    if normalized_code == "ZERO_RETURN":
        return _execute_zero_return(inputs)

    if normalized_code == "ZERO_RANGE":
        return _execute_zero_range(inputs)

    if normalized_code == "ZERO_ACCURACY":
        return _execute_zero_accuracy(inputs)

    if normalized_code == "ZERO_TRACKING":
        return _execute_zero_tracking(inputs)

    if normalized_code in {"TILT", "TILTING_STATIC", "TILTING_MOBILE"}:
        return _execute_tilt(inputs, normalized_code)

    if normalized_code in {"WARM_UP", "WARM_UP_ZERO_DRIFT"}:
        return _execute_warm_up(inputs, normalized_code)

    if normalized_code == "ENDURANCE":
        return _execute_endurance(inputs)

    if normalized_code in {"TEMPERATURE_STATIC", "LOW_TEMP_OPERATION", "HIGH_TEMP_OPERATION", "TEMP_RAMP_CYCLING"}:
        return _execute_temperature_static(inputs, normalized_code)

    if normalized_code == "TEMPERATURE_ZERO":
        return _execute_temperature_zero(inputs)

    if normalized_code in {
        "VOLTAGE_AC",
        "VOLTAGE_EXTERNAL",
        "VOLTAGE_BATTERY",
        "VOLTAGE_VEHICLE",
        "POWER_DC_SUPPLY",
    }:
        exec_code = normalized_code if normalized_code in {"VOLTAGE_AC", "VOLTAGE_EXTERNAL", "VOLTAGE_BATTERY", "VOLTAGE_VEHICLE"} else "VOLTAGE_EXTERNAL"
        return _execute_voltage(inputs, exec_code, requested_code=normalized_code)

    if normalized_code in {
        "MAINS_DIPS_INTERRUPTIONS", "BURSTS_EFT", "SURGES_IMMUNITY",
        "ELECTROSTATIC_DISCHARGE", "RADIATED_RF_IMMUNITY", "CONDUCTED_RF_IMMUNITY",
        "MAGNETIC_FIELD", "POWER_FREQUENCY_VARIATION",
    }:
        return _execute_disturbance_test(normalized_code, inputs)

    if normalized_code in {
        "DAMP_HEAT_STEADY", "SPAN_STABILITY", "BAROMETRIC_PRESSURE",
        "HIGH_HUMIDITY_STORAGE", "OPEN_AIR_WIND_EFFECT", "SOLAR_RADIATION_SHIELD",
    }:
        return _execute_influence_test(normalized_code, inputs)

    if normalized_code in {
        "DESCRIPTIVE_MARKINGS", "VERIFICATION_MARKS", "SEALING_DEVICE",
        "SOFTWARE_IDENTIFICATION", "SOFTWARE_PROTECTION", "DATA_STORAGE_SECURITY",
        "PRICE_COMPUTING", "PRICE_LABELING", "DOCUMENTATION_CHECK", "CHECKLIST_EXAMINATION",
        "LOCKING_POSITIONS", "LEVEL_INDICATOR", "OVERLOAD_PROTECTION", "INDICATOR_DAMPING",
        "MULTI_LOAD_RECEPTOR", "COUNTING_INSTRUMENT", "MOBILE_WEIGHING", "PORTABLE_VEHICLE",
        "CORNER_LOAD_ADJUSTMENT", "VIBRATION_RESISTANCE", "BEAM_ROBERVAL_CHECK", "STEELYARD_POISE_LIMIT",
    }:
        return _execute_inspection_test(normalized_code, inputs)

    return _execute_generic_metrological_test(normalized_code, inputs)
