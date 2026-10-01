from __future__ import annotations

from io import BytesIO
from typing import Any

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


# ---------------------------------------------------------
# HELPERS
# ---------------------------------------------------------

def _value(value: Any) -> str:
    if value is None or value == "":
        return "—"
    return str(value)


def _format_date(value: Any) -> str:
    if not value:
        return "—"

    text = str(value)

    # Keep the same date/time information while making it readable.
    if "T" in text:
        text = text.replace("T", " ")

    if text.endswith("Z"):
        text = text[:-1]

    return text


def _result_status(value: Any) -> str:
    status = str(value or "").upper()

    if status in {"PASS", "PASSED"}:
        return "PASS"
    if status in {"FAIL", "FAILED"}:
        return "FAIL"
    if status in {"NOT_APPLICABLE", "N/A", "NA"}:
        return "NOT APPLICABLE"

    return "MANUAL REVIEW"


def _overall_result(
    session: dict[str, Any],
    results: list[dict[str, Any]],
) -> str:
    session_result = str(session.get("final_result") or "").upper()

    if session_result in {"PASS", "PASSED"}:
        return "PASS"

    if session_result in {"FAIL", "FAILED"}:
        return "FAIL"

    statuses = [
        _result_status(result.get("result_status"))
        for result in results
    ]

    if any(status == "FAIL" for status in statuses):
        return "FAIL"

    if results and all(status == "PASS" for status in statuses):
        return "PASS"

    return "MANUAL REVIEW"


def _set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()

    shd = tc_pr.find(qn("w:shd"))

    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)

    shd.set(qn("w:fill"), fill)


def _set_cell_margins(
    cell,
    top: int = 80,
    start: int = 80,
    bottom: int = 80,
    end: int = 80,
) -> None:
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()

    tc_mar = tc_pr.first_child_found_in("w:tcMar")

    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)

    for margin, value in (
        ("top", top),
        ("start", start),
        ("bottom", bottom),
        ("end", end),
    ):
        node = tc_mar.find(qn(f"w:{margin}"))

        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)

        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def _set_cell_text(
    cell,
    text: Any,
    *,
    bold: bool = False,
    font_size: float = 8.5,
    color: str = "333333",
) -> None:
    cell.text = ""

    paragraph = cell.paragraphs[0]
    paragraph.paragraph_format.space_after = Pt(0)

    run = paragraph.add_run(_value(text))
    run.bold = bold
    run.font.name = "Arial"
    run.font.size = Pt(font_size)
    run.font.color.rgb = RGBColor.from_string(color)

    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    _set_cell_margins(cell)


def _style_table(table) -> None:
    table.style = "Table Grid"
    table.autofit = True

    for row in table.rows:
        for cell in row.cells:
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            _set_cell_margins(cell)


def _add_section_heading(document: Document, number: str, title: str) -> None:
    paragraph = document.add_paragraph()

    paragraph.paragraph_format.space_before = Pt(12)
    paragraph.paragraph_format.space_after = Pt(6)

    run = paragraph.add_run(f"{number}. {title}")
    run.bold = True
    run.font.name = "Arial"
    run.font.size = Pt(11)
    run.font.color.rgb = RGBColor(32, 32, 32)


def _add_normal_paragraph(
    document: Document,
    text: str,
    *,
    font_size: float = 8.5,
) -> None:
    paragraph = document.add_paragraph()

    paragraph.paragraph_format.space_after = Pt(5)

    run = paragraph.add_run(text)
    run.font.name = "Arial"
    run.font.size = Pt(font_size)
    run.font.color.rgb = RGBColor(51, 51, 51)


