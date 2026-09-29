# SIH26035 — NAWI Test Report Generation System

## Architecture & Migration Design

### 1. Project Objective

Convert the existing SIH26034 Packaged Commodity Compliance application into a software system for generating standardized test reports for Non-Automatic Weighing Instruments (NAWI) according to OIML R 76.

The system will support laboratory/type-approval personnel in:

1. Registering test instruments.
2. Capturing instrument identification and technical parameters.
3. Recording laboratory/environmental conditions.
4. Recording test equipment.
5. Recording observations from applicable OIML R 76 tests.
6. Automatically calculating relevant values.
7. Applying deterministic OIML R 76 rules.
8. Determining PASS/FAIL for applicable tests.
9. Reviewing and approving test results.
10. Generating standardized digital test reports.
11. Exporting reports as PDF and editable documents.
12. Searching and maintaining historical test reports.
13. Supporting role-based access and auditability.

---

## 2. Target Workflow

Login
↓
Laboratory Dashboard
↓
Create Test Session
↓
Instrument Identification
↓
Technical Parameters
↓
Environmental Conditions
↓
Test Equipment
↓
Visual / Nameplate Inspection
↓
OIML R 76 Test Selection
↓
Enter Test Observations
↓
Automatic Calculations
↓
MPE / Requirement Evaluation
↓
Individual Test PASS/FAIL
↓
Overall Evaluation
↓
Reviewer Verification
↓
Generate Test Report
↓
PDF / Editable Report
↓
Report Repository

---

## 3. Existing Project Components to Reuse

### Frontend

Reuse where practical:

* React
* TypeScript
* Vite
* Existing routing/navigation structure
* Authentication UI
* Account menu
* Dashboard visual system
* Admin dashboard layout
* History/repository layout
* Existing form components and styling
* Existing loading/error states
* Existing modal patterns
* Existing PDF download pattern
* Existing responsive layout
* Existing internationalization framework

### Backend

Reuse where practical:

* FastAPI
* Pydantic
* Authentication/session handling
* Supabase client
* Existing authentication endpoints
* Existing role handling
* Existing API error handling
* Existing file handling
* Existing background job pattern where useful
* Existing PDF response/download mechanism
* Existing test structure

### Database / Infrastructure

Reuse where practical:

* Supabase/PostgreSQL
* Supabase authentication
* Existing officer/user structure
* Existing RLS architecture
* Existing deployment configuration

### Report Generation

Reuse:

* ReportLab
* A4 PDF generation
* Existing table and styling utilities
* Existing report download mechanism

The report content itself must be redesigned for NAWI/OIML R 76.

---

# 4. Components to Retire or Replace

The following SIH26034 domain concepts are not part of the new core workflow:

* Packaged commodity compliance
* MRP validation
* Net quantity declarations
* Manufacturer declaration rules for packages
* Consumer care declaration
* Country of origin package rules
* Product category rule engine
* Product-specific YAML rule files
* Three-layer packaged commodity rules
* Compliance score based on declaration violations
* Product compliance confidence score as a primary KPI
* Product violation severity scoring
* Packaged commodity OCR field extraction
* Product ID as the primary entity
* Product front/back/side package workflow

The old rule engine should NOT be deleted immediately.

It should remain untouched during the initial migration and serve as the backup/reference implementation until the new system is verified.

---

# 5. New Core Domain Model

## 5.1 Instrument

Represents the NAWI being evaluated.

Suggested fields:

* id
* manufacturer
* model
* serial_number
* instrument_type
* accuracy_class
* Max
* Min
* e
* d
* scale_interval
* capacity
* number_of_intervals
* verification_scale_interval
* identification_marks
* software_version
* type_approval_number
* year_of_manufacture
* description
* created_at
* updated_at

---

## 5.2 Test Session

Represents one evaluation/testing session.

Suggested fields:

* id
* report_number
* instrument_id
* officer_user_id
* laboratory
* test_type
* start_time
* end_time
* status
* overall_result
* reviewer_user_id
* approval_status
* created_at
* updated_at

Possible status values:

* draft
* in_progress
* pending_review
* approved
* rejected
* completed

