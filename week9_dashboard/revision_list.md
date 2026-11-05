# TradeSight Export Analytics — Dashboard V1 Revision List

**Project:** TradeSight Export Analytics  
**Milestone:** Cynaris Data Analyst Internship — Week 9 Capstone  
**Target:** Continuous Improvement Backlog for Dashboard Governance & Iteration  
**Live Production URL:** [https://tradesight-export-analytics.vercel.app](https://tradesight-export-analytics.vercel.app)  
**Peer Reviewer:** **Priya** (Sole Peer Reviewer; Confirmed Latest Overall Rating: **4.0 / 5**)  
**Last Updated:** 2026-11-05  

---

> [!NOTE]
> This revision list tracks verified corrections, actionable engineering improvements confirmed under Priya's latest 4.0 / 5 overall peer review rating, and future architecture roadmap items.
> Implemented improvements and pending roadmap items are clearly delineated in dedicated tables below.
> Per strict non-fabrication rules, Priya is the sole peer reviewer and confirmed an overall average rating of 4.0 / 5 without providing individual criterion breakdowns or written comments; individual criterion scores are not invented.

---

## 1. Implemented Improvements Aligned with Priya's Confirmed 4.0 / 5 Peer Review

| Revision ID | Review Criterion | Actual Peer Rating / Feedback Received | Issue Identified / Opportunity | Proposed Improvement / Action Taken | File / Component Changed | Priority | Status |
| :---: | :--- | :---: | :--- | :--- | :--- | :---: | :---: |
| **REV-001** | Visual Layout | **4.0 / 5 Overall**<br>*(Priya confirmed)* | Container padding and KPI grid gaps were tight on high-resolution widescreen monitors. | Increased `.content-body` padding to 32px/36px, expanded `.kpi-grid` gap to 20px, added subtle card elevation and border accents. | `frontend/src/index.css` | High | **Completed** |
| **REV-002** | Chart Readability | **4.0 / 5 Overall**<br>*(Priya confirmed)* | Longitudinal charts lacked descriptive subtitles and axis labels could benefit from higher contrast. | Added contextual analytical subtitles to all Recharts, calibrated XAxis/YAxis font styling, and formatted tooltips with ₹ Lakh/Cr units. | `frontend/src/App.jsx`<br>`frontend/src/index.css` | High | **Completed** |
| **REV-003** | Navigation | **4.0 / 5 Overall**<br>*(Priya confirmed)* | Navigating between 7 distinct dashboard sections relied solely on the left sidebar without top view orientation. | Implemented a sticky horizontal Section Quick-Nav Bar with 7 numbered tab pills and synchronized URL query routing (`?section=...`). | `frontend/src/App.jsx`<br>`frontend/src/index.css` | High | **Completed** |
| **REV-004** | KPI Clarity | **4.0 / 5 Overall**<br>*(Priya confirmed)* | Executive users need immediate insight into calculation definitions and underlying data columns. | Added interactive formula info tooltips ($ℹ$) adjacent to metric card titles detailing exact formulas and source CSV columns. | `frontend/src/App.jsx` | Medium | **Completed** |
| **REV-005** | Filter Usability | **4.0 / 5 Overall**<br>*(Priya confirmed)* | Operational triage required clicking individual filter dropdowns rather than one-touch anomaly filtering. | Built illuminated quick-preset filter buttons ("Delayed 135", "Repeat 227", "High Value > ₹1 Cr", "Returns 591") with real-time record count badge. | `frontend/src/App.jsx`<br>`frontend/src/index.css` | Medium | **Completed** |
| **REV-006** | Overall UX | **4.0 / 5 Overall**<br>*(Priya confirmed)* | Return overrun anomalies and schema boundaries required clearer enterprise visual hierarchy. | Added high-visibility warning callouts for the 2 return overruns, distinct schema boundary alerts, and polished dark navy styling. | `frontend/src/App.jsx`<br>`frontend/src/index.css` | High | **Completed** |

---

## 2. Completed Data Quality & Technical Audit Improvements

| Revision ID | Review Criterion | Actual Peer Rating / Feedback Received | Issue Identified / Opportunity | Proposed Improvement / Action Taken | File / Component Changed | Priority | Status |
| :---: | :--- | :---: | :--- | :--- | :--- | :---: | :---: |
| **REV-007** | Data Verification | Audit Requirement | Independent verification required against raw CSV datasets (`da_b2b_orders.csv`, etc.). | Conducted comprehensive audit proving 100% mathematical match (₹396.88 Cr revenue, 600 orders, 77.50% SLA, 1.01% returns). | `reports/kpi_verification_report.md`<br>`week9_dashboard/kpi_verification_report.md` | Critical | **Completed** |
| **REV-008** | Return Audit | Quality Audit | Physical impossibility in orders `B2B-00131` & `B2B-00188` where `return_qty > quantity_units`. | Preserved original data integrity; quarantined in dedicated audit exception grid with `SUSPICIOUS_RETURN_OVERRUN` badge. | `frontend/src/App.jsx`<br>`outputs/cleaning_log.csv` | Critical | **Completed** |
| **REV-009** | Cloud Deployment | Hosting Requirement | Public permanent HTTPS deployment required without localhost tunnels. | Engineered React + Vite web application and deployed to Vercel production at `https://tradesight-export-analytics.vercel.app`. | `frontend/`<br>`vercel.json` | Critical | **Completed** |
| **REV-010** | Evidence Capture | Submission Requirement | Visual evidence of all live dashboard sections required. | Automated headless Chrome capture taking 1920x1080 full-resolution screenshots of all 7 live production sections. | `week9_dashboard/src/generate_screenshots.py`<br>`week9_dashboard/screenshots/` | High | **Completed** |

---

## 3. Pending Enterprise Architecture Roadmap (Documented Dataset Limitations)

| Revision ID | Review Criterion | Actual Peer Rating / Feedback Received | Issue Identified / Opportunity | Proposed Improvement / Action Taken | File / Component Changed | Priority | Status |
| :---: | :--- | :---: | :--- | :--- | :--- | :---: | :---: |
| **REV-011** | Currency Governance | Architecture Roadmap | Unsupported Foreign Exchange (FX) impact due to transactions recorded solely in INR without currency codes. | Architect upstream ERP schema proposal capturing `currency_code`, `booking_spot_rate`, and destination country ISO. | `week9_dashboard/dashboard_v1_report.pdf` | High | **Pending** |
| **REV-012** | Relational Margin | Architecture Roadmap | Unsupported B2B order gross and net margins because orders lack landed production costs and product foreign keys. | Implement relational `order_line_items` schema bridging `order_id` to `Product_ID` with landed unit costs. | `week9_dashboard/dashboard_v1_report.pdf` | High | **Pending** |
| **REV-013** | Compliance Governance | Architecture Roadmap | Unsupported customs compliance tracking because raw datasets contain zero customs or shipping bill records. | Deploy customs documentation tracking module capturing Port of Loading clearance milestones and ICEGATE references. | `week9_dashboard/dashboard_v1_report.pdf` | Medium | **Pending** |

---

## 4. Priority Definition Framework

* **Critical:** Major calculation discrepancy, data integrity exception, or deployment blocker requiring immediate remediation.
* **High:** Functional gap, navigation usability bottleneck, or schema boundary limitation that restricts executive or analytical workflow.
* **Medium:** Visual layout enhancement, formula tooltip integration, or preset filtering efficiency improvement.
* **Low:** Cosmetic styling polish, minor color adjustments, or font sizing tweaks.