def _add_key_value_table(
    document: Document,
    rows: list[list[tuple[str, Any]]],
) -> None:
    table = document.add_table(
        rows=len(rows),
        cols=4,
    )

    _style_table(table)

    for row_index, row_data in enumerate(rows):
        for pair_index, (label, value) in enumerate(row_data):
            label_col = pair_index * 2
            value_col = label_col + 1

            _set_cell_text(
                table.cell(row_index, label_col),
                label,
                bold=True,
                font_size=8.5,
            )

            _set_cell_text(
                table.cell(row_index, value_col),
                value,
                font_size=8.5,
            )

            _set_cell_shading(
                table.cell(row_index, label_col),
                "F2F2F2",
            )

    document.add_paragraph().paragraph_format.space_after = Pt(0)


def _set_landscape_if_needed(document: Document) -> None:
    section = document.sections[0]

    section.top_margin = Inches(0.7)
    section.bottom_margin = Inches(0.65)
    section.left_margin = Inches(0.7)
    section.right_margin = Inches(0.7)


# ---------------------------------------------------------
# DOCX REPORT GENERATOR
# ---------------------------------------------------------

def generate_r76_docx_report(
    *,
    session: dict[str, Any],
    instrument: dict[str, Any],
    environment: list[dict[str, Any]],
    equipment: list[dict[str, Any]],
    results: list[dict[str, Any]],
    observations: list[dict[str, Any]] | None = None,
) -> BytesIO:

    observations = observations or []

    document = Document()

    _set_landscape_if_needed(document)

    section = document.sections[0]

    # ---------------------------------------------------------
    # DEFAULT FONT
    # ---------------------------------------------------------

    styles = document.styles

    normal_style = styles["Normal"]
    normal_style.font.name = "Arial"
    normal_style.font.size = Pt(8.5)

    # ---------------------------------------------------------
    # REPORT HEADER
    # ---------------------------------------------------------

    report_id = (
        session.get("report_id")
        or f"R76-{str(session.get('session_number') or session.get('id', 'REPORT'))[:20]}"
    )

    title = document.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.paragraph_format.space_after = Pt(2)

    run = title.add_run("OIMLENSE")
    run.bold = True
    run.font.name = "Arial"
    run.font.size = Pt(22)
    run.font.color.rgb = RGBColor(32, 32, 32)

    subtitle = document.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle.paragraph_format.space_after = Pt(2)

    run = subtitle.add_run(
        "TEST REPORT"
    )
    run.bold = True
    run.font.name = "Arial"
    run.font.size = Pt(14)
    run.font.color.rgb = RGBColor(70, 70, 70)

    subtitle2 = document.add_paragraph()
    subtitle2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle2.paragraph_format.space_after = Pt(10)

    run = subtitle2.add_run(
        "NON-AUTOMATIC WEIGHING INSTRUMENTS (NAWI)"
    )
    run.bold = True
    run.font.name = "Arial"
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor(100, 100, 100)
    run.font.name = "Arial"
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(102, 102, 102)

    verify = document.add_paragraph()
    verify.alignment = WD_ALIGN_PARAGRAPH.CENTER
    verify.paragraph_format.space_after = Pt(6)

    run = verify.add_run(
        f"Report ID: {report_id}  |  This editable DOCX report is generated from the OIMLense test-session record. For report verification, use the corresponding Report ID and the official OIMLense report repository."
    )
    run.font.name = "Arial"
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor(102, 102, 102)

    _add_section_heading(
        document,
        "REPORT",
        "Report Information",
    )

    _add_key_value_table(
        document,
        [
            [
                ("Report ID", report_id),
                ("Report Date", _format_date(session.get("created_at"))),
            ],
            [
                ("Session No.", session.get("session_number")),
                ("Test Type", session.get("test_type")),
            ],
            [
                ("Test Location", session.get("test_location")),
                ("Status", session.get("status")),
            ],
        ],
    )

    # ---------------------------------------------------------
    # 1. INSTRUMENT IDENTIFICATION
    # ---------------------------------------------------------

    _add_section_heading(
        document,
        "1",
        "Instrument Identification",
    )

    _add_key_value_table(
        document,
        [
            [
                ("Manufacturer", instrument.get("manufacturer")),
                ("Model", instrument.get("model")),
            ],
            [
                ("Serial Number", instrument.get("serial_number")),
                ("Instrument Type", instrument.get("instrument_type")),
            ],
            [
                ("Accuracy Class", instrument.get("accuracy_class")),
                ("Unit", instrument.get("unit")),
            ],
            [
                ("Max Capacity", instrument.get("max_capacity")),
                ("Min Capacity", instrument.get("min_capacity")),
            ],
            [
                (
                    "Verification Scale Interval (e)",
                    instrument.get("verification_scale_interval_e"),
                ),
                (
                    "Actual Scale Interval (d)",
                    instrument.get("actual_scale_interval_d"),
                ),
            ],
            [
                (
                    "Number of Intervals (n)",
                    instrument.get(
                        "number_of_verification_scale_intervals_n"
                    ),
                ),
                (
                    "Type Approval No.",
                    instrument.get("type_approval_number"),
                ),
            ],
            [
                ("Software Version", instrument.get("software_version")),
                (
                    "Year of Manufacture",
                    instrument.get("year_of_manufacture"),
                ),
            ],
        ],
    )

    # ---------------------------------------------------------
    # 2. REFERENCE STANDARD
    # ---------------------------------------------------------

    _add_section_heading(
        document,
        "2",
        "Reference Standard",
    )

    _add_normal_paragraph(
        document,
        "Testing and compliance evaluation performed with reference to "
        "OIML Recommendation R 76 — Non-Automatic Weighing Instruments "
        "and the applicable rule definitions configured in OIMLense."
    )

    # ---------------------------------------------------------
    # 3. ENVIRONMENT
    # ---------------------------------------------------------

    _add_section_heading(
        document,
        "3",
        "Laboratory / Environmental Conditions",
    )

    env = environment[0] if environment else {}

    _add_key_value_table(
        document,
        [
            [
                (
                    "Ambient Temperature",
                    env.get("ambient_temperature"),
                ),
                (
                    "Relative Humidity",
                    env.get("relative_humidity"),
                ),
            ],
            [
                (
                    "Atmospheric Pressure",
                    env.get("atmospheric_pressure"),
                ),
                (
                    "Supply Voltage",
                    env.get("supply_voltage"),
                ),
            ],
            [
                (
                    "Supply Frequency",
                    env.get("supply_frequency"),
                ),
                (
                    "Tilt Condition",
                    env.get("tilt_condition"),
                ),
            ],
            [
                (
                    "Stabilization Time",
                    env.get("stabilization_time_minutes"),
                ),
                (
                    "Other Conditions",
                    env.get("other_conditions"),
                ),
            ],
        ],
    )

    # ---------------------------------------------------------
    # 4. TEST EQUIPMENT
    # ---------------------------------------------------------

    if equipment:
        _add_section_heading(
            document,
            "4",
            "Test Equipment",
        )

        table = document.add_table(
            rows=1,
            cols=6,
        )

        _style_table(table)

        headers = [
            "Name",
            "Type",
            "Manufacturer",
            "Model",
            "Serial No.",
            "Calibration",
        ]

        for index, header in enumerate(headers):
            _set_cell_text(
                table.cell(0, index),
                header,
                bold=True,
                font_size=7.5,
            )
            _set_cell_shading(
                table.cell(0, index),
                "F0F0F0",
            )

        for item in equipment:
            row = table.add_row()

            values = [
                item.get("name"),
                item.get("equipment_type"),
                item.get("manufacturer"),
                item.get("model"),
                item.get("serial_number"),
                item.get("calibration_id"),
            ]

            for index, value in enumerate(values):
                _set_cell_text(
                    row.cells[index],
                    value,
                    font_size=7.5,
                )

        document.add_paragraph()

    # ---------------------------------------------------------
    # 5. TEST RESULTS
    # ---------------------------------------------------------

    _add_section_heading(
        document,
        "5",
        "Test Results",
    )

    table = document.add_table(
        rows=1,
        cols=6,
    )

    _style_table(table)

    headers = [
        "#",
        "Test / Rule",
        "Measured Error",
        "MPE / Limit",
        "Clause",
        "Result",
    ]

    for index, header in enumerate(headers):
        _set_cell_text(
            table.cell(0, index),
            header,
            bold=True,
            font_size=7.5,
        )
        _set_cell_shading(
            table.cell(0, index),
            "F0F0F0",
        )

    if results:
        for index, result in enumerate(results, start=1):
            calculated = result.get("calculated_values") or {}

            test_name = (
                calculated.get("test_name")
                or result.get("rule_id")
                or result.get("test_definition_id")
                or "R76 Test"
            )

            measured_error = result.get("measured_error")
            mpe_value = result.get("mpe_value")
            clause = result.get("source_clause")
            status = _result_status(result.get("result_status"))

            row = table.add_row()

            values = [
                index,
                test_name,
                measured_error,
                mpe_value,
                clause,
                status,
            ]

            for column, value in enumerate(values):
                _set_cell_text(
                    row.cells[column],
                    value,
                    font_size=7.5,
                )

            # Center the result column for clear PASS/FAIL visibility.
            result_cell = row.cells[5]
            for paragraph in result_cell.paragraphs:
                paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER

            if status == "PASS":
                _set_cell_shading(result_cell, "EAF6EC")
                for paragraph in result_cell.paragraphs:
                    for run in paragraph.runs:
                        run.bold = True
                        run.font.color.rgb = RGBColor(24, 120, 55)
            elif status == "FAIL":
                _set_cell_shading(result_cell, "FBEAEA")
                for paragraph in result_cell.paragraphs:
                    for run in paragraph.runs:
                        run.bold = True
                        run.font.color.rgb = RGBColor(180, 35, 35)
            else:
                _set_cell_shading(result_cell, "FFF7DD")
                for paragraph in result_cell.paragraphs:
                    for run in paragraph.runs:
                        run.bold = True
    else:
        row = table.add_row()

        values = [
            "—",
            "No test results recorded",
            "—",
            "—",
            "—",
            "MANUAL REVIEW",
        ]

        for column, value in enumerate(values):
            _set_cell_text(
                row.cells[column],
                value,
                font_size=7.5,
            )

        _set_cell_shading(row.cells[5], "FFF7DD")

    document.add_paragraph()

    # ---------------------------------------------------------
    # 6. TEST OBSERVATIONS
    # ---------------------------------------------------------

    if observations:
        _add_section_heading(
            document,
            "6",
            "Test Observations",
        )

        table = document.add_table(
            rows=1,
            cols=6,
        )

        _style_table(table)

        headers = [
            "#",
            "Load Applied",
            "Indication Before",
            "Indication After",
            "Error",
            "Position",
        ]

        for index, header in enumerate(headers):
            _set_cell_text(
                table.cell(0, index),
                header,
                bold=True,
                font_size=7.5,
            )
            _set_cell_shading(
                table.cell(0, index),
                "F0F0F0",
            )

        for index, item in enumerate(observations, start=1):
            row = table.add_row()

            values = [
                index,
                item.get("load_applied"),
                item.get("indication_before"),
                item.get("indication_after"),
                item.get("error_observed"),
                item.get("position"),
            ]

            for column, value in enumerate(values):
                _set_cell_text(
                    row.cells[column],
                    value,
                    font_size=7.5,
                )

        document.add_paragraph()

    # ---------------------------------------------------------
    # 7. FINAL COMPLIANCE DECISION
    # ---------------------------------------------------------

    overall = _overall_result(session, results)

    _add_section_heading(
        document,
        "7",
        "Final Compliance Decision",
    )

    table = document.add_table(
        rows=4,
        cols=2,
    )

    _style_table(table)

    passed = sum(
        1
        for item in results
        if str(item.get("result_status") or "").upper() == "PASS"
    )

    failed = sum(
        1
        for item in results
        if str(item.get("result_status") or "").upper() == "FAIL"
    )

    pending = max(len(results) - passed - failed, 0)

    decision_rows = [
        ("Overall Result", overall),
        ("Number of Tests", len(results)),
        ("Tests Passed", passed),
        ("Tests Failed", failed),
        ("Tests Pending", pending),
    ]

    table = document.tables[-1]

    # Add the fifth row required for pending tests.
    table.add_row()

    for row_index, (label, value) in enumerate(decision_rows):
        _set_cell_text(
            table.cell(row_index, 0),
            label,
            bold=True,
            font_size=8.5,
        )
        _set_cell_text(
            table.cell(row_index, 1),
            value,
            bold=(row_index == 0),
            font_size=8.5,
        )

        _set_cell_shading(
            table.cell(row_index, 0),
            "F2F2F2",
        )

    # Make the overall decision visually prominent.
    result_cell = table.cell(0, 1)

    for paragraph in result_cell.paragraphs:
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in paragraph.runs:
            run.bold = True
            run.font.size = Pt(10)

    if overall == "PASS":
        _set_cell_shading(result_cell, "EAF6EC")
        for paragraph in result_cell.paragraphs:
            for run in paragraph.runs:
                run.font.color.rgb = RGBColor(24, 120, 55)
    elif overall == "FAIL":
        _set_cell_shading(result_cell, "FBEAEA")
        for paragraph in result_cell.paragraphs:
            for run in paragraph.runs:
                run.font.color.rgb = RGBColor(180, 35, 35)
    else:
        _set_cell_shading(result_cell, "FFF7DD")

    document.add_paragraph()

    # ---------------------------------------------------------
    # 8. REGULATORY TRACEABILITY
    # ---------------------------------------------------------

    _add_section_heading(
        document,
        "8",
        "Regulatory Traceability",
    )

    _add_normal_paragraph(
        document,
        "The individual test results in this report are linked to the "
        "corresponding OIMLense R76 test definitions, rule identifiers, "
        "source clauses and configured rule versions where available. "
        "The calculations are generated by the deterministic OIMLense R76 "
        "calculation engine."
    )

    # ---------------------------------------------------------
    # 9. REVIEW AND APPROVAL
    # ---------------------------------------------------------

    _add_section_heading(
        document,
        "9",
        "Review and Approval",
    )

    table = document.add_table(
        rows=3,
        cols=3,
    )

    _style_table(table)

    headers = [
        "Tested By",
        "Reviewed By",
        "Approved By",
    ]

    for index, header in enumerate(headers):
        _set_cell_text(
            table.cell(0, index),
            header,
            bold=True,
            font_size=8.5,
        )
        _set_cell_shading(
            table.cell(0, index),
            "F2F2F2",
        )

    user_values = [
        session.get("officer_user_id"),
        session.get("reviewer_user_id"),
        session.get("approver_user_id"),
    ]

    for index, value in enumerate(user_values):
        _set_cell_text(
            table.cell(1, index),
            value,
            font_size=8.5,
        )

    signatures = [
        "Signature: ____________________",
        "Signature: ____________________",
        "Signature: ____________________",
    ]

    for index, value in enumerate(signatures):
        _set_cell_text(
            table.cell(2, index),
            value,
            font_size=7.5,
        )

    document.add_paragraph()

    _add_normal_paragraph(
        document,
        "This document is electronically generated by OIMLense. "
        "Final approval and legal validity remain subject to the "
        "authorized laboratory / officer review process.",
        font_size=7.5,
    )

    # ---------------------------------------------------------
    # SAVE TO MEMORY BUFFER
    # ---------------------------------------------------------

    buffer = BytesIO()

    document.save(buffer)

    buffer.seek(0)

    return buffer
