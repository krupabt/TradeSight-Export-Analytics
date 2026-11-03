# TradeSight Export Analytics — Dashboard V1 Revision List

**Project:** TradeSight Export Analytics  
**Milestone:** Cynaris Data Analyst Internship — Week 9 Capstone  
**Target:** Continuous Improvement Backlog for Dashboard Governance & Iteration  
**Live Production URL:** [https://tradesight-export-analytics.vercel.app](https://tradesight-export-analytics.vercel.app)  
**Last Updated:** 2026-11-03  

---

> [!NOTE]
> This revision list tracks verified corrections, AI-assisted review recommendations, and enterprise roadmap items.
> Implemented items, pending review recommendations, and architectural roadmap items are maintained in distinct sections.

---

## 1. Implemented Verifications & Data Quality Corrections

| ID | Feedback Received / Source | Issue Identified | Proposed Improvement | Priority | Status |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **REV-001** | *AI Reviewer Audit Requirement*<br>Verification of live KPIs against raw datasets. | Reviewer required rigorous calculation proof across all 3 source files. | Generated `reports/kpi_verification_report.md` proving 100% calculation match across all 600 orders, 50 SKUs, and 200 profiles. | **Critical** | **Implemented** |
| **REV-002** | *Data Quality Audit*<br>Return overruns in orders `B2B-00131` & `B2B-00188`. | Physical impossibility where `return_qty > quantity_units` (28 > 22 and 48 > 39). | Preserved records intact for compliance; isolated in dedicated audit exception grid with `SUSPICIOUS_RETURN_OVERRUN` badge. | **Critical** | **Implemented** |
| **REV-003** | *Data Quality Audit*<br>Customer profile chronological date inversions. | 42 records in `da_customer_profiles.csv` have `First_Purchase_Date > Last_Purchase_Date`. | Isolated chronological anomalies in dedicated audit table without dropping original data records. | High | **Implemented** |
| **REV-004** | *Logistics Performance Audit*<br>Metric narrative alignment. | Early draft text referenced 18.29 days / 78.67% SLA instead of actual calculated values. | Aligned all reports and tables to verified metrics: 23.49 days mean transit and 77.50% on-time fulfillment (465/600). | High | **Implemented** |
| **REV-005** | *Deployment & Hosting Audit*<br>Permanent public HTTPS hosting requirement. | Required reliable cloud hosting without temporary localhost tunnels. | Engineered React + Vite web application and deployed to Vercel production at `https://tradesight-export-analytics.vercel.app`. | **Critical** | **Implemented** |

---

## 2. Review Recommendations & Planned Enhancements (Pending Execution)

| ID | Feedback Received / Source | Issue Identified | Proposed Improvement | Priority | Status |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **REV-006** | *AI Review Recommendation*<br>Visual layout & spacing on high-res displays. | Spacing between KPI cards and chart containers can be optimized for ultra-wide monitors. | Improve dashboard spacing by tuning CSS grid breakpoints, max-widths, and container padding. | Medium | **Pending** |
| **REV-007** | *AI Review Recommendation*<br>Metric definition accessibility. | Business users benefit from immediate contextual definitions without consulting documentation. | Add KPI definitions and tooltips ($ℹ$) adjacent to executive metric cards showing formulas and source columns. | Medium | **Pending** |
| **REV-008** | *AI Review Recommendation*<br>Chart readability & visual encodings. | X-axis commodity category labels and dual-axis chart legends can be enhanced for dense viewports. | Improve chart labels and legends by expanding bottom axis margins, increasing font contrast, and formatting tooltips. | Low | **Pending** |
| **REV-009** | *AI Review Recommendation*<br>Filter exploration efficiency. | Filtering across multiple dimensions currently requires separate dropdown interactions. | Add filter quick presets (e.g., "Delayed Shipments Only", "High Value > ₹1 Cr", "Repeat Buyers Only") for rapid analysis. | Low | **Pending** |

---

## 3. Data Governance & Architecture Roadmap (Documented Limitations)

| ID | Feedback Received / Source | Issue Identified | Proposed Improvement | Priority | Status |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **REV-010** | *Data Governance Audit*<br>Unsupported Foreign Exchange (FX) impact. | Transactions are recorded exclusively in INR; foreign currencies and spot rates are absent. | Architect upstream ERP schema proposal capturing `currency_code`, `booking_spot_rate`, and destination country ISO. | High | **Documented** |
| **REV-011** | *Data Governance Audit*<br>Unsupported B2B order gross and net margins. | B2B orders contain selling price but lack landed production costs; catalogue lacks order foreign keys. | Implement relational `order_line_items` schema bridging `order_id` to `Product_ID` with landed costs. | High | **Documented** |
| **REV-012** | *Data Governance Audit*<br>Unsupported customs compliance tracking. | Zero customs documentation, Shipping Bill numbers, or inspection records exist in raw files. | Deploy customs documentation tracking module capturing Port of Loading clearance milestones. | Medium | **Documented** |

---

## 4. Priority Definition Framework

* **Critical:** Major calculation discrepancy, data integrity exception, or deployment blocker requiring immediate remediation.
* **High:** Functional gap or schema boundary limitation that restricts strategic analytical capabilities (e.g., FX exposure or profit margin tracking).
* **Medium:** Visual layout enhancement, formula tooltip integration, or workflow efficiency improvement.
* **Low:** Cosmetic styling polish, minor color adjustments, or font sizing tweaks.
