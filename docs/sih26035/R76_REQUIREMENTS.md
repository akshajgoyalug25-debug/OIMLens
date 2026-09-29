# OIML R 76-1:2006 — Verified Requirements for SIH26035

## 1. Scope

OIML R 76-1:2006 specifies metrological and technical requirements for
non-automatic weighing instruments subject to official metrological control.

OIML R 76-2:2007 provides the test report format and test procedures.

---

## 2. Units

Permitted mass units specified in R76-1:
- kilogram (kg)
- milligram (mg)
- gram (g)
- tonne (t)
- metric carat (ct) for special applications

---

## 3. Accuracy Classes

R76-1 Table 1:

| Class | Denomination |
|---|---|
| I | Special accuracy |
| II | High accuracy |
| III | Medium accuracy |
| IIII | Ordinary accuracy |

---

## 4. Core Instrument Parameters

The system must support:

- Accuracy class
- Maximum capacity (Max)
- Minimum capacity (Min)
- Verification scale interval (e)
- Actual scale interval (d)
- Number of verification scale intervals (n)
- Instrument type
- Indication type
- Tare device information
- Auxiliary indicating device information
- Multi-range / multi-interval configuration

---

## 5. Verification Scale Interval

R76-1 Table 2:

### Graduated instrument without auxiliary indicating device

e = d

### Graduated instrument with auxiliary indicating device

e is chosen by the manufacturer according to R76-1 requirements.

### Non-graduated instrument

e is chosen by the manufacturer according to R76-1 requirements.

For auxiliary indicating devices, R76-1 3.4.2 specifies:

d < e <= 10d

and

e = 10^k kg

where k is a positive, negative or zero whole number.

Exception:

For class I instruments with d < 1 mg:

e = 1 mg

---

## 6. Classification — R76-1 Table 3

| Accuracy class | e | n minimum | n maximum | Min |
|---|---|---:|---:|---|
| I | 0.001 g <= e | 50,000 | — | 100e |
| II | 0.001 g <= e <= 0.05 g | 100 | 100,000 | 20e |
| II | 0.1 g <= e | 5,000 | 100,000 | 50e |
| III | 0.1 g <= e <= 2 g | 100 | 10,000 | 20e |
| III | 5 g <= e | 500 | 10,000 | 20e |
| IIII | 5 g <= e | 100 | 1,000 | 10e |

n = Max / e

For grading instruments, minimum capacity is reduced to 5e.

---

## 7. Multiple-range Instruments

For multiple-range instruments:

e1 < e2 < ... < er

Similar subscripts apply to Min, n and Max.

Each range is treated as if it were an instrument with one range.

---

## 8. Multi-interval Instruments

Each partial weighing range has:

- verification scale interval ei
- maximum capacity Maxi
- minimum capacity Mini
- number of verification scale intervals ni

For each partial range:

ni = Maxi / ei

For i = 1:

Min1 = Min

For later ranges:

Mini = Max(i-1)

---

## 9. Multi-interval Table 4

For each partial range except the last:

Maxi / e(i+1) must satisfy:

| Class | Requirement |
|---|---:|
| I | >= 50,000 |
| II | >= 5,000 |
| III | >= 500 |
| IIII | >= 50 |

---

## 10. Example of Multi-interval MPE

R76-1 gives the following example:

Class III instrument:

Max = 2 / 5 / 15 kg

e = 1 / 2 / 10 g

Ranges:

Range 1:
Min = 20 g
Max1 = 2 kg
e1 = 1 g
n1 = 2,000

Range 2:
Min2 = 2 kg
Max2 = 5 kg
e2 = 2 g
n2 = 2,500

Range 3:
Min3 = 5 kg
Max3 = 15 kg
e3 = 10 g
n3 = 1,500

Initial verification MPE:

- 0 g to 500 g: +/- 0.5e1 = +/- 0.5 g
- >500 g to 2,000 g: +/- 1e1 = +/- 1 g
- >2,000 g to 4,000 g: +/- 1e2 = +/- 2 g
- >4,000 g to 5,000 g: +/- 1.5e2 = +/- 3 g
- >5,000 g to 15,000 g: +/- 1e3 = +/- 10 g

For multi-interval instruments, e is taken according to the load applied.

---

## 11. Maximum Permissible Error — Initial Verification

R76-1 Table 6:

