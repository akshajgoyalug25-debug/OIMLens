# SIH26035 — Data Model

## 1. Design Principle

SIH26035 is based on a laboratory test-session workflow.

The central record is a `test_session`, not a product inspection.

A test session represents one examination/testing activity for one NAWI
instrument.

---

## 2. Entity Relationship Overview

User/Officer
    |
    +---- Test Session
             |
             +---- Instrument
             |
             +---- Environmental Conditions
             |
             +---- Test Equipment
             |
             +---- Test Observations
             |
             +---- Test Results
             |
             +---- Report
             |
             +---- Audit Log

---

## 3. users / officers

Stores authorized laboratory/type-approval personnel.

Fields:

- id
- officer_id
- name
- email
- department
- role
- is_active
- created_at
- updated_at

Possible roles:

- officer
- reviewer
- approver
- admin

---

## 4. instruments

Represents the NAWI being examined.

Fields:

- id (UUID)
- user_id (UUID)
- manufacturer (TEXT)
- model (TEXT)
- serial_number (TEXT)
- instrument_type (TEXT)
- accuracy_class (TEXT)
- indication_type (TEXT)
- weighing_principle (TEXT)
- max_capacity (NUMERIC)
- min_capacity (NUMERIC)
- e (NUMERIC)
- d (NUMERIC)
- n (NUMERIC)
- verification_scale_interval_e (NUMERIC)
- actual_scale_interval_d (NUMERIC)
- number_of_verification_scale_intervals_n (NUMERIC)
- tare_type (TEXT)
- tare_device_type (TEXT)
- unit (TEXT)
- type_approval_number (TEXT)
- software_version (TEXT)
- year_of_manufacture (INTEGER)
- markings (TEXT)
- descriptive_markings (TEXT)
- documentation_reference (TEXT)
- technical_document_reference (TEXT)
- remarks (TEXT)
- has_auxiliary_indicating_device (BOOLEAN)
- is_multiple_range (BOOLEAN)
- is_multi_interval (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### Supabase SQL Migration Script (`docs/sih26035/SUPABASE_INSTRUMENTS_MIGRATION.sql`)

```sql
CREATE TABLE IF NOT EXISTS instruments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE instruments ADD COLUMN IF NOT EXISTS manufacturer TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS instrument_type TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS accuracy_class TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS indication_type TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS weighing_principle TEXT;

ALTER TABLE instruments ADD COLUMN IF NOT EXISTS max_capacity NUMERIC;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS min_capacity NUMERIC;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS e NUMERIC;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS d NUMERIC;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS n NUMERIC;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS verification_scale_interval_e NUMERIC;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS actual_scale_interval_d NUMERIC;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS number_of_verification_scale_intervals_n NUMERIC;

ALTER TABLE instruments ADD COLUMN IF NOT EXISTS tare_type TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS tare_device_type TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS type_approval_number TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS software_version TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS year_of_manufacture INTEGER;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS markings TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS descriptive_markings TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS documentation_reference TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS technical_document_reference TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS remarks TEXT;

ALTER TABLE instruments ADD COLUMN IF NOT EXISTS has_auxiliary_indicating_device BOOLEAN DEFAULT false;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS is_multiple_range BOOLEAN DEFAULT false;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS is_multi_interval BOOLEAN DEFAULT false;

ALTER TABLE instruments ADD COLUMN IF NOT EXISTS user_id UUID;
```

---

## 5. multi_ranges

Used when the instrument has multiple weighing ranges.

Fields:

- id
- instrument_id
- range_index
- min_capacity
- max_capacity
- verification_scale_interval_e
- number_of_verification_scale_intervals_n

---

## 6. multi_intervals

Used when the instrument has multiple partial weighing ranges.

Fields:

- id
- instrument_id
- range_index
- min_capacity
- max_capacity
- verification_scale_interval_e
- number_of_verification_scale_intervals_n

---

## 7. test_sessions

Central testing record.

Fields:

- id
- instrument_id
- officer_user_id
- session_number
- test_type
- verification_stage
- test_location
- start_time
- end_time
- status
- reviewer_id
- approver_id
- final_result
- created_at
- updated_at

Verification stage:

- type_evaluation
- initial_verification
- in_service

Status:

- draft
- in_progress
- submitted
- under_review
- approved
- rejected
- completed

---

## 8. environmental_conditions

Stores laboratory/environment conditions associated with a test session.

Fields:

- id
- test_session_id
- ambient_temperature
- relative_humidity
- atmospheric_pressure
- voltage
- frequency
- tilt_condition
- other_conditions
- recorded_at

---

## 9. test_equipment

Stores equipment used during testing.

Fields:

- id
- name
- equipment_type
- manufacturer
- model
- serial_number
- calibration_id
- calibration_date
- calibration_expiry
- accuracy_class
- uncertainty
- capacity
- resolution
- notes

---

## 10. test_session_equipment

Links equipment to a test session.

Fields:

- id
- test_session_id
- test_equipment_id
- purpose

---

## 11. test_definitions

Defines the tests supported by the application.

Fields:

- id
- test_code
- test_name
- description
- applicable_classes
- applicable_instrument_types
- source_document
- source_clause
- source_annex
- rule_version
- input_schema
- calculation_schema
- pass_fail_schema
- enabled

Examples:

- WEIGHING_PERFORMANCE
- REPEATABILITY
- ECCENTRIC_LOADING
- DISCRIMINATION
- ZERO_SETTING
- ZERO_TRACKING
- TARE
- TEMPERATURE
- HUMIDITY
- VOLTAGE_VARIATION
- TILT
- ENDURANCE

---

## 12. test_observations

Stores raw observations entered by the officer.

Fields:

- id
- test_session_id
- test_definition_id
- observation_index
- load_applied
- indication_before
- indication_after
- error_observed
- corrected_error
- repeat_number
- position
- temperature
- humidity
- voltage
- notes
- raw_data
- recorded_at

Raw observations must be preserved.

---

## 13. test_results

Stores calculated results.

Fields:

- id
- test_session_id
- test_definition_id
- result_status
- calculated_values
- mpe_value
- measured_error
- uncertainty
- pass_fail
- failure_reason
- rule_id
- source_document
- source_clause
- rule_version
- calculation_trace
- created_at

The result must be reproducible from the stored inputs.

---

## 14. reports

Represents the generated test report.

Fields:

- id
- test_session_id
- report_number
- report_version
- report_status
- generated_pdf_path
- generated_docx_path
- generated_at
- generated_by
- approved_at
- approved_by

---

## 15. report_revisions

Stores report versions.

Fields:

- id
- report_id
- version
- revision_reason
- snapshot_data
- generated_pdf_path
- generated_docx_path
- created_by
- created_at

Previous approved report versions must not be silently overwritten.

---

## 16. audit_logs

Stores important actions.

Fields:

- id
- user_id
- test_session_id
- action
- entity_type
- entity_id
- old_value
- new_value
- timestamp
- ip_address

Important actions include:

- session_created
- instrument_updated
- observation_added
- result_calculated
- report_generated
- report_submitted
- report_reviewed
- report_approved
- report_rejected
- report_revision_created

---

## 17. rule_versions

Optional explicit rule registry.

Fields:

- id
- rule_id
- source_document
- source_version
- source_clause
- source_table
- rule_definition
- effective_from
- effective_to
- active

Every regulatory calculation should identify the rule version used.

---

## 18. attachments

Optional supporting documents.

Fields:

- id
- test_session_id
- attachment_type
- filename
- storage_path
- uploaded_by
- uploaded_at
- checksum

Possible attachment types:

- instrument_photo
- nameplate_photo
- calibration_certificate
- technical_document
- previous_report
- test_evidence

---

## 19. Relationship Rules

One instrument can have many test sessions.

One test session belongs to one instrument.

One test session can have:

- one environmental-condition record or multiple condition snapshots
- many equipment records
- many observations
- many calculated results
- one current report
- many report revisions
- many audit events
- many attachments

---

## 20. Compliance Decision Rule

The application must never derive compliance from an arbitrary score.

A test result is PASS or FAIL based on its applicable deterministic
OIML requirement.

The final session result is derived from the applicable test results
and required examinations.

No AI-generated score is used as a regulatory compliance decision.

---

## 21. Traceability Requirement

Every regulatory calculation must preserve:

1. Input values
2. Calculated values
3. Rule ID
4. Source document
5. Source clause/table/annex
6. Rule version
7. Calculation trace
8. Final PASS/FAIL basis

This makes every generated result auditable and reproducible.

---

## 22. Migration Rule

The existing SIH26034 `inspection_records` table must NOT be reused as the
primary SIH26035 domain table.

Existing authentication, officer identity, RLS patterns, storage and
general infrastructure may be reused where appropriate.

The old packaged-commodity compliance fields must not be copied into the
new test-session model.
