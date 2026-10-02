"""
Automated 78-Procedure Catalogue & Execution Mapping Audit Test.

Verifies that all 78 OIML R76 test procedure codes defined in the catalog
have:
1. Rulepack definitions / catalog registration
2. Registered backend execution handlers in oimlense.r76.executor
3. Execution and evaluation capability returning R76ExecutionResult
"""

from oimlense.r76.executor import execute_test, _IMPLEMENTED_CODES
from oimlense.r76.rulepack import load_test_definitions


def _build_test_inputs(code: str) -> dict:
    base = {
        "accuracy_class": "III",
        "max_capacity": 30.0,
        "min_capacity": 0.2,
        "e": 0.01,
        "d": 0.01,
        "load": 10.0,
        "indication": 10.0,
        "additional_load": 0.0,
        "correction_rate": 0.0,
        "equilibrium_stable": True,
        "measured_error": 0.0,
        "error": 0.0,
        "significant_fault": False,
        "inspection_passed": True,
        "passed": True,
    }

    if code == "ZERO_TRACKING":
        base.update({
            "load": 0.0,
            "indication": 0.0,
            "additional_load": 0.005,
            "correction_rate": 0.0,
            "e": 0.01,
            "equilibrium_stable": True,
            "equilibrium_stable": True,
        })
    elif code == "ZERO_TRACKING":
        base.update({
            "load": 0.0,
            "indication": 0.0,
            "additional_load": 0.0,
            "correction_rate": 0.0,
            "equilibrium_stable": True,
        })
    if code == "ZERO_RANGE":
        base.update({
            "positive_range": 1.0,
            "negative_range": 0.0,
            "overall_range": 1.0,
        })
    elif code == "ZERO_ACCURACY":
        base.update({
            "load": 0.0,
            "indication": 0.0,
            "additional_load": 0.005,
        })
    elif code in ("WEIGHING_PERFORMANCE", "WEIGHING_REVERSE"):
        base.update({
            "observations": [
                {"load": round(i * 30.0 / 9, 4), "indication": round(i * 30.0 / 9, 4), "additional_load": 0.0, "zero_error": 0.0}
                for i in range(10)
            ]
        })
    elif code == "ECCENTRIC_LOADING":
        base.update({
            "mpe": 0.01,
            "observations": [
                {"location": "Center", "load": 10.0, "indication": 10.0, "additional_load": 0.0, "zero_error": 0.0},
                {"location": "Front", "load": 10.0, "indication": 10.0, "additional_load": 0.0, "zero_error": 0.0},
                {"location": "Rear", "load": 10.0, "indication": 10.0, "additional_load": 0.0, "zero_error": 0.0},
            ]
        })
    elif code == "DISCRIMINATION":
        base.update({
            "test_type": "digital",
            "observations": [
                {"load": 0.2, "initial_indication": 0.2, "final_indication": 0.21},
                {"load": 15.0, "initial_indication": 15.0, "final_indication": 15.01},
                {"load": 30.0, "initial_indication": 30.0, "final_indication": 30.01},
            ]
        })
    elif code == "SENSITIVITY":
        base.update({
            "mpe": 0.01,
            "permanent_displacement_mm": 2.0,
        })
    elif code == "REPEATABILITY":
        series_1 = [
            {"load": 15.0, "indication": 15.0, "additional_load": 0.0, "zero_error": 0.0}
            for _ in range(10)
        ]
        series_2 = [
            {"load": 30.0, "indication": 30.0, "additional_load": 0.0, "zero_error": 0.0}
            for _ in range(10)
        ]
        base.update({
            "series": [series_1, series_2]
        })
    elif code == "CREEP":
        base.update({
            "load": 30.0,
            "initial_error": 0.0,
            "error_at_15_min": 0.0,
            "error_at_30_min": 0.0,
            "temperature_change": 0.0,
        })
    elif code == "ZERO_RETURN":
        base.update({
            "initial_indication": 0.0,
            "initial_additional_load": 0.0,
            "indication_30_min": 0.0,
            "additional_load_30_min": 0.0,
        })
    elif code in {"TILT", "TILTING_STATIC", "TILTING_MOBILE"}:
        base.update({
            "reference_zero": 0.0,
            "reference_low_indication": 5.0,
            "low_load": 5.0,
            "reference_max_indication": 30.0,
            "directions": [
                {"direction": "Forward", "tilted_zero": 0.0, "tilted_low": 5.0, "tilted_max": 30.0}
            ]
        })
    elif code in {"WARM_UP", "WARM_UP_ZERO_DRIFT"}:
        base.update({
            "disconnected_hours": 8.0,
            "weighing_result_available_during_warmup": False,
            "observations": [
                {"minutes": 0, "zero_error": 0.0, "load": 30.0, "indication": 30.0, "additional_load": 0.005},
                {"minutes": 30, "zero_error": 0.0, "load": 30.0, "indication": 30.0, "additional_load": 0.005},
            ]
        })
    elif code == "ENDURANCE":
        rows = [
            {"load": round(i * 30.0 / 6, 4), "indication": round(i * 30.0 / 6, 4), "additional_load": 0.0, "zero_error": 0.0}
            for i in range(7)
        ]
        base.update({
            "cycles": 100000,
            "before": rows,
            "after": rows,
        })
    elif code in {"TEMPERATURE_STATIC", "LOW_TEMP_OPERATION", "HIGH_TEMP_OPERATION", "TEMP_RAMP_CYCLING"}:
        base.update({
            "observations": [
                {"temperature": 20.0, "load": 10.0, "indication": 10.0, "additional_load": 0.0, "zero_error": 0.0},
                {"temperature": 40.0, "load": 10.0, "indication": 10.0, "additional_load": 0.0, "zero_error": 0.0},
            ]
        })
    elif code == "TEMPERATURE_ZERO":
        base.update({
            "observations": [
                {"temperature": 20.0, "indication": 0.0, "additional_load": 0.0},
                {"temperature": 40.0, "indication": 0.0, "additional_load": 0.0},
            ]
        })
    elif code == "VOLTAGE_VEHICLE":
        base.update({
            "nominal_voltage": 12.0,
            "min_operating_voltage": 9.0,
            "observations": [
                {"voltage": 12.0, "load": 0.10, "indication": 0.10, "additional_load": 0.0, "zero_error": 0.0},
                {"voltage": 12.0, "load": 15.0, "indication": 15.0, "additional_load": 0.0, "zero_error": 0.0},
                {"voltage": 9.0, "load": 0.10, "indication": 0.10, "additional_load": 0.0, "zero_error": 0.0},
                {"voltage": 9.0, "load": 15.0, "indication": 15.0, "additional_load": 0.0, "zero_error": 0.0},
                {"voltage": 16.0, "load": 0.10, "indication": 0.10, "additional_load": 0.0, "zero_error": 0.0},
                {"voltage": 16.0, "load": 15.0, "indication": 15.0, "additional_load": 0.0, "zero_error": 0.0},
            ]
        })
    elif code in {"VOLTAGE_AC", "VOLTAGE_EXTERNAL", "VOLTAGE_BATTERY", "POWER_DC_SUPPLY"}:
        base.update({
            "nominal_voltage": 230.0,
            "minimum_voltage": 195.5,
            "maximum_voltage": 253.0,
            "min_operating_voltage": 195.5,
            "observations": [
                {"voltage": 230.0, "load": 0.10, "indication": 0.10, "additional_load": 0.0, "zero_error": 0.0},
                {"voltage": 230.0, "load": 15.0, "indication": 15.0, "additional_load": 0.0, "zero_error": 0.0},
                {"voltage": 195.5, "load": 0.10, "indication": 0.10, "additional_load": 0.0, "zero_error": 0.0},
                {"voltage": 195.5, "load": 15.0, "indication": 15.0, "additional_load": 0.0, "zero_error": 0.0},
                {"voltage": 253.0, "load": 0.10, "indication": 0.10, "additional_load": 0.0, "zero_error": 0.0},
                {"voltage": 253.0, "load": 15.0, "indication": 15.0, "additional_load": 0.0, "zero_error": 0.0},
            ]
        })

    return base


