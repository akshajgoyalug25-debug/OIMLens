from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, Field


AccuracyClass = Literal["I", "II", "III", "IIII"]
TestType = Literal["type_evaluation", "initial_verification", "in_service"]
SessionStatus = Literal[
    "draft",
    "in_progress",
    "submitted",
    "under_review",
    "approved",
    "rejected",
    "completed",
]


class InstrumentCreate(BaseModel):
    manufacturer: str = Field(min_length=1)
    model: str = Field(min_length=1)
    serial_number: str | None = None

    instrument_type: str = Field(min_length=1)
    accuracy_class: AccuracyClass
    weighing_principle: str | None = None
    indication_type: str | None = None

    max_capacity: Decimal = Field(gt=0)
    min_capacity: Decimal | None = Field(default=None, ge=0)

    verification_scale_interval_e: Decimal = Field(gt=0)
    actual_scale_interval_d: Decimal | None = Field(default=None, gt=0)
    number_of_verification_scale_intervals_n: Decimal | None = Field(
        default=None,
        gt=0,
    )

    tare_device_type: str | None = None
    has_auxiliary_indicating_device: bool = False

    is_multiple_range: bool = False
    is_multi_interval: bool = False

    unit: str = "kg"

    type_approval_number: str | None = None
    software_version: str | None = None
    year_of_manufacture: int | None = None

    descriptive_markings: str | None = None
    technical_document_reference: str | None = None
    remarks: str | None = None


class InstrumentResponse(InstrumentCreate):
    id: str
    created_at: datetime
    updated_at: datetime


class TestSessionCreate(BaseModel):
    instrument_id: str
    session_number: str = Field(min_length=1)

    test_type: TestType

    test_location: str | None = None

    start_time: datetime | None = None
    end_time: datetime | None = None

    status: SessionStatus = "draft"


class TestSessionUpdate(BaseModel):
    reviewer_user_id: str | None = None
    approver_user_id: str | None = None

    test_location: str | None = None

    start_time: datetime | None = None
    end_time: datetime | None = None

    status: SessionStatus | None = None

    final_result: Literal[
        "PASS",
        "FAIL",
        "NOT_APPLICABLE",
        "MANUAL_REVIEW",
    ] | None = None


class TestSessionResponse(BaseModel):
    id: str
    instrument_id: str
    officer_user_id: str

    reviewer_user_id: str | None = None
    approver_user_id: str | None = None

    session_number: str
    test_type: TestType

    test_location: str | None = None

    start_time: datetime | None = None
    end_time: datetime | None = None

    status: SessionStatus
    final_result: str | None = None

    created_at: datetime
    updated_at: datetime


class EnvironmentalConditionsCreate(BaseModel):
    ambient_temperature: float | None = None
    relative_humidity: float | None = None
    atmospheric_pressure: float | None = None
    supply_voltage: float | None = None
    supply_frequency: float | None = None
    tilt_condition: float | None = None
    stabilization_time_minutes: int | None = None
    other_conditions: str | None = None

class TestEquipmentCreate(BaseModel):
    name: str = Field(min_length=1)
    equipment_type: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    serial_number: str | None = None

    calibration_id: str | None = None
    calibration_date: str | None = None
    calibration_expiry_date: str | None = None

    accuracy_class: str | None = None
    uncertainty: Decimal | None = None
    capacity: Decimal | None = None
    resolution: Decimal | None = None

    notes: str | None = None


class TestObservationCreate(BaseModel):
    test_definition_id: str

    observation_index: int = Field(ge=1)

    load_applied: Decimal | None = None
    indication_before: Decimal | None = None
    indication_after: Decimal | None = None
    additional_load: Decimal | None = None

    error_observed: Decimal | None = None
    corrected_error: Decimal | None = None

    repeat_number: int | None = Field(default=None, ge=1)

    position: str | None = None
    temperature: Decimal | None = None
    humidity: Decimal | None = None
    voltage: Decimal | None = None

    notes: str | None = None

    raw_data: dict[str, Any] = Field(default_factory=dict)


class TestResultResponse(BaseModel):
    id: str
    test_session_id: str
    test_definition_id: str

    result_status: Literal[
        "PASS",
        "FAIL",
        "NOT_APPLICABLE",
        "MANUAL_REVIEW",
    ]

    calculated_values: dict[str, Any] = Field(default_factory=dict)

    mpe_value: Decimal | None = None
    measured_error: Decimal | None = None
    uncertainty: Decimal | None = None

    pass_fail: bool | None = None

    failure_reason: str | None = None

    rule_id: str | None = None
    source_document: str | None = None
    source_clause: str | None = None
    rule_version: str | None = None

    calculation_trace: dict[str, Any] = Field(default_factory=dict)

    created_at: datetime
