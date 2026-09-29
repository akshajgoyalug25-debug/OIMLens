import uuid
from decimal import Decimal
import pytest
from fastapi import HTTPException

from oimlense.r76.executor import execute_test
from backend.r76.routes import get_canonical_test_definition
from tests.sih26035.test_catalog_78_audit import _build_test_inputs


def test_invalid_procedure_code_raises_404():
    with pytest.raises(HTTPException) as exc_info:
        get_canonical_test_definition("NON_EXISTENT_PROCEDURE_CODE_12345")
    assert exc_info.value.status_code == 404
    assert "R76 test definition not found" in exc_info.value.detail


@pytest.mark.parametrize(
    "test_code",
    [
        "ZERO_SETTING_LIMITS",
        "EQUILIBRIUM_STABILITY",
        "WEIGHING_PERFORMANCE",
        "ECCENTRIC_LOADING",
        "TEMPERATURE_STATIC",
        "VOLTAGE_AC",
        "CHECKLIST_EXAMINATION",
    ],
)
def test_target_procedures_execution_and_canonical_uuid(test_code):
    # 1. Verify canonical definition and UUID format
    canonical = get_canonical_test_definition(test_code)
    def_id = canonical["id"]
    
    # Must be valid UUID and NOT start with def-
    parsed_uuid = uuid.UUID(def_id)
    assert str(parsed_uuid) == def_id
    assert not def_id.startswith("def-")
    assert canonical["test_code"] == test_code

    # 2. Build complete test inputs and verify underlying engine execution succeeds
    inputs = _build_test_inputs(test_code)
    result = execute_test(test_code, **inputs)
    assert result.status in ("PASS", "FAIL", "MANUAL_REVIEW")
    assert result.code == test_code
