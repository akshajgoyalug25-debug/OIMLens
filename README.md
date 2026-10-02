# OIMLense

<p align="center">
  <img src="assets/logo-white.png" alt="OIMLense Logo" width="400"/>
</p>

<h2 align="center">
  Digital NAWI Testing & Test Report Generation Platform
</h2>

<p align="center">
  <strong>Smart India Hackathon 2026 • SIH26035 • OIML R-76</strong>
</p>

<p align="center">
  A digital platform for structured testing, compliance evaluation and automated test-report generation for Non-Automatic Weighing Instruments.
</p>

<p align="center">
  <a href="https://oimlense.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-OIMLense-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"/>
  </a>
  <a href="YOUR_DEMO_VIDEO_LINK">
    <img src="https://img.shields.io/badge/Demo%20Video-Watch-8B5CF6?style=for-the-badge&logo=youtube&logoColor=white" alt="Demo Video"/>
  </a>
  <a href="YOUR_PPT_LINK">
    <img src="https://img.shields.io/badge/Presentation-View-D4AF37?style=for-the-badge&logo=microsoftpowerpoint&logoColor=white" alt="Presentation"/>
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18%2B-61DAFB?style=flat-square&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white"/>
</p>

---

## 📌 Overview

**OIMLense** is a digital software platform designed to streamline the testing, compliance evaluation and test-report generation process for **Non-Automatic Weighing Instruments (NAWI)** according to **OIML Recommendation R-76**.

The platform converts a traditionally manual and document-heavy workflow into a structured digital process. Testers can enter instrument specifications, configure tests, record observations, perform applicable calculations, evaluate results against predefined requirements and generate structured test reports.

### Smart India Hackathon

**Problem Statement ID:** `SIH26035`

**Problem Statement:**

> Development of a Software Program/Application for Generation of Test Reports for Non-Automatic Weighing Instruments (NAWI) as per OIML Recommendation R-76.

---

# 🎥 Demo & Presentation

