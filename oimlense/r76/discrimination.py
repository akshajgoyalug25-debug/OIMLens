from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


ONE_MG = Decimal("0.000001")


@dataclass(frozen=True)
class DiscriminationResult:
    test_type: str
    initial_indication: Decimal | None
    final_indication: Decimal | None
    indication_change: Decimal | None
    additional_load: Decimal
    threshold: Decimal | None
    visible_displacement: bool | None
    passed: bool
    source: str
    source_clause: str
    load: Decimal | None = None


@dataclass(frozen=True)
class DiscriminationSeriesResult:
    test_type: str
    observations: tuple[DiscriminationResult, ...]
    passed: bool
    source: str
    source_clause: str


def check_digital_discrimination(
    initial_indication: Decimal,
    final_indication: Decimal,
    d: Decimal,
    load: Decimal | None = None,
    reduced_indication: Decimal | None = None,
) -> DiscriminationResult:
    """
    OIML R 76-1:2006 A.4.8.2.

    Digital discrimination:
      - applicable when d >= 5 mg
      - reduce the indication by d
      - apply an additional load of 1.4 d
      - the resulting indication should become I + d

    ``reduced_indication`` is optional for backward compatibility with
    the earlier two-indication API. When supplied, the complete
    discrimination sequence is checked.
    """
    d = Decimal(str(d))
    initial_indication = Decimal(str(initial_indication))
    final_indication = Decimal(str(final_indication))

    if d <= 0:
        raise ValueError("Scale interval d must be greater than zero.")

    if d < Decimal("0.000005"):
        raise ValueError(
            "Digital discrimination test requires d >= 5 mg."
        )

    indication_change = final_indication - initial_indication
    additional_load = Decimal("1.4") * d

    if reduced_indication is None:
        # Backward-compatible two-indication API.
        passed = indication_change >= d
    else:
        reduced_indication = Decimal(str(reduced_indication))
        reduced_target = initial_indication - d
        reduced_ok = reduced_indication == reduced_target
        final_ok = final_indication == initial_indication + d
        passed = reduced_ok and final_ok

    return DiscriminationResult(
        test_type="digital",
        load=Decimal(str(load)) if load is not None else None,
        initial_indication=initial_indication,
        final_indication=final_indication,
        indication_change=indication_change,
        additional_load=additional_load,
        threshold=d,
        visible_displacement=None,
        passed=passed,
        source="OIML R 76-1:2006 / R76-2:2007",
        source_clause="3.8 / A.4.8.2 / R76-2 Section 4.1.1",
    )


def check_analog_discrimination(
    initial_indication: Decimal,
    final_indication: Decimal,
    mpe: Decimal,
    load: Decimal | None = None,
) -> DiscriminationResult:
    """
    OIML R 76-1:2006 A.4.8.1.

    Analog discrimination:
      - additional load = absolute MPE, but not less than 1 mg
      - indication change must be at least 0.7 times the
        additional load
    """
    mpe = Decimal(str(mpe))
    initial_indication = Decimal(str(initial_indication))
    final_indication = Decimal(str(final_indication))
    absolute_mpe = abs(mpe)

    if absolute_mpe <= 0:
        raise ValueError("MPE must be non-zero.")

    additional_load = max(absolute_mpe, ONE_MG)
    indication_change = final_indication - initial_indication
    threshold = Decimal("0.7") * additional_load
    passed = indication_change >= threshold

    return DiscriminationResult(
        test_type="analog",
        load=Decimal(str(load)) if load is not None else None,
        initial_indication=initial_indication,
        final_indication=final_indication,
        indication_change=indication_change,
        additional_load=additional_load,
        threshold=threshold,
        visible_displacement=None,
        passed=passed,
        source="OIML R 76-1:2006 / R76-2:2007",
        source_clause="3.8 / A.4.8.1 / R76-2 Section 4.1.2",
    )


