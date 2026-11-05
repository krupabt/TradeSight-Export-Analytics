"""
TradeSight Export Analytics — Strategic Brief Generator
Generates a professional, publication-quality 2-page Strategic Brief PDF.
Complies with Cynaris Milestone requirements:
- Exactly 2 pages
- Page 1: Situation, Key Findings, Business Implications
- Page 2: Three Prioritised Recommendations, Conclusion & Next Steps
- Real baseline KPIs, native ₹ symbol, and strict non-fabrication rules.
"""

import os
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    HRFlowable,
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

BASE_DIR = Path(__file__).resolve().parent.parent.parent
OUTPUT_PDF = BASE_DIR / "week9_dashboard" / "final_strategic_brief.pdf"

# Register TrueType font family with full Unicode & Indian Rupee (₹ / U+20B9) support
FONT_REGULAR = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
FONT_ITALIC = "Helvetica-Oblique"
FONT_BOLD_ITALIC = "Helvetica-Bold"

segoe_paths = {
    'regular': r"C:\Windows\Fonts\segoeui.ttf",
    'bold': r"C:\Windows\Fonts\segoeuib.ttf",
    'italic': r"C:\Windows\Fonts\segoeuii.ttf",
    'boldItalic': r"C:\Windows\Fonts\segoeuiz.ttf",
}
arial_paths = {
    'regular': r"C:\Windows\Fonts\arial.ttf",
    'bold': r"C:\Windows\Fonts\arialbd.ttf",
    'italic': r"C:\Windows\Fonts\ariali.ttf",
    'boldItalic': r"C:\Windows\Fonts\arialbi.ttf",
}

if all(os.path.exists(p) for p in segoe_paths.values()):
    pdfmetrics.registerFont(TTFont('SegoeUI', segoe_paths['regular']))
    pdfmetrics.registerFont(TTFont('SegoeUI-Bold', segoe_paths['bold']))
    pdfmetrics.registerFont(TTFont('SegoeUI-Italic', segoe_paths['italic']))
    pdfmetrics.registerFont(TTFont('SegoeUI-BoldItalic', segoe_paths['boldItalic']))
    pdfmetrics.registerFontFamily('SegoeUI', normal='SegoeUI', bold='SegoeUI-Bold', italic='SegoeUI-Italic', boldItalic='SegoeUI-BoldItalic')
    FONT_REGULAR = "SegoeUI"
    FONT_BOLD = "SegoeUI-Bold"
    FONT_ITALIC = "SegoeUI-Italic"
    FONT_BOLD_ITALIC = "SegoeUI-BoldItalic"
elif all(os.path.exists(p) for p in arial_paths.values()):
    pdfmetrics.registerFont(TTFont('Arial', arial_paths['regular']))
    pdfmetrics.registerFont(TTFont('Arial-Bold', arial_paths['bold']))
    pdfmetrics.registerFont(TTFont('Arial-Italic', arial_paths['italic']))
    pdfmetrics.registerFont(TTFont('Arial-BoldItalic', arial_paths['boldItalic']))
    pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='Arial-Bold', italic='Arial-Italic', boldItalic='Arial-BoldItalic')
    FONT_REGULAR = "Arial"
    FONT_BOLD = "Arial-Bold"
    FONT_ITALIC = "Arial-Italic"
    FONT_BOLD_ITALIC = "Arial-BoldItalic"


