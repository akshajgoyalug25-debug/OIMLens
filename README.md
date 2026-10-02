# OIMLense

<p align="center">
  <img src="assets/logo-white.png" alt="OIMLense Logo" width="180"/>
</p>

<h3 align="center">
  Digital NAWI Testing & Test Report Generation Platform
</h3>

<p align="center">
  <strong>SIH26035 • OIML R-76 • Legal Metrology</strong>
</p>

<p align="center">
  <a href="https://oimlense.vercel.app">
    <img src="https://img.shields.io/badge/🚀%20Live%20Demo-OIMLense-blue?style=for-the-badge" alt="Live Demo"/>
  </a>
</p>

---

## 📌 Overview

**OIMLense** is a digital software platform designed to streamline the testing, compliance evaluation, and test-report generation process for **Non-Automatic Weighing Instruments (NAWI)** according to **OIML Recommendation R-76**.

The platform transforms a traditionally manual, document-heavy workflow into a structured digital process where users can enter instrument specifications, record test observations, perform applicable calculations, evaluate compliance against predefined requirements, and generate standardized test reports.

### Smart India Hackathon

**Problem Statement ID:** SIH26035

**Problem Statement:**

> Development of a Software Program/Application for Generation of Test Reports for Non-Automatic Weighing Instruments (NAWI) as per OIML Recommendation R-76.

---

## 🎥 Demo & Presentation

