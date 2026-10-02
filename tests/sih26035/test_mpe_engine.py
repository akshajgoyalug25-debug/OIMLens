from decimal import Decimal

from oimlense.r76.mpe_engine import calculate_mpe, calculate_n


def test_calculate_n():
    result = calculate_n(
        max_capacity=Decimal("15"),
        e=Decimal("0.01"),
    )

    assert result == Decimal("1500")


def test_class_iii_mpe_first_zone():
    result = calculate_mpe(
        accuracy_class="III",
        load=Decimal("5"),
        e=Decimal("0.01"),
        max_capacity=Decimal("30"),
    )

    assert result.load_intervals == Decimal("5E+2")
    assert result.mpe_multiplier == Decimal("0.5")
    assert result.mpe == Decimal("0.005")


def test_class_iii_mpe_second_zone():
    result = calculate_mpe(
        accuracy_class="III",
        load=Decimal("10"),
        e=Decimal("0.01"),
        max_capacity=Decimal("30"),
    )

    assert result.load_intervals == Decimal("1E+3")
    assert result.mpe_multiplier == Decimal("1.0")
    assert result.mpe == Decimal("0.010")


def test_class_iii_mpe_third_zone():
    result = calculate_mpe(
        accuracy_class="III",
        load=Decimal("20.01"),
        e=Decimal("0.01"),
        max_capacity=Decimal("30"),
    )

    assert result.load_intervals == Decimal("2001")
    assert result.mpe_multiplier == Decimal("1.5")
    assert result.mpe == Decimal("0.015")


def test_class_iii_exact_zone_boundaries():
    at_500 = calculate_mpe(
        accuracy_class="III",
        load=Decimal("5"),
        e=Decimal("0.01"),
        max_capacity=Decimal("30"),
    )

    at_2000 = calculate_mpe(
        accuracy_class="III",
        load=Decimal("20"),
        e=Decimal("0.01"),
        max_capacity=Decimal("30"),
    )

    assert at_500.mpe_multiplier == Decimal("0.5")
    assert at_2000.mpe_multiplier == Decimal("1.0")


def test_weighing_error_fails_above_mpe():
    from oimlense.r76.mpe_engine import calculate_weighing_error

    result = calculate_weighing_error(
        indication=Decimal("100.015"),
        additional_load=Decimal("0"),
        load=Decimal("100"),
        e=Decimal("0.01"),
        zero_error=Decimal("0"),
        mpe=Decimal("0.015"),
    )

    assert result.corrected_error == Decimal("0.020")
    assert result.passed is False


def test_weighing_error_passes_with_zero_correction():
    from oimlense.r76.mpe_engine import calculate_weighing_error

    result = calculate_weighing_error(
        indication=Decimal("100.005"),
        additional_load=Decimal("0"),
        load=Decimal("100"),
        e=Decimal("0.01"),
        zero_error=Decimal("0"),
        mpe=Decimal("0.010"),
    )

    assert result.corrected_error == Decimal("0.010")
    assert result.passed is True


def test_mpe_class_i_boundaries():
    # Class I: <= 50000e -> 0.5e, <= 200000e -> 1e, > 200000e -> 1.5e
    res1 = calculate_mpe(accuracy_class="I", load=Decimal("50"), e=Decimal("0.001"), max_capacity=Decimal("250"))
    assert res1.mpe == Decimal("0.0005")

    res2 = calculate_mpe(accuracy_class="I", load=Decimal("200"), e=Decimal("0.001"), max_capacity=Decimal("250"))
    assert res2.mpe == Decimal("0.0010")

    res3 = calculate_mpe(accuracy_class="I", load=Decimal("250"), e=Decimal("0.001"), max_capacity=Decimal("250"))
    assert res3.mpe == Decimal("0.0015")


def test_mpe_class_ii_boundaries():
    # Class II: <= 5000e -> 0.5e, <= 20000e -> 1.0e, <= 100000e -> 1.5e
    res1 = calculate_mpe(accuracy_class="II", load=Decimal("5"), e=Decimal("0.001"), max_capacity=Decimal("50"))
    assert res1.mpe == Decimal("0.0005")

    res2 = calculate_mpe(accuracy_class="II", load=Decimal("20"), e=Decimal("0.001"), max_capacity=Decimal("50"))
    assert res2.mpe == Decimal("0.0010")

    res3 = calculate_mpe(accuracy_class="II", load=Decimal("50"), e=Decimal("0.001"), max_capacity=Decimal("50"))
    assert res3.mpe == Decimal("0.0015")


def test_mpe_class_iiii_boundaries():
    # Class IIII: <= 50e -> 0.5e, <= 200e -> 1.0e, <= 1000e -> 1.5e
    res1 = calculate_mpe(accuracy_class="IIII", load=Decimal("5"), e=Decimal("0.1"), max_capacity=Decimal("100"))
    assert res1.mpe == Decimal("0.05")

    res2 = calculate_mpe(accuracy_class="IIII", load=Decimal("20"), e=Decimal("0.1"), max_capacity=Decimal("100"))
    assert res2.mpe == Decimal("0.10")

    res3 = calculate_mpe(accuracy_class="IIII", load=Decimal("100"), e=Decimal("0.1"), max_capacity=Decimal("100"))
    assert res3.mpe == Decimal("0.15")


def test_mpe_in_service_mode():
    res_initial = calculate_mpe(accuracy_class="III", load=Decimal("5"), e=Decimal("0.01"), max_capacity=Decimal("30"), in_service=False)
    res_service = calculate_mpe(accuracy_class="III", load=Decimal("5"), e=Decimal("0.01"), max_capacity=Decimal("30"), in_service=True)
    assert res_service.mpe == res_initial.mpe * 2


def test_invalid_n_rejection():
    import pytest
    # Class III max n is 10000. n=20000 should be rejected.
    with pytest.raises(ValueError, match="Class III instrument requires"):
        calculate_mpe(accuracy_class="III", load=Decimal("10"), e=Decimal("0.001"), max_capacity=Decimal("20"))

def test_oiml_class_iii_weighing_error_at_mpe_boundary():
    from oimlense.r76.mpe_engine import calculate_weighing_error

    # Class III, Max = 30 kg, e = 0.01 kg.
    # At 20 kg (2000e), Table 6 gives MPE = 1.5e = 0.015 kg.
    result = calculate_weighing_error(
        indication=Decimal("20.010"),
        additional_load=Decimal("0"),
        load=Decimal("20"),
        e=Decimal("0.01"),
        zero_error=Decimal("0"),
        mpe=Decimal("0.015"),
    )

    assert result.corrected_error == Decimal("0.015")
    assert result.passed is True


def test_oiml_class_iii_weighing_error_beyond_mpe_boundary():
    from oimlense.r76.mpe_engine import calculate_weighing_error

    # Same Class III reference point, but the corrected error exceeds
    # the allowed 1.5e MPE.
    result = calculate_weighing_error(
        indication=Decimal("20.015"),
        additional_load=Decimal("0"),
        load=Decimal("20"),
        e=Decimal("0.01"),
        zero_error=Decimal("0"),
        mpe=Decimal("0.015"),
    )

    assert result.corrected_error == Decimal("0.020")
    assert result.passed is False
