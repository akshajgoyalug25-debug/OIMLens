from decimal import Decimal

import pytest

from oimlense.r76.executor import execute_test


def test_weighing_performance_passes():
    result = execute_test(
        "WEIGHING_PERFORMANCE",
        accuracy_class="III",
        e=Decimal("0.01"),
        max_capacity=Decimal("30"),
        observations=[
            {"load": Decimal("0"), "indication": Decimal("0"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("3"), "indication": Decimal("3.000"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("6"), "indication": Decimal("6.005"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("9"), "indication": Decimal("9.005"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("12"), "indication": Decimal("12.005"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("15"), "indication": Decimal("15.005"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("18"), "indication": Decimal("18.005"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("21"), "indication": Decimal("21.005"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("24"), "indication": Decimal("24.005"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("30"), "indication": Decimal("30.005"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
        ],
    )
    assert result.status == "PASS"
    assert result.result.observations[-1].mpe == Decimal("0.015")
    assert result.result.observations[-1].corrected_error == Decimal("0.010")


def test_weighing_performance_fails_above_mpe():
    result = execute_test(
        "WEIGHING_PERFORMANCE",
        accuracy_class="III",
        e=Decimal("0.01"),
        max_capacity=Decimal("30"),
        observations=[
            {"load": Decimal("0"), "indication": Decimal("0"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("3"), "indication": Decimal("3"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("6"), "indication": Decimal("6"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("9"), "indication": Decimal("9"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("12"), "indication": Decimal("12"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("15"), "indication": Decimal("15.020"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("18"), "indication": Decimal("18"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("21"), "indication": Decimal("21"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("24"), "indication": Decimal("24"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
            {"load": Decimal("30"), "indication": Decimal("30"), "additional_load": Decimal("0"), "zero_error": Decimal("0")},
        ],
    )
    assert result.status == "FAIL"
    assert abs(result.result.observations[5].corrected_error) > result.result.observations[5].mpe


def test_weighing_performance_requires_inputs():
    with pytest.raises(ValueError, match="Missing WEIGHING_PERFORMANCE inputs"):
        execute_test(
            "WEIGHING_PERFORMANCE",
            accuracy_class="III",
            load=Decimal("100"),
        )


def test_zero_range_is_implemented():
    result = execute_test(
        "ZERO_RANGE",
        positive_range=Decimal("2"),
        negative_range=Decimal("1"),
        overall_range=Decimal("3"),
        max_capacity=Decimal("200"),
    )
    assert result.status == "PASS"
    assert result.code == "ZERO_RANGE"


def test_eccentric_loading_passes():
    result = execute_test(
        "ECCENTRIC_LOADING",
        observations=[
            {
                "location": "LEFT",
                "load": Decimal("50"),
                "indication": Decimal("50.005"),
                "additional_load": Decimal("0"),
                "zero_error": Decimal("0"),
            },
            {
                "location": "CENTER",
                "load": Decimal("50"),
                "indication": Decimal("50.003"),
                "additional_load": Decimal("0"),
                "zero_error": Decimal("0"),
            },
            {
                "location": "RIGHT",
                "load": Decimal("50"),
                "indication": Decimal("49.995"),
                "additional_load": Decimal("0"),
                "zero_error": Decimal("0"),
            },
        ],
        e=Decimal("0.01"),
        mpe=Decimal("0.015"),
    )

    assert result.status == "PASS"
    assert result.result.passed is True
    assert len(result.result.observations) == 3


def test_eccentric_loading_fails_if_one_observation_exceeds_mpe():
    result = execute_test(
        "ECCENTRIC_LOADING",
        observations=[
            {
                "location": "LEFT",
                "load": Decimal("50"),
                "indication": Decimal("50.005"),
                "additional_load": Decimal("0"),
                "zero_error": Decimal("0"),
            },
            {
                "location": "RIGHT",
                "load": Decimal("50"),
                "indication": Decimal("50.020"),
                "additional_load": Decimal("0"),
                "zero_error": Decimal("0"),
            },
        ],
        e=Decimal("0.01"),
        mpe=Decimal("0.015"),
    )

    assert result.status == "FAIL"
    assert result.result.passed is False


def test_eccentric_loading_requires_inputs():
    with pytest.raises(ValueError, match="Missing ECCENTRIC_LOADING inputs"):
        execute_test(
            "ECCENTRIC_LOADING",
            observations=[],
            e=Decimal("0.01"),
        )


def test_discrimination_digital_passes():
    result = execute_test(
        "DISCRIMINATION",
        test_type="digital",
        initial_indication=Decimal("100.00"),
        final_indication=Decimal("100.01"),
        d=Decimal("0.005"),
    )

    assert result.status == "PASS"
    assert result.result.test_type == "digital"
    assert result.result.additional_load == Decimal("0.0070")


def test_discrimination_analog_passes():
    result = execute_test(
        "DISCRIMINATION",
        test_type="analog",
        initial_indication=Decimal("100.00"),
        final_indication=Decimal("100.02"),
        mpe=Decimal("0.015"),
    )

    assert result.status == "PASS"
    assert result.result.test_type == "analog"
    assert result.result.threshold == Decimal("0.0105")


def test_discrimination_non_self_indicating_passes():
    result = execute_test(
        "DISCRIMINATION",
        test_type="non_self_indicating",
        visible_displacement=True,
        mpe=Decimal("0.015"),
    )

    assert result.status == "PASS"
    assert result.result.test_type == "non_self_indicating"
    assert result.result.visible_displacement is True


def test_discrimination_requires_test_type():
    with pytest.raises(ValueError, match="Missing DISCRIMINATION input"):
        execute_test("DISCRIMINATION")


def test_discrimination_rejects_unknown_test_type():
    with pytest.raises(ValueError, match="Unsupported DISCRIMINATION test_type"):
        execute_test(
            "DISCRIMINATION",
            test_type="unknown",
        )


def test_sensitivity_passes():
    result = execute_test(
        "SENSITIVITY",
        accuracy_class="III",
        max_capacity=Decimal("20"),
        mpe=Decimal("0.015"),
        permanent_displacement_mm=Decimal("2"),
    )

    assert result.status == "PASS"
    assert result.result.required_displacement_mm == Decimal("2")
    assert result.result.additional_load == Decimal("0.015")


def test_sensitivity_fails_below_required_displacement():
    result = execute_test(
        "SENSITIVITY",
        accuracy_class="III",
        max_capacity=Decimal("20"),
        mpe=Decimal("0.015"),
        permanent_displacement_mm=Decimal("1.5"),
    )

    assert result.status == "FAIL"
    assert result.result.passed is False


def test_sensitivity_requires_inputs():
    with pytest.raises(ValueError, match="Missing SENSITIVITY inputs"):
        execute_test(
            "SENSITIVITY",
            accuracy_class="III",
            max_capacity=Decimal("20"),
        )


def test_repeatability_pass():
    result = execute_test(
        "REPEATABILITY",
        accuracy_class="III",
        max_capacity=Decimal("30"),
        e=Decimal("0.01"),
        mode="type_approval",
        series=[
            [
                {
                    "load": Decimal("15"),
                    "indication": Decimal("15.002"),
                    "additional_load": Decimal("0"),
                    "zero_error": Decimal("0"),
                }
                for _ in range(10)
            ],
            [
                {
                    "load": Decimal("30"),
                    "indication": Decimal("30.002"),
                    "additional_load": Decimal("0"),
                    "zero_error": Decimal("0"),
                }
                for _ in range(10)
            ],
        ],
    )

    assert result.status == "PASS"
    assert result.result.passed is True


def test_repeatability_fail():
    result = execute_test(
        "REPEATABILITY",
        accuracy_class="III",
        max_capacity=Decimal("30"),
        e=Decimal("0.01"),
        mode="type_approval",
        series=[
            [
                {
                    "load": Decimal("15"),
                    "indication": Decimal("15.002"),
                    "additional_load": Decimal("0"),
                    "zero_error": Decimal("0"),
                }
                for _ in range(10)
            ],
            [
                {
                    "load": Decimal("30"),
                    "indication": Decimal("30.002"),
                    "additional_load": Decimal("0"),
                    "zero_error": Decimal("0"),
                }
                for _ in range(9)
            ]
            + [
                {
                    "load": Decimal("30"),
                    "indication": Decimal("30.030"),
                    "additional_load": Decimal("0"),
                    "zero_error": Decimal("0"),
                }
            ],
        ],
    )

    assert result.status == "FAIL"
    assert result.result.passed is False


def test_temperature_zero_passes():
    result = execute_test(
        "TEMPERATURE_ZERO",
        accuracy_class="III",
        e=Decimal("0.01"),
        observations=[
            {
                "temperature": Decimal("20"),
                "indication": Decimal("100.000"),
                "additional_load": Decimal("0"),
            },
            {
                "temperature": Decimal("25"),
                "indication": Decimal("100.005"),
                "additional_load": Decimal("0"),
            },
        ],
    )
    assert result.status == "PASS"
    assert result.result.passed is True


def test_temperature_zero_fails():
    result = execute_test(
        "TEMPERATURE_ZERO",
        accuracy_class="III",
        e=Decimal("0.01"),
        observations=[
            {
                "temperature": Decimal("20"),
                "indication": Decimal("100.000"),
                "additional_load": Decimal("0"),
            },
            {
                "temperature": Decimal("25"),
                "indication": Decimal("100.100"),
                "additional_load": Decimal("0"),
            },
        ],
    )
    assert result.status == "FAIL"
    assert result.result.passed is False


def test_temperature_zero_requires_inputs():
    with pytest.raises(ValueError, match="Missing TEMPERATURE_ZERO observations"):
        execute_test(
            "TEMPERATURE_ZERO",
            accuracy_class="III",
            e=Decimal("0.01"),
        )