| Resource | Link |
|---|---|
| 🎥 **Demo Video** | [Watch Project Demo](YOUR_DEMO_VIDEO_LINK) |
| 📊 **Project PPT** | [View Project Presentation](YOUR_PPT_LINK) |
| 🚀 **Live Demo** | [Open OIMLense](https://oimlense.vercel.app) |

The demo video provides a walkthrough of the implemented OIMLense workflow, while the presentation covers the problem statement, proposed solution, architecture, features, technology stack and expected impact.

---

## 🚀 Live Demo

### [Visit OIMLense →](https://oimlense.vercel.app)

The deployed application provides access to the OIMLense interface, dashboard, testing workflow, compliance evaluation and report-generation experience.

---

# 🎯 Problem

Testing and verification of Non-Automatic Weighing Instruments involves handling multiple technical parameters, observations, calculations and compliance requirements.

A manual workflow can involve:

- Repeated data entry
- Manual MPE calculations
- Manual comparison against permissible limits
- Repetitive test documentation
- Inconsistent report formats
- Difficulty maintaining historical records
- Increased possibility of calculation or transcription errors
- Time-consuming report preparation

A digital system is required to make the workflow more structured, consistent and traceable.

---

# 💡 Our Solution

OIMLense converts the NAWI testing process into a **data-driven digital workflow**.

Instead of treating the test report as a document that is manually filled, OIMLense treats the report as the final output of a structured testing process.

### Core Workflow

```text
Instrument Details
        ↓
Test Configuration
        ↓
Test Observations
        ↓
Data Validation
        ↓
OIML R-76 Rule Evaluation
        ↓
Automated Calculations
        ↓
Compliance / Pass-Fail
        ↓
Test Record
        ↓
Report Generation
        ↓
PDF / Editable Report
        ↓
Digital Repository
```

---

# ✨ Key Features

## 1. 🔐 Secure Authentication

Authenticated access to the OIMLense workspace using Supabase authentication.

Users can access the testing dashboard and their digital testing workspace after login.

---

## 2. 📊 Testing Dashboard

A centralized dashboard provides an overview of the testing environment.

It includes:

- Test statistics
- Testing activity
- Compliance information
- Recent records
- Test management
- Report management
- Testing workspace

---

## 3. ⚖️ Instrument Specification Management

The platform allows testers to enter and manage important NAWI specifications such as:

- Manufacturer
- Model
- Serial Number
- Instrument Type
- Accuracy Class
- Maximum Capacity
- Minimum Capacity
- Verification Scale Interval (`e`)
- Scale Interval (`d`)
- Maximum Number of Verification Intervals (`n`)
- Other relevant technical parameters

The information is maintained as structured data rather than unformatted document text.

---

## 4. 🧪 Structured Test Workflow

OIMLense organizes testing into structured test modules.

Each test can contain multiple inputs and observations depending on its requirements.

The system supports:

- Test parameters
- Measurement values
- Environmental conditions
- Instrument conditions
- Test observations
- Calculated values
- Compliance results

This allows different tests to have different input requirements instead of forcing every test into a fixed format.

---

## 5. 📐 Automated Calculations

The platform is designed to automate applicable calculations required during NAWI testing.

This includes calculation workflows related to:

- Measurement error
- Maximum Permissible Error (MPE)
- Verification intervals
- Test-specific evaluation parameters

The objective is to reduce repetitive manual calculations and improve consistency.

---

## 6. 📚 Rule-Based Compliance Engine

OIMLense incorporates applicable requirements into a structured rule-based evaluation workflow.

The system follows the concept:

```text
Test Input
    ↓
Calculation
    ↓
Applicable Requirement
    ↓
Comparison
    ↓
Compliance Result
```

This allows testing results to be evaluated systematically rather than relying entirely on manual interpretation.

---

## 7. ✅ Pass / Fail Evaluation

The platform converts calculated test results into compliance outcomes.

For applicable tests:

```text
Observed Result
       ↓
Applicable Limit
       ↓
Comparison
       ↓
PASS / FAIL
```

This provides a clear outcome for each evaluated test.

---

## 8. 📄 Automated Test Report Generation

Once the testing workflow is completed, OIMLense can generate a structured test report containing:

### Instrument Information

- Manufacturer
- Model
- Serial Number
- Instrument specifications

### Test Information

- Test performed
- Test conditions
- Observations
- Measurements

### Evaluation

- Calculated values
- Applicable limits
- Compliance status
- Pass/Fail results

### Report Information

- Report/Test ID
- Date
- Testing information
- Sign-off sections

---

## 9. 📝 Editable Report Workflow

The platform is designed to support report outputs that can be reviewed and further edited where required.

This provides greater flexibility than treating the generated report as a static document only.

---

## 10. 🗂️ Digital Report Repository

Generated testing records and reports can be maintained digitally.

This provides a foundation for:

- Historical records
- Report retrieval
- Test tracking
- Documentation
- Audit support
- Centralized record management

---

## 11. 📱 Responsive Interface

OIMLense is designed as a responsive web application.

The interface has been optimized for:

- Desktop
- Tablet-sized screens
- Mobile phones

The mobile workspace adapts:

- Navigation
- Dashboard cards
- Test forms
- Verification information
- Buttons
- Panels
- Tables
- Long text

to smaller screen sizes.

---

# 📜 Regulatory & Standards Basis

The platform is designed around the applicable requirements for NAWI testing.

Reference material used during development includes:

- **OIML R 76-1:2006**
- **Legal Metrology (General) Rules, 2011**
- **Approval of Models Rules, 2011**
- **Government Approved Test Centre Rules, 2013**

The compliance workflow is designed to translate applicable requirements into structured digital testing and evaluation logic.

---

# 🏗️ System Architecture

```text
                         OIMLENSE
                            │
                            ▼
                  ┌──────────────────┐
                  │ Authentication   │
                  │    & Access      │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │    Dashboard     │
                  └────────┬─────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
       ┌────────────────┐    ┌────────────────┐
       │ Instrument     │    │ Test           │
       │ Specifications │    │ Configuration  │
       └───────┬────────┘    └───────┬────────┘
               │                     │
               └──────────┬──────────┘
                          ▼
                 ┌──────────────────┐
                 │ Test Observations│
                 │ & Measurements   │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Data Validation  │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ OIML R-76 Rules  │
                 │ & Rule Engine    │
                 └────────┬─────────┘
                          │
                ┌─────────┴─────────┐
                ▼                   ▼
       ┌────────────────┐   ┌────────────────┐
       │ Calculations   │   │ Compliance     │
       │ / MPE          │   │ Evaluation     │
       └───────┬────────┘   └───────┬────────┘
               │                    │
               └──────────┬─────────┘
                          ▼
                 ┌──────────────────┐
                 │ Test Result /    │
                 │ Pass-Fail Status │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Report Generator │
                 └────────┬─────────┘
                          │
                ┌─────────┴─────────┐
                ▼                   ▼
          ┌──────────┐       ┌──────────────┐
          │   PDF    │       │ Editable     │
          │  Report  │       │   Report     │
          └────┬─────┘       └──────┬───────┘
               │                    │
               └──────────┬─────────┘
                          ▼
                 ┌──────────────────┐
                 │ Report Repository│
                 └──────────────────┘
```

---

# 🔄 User Workflow

### Step 1 — Login

The authorized tester logs into the OIMLense platform.

### Step 2 — Create Test

A new NAWI testing session is created.

### Step 3 — Enter Instrument Details

The tester enters the specifications and identification information of the instrument.

### Step 4 — Configure Tests

Required tests and their corresponding parameters are configured.

### Step 5 — Enter Observations

The tester enters measured values and test conditions.

### Step 6 — Automated Processing

The application validates the entered data and performs applicable calculations.

### Step 7 — Compliance Evaluation

Results are evaluated against the applicable predefined requirements.

### Step 8 — Pass/Fail Result

The system produces the corresponding compliance result.

### Step 9 — Generate Report

The completed test data is converted into a structured test report.

### Step 10 — Store Record

The test and report information can be maintained for future retrieval and reference.

---

# 🧠 Technical Approach

OIMLense follows a layered approach.

### Presentation Layer

Provides:

- Responsive user interface
- Dashboard
- Test forms
- Instrument specification forms
- Results
- Reports

### Application Layer

Handles:

- Test workflow
- Data processing
- Validation
- Calculations
- Compliance evaluation
- Report generation

### Rule Layer

Contains structured requirements and evaluation logic based on applicable metrology standards.

### Data Layer

Maintains:

- User information
- Instrument information
- Test records
- Observations
- Results
- Reports

---

# 🛠️ Technology Stack

## Frontend

- React
- TypeScript
- Vite
- CSS
- Responsive Web Design

## Backend

- Python
- FastAPI

## Database & Authentication

- Supabase

## Compliance & Calculation

- Python-based rule and calculation logic
- OIML R-76 requirements
- Indian Legal Metrology requirements

## Deployment

- Vercel
- Backend API deployment

## Development & Version Control

- Git
- GitHub
- VS Code

---

# 📁 Project Structure

The project follows a frontend/backend architecture.

```text
product-label-compliance/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── App.tsx
│   │   └── index.css
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.*
│
├── backend/
│   ├── app.py
│   ├── deps.py
│   ├── routes/
│   └── ...
│
├── assets/
│
└── README.md
```

> The exact internal structure may evolve as development continues.

---

# 🌟 Innovation

OIMLense focuses on converting the **complete testing workflow** into a structured digital process instead of simply generating a document.

### Key innovation areas

**Rule-driven compliance**

Applicable requirements are represented through structured evaluation logic.

**Automated calculations**

Applicable calculations can be performed automatically from test inputs.

**Data-driven report generation**

Reports are generated from structured testing data.

**Integrated workflow**

Instrument information, test observations, calculations, compliance evaluation and reporting are connected in one workflow.

**Digital traceability**

Testing information can remain associated with the generated record.

---

# 📈 Expected Benefits

OIMLense is intended to provide:

- Reduced manual effort
- Reduced repetitive calculations
- More consistent testing workflows
- Standardized report generation
- Better data organization
- Improved traceability
- Faster documentation
- Easier report retrieval
- Better accessibility through a responsive interface

---

# 🔮 Future Scope

The platform can be extended with:

- Full clause-level OIML R-76 coverage
- Advanced document/data extraction
- OCR-assisted test data entry
- Intelligent assistance for testers
- Automated anomaly detection
- Digital signatures
- Advanced audit trails
- Multi-laboratory management
- Organization-level role management
- Government system integrations
- Advanced analytics and reporting
- Automated instrument identification

---

# 📊 Current Project Status

### Implemented

- [x] Landing page
- [x] Live deployment
- [x] User authentication
- [x] Logged-in workspace
- [x] Dashboard
- [x] Instrument specification interface
- [x] Structured test workflow
- [x] Multiple test inputs
- [x] Rule-based evaluation architecture
- [x] MPE/calculation workflow
- [x] Pass/Fail evaluation workflow
- [x] Test record management
- [x] Report preview
- [x] Responsive desktop interface
- [x] Responsive mobile interface
- [x] Report repository architecture
- [x] GitHub version control

### Under Development / Extensible

- [ ] Complete clause-level implementation of all applicable OIML R-76 requirements
- [ ] Advanced automated data extraction
- [ ] AI-assisted workflows
- [ ] Advanced analytics
- [ ] Digital signatures
- [ ] External system integrations

---

# 🎯 Project Objective

The objective of OIMLense is to provide a **standardized, reliable and scalable digital workflow for NAWI testing and test-report generation**, reducing dependence on repetitive manual documentation and calculations while improving consistency and traceability.

---

# 👥 Target Users

OIMLense can support workflows for:

- Legal Metrology Departments
- Government-approved testing centres
- Testing laboratories
- Metrology inspectors
- Verification officers
- NAWI manufacturers
- Instrument testing personnel

---

# 📌 Project Information

| Item | Details |
|---|---|
| **Project** | OIMLense |
| **SIH Problem Statement** | SIH26035 |
| **Domain** | Legal Metrology / Software |
| **Target Instrument** | Non-Automatic Weighing Instruments |
| **Standard** | OIML Recommendation R-76 |
| **Frontend** | React + TypeScript + Vite |
| **Backend** | FastAPI + Python |
| **Database/Auth** | Supabase |
| **Deployment** | Vercel + Backend Deployment |
| **Version Control** | Git + GitHub |
| **Institution** | Netaji Subhas University of Technology (NSUT), Delhi |
| **Team** | Among Us |
| **Hackathon** | Smart India Hackathon 2026 |

---

# 🚀 Try OIMLense

### Live Application

**[https://oimlense.vercel.app](https://oimlense.vercel.app)**

---

# 📜 Disclaimer

OIMLense is a software project developed for the Smart India Hackathon problem statement **SIH26035**.

The platform is intended to digitize and streamline the testing and report-generation workflow based on applicable OIML and Indian Legal Metrology requirements. The software should not be considered a substitute for official legal, regulatory or metrological authority unless formally validated and approved for such use.

---

<p align="center">
  <strong>OIMLense — Digitizing NAWI Testing & Compliance</strong>
</p>

<p align="center">
  Built for Smart India Hackathon 2026 • SIH26035
</p>
