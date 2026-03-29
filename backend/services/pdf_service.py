from datetime import datetime
import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

URGENCY_COLORS = {
    "ROUTINE": colors.green,
    "CONSULT_SOON": colors.orange,
    "GO_NOW": colors.red
}


def generate_diagnosis_pdf(session: dict, patient_name: str) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20 * mm, bottomMargin=20 * mm)
    styles = getSampleStyleSheet()
    story = []

    # Header
    story.append(Paragraph("AgeWell - Symptom Summary Report", styles['Title']))
    story.append(Paragraph(
        f"Patient: {patient_name} | Date: {datetime.now().strftime('%d %B %Y, %I:%M %p')}",
        styles['Normal']
    ))
    story.append(Spacer(1, 10 * mm))

    report = session.get("report_json", {})
    urgency = session.get("urgency_level", "ROUTINE")

    # Urgency badge
    urgency_style = ParagraphStyle(
        'urgency',
        textColor=URGENCY_COLORS.get(urgency, colors.black),
        fontSize=14,
        fontName='Helvetica-Bold'
    )
    story.append(Paragraph(
        f"Urgency: {urgency} - {report.get('urgency_reason', '')}",
        urgency_style
    ))
    story.append(Spacer(1, 6 * mm))

    # Symptom summary
    story.append(Paragraph("Symptom Summary", styles['Heading2']))
    story.append(Paragraph(report.get("symptom_summary", ""), styles['Normal']))
    story.append(Spacer(1, 6 * mm))

    # Q&A log
    story.append(Paragraph("Patient Intake Q&A", styles['Heading2']))
    qa_rows = [["Question", "Answer"]]
    for pair in session.get("qa_pairs", []):
        qa_rows.append([pair.get("question", ""), pair.get("answer", "")])

    qa_table = Table(qa_rows, colWidths=[120 * mm, 40 * mm])
    qa_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
    ]))
    story.append(qa_table)
    story.append(Spacer(1, 6 * mm))

    # Possible conditions
    story.append(Paragraph("Conditions to Discuss With Your Doctor", styles['Heading2']))
    for condition in report.get("possible_conditions", []):
        story.append(Paragraph(f"- {condition}", styles['Normal']))
    story.append(Spacer(1, 6 * mm))

    # Medication flags
    if report.get("medication_flags"):
        story.append(Paragraph("Possible Medication Side Effects to Mention", styles['Heading2']))
        for flag in report["medication_flags"]:
            story.append(Paragraph(f"- {flag}", styles['Normal']))
        story.append(Spacer(1, 6 * mm))

    # Doctor questions
    story.append(Paragraph("Questions to Ask Your Doctor", styles['Heading2']))
    for question in report.get("doctor_questions", []):
        story.append(Paragraph(f"- {question}", styles['Normal']))
    story.append(Spacer(1, 10 * mm))

    # Disclaimer
    disclaimer_style = ParagraphStyle('disc', textColor=colors.grey, fontSize=8)
    story.append(Paragraph(
        report.get(
            "disclaimer",
            "This summary is for informational purposes only and is not a medical diagnosis. Consult a qualified doctor."
        ),
        disclaimer_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
