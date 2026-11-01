# TradeSight Export Analytics — Week 9: Dashboard V1 & Peer Review

**Milestone:** Cynaris Data Analyst Internship — Capstone Week 9  
**Lead Analyst:** Krupa B T  
**Technology Stack:** Python, Streamlit, Plotly, Pandas, Power BI Desktop, PostgreSQL, Git, GitHub  
**Repository:** [https://github.com/krupabt/TradeSight-Export-Analytics](https://github.com/krupabt/TradeSight-Export-Analytics)  

---

## 1. Milestone Overview

Cynaris Week 9 delivers **Dashboard V1**: an enterprise-grade executive analytics portal designed for TradeSight Export Management (Chennai, IN). The dashboard integrates transactional B2B export orders (2023–2024), operational fulfillment metrics, cargo return diagnostics, and our **Week 6 Unsupervised Commercial Buyer Segmentation** ($k=4$ RFM-V clusters).

Alongside the working dashboard, Week 9 establishes a rigorous **Peer Review Protocol** and an actionable **Revision List** to govern iterative improvements toward Dashboard V2 without fabricating synthetic peer responses.

---

## 2. Deliverables Directory Structure

```text
D:\TradeSight-Export-Analytics\week9_dashboard\
├── app.py                           # Working interactive Streamlit Dashboard application
├── dashboard_v1_report.pdf          # Multi-page executive PDF report (< 10 MB, 1.47 MB actual)
├── peer_review_template.md          # 6-dimension evaluation rubric for 1 real peer reviewer
├── peer_feedback_log.md             # Formal tracking log (marked 'Pending Real Peer Review Session')
├── revision_list.md                 # Actionable continuous improvement backlog (REV-001 to REV-008)
├── README.md                        # Complete implementation, execution, and publishing guide
├── powerbi\
│   ├── dashboard_specification_v1.md # Power BI 5-page layout, visual properties & formatting guide
│   ├── dax_measures_v1.md           # 20+ verified DAX measures (commercial, SLA, returns, segments)
│   └── powerbi_model_v1.md          # Star-schema data architecture & Power BI Service publishing guide
├── screenshots\
│   ├── 01_executive_overview.png    # High-resolution capture: Executive commercial KPIs & trends
│   ├── 02_logistics_fulfillment.png # High-resolution capture: Transit distributions & SLA compliance
│   ├── 03_returns_quality_audit.png # High-resolution capture: Cargo returns & overrun anomaly grid
│   ├── 04_buyer_segmentation.png    # High-resolution capture: 2D PCA cluster map & buyer profiles
│   └── 05_data_governance_missing_kpis.png # High-resolution capture: Missing KPI audit & verified scorecard
└── src\
    ├── generate_screenshots.py      # Automated high-resolution screenshot generation script
    └── generate_pdf_report.py       # ReportLab PDF report generation engine
```

---

## 3. How to Launch & Explore the Working Dashboard

### Option A: Interactive Streamlit Application (Local Web UI)

The primary interactive application is built with Streamlit and Plotly, providing real-time filtering, cross-tab interactivity, and data export.

1. Ensure project dependencies are installed:
   ```powershell
   pip install -r requirements.txt
   ```
2. Launch the Streamlit dashboard:
   ```powershell
   streamlit run week9_dashboard/app.py
   ```
3. Open your web browser and navigate to:
   ```text
   http://localhost:8501
   ```
4. **Explore the 5 Core Pages via Navigation Tabs:**
   - **Tab 1: 📊 Executive Overview:** Top-level cards (₹397.27 Cr revenue, 600 orders, ₹66.21 L AOV, 78.67% SLA, 5.00% returns), 24-month revenue/order trends, category revenue breakdown, payment terms and repeat buyer shares.
   - **Tab 2: 🚚 Logistics & Fulfillment:** Delivery days distribution, on-time SLA comparison against the 80.0% target line, transit duration histograms, and credit risk matrix.
   - **Tab 3: 📦 Returns & Exception Audit:** Category return rate comparison, unit volume breakdown, and the critical exception grid highlighting the **2 Return Overrun Anomalies** (`B2B-00131` and `B2B-00188`).
   - **Tab 4: 👥 Week 6 Buyer Segmentation:** Behavioral summary of the 4 clusters (*Core Stable Accounts*, *Active Growth Buyers*, *Operationally Vulnerable*, *Lapsed Accounts*), interactive 2D PCA projection scatter plot, and searchable commercial buyer table.
   - **Tab 5: 📋 Data Governance & Missing KPIs:** Transparent documentation explaining why Foreign Exchange, Client Profitability, and Compliance logs cannot be calculated, alongside the complete 12-metric verified scorecard and filtered CSV download button.

---

### Option B: Power BI Desktop Implementation & Cloud Publishing

For stakeholders requiring native Microsoft Power BI deployment:

1. **Open Power BI Desktop** and click **Get Data -> Text/CSV**.
2. Load:
   - `data_processed/da_b2b_orders_cleaned.csv`
   - `week6_deep_dive/outputs/buyer_rfm_segments.csv`
3. Generate the Date Dimension (`DimDate`) and configure star-schema relationships as detailed in [`week9_dashboard/powerbi/powerbi_model_v1.md`](file:///d:/TradeSight-Export-Analytics/week9_dashboard/powerbi/powerbi_model_v1.md).
4. Create the `_Measures` table and copy DAX formulas from [`week9_dashboard/powerbi/dax_measures_v1.md`](file:///d:/TradeSight-Export-Analytics/week9_dashboard/powerbi/dax_measures_v1.md).
5. Build the visual layout following [`week9_dashboard/powerbi/dashboard_specification_v1.md`](file:///d:/TradeSight-Export-Analytics/week9_dashboard/powerbi/dashboard_specification_v1.md).
6. **Publish to Cloud:**
   - Click **File -> Save As -> TradeSight_Export_Analytics_V1.pbix**.
   - Click **Publish** on the Home ribbon.
   - Select your organizational Power BI workspace.
   - Access the resulting cloud dashboard URL (e.g., `https://app.powerbi.com/groups/me/reports/...`).

---

## 4. Rigorous Audit of Unavailable Business Metrics

In strict compliance with academic and professional integrity guidelines, **no data or KPI values have been invented**. Missing business requirements are explicitly documented:

| Missing Business Metric | Root Cause / Data Audit Finding | Recommended Engineering Fix |
| :--- | :--- | :--- |
| **Foreign Exchange (FX) Impact** | All orders in `da_b2b_orders.csv` are denominated exclusively in `INR`. No currency code, spot exchange rate, or export destination country fields exist. | Extend ERP transactional schema to capture `currency_code`, `booking_spot_rate`, and `destination_country_iso`. |
| **Client Profitability & COGS** | Orders contain `unit_price_inr` and `total_value_inr`, but lack unit cost of goods sold (COGS), freight tariffs, or export duties. Retail catalogue lacks transactional B2B order links. | Introduce transactional `order_line_items` table linking `order_id` to `product_id` with unit landed cost fields. |
| **Export Compliance Exceptions** | Datasets contain zero regulatory documentation fields (Shipping Bill numbers, Harmonized System / HS codes, Port of Loading, GST Export invoicing, or Customs Inspection flags). | Implement a customs documentation sub-module tracking clearance milestones and regulatory audit flags. |

---

## 5. Peer Review Framework & Continuous Improvement

1. **Peer Review Template:** [`peer_review_template.md`](file:///d:/TradeSight-Export-Analytics/week9_dashboard/peer_review_template.md) provides a structured evaluation form for **1 real peer reviewer** across 6 core dimensions (Layout, Accuracy/Usefulness, Chart readability, Filter functionality, Navigation, and Overall UX).
2. **Peer Feedback Log:** [`peer_feedback_log.md`](file:///d:/TradeSight-Export-Analytics/week9_dashboard/peer_feedback_log.md) records session metadata and checkpoints. To maintain absolute documentation honesty, it is initialized with status **`Pending Real Peer Review Session`** (no fabricated quotes or ratings).
3. **Revision List:** [`revision_list.md`](file:///d:/TradeSight-Export-Analytics/week9_dashboard/revision_list.md) logs actionable enhancement items (`REV-001` through `REV-008`), prioritizing data governance fixes and layout refinements, with unconfirmed items marked as **`Pending`**.

---

## 6. Verification & Automated Testing

Automated test coverage for Dashboard V1 is implemented in `tests/test_week9_dashboard.py`.
Run the test suite:
```powershell
pytest -v tests/test_week9_dashboard.py
```
Or execute the entire capstone test suite (Weeks 3, 6, and 9):
```powershell
pytest -v
```
