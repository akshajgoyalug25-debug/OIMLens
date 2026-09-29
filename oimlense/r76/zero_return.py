from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class ZeroReturnResult:
    p0: Decimal
    p30: Decimal
    change_30_min: Decimal
    threshold_30_min: Decimal
    p35: Decimal | None
    change_35_min: Decimal | None
    threshold_35_min: Decimal | None
    passed_30_min: bool
    passed_35_min: bool | None
    passed: bool
    source: str
    source_clause: str
    accuracy_class: str | None = None
    zero_tracking_disabled: bool = True


def calculate_zero_return(
    initial_indication: Decimal,
    initial_additional_load: Decimal,
    indication_30_min: Decimal,
    additional_load_30_min: Decimal,
    e: Decimal,
    indication_35_min: Decimal | None = None,
    additional_load_35_min: Decimal | None = None,
    e1: Decimal | None = None,
    accuracy_class: str | None = None,
    zero_tracking_disabled: bool = True,
) -> ZeroReturnResult:
    if accuracy_class is not None:
        accuracy_class_upper = str(accuracy_class).upper().strip()
        if accuracy_class_upper not in {"II", "III", "IIII"}:
            raise ValueError("Zero return test A.4.11.2 is applicable only to classes II, III and IIII.")
    else:
        accuracy_class_upper = None

    e = Decimal(str(e))
    initial_indication = Decimal(str(initial_indication))
    initial_additional_load = Decimal(str(initial_additional_load))
    indication_30_min = Decimal(str(indication_30_min))
    additional_load_30_min = Decimal(str(additional_load_30_min))

    if e <= 0:
        raise ValueError("Verification scale interval e must be greater than zero.")

    if (indication_35_min is None) != (additional_load_35_min is None):
        raise ValueError(
            "35-minute indication and additional load must be supplied together."
        )

    if indication_35_min is not None and e1 is None:
        raise ValueError(
            "e1 is required for the 35-minute multiple-range check."
        )

    p0 = (
        initial_indication
        + (Decimal("0.5") * e)
        - initial_additional_load
    )

    p30 = (
        indication_30_min
        + (Decimal("0.5") * e)
        - additional_load_30_min
    )

    change_30 = abs(p30 - p0)
    threshold_30 = Decimal("0.5") * e
    passed_30 = change_30 <= threshold_30

    p35 = None
    change_35 = None
    threshold_35 = None
    passed_35 = None

    if indication_35_min is not None:
        e1 = Decimal(str(e1))
        indication_35_min = Decimal(str(indication_35_min))
        additional_load_35_min = Decimal(str(additional_load_35_min))

        if e1 <= 0:
            raise ValueError("e1 must be greater than zero.")

        p35 = (
            indication_35_min
            + (Decimal("0.5") * e)
            - additional_load_35_min
        )

        change_35 = abs(p35 - p30)
        threshold_35 = e1
        passed_35 = change_35 <= threshold_35

    return ZeroReturnResult(
        p0=p0,
        p30=p30,
        change_30_min=change_30,
        threshold_30_min=threshold_30,
        p35=p35,
        change_35_min=change_35,
        threshold_35_min=threshold_35,
        passed_30_min=passed_30,
        passed_35_min=passed_35,
        passed=passed_30 and (
            passed_35 if passed_35 is not None else True
        ),
        source="OIML R 76-1:2006 / R76-2:2007",
        source_clause="A.4.11.2 / R76-2 Section 6.1",
        accuracy_class=accuracy_class_upper,
        zero_tracking_disabled=zero_tracking_disabled,
    )