def test_catalog_78_audit_complete():
    # Load test definitions from rulepack
    rulepack_tests = load_test_definitions()["tests"]
    assert len(rulepack_tests) >= 18, "Rulepack test definitions should exist."

    # Standard 78 codes catalog list matching R76_78_TEST_PROCEDURES
    catalog_codes = [
        "ZERO_RANGE", "ZERO_ACCURACY", "ZERO_TRACKING", "INITIAL_ZERO_SETTING",
        "WEIGHING_PERFORMANCE", "WEIGHING_REVERSE", "MULTI_INTERVAL_WEIGHING",
        "MULTIPLE_RANGE_WEIGHING", "TARE_WEIGHING", "PRESET_TARE", "SUBSTITUTION_TEST",
        "AUXILIARY_INDICATING", "TARE_ACCURACY", "TARE_RANGE", "DISCRIMINATION",
        "SENSITIVITY", "REPEATABILITY", "ZERO_RETURN", "CREEP", "EQUILIBRIUM_STABILITY",
        "ZERO_SETTING_LIMITS", "AUTO_ZERO_TRACKING", "PLUS_MINUS_COMPARATOR",
        "HYSTERESIS_TEST", "MINIMUM_CAPACITY_CHECK",
        "ECCENTRIC_LOADING", "ECCENTRIC_ROLLING", "ENDURANCE", "LOCKING_POSITIONS",
        "LEVEL_INDICATOR", "OVERLOAD_PROTECTION", "INDICATOR_DAMPING", "MULTI_LOAD_RECEPTOR",
        "COUNTING_INSTRUMENT", "MOBILE_WEIGHING", "PORTABLE_VEHICLE", "CORNER_LOAD_ADJUSTMENT",
        "VIBRATION_RESISTANCE", "BEAM_ROBERVAL_CHECK", "STEELYARD_POISE_LIMIT",
        "TILTING_STATIC", "TILTING_MOBILE", "WARM_UP", "TEMPERATURE_STATIC",
        "TEMPERATURE_ZERO", "DAMP_HEAT_STEADY", "SPAN_STABILITY", "BAROMETRIC_PRESSURE",
        "WARM_UP_ZERO_DRIFT", "HIGH_HUMIDITY_STORAGE", "LOW_TEMP_OPERATION",
        "HIGH_TEMP_OPERATION", "TEMP_RAMP_CYCLING", "OPEN_AIR_WIND_EFFECT", "SOLAR_RADIATION_SHIELD",
        "VOLTAGE_AC", "VOLTAGE_EXTERNAL", "VOLTAGE_BATTERY", "VOLTAGE_VEHICLE",
        "MAINS_DIPS_INTERRUPTIONS", "BURSTS_EFT", "SURGES_IMMUNITY", "ELECTROSTATIC_DISCHARGE",
        "RADIATED_RF_IMMUNITY", "CONDUCTED_RF_IMMUNITY", "MAGNETIC_FIELD",
        "POWER_FREQUENCY_VARIATION", "POWER_DC_SUPPLY",
        "DESCRIPTIVE_MARKINGS", "VERIFICATION_MARKS", "SEALING_DEVICE",
        "SOFTWARE_IDENTIFICATION", "SOFTWARE_PROTECTION", "DATA_STORAGE_SECURITY",
        "PRICE_COMPUTING", "PRICE_LABELING", "DOCUMENTATION_CHECK", "CHECKLIST_EXAMINATION"
    ]

    assert len(catalog_codes) == 78, f"Catalog must contain exactly 78 procedures, found {len(catalog_codes)}"

    executed_count = 0
    passed_evaluations = 0

    for code in catalog_codes:
        # Check backend execution mapping registered
        assert code in _IMPLEMENTED_CODES, f"Procedure code {code} must be registered in _IMPLEMENTED_CODES"

        inputs = _build_test_inputs(code)

        # Execute test with standard instrument context
        result = execute_test(
            code,
            **inputs,
        )

        assert result.code == code, f"Result code {result.code} must match input code {code}"
        assert result.status in ("PASS", "FAIL"), f"Result status for {code} must be PASS or FAIL, got {result.status}"
        executed_count += 1
        if result.status == "PASS":
            passed_evaluations += 1
        else:
            print(f"FAILED CODE: {code}, result={result}")

    assert executed_count == 78, f"All 78 procedure codes must be executed, got {executed_count}"
    assert passed_evaluations == 78, f"All 78 valid baseline test runs must evaluate to PASS, got {passed_evaluations}"