For load m expressed in verification scale intervals e:

### Class I

- 0 <= m <= 50,000: MPE = +/- 0.5e
- 50,000 < m <= 200,000: MPE = +/- 1.0e
- 200,000 < m: MPE = +/- 1.5e

### Class II

- 0 <= m <= 5,000: MPE = +/- 0.5e
- 5,000 < m <= 20,000: MPE = +/- 1.0e
- 20,000 < m <= 100,000: MPE = +/- 1.5e

### Class III

- 0 <= m <= 500: MPE = +/- 0.5e
- 500 < m <= 2,000: MPE = +/- 1.0e
- 2,000 < m <= 10,000: MPE = +/- 1.5e

### Class IIII

- 0 <= m <= 50: MPE = +/- 0.5e
- 50 < m <= 200: MPE = +/- 1.0e
- 200 < m <= 1,000: MPE = +/- 1.5e

The software must store the absolute MPE value separately from the +/- sign.

---

## 12. MPE in Service

R76-1 3.5.2:

MPE in service = 2 × MPE on initial verification.

The system must therefore distinguish at least:

- initial verification
- in-service verification

---

## 13. Error Determination

R76-1 3.5.3:

Errors are determined under normal test conditions.

When evaluating one influence factor, other factors should remain relatively constant near normal conditions.

---

## 14. Digital Rounding Error

R76-1 3.5.3.2:

The rounding error included in a digital indication shall be eliminated
if the actual scale interval d is greater than 0.2e.

This requirement must be represented in the test/calculation logic rather than
treated as an arbitrary software adjustment.

---

## 15. Net Values

R76-1 3.5.3.3:

MPE applies to the net value for every possible tare load,
except preset tare values.

---

## 16. Repeatability

R76-1 3.6.1:

The difference between results of several weighings of the same load
shall not be greater than the absolute MPE of the instrument for that load.

Therefore the repeatability module needs:

- test load
- individual weighing results
- maximum result
- minimum result
- difference/range
- applicable MPE
- pass/fail

---

## 17. Eccentric Loading

R76-1 3.6.2:

Unless otherwise specified, the applied load corresponds to:

1/3 × (Max + maximum additive tare effect)

Special cases exist for:
- load receptors with more than four support points
- load receptors subject to minimal off-centre loading
- rolling-load instruments

The software must therefore collect the applicable load-receptor/test configuration
before automatically calculating the eccentric test load.

---

## 18. Test Standard Weights

R76-1 3.7.1:

Standard weights/masses should meet OIML R111 requirements.

Their error shall not be greater than 1/3 of the MPE for the applied load.

For E2 or better weights, the relevant uncertainty condition applies as specified
by R76-1.

---

## 19. Auxiliary Verification Device

R76-1 3.7.2:

Maximum permissible errors of the auxiliary verification device shall be
1/3 of the instrument MPE for the applied load.

When weights are used, their errors shall not exceed 1/5 of the instrument MPE
for the same load.

---

## 20. Discrimination

R76-1 3.8:

### Non-self-indicating

Extra load:

0.4 × absolute MPE

but not less than 1 mg.

It must produce visible displacement of the indicating element.

### Self/semi-self-indicating — analog

Extra load:

absolute MPE

but not less than 1 mg.

It must cause permanent displacement corresponding to at least 0.7 times
the extra load.

### Self/semi-self-indicating — digital

Additional load:

1.4 × actual scale interval d

The indication must change unambiguously.

This digital requirement applies only where d >= 5 mg.

---

## 21. Influence Quantities

R76-1 3.9 requires the instrument to comply, as applicable, with:

- MPE requirements
- permissible difference requirements
- discrimination requirements

under specified influence conditions.

Important influence tests include:

- tilting
- temperature
- humidity
- voltage variation
- other applicable influence quantities
- time-related effects

---

## 22. Core Software Principle

All regulatory calculations and compliance decisions must be deterministic.

AI/OCR may assist with data extraction, but must not independently determine
regulatory compliance.

Every calculated result should retain:

- rule identifier
- OIML source
- source clause/table
- rule version
- input values
- calculated value
- pass/fail basis

---

## 23. Source Version

Primary metrological source:

OIML R 76-1:2006

Test report format/procedures:

OIML R 76-2:2007

The application must preserve the source version associated with every
calculation and test result.
