from datetime import datetime
import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet, ListStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle, HRFlowable, ListFlowable, ListItem

URGENCY_COLORS = {
    "ROUTINE": colors.HexColor("#22c55e"),      # green
    "CONSULT_SOON": colors.HexColor("#f59e0b"), # orange
    "GO_NOW": colors.HexColor("#ef4444")        # red
}

def generate_diagnosis_pdf(session: dict, patient_name: str) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        rightMargin=15 * mm, leftMargin=15 * mm, 
        topMargin=20 * mm, bottomMargin=20 * mm
    )
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Heading1'],
        fontSize=20,
        spaceAfter=5,
        textColor=colors.HexColor("#1e3a8a"),
        alignment=0
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.gray,
        spaceAfter=15
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor("#334155"),
        spaceBefore=15,
        spaceAfter=8,
        borderPadding=(0,0,2,0)
    )
    
    normal_text = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=11,
        leading=16,
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontSize=11,
        leading=16,
        leftIndent=15,
        firstLineIndent=-10
    )

    story = []

    # 1. Header Section
    story.append(Paragraph("AgeWell Healthcare", subtitle_style))
    story.append(Paragraph("Symptom & Intake Report", title_style))
    story.append(Spacer(1, 3 * mm))
    
    # Meta Info
    date_str = datetime.now().strftime('%d %b %Y, %I:%M %p')
    meta_html = f"<b>Patient:</b> {patient_name} <br/><b>Date:</b> {date_str}"
    story.append(Paragraph(meta_html, normal_text))
    
    story.append(Spacer(1, 4 * mm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceAfter=15))

    report = session.get("report_json", {}) or {}
    urgency = session.get("urgency_level", "ROUTINE")
    if not urgency:
        urgency = "ROUTINE"
    urgency = urgency.upper()

    # 2. Urgency Badge / Reason
    urgency_color = URGENCY_COLORS.get(urgency, colors.black)
    urgency_badge = ParagraphStyle(
        'UrgencyBadge',
        parent=normal_text,
        fontSize=12,
        textColor=urgency_color,
        fontName='Helvetica-Bold',
        spaceAfter=8
    )
    
    story.append(Paragraph(f"Urgency Level: {urgency.replace('_', ' ')}", urgency_badge))
    if report.get("urgency_reason"):
        story.append(Paragraph(f"<b>Assessment:</b> {report.get('urgency_reason')}", normal_text))
    
    story.append(Spacer(1, 5 * mm))

    # 3. Symptom Summary
    if report.get("symptom_summary"):
        story.append(Paragraph("Symptom Summary", section_heading))
        story.append(Paragraph(report.get("symptom_summary", ""), normal_text))
    
    # 4. Q&A Log Table
    qa_pairs = session.get("qa_pairs", [])
    if qa_pairs:
        story.append(Paragraph("Patient Intake Q&A", section_heading))
        
        # Adding Table Headers
        header_style = ParagraphStyle('TH', parent=normal_text, fontName='Helvetica-Bold', textColor=colors.whitesmoke)
        qa_rows = [[
            Paragraph("Question", header_style), 
            Paragraph("Answer", header_style)
        ]]
        
        for pair in qa_pairs:
            q_text = str(pair.get("question", ""))
            a_text = str(pair.get("answer", ""))
            if not a_text.strip():
                a_text = "No answer provided"
            
            qa_rows.append([
                Paragraph(q_text, normal_text), 
                Paragraph(a_text, normal_text)
            ])      

        # Auto width layout inside table
        qa_table = Table(qa_rows, colWidths=[105 * mm, 75 * mm], repeatRows=1)
        qa_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor("#475569")), 
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(qa_table)
        story.append(Spacer(1, 5 * mm))

    # 5. Lists (Conditions, Med Flags, Questions)
    def add_bullet_section(title, items):
        if items and isinstance(items, list):
            story.append(Paragraph(title, section_heading))
            for item in items:
                # Wrap each item in <bullet> text for built-in list look
                story.append(Paragraph(f"&bull; {str(item)}", bullet_style))
            story.append(Spacer(1, 3 * mm))

    add_bullet_section("Conditions to Discuss With Your Doctor", report.get("possible_conditions", []))
    add_bullet_section("Possible Medication Side Effects to Mention", report.get("medication_flags", []))
    add_bullet_section("Questions to Ask Your Doctor", report.get("doctor_questions", []))

    # 6. Disclaimer
    story.append(Spacer(1, 10 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0"), spaceAfter=10))
    disclaimer_style = ParagraphStyle('Disclaimer', parent=styles['Normal'], textColor=colors.gray, fontSize=9, leading=12)
    disclaimer_text = report.get("disclaimer", "This summary is for informational purposes only and is not a medical diagnosis. Please consult a qualified healthcare provider.")
    story.append(Paragraph(f"<b>Disclaimer:</b> {disclaimer_text}", disclaimer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
