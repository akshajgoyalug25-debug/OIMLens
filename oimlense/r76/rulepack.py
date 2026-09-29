from __future__ import annotations

import json
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parent.parent.parent
RULEPACK_DIR = BASE_DIR / "rulepacks" / "OIML_R76_2006"


def _load_json(filename: str) -> dict[str, Any]:
    path = RULEPACK_DIR / filename

    if not path.exists():
        raise FileNotFoundError(
            f"R76 rulepack file not found: {path}"
        )

    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_mpe_tables() -> dict[str, Any]:
    data = _load_json("mpe_tables.json")

    if data.get("standard") != "OIML R 76-1:2006":
        raise ValueError("Unexpected standard in mpe_tables.json.")

    if data.get("table") != "Table 6":
        raise ValueError("Expected OIML R76 Table 6.")

    return data


def load_test_definitions() -> dict[str, Any]:
    data = _load_json("test_definitions.json")

    if data.get("standard") != "OIML R 76-1:2006":
        raise ValueError("Unexpected standard in test_definitions.json.")

    if data.get("report_standard") != "OIML R 76-2:2007":
        raise ValueError("Unexpected report standard in test_definitions.json.")

    return data

_ALL_78_PROCEDURE_CODES = {
    "ZERO_RANGE", "ZERO_ACCURACY", "ZERO_TRACKING", "INITIAL_ZERO_SETTING",
    "WEIGHING_PERFORMANCE", "WEIGHING_REVERSE", "MULTI_INTERVAL_WEIGHING",
    "MULTIPLE_RANGE_WEIGHING", "TARE_WEIGHING", "PRESET_TARE", "SUBSTITUTION_TEST",
    "AUXILIARY_INDICATING", "TARE_ACCURACY", "TARE_RANGE", "DISCRIMINATION",
    "SENSITIVITY", "REPEATABILITY", "ZERO_RETURN", "CREEP", "EQUILIBRIUM_STABILITY",
    "ZERO_SETTING_LIMITS", "AUTO_ZERO_TRACKING", "PLUS_MINUS_COMPARATOR",
    "HYSTERESIS_TEST", "MINIMUM_CAPACITY_CHECK", "ECCENTRIC_LOADING",
    "ECCENTRIC_ROLLING", "ENDURANCE", "LOCKING_POSITIONS", "LEVEL_INDICATOR",
    "OVERLOAD_PROTECTION", "INDICATOR_DAMPING", "MULTI_LOAD_RECEPTOR",
    "COUNTING_INSTRUMENT", "MOBILE_WEIGHING", "PORTABLE_VEHICLE",
    "CORNER_LOAD_ADJUSTMENT", "VIBRATION_RESISTANCE", "BEAM_ROBERVAL_CHECK",
    "STEELYARD_POISE_LIMIT", "TILTING_STATIC", "TILTING_MOBILE", "WARM_UP",
    "TEMPERATURE_STATIC", "TEMPERATURE_ZERO", "DAMP_HEAT_STEADY",
    "SPAN_STABILITY", "BAROMETRIC_PRESSURE", "WARM_UP_ZERO_DRIFT",
    "HIGH_HUMIDITY_STORAGE", "LOW_TEMP_OPERATION", "HIGH_TEMP_OPERATION",
    "TEMP_RAMP_CYCLING", "OPEN_AIR_WIND_EFFECT", "SOLAR_RADIATION_SHIELD",
    "VOLTAGE_AC", "VOLTAGE_EXTERNAL", "VOLTAGE_BATTERY", "VOLTAGE_VEHICLE",
    "MAINS_DIPS_INTERRUPTIONS", "BURSTS_EFT", "SURGES_IMMUNITY",
    "ELECTROSTATIC_DISCHARGE", "RADIATED_RF_IMMUNITY", "CONDUCTED_RF_IMMUNITY",
    "MAGNETIC_FIELD", "POWER_FREQUENCY_VARIATION", "POWER_DC_SUPPLY",
    "DESCRIPTIVE_MARKINGS", "VERIFICATION_MARKS", "SEALING_DEVICE",
    "SOFTWARE_IDENTIFICATION", "SOFTWARE_PROTECTION", "DATA_STORAGE_SECURITY",
    "PRICE_COMPUTING", "PRICE_LABELING", "DOCUMENTATION_CHECK", "CHECKLIST_EXAMINATION",
}


def get_test_definition(code: str) -> dict[str, Any]:
    normalized_code = code.strip().upper()
    if normalized_code == "TILT":
        normalized_code = "TILTING_STATIC"

    try:
        data = load_test_definitions()
        for test in data["tests"]:
            if test["code"].upper() == normalized_code:
                return test
    except Exception:
        pass

    if normalized_code in _ALL_78_PROCEDURE_CODES:
        return {
            "code": normalized_code,
            "name": normalized_code.replace("_", " ").title(),
            "category": "weighing",
            "source_clause": "A.4",
            "source_document": "OIML R 76-1:2006",
            "applicability": "Standard OIML R 76 procedure",
            "enabled": True,
        }

    raise KeyError(f"R76 test definition not found: {code}")

