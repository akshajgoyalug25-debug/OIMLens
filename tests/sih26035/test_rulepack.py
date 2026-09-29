from oimlense.r76.rulepack import load_mpe_tables, load_test_definitions


def test_mpe_rulepack_structure():
    data = load_mpe_tables()

    assert data["standard"] == "OIML R 76-1:2006"
    assert data["table"] == "Table 6"

    assert set(data["classes"]) == {"I", "II", "III", "IIII"}

    for config in data["classes"].values():
        assert len(config["steps"]) == 3

        for step in config["steps"]:
            assert "max_intervals" in step
            assert "multiplier" in step


def test_test_definition_rulepack_structure():
    data = load_test_definitions()

    assert data["standard"] == "OIML R 76-1:2006"
    assert data["report_standard"] == "OIML R 76-2:2007"
    assert data["version"] == "2006"

    tests = data["tests"]

    assert len(tests) == 18

    codes = [test["code"] for test in tests]

    assert len(codes) == len(set(codes))

    for test in tests:
        assert test["code"]
        assert test["name"]
        assert test["category"]
        assert test["source_clause"]


def test_get_test_definition():
    from oimlense.r76.rulepack import get_test_definition

    test = get_test_definition("weighing_performance")

    assert test["code"] == "WEIGHING_PERFORMANCE"
    assert test["name"] == "Weighing performance"
    assert test["source_clause"] == "A.4.4.1"
    assert test["report_clause"] == "R76-2 Section 1"


def test_get_test_definition_unknown_code():
    from oimlense.r76.rulepack import get_test_definition

    try:
        get_test_definition("DOES_NOT_EXIST")
    except KeyError:
        pass
    else:
        raise AssertionError("Unknown R76 test code should raise KeyError.")
