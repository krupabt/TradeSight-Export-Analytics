# TradeSight Export Analytics — Dashboard V1 Revision List

**Project:** TradeSight Export Analytics  
**Milestone:** Cynaris Data Analyst Internship — Final Capstone Submission  
**Target:** Continuous Improvement Backlog for Dashboard Governance & Iteration  
**Live Production URL:** [https://tradesight-export-analytics.vercel.app](https://tradesight-export-analytics.vercel.app)  
**Sole Peer Reviewer:** **Priya** (Confirmed Overall Rating: **4.0/5**; Criteria: **All 4/5**)  
**Last Updated:** 2026-11-06  

---

> [!NOTE]
> This revision list documents completed dashboard refinements, data quality audits, and future enterprise architecture roadmap items.
> **Peer Review Attribution Notice:** Priya participated as the sole peer reviewer (1 peer reviewer total) and confirmed ratings of **4/5 across all six evaluation criteria** (Visual layout: 4/5, KPI clarity: 4/5, Chart readability: 4/5, Filter usability: 4/5, Navigation: 4/5, Overall UX: 4/5; Average: **4.0/5**). She did not provide written qualitative comments.
> The six dashboard improvements in Section A were **independently identified and implemented by the developer** to achieve enterprise quality and enhance stakeholder usability. They are not attributed to peer comments.

---

## Section A: Implemented Dashboard Improvements (Developer-Identified)

| Revision ID | Improvement Dimension | Peer Review Reference / Feedback Received | Issue Identified / Opportunity | Proposed Improvement / Implementation Description | File / Component Changed | Priority | Status |
| :---: | :--- | :---: | :--- | :--- | :--- | :---: | :---: |
| **REV-001** | Visual Layout & Spacing | *Rated 4/5 by Priya (Visual layout); developer-identified improvement.* | Container padding and KPI grid gaps were tight on high-resolution widescreen monitors, reducing scanability. | Increased `.content-body` padding to 32px/36px, expanded `.kpi-grid` gap to 20px, added subtle card elevation and glowing teal focus borders. | `frontend/src/index.css` | High | **Completed** |
| **REV-002** | Chart Readability & Context | *Rated 4/5 by Priya (Chart readability); developer-identified improvement.* | Dense longitudinal Recharts lacked descriptive subtitles and axis labels had insufficient contrast for presentation. | Added contextual analytical subtitles to all charts, calibrated XAxis/YAxis font styling, and formatted custom tooltips with ₹ Lakh/Cr currency units. | `frontend/src/App.jsx`<br>`frontend/src/index.css` | High | **Completed** |
| **REV-003** | Horizontal Section Navigation | *Rated 4/5 by Priya (Navigation); developer-identified improvement.* | Switching across 7 distinct analytical sections relied exclusively on the sidebar, causing vertical navigation friction. | Implemented a persistent sticky horizontal Section Quick-Nav Bar with 7 numbered tab pills and synchronized URL query routing (`?section=...`). | `frontend/src/App.jsx`<br>`frontend/src/index.css` | High | **Completed** |
| **REV-004** | KPI Formula Tooltips | *Rated 4/5 by Priya (KPI clarity); developer-identified improvement.* | Executive stakeholders had to consult external documentation to verify the exact mathematical formula of displayed metrics. | Embedded interactive formula info tooltips ($ℹ$) adjacent to executive metric card titles detailing exact mathematical definitions and source CSV columns. | `frontend/src/App.jsx` | Medium | **Completed** |
| **REV-005** | Quick Filter Presets & Counts | *Rated 4/5 by Priya (Filter usability); developer-identified improvement.* | Filtering by operational condition (e.g., delayed shipments or repeat buyers) required multiple manual filter clicks. | Built illuminated quick-preset filter buttons ("Delayed 135", "Repeat 227", "High Value > ₹1 Cr", "Returns 591") with live record counter. | `frontend/src/App.jsx`<br>`frontend/src/index.css` | Medium | **Completed** |
| **REV-006** | Anomaly Callouts & Styling | *Rated 4/5 by Priya (Overall UX); developer-identified improvement.* | Physical return overruns and cross-dataset boundaries required clearer visual isolation to prevent misleading interpretations. | Deployed high-visibility warning alert banners for the 2 return overrun orders, distinct schema boundary alerts, and polished dark navy styling. | `frontend/src/App.jsx`<br>`frontend/src/index.css` | High | **Completed** |

---

## Section B: Completed Data Quality and Technical Improvements

| Revision ID | Improvement Dimension | Peer Review Reference / Feedback Received | Issue Identified / Opportunity | Proposed Improvement / Implementation Description | File / Component Changed | Priority | Status |
| :---: | :--- | :---: | :--- | :--- | :--- | :---: | :---: |
| **REV-007** | Data Verification | Audit Requirement | Need for independent calculation proof across all three original CSV datasets (`da_b2b_orders.csv`, etc.). | Conducted comprehensive audit proving 100% mathematical match (₹396.88 Cr revenue, 600 orders, 77.50% SLA, 1.01% returns). | `reports/kpi_verification_report.md`<br>`week9_dashboard/kpi_verification_report.md` | Critical | **Completed** |
| **REV-008** | Return Anomaly Handling | Quality Audit | Physical impossibility in orders `B2B-00131` & `B2B-00188` where `return_qty > quantity_units` (28 > 22 and 48 > 39). | Preserved original data integrity; quarantined in dedicated audit exception grid with `SUSPICIOUS_RETURN_OVERRUN` badge. | `frontend/src/App.jsx`<br>`outputs/cleaning_log.csv` | Critical | **Completed** |
| **REV-009** | Production Cloud Hosting | Hosting Requirement | Permanent public HTTPS hosting required without temporary localhost tunnels. | Engineered React + Vite web application and deployed to Vercel production permanently at `https://tradesight-export-analytics.vercel.app`. | `frontend/`<br>`vercel.json` | Critical | **Completed** |
| **REV-010** | Screenshot Evidence Capture | Submission Requirement | Visual verification evidence of all live dashboard sections required. | Automated headless Chrome capture generating 1920x1080 full-resolution screenshots of all 7 live production sections. | `week9_dashboard/src/generate_screenshots.py`<br>`week9_dashboard/screenshots/` | High | **Completed** |

---

## Section C: Pending Architecture Roadmap (Documented Dataset Limitations)

| Revision ID | Improvement Dimension | Peer Review Reference / Feedback Received | Issue Identified / Opportunity | Proposed Improvement / Implementation Description | File / Component Changed | Priority | Status |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| **REV-011** | Foreign Exchange & Currency Governance | Architecture Roadmap | Unsupported Foreign Exchange (FX) impact because transactions are recorded solely in INR without foreign currency codes. | Architect upstream ERP schema proposal capturing `currency_code`, `booking_spot_rate`, and destination country ISO. | `week9_dashboard/dashboard_v1_report.pdf` | High | **Pending** |
| **REV-012** | Order-Level Profitability & Mapping | Architecture Roadmap | Unsupported B2B order gross and net margins because orders lack landed production costs and product foreign keys. | Implement relational `order_line_items` schema bridging `order_id` to `Product_ID` with landed unit costs. | `week9_dashboard/dashboard_v1_report.pdf` | High | **Pending** |
| **REV-013** | Customs Compliance Tracking | Architecture Roadmap | Unsupported customs compliance tracking because raw datasets contain zero customs or shipping bill records. | Deploy customs documentation tracking module capturing Port of Loading clearance milestones and ICEGATE references. | `week9_dashboard/dashboard_v1_report.pdf` | Medium | **Pending** |

---

## Priority Definition Framework

* **Critical:** Major calculation discrepancy, data integrity exception, or deployment blocker requiring immediate remediation.
* **High:** Functional gap, navigation usability bottleneck, or schema boundary limitation that restricts executive or analytical workflow.
* **Medium:** Visual layout enhancement, formula tooltip integration, or preset filtering efficiency improvement.
* **Low:** Cosmetic styling polish, minor color adjustments, or font sizing tweaks.
