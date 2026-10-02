from decimal import Decimal

from oimlense.r76.discrimination import (
    check_analog_discrimination,
    check_digital_discrimination,
    check_non_self_indicating_discrimination,
)
from oimlense.r76.eccentricity import calculate_eccentricity
from oimlense.r76.repeatability import calculate_repeatability
from oimlense.r76.sensitivity import check_sensitivity
from oimlense.r76.temperature import calculate_temperature_zero_effect
from oimlense.r76.zero_return import calculate_zero_return


def test_digital_discrimination():
    result = check_digital_discrimination(
        initial_indication=Decimal("100"),
        final_indication=Decimal("100.005"),
        d=Decimal("0.005"),
    )

    assert result.additional_load == Decimal("0.0070")
    assert result.indication_change == Decimal("0.005")
    assert result.passed is True


def test_analog_discrimination():
    result = check_analog_discrimination(
        initial_indication=Decimal("100"),
        final_indication=Decimal("100.010"),
        mpe=Decimal("0.010"),
    )

    assert result.additional_load == Decimal("0.010")
    assert result.threshold == Decimal("0.0070")
    assert result.passed is True


def test_non_self_indicating_discrimination():
    result = check_non_self_indicating_discrimination(
        visible_displacement=True,
        mpe=Decimal("0.010"),
    )

    assert result.additional_load == Decimal("0.004")
    assert result.passed is True


def test_eccentricity_with_individual_zero_errors():
    result = calculate_eccentricity(
        observations=[
            {
                "location": "Position 1",
                "load": "1000",
                "indication": "1001",
                "additional_load": "0",
                "zero_error": "0",
            },
            {
                "location": "Position 2",
                "load": "1000",
                "indication": "1002",
                "additional_load": "0",
                "zero_error": "1",
            },
        ],
        e=Decimal("1"),
        mpe=Decimal("1.5"),
    )

    assert result.observations[0].corrected_error == Decimal("1.5")
    assert result.observations[1].corrected_error == Decimal("1.5")
    assert result.passed is True


def test_repeatability():
    result = calculate_repeatability(
        accuracy_class="III",
        max_capacity=Decimal("100"),
        e=Decimal("0.01"),
        series=[
            [
                {"load": Decimal("50"), "indication": Decimal("50.00"), "additional_load": Decimal("0")},
                {"load": Decimal("50"), "indication": Decimal("50.00"), "additional_load": Decimal("0")},
                {"load": Decimal("50"), "indication": Decimal("50.00"), "additional_load": Decimal("0")},
                {"load": Decimal("50"), "indication": Decimal("50.00"), "additional_load": Decimal("0")},
                {"load": Decimal("50"), "indication": Decimal("50.00"), "additional_load": Decimal("0")},
                {"load": Decimal("50"), "indication": Decimal("50.00"), "additional_load": Decimal("0")},
                {"load": Decimal("50"), "indication": Decimal("50.00"), "additional_load": Decimal("0")},
                {"load": Decimal("50"), "indication": Decimal("50.00"), "additional_load": Decimal("0")},
                {"load": Decimal("50"), "indication": Decimal("50.00"), "additional_load": Decimal("0")},
                {"load": Decimal("50"), "indication": Decimal("50.00"), "additional_load": Decimal("0")},
            ],
            [
                {"load": Decimal("100"), "indication": Decimal("100.00"), "additional_load": Decimal("0")},
                {"load": Decimal("100"), "indication": Decimal("100.00"), "additional_load": Decimal("0")},
                {"load": Decimal("100"), "indication": Decimal("100.00"), "additional_load": Decimal("0")},
                {"load": Decimal("100"), "indication": Decimal("100.00"), "additional_load": Decimal("0")},
                {"load": Decimal("100"), "indication": Decimal("100.00"), "additional_load": Decimal("0")},
                {"load": Decimal("100"), "indication": Decimal("100.00"), "additional_load": Decimal("0")},
                {"load": Decimal("100"), "indication": Decimal("100.00"), "additional_load": Decimal("0")},
                {"load": Decimal("100"), "indication": Decimal("100.00"), "additional_load": Decimal("0")},
                {"load": Decimal("100"), "indication": Decimal("100.00"), "additional_load": Decimal("0")},
                {"load": Decimal("100"), "indication": Decimal("100.00"), "additional_load": Decimal("0")},
            ],
        ],
        mode="type_approval",
    )

    assert result.passed is True


def test_zero_return():
    result = calculate_zero_return(
        initial_indication=Decimal("0"),
        initial_additional_load=Decimal("0"),
        indication_30_min=Decimal("0.004"),
        additional_load_30_min=Decimal("0"),
        e=Decimal("0.01"),
    )

    assert result.change_30_min == Decimal("0.004")
    assert result.passed is True


def test_temperature_zero_effect_class_iii():
    result = calculate_temperature_zero_effect(
        accuracy_class="III",
        observations=[
            {
                "temperature": Decimal("20"),
                "indication": Decimal("0"),
                "additional_load": Decimal("0"),
            },
            {
                "temperature": Decimal("25"),
                "indication": Decimal("0.009"),
                "additional_load": Decimal("0"),
            },
        ],
        e=Decimal("0.01"),
    )

    assert result.passed is True


def test_sensitivity():
    result = check_sensitivity(
        accuracy_class="III",
        max_capacity=Decimal("20"),
        mpe=Decimal("0.010"),
        permanent_displacement_mm=Decimal("2"),
    )

    assert result.required_displacement_mm == Decimal("2")
    assert result.passed is True