| Resource | Link |
|---|---|
| 🎥 **Demo Video** | [Watch Project Demo](YOUR_DEMO_VIDEO_LINK) |
| 📊 **Project PPT** | [View Project Presentation](YOUR_PPT_LINK) |
| 🚀 **Live Application** | [Open OIMLense](https://oimlense.vercel.app) |

---

# 🎯 Problem

Testing and verification of Non-Automatic Weighing Instruments involves handling multiple technical parameters, measurements, observations, calculations and regulatory requirements.

A manual workflow can result in:

- Repeated data entry
- Manual calculations
- Repetitive documentation
- Inconsistent report formats
- Difficulty maintaining historical records
- Increased possibility of calculation or transcription errors
- Time-consuming report preparation

There is a need for a structured digital workflow that connects **testing, calculations, compliance evaluation and reporting** in one system.

---

# 💡 Solution

OIMLense transforms the NAWI testing process into a **data-driven digital workflow**.

Instead of manually creating a report after completing tests, the system treats the report as the final output of a structured testing process.

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

## 🔐 Authentication

Secure authenticated access to the OIMLense testing workspace using Supabase authentication.

Users can access the testing dashboard and digital testing workspace after login.

---

## 📊 Testing Dashboard

A centralized workspace providing:

- Test statistics
- Testing activity
- Compliance information
- Recent records
- Test management
- Report management

---

## ⚖️ Instrument Specification Management

The platform allows testers to enter and manage important NAWI specifications including:

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

## 🧪 Structured Test Workflow

OIMLense organizes testing into structured test modules.

Each test can contain different parameters and multiple observations depending on its requirements.

The workflow supports:

- Test parameters
- Measurement values
- Environmental conditions
- Instrument conditions
- Test observations
- Calculated values
- Compliance results

---

## 📐 Automated Calculations

The platform is designed to automate applicable calculations required during NAWI testing.

This includes calculation workflows related to:

- Measurement error
- Maximum Permissible Error (MPE)
- Verification intervals
- Test-specific evaluation parameters

The objective is to reduce repetitive manual calculations and improve consistency.

---

## 📚 Rule-Based Compliance Engine

OIMLense incorporates applicable requirements into a structured rule-based evaluation workflow.

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

## ✅ Pass / Fail Evaluation

The platform evaluates applicable test results against predefined limits.

```text
Observed Result
       ↓
Applicable Limit
       ↓
Comparison
       ↓
PASS / FAIL
```

This provides a clear compliance outcome for each evaluated test.

---

## 📄 Automated Test Report Generation

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

## 📝 Editable Report Workflow

The report workflow is designed to support review and further editing where required.

This provides greater flexibility than treating the generated report as a static document only.

---

## 🗂️ Digital Report Repository

Testing records and reports can be maintained digitally.

This provides a foundation for:

- Historical reference
- Report retrieval
- Test tracking
- Documentation
- Audit support
- Centralized record management

---

## 📱 Responsive Interface

OIMLense is designed as a responsive web application optimized for:

- Desktop
- Tablet
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

The platform is designed around applicable requirements for NAWI testing.

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

### 01 — Login

The authorized tester logs into the OIMLense platform.

### 02 — Create Test

A new NAWI testing session is created.

### 03 — Enter Instrument Details

The tester enters the identification information and technical specifications of the instrument.

### 04 — Configure Tests

Required tests and their corresponding parameters are configured.

### 05 — Enter Observations

Measured values and test conditions are entered into structured fields.

### 06 — Process Data

The application validates the entered data and performs applicable calculations.

### 07 — Evaluate Compliance

Results are evaluated against applicable predefined requirements.

### 08 — Generate Result

The system produces the corresponding compliance/pass-fail outcome.

### 09 — Generate Report

The completed test data is converted into a structured test report.

### 10 — Store Record

Test and report information can be maintained for future retrieval and reference.

---

# 🧠 Technical Approach

OIMLense follows a layered architecture.

### Presentation Layer

Responsible for:

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

| Layer | Technologies |
|---|---|
| **Frontend** | React, TypeScript, Vite, CSS |
| **Backend** | Python, FastAPI |
| **Database** | Supabase |
| **Authentication** | Supabase Auth |
| **Compliance** | Python-based rule & calculation logic |
| **Standards** | OIML R-76, Indian Legal Metrology requirements |
| **Deployment** | Vercel + Backend Deployment |
| **Version Control** | Git + GitHub |

---

# 📁 Project Structure

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

> The internal project structure may evolve as development continues.

---

# 🌟 Innovation

OIMLense focuses on digitizing the **complete testing workflow**, rather than simply generating a document.

### Rule-Driven Compliance

Applicable requirements are represented through structured evaluation logic.

### Automated Calculations

Applicable calculations can be performed from test inputs.

### Data-Driven Reports

Reports are generated from structured testing data rather than requiring the report to be manually assembled from scratch.

### Integrated Workflow

Instrument information, test observations, calculations, compliance evaluation and reporting are connected within one workflow.

### Digital Traceability

Testing information remains associated with its corresponding test record and report.

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
- Cross-device accessibility

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

# 📊 Project Status

## Implemented

- [x] Landing page
- [x] Live deployment
- [x] User authentication
- [x] Logged-in workspace
- [x] Testing dashboard
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

## Future / Extensible

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

OIMLense is designed to support workflows for:

- Legal Metrology Departments
- Government-approved testing centres
- Testing laboratories
- Metrology inspectors
- Verification officers
- NAWI manufacturers
- Instrument testing personnel

---

# 📌 Project Information

| | |
|---|---|
| **Project** | OIMLense |
| **SIH Problem Statement** | SIH26035 |
| **Domain** | Legal Metrology / Software |
| **Target Instrument** | Non-Automatic Weighing Instruments |
| **Standard** | OIML Recommendation R-76 |
| **Frontend** | React + TypeScript + Vite |
| **Backend** | FastAPI + Python |
| **Database / Auth** | Supabase |
| **Deployment** | Vercel + Backend Deployment |
| **Version Control** | Git + GitHub |
| **Institution** | Netaji Subhas University of Technology (NSUT), Delhi |
| **Team** | **SpecCheck** |
| **Hackathon** | Smart India Hackathon 2026 |

---

# 🔗 Project Links

| Resource | Link |
|---|---|
| 🚀 **Live Application** | [oimlense.vercel.app](https://oimlense.vercel.app) |
| 🎥 **Demo Video** | [Watch Demo](YOUR_DEMO_VIDEO_LINK) |
| 📊 **Project Presentation** | [View PPT](YOUR_PPT_LINK) |
| 💻 **Source Code** | [GitHub Repository](https://github.com/akshajgoyalug25-debug/product-label-compliance) |

---

# 📜 Disclaimer

OIMLense is a software project developed for the **Smart India Hackathon 2026** problem statement **SIH26035**.

The platform is intended to digitize and streamline the testing and report-generation workflow based on applicable OIML and Indian Legal Metrology requirements. The software should not be considered a substitute for official legal, regulatory or metrological authority unless formally validated and approved for such use.

---

<p align="center">
  <strong>OIMLense — Digitizing NAWI Testing & Compliance</strong>
</p>

<p align="center">
  Built by <strong>Team SpecCheck</strong> for Smart India Hackathon 2026 • SIH26035
</p>
