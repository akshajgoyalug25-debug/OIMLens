from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from backend.deps import get_current_user
from backend.r76.db import get_db

from oimlense.r76.executor import execute_test
from oimlense.r76.rulepack import get_test_definition, _ALL_78_PROCEDURE_CODES


router = APIRouter(
    prefix="/api/r76",
    tags=["R76"],
)


# ============================================================
# Helpers
# ============================================================

R76_TEST_DEF_NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")


def get_canonical_test_definition(test_code: str, db=None) -> dict[str, Any]:
    normalized_code = test_code.strip().upper()

    try:
        rulepack_def = get_test_definition(normalized_code)
    except KeyError:
        raise HTTPException(
            status_code=404,
            detail=f"R76 test definition not found: {test_code}",
        )

    def_uuid = str(uuid.uuid5(R76_TEST_DEF_NAMESPACE, f"oimlense.r76.test_definition.{normalized_code}"))

    if db is not None:
        try:
            db_res = (
                db.table("test_definitions")
                .select("*")
                .or_(f"id.eq.{def_uuid},test_code.eq.{normalized_code}")
                .limit(1)
                .execute()
            )
            if db_res.data:
                return db_res.data[0]
        except Exception:
            pass

    canonical = {
        "id": def_uuid,
        "test_code": normalized_code,
        "test_name": rulepack_def.get("name") or rulepack_def.get("test_name") or normalized_code.replace("_", " ").title(),
        "description": rulepack_def.get("applicability") or f"OIML R76 test procedure {normalized_code}",
        "category": rulepack_def.get("category", "weighing"),
        "source_document": rulepack_def.get("source_document", "OIML R 76-1:2006"),
        "source_clause": rulepack_def.get("source_clause", "A.4"),
        "report_clause": rulepack_def.get("report_clause"),
        "rule_version": rulepack_def.get("rule_version", "2006"),
        "enabled": rulepack_def.get("enabled", True),
    }

    if db is not None:
        # Attempt auto-seed if allowed by DB policy
        try:
            # Send only columns that match PostgREST schema to avoid PGRST204
            seed_payload = {
                "id": def_uuid,
                "test_code": normalized_code,
                "test_name": canonical["test_name"],
                "description": canonical["description"],
                "source_document": canonical["source_document"],
                "source_clause": canonical["source_clause"],
                "rule_version": canonical["rule_version"],
                "enabled": canonical["enabled"],
            }
            db.table("test_definitions").upsert(seed_payload, on_conflict="test_code").execute()
            
            # Re-query
            check_res = (
                db.table("test_definitions")
                .select("*")
                .eq("test_code", normalized_code)
                .limit(1)
                .execute()
            )
            if check_res.data:
                return check_res.data[0]
        except Exception as e:
            print(f"Notice: Could not auto-seed test definition {normalized_code}: {e}")

        # If definition still does not exist in DB, raise clean 400 error to prevent foreign key 500 error
        raise HTTPException(
            status_code=400,
            detail=f"R76 test definition is not registered in database: {normalized_code}. Please execute docs/sih26035/SEED_78_TEST_DEFINITIONS.sql in Supabase SQL Editor.",
        )

    return canonical



def _first_or_404(response, detail: str):
    data = getattr(response, "data", None)

    if not data:
        raise HTTPException(status_code=404, detail=detail)

    return data[0] if isinstance(data, list) else data


def _first_or_500(response, detail: str):
    data = getattr(response, "data", None)

    if not data:
        raise HTTPException(status_code=500, detail=detail)

    return data[0] if isinstance(data, list) else data


def _get_session_tokens(request: Request):
    access_token = request.cookies.get("sb_access_token")
    refresh_token = request.cookies.get("sb_refresh_token")

    if not access_token or not refresh_token:
        auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            bearer_token = auth_header.split(" ", 1)[1]
            return bearer_token, bearer_token

    if not access_token or not refresh_token:
        raise HTTPException(
            status_code=401,
            detail="Authentication cookies are missing",
        )

    return access_token, refresh_token


