from oimlense.r76.executor import execute_test


def test_inspection_requires_explicit_result():
    try:
        execute_test("DESCRIPTIVE_MARKINGS")
        assert False, "Missing inspection result should raise ValueError"
    except ValueError:
        pass


def test_inspection_pass():
    result = execute_test(
        "DESCRIPTIVE_MARKINGS",
        inspection_passed=True,
    )
    assert result.status == "PASS"


def test_inspection_fail():
    result = execute_test(
        "DESCRIPTIVE_MARKINGS",
        inspection_passed=False,
    )
    assert result.status == "FAIL"


def test_influence_requires_measurement():
    try:
        execute_test(
            "BAROMETRIC_PRESSURE",
            e=0.01,
        )
        assert False, "Missing measured_error should raise ValueError"
    except ValueError:
        pass


def test_influence_pass():
    result = execute_test(
        "BAROMETRIC_PRESSURE",
        e=0.01,
        measured_error=0.002,
    )
    assert result.status == "PASS"
    assert result.result["absolute_error"] == 0.002


def test_influence_fail():
    result = execute_test(
        "BAROMETRIC_PRESSURE",
        e=0.01,
        measured_error=0.01,
    )
    assert result.status == "FAIL"


def test_influence_cannot_be_overridden():
    result = execute_test(
        "BAROMETRIC_PRESSURE",
        e=0.01,
        measured_error=0.01,
        passed=True,
    )
    assert result.status == "FAIL"

    result = execute_test(
        "BAROMETRIC_PRESSURE",
        e=0.01,
        measured_error=0.002,
        passed=False,
    )
    assert result.status == "PASS"


def test_disturbance_requires_fault_result():
    try:
        execute_test(
            "ELECTROSTATIC_DISCHARGE",
            e=0.01,
        )
        assert False, "Missing significant_fault should raise ValueError"
    except ValueError:
        pass


def test_disturbance_pass():
    result = execute_test(
        "ELECTROSTATIC_DISCHARGE",
        e=0.01,
        significant_fault=False,
    )
    assert result.status == "PASS"


def test_disturbance_fail():
    result = execute_test(
        "ELECTROSTATIC_DISCHARGE",
        e=0.01,
        significant_fault=True,
    )
    assert result.status == "FAIL"