def test_sensitivity_multi_observation():
    result = check_sensitivity(
        accuracy_class="III",
        max_capacity=Decimal("20"),
        observations=[
            {"load": Decimal("0"), "permanent_displacement_mm": Decimal("2"), "mpe": Decimal("0.010")},
            {"load": Decimal("20"), "permanent_displacement_mm": Decimal("2.5"), "mpe": Decimal("0.010")},
        ],
    )
    assert result.passed is True
    assert len(result.observations) == 2


def test_sensitivity_multi_observation_failing():
    result = check_sensitivity(
        accuracy_class="III",
        max_capacity=Decimal("20"),
        observations=[
            {"load": Decimal("0"), "permanent_displacement_mm": Decimal("2"), "mpe": Decimal("0.010")},
            {"load": Decimal("20"), "permanent_displacement_mm": Decimal("1.0"), "mpe": Decimal("0.010")},
        ],
    )
    assert result.passed is False


def test_repeatability_verification_mode():
    result = calculate_repeatability(
        accuracy_class="III",
        max_capacity=Decimal("100"),
        e=Decimal("0.01"),
        series=[
            [
                {"load": Decimal("80"), "indication": Decimal("80.00"), "additional_load": Decimal("0")},
                {"load": Decimal("80"), "indication": Decimal("80.00"), "additional_load": Decimal("0")},
                {"load": Decimal("80"), "indication": Decimal("80.00"), "additional_load": Decimal("0")},
            ],
        ],
        mode="verification",
    )
    assert result.passed is True
    assert len(result.series) == 1


def test_creep_early_termination_pass():
    from oimlense.r76.creep import calculate_creep_with_scale_interval
    result = calculate_creep_with_scale_interval(
        e=Decimal("0.01"),
        initial_error=Decimal("0.001"),
        error_at_15_min=Decimal("0.002"),
        error_at_30_min=Decimal("0.003"),
        temperature_change=Decimal("1"),
        duration_minutes=Decimal("30"),
        accuracy_class="III",
        load=Decimal("95"),
        max_capacity=Decimal("100"),
    )
    assert result.early_termination_allowed is True
    assert result.passed is True


def test_creep_early_termination_fail_due_to_temperature():
    from oimlense.r76.creep import calculate_creep_with_scale_interval
    result = calculate_creep_with_scale_interval(
        e=Decimal("0.01"),
        initial_error=Decimal("0.001"),
        error_at_15_min=Decimal("0.002"),
        error_at_30_min=Decimal("0.003"),
        temperature_change=Decimal("3"), # > 2 °C
        duration_minutes=Decimal("30"),
        accuracy_class="III",
    )
    assert result.passed is False


def test_creep_four_hour_completion():
    from oimlense.r76.creep import calculate_creep_with_scale_interval
    result = calculate_creep_with_scale_interval(
        e=Decimal("0.01"),
        initial_error=Decimal("0.001"),
        error_at_15_min=Decimal("0.003"),
        error_at_30_min=Decimal("0.004"), # change 0.003 <= 0.5e
        temperature_change=Decimal("1"),
        duration_minutes=Decimal("240"),
        accuracy_class="III",
    )
    assert result.passed is True


def test_zero_return_multiple_range_continuation():
    result = calculate_zero_return(
        initial_indication=Decimal("0"),
        initial_additional_load=Decimal("0"),
        indication_30_min=Decimal("0.002"),
        additional_load_30_min=Decimal("0"),
        e=Decimal("0.01"),
        indication_35_min=Decimal("0.003"),
        additional_load_35_min=Decimal("0"),
        e1=Decimal("0.005"),
        accuracy_class="III",
    )
    assert result.passed_30_min is True
    assert result.passed_35_min is True
    assert result.passed is True


def test_warmup_disconnection_requirement():
    import pytest
    from oimlense.r76.warm_up import calculate_warm_up
    with pytest.raises(ValueError, match="at least 8 hours of disconnection"):
        calculate_warm_up(
            accuracy_class="III",
            e=Decimal("0.01"),
            max_capacity=Decimal("30"),
            disconnected_hours=Decimal("4"),
            weighing_result_available_during_warmup=False,
            observations=[{"minutes": 0, "load": 30, "indication": 30, "additional_load": 0, "zero_error": 0}],
        )


def test_endurance_cycles_requirement():
    import pytest
    from oimlense.r76.endurance import calculate_endurance
    with pytest.raises(ValueError, match="requires exactly 100000 loading cycles"):
        calculate_endurance(
            accuracy_class="III",
            max_capacity=Decimal("30"),
            e=Decimal("0.01"),
            cycles=50000,
            before=[],
            after=[],
        )

def test_digital_discrimination_strict_sequence_passes():
    result = check_digital_discrimination(
        initial_indication=Decimal("100.000"),
        reduced_indication=Decimal("99.995"),
        final_indication=Decimal("100.005"),
        d=Decimal("0.005"),
        load=Decimal("10"),
    )

    assert result.passed is True
    assert result.indication_change == Decimal("0.005")
    assert result.additional_load == Decimal("0.0070")


def test_digital_discrimination_strict_sequence_fails_wrong_reduction():
    result = check_digital_discrimination(
        initial_indication=Decimal("100.000"),
        reduced_indication=Decimal("99.996"),
        final_indication=Decimal("100.005"),
        d=Decimal("0.005"),
        load=Decimal("10"),
    )

    assert result.passed is False


def test_digital_discrimination_strict_sequence_fails_wrong_final_indication():
    result = check_digital_discrimination(
        initial_indication=Decimal("100.000"),
        reduced_indication=Decimal("99.995"),
        final_indication=Decimal("100.006"),
        d=Decimal("0.005"),
        load=Decimal("10"),
    )

    assert result.passed is False
