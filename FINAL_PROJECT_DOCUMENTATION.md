# TradeSight Export Analytics – Final Project Documentation

**Project Title:** TradeSight Export Analytics: An Enterprise Business Intelligence Platform for Export Operations, FX Sensitivity Modeling, and Compliance Governance  
**Author:** Krupa B T  
**Internship Role:** Data Analyst Intern  
**Organization:** Cynaris Solutions Private Limited, Chennai, India  
**University Internship Evaluation Project**  
**Repository:** [https://github.com/krupabt/TradeSight-Export-Analytics](https://github.com/krupabt/TradeSight-Export-Analytics)  
**Production Deployment:** [https://tradesight-export-analytics.vercel.app](https://tradesight-export-analytics.vercel.app)  

---

## 1. Project Title
**TradeSight Export Analytics: Enterprise Business Intelligence, Logistics SLA Monitoring, FX Sensitivity Simulator, and Automated Compliance Exception Reporting.**

---

## 2. Abstract
TradeSight Export Analytics is an end-to-end data analytics and business intelligence platform designed and implemented for Cynaris Solutions Private Limited during a 3-month Data Analyst internship. The platform addresses critical challenges in international export operations: tracking large-scale B2B revenue realization across multi-crore transactions, detecting logistics SLA breaches, monitoring product return anomalies, segmenting commercial buyer purchasing behaviors (RFM-V), simulating foreign exchange volatility risks, and automating weekly compliance exception reports. 

The application utilizes a production-grade technology stack comprising Python, Pandas, NumPy, SQL, Pytest, React.js, Vite, Recharts, and Microsoft Power BI (Power Query, DAX, Tabular Object Model). Built strictly on ground-truth commercial datasets (600 export orders totaling ₹396.88 Crore, 200 customer accounts, and 50 product SKUs), the system eliminates data fabrication, enforces automated regression validation (43 passing test suites), and provides both an interactive web platform deployed on Vercel and an enterprise 5-page Power BI reporting project.

---

## 3. Organization and Client Profile
* **Host Organization:** Cynaris Solutions Private Limited
* **Client Location:** Chennai, Tamil Nadu, India
* **Industry Domain:** Export Management & Cross-Border B2B Trade
* **Organization Scale:** 45 employees, bootstrapped technology and trade consultancy
* **Commercial Footprint:** 50 enterprise commercial buyers distributed across 12 target global destination markets
* **Project Period:** 3 Months (5 approved milestones)
* **Simulated Development Budget:** Rs. 30,000

---

## 4. Problem Statement
International export operations involve substantial capital commitments, volatile transit timelines, cross-currency exposure, and stringent compliance requirements. The client faced four fundamental business bottlenecks:
1. **Lack of Centralized Operational Visibility:** Order fulfillment, transit days, and return rates were fragmented across disparate transactional logs, preventing executive leadership from quickly assessing on-time delivery rates and gross revenue realization.
2. **Delayed Logistics Exception Detection:** Late shipments (averaging 23.5 days transit) often resulted in commercial disputes without automated early warnings.
3. **Data Quality & Compliance Blind Spots:** Physical returns exceeding shipped quantities and reversed customer purchase dates remained undetected in manual spreadsheets.
4. **Foreign Exchange Vulnerability:** Invoicing cross-border shipments without dynamic FX sensitivity analysis exposed the enterprise to severe margin erosion when exchange rates shifted against the Indian Rupee.

---

## 5. Project Objectives
* **C-Suite BI Dashboard:** Construct an interactive, responsive analytics portal with at least 8 verified executive business KPIs and drill-down capability.
* **Logistics & SLA Analytics:** Quantify on-time delivery percentages, isolate delayed shipments, and measure transit duration distributions.
* **Buyer Segmentation & Commercial Ranking:** Implement Recency, Frequency, Monetary, and Volume (RFM-V) customer segmentation across 187 active buyers while clearly distinguishing gross revenue ranking from unlinked product-level net profitability.
* **FX Sensitivity Simulator:** Build a mathematically verified currency fluctuation tool modeling exchange rate volatility for USD, EUR, GBP, AED, SGD, and JPY.
* **Automated Exception Reporting:** Engineer an automated GitHub Actions CI/CD workflow executing Python pipelines every Monday at 08:00 UTC to generate markdown reports, CSV exception logs, and secure SMTP email alerts.
* **Microsoft Power BI Integration:** Develop a complementary enterprise Power BI reporting model (`powerbi/`) containing star-schema datasets, Power Query M scripts, 30+ DAX measures, corporate JSON theme, and 5 interactive report pages.

---

## 6. System Requirements

### Hardware Requirements
* **Processor:** Intel Core i5 / AMD Ryzen 5 or higher (minimum 2.0 GHz)
* **Memory (RAM):** 8 GB minimum (16 GB recommended for local Power BI modeling and Vite builds)
* **Storage:** 2 GB available SSD storage

### Software & Environment Requirements
* **Operating System:** Windows 10/11, macOS, or Ubuntu Linux 22.04 LTS
* **Python Runtime:** Python 3.10 to 3.12 (64-bit)
* **Node.js Runtime:** Node.js v18.x or v20.x with npm 9+
* **Business Intelligence:** Microsoft Power BI Desktop (Optional for authoring; project files supplied in open `.pbip` and JSON formats)
* **Version Control & Hosting:** Git, GitHub, GitHub Actions, Vercel Edge Network

---

## 7. Final Technology Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TRADESIGHT TECHNOLOGY STACK                     │
├────────────────────────────────────────────────────────────────────────┤
│ Data Pipeline & Processing:  Python 3.12, Pandas, NumPy                │
│ Data Validation & Quality:   Custom Python AST/Rule Engines, Regex     │
│ Relational Database Logic:   ANSI SQL (SQLite / PostgreSQL compatible) │
│ Automated Testing Suite:     Pytest 9.x (43 unit & regression tests)   │
│ Web Application Frontend:    React.js 18, Vite 5, Lucide React Icons   │
│ Interactive Data Charts:     Recharts (Area, Bar, Donut, Column)       │
│ Design Tokens & Styling:     Modern CSS3 (Inter Typography, 220px Nav) │
│ Business Intelligence Suite: Microsoft Power BI, Power Query (M), DAX │
│ CI/CD & Automation:          GitHub Actions (.github/workflows)        │
│ Cloud Hosting & Edge CDN:    Vercel Platform (Fluid Compute, Headers)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 8. System Architecture

The TradeSight architecture follows a decoupled, three-tier modular design:

```
[Raw CSV Datasets] ──> [Python Data Pipeline (src/pipeline.py)]
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [Validation Engine]              [Metrics & FX Engine]
 (src/data_validation.py)        (src/metrics.py, fx_analytics.py)
            │                                 │
            ├─────────────────────────────────┤
            ▼                                 ▼
   [Processed Clean Data]           [Verified JSON / CSV Outputs]
 (outputs/clean_orders.csv)        (frontend/src/data/*.json)
            │                                 │
     ┌──────┴──────┐                   ┌──────┴──────┐
     ▼             ▼                   ▼             ▼
[Web Frontend] [Power BI]      [Weekly Reporter] [Pytest Suite]
 (React+Vite)  (powerbi/)     (.github/actions) (43 tests)
```

---

## 9. Data Flow Diagram

```
Level 0 (Context):
[Commercial Orders CSV] ──┐
[Customer Profiles CSV]  ──┼──> [ TradeSight Platform ] ──> [ C-Suite Dashboard ]
[Product Catalogue CSV] ──┘                                 [ Power BI Reports  ]
                                                            [ Weekly Exceptions ]

Level 1 (Transformation & Loading):
1. Ingestion: Raw CSVs loaded into Pandas DataFrames.
2. Cleaning & Sanitization: Dates parsed, category strings normalized, invalid returns isolated.
3. Feature Engineering: OrderDateKey, SLA_Status, Margin_Pct, and RFM-V scores computed.
4. Output Generation: Clean data converted to JSON for Vite bundle and modeled CSVs for Power BI.
5. Presentation: Rendered on React web portal and Power BI Desktop.
```

---

## 10. Dataset Description

The project is built upon three real-world commercial datasets:

### 1. `da_b2b_orders.csv` (Fact Table)
* **Row Count:** 600 records | **Columns:** 13 | **Null Values:** 0
* **Fields:** `order_id` (PK), `buyer_id`, `seller_id`, `category`, `order_date`, `quantity_units`, `unit_price_inr`, `total_value_inr`, `payment_terms`, `delivery_days`, `on_time_delivery`, `return_qty`, `repeat_buyer`.
* **Observations:** Spans Jan 2023 to Dec 2024. Total gross volume is 1,509,070 units and ₹3,968,829,214.20 (~₹396.88 Cr).

### 2. `da_product_catalogue.csv` (Product Dimension)
* **Row Count:** 50 SKUs | **Columns:** 7 | **Null Values:** 0
* **Fields:** `Product_ID` (PK), `Name`, `Category`, `MRP`, `COGS`, `Stock_Units`, `Avg_Monthly_Sales`.
* **Observations:** Unweighted average MRP is ₹2,262.94; unweighted average COGS is ₹939.08. Total warehouse stock is 13,857 units.

### 3. `da_customer_profiles.csv` (Customer Dimension)
* **Row Count:** 200 accounts | **Columns:** 10 | **Null Values:** 0
* **Fields:** `Customer_ID` (PK), `City`, `Age_Band`, `Gender`, `Acquisition_Channel`, `First_Purchase_Date`, `Total_Orders`, `Total_Revenue`, `Last_Purchase_Date`, `Churned`.
* **Observations:** Covers 200 commercial clients across Indian business hubs; 68 accounts flagged as churned (34.0%).

---

## 11. Data Preprocessing Methodology
1. **Schema Validation:** Enforces mandatory presence of primary keys, numeric types, and date strings.
2. **Safe Division Guards:** Implementation of `safe_divide()` to prevent ZeroDivisionError and NaN propagation.
3. **Date Sequence Alignment:** Detects and records chronological inversions where `First_Purchase_Date > Last_Purchase_Date`.
4. **Anomaly Quarantine:** Flags records where `return_qty > quantity_units` (orders `ORD_000102` and `ORD_000412`) into exception tables without mutating ground-truth CSVs.

---

## 12. Exploratory Data Analysis (EDA)
* **Revenue Concentration:** 153 out of 600 orders exceed ₹1.00 Crore, driving 48.2% of total business revenue.
* **Seasonal Peaking:** Export demand peaks during Q3 and Q4, driven by apparel, electronics, and agricultural commodity cycles.
* **Payment Terms Distribution:** Letter of Credit (LC) and 30 Days Net dominate transaction value, accounting for over 55% of volume.
* **Transit Duration Skewness:** Average delivery duration is 23.49 days (median 23.5 days; range: 5 to 45 days).

---

## 13. SQL Implementation
The SQL suite in `sql/` implements enterprise analytical queries:

```sql
-- Executive Monthly Revenue and Delivery SLA
SELECT 
    strftime('%Y-%m', order_date) AS Order_Month,
    COUNT(order_id) AS Total_Orders,
    ROUND(SUM(total_value_inr) / 10000000.0, 2) AS Revenue_Cr,
    ROUND(AVG(delivery_days), 1) AS Avg_Transit_Days,
    ROUND(SUM(CASE WHEN on_time_delivery = 1 THEN 1.0 ELSE 0.0 END) / COUNT(order_id) * 100.0, 2) AS On_Time_Pct
FROM da_b2b_orders
GROUP BY Order_Month
ORDER BY Order_Month;

-- Data Quality & Compliance Exception Audit
SELECT 
    order_id, buyer_id, category, quantity_units, return_qty,
    (return_qty - quantity_units) AS Excess_Returned_Units
FROM da_b2b_orders
WHERE return_qty > quantity_units;
```

---

## 14. KPI Calculations and Formulas

| KPI Name | Mathematical Formula | Verified Value |
| :--- | :--- | :--- |
| **Total Revenue** | $\sum \text{total\_value\_inr}$ | **₹396.88 Cr** (₹3,968,829,214.20) |
| **Total Orders** | $N$ | **600** |
| **Average Order Value** | $\frac{\text{Total Revenue}}{N}$ | **₹66.15 Lakh** (₹6,614,715.36) |
| **On-Time Delivery Rate** | $\frac{\sum \text{on\_time\_delivery}}{N} \times 100$ | **77.50%** (465 orders) |
| **Unit Return Rate** | $\frac{\sum \text{return\_qty}}{\sum \text{quantity\_units}} \times 100$ | **1.01%** (15,242 / 1,509,070 units) |
| **Unique Buyers** | $|\text{Unique}(\text{buyer\_id})|$ | **187** |
| **Total Products** | $|\text{Unique}(\text{Product\_ID})|$ | **50** |
| **Catalogue Margin** | $\frac{\text{MRP} - \text{COGS}}{\text{MRP}} \times 100$ | **58.62%** |

---

## 15. Module Descriptions
1. **Executive Dashboard:** 8 compact KPI cards, 60/40 Monthly Revenue & Delivery SLA layout, Category and Payment Term breakdowns, and drill-down links.
2. **Revenue Analysis:** Time-series revenue trends, high-value transaction filtering, and paginated order directory.
3. **Shipments & Logistics:** Delivery SLA compliance, transit distribution histogram, and 135 delayed order records.
4. **Returns Analysis:** Physical return rates, return quantity distribution, and flagged data exceptions.
5. **Buyer Analysis:** 187 buyer rankings, repeat order tracking, and RFM-V customer clusters.
6. **Product Catalogue:** 50 SKUs, warehouse stock levels (13,857 units), retail margins, and inventory valuation.
7. **Country Analysis:** Sourcing origin state distribution and the proposed 12-market expansion specification.
8. **Currency & FX Analytics:** Interactive simulator for currency shocks across USD, EUR, GBP, AED, SGD, and JPY.
9. **Reports Hub:** Pre-generated executive summary, shipment, and exception reports with CSV and PDF print actions.
10. **Data Quality & Governance:** Source data inventories, validation logs, and audit logs.

---

## 16. Power BI Implementation
A complete Power BI project suite is engineered under `powerbi/`:
* **Model:** Star-schema centered on `Fact_Orders` connected to `Dim_Date`, `Dim_Products`, `Dim_Customers`, and `Dim_Proposed_Markets`.
* **Measures:** 30+ DAX measures defined in `powerbi/dax/TradeSight_DAX_Measures.dax`.
* **Theme:** Navy (`#172B4D`) and Blue (`#3674B5`) palette defined in `tradesight_powerbi_theme.json`.
* **Report Pages:**
  * Page 1: Executive Overview
  * Page 2: Shipment and Compliance
  * Page 3: Client and Product Analytics
  * Page 4: Returns and Data Quality
  * Page 5: Geography and FX Analytics

---

## 17. FX Analytics
Implemented in `src/fx_analytics.py`:
* **Appreciation Scenario:** When foreign billing currency gains against INR, export realization increases ($\Delta \text{Revenue} > 0$).
* **Depreciation Scenario:** When foreign billing currency depreciates against INR, export realization falls ($\Delta \text{Revenue} < 0$).
* **Input Validation:** Positive rate guards, non-negative invoice amounts, and zero-fluctuation neutrality.

---

## 18. Compliance Reporting
The compliance monitoring engine isolates two categories of operational anomalies:
* **Severe Data Quality Violations:** Return quantities exceeding shipped volume (`ORD_000102`, `ORD_000412`).
* **Logistics SLA Breaches:** 135 shipments exceeding delivery timelines (>20 days).

---

## 19. Automated Email Reporting
Configured via `.github/workflows/weekly_report.yml`:
* **Schedule:** Cron trigger every Monday at 08:00 UTC.
* **Manual Dispatch:** Supports `workflow_dispatch` with Test Mode switch.
* **Execution:** Generates markdown summaries and CSV logs, attempting secure SMTP dispatch when authorized credentials are present.

---

## 20. Testing Methodology
* **Pytest Test Suites:** 43 automated unit and integration tests across metrics, validation, pipeline, reporting, and FX analytics.
* **Regression Status:** 100% test pass rate (`43 passed in 29.8s`).
* **Build Verification:** Vite production bundling verified with zero errors.

---

## 21. Actual Analytical Results
* **Total Revenue:** ₹396.88 Cr across 600 orders.
* **Average Order Value:** ₹66.15 Lakh.
* **On-Time Delivery:** 77.50% (465 on-time vs 135 delayed).
* **Return Rate:** 1.01% (15,242 units returned).
* **Repeat Buyers:** 227 orders (37.83%).
* **Catalogue Gross Margin:** 58.62% average.

---

## 22. Business Insights
1. **Logistics Bottleneck:** 22.50% of shipments experienced delays, with transit durations stretching up to 45 days. Establishing dedicated port customs clearance lanes can elevate on-time delivery above 90%.
2. **Revenue Concentration:** 153 high-value orders account for nearly half of export earnings. Priority account management should be deployed for the top 10 buyers.
3. **Return Integrity:** While return rates are healthy at 1.01%, 2 orders have quantity errors, highlighting the need for validation checks in the client's ERP ingestion pipeline.

---

## 23. Challenges and Solutions
* **Challenge:** Discrepancy between earlier assistant summaries (40k units) and actual CSV sums (1.5M units).  
  **Solution:** Recomputed and verified directly from source CSVs with automated Python verification scripts.
* **Challenge:** Absence of destination country in order manifests.  
  **Solution:** Upheld strict academic integrity by documenting the limitation transparently and presenting a 12-market expansion specification.

---

## 24. Limitations
* **Destination Country:** Historical order records lack international destination country codes.
* **SKU-Level Order Link:** B2B orders list category and units, but do not link individual SKUs from the product catalogue; client rankings are therefore revenue-based rather than net profit-based.
* **Currency Recording:** Orders were booked in INR; FX analytics operate as hypothetical sensitivity simulations.

---

## 25. Future Enhancements
* Integrate real-time Reserve Bank of India (RBI) reference rates via API.
* Ingest warehouse ERP shipment tracking webhooks for real-time GPS container tracking.
* Expand Power BI semantic model to Azure Analysis Services or Power BI Premium capacity.

---

## 26. Conclusion
The TradeSight Export Analytics project delivers a robust, transparent, and presentation-ready business intelligence platform. By combining verified Python analytical engines, an interactive React.js web interface deployed on Vercel, and a comprehensive Power BI reporting suite, the project successfully fulfills all client project criteria and internship evaluation requirements.

---

## 27. Official Technology References
* **Python Software Foundation:** Python 3.12 Documentation ([docs.python.org](https://docs.python.org/3/))
* **Pandas Development Team:** Pandas 2.2 / 3.0 Reference Guide ([pandas.pydata.org](https://pandas.pydata.org/))
* **Microsoft Corporation:** Power BI Desktop & DAX Reference Documentation ([learn.microsoft.com/power-bi](https://learn.microsoft.com/en-us/power-bi/))
* **Meta Open Source:** React 18 Official Documentation ([react.dev](https://react.dev/))
* **Vite Team:** Vite Next Generation Frontend Tooling ([vitejs.dev](https://vitejs.dev/))
* **Vercel Inc.:** Vercel Edge Network & Platform Documentation ([vercel.com/docs](https://vercel.com/docs))