# ============================================================
# Request models
# ============================================================

class ExecuteTestRequest(BaseModel):
    """
    Generic request for executing one R76 test.

    The actual fields required depend on the test_code.
    """
    test_code: str
    inputs: dict[str, Any] = Field(default_factory=dict)


class ObservationCreate(BaseModel):
    test_definition_id: str
    observation_index: int = 1

    load_applied: float | None = None
    indication_before: float | None = None
    indication_after: float | None = None
    additional_load: float | None = None

    error_observed: float | None = None
    corrected_error: float | None = None

    repeat_number: int | None = None
    position: str | None = None

    temperature: float | None = None
    humidity: float | None = None
    voltage: float | None = None

    notes: str | None = None
    raw_data: dict[str, Any] = Field(default_factory=dict)


# ============================================================
# Health
# ============================================================

@router.get("/health")
def r76_health():
    return {
        "success": True,
        "module": "r76",
        "message": "R76 backend is running",
    }


# ============================================================
# Instruments
# ============================================================

@router.get("/instruments")
def list_instruments(
    request: Request,
    current_user=Depends(get_current_user),
):
    access_token, refresh_token = _get_session_tokens(request)
    db = get_db(access_token, refresh_token)

    response = (
        db.table("instruments")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )

    return {
        "success": True,
        "items": response.data or [],
    }


@router.post("/instruments")
def create_instrument(
    payload: dict[str, Any],
    request: Request,
    current_user=Depends(get_current_user),
):
    access_token, refresh_token = _get_session_tokens(request)
    db = get_db(access_token, refresh_token)

    payload = dict(payload)
    user_id = getattr(current_user, "id", None) or (current_user.get("id") if isinstance(current_user, dict) else None)
    if user_id:
        payload["user_id"] = user_id

    response = (
        db.table("instruments")
        .insert(payload)
        .execute()
    )

    row = _first_or_500(
        response,
        "Instrument could not be created",
    )

    return {
        "success": True,
        "item": row,
        "instrument": row,
    }


# ============================================================
# Test definitions
# ============================================================

@router.get("/test-definitions")
def list_test_definitions(
    request: Request,
    current_user=Depends(get_current_user),
):
    access_token, refresh_token = _get_session_tokens(request)
    db = get_db(access_token, refresh_token)

    db_items: dict[str, dict[str, Any]] = {}
    try:
        response = (
            db.table("test_definitions")
            .select("*")
            .eq("enabled", True)
            .order("test_code")
            .execute()
        )
        if response.data:
            for item in response.data:
                db_items[item["test_code"].upper()] = item
    except Exception:
        pass

    all_definitions = []
    sorted_codes = sorted(list(_ALL_78_PROCEDURE_CODES))

    for code in sorted_codes:
        if code in db_items:
            all_definitions.append(db_items[code])
        else:
            canonical = get_canonical_test_definition(code, db=None)
            all_definitions.append(canonical)

    return {
        "success": True,
        "items": all_definitions,
    }



# ============================================================
# Test sessions
# ============================================================

@router.get("/test-sessions")
def list_test_sessions(
    request: Request,
    current_user=Depends(get_current_user),
):
    access_token, refresh_token = _get_session_tokens(request)
    db = get_db(access_token, refresh_token)

    response = (
        db.table("test_sessions")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )

    return {
        "success": True,
        "items": response.data or [],
    }


@router.post("/test-sessions")
def create_test_session(
    payload: dict[str, Any],
    request: Request,
    current_user=Depends(get_current_user),
):
    access_token, refresh_token = _get_session_tokens(request)
    db = get_db(access_token, refresh_token)

    payload = dict(payload)

    # Always associate the session with the authenticated officer.
    payload["officer_user_id"] = current_user.id

    response = (
        db.table("test_sessions")
        .insert(payload)
        .execute()
    )

    row = _first_or_500(
        response,
        "Test session could not be created",
    )

    return {
        "success": True,
        "item": row,
        "session": row,
    }


