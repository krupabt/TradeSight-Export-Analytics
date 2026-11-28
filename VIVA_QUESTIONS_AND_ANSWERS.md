# TradeSight Export Analytics – University Evaluation Viva Voce Q&A Guide

**Candidate:** Krupa B T | **Internship:** Cynaris Solutions Private Limited, Chennai  
**Role:** Data Analyst Intern | **Project:** TradeSight Export Analytics  

---

## Part 1: Project Architecture & Domain Knowledge

### Q1: What is TradeSight Export Analytics, and what business problem does it solve?
**Answer:** TradeSight Export Analytics is an enterprise business intelligence and data governance platform built for an export management consultancy (Cynaris Solutions) to track ₹396.88 Crore in export revenue across 600 B2B shipments. It addresses four core business problems:
1. Providing executive visibility into delivery SLA performance (77.50% on-time vs 22.50% delayed).
2. Detecting physical return anomalies (1.01% return rate; isolating orders where returns exceed shipped volume).
3. Modeling foreign exchange volatility through dynamic currency sensitivity simulations.
4. Automating compliance exception detection via scheduled CI/CD workflows and delivering complementary Microsoft Power BI reporting.

### Q2: What are the primary datasets used in the project, and how do they relate to each other?
**Answer:** The project uses three primary datasets:
1. `da_b2b_orders.csv` (600 rows, 13 columns): Fact table containing B2B export orders, unit pricing, order quantities, delivery days, SLA indicators, and return counts.
2. `da_product_catalogue.csv` (50 rows, 7 columns): Dimension table of products containing list price (MRP), cost of goods sold (COGS), and warehouse stock.
3. `da_customer_profiles.csv` (200 rows, 10 columns): Dimension table of commercial clients containing city, acquisition channel, purchase dates, and churn indicators.
*Relationship Note:* While `da_b2b_orders` aggregates transactions by category and buyer ID, individual order line items are unlinked to specific product SKUs. This architectural limitation is transparently documented in the platform.

### Q3: What were the major data quality anomalies identified in the raw datasets, and how did you handle them?
**Answer:** Two critical anomalies were detected:
1. **Invalid Return Quantities:** In orders `ORD_000102` and `ORD_000412`, the recorded `return_qty` exceeded the original `quantity_units`. Instead of silently deleting or fabricating data, the system flags these in compliance exception reports and quarantines them while calculating uncorrupted baseline metrics.
2. **Purchase Date Inversions:** In `da_customer_profiles.csv`, several records had `First_Purchase_Date > Last_Purchase_Date`. These were logged in the data validation report to highlight needed ERP ingestion rules.

---

## Part 2: Python, Pandas, and Data Engineering

### Q4: How did you ensure data pipeline idempotency and prevent division-by-zero errors in Python?
**Answer:** 
1. **Safe Division:** Implemented a reusable `safe_divide(numerator, denominator, multiplier=1.0)` utility that guards against `ZeroDivisionError`, `np.nan`, and empty datasets, returning `0.0` safely.
2. **Idempotency:** The pipeline (`src/pipeline.py`) was engineered so that repeated executions produce identical output schemas, logs, and metrics without accumulating duplicate records or mutating raw input CSVs. Verified by automated tests in `tests/test_pipeline.py`.

### Q5: How is customer segmentation implemented in the project?
**Answer:** Customer segmentation was implemented using the **RFM-V** model (Recency, Frequency, Monetary value, and Volume):
- **Recency:** Days elapsed since the buyer's last order date.
- **Frequency:** Total number of distinct orders placed.
- **Monetary:** Total gross spend in Indian Rupees.
- **Volume:** Total physical units shipped to the buyer.
Using standardized scaling and K-Means clustering (evaluated using silhouette analysis and elbow method in `src/pipeline.py`), 187 buyers were grouped into 4 distinct clusters: Core Accounts (75), Growth Buyers (68), At-Risk Buyers (27), and Inactive Buyers (17).

---

## Part 3: Relational Design & SQL Implementation