---

## 5.3 Environmental Conditions

Record conditions relevant to testing.

Suggested fields:

* temperature
* relative_humidity
* atmospheric_pressure
* test_location
* stabilization_time
* supply_voltage
* supply_frequency
* other_conditions
* recorded_at

The system must preserve the actual entered values rather than inventing acceptable limits.

---

## 5.4 Test Equipment

Record equipment used during evaluation.

Suggested fields:

* equipment_id
* equipment_name
* equipment_type
* manufacturer
* model
* serial_number
* capacity
* accuracy
* calibration_certificate_number
* calibration_date
* calibration_expiry
* status

---

## 5.5 Test Definition

Represents a specific OIML R 76 test.

Suggested fields:

* test_id
* test_code
* test_name
* description
* applicability
* source_document
* source_clause
* source_table
* required_inputs
* calculation_method
* acceptance_rule

---

## 5.6 Test Observation

Stores actual values entered by the laboratory officer.

Suggested fields:

* id
* test_session_id
* test_id
* observation_number
* load_value
* indication_before
* indication_after
* error
* reference_value
* repeated_measurements
* calculated_value
* result
* notes
* attachments
* created_at

---

## 5.7 Test Result

Stores deterministic evaluation output.

Suggested fields:

* test_session_id
* test_id
* calculated_error
* applicable_MPE
* calculated_limit
* result
* rule_id
* source_clause
* explanation
* calculation_details

Possible result values:

* PASS
* FAIL
* NOT_APPLICABLE
* MANUAL_REVIEW

---

# 6. New Rule Engine

The new rule engine must be deterministic.

AI must NOT independently decide whether an instrument passes or fails an OIML requirement.

The backend should calculate and evaluate the result using explicit rules.

Proposed structure:

```
rulepacks/
    OIML_R76_2006/
        metadata.json
        mpe_tables.json
        test_definitions.json
        validation_rules.json
```

Example rule metadata:

```json
{
  "rule_id": "MPE_CLASS_III_ZONE_1",
  "source": "OIML R 76-1:2006",
  "source_clause": "Table 6",
  "version": "2006"
}
```

Every important regulatory calculation or validation must have traceability to its source.

---

# 7. MPE Engine

The system must support calculation of Maximum Permissible Errors according to the applicable OIML R 76 requirements.

The calculation engine should consider applicable instrument parameters such as:

* accuracy class
* verification scale interval
* load
* number of verification intervals
* applicable test zone

The actual values and formulas must be taken from the official OIML R 76 document and must not be invented.

MPE calculation should be implemented as deterministic backend code.

---

# 8. Initial Test Modules

The architecture should support the applicable R 76 tests, including where relevant:

* Error of indication
* Repeatability
* Eccentric loading
* Discrimination
* Zero-setting
* Zero-tracking
* Tare
* Influence quantities
* Temperature-related testing
* Other applicable tests defined by the adopted OIML R 76 requirements

Applicability must be determined from documented requirements and instrument characteristics.

The UI should not force every instrument through every possible test.

---

# 9. Test Calculation Architecture

Each test should follow:

Input
↓
Validation
↓
Calculation
↓
Applicable requirement lookup
↓
MPE / limit calculation
↓
Comparison
↓
PASS / FAIL / REVIEW
↓
Traceable explanation

Example:

Observation
→ calculated error
→ applicable MPE
→ comparison
→ test result

The calculation details should be stored so that the report can show how the result was obtained.

---

# 10. Frontend Architecture

The existing workspace page should eventually be transformed into a multi-step test-session interface.

Proposed pages:

### LandingPage

Can be retained and redesigned for NAWI testing.

### DashboardPage

New metrics:

* Total test sessions
* Tests in progress
* Reports pending review
* Approved reports
* Failed tests
* Recent test activity
* Tests by instrument type
* Tests by accuracy class

Do NOT use a fabricated overall "risk score".

### TestSessionPage

Main workflow:

1. Session information
2. Instrument identification
3. Technical parameters
4. Environmental conditions
5. Test equipment
6. Test selection
7. Test observations
8. Calculations
9. Results
10. Review
11. Report generation