@router.get("/test-sessions/{session_id}")
def get_test_session(
    session_id: str,
    request: Request,
    current_user=Depends(get_current_user),
):
    access_token, refresh_token = _get_session_tokens(request)
    db = get_db(access_token, refresh_token)

    session_response = (
        db.table("test_sessions")
        .select("*")
        .eq("id", session_id)
        .limit(1)
        .execute()
    )

    session = _first_or_404(
        session_response,
        "Test session not found",
    )

    environment_response = (
        db.table("environmental_conditions")
        .select("*")
        .eq("test_session_id", session_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    equipment_response = (
        db.table("test_session_equipment")
        .select("*")
        .eq("test_session_id", session_id)
        .execute()
    )

    results_response = (
        db.table("test_results")
        .select("*")
        .eq("test_session_id", session_id)
        .order("created_at")
        .execute()
    )

    return {
        "success": True,
        "session": session,
        "environment": environment_response.data or [],
        "equipment": equipment_response.data or [],
        "results": results_response.data or [],
    }


@router.patch("/test-sessions/{session_id}")
def update_test_session(
    session_id: str,
    payload: dict[str, Any],
    request: Request,
    current_user=Depends(get_current_user),
):
    access_token, refresh_token = _get_session_tokens(request)
    db = get_db(access_token, refresh_token)

    response = (
        db.table("test_sessions")
        .update(payload)
        .eq("id", session_id)
        .execute()
    )

    row = _first_or_404(
        response,
        "Test session not found",
    )

    return {
        "success": True,
        "session": row,
    }


# ============================================================
# Environmental conditions
# ============================================================

@router.post("/test-sessions/{session_id}/environment")
def save_environment(
    session_id: str,
    payload: dict[str, Any],
    request: Request,
    current_user=Depends(get_current_user),
):
    access_token, refresh_token = _get_session_tokens(request)
    db = get_db(access_token, refresh_token)

    payload = dict(payload)
    payload["test_session_id"] = session_id

    response = (
        db.table("environmental_conditions")
        .insert(payload)
        .execute()
    )

    row = _first_or_500(
        response,
        "Environmental conditions could not be saved",
    )

    return {
        "success": True,
        "environment": row,
    }


# ============================================================
# Equipment
# ============================================================

@router.post("/test-equipment")
def create_test_equipment(
    payload: dict[str, Any],
    request: Request,
    current_user=Depends(get_current_user),
):
    access_token, refresh_token = _get_session_tokens(request)
    db = get_db(access_token, refresh_token)

    response = (
        db.table("test_equipment")
        .insert(payload)
        .execute()
    )

    row = _first_or_500(
        response,
        "Test equipment could not be created",
    )

    return {
        "success": True,
        "equipment": row,
    }


@router.post("/test-sessions/{session_id}/equipment/{equipment_id}")
def attach_equipment(
    session_id: str,
    equipment_id: str,
    request: Request,
    current_user=Depends(get_current_user),
):
    access_token, refresh_token = _get_session_tokens(request)
    db = get_db(access_token, refresh_token)

    payload = {
        "test_session_id": session_id,
        "equipment_id": equipment_id,
    }

    response = (
        db.table("test_session_equipment")
        .insert(payload)
        .execute()
    )

    row = _first_or_500(
        response,
        "Equipment could not be attached to session",
    )

    return {
        "success": True,
        "session_equipment": row,
    }


# ============================================================
# Observations
# ============================================================

@router.post("/test-sessions/{session_id}/observations")
def create_observation(
    session_id: str,
    payload: ObservationCreate,
    request: Request,
    current_user=Depends(get_current_user),
):
    access_token, refresh_token = _get_session_tokens(request)
    db = get_db(access_token, refresh_token)

    data = payload.model_dump()

    data["test_session_id"] = session_id

    response = (
        db.table("test_observations")
        .insert(data)
        .execute()
    )

    row = _first_or_500(
        response,
        "Observation could not be saved",
    )

    return {
        "success": True,
        "observation": row,
    }


@router.get("/test-sessions/{session_id}/observations")
def list_observations(
    session_id: str,
    request: Request,
    current_user=Depends(get_current_user),
):
    access_token, refresh_token = _get_session_tokens(request)
    db = get_db(access_token, refresh_token)

    response = (
        db.table("test_observations")
        .select("*")
        .eq("test_session_id", session_id)
        .order("observation_index")
        .execute()
    )

    return {
        "success": True,
        "items": response.data or [],
    }


# ============================================================
# R76 TEST EXECUTION
# ============================================================

@router.post("/test-sessions/{session_id}/execute")
def execute_r76_test(
    session_id: str,
    payload: ExecuteTestRequest,
    request: Request,
    current_user=Depends(get_current_user),
):
    """
    Execute one deterministic R76 test and persist the result.

    AI is NOT used here.

    The calculation comes from the deterministic
    oimlense.r76 engine.
    """

    access_token, refresh_token = _get_session_tokens(request)
    db = get_db(access_token, refresh_token)

    # --------------------------------------------------------
    # 1. Get session
    # --------------------------------------------------------

    session_response = (
        db.table("test_sessions")
        .select("*")
        .eq("id", session_id)
        .limit(1)
        .execute()
    )

    session = _first_or_404(
        session_response,
        "Test session not found",
    )

    instrument_id = session.get("instrument_id")

    if not instrument_id:
        raise HTTPException(
            status_code=400,
            detail="Test session has no instrument",
        )

    # --------------------------------------------------------
    # 2. Get instrument
    # --------------------------------------------------------

    instrument_response = (
        db.table("instruments")
        .select("*")
        .eq("id", instrument_id)
        .limit(1)
        .execute()
    )

    instrument = _first_or_404(
        instrument_response,
        "Instrument not found",
    )

    # --------------------------------------------------------
    # 3. Get test definition
    # --------------------------------------------------------

    definition = get_canonical_test_definition(payload.test_code, db=db)


    # --------------------------------------------------------
    # 4. Prepare engine inputs
    # --------------------------------------------------------

    inputs = dict(payload.inputs)

    # Automatically provide instrument parameters
    # when the deterministic engine needs them.

    inputs.setdefault(
        "accuracy_class",
        instrument.get("accuracy_class"),
    )

    inputs.setdefault(
        "max_capacity",
        instrument.get("max_capacity"),
    )

    inputs.setdefault(
        "min_capacity",
        instrument.get("min_capacity"),
    )

    e_val = instrument.get("verification_scale_interval_e")
    if e_val is None:
        e_val = instrument.get("e")
    inputs.setdefault("e", e_val)

    d_val = instrument.get("actual_scale_interval_d")
    if d_val is None:
        d_val = instrument.get("d")
    inputs.setdefault("d", d_val)

    n_val = instrument.get("number_of_verification_scale_intervals_n")
    if n_val is None:
        n_val = instrument.get("n")
    inputs.setdefault("n", n_val)

    # --------------------------------------------------------
    # 5. Execute deterministic R76 engine
    # --------------------------------------------------------

    try:
        execution = execute_test(
            payload.test_code,
            **inputs,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"R76 calculation failed: {str(exc)}",
        )

    # --------------------------------------------------------
    # 6. Convert execution result
    # --------------------------------------------------------

    status = execution.status

    result_object = execution.result

    # Convert dataclasses / Decimal values into JSON-safe data.
    def json_safe(value):
        if value is None:
            return None

        if isinstance(value, Decimal):
            return float(value)

        if isinstance(value, datetime):
            return value.isoformat()

        if hasattr(value, "__dataclass_fields__"):
            return {
                key: json_safe(getattr(value, key))
                for key in value.__dataclass_fields__
            }

        if isinstance(value, dict):
            return {
                str(key): json_safe(val)
                for key, val in value.items()
            }

        if isinstance(value, (list, tuple)):
            return [json_safe(item) for item in value]

        if isinstance(value, bool):
            return value

        if isinstance(value, (int, float, str)):
            return value

        return str(value)

    calculated_values = json_safe(result_object)
    print("DEBUG EXECUTION STATUS:", execution.status)
    print("DEBUG EXECUTION CODE:", execution.code)

    # Determine PASS / FAIL and values to store in test_results.

    pass_fail = None
    measured_error = None
    mpe_value = None
    failure_reason = None

    def find_numeric(data, keys):
        from decimal import Decimal

        if isinstance(data, dict):
            for key in keys:
                if key in data:
                    value = data[key]

                    if isinstance(value, (int, float, Decimal)):
                        return float(value)

                    if isinstance(value, str):
                        try:
                            return float(value)
                        except ValueError:
                            pass

            for value in data.values():
                found = find_numeric(value, keys)
                if found is not None:
                    return found

        elif isinstance(data, (list, tuple)):
            for value in data:
                found = find_numeric(value, keys)
                if found is not None:
                    return found

        return None

    if isinstance(calculated_values, dict):

        # PASS / FAIL
        if "passed" in calculated_values:
            pass_fail = bool(calculated_values["passed"])
        elif "pass_fail" in calculated_values:
            pass_fail = bool(calculated_values["pass_fail"])

        code = execution.code

        # -----------------------------
        # ZERO RANGE
        # -----------------------------
        if code == "ZERO_RANGE":
            measured_error = find_numeric(
                calculated_values,
                ["overall_range"]
            )
            mpe_value = find_numeric(
                calculated_values,
                ["overall_limit"]
            )

        # -----------------------------
        # ZERO ACCURACY
        # -----------------------------
        elif code == "ZERO_ACCURACY":
            measured_error = find_numeric(
                calculated_values,
                ["zero_error"]
            )
            mpe_value = find_numeric(
                calculated_values,
                ["limit"]
            )

        # -----------------------------
        # TEMPERATURE ZERO
        # -----------------------------
        elif code == "TEMPERATURE_ZERO":
            measured_error = find_numeric(
                calculated_values,
                ["worst_change_per_required_interval"]
            )
            mpe_value = find_numeric(
                calculated_values,
                ["e"]
            )

        # -----------------------------
        # CREEP
        # -----------------------------
        elif code == "CREEP":
            measured_error = find_numeric(
                calculated_values,
                ["change_0_to_30"]
            )
            mpe_value = find_numeric(
                calculated_values,
                ["threshold_0_to_30"]
            )

        # -----------------------------
        # DISCRIMINATION
        # -----------------------------
        elif code == "DISCRIMINATION":

            # A.4.8 requires three discrimination observations:
            # Min, approximately 1/2 Max, and Max.
            # Report the smallest indication change as the
            # conservative/worst observed result.

            observations = calculated_values.get("observations", [])

            valid = [
                item for item in observations
                if isinstance(item, dict)
                and item.get("indication_change") is not None
            ]

            if valid:
                worst = min(
                    valid,
                    key=lambda item: float(item["indication_change"])
                )

                measured_error = float(worst["indication_change"])
                mpe_value = float(worst["threshold"])

            if measured_error is None:
                measured_error = find_numeric(
                    calculated_values,
                    ["indication_change"]
                )

            if mpe_value is None:
                mpe_value = find_numeric(
                    calculated_values,
                    ["threshold"]
                )
        # -----------------------------
        # SENSITIVITY
        # -----------------------------
        elif code == "SENSITIVITY":
            measured_error = find_numeric(
                calculated_values,
                ["permanent_displacement_mm"]
            )
            mpe_value = find_numeric(
                calculated_values,
                ["required_displacement_mm"]
            )

        # -----------------------------
        # REPEATABILITY
        # -----------------------------
        elif code == "REPEATABILITY":
            # Two repeatability series are returned by the calculator.
            # Use the worst series error range for reporting.
            series = calculated_values.get("series", [])

            valid_series = [
                item for item in series
                if isinstance(item, dict)
                and item.get("error_range") is not None
            ]

            if valid_series:
                worst = max(
                    valid_series,
                    key=lambda item: abs(float(item["error_range"]))
                )
                measured_error = float(worst["error_range"])
                mpe_value = float(worst["mpe"])

            if measured_error is None:
                measured_error = find_numeric(
                    calculated_values,
                    ["max_error", "error_range"]
                )

            if mpe_value is None:
                mpe_value = find_numeric(
                    calculated_values,
                    ["mpe"]
                )

        # -----------------------------
        # ECCENTRIC LOADING
        # -----------------------------
        elif code == "ECCENTRIC_LOADING":
            measured_error = find_numeric(
                calculated_values,
                ["corrected_error", "measured_error", "raw_error"]
            )
            mpe_value = find_numeric(
                calculated_values,
                ["mpe"]
            )

        # -----------------------------
        # WEIGHING PERFORMANCE
        # -----------------------------
        elif code == "WEIGHING_PERFORMANCE":
            # A.4.4.1 produces multiple observations.
            # Report the worst absolute corrected error and its MPE.
            observations = calculated_values.get("observations", [])

            if observations:
                valid = [
                    item for item in observations
                    if isinstance(item, dict)
                    and item.get("corrected_error") is not None
                ]

                if valid:
                    worst = max(
                        valid,
                        key=lambda item: abs(float(item["corrected_error"]))
                    )
                    measured_error = float(worst["corrected_error"])
                    mpe_value = float(worst["mpe"])

            if measured_error is None:
                measured_error = find_numeric(
                    calculated_values,
                    ["corrected_error", "measured_error", "raw_error"]
                )

            if mpe_value is None:
                mpe_value = find_numeric(
                    calculated_values,
                    ["mpe"]
                )

        # -----------------------------
        # TILT
        # -----------------------------
        elif code == "TILT":
            measured_error = find_numeric(
                calculated_values,
                ["measured_error", "corrected_error", "error"]
            )
            mpe_value = find_numeric(
                calculated_values,
                ["mpe"]
            )

        # -----------------------------
        # WARM UP
        # -----------------------------
        elif code == "WARM_UP":
            measured_error = find_numeric(
                calculated_values,
                ["measured_error", "corrected_error", "error"]
            )
            mpe_value = find_numeric(
                calculated_values,
                ["mpe"]
            )

        # -----------------------------
        # STATIC TEMPERATURE
        # -----------------------------
        elif code == "TEMPERATURE_STATIC":
            measured_error = find_numeric(
                calculated_values,
                [
                    "worst_corrected_error",
                    "corrected_error",
                    "measured_error",
                    "error",
                ]
            )
            mpe_value = find_numeric(
                calculated_values,
                ["mpe"]
            )

        # -----------------------------
        # VOLTAGE VARIATION
        # -----------------------------
        elif code in {
            "VOLTAGE_AC",
            "VOLTAGE_EXTERNAL",
            "VOLTAGE_BATTERY",
            "VOLTAGE_VEHICLE",
        }:
            measured_error = find_numeric(
                calculated_values,
                ["corrected_error", "measured_error", "error"]
            )
            mpe_value = find_numeric(
                calculated_values,
                ["mpe"]
            )

        # -----------------------------
        # ENDURANCE
        # -----------------------------
        elif code == "ENDURANCE":
            measured_error = find_numeric(
                calculated_values,
                ["durability_error"]
            )
            mpe_value = find_numeric(
                calculated_values,
                ["mpe"]
            )

        # -----------------------------
        # ZERO RETURN
        # -----------------------------
        elif code == "ZERO_RETURN":
            measured_error = find_numeric(
                calculated_values,
                ["change_30_min"]
            )
            mpe_value = find_numeric(
                calculated_values,
                ["threshold_30_min"]
            )

        # -----------------------------
        # GENERIC FALLBACK
        # -----------------------------
        if measured_error is None:
            measured_error = find_numeric(
                calculated_values,
                [
                    "corrected_error",
                    "measured_error",
                    "worst_corrected_error",
                    "max_error",
                    "error_range",
                    "error",
                    "zero_error",
                    "indication_change",
                    "change_30_min",
                    "permanent_displacement_mm",
                    "durability_error",
                ]
            )

        if mpe_value is None:
            mpe_value = find_numeric(
                calculated_values,
                [
                    "mpe",
                    "limit",
                    "threshold",
                    "overall_limit",
                    "threshold_30_min",
                    "required_displacement_mm",
                ]
            )

        # Failure reason
        if pass_fail is False:
            failure_reason = (
                calculated_values.get("failure_reason")
                or calculated_values.get("message")
                or "R76 acceptance criterion was not satisfied"
            )

    # Normalize result_status to the values allowed by the database.

    if pass_fail is True:
        status = "PASS"
    elif pass_fail is False:
        status = "FAIL"
    elif status not in {"PASS", "FAIL", "NOT_APPLICABLE", "MANUAL_REVIEW"}:
        status = "MANUAL_REVIEW"

    calculation_trace = {
        "engine": "oimlense.r76",
        "test_code": execution.code,
        "test_name": execution.name,
        "category": execution.category,
        "inputs": json_safe(inputs),
        "result": calculated_values,
        "status": status,
        "message": execution.message,
        "executed_at": datetime.now(timezone.utc).isoformat(),
    }

    target_def_id = definition["id"]

    result_payload = {
        "test_session_id": session_id,
        "test_definition_id": target_def_id,
        "result_status": status,
        "calculated_values": calculated_values or {},
        "mpe_value": mpe_value,
        "measured_error": measured_error,
        "pass_fail": pass_fail,
        "failure_reason": failure_reason,
        "rule_id": execution.code,
        "source_document": definition.get("source_document"),
        "source_clause": (
            execution.source_clause
            or definition.get("source_clause")
        ),
        "rule_version": definition.get("rule_version"),
        "calculation_trace": calculation_trace,
    }

    # Existing result for this session/test is updated or inserted.
    existing_response = (
        db.table("test_results")
        .select("id")
        .eq("test_session_id", session_id)
        .eq("test_definition_id", target_def_id)
        .limit(1)
        .execute()
    )

    existing = getattr(existing_response, "data", None) or []

    if existing:
        record_id = existing[0]["id"]
        result_response = (
            db.table("test_results")
            .update(result_payload)
            .eq("id", record_id)
            .execute()
        )
    else:
        result_response = (
            db.table("test_results")
            .insert(result_payload)
            .execute()
        )

    stored_result = _first_or_500(
        result_response,
        "R76 result could not be stored",
    )


    return {
        "success": True,
        "test": {
            "code": execution.code,
            "name": execution.name,
            "category": execution.category,
            "status": execution.status,
        },
        "result": calculated_values,
        "stored_result": stored_result,
    }


# ============================================================
# Results
# ============================================================

@router.get("/test-sessions/{session_id}/results")
def list_results(
    session_id: str,
    request: Request,
    current_user=Depends(get_current_user),
):
    access_token, refresh_token = _get_session_tokens(request)
    db = get_db(access_token, refresh_token)

    response = (
        db.table("test_results")
        .select("*")
        .eq("test_session_id", session_id)
        .order("created_at")
        .execute()
    )

    return {
        "success": True,
        "items": response.data or [],
    }
