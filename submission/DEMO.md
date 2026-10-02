# OIMLense — Evaluator Demo & Known PASS Cases

## Solution

**OIMLense** is an OIML R-76 based software system for generating and evaluating test reports for Non-Automatic Weighing Instruments (NAWI).

---

# Known PASS Dataset 1 — Weighing Performance

### Instrument

| Field | Value |
|---|---:|
| Accuracy Class | III |
| Max Capacity | 30 kg |
| Min Capacity | 0.2 kg |
| Verification Scale Interval (e) | 0.01 kg |
| Scale Interval (d) | 0.01 kg |
| Unit | kg |

### Test observations

Use the following load and indication pairs:

| # | Load (kg) | Indication (kg) |
|---:|---:|---:|
| 1 | 0.00 | 0.00 |
| 2 | 5.00 | 4.995 |
| 3 | 10.00 | 9.995 |
| 4 | 15.00 | 14.995 |
| 5 | 20.00 | 19.995 |
| 6 | 25.00 | 24.995 |
| 7 | 30.00 | 29.995 |

### Expected result

**PASS**

The indications compensate for the `+1/2 e` term in the OIML R-76 error calculation, producing corrected errors within the applicable MPE.

---

# Known PASS Dataset 2 — Repeatability

### Instrument

| Field | Value |
|---|---:|
| Accuracy Class | III |
| Max Capacity | 30 kg |
| Min Capacity | 0.2 kg |
| Verification Scale Interval (e) | 0.01 kg |
| Scale Interval (d) | 0.01 kg |
| Unit | kg |
| Mode | Type Approval |

### Series 1 — Approximately 50% Max

Target load: **15 kg**

Enter 10 repeated observations:

| Reading | Load (kg) | Indication (kg) |
|---:|---:|---:|
| 1 | 15.000 | 14.995 |
| 2 | 15.000 | 14.995 |
| 3 | 15.000 | 14.995 |
| 4 | 15.000 | 14.995 |
| 5 | 15.000 | 14.995 |
| 6 | 15.000 | 14.995 |
| 7 | 15.000 | 14.995 |
| 8 | 15.000 | 14.995 |
| 9 | 15.000 | 14.995 |
| 10 | 15.000 | 14.995 |

Expected: **PASS**

### Series 2 — Approximately 100% Max

Target load: **30 kg**

Enter 10 repeated observations:

| Reading | Load (kg) | Indication (kg) |
|---:|---:|---:|
| 1 | 30.000 | 29.995 |
| 2 | 30.000 | 29.995 |
| 3 | 30.000 | 29.995 |
| 4 | 30.000 | 29.995 |
| 5 | 30.000 | 29.995 |
| 6 | 30.000 | 29.995 |
| 7 | 30.000 | 29.995 |
| 8 | 30.000 | 29.995 |
| 9 | 30.000 | 29.995 |
| 10 | 30.000 | 29.995 |

Expected: **PASS**

### Overall expected result

**PASS**

Both series have zero corrected error and zero repeatability range, so they remain within their applicable MPE limits.

---

# Known FAIL Dataset — Repeatability Diagnostic Demo

For demonstrating the diagnostic UI, use the existing repeatability PASS dataset above and change:

**Series 1 → Reading 3 indication:**

`15.010 kg`

instead of:

`14.995 kg`

The system should identify the individual failing observation rather than only displaying a generic failure.

Expected diagnostic format:

> **Series 1, Reading 3: error +0.0150 kg exceeds MPE ±0.0100 kg.**

This demonstrates that OIMLense identifies the exact series and reading responsible for a failed repeatability evaluation.

---

## Validation Evidence

The automated validation suite currently verifies:

- **78/78** SIH26035 procedure-audit tests
- **40/40** core R-76 calculation and executor tests
- **14/14** MPE engine tests
- Frontend production build
- MPE boundary PASS/FAIL cases
- Digital discrimination PASS/FAIL cases
- Repeatability individual-reading failure diagnostics

> **Validation note:** These are software validation datasets and regression cases. They are not a substitute for physical instrument testing, calibration, certification, or formal OIML conformity assessment.