### HistoryPage

Searchable repository of test sessions and reports.

Filters may include:

* report number
* manufacturer
* model
* serial number
* instrument type
* accuracy class
* officer
* date range
* result
* approval status

### AdminDashboardPage

Reuse the existing visual/admin structure.

Replace packaged-commodity analytics with:

* laboratory workload
* officer workload
* test-session status
* report approval status
* test result statistics
* instrument types
* accuracy classes
* frequently failed test categories
* audit activity

---

# 11. OCR / Computer Vision

OCR and OpenCV are optional supporting components.

They may assist with:

* instrument nameplate extraction
* manufacturer extraction
* model extraction
* serial number extraction
* capacity extraction
* accuracy-class extraction
* displayed indication capture

However:

OCR output must always be editable and reviewable.

OCR must never directly determine regulatory compliance.

The deterministic rule engine remains authoritative for calculations and PASS/FAIL.

---

# 12. AI Usage

AI may assist with:

* OCR field cleanup
* extracting structured instrument information from OCR text
* identifying likely fields
* suggesting missing information
* explaining calculations in natural language
* helping officers navigate the workflow

AI must not:

* invent OIML rules
* invent MPE values
* invent acceptance limits
* override deterministic calculations
* independently declare regulatory compliance

---

# 13. Report Generation

The existing ReportLab implementation can be reused as the technical foundation.

The new report should be structured around the adopted OIML R 76 test-report requirements.

Expected sections:

1. Report identification
2. Laboratory information
3. Officer information
4. Instrument identification
5. Technical characteristics
6. Accuracy class
7. Max / Min
8. e / d
9. Environmental conditions
10. Test equipment
11. Visual inspection
12. Individual test procedures
13. Observations
14. Calculations
15. Applicable MPE
16. Individual PASS/FAIL results
17. Overall evaluation
18. Deviations/remarks
19. Reviewer/approval information
20. Signatures
21. Revision information
22. Standards and source references

The exact report fields must be aligned with the adopted official OIML R 76 report requirements.

---

# 14. Report Traceability

Every regulatory result shown in the report should be traceable.

Example:

```
Result
↓
Rule ID
↓
Source document
↓
Clause/Table/Annex
↓
Calculation
↓
Observation
```

This is important for laboratory and type-approval use.

---

# 15. Database Architecture

The existing `inspection_records` table is SIH26034-specific.

It should not be blindly reused as the final SIH26035 database.

Target logical tables:

* users/officers
* instruments
* test_sessions
* environmental_conditions
* test_equipment
* test_session_equipment
* test_observations
* test_results
* reports
* report_revisions
* audit_logs

Possible supporting tables:

* test_definitions
* rule_versions
* report_attachments

The final schema will be designed only after confirming the official report/data requirements.

---

# 16. Security

Existing authentication/session architecture should be reused.

The new system should use role-based access such as:

### Officer

Can:

* create sessions
* enter observations
* upload evidence
* calculate tests
* generate draft reports
* submit for review

### Reviewer

Can:

* review sessions
* inspect calculations
* approve/reject reports
* add remarks
* finalize reports

### Admin

Can:

* manage users
* view laboratory-wide records
* manage configuration
* view audit logs

RLS must restrict access according to the intended authorization model.

Anonymous read access must not be copied from the old `inspection_records` policies.

---

# 17. Audit Trail

Important actions should be recorded:

* session created
* instrument details changed
* observation added/edited
* calculation executed
* result changed
* report generated
* report revised
* report submitted
* report approved/rejected
* user changes
* configuration/rule version changes

The audit record should identify:

* user
* action
* timestamp
* affected entity
* previous value where appropriate
* new value where appropriate

---

# 18. Versioning

The system must preserve:

* OIML rule version
* rule-pack version
* report template version
* application version
* report revision

A historical report must remain reproducible using the rule/report versions under which it was generated.

---

# 19. Migration Strategy

Migration will happen incrementally.

### Phase 1 — Audit

Complete.

No production code modified.

### Phase 2 — Standards and Requirements

Collect and verify:

* OIML R 76-1
* OIML R 76-2
* applicable Indian legal metrology requirements

Extract exact clauses, tables and test requirements.

### Phase 3 — Domain Model

Design database schema and Pydantic models.

### Phase 4 — Rule Engine

Implement:

* rule loading
* MPE tables
* test definitions
* validation
* calculations
* traceability

### Phase 5 — Backend

Create SIH26035 APIs for:

* instruments
* sessions
* tests
* observations
* results
* reports
* repository
* review/approval

### Phase 6 — Frontend

Transform the existing workspace into the test-session workflow.

### Phase 7 — Report Generator

Replace packaged-commodity report content with the NAWI test report.

### Phase 8 — Testing

Add deterministic unit tests for:

* MPE calculations
* test calculations
* boundary conditions
* applicability
* PASS/FAIL
* report generation
* authorization

### Phase 9 — Integration

Connect:

Frontend
→ FastAPI
→ Rule Engine
→ Supabase
→ Report Generator

### Phase 10 — Validation

Test the complete workflow using known test cases and verify outputs against the adopted source requirements.

---

# 20. Migration Safety Rules

During migration:

1. Do not modify the SIH26034 backup.
2. Do not delete the old rule engine initially.
3. Do not expose `.env` secrets.
4. Do not modify GitHub unless explicitly requested.
5. Do not change production database tables until the new schema is finalized.
6. Do not remove existing functionality until replacement functionality is tested.
7. Do not invent regulatory requirements.
8. Do not use AI as the compliance authority.
9. Keep regulatory source references with every rule.
10. Keep old SIH26034 code available until SIH26035 is validated.

---

# 21. Current Reuse Map

| Existing Component             | SIH26035 Action      |
| ------------------------------ | -------------------- |
| FastAPI                        | KEEP                 |
| Supabase client                | KEEP                 |
| Authentication                 | KEEP                 |
| Session cookies                | KEEP                 |
| RBAC foundation                | KEEP / MODIFY        |
| React/Vite                     | KEEP                 |
| Dashboard UI                   | REUSE / MODIFY       |
| Admin dashboard UI             | REUSE / MODIFY       |
| History UI                     | REUSE / MODIFY       |
| ReportLab                      | KEEP                 |
| PDF download mechanism         | REUSE                |
| OCR infrastructure             | OPTIONAL REUSE       |
| OpenCV infrastructure          | OPTIONAL REUSE       |
| Background jobs                | REUSE WHERE NEEDED   |
| Packaged commodity OCR fields  | RETIRE               |
| Packaged commodity rule engine | RETIRE FROM NEW FLOW |
| Product categories             | RETIRE               |
| MRP rules                      | RETIRE FROM NEW FLOW |
| Net quantity declaration rules | RETIRE FROM NEW FLOW |
| Product compliance score       | RETIRE               |
| Product violation model        | REPLACE              |
| `inspection_records`           | REPLACE / MIGRATE    |
| Product scan workflow          | REPLACE              |
| Package label report           | REPLACE              |

---

# 22. Target Architecture

```
React / TypeScript
        |
        v
Test Session UI
        |
        v
FastAPI
        |
   +----+----+
   |         |
   v         v
```

PostgreSQL   Rule Engine
/ Supabase       |
|            v
|       MPE / Test
|       Calculations
|            |
+-----+------+
|
v
Test Results
|
v
Report Generator
|
+----+----+
|         |
v         v
PDF     Editable
Report

Supporting services:

* Authentication
* RBAC
* Audit logging
* File storage
* Optional OCR/OpenCV
* Optional AI assistance

---

# 23. Design Principle

The most important architectural principle is:

**Capture → Calculate → Validate → Trace → Report**

The system should make the calculation and regulatory basis visible rather than hiding the decision inside an AI model.

---

# 24. Next Implementation Step

Before modifying existing application code:

1. Obtain the authoritative OIML R 76 documents.
2. Verify the applicable Indian requirements.
3. Extract the exact test/report requirements.
4. Build the traceable rule-pack specification.
5. Design the database schema.
6. Only then begin replacing the SIH26034 domain workflow.