class NumberedCanvas(canvas.Canvas):
    """Dynamically applies corporate running headers, rule lines, and 'Page X of Y' footers."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont(FONT_REGULAR, 7.5)
        self.setFillColor(colors.HexColor("#718096"))

        # Running Header on Page 2
        if self._pageNumber > 1:
            self.drawString(36, 762, "TradeSight Export Analytics — Strategic Brief")
            self.drawRightString(576, 762, "Cynaris Capstone Milestone: Final Dashboard & Strategic Brief")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(36, 756, 576, 756)

        # Running Footer on all pages
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(36, 32, 576, 32)
        self.drawString(36, 22, "TradeSight Export Analytics | Live URL: https://tradesight-export-analytics.vercel.app | Author: Krupa B T")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 22, page_str)
        self.restoreState()


def create_strategic_brief_pdf():
    # Page setup: Letter (8.5 x 11 inches) with 0.5 in (36 pt) margins
    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=32,
        bottomMargin=38,
    )

    styles = getSampleStyleSheet()

    c_navy = colors.HexColor("#0B2545")
    c_teal = colors.HexColor("#0D5257")
    c_dark = colors.HexColor("#1A202C")
    c_muted = colors.HexColor("#4A5568")

    title_style = ParagraphStyle(
        "BriefTitle",
        parent=styles["Normal"],
        fontName=FONT_BOLD,
        fontSize=15,
        leading=18,
        textColor=c_navy,
    )
    subtitle_style = ParagraphStyle(
        "BriefSubtitle",
        parent=styles["Normal"],
        fontName=FONT_BOLD,
        fontSize=8.5,
        leading=11.5,
        textColor=c_teal,
    )
    meta_style = ParagraphStyle(
        "BriefMeta",
        parent=styles["Normal"],
        fontName=FONT_REGULAR,
        fontSize=7.2,
        leading=9.5,
        textColor=c_muted,
    )
    h1_style = ParagraphStyle(
        "H1_Style",
        parent=styles["Heading1"],
        fontName=FONT_BOLD,
        fontSize=9.5,
        leading=12.5,
        textColor=c_navy,
        spaceBefore=4,
        spaceAfter=2,
    )
    h2_style = ParagraphStyle(
        "H2_Style",
        parent=styles["Heading2"],
        fontName=FONT_BOLD,
        fontSize=8,
        leading=10.5,
        textColor=c_teal,
        spaceBefore=3,
        spaceAfter=1.5,
    )
    body_style = ParagraphStyle(
        "Body_Style",
        parent=styles["Normal"],
        fontName=FONT_REGULAR,
        fontSize=7.2,
        leading=9.6,
        textColor=c_dark,
        spaceAfter=2.5,
    )
    body_bold = ParagraphStyle(
        "Body_Bold",
        parent=body_style,
        fontName=FONT_BOLD,
    )
    table_cell = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName=FONT_REGULAR,
        fontSize=6.8,
        leading=8.8,
        textColor=c_dark,
    )
    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName=FONT_BOLD,
        fontSize=6.8,
        leading=8.8,
        textColor=c_dark,
    )
    rec_title_style = ParagraphStyle(
        "RecTitle",
        parent=styles["Normal"],
        fontName=FONT_BOLD,
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white,
    )

    story = []

    # =========================================================================
    # PAGE 1: SITUATION, KEY FINDINGS, BUSINESS IMPLICATIONS
    # =========================================================================

    # Header Banner
    story.append(Paragraph("TradeSight Export Analytics – Strategic Brief", title_style))
    story.append(Paragraph("Executive Briefing on Export Performance, Logistics SLA, Data Governance & Strategic Roadmap", subtitle_style))
    story.append(Spacer(1, 1))
    story.append(Paragraph("<b>Author:</b> Krupa B T | <b>Milestone:</b> Final Dashboard + Strategic Brief (Cynaris Data Analyst Internship)", meta_style))
    story.append(Paragraph("<b>Production Dashboard:</b> <font color='#0D5257'><u>https://tradesight-export-analytics.vercel.app</u></font> | <b>GitHub:</b> krupabt/TradeSight-Export-Analytics", meta_style))
    story.append(HRFlowable(width="100%", thickness=1.2, color=c_navy, spaceBefore=2, spaceAfter=4))

    # 1. Situation
    story.append(Paragraph("1. Situation & Context", h1_style))
    story.append(Paragraph(
        "TradeSight Export Management operates as a simulated Chennai-based export management enterprise (modeled with ~45 operational personnel and 50 institutional clients across 12 destination countries). "
        "Prior to this initiative, commercial leadership lacked an integrated, auditable analytics platform to evaluate multi-year export revenue velocity, carrier delivery SLAs, physical return exceptions, and inventory capital allocation. "
        "To resolve this, the <b>TradeSight Export Analytics Dashboard V1</b> was engineered and deployed publicly on Vercel (<b>https://tradesight-export-analytics.vercel.app</b>) using React 18, Vite, and Recharts, providing seven specialized analytical modules: "
        "<b>(1) Executive Overview, (2) Export Revenue, (3) Logistics & Fulfillment, (4) Returns & Quality Audit, (5) Buyer Analytics & Segmentation, (6) Product Catalogue, and (7) Data Governance</b>.",
        body_style
    ))
    story.append(Paragraph(
        "All calculations originate strictly from the three original project datasets under zero-synthetic-data compliance: "
        "<b>da_b2b_orders.csv</b> (600 shipments, 13 columns; commercial wholesale orders), "
        "<b>da_product_catalogue.csv</b> (50 SKUs, 7 columns; master product specifications and margins), and "
        "<b>da_customer_profiles.csv</b> (200 accounts, 10 columns; direct retail consumer profiles).",
        body_style
    ))

    # Core Baseline KPI Scorecard (Page 1)
    kpi_card_data = [
        [
            Paragraph("<b>Total Export Revenue</b><br/>₹396.88 Cr<br/><font color='#4A5568'>600 Orders</font>", table_cell_bold),
            Paragraph("<b>Average Order Value</b><br/>₹66.15 Lakh<br/><font color='#4A5568'>1.51M Shipped Units</font>", table_cell_bold),
            Paragraph("<b>On-Time Delivery SLA</b><br/>77.50%<br/><font color='#C53030'>135 Delayed Shipments</font>", table_cell_bold),
            Paragraph("<b>Avg Transit Time</b><br/>23.49 Days<br/><font color='#4A5568'>Median: 23.5 Days</font>", table_cell_bold),
            Paragraph("<b>Unit Return Rate</b><br/>1.01%<br/><font color='#4A5568'>15,242 Returned Units</font>", table_cell_bold),
            Paragraph("<b>Catalogue SKUs & Margin</b><br/>50 SKUs / 13,857 Stk<br/><font color='#0D5257'>58.62% Avg Markup</font>", table_cell_bold),
        ]
    ]
    t_kpi = Table(kpi_card_data, colWidths=[90, 90, 90, 90, 90, 90])
    t_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#CBD5E0")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
    ]))
    story.append(t_kpi)
    story.append(Spacer(1, 3))

    # 2. Key Findings
    story.append(Paragraph("2. Key Empirical Findings", h1_style))
    findings_data = [
        [Paragraph("<b>Analytical Dimension</b>", table_cell_bold), Paragraph("<b>Empirical Evidence & Quantitative Findings (from Original CSV Datasets)</b>", table_cell_bold)],
        [
            Paragraph("<b>Commercial Revenue & Order Volume</b>", table_cell_bold),
            Paragraph("Total export turnover reached <b>₹3,968,829,214.20 INR</b> (₹396.88 Cr) across <b>600 transactions</b>, with an AOV of <b>₹66.15 Lakh</b>. Revenue displays marked quarterly seasonality, peaking in Q4 2023 (₹65.73 Cr) and June 2024 (₹56.24 Cr).", table_cell)
        ],
        [
            Paragraph("<b>Buyer & Supplier Structure</b>", table_cell_bold),
            Paragraph("Transactions encompass <b>187 distinct commercial buyers</b> and <b>80 distinct suppliers/sellers</b>. Repeat buyers account for <b>227 orders (37.83%)</b>. Buyer volume is moderately concentrated, with the top 10 buyers generating approximately 15% of wholesale turnover.", table_cell)
        ],
        [
            Paragraph("<b>Logistics SLA & Transit Times</b>", table_cell_bold),
            Paragraph("Overall on-time delivery stands at <b>77.50% (465 orders)</b>, leaving <b>135 orders delayed (22.50%)</b>. Transit duration averages <b>23.49 days</b> (range: 10 to 35 days). Port dispatch delays and carrier bottlenecks account for major fulfillment variance.", table_cell)
        ],
        [
            Paragraph("<b>Returns & Physical Anomalies</b>", table_cell_bold),
            Paragraph("Total units returned were <b>15,242</b> out of 1,509,070 shipped (<b>1.01% return rate</b>). However, data audit reveals <b>two physical return overrun anomalies</b>: Order <code>B2B-00131</code> (shipped 22, returned 28) and Order <code>B2B-00188</code> (shipped 39, returned 48).", table_cell)
        ],
        [
            Paragraph("<b>Master Catalogue & Inventory</b>", table_cell_bold),
            Paragraph("Catalogue contains <b>50 SKUs</b> across 5 categories, with <b>13,857 warehouse stock units</b>. Average theoretical unit gross margin between retail Price_MRP and wholesale Price_Wholesale_COGS is <b>58.62%</b> (individual SKUs range from 46.15% to 66.67%).", table_cell)
        ],
        [
            Paragraph("<b>Retail Consumer Profiles</b>", table_cell_bold),
            Paragraph("The <code>da_customer_profiles.csv</code> dataset holds <b>200 retail consumers</b> generating <b>₹49.93 Lakh</b> with an overall <b>3.0% churn rate (6 accounts)</b>. 42 accounts exhibit chronological date inversions (First_Purchase_Date > Last_Purchase_Date).", table_cell)
        ],
        [
            Paragraph("<b>Documented Dataset Limitations</b>", table_cell_bold),
            Paragraph("Three requested enterprise metrics are mathematically unsupported by raw data and labeled <b>NOT AVAILABLE</b>: (1) <b>Foreign Exchange (FX) Impact</b> (all orders in INR), (2) <b>B2B Order Margin</b> (no SKU-level COGS in orders), and (3) <b>Customs Compliance</b> (no shipping bills).", table_cell)
        ],
    ]
    t_find = Table(findings_data, colWidths=[125, 415])
    t_find.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_navy),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E0")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 1.8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.8),
    ]))
    story.append(t_find)
    story.append(Spacer(1, 3))

    # 3. Business Implications
    story.append(Paragraph("3. Business Implications for Leadership Decision-Making", h1_style))
    implications_text = (
        "• <b>Fulfillment Bottlenecks Threaten Buyer Retention:</b> The 22.50% delay rate (135 orders) directly jeopardizes SLA compliance, risks contractual late delivery penalties, and erodes repeat purchase confidence among commercial buyers.<br/>"
        "• <b>Data Quality Anomalies Reflect Upstream ERP Gaps:</b> Return overruns (returned units exceeding shipped units) and chronological date inversions demonstrate lack of validation controls at point of data entry, creating compliance vulnerabilities.<br/>"
        "• <b>Catalogue Margins Must Not Be Confused with True Order Profitability:</b> The 58.62% catalogue markup represents retail reference pricing. B2B orders lack landed manufacturing costs, ocean freight, insurance, and export duties. Treating catalogue margin as actual commercial profit risks severe financial miscalculation.<br/>"
        "• <b>Information Gaps Restrict Strategic Agility:</b> Sole reliance on INR denominations blinds leadership to foreign exchange fluctuations, while absence of customs tracking prevents operational bottleneck diagnostics at port terminals."
    )
    story.append(Paragraph(implications_text, body_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: THREE PRIORITISED RECOMMENDATIONS & CONCLUSION
    # =========================================================================

    story.append(Paragraph("4. Three Prioritised Strategic Recommendations", h1_style))
    story.append(Paragraph(
        "Based on quantitative findings and business risk implications, the following three actionable, prioritized recommendations are presented for immediate operational adoption. In accordance with enterprise governance standards, no speculative percentage gains or unverified financial returns are claimed:",
        body_style
    ))
    story.append(Spacer(1, 2))

    # Recommendation 1 Table
    rec1_data = [
        [Paragraph("<b>RECOMMENDATION 1: Improve Export Delivery Performance & Carrier SLA Governance</b>", rec_title_style), Paragraph("<b>PRIORITY: HIGH (IMMEDIATE)</b>", rec_title_style)],
        [
            Paragraph("<b>Identified Problem</b>", table_cell_bold),
            Paragraph("135 export shipments (22.50%) were delayed past scheduled delivery dates, with an average transit time of 23.49 days and long-tail shipments extending up to 35 days, driving fulfillment uncertainty.", table_cell)
        ],
        [
            Paragraph("<b>Proposed Action Plan</b>", table_cell_bold),
            Paragraph("1. Audit all 135 delayed orders segmented by carrier, origin port, and freight mode.<br/>"
                      "2. Deploy end-to-end milestone tracking capturing port dispatch, customs clearance, ocean transit, and final delivery.<br/>"
                      "3. Establish a formalized 48-hour exception escalation review for any shipment exceeding 20 days in transit.", table_cell)
        ],
        [
            Paragraph("<b>Expected Business Impact</b>", table_cell_bold),
            Paragraph("Provides real-time shipment visibility, enables proactive carrier accountability, accelerates issue escalation prior to SLA breach, and strengthens long-term commercial buyer satisfaction and retention.", table_cell)
        ],
        [
            Paragraph("<b>Key KPI to Monitor</b>", table_cell_bold),
            Paragraph("<b>On-Time Delivery SLA %</b> (baseline: 77.50%; target: >85.00%) | <b>Delayed Shipment Count</b> (baseline: 135 orders; target: <90 orders)", table_cell_bold)
        ],
    ]
    t_rec1 = Table(rec1_data, colWidths=[120, 420])
    t_rec1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0D5257")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E0")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.0),
    ]))
    story.append(t_rec1)
    story.append(Spacer(1, 4))

    # Recommendation 2 Table
    rec2_data = [
        [Paragraph("<b>RECOMMENDATION 2: Strengthen Upstream Data Quality & Validation Gates</b>", rec_title_style), Paragraph("<b>PRIORITY: HIGH (IMMEDIATE)</b>", rec_title_style)],
        [
            Paragraph("<b>Identified Problem</b>", table_cell_bold),
            Paragraph("Critical data integrity exceptions were detected: two physical return overruns (B2B-00131: 28 returned vs 22 shipped; B2B-00188: 48 returned vs 39 shipped) and 42 customer profile chronological date inversions.", table_cell)
        ],
        [
            Paragraph("<b>Proposed Action Plan</b>", table_cell_bold),
            Paragraph("1. Audit upstream ERP/warehouse entry points for B2B-00131 and B2B-00188 to determine clerical vs. physical causes.<br/>"
                      "2. Implement strict hard input validation in ERP: reject return entries where <code>return_qty > quantity_units</code> without authorized management credit override.<br/>"
                      "3. Add database constraints enforcing <code>Last_Purchase_Date >= First_Purchase_Date</code> across CRM systems.", table_cell)
        ],
        [
            Paragraph("<b>Expected Business Impact</b>", table_cell_bold),
            Paragraph("Ensures 100% audit-compliant reporting, prevents distorted inventory asset valuations, eliminates physical impossibilities from commercial ledgers, and restores stakeholder confidence in analytical reporting.", table_cell)
        ],
        [
            Paragraph("<b>Key KPI to Monitor</b>", table_cell_bold),
            Paragraph("<b>Return Overrun Anomaly Count</b> (baseline: 2; target: 0) | <b>Chronological Date Inversion Count</b> (baseline: 42; target: 0)", table_cell_bold)
        ],
    ]
    t_rec2 = Table(rec2_data, colWidths=[120, 420])
    t_rec2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#742A2A")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E0")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.0),
    ]))
    story.append(t_rec2)
    story.append(Spacer(1, 4))

    # Recommendation 3 Table
    rec3_data = [
        [Paragraph("<b>RECOMMENDATION 3: Enhance Export Data Architecture & Financial Visibility</b>", rec_title_style), Paragraph("<b>PRIORITY: MEDIUM (STRATEGIC)</b>", rec_title_style)],
        [
            Paragraph("<b>Identified Problem</b>", table_cell_bold),
            Paragraph("Existing data architecture lacks relational linkage between B2B orders and product SKUs, records transactions solely in INR without FX metadata, and omits customs/ICEGATE documentation attributes.", table_cell)
        ],
        [
            Paragraph("<b>Proposed Action Plan</b>", table_cell_bold),
            Paragraph("1. Implement relational <code>order_line_items</code> schema connecting <code>order_id</code> to <code>Product_ID</code>, capturing landed unit production costs, freight charges, and insurance.<br/>"
                      "2. Enrich transactions with foreign currency attributes (<code>currency_code</code>, <code>booking_spot_rate</code>, <code>realized_rate</code>).<br/>"
                      "3. Integrate customs clearance milestones (Shipping Bill number, Port of Loading, export duty clearance).", table_cell)
        ],
        [
            Paragraph("<b>Expected Business Impact</b>", table_cell_bold),
            Paragraph("Enables mathematically rigorous order-level gross and net profit margin analysis, empowers leadership to hedge against foreign exchange volatility, and ensures end-to-end export regulatory compliance.", table_cell)
        ],
        [
            Paragraph("<b>Key KPI to Monitor</b>", table_cell_bold),
            Paragraph("<b>SKU-to-Order Line-Item Linkage Rate</b> (target: 100%) | <b>True Net Margin Calculation Coverage</b> (target: 100%)", table_cell_bold)
        ],
    ]
    t_rec3 = Table(rec3_data, colWidths=[120, 420])
    t_rec3.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#2C5282")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E0")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.0),
    ]))
    story.append(t_rec3)
    story.append(Spacer(1, 4))

    # 5. Conclusion & Operational Next Steps
    story.append(Paragraph("5. Conclusion & Operational Next Steps", h1_style))
    conclusion_box_data = [
        [
            Paragraph(
                "<b>Executive Conclusion:</b> The TradeSight Export Analytics Dashboard V1 transforms raw export transactional data into an auditable, interactive decision-support engine. "
                "By providing real-time visibility across ₹396.88 Cr in export turnover, establishing rigorous data quality quarantines, and transparently isolating unsupported business metrics, "
                "the platform enables leadership to make evidence-based operational decisions.<br/><br/>"
                "<b>Immediate Next Steps:</b><br/>"
                "1. <i>Operational Review:</i> Convene carrier logistics review targeting the 135 delayed shipments identified in Section 3.<br/>"
                "2. <i>ERP Engineering:</i> Deploy validation constraints in warehouse intake to eradicate return overruns and date inversions.<br/>"
                "3. <i>Architecture Sprint:</i> Initiate data warehouse schema migration to introduce line-item SKU linkages and foreign currency capture.<br/><br/>"
                "<b>Deliverable Links & Verification:</b><br/>"
                "• <b>Live Production Dashboard:</b> <font color='#0D5257'><u>https://tradesight-export-analytics.vercel.app</u></font><br/>"
                "• <b>GitHub Project Repository:</b> <font color='#0D5257'><u>https://github.com/krupabt/TradeSight-Export-Analytics</u></font><br/>"
                "• <b>Prepared by:</b> Krupa B T | <b>Milestone:</b> Cynaris Data Analyst Internship — Final Dashboard + Strategic Brief",
                table_cell
            )
        ]
    ]
    t_concl = Table(conclusion_box_data, colWidths=[540])
    t_concl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F0FDF4")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#86EFAC")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_concl)

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    file_size = OUTPUT_PDF.stat().st_size
    print(f"Strategic Brief generated: {OUTPUT_PDF} ({file_size / (1024*1024):.2f} MB)")
    return file_size


if __name__ == "__main__":
    create_strategic_brief_pdf()