### Q6: What SQL queries were formulated for the analytics dashboard?
**Answer:** The SQL suite in `sql/` covers three areas:
1. **Schema Definition (`sql/schema.sql`):** Normalized DDL creating tables with appropriate primary keys, foreign key constraints, and numeric precision.
2. **Analytical Aggregations (`sql/analysis_queries.sql`):** Monthly and quarterly revenue trends using `strftime` and window functions (`SUM() OVER()`, `ROW_NUMBER()`), payment terms distribution, and high-value order filtering (`total_value_inr >= 10000000`).
3. **Data Quality Audits (`sql/data_quality_checks.sql`):** Queries isolating return exceptions (`return_qty > quantity_units`) and SLA delivery breaches (`delivery_days > 20`).

### Q7: Why is gross order value distinguished from net profit in your SQL and data models?
**Answer:** Because `da_b2b_orders.csv` records gross transaction value (`quantity_units * unit_price_inr`), but does not track order-level shipping freight, customs duties, or direct SKU cost of goods sold. The product catalogue provides retail margins (averaging 58.62%), but applying this across wholesale orders without SKU linkage would fabricate profit figures. Therefore, we report verified gross revenue rankings and clearly label profitability limits.

---

## Part 4: Microsoft Power BI, Power Query, and DAX

### Q8: Describe the Power BI data model and star-schema structure.
**Answer:** The Power BI model in `powerbi/` is structured as a star schema:
- **Central Fact Table:** `Fact_Orders` (600 rows with transactional metrics and foreign keys: `OrderDateKey`, `buyer_id`).
- **Dimension Tables:**
  - `Dim_Date` (Calendar dimension spanning 2023–2024 with DateKey, Year, Quarter, Month, Week).
  - `Dim_Products` (50 SKUs with MRP, COGS, calculated gross margins, and stock value).
  - `Dim_Customers` (200 accounts with city, acquisition channel, and churn status).
  - `Dim_Proposed_Markets` (12 export target countries with ISO codes, discharge ports, and Incoterms).
- **Relationships:** `Fact_Orders[OrderDateKey]` (Many) to `Dim_Date[DateKey]` (One) with single-direction cross-filtering.

### Q9: Explain the difference between a Calculated Column and a Measure in DAX. Give an example from your project.
**Answer:**
- **Calculated Column:** Evaluated at row-level during data refresh and stored in memory. Example in `Fact_Orders`:  
  `SLA_Status = IF(Fact_Orders[on_time_delivery] = 1, "On-Time", "Delayed")`
- **DAX Measure:** Evaluated dynamically at query time based on visual filter context. Example in `Fact_Orders`:  
  `On-Time Delivery % = DIVIDE(CALCULATE(COUNTROWS(Fact_Orders), Fact_Orders[on_time_delivery] = 1), COUNTROWS(Fact_Orders), 0) * 100`

### Q10: How did you implement the 5-page report in Power BI?
**Answer:** The report is structured into 5 specialized executive pages:
1. **Page 1: Executive Overview:** 8 KPI cards, monthly revenue area chart, SLA delivery donut chart, and category/terms bar charts.
2. **Page 2: Shipment and Compliance:** Transit duration histogram, category SLA comparison, and delayed shipment exception table.
3. **Page 3: Client and Product Analytics:** Top 10 buyer rankings, repeat purchase rates, and catalogue inventory valuation table.
4. **Page 4: Returns and Data Quality:** Category return rates, physical defect breakdown, and flagged invalid return records.
5. **Page 5: Geography and FX Analytics:** Geographic customer distribution, proposed 12-market specification, and currency scenario notes.

---

## Part 5: FX Analytics, Compliance & Automated Reporting

### Q11: How does the Currency & FX Analysis module calculate exchange rate impacts?
**Answer:** Implemented in `src/fx_analytics.py` and React with dual modes:
1. **Invoice Calculator Mode:**
   $$\text{Original INR} = \text{Invoice Amount} \times \text{Base Rate}$$
   $$\text{Revised INR} = \text{Invoice Amount} \times \text{Revised Rate}$$
   $$\Delta \text{Gain/Loss} = \text{Revised INR} - \text{Original INR}$$
   $$\text{Percentage Impact} = \left(\frac{\Delta \text{Gain/Loss}}{\text{Original INR}}\right) \times 100$$
   *Verification Example:* A $\$100,000\text{ USD}$ invoice booked at $₹83.50$ ($₹83,50,000$) revalued at $₹87.00$ ($₹87,00,000$) yields an estimated FX gain of $+₹3,50,000$ ($+4.19\%$).
