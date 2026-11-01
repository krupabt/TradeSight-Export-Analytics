# TradeSight Export Analytics — Dashboard V1 Revision List

**Project:** TradeSight Export Analytics  
**Milestone:** Cynaris Data Analyst Internship — Week 9 Capstone  
**Target:** Dashboard V1 Continuous Improvement Backlog  
**Last Updated:** 2026-11-01  

---

> [!NOTE]
> This revision list tracks identified issues, reviewer recommendations, and planned enhancements for Dashboard V2.
> In adherence to strict academic and project guidelines, all unconfirmed peer review feedback items remain marked with status **`Pending`** until the live peer review session is conducted.

---

## 1. Actionable Revision Log

| ID | Feedback Received / Observation | Issue Identified | Proposed Improvement | Priority | Status |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **REV-001** | *Peer Review Session Checkpoint 1*<br>(Awaiting Peer Input) | *Pending live peer session input on visual layout and spacing.* | Ingest peer recommendation for visual layout refinement into Dashboard V2 layout. | Medium | **Pending** |
| **REV-002** | *Peer Review Session Checkpoint 2*<br>(Awaiting Peer Input) | *Pending live peer session input on metric clarity and formulas.* | Add dedicated DAX formula / mathematical tooltips adjacent to each KPI card. | Medium | **Pending** |
| **REV-003** | *Peer Review Session Checkpoint 3*<br>(Awaiting Peer Input) | *Pending live peer session input on chart readability & legends.* | Incorporate peer suggestions for axis scaling or chart legend positioning. | Low | **Pending** |
| **REV-004** | *Peer Review Session Checkpoint 4*<br>(Awaiting Peer Input) | *Pending live peer session input on filter UX and edge cases.* | Add quick-filter presets (e.g. "Last 90 Days", "High Value Only", "Delayed Shipments Only"). | Low | **Pending** |
| **REV-005** | *Internal QA / Data Governance Audit*<br>Missing foreign currency rates in source ERP data. | Foreign Exchange (FX) impact cannot be modeled because transactions are purely recorded in INR. | Architect schema proposal for upstream ERP database to capture transaction currency (`USD`, `EUR`, `AED`, `GBP`) and daily spot exchange rates. | High | **Pending** |
| **REV-006** | *Internal QA / Data Governance Audit*<br>Absence of SKU-level order lines in B2B orders dataset. | Client profitability and COGS margins cannot be calculated on B2B orders because `da_product_catalogue.csv` lacks a relational foreign key link to orders. | Implement transactional order-line schema bridging `order_id` to `product_id` with unit landed cost fields for true margin analysis. | High | **Pending** |
| **REV-007** | *Internal QA / Pipeline Audit*<br>2 orders (`B2B-00131` & `B2B-00188`) contain return quantities exceeding shipped units. | Upstream data entry allows negative net physical quantities (`return_qty > quantity_units`). | Implement automated input validation constraints in upstream ERP to reject return entries exceeding original shipped units. | Critical | **Pending** |
| **REV-008** | *Internal QA / Logistics Performance*<br>On-time delivery SLA is 78.67%, missing 80.0% enterprise target by 1.33%. | Logistics bottleneck in Electronics and Textiles categories causing delivery delays up to 34 days. | Add automated delay alert threshold in dashboard to trigger escalation when transit duration exceeds 22 days. | Medium | **Pending** |

---

## 2. Priority Definition Framework

* **Critical:** Major data integrity discrepancy or pipeline blocker requiring immediate remediation before enterprise decision-making (e.g., return overrun anomalies).
* **High:** Significant functional gap or schema limitation that restricts strategic capabilities (e.g., FX exposure or profit margin tracking).
* **Medium:** Visual layout enhancement, additional filter presets, or KPI explanatory tooltips improving user workflow efficiency.
* **Low:** Cosmetic polish, color tuning, or minor styling adjustments.

---

## 3. Workflow for Confirming Revisions
1. Conduct formal peer evaluation using [`peer_review_template.md`](file:///d:/TradeSight-Export-Analytics/week9_dashboard/peer_review_template.md).
2. Transcribe verbatim peer observations into `REV-001` through `REV-004`.
3. Review findings with project mentor / internship lead.
4. Transition confirmed items to status `Approved` / `In Progress` for Dashboard V2 sprint.