def check_non_self_indicating_discrimination(
    visible_displacement: bool,
    mpe: Decimal,
    load: Decimal | None = None,
) -> DiscriminationResult:
    """
    OIML R 76-1:2006 A.4.8.1.

    Non-self-indicating discrimination:
      - additional load = 0.4 times absolute MPE,
        but not less than 1 mg
      - visible displacement is required
    """
    mpe = Decimal(str(mpe))
    absolute_mpe = abs(mpe)

    if absolute_mpe <= 0:
        raise ValueError("MPE must be non-zero.")

    additional_load = max(
        Decimal("0.4") * absolute_mpe,
        ONE_MG,
    )

    return DiscriminationResult(
        test_type="non_self_indicating",
        load=Decimal(str(load)) if load is not None else None,
        initial_indication=None,
        final_indication=None,
        indication_change=None,
        additional_load=additional_load,
        threshold=None,
        visible_displacement=visible_displacement,
        passed=visible_displacement,
        source="OIML R 76-1:2006 / R76-2:2007",
        source_clause="3.8 / A.4.8.1 / R76-2 Section 4.1.3",
    )


def calculate_discrimination(
    test_type: str,
    observations: list[dict],
    d: Decimal | None = None,
    mpe: Decimal | None = None,
) -> DiscriminationSeriesResult:
    """
    Evaluate the three discrimination load conditions.

    The test requires three different loads:
      1. Min
      2. approximately 1/2 Max
      3. Max

    Every load condition must pass.
    """

    normalized_type = str(test_type).strip().lower()

    if normalized_type not in {
        "digital",
        "analog",
        "non_self_indicating",
    }:
        raise ValueError(
            "Unsupported DISCRIMINATION test_type: "
            + normalized_type
        )

    if len(observations) != 3:
        raise ValueError(
            "DISCRIMINATION requires exactly 3 load conditions: "
            "Min, approximately 1/2 Max, and Max."
        )

    results: list[DiscriminationResult] = []

    for index, observation in enumerate(observations, start=1):
        if "load" not in observation:
            raise ValueError(
                f"DISCRIMINATION observation {index} is missing load."
            )

        load = observation["load"]

        if normalized_type in {"digital", "analog"}:
            required = {
                "initial_indication",
                "final_indication",
            }
            missing = sorted(required - observation.keys())

            if missing:
                raise ValueError(
                    f"DISCRIMINATION observation {index} is missing: "
                    + ", ".join(missing)
                )

            if normalized_type == "digital":
                if d is None:
                    raise ValueError(
                        "Digital DISCRIMINATION requires d."
                    )

                result = check_digital_discrimination(
                    initial_indication=observation[
                        "initial_indication"
                    ],
                    final_indication=observation[
                        "final_indication"
                    ],
                    d=d,
                    load=Decimal(str(load)) if load is not None else None,
                    reduced_indication=(
                        observation["reduced_indication"]
                        if "reduced_indication" in observation
                        else None
                    ),
                )
            else:
                if mpe is None:
                    raise ValueError(
                        "Analog DISCRIMINATION requires mpe."
                    )

                result = check_analog_discrimination(
                    initial_indication=observation[
                        "initial_indication"
                    ],
                    final_indication=observation[
                        "final_indication"
                    ],
                    mpe=mpe,
                    load=Decimal(str(load)) if load is not None else None,
                )

        else:
            if "visible_displacement" not in observation:
                raise ValueError(
                    f"DISCRIMINATION observation {index} "
                    "is missing visible_displacement."
                )

            if mpe is None:
                raise ValueError(
                    "Non-self-indicating DISCRIMINATION "
                    "requires mpe."
                )

            result = check_non_self_indicating_discrimination(
                visible_displacement=observation[
                    "visible_displacement"
                ],
                mpe=mpe,
                load=Decimal(str(load)) if load is not None else None,
            )

        results.append(result)

    loads = [r.load for r in results if r.load is not None]
    if len(loads) == 3 and len(set(loads)) != 3:
        raise ValueError("DISCRIMINATION requires three distinct test loads.")

    return DiscriminationSeriesResult(
        test_type=normalized_type,
        observations=tuple(results),
        passed=all(result.passed for result in results),
        source="OIML R 76-1:2006 / R76-2:2007",
        source_clause="A.4.8 / R76-2 Section 4.1",
    )