2. **Portfolio Impact Mode:**
   $$\text{Exposed Portfolio Value} = \text{Total Order Value} \times \left(\frac{\text{Exposure Percentage}}{100}\right)$$
   $$\text{Estimated Foreign Exposure} = \frac{\text{Exposed Portfolio Value}}{\text{Base Rate}}$$
   $$\text{Revised Exposure Value} = \text{Foreign Exposure} \times \text{Revised Rate}$$
   $$\Delta \text{Gain/Loss} = \text{Revised Exposure Value} - \text{Exposed Portfolio Value}$$
   $$\text{Revised Total Portfolio Value} = \text{Total Order Value} + \Delta \text{Gain/Loss}$$
3. **Features & Governance:**
   - Clearly discloses that source orders are denominated in INR and historical FX data is unavailable (avoiding fabricated historical figures).
   - Exchange rate presets ($-10\%$ to $+10\%$) calculate non-compounding shifts relative to base rate.
   - Interactive Recharts sensitivity bar chart with color-coded gain/loss/neutral bars and downloadable scenario comparison matrix CSV.
   - Multi-currency schema specification outlining 7 fields required for future multi-currency operations (`booking_currency`, `foreign_invoice_amount`, `booking_date`, `spot_booking_rate`, `settlement_date`, `realized_settlement_rate`, `hedging_status`).
   - Validated by 11 unit tests covering positive appreciation, negative depreciation, zero shock neutrality, negative invoice guards, positive rate assertions, and portfolio exposure bounds.

### Q12: How does the automated weekly reporting pipeline work in GitHub Actions?
**Answer:** Configured in `.github/workflows/weekly_report.yml`:
1. Triggers automatically every Monday at 08:00 UTC via a POSIX cron schedule (`0 8 * * 1`) and supports manual execution (`workflow_dispatch`).
2. Runs the Pytest suite to ensure data validation rules pass.
3. Executes `run_pipeline()`, which generates timestamped markdown reports (`reports/weekly_exception_report_*.md`) and CSV logs (`outputs/weekly_exception_report_*.csv`).
4. Invokes `send_smtp_alert()`, which securely reads SMTP credentials from GitHub Secrets and dispatches email alerts to authorized recipients (safely defaulting to Test Mode if secrets are absent).
5. Stores the generated reports as workflow artifacts with a 30-day retention period.

---

## Part 6: Frontend, UX/UI, and Cloud Deployment

### Q13: What design system and UX principles were applied to the web dashboard?
**Answer:** The dashboard was redesigned to enterprise business intelligence standards:
- **Palette:** Deep Navy (`#172B4D`) sidebar, active blue (`#3674B5`), light gray canvas (`#F5F7FA`), pure white cards (`#FFFFFF`), with semantic status tokens (`#25805A` success, `#E0A35A` warning, `#C94C4C` error).
- **Layout:** 220px sticky navigation bar, 60px header, 8 compact KPI cards in a 4-column grid with drill-down links, and a 60/40 visual row split for Monthly Revenue and Delivery SLA charts.
- **Typography:** Modern Inter font hierarchy (24px page titles, 16px section headings, 28px KPI values, 13px table text).

### Q14: How did you resolve the Vercel stale cache issue?
**Answer:** Vercel Edge CDN was previously serving cached HTML files referencing outdated asset hashes (`Age: 1255`). To guarantee that all viewers receive the latest build, we updated `vercel.json` with explicit HTTP response headers:
- `index.html` and root routes: `Cache-Control: public, max-age=0, must-revalidate`
- Static hashed assets (`/assets/(.*)`): `Cache-Control: public, max-age=31536000, immutable`  
Verification confirmed an HTTP 200 response with `Age: 0` and `X-Vercel-Cache: MISS`.
