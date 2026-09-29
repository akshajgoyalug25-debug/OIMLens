from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


ONE_MG = Decimal("0.000001")


@dataclass(frozen=True)
class SensitivityObservation:
    load: Decimal
    mpe: Decimal
    additional_load: Decimal
    permanent_displacement_mm: Decimal
    required_displacement_mm: Decimal
    passed: bool


@dataclass(frozen=True)
class SensitivityResult:
    accuracy_class: str
    max_capacity: Decimal
    mpe: Decimal
    additional_load: Decimal
    permanent_displacement_mm: Decimal
    required_displacement_mm: Decimal
    passed: bool
    source: str
    source_clause: str
    observations: tuple[SensitivityObservation, ...] = ()


def get_required_displacement(
    accuracy_class: str,
    max_capacity: Decimal,
) -> Decimal:
    accuracy_class = accuracy_class.upper()

    if max_capacity <= 0:
        raise ValueError("Maximum capacity must be greater than zero.")

    if accuracy_class in {"I", "II"}:
        return Decimal("1")

    if accuracy_class in {"III", "IIII"}:
        if max_capacity <= Decimal("30"):
            return Decimal("2")
        return Decimal("5")

    raise ValueError(f"Unsupported accuracy class: {accuracy_class}")


def check_sensitivity(
    accuracy_class: str,
    max_capacity: Decimal,
    mpe: Decimal | None = None,
    permanent_displacement_mm: Decimal | None = None,
    observations: list[dict] | None = None,
    e: Decimal | None = None,
) -> SensitivityResult:
    accuracy_class_upper = accuracy_class.upper()
    max_capacity = Decimal(str(max_capacity))
    required = get_required_displacement(accuracy_class_upper, max_capacity)

    if observations is not None and len(observations) > 0:
        if len(observations) < 2:
            raise ValueError("Sensitivity test requires a minimum of two different test loads (e.g. zero and Max).")

        loads = [Decimal(str(item["load"])) for item in observations if "load" in item]
        if len(set(loads)) != len(loads):
            raise ValueError("Sensitivity test observations must use different test loads.")

        obs_results: list[SensitivityObservation] = []
        for index, item in enumerate(observations, 1):
            if "load" not in item or "permanent_displacement_mm" not in item:
                raise ValueError(f"Sensitivity observation #{index} missing load or permanent_displacement_mm.")

            load = Decimal(str(item["load"]))
            perm_disp = Decimal(str(item["permanent_displacement_mm"]))

            if perm_disp < 0:
                raise ValueError(f"Permanent displacement cannot be negative for observation #{index}.")

            if "mpe" in item:
                obs_mpe = Decimal(str(item["mpe"]))
            elif e is not None:
                from oimlense.r76.mpe_engine import calculate_mpe
                obs_mpe = calculate_mpe(accuracy_class_upper, load, Decimal(str(e)), max_capacity).mpe
            elif mpe is not None:
                obs_mpe = Decimal(str(mpe))
            else:
                raise ValueError("Sensitivity observation requires mpe or e parameter.")

            abs_mpe = abs(obs_mpe)
            if abs_mpe <= 0:
                raise ValueError("MPE must be non-zero.")

            additional_load = max(abs_mpe, ONE_MG)
            obs_passed = perm_disp >= required

            obs_results.append(
                SensitivityObservation(
                    load=load,
                    mpe=abs_mpe,
                    additional_load=additional_load,
                    permanent_displacement_mm=perm_disp,
                    required_displacement_mm=required,
                    passed=obs_passed,
                )
            )

        worst_perm_disp = min(obs.permanent_displacement_mm for obs in obs_results)
        worst_mpe = max(obs.mpe for obs in obs_results)
        overall_passed = all(obs.passed for obs in obs_results)

        return SensitivityResult(
            accuracy_class=accuracy_class_upper,
            max_capacity=max_capacity,
            mpe=worst_mpe,
            additional_load=max(worst_mpe, ONE_MG),
            permanent_displacement_mm=worst_perm_disp,
            required_displacement_mm=required,
            passed=overall_passed,
            source="OIML R 76-1:2006 / R76-2:2007",
            source_clause="A.4.9 / R76-2 Section 4.2",
            observations=tuple(obs_results),
        )

    # Legacy single-observation fallback
    if mpe is None or permanent_displacement_mm is None:
        raise ValueError("mpe and permanent_displacement_mm are required for single-observation sensitivity check.")

    absolute_mpe = abs(Decimal(str(mpe)))
    perm_disp = Decimal(str(permanent_displacement_mm))

    if absolute_mpe <= 0:
        raise ValueError("MPE must be non-zero.")

    if perm_disp < 0:
        raise ValueError("Permanent displacement cannot be negative.")

    additional_load = max(absolute_mpe, ONE_MG)

    return SensitivityResult(
        accuracy_class=accuracy_class_upper,
        max_capacity=max_capacity,
        mpe=absolute_mpe,
        additional_load=additional_load,
        permanent_displacement_mm=perm_disp,
        required_displacement_mm=required,
        passed=perm_disp >= required,
        source="OIML R 76-1:2006 / R76-2:2007",
        source_clause="A.4.9 / R76-2 Section 4.2",
        observations=(),
    )
