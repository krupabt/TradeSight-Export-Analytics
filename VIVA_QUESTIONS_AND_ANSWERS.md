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
**Answer:** Data anomalies were reconciled into a total register of **179 exceptions**:
1. **Invalid Return Quantities (2 records):** In orders `B2B-00131` / `ORD_000102` and `B2B-00188` / `ORD_000412`, recorded `return_qty` exceeded original `quantity_units`. Instead of silently deleting or fabricating data, the system preserves them intact, tags them with `is_valid_return=False`, displays them on the **Returns & Quality Analytics** page with recommended ERP audit actions, and enables review status management.
2. **Purchase Date Inversions (42 records):** In `da_customer_profiles.csv`, 42 customer profile records had `First_Purchase_Date > Last_Purchase_Date`. These were quarantined from tenure calculations and moved cleanly to the **Data Quality & Governance** module.
3. **Logistics Delivery Delays (135 records):** Orders exceeding carrier transit benchmarks where `on_time_delivery == 0`.
4. **Separation of Concerns:** Only return-related exceptions are displayed on the Returns & Quality Analytics page, while the complete 179-record register and customer profile date audits are housed in Data Governance.

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
**Answer:** The report is structured into 5 specialized executive pages totaling 29 visual containers and 47 DAX measures:
1. **Page 1: Executive Overview:** 8 KPI cards, monthly revenue area chart, SLA delivery donut chart, and category/terms bar charts.
2. **Page 2: Shipment and Compliance:** Transit duration histogram, category SLA comparison, and delayed shipment exception table.
3. **Page 3: Client and Product Analytics:** Top 10 buyer rankings, repeat purchase rates, and catalogue inventory valuation table at cost vs retail.
4. **Page 4: Returns and Data Quality:** Category return rates, physical defect breakdown, and flagged invalid return records.
5. **Page 5: Geography and FX Analytics:** Geographic customer distribution, proposed 12-market specification, and currency scenario notes.
*Validation:* Validated automatically by `src/validate_powerbi.py` against `model.bim` schemas and backing CSV files.

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
**Answer:** Configured in `src/reporting.py`, `src/pipeline.py`, and `.github/workflows/weekly_report.yml`:
1. Triggers automatically every Monday at 08:00 UTC via a POSIX cron schedule (`0 8 * * 1`) and supports manual execution (`workflow_dispatch`).
2. Runs the 54-test Pytest suite to ensure data validation rules pass.
3. Executes `run_pipeline()`, which generates timestamped markdown reports (`reports/weekly_exception_report_*.md`) and CSV logs (`outputs/weekly_exception_report_*.csv`).
4. Invokes `send_smtp_alert()` with multi-part MIME attachments: automatically attaches both the weekly exception CSV file and Markdown summary using base64 encoding.
5. Safely enforces `APP_ENV=production` and validates TLS SMTP credentials before dispatching emails via Gmail SMTP (`smtp.gmail.com:587`, TLS encryption).
6. Dispatches dual-channel Multi-Part MIME emails containing both plain text markdown and responsive corporate HTML, embedding core executive metrics (Revenue, Orders, AOV, On-time SLA %, Return Rate %, Delays, and 4 Strategic Recommendations) plus two attachments: the weekly exception register CSV and analytical Markdown report.
6. Stores the generated reports as workflow artifacts with a 30-day retention period.

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

### Q15: How is the Power BI project validated, packaged, and accessed via the TradeSight web platform?
**Answer:** 
1. **Automated Validation:** The `src/validate_powerbi.py` utility inspects the entry file `TradeSight_Analytics.pbip`, verifies that all tables and columns in `model.bim` match backing star-schema CSVs in `powerbi/data/`, checks that visual query references in `report.json` resolve to valid model fields, and confirms core DAX formulas.
2. **Packaging:** The utility packages the entire developer project into `TradeSight_PowerBI_Project_Bundle.zip` and builds `TradeSight_Analytics.pbix` in `powerbi/` and `frontend/public/powerbi/`.
3. **Web Access:** The web application features a dedicated **Power BI** sidebar module displaying validation badges, 4 direct asset download cards, 4 summary KPIs, an interactive 5-page specification viewer, star-schema architecture mappings, a DAX formula reference table, and a 4-step desktop launch guide for opening `TradeSight_Analytics.pbip` in Microsoft Power BI Desktop.

---

## Question 15: Why does TradeSight distribute a Power BI Project (PBIP) rather than a pre-compiled standalone PBIX file?

**Ideal Answer:**
> "A standalone `.pbix` file is a proprietary binary zip container embedding an active Microsoft Analysis Services VertiPaq columnar database stream (`msmdsrv.exe`). If an automated server script attempts to bundle JSON metadata as a `.pbix` without running the VertiPaq engine, the resulting file is corrupt when opened in Microsoft Power BI Desktop. 
> To adhere to enterprise BI standards and strict technical authenticity, TradeSight provides the native Microsoft Power BI Developer Project (`TradeSight_Analytics.pbip`). The PBIP natively links the Tabular Object Model (`model.bim`), the 5-page canvas visual layout (`report.json`), the star-schema backing CSVs, and the corporate navy theme. Double-clicking `TradeSight_Analytics.pbip` in Windows automatically launches Power BI Desktop, compiles the VertiPaq model, and allows saving as a standalone `.pbix` via **File > Save As** in under five seconds."

---

## Question 16: How is Client Profitability calculated if order-level manufacturing COGS is missing in the B2B dataset?

**Ideal Answer:**
> "The raw transaction dataset (`da_b2b_orders.csv`) records wholesale sales revenue, payment terms, and quantities, but does not track SKU-level manufacturing costs or port tariffs. Rather than fabricating fictional profit numbers, TradeSight implements a dual-mode Buyer Analysis module:
> 1. **Commercial Spend Ranking:** Ranks buyers by actual realized wholesale spend (₹ INR).
> 2. **Estimated Gross Profitability:** Models attributable buyer gross profit using the verified **58.62% catalogue gross margin benchmark** derived from `da_product_catalogue.csv` (average SKU markup: `(Price - Cost) / Price`).
> Furthermore, TradeSight empowers financial analysts with interactive margin sensitivity controls (25% conservative, 40% export baseline, 58.62% catalogue benchmark, and 70% premium), dynamic Top 10 profit bar charts, and CSV export."

---

## Question 17: How does the client-side Data Upload engine work and how does it guarantee data privacy?

**Ideal Answer:**
> "TradeSight features a client-side Dataset Ingestion & Validation module built with Web FileReader APIs. Users can upload custom CSV files for B2B Orders, Product Catalogue, and Customer Profiles. The engine performs schema validation, type casting, duplicate checking, and anomaly audits (such as return overruns or date inversions), dynamically recalculating all dashboard KPIs, charts, and exception registers in browser memory. 
> Crucially, zero data is transmitted over the network or saved to remote databases, fulfilling strict trade privacy compliance and NDA regulations."
