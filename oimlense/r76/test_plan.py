from __future__ import annotations

from typing import Any

from oimlense.r76.rulepack import load_test_definitions


CONDITIONAL_CLASSES = {"II", "III", "IIII"}


def _normalized(value: Any) -> str:
    return str(value or "").strip().lower()


def _is_non_self_indicating(instrument: dict[str, Any]) -> bool:
    indication_type = _normalized(instrument.get("indication_type"))
    return (
        "non-self" in indication_type
        or indication_type in {"non_self_indicating", "non self indicating"}
    )


def _is_electronic(instrument: dict[str, Any]) -> bool:
    instrument_type = _normalized(instrument.get("instrument_type"))
    weighing_principle = _normalized(instrument.get("weighing_principle"))

    electronic_terms = (
        "electronic",
        "digital",
        "load cell",
        "strain gauge",
    )

    return any(
        term in instrument_type or term in weighing_principle
        for term in electronic_terms
    )


def generate_test_plan(instrument: dict[str, Any]) -> dict[str, Any]:
    """
    Generate a deterministic R76 test plan from the instrument configuration.

    The planner deliberately uses three applicability states:

    - required: applicability can be determined from the available data.
    - conditional: the test may apply, but the current instrument data is
      insufficient to make a definitive decision.
    - review_required: a human must confirm applicability.

    No test is silently removed when the available instrument data is
    insufficient.
    """

    definitions = load_test_definitions().get("tests", [])

    accuracy_class = str(instrument.get("accuracy_class") or "").upper()
    indication_type = _normalized(instrument.get("indication_type"))

    is_multiple_range = bool(instrument.get("is_multiple_range", False))
    is_multi_interval = bool(instrument.get("is_multi_interval", False))
    has_auxiliary = bool(
        instrument.get("has_auxiliary_indicating_device", False)
    )
    tare_device_type = _normalized(instrument.get("tare_device_type", instrument.get("tare_type")))

    plan: list[dict[str, Any]] = []

    for definition in definitions:
        code = definition["code"]

        status = "review_required"
        reason = definition.get(
            "applicability",
            "Applicability requires review.",
        )

        if code == "WEIGHING_PERFORMANCE":
            status = "required"
            reason = "Core weighing performance test."

        elif code in {"CREEP", "ZERO_RETURN", "TILTING_STATIC"}:
            if accuracy_class in CONDITIONAL_CLASSES:
                status = "required"
                reason = (
                    f"Accuracy class {accuracy_class} falls within the "
                    "classes identified by the R76 rulepack."
                )
            else:
                status = "review_required"
                reason = (
                    "Confirm applicability for the selected accuracy class."
                )

        elif code == "SENSITIVITY":
            if _is_non_self_indicating(instrument):
                status = "required"
                reason = (
                    "Instrument indication type is non-self-indicating."
                )
            else:
                status = "review_required"
                reason = (
                    "Sensitivity is identified by the rulepack for "
                    "non-self-indicating instruments; confirm indication type."
                )

        elif code == "MULTI_INTERVAL_WEIGHING":
            if is_multi_interval:
                status = "required"
                reason = "Instrument is configured as multi-interval."
            else:
                status = "not_applicable"
                reason = "Instrument is not configured as multi-interval."

        elif code == "MULTIPLE_RANGE_WEIGHING":
            if is_multiple_range:
                status = "required"
                reason = "Instrument is configured with multiple ranges."
            else:
                status = "not_applicable"
                reason = "Instrument is not configured with multiple ranges."

        elif code == "AUXILIARY_INDICATING":
            if has_auxiliary:
                status = "required"
                reason = "Instrument has an auxiliary indicating device."
            else:
                status = "not_applicable"
                reason = "No auxiliary indicating device is configured."

        elif code in {"VOLTAGE_BATTERY", "VOLTAGE_VEHICLE", "VOLTAGE_AC", "VOLTAGE_EXTERNAL"}:
            status = "review_required"
            reason = (
                "Power-supply configuration is not explicitly stored in "
                "the current instrument schema."
            )

        elif code == "WARM_UP":
            if _is_electronic(instrument):
                status = "required"
                reason = "Instrument configuration indicates electronic operation."
            else:
                status = "review_required"
                reason = (
                    "Confirm whether the instrument is an electronic "
                    "instrument."
                )

        elif code == "ENDURANCE":
            status = "review_required"
            reason = (
                "Endurance applicability depends on instrument type and "
                "specific R76 requirements."
            )

        elif code in {
            "ZERO_RANGE",
            "ZERO_ACCURACY",
            "ECCENTRIC_LOADING",
            "DISCRIMINATION",
            "REPEATABILITY",
            "TEMPERATURE_STATIC",
            "TEMPERATURE_ZERO",
        }:
            status = "review_required"
            reason = definition.get(
                "applicability",
                "Applicability requires instrument-specific review.",
            )

        plan.append(
            {
                "test_code": code,
                "test_name": definition["name"],
                "category": definition.get("category"),
                "source_clause": definition.get("source_clause"),
                "report_clause": definition.get("report_clause"),
                "source_document": "OIML R 76-1:2006",
                "status": status,
                "reason": reason,
            }
        )

    counts = {
        "required": sum(item["status"] == "required" for item in plan),
        "conditional": sum(item["status"] == "conditional" for item in plan),
        "review_required": sum(
            item["status"] == "review_required" for item in plan
        ),
        "not_applicable": sum(
            item["status"] == "not_applicable" for item in plan
        ),
    }

    return {
        "standard": "OIML R 76-1:2006",
        "report_standard": "OIML R 76-2:2007",
        "instrument": {
            "manufacturer": instrument.get("manufacturer"),
            "model": instrument.get("model"),
            "serial_number": instrument.get("serial_number"),
            "instrument_type": instrument.get("instrument_type"),
            "accuracy_class": accuracy_class,
            "indication_type": instrument.get("indication_type"),
            "max_capacity": instrument.get("max_capacity"),
            "min_capacity": instrument.get("min_capacity"),
            "e": instrument.get(
                "verification_scale_interval_e",
                instrument.get("e"),
            ),
            "d": instrument.get(
                "actual_scale_interval_d",
                instrument.get("d"),
            ),
        },
        "counts": counts,
        "tests": plan,
    }
