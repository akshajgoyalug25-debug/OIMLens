# OIMLense

<p align="center">
  <img src="assets/logo-white.png" alt="OIMLense Logo" width="300"/>
</p>

<h3 align="center">OIML R-76 Based NAWI Test Report Generation & Compliance System</h3>

<p align="center">Built for Smart India Hackathon 2026</p>

---

## SIH 2026 Problem Statement

**Problem Statement ID:** SIH26035

**Title:**  
Development of a Software Program/Application for Generation of Test Reports for Non-Automatic Weighing Instruments (NAWI) as per OIML Recommendation R- 76

**Organization:** Ministry of Consumer Affairs, Food & Public Distribution

**Department:** Department of Consumer Affairs

**Category:** Software

**Theme:** Miscellaneous

---

## 🔗 Project Resources

- 🎥 **Demo Video:** [Click Here](#)
- 📄 **Project Presentation / PDF:** [Click Here](#)

---

## About OIMLense

**OIMLense** is a digital test-report generation and compliance management platform designed for the evaluation of **Non-Automatic Weighing Instruments (NAWI)** according to **OIML Recommendation R-76**.

The system digitizes the process of recording instrument information, laboratory conditions, test observations and technical results while automatically performing applicable calculations and compliance checks.

Instead of relying on manually maintained spreadsheets and document templates, OIMLense provides a structured workflow for:

- Registering NAWI instruments
- Recording manufacturer and instrument details
- Capturing technical specifications
- Recording laboratory and environmental conditions
- Executing applicable OIML R-76 tests
- Performing automatic calculations
- Determining permissible errors
- Evaluating compliance
- Recording test observations
- Reviewing test results
- Generating standardized test reports
- Maintaining a digital report repository
- Tracking test and approval status
- Supporting role-based access
- Maintaining an auditable testing workflow

---

## Problem

Testing and evaluation of Non-Automatic Weighing Instruments involves multiple technical and metrological tests.

Traditionally, test observations and calculations may be recorded using spreadsheets or document templates. This can result in:

- Repetitive manual data entry
- Calculation errors
- Inconsistent report formatting
- Difficulty tracking previous tests
- Increased report preparation time
- Difficulties maintaining structured test histories

OIMLense addresses these challenges through a centralized digital workflow that connects **instrument registration → test execution → calculation → compliance evaluation → review → report generation**.

---

## How OIMLense Works

```text
NAWI Instrument Registration
            ↓
Instrument Specifications
            ↓
Laboratory & Environmental Conditions
            ↓
Test Selection / Test Plan
            ↓
OIML R-76 Test Execution
            ↓
Observation Entry
            ↓
Automatic Calculations
            ↓
MPE / Compliance Evaluation
            ↓
Pass / Fail Determination
            ↓
Review & Verification
            ↓
Test Report Generation
            ↓
Digital Report Repository
            ↓
Search / History / Dashboard
```

---

## Key Features

### ⚖️ NAWI Instrument Registration

Register and maintain complete information about the weighing instrument.

Information can include:

- Manufacturer
- Manufacturer address
- Instrument model
- Serial number
- Instrument type
- Accuracy class
- Maximum capacity
- Verification scale interval
- Scale interval
- Maximum number of verification intervals
- Measurement specifications
- Technical characteristics

---

### 🧾 Technical Specification Management

OIMLense provides structured input fields for instrument specifications.

Example:

```text
Accuracy Class       Class III
Maximum Capacity     30 kg
e                     0.01 kg
d                     0.01 kg
Maximum n             3000
```

The system dynamically handles technical parameters depending on the selected instrument configuration.

---

### 🧪 Test Planning & Execution

The system provides a structured workflow for executing applicable OIML R-76 tests.

Tests can contain multiple observations and technical inputs.

Examples include:

- Zero setting
- Repeatability
- Weighing performance
- Eccentricity
- Discrimination
- Tare
- Increasing / decreasing load tests
- Other applicable OIML R-76 evaluations

---

### 📐 Automatic Metrological Calculations

OIMLense automatically performs applicable calculations based on entered observations.

The calculation engine can determine:

- Errors
- Permissible errors
- Maximum permissible errors
- Error limits
- Test-specific calculated values
- Compliance status

This reduces repetitive manual calculations during test evaluation.

---

### ✅ Automatic Compliance Evaluation

Each applicable test is evaluated against the corresponding OIML R-76 requirements.

```text
Test Observation
       ↓
Input Validation
       ↓
Calculation
       ↓
Applicable Requirement
       ↓
Comparison
       ↓
PASS / FAIL
```

The system maintains the distinction between:

- Input values
- Calculated values
- Permissible limits
- Final compliance status

---

### 🔬 Dynamic Test Inputs

Different tests require different numbers and types of observations.

OIMLense supports structured test forms where the required input fields can change according to the selected test and instrument configuration.

For example:

```text
Test
 ↓
Required Parameters
 ↓
Observation Rows
 ↓
Calculated Results
 ↓
Compliance Status
```

This allows the system to accommodate tests with multiple readings rather than relying on a fixed single-input form.

---

### 🌡️ Laboratory & Environmental Conditions

The application records relevant testing conditions such as:

- Laboratory information
- Temperature
- Humidity
- Atmospheric conditions
- Test date
- Testing equipment
- Other applicable environmental parameters

These details can be incorporated into the generated test report.

---

### 📊 Test Result Dashboard

The dashboard provides an overview of testing activities.

It can display:

- Total instruments
- Total tests
- Tests in progress
- Tests pending review
- Completed tests
- Passed tests
- Failed tests
- Report status
- Recent test activity

---

### 👥 Role-Based Access

OIMLense supports role-based access to control different stages of the testing workflow.

Possible roles include:

- Tester
- Reviewer
- Approving Authority
- Administrator

Different roles can be assigned permissions according to their responsibilities.

---

### 🔍 Test Review & Approval Workflow

Test reports can follow a structured review process.

```text
Draft
  ↓
Testing
  ↓
Submitted for Review
  ↓
Reviewer Verification
  ↓
Correction / Approval
  ↓
Final Approval
  ↓
Report Finalization
```

This provides a controlled workflow instead of allowing finalized reports to be modified freely.

---

### 📄 Automated Test Report Generation

Once the required tests and observations are completed, OIMLense generates a structured digital test report.

The report can contain:

- Laboratory details
- Manufacturer details
- Instrument details
- Model information
- Technical specifications
- Environmental conditions
- Test observations
- Calculated results
- MPE values
- Compliance status
- Test-wise results
- Final conclusion
- Approval / verification information

---

### 📚 Digital Report Repository

Completed and ongoing reports are stored digitally.

Users can:

- Search reports
- Filter reports
- View previous reports
- Open instrument history
- Track report status
- Access completed reports
- Review previous test results

---

### 🔎 Search & History

The system allows users to search previous testing records using information such as:

- Instrument model
- Serial number
- Manufacturer
- Test ID
- Report ID
- Date
- Status

This creates an instrument-wise digital testing history.

---

### 📎 Supporting Documents

The system can support attachments related to an instrument or test report, such as:

- Instrument photographs
- Supporting documents
- Test evidence
- Calibration information
- Other relevant files

---

### 🔐 Report Verification

Generated reports can be associated with a unique verification mechanism.

The system can support:

- Unique report IDs
- QR-based report access
- Report verification
- Report integrity checks
- Finalized report identification

This provides an additional layer of trust for digitally generated reports.

---

### 📝 Audit Trail

Important actions can be tracked throughout the testing workflow.

Examples include:

```text
Instrument Created
       ↓
Test Started
       ↓
Observation Added
       ↓
Test Submitted
       ↓
Reviewer Action
       ↓
Report Generated
       ↓
Report Finalized
```

This provides traceability for important report activities.

---

## OIML R-76 Compliance Engine

The core of OIMLense is its rule and calculation engine.

```text
Instrument Specifications
          ↓
Applicable Test
          ↓
Test Parameters
          ↓
Observation Data
          ↓
Calculation Engine
          ↓
OIML R-76 Requirements
          ↓
MPE / Permissible Error
          ↓
Compliance Evaluation
          ↓
PASS / FAIL
```

The calculation and compliance layer is designed to keep legally relevant evaluation logic deterministic and reproducible.

---

## Validation Evidence

OIMLense includes automated validation of its calculation and execution workflows.

### Automated Test Coverage

- **78/78** SIH26035 procedure-audit tests passing
- **40/40** core R-76 calculation and executor tests passing
- **14/14** MPE engine tests passing
- Frontend production build verified successfully
- MPE boundary conditions tested for both PASS and FAIL outcomes
- Digital discrimination sequence tested for both valid and invalid observations

### Known PASS / FAIL Validation Cases

| Validation case | Expected result |
|---|---|
| Class III weighing error within applicable MPE | PASS |
| Class III weighing error beyond applicable MPE | FAIL |
| Digital discrimination with correct I−d and I+d sequence | PASS |
| Digital discrimination with incorrect reduced indication | FAIL |
| Digital discrimination with incorrect final indication | FAIL |
| Zero-tracking baseline within the applicable accuracy limit | PASS |
| Repeatability series containing an individual error beyond MPE | FAIL |

These cases provide regression coverage for the core metrological decision logic. The 78-procedure audit additionally verifies that every catalogue procedure can be constructed and evaluated through the execution framework.

> **Validation note:** The automated suite is software validation evidence. It should not be interpreted as certification of a weighing instrument or as proof that every OIML R-76 procedure has been experimentally reproduced.

## System Architecture

```text
┌─────────────────────────────────┐
│          Web Interface          │
│      React / TypeScript         │
└───────────────┬─────────────────┘
                ↓
┌─────────────────────────────────┐
│          FastAPI Backend        │
│       API & Application Logic   │
└───────────────┬─────────────────┘
                ↓
┌─────────────────────────────────┐
│       Test & Calculation        │
│            Engine               │
│                                 │
│  • Test Validation              │
│  • Calculations                 │
│  • MPE Evaluation               │
│  • Compliance Determination     │
└───────────────┬─────────────────┘
                ↓
┌─────────────────────────────────┐
│        OIML R-76 Rules          │
│     & Test Requirements         │
└───────────────┬─────────────────┘
                ↓
┌─────────────────────────────────┐
│            Database             │
│     PostgreSQL / Supabase       │
└───────────────┬─────────────────┘
                ↓
┌─────────────────────────────────┐
│       Reports & Documents       │
│       PDF / Editable Reports    │
└─────────────────────────────────┘
```

---

## Test Execution Workflow

```text
1. User Login
       ↓
2. Register NAWI Instrument
       ↓
3. Enter Technical Specifications
       ↓
4. Enter Laboratory Conditions
       ↓
5. Select / Generate Test Plan
       ↓
6. Execute Applicable OIML R-76 Tests
       ↓
7. Enter Observations
       ↓
8. Validate Inputs
       ↓
9. Calculate Results
       ↓
10. Determine Compliance
       ↓
11. Review Results
       ↓
12. Submit for Approval
       ↓
13. Generate Final Report
       ↓
14. Store in Repository
```

---

## Technology Stack

### Frontend

- React.js
- TypeScript
- Vite
- HTML5
- CSS3

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic

### Database & Authentication

- Supabase
- PostgreSQL
- Supabase Authentication

### Calculation & Compliance

- Python
- OIML R-76 based rule engine
- Deterministic calculation logic
- Input validation
- Compliance evaluation

### Reporting

- ReportLab
- PDF generation
- Editable report generation

### Verification

- QR Code
- Report ID
- Digital verification
- Integrity verification

### Development & Deployment

- Git
- GitHub
- Vercel
- npm
- Python Virtual Environment

---

## Project Structure

```text
product-label-compliance/
│
├── assets/
│   └── logo-white.png
│
├── screenshots/
│
├── backend/
│
├── frontend/
│
├── reports/
│
├── rules/
│
├── requirements.txt
├── .gitignore
└── README.md
```

> The project structure may evolve as additional OIML R-76 tests, reporting modules and administrative features are integrated.

---

## How to Run

### 1. Clone the Repository

```bash
git clone https://github.com/Divya-Singhal07/product-label-compliance.git
cd product-label-compliance
```

### 2. Create Python Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create:

```bash
touch backend/.env
```

Add the required configuration for:

- Supabase
- Database
- Authentication
- Other application services

> Never commit `.env` files or expose API keys publicly.

### 5. Start Backend

```bash
python -m uvicorn backend.app:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

### 6. Start Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## Example NAWI Workflow

```text
Instrument
│
├── Manufacturer
├── Model
├── Serial Number
├── Accuracy Class
├── Max Capacity
├── e
├── d
└── Max n
        ↓
Laboratory Conditions
        ↓
Test Selection
        ↓
Observation Entry
        ↓
Automatic Calculation
        ↓
MPE Evaluation
        ↓
Compliance Result
        ↓
Reviewer Verification
        ↓
Final Test Report
```

---

## Example Test Result

```text
Test: Repeatability

Observation 1
Load:             10 kg
Indication:       10.01 kg
Calculated Error: +0.01 kg

Observation 2
Load:             10 kg
Indication:       10.00 kg
Calculated Error:  0.00 kg

Applicable MPE:   ±0.015 kg

Result:            PASS
```

> Values shown above are illustrative examples only.

---

## Challenges & Mitigations

| Challenge | Mitigation |
|---|---|
| Manual test-report preparation | Digital end-to-end workflow |
| Repetitive calculations | Automated calculation engine |
| Calculation errors | Deterministic validation and calculation |
| Large number of observations | Structured dynamic test forms |
| Inconsistent reports | Standardized report generation |
| Difficult report retrieval | Digital repository and search |
| Unauthorized changes | Role-based workflow |
| Lack of traceability | Audit trail |
| Report authenticity | QR / verification mechanism |
| Changing standards | Versioned rules and calculation logic |

---

## Impact

### ⏱️ Faster Report Preparation

Automates repetitive data entry, calculations and report generation.

### 🎯 Improved Calculation Consistency

Reduces dependence on manually performed calculations.

### 📋 Standardized Reporting

Generates reports using a consistent digital structure.

### 🔎 Better Traceability

Maintains instrument-wise and test-wise digital history.

### 🔐 Controlled Workflow

Role-based permissions provide structured testing and approval stages.

### 📊 Centralized Monitoring

Dashboards provide visibility into testing activities and report status.

### 📚 Digital Repository

Previous test reports can be searched and retrieved efficiently.

### 🔄 Scalable Architecture

The system can be extended as additional OIML R-76 tests and requirements are implemented.

---

## Future Scope

- Complete coverage of applicable OIML R-76 tests
- Expanded calculation engine
- Versioned OIML rule packages
- Advanced report verification
- Digital signatures
- Advanced audit trail
- Laboratory equipment management
- Calibration record integration
- Offline testing capability
- Mobile / tablet inspection interface
- Advanced analytics
- Automated report archival
- Multi-laboratory support
- Integration with future regulatory updates

---

## Regulatory & Technical References

OIMLense is designed around the regulatory and technical framework relevant to Non-Automatic Weighing Instruments, including:

- **OIML Recommendation R-76 – Non-Automatic Weighing Instruments**
- **Legal Metrology Act, 2009**
- **Legal Metrology (General) Rules, 2011**
- Relevant Legal Metrology requirements and notifications
- Department of Consumer Affairs resources
- Smart India Hackathon 2026 Problem Statement SIH26035

---

## Research & Technical References

### Metrology & Standards

- OIML Recommendation R-76
- OIML technical requirements for Non-Automatic Weighing Instruments
- Legal Metrology Act, 2009
- Legal Metrology Rules

### Backend

- FastAPI
- Pydantic
- Uvicorn

### Frontend

- React
- TypeScript
- Vite

### Database

- Supabase
- PostgreSQL

### Reporting

- ReportLab
- PDF generation technologies

### Verification

- QR Code
- Cryptographic / integrity verification mechanisms

---

## Smart India Hackathon 2026

**Problem Statement:** SIH26035

**Project:** OIMLense

**Domain:** Software

**Theme:** Miscellaneous

**Organization:** Ministry of Consumer Affairs, Food & Public Distribution

**Department:** Department of Consumer Affairs

**Problem Statement Title:**

> Development of a Software Program/Application for Generation of Test Reports for Non-Automatic Weighing Instruments (NAWI) as per OIML Recommendation R- 76

OIMLense aims to digitize and streamline the testing, compliance evaluation and standardized report-generation workflow for Non-Automatic Weighing Instruments under OIML Recommendation R-76.

---

## Team

### Team OIMLense

| Role | Responsibility |
|---|---|
| AI / Calculation & Compliance | Calculation engine, OIML logic & technical workflow |
| Frontend | User interface & test execution workflow |
| Backend | APIs, database & system integration |
| Research | OIML R-76 research, regulations & test requirements |
| Research | Test procedures, datasets & validation |
| Frontend / Integration | UI integration & system workflow |

---

## Contributing

Contributions, suggestions and improvements are welcome.

For major changes, please open an issue first to discuss the proposed changes.

---

## Support

If you encounter an issue while running the project:

1. Check the installation steps.
2. Verify environment variables.
3. Check that the backend is running.
4. Check that the frontend is running.
5. Check the browser console for frontend errors.
6. Open an issue with the relevant error details.

---

<p align="center">

<b>OIMLense</b>

<br>

<i>Measure. Verify. Report.</i>

<br><br>

Built for Smart India Hackathon 2026 🇮🇳

</p>
