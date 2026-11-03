# TradeSight Export Analytics — Dashboard V1 Revision List

**Project:** TradeSight Export Analytics  
**Milestone:** Cynaris Data Analyst Internship — Week 9 Capstone  
**Target:** Continuous Improvement Backlog for Dashboard Governance & Iteration  
**Live Production URL:** [https://tradesight-export-analytics.vercel.app](https://tradesight-export-analytics.vercel.app)  
**Last Updated:** 2026-11-03  

---

> [!NOTE]
> This revision list tracks identified issues, reviewer feedback, and planned enhancements.
> In strict compliance with guidelines, items originating from the pending peer review session remain marked **`Pending Peer Input`** until actual reviewer feedback is provided by the user. Items originating from internal audits and AI review requirements are actively tracked with verified statuses.

---

## 1. Actionable Revision Log

| ID | Feedback Received / Source | Issue Identified | Proposed Improvement | Priority | Status |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **REV-001** | *Peer Review: Layout & Visuals*<br>(Awaiting Peer Session) | Visual spacing and card alignment under high-resolution displays. | Refine CSS grid breakpoints and card padding in Dashboard frontend. | Medium | **Pending Peer Input** |
| **REV-002** | *Peer Review: KPI Clarity*<br>(Awaiting Peer Session) | Clarity of metric names, currency units, and mathematical definitions. | Add interactive mathematical formula tooltips and sub-labels to all executive KPI cards. | Medium | **Pending Peer Input** |
| **REV-003** | *Peer Review: Chart Readability*<br>(Awaiting Peer Session) | Readability of axis labels, legends, and dual-axis chart interpretations. | Optimize chart axis padding, legend font sizes, and tooltip formatting. | Low | **Pending Peer Input** |
| **REV-004** | *Peer Review: Filter Interactivity*<br>(Awaiting Peer Session) | Filter reactivity across cross-cutting product and payment term views. | Implement multi-select filter combinations and quick-preset buttons ("Delayed Orders Only", "High Value"). | Low | **Pending Peer Input** |
| **REV-005** | *AI Reviewer Audit Requirement*<br>Audit of live dashboard KPIs vs raw datasets. | Reviewer required rigorous proof of calculations for all displayed KPIs. | Generate formal `reports/kpi_verification_report.md` proving 100% calculation match across all 3 source files. | **Critical** | **Implemented** |
| **REV-006** | *Data Governance Audit*<br>Missing foreign currency rates in source ERP data. | Foreign Exchange (FX) impact cannot be modeled because transactions are purely in INR. | Architect schema proposal for upstream ERP database to capture transaction currency (`USD`, `EUR`) and spot rates. | High | **Documented** |
| **REV-007** | *Data Governance Audit*<br>Absence of SKU-level order lines in B2B orders dataset. | Client profitability and COGS margins cannot be calculated on B2B orders without SKU links. | Implement transactional order-line schema bridging `order_id` to `product_id` with unit landed cost fields. | High | **Documented** |
| **REV-008** | *Data Quality Audit*<br>2 orders (`B2B-00131` & `B2B-00188`) contain return quantities exceeding shipped units. | Upstream data entry allows negative net physical quantities (`return_qty > quantity_units`). | Isolate records in dedicated audit exception table; propose upstream validation rule in ERP. | **Critical** | **Implemented** |
| **REV-009** | *Logistics Performance Audit*<br>On-time delivery SLA is 77.50% (465/600), missing 80.0% enterprise target by 2.50%. | Delivery delays in Electronics and Textiles causing transit duration up to 45 days. | Add automated delay alert threshold in dashboard to trigger visual warnings when transit exceeds 25 days. | Medium | **Implemented** |
| **REV-010** | *Deployment & Hosting Audit*<br>Permanent public HTTPS deployment. | Need permanent, verified public URL without temporary tunnels. | Deployed production React + Vite application to Vercel at `https://tradesight-export-analytics.vercel.app`. | **Critical** | **Implemented** |

---

## 2. Priority Definition Framework

* **Critical:** Major data integrity discrepancy, core calculation audit, or deployment blocker requiring immediate resolution.
* **High:** Significant functional gap or schema limitation that restricts strategic analytical capabilities (e.g., FX exposure or profit margin tracking).
* **Medium:** Visual layout enhancement, formula tooltip integration, or workflow efficiency improvement.
* **Low:** Cosmetic styling polish, minor color adjustments, or font sizing tweaks.

---

## 3. Workflow for Incorporating Peer Feedback

1. **User provides actual reviewer notes:** Verbatim comments, dimension ratings (1–5), and specific critique items.
2. **Update Checkpoints:** Record feedback in [`peer_feedback_log.md`](file:///d:/TradeSight-Export-Analytics/week9_dashboard/peer_feedback_log.md).
3. **Transition Revisions:** Update `REV-001` through `REV-004` from `Pending Peer Input` to `Accepted`, `In Progress`, or `Resolved`.
4. **Publish Dashboard Updates:** Implement accepted recommendations in the React frontend and deploy to Vercel.
