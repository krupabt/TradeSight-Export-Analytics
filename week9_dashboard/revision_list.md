# TradeSight Export Analytics — Dashboard V1 Revision List

**Project:** TradeSight Export Analytics  
**Milestone:** Cynaris Data Analyst Internship — Week 9 Capstone  
**Target:** Continuous Improvement Backlog for Dashboard Governance & Iteration  
**Live Production URL:** [https://tradesight-export-analytics.vercel.app](https://tradesight-export-analytics.vercel.app)  
**Last Updated:** 2026-11-05  

---

> [!NOTE]
> This revision list tracks verified corrections, AI-assisted review recommendations, and enterprise roadmap items.
> Completed improvements and pending improvements are maintained in clearly separated tables.

---

## 1. Completed Improvements & Data Quality Corrections

| ID | Actual peer feedback / Feedback Received | Issue Identified | Proposed Improvement / Improvement Made | File / Component Changed | Status | Priority |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| **REV-001** | *AI Reviewer Audit Requirement*<br>Verification of live KPIs against raw datasets. | Reviewer required rigorous calculation proof across all 3 source files. | Generated `reports/kpi_verification_report.md` proving 100% calculation match across all 600 orders, 50 SKUs, and 200 profiles. | `reports/kpi_verification_report.md`<br>`week9_dashboard/kpi_verification_report.md` | **Completed** | **Critical** |
| **REV-002** | *Data Quality Audit*<br>Return overruns in orders `B2B-00131` & `B2B-00188`. | Physical impossibility where `return_qty > quantity_units` (28 > 22 and 48 > 39). | Preserved records intact for compliance; isolated in dedicated audit exception grid with `SUSPICIOUS_RETURN_OVERRUN` badge. | `frontend/src/App.jsx`<br>`outputs/cleaning_log.csv` | **Completed** | **Critical** |
| **REV-003** | *Data Quality Audit*<br>Customer profile chronological date inversions. | 42 records in `da_customer_profiles.csv` have `First_Purchase_Date > Last_Purchase_Date`. | Isolated chronological anomalies in dedicated audit table without dropping original data records. | `frontend/src/App.jsx`<br>`reports/baseline_report.md` | **Completed** | High |
| **REV-004** | *Logistics Performance Audit*<br>Metric narrative alignment. | Early draft text referenced 18.29 days / 78.67% SLA instead of actual calculated values. | Aligned all reports and tables to verified metrics: 23.49 days mean transit and 77.50% on-time fulfillment (465/600). | `week9_dashboard/dashboard_v1_report.pdf`<br>`week9_dashboard/src/generate_pdf_report.py` | **Completed** | High |
| **REV-005** | *Deployment & Hosting Audit*<br>Permanent public HTTPS hosting requirement. | Required reliable cloud hosting without temporary localhost tunnels. | Engineered React + Vite web application and deployed to Vercel production at `https://tradesight-export-analytics.vercel.app`. | `frontend/`<br>`vercel.json` | **Completed** | **Critical** |
| **REV-006** | *AI Review Recommendation*<br>Filter exploration efficiency. | Filtering across multiple dimensions required separate dropdown clicks. | Implemented one-click filter quick presets ("Delayed (135)", "Repeat (227)", "High Value > ₹1 Cr (148)", "Returns (591)"). | `frontend/src/App.jsx`<br>`frontend/src/index.css` | **Completed** | Medium |
| **REV-007** | *Reviewer Requirement*<br>Live dashboard evidence. | Need actual evidence of live application visual layout and KPI cards. | Implemented automated headless capture in `generate_screenshots.py` taking real 1920x1080 screenshots of live Vercel application. | `week9_dashboard/src/generate_screenshots.py`<br>`week9_dashboard/screenshots/` | **Completed** | High |

---

## 2. Pending Improvements (Awaiting Human Peer Review Feedback)

| ID | Actual peer feedback / Feedback Received | Issue Identified | Proposed Improvement / Improvement Made | File / Component Changed | Status | Priority |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| **REV-008** | *Pending Human Peer Input*<br>(Awaiting actual peer reviewer response) | Visual spacing between KPI cards and chart containers on ultra-wide monitors. | Improve dashboard spacing by tuning CSS grid breakpoints, max-widths, and container padding. | `frontend/src/index.css` | **Pending** | Medium |
| **REV-009** | *Pending Human Peer Input*<br>(Awaiting actual peer reviewer response) | Business users benefit from immediate contextual definitions without consulting documentation. | Add KPI definitions and tooltips ($ℹ$) adjacent to executive metric cards showing formulas and source columns. | `frontend/src/App.jsx` | **Pending** | Medium |
| **REV-010** | *Pending Human Peer Input*<br>(Awaiting actual peer reviewer response) | X-axis commodity category labels and dual-axis chart legends can be enhanced for dense viewports. | Improve chart labels and legends by expanding bottom axis margins, increasing font contrast, and formatting tooltips. | `frontend/src/App.jsx` | **Pending** | Low |

---

## 3. Architecture & Governance Roadmap (Documented Dataset Limitations)

| ID | Actual peer feedback / Feedback Received | Issue Identified | Proposed Improvement / Improvement Made | File / Component Changed | Status | Priority |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| **REV-011** | *Data Governance Audit*<br>Unsupported Foreign Exchange (FX) impact. | Transactions are recorded exclusively in INR; foreign currencies and spot rates are absent. | Architect upstream ERP schema proposal capturing `currency_code`, `booking_spot_rate`, and destination country ISO. | `week9_dashboard/dashboard_v1_report.pdf` | **Documented** | High |
| **REV-012** | *Data Governance Audit*<br>Unsupported B2B order gross and net margins. | B2B orders contain selling price but lack landed production costs; catalogue lacks order foreign keys. | Implement relational `order_line_items` schema bridging `order_id` to `Product_ID` with landed costs. | `week9_dashboard/dashboard_v1_report.pdf` | **Documented** | High |
| **REV-013** | *Data Governance Audit*<br>Unsupported customs compliance tracking. | Zero customs documentation, Shipping Bill numbers, or inspection records exist in raw files. | Deploy customs documentation tracking module capturing Port of Loading clearance milestones. | `week9_dashboard/dashboard_v1_report.pdf` | **Documented** | Medium |

---

## 4. Priority Definition Framework

* **Critical:** Major calculation discrepancy, data integrity exception, or deployment blocker requiring immediate remediation.
* **High:** Functional gap or schema boundary limitation that restricts strategic analytical capabilities (e.g., FX exposure or profit margin tracking).
* **Medium:** Visual layout enhancement, formula tooltip integration, or workflow efficiency improvement.
* **Low:** Cosmetic styling polish, minor color adjustments, or font sizing tweaks.
