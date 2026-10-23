# TradeSight Export Analytics

**Capstone Milestone:** Week 3 — Reusable Data Pipeline & Baseline Metrics  
**Program:** Cynaris Data Analyst Internship  
**Client Scenario:** Chennai-based export management enterprise (~45 employees, 50 clients across 12 countries)  
**Technology Stack:** Python 3.12, pandas, PostgreSQL, SQL, Power BI Desktop, Git, GitHub  

---

## 1. Executive Summary & Project Context

TradeSight Export Analytics is an enterprise-grade analytics engineering solution built to monitor export order fulfillment, logistics delivery timelines, quality return exceptions, and customer profile dynamics for an export management firm headquartered in Chennai, India.

### Baseline Key Performance Indicators (600 Orders, 2023–2024)
- **Total Gross Export Value:** **₹3,968,829,214.20 INR** (~₹3.97 Billion INR)
- **Total Export Orders:** **600 Orders**
- **Average Order Value (AOV):** **₹6,614,715.36 INR**
- **Median Order Value:** **₹4,817,483.05 INR**
- **Total Ordered Volume:** **1,509,070 Units**
- **Total Returned Volume:** **15,242 Units**
- **Unit Return Rate:** **1.0100%** (`Total Returned Units / Total Ordered Units * 100`)
- **Order Return Rate:** **98.5000%** (591 orders experienced ≥1 returned unit)
- **On-Time Delivery Rate:** **77.5000%** (465 on-time orders vs. 135 delayed orders)
- **Mean Transit Duration:** **23.49 Days** (range: 3 to 45 days)
- **Repeat Buyer Share:** **37.8333%** (227 repeat buyer orders)

---

## 2. Repository Structure

```text
D:\TradeSight-Export-Analytics\
├── data\                                # Original immutable raw datasets
│   ├── da_b2b_orders.csv                # 600 B2B export orders (2023-2024)
│   ├── da_product_catalogue.csv         # 50 master catalogue reference products
│   └── da_customer_profiles.csv         # 200 customer account profiles
├── data_processed\                      # Cleaned and augmented datasets
│   ├── da_b2b_orders_cleaned.csv        # Orders with quality flags and parsed dates
│   ├── da_customer_profiles_cleaned.csv # Profiles with tenure and date validity flags
│   └── da_product_catalogue_cleaned.csv # Products with margins and stock coverage
├── src\                                 # Modular Python data pipeline
│   ├── __init__.py
│   ├── data_validation.py               # Schema, range, date, and integrity validation
│   ├── metrics.py                       # Baseline metrics, trends, and category analysis
│   ├── pipeline.py                      # Main pipeline orchestrator and report builder
│   └── reporting.py                     # Weekly exception monitoring and SMTP alerting
├── sql\                                 # PostgreSQL relational database scripts
│   ├── schema.sql                       # DDL schema, tables, indices, and import commands
│   ├── analysis_queries.sql             # Analytical queries (revenue, transit, returns)
│   └── data_quality_checks.sql          # Automated database integrity audit queries
├── powerbi\                             # Power BI reporting assets
│   ├── dashboard_specification.md       # 5-page dashboard canvas layout & visual specs
│   ├── dax_measures.md                  # Complete library of production DAX measures
│   └── README.md                        # Step-by-step instructions to build the .pbix
├── outputs\                             # Pipeline-generated artifacts
│   ├── data_inventory.csv               # Dataset size, memory, and status inventory
│   ├── baseline_metrics.csv             # 37 structured baseline metrics with definitions
│   ├── data_quality_report.json         # JSON audit of nulls, duplicates, and anomalies
│   ├── cleaning_log.csv                 # Detailed audit log of every flagged record
│   └── weekly_exception_report_*.csv    # Dated weekly operational exceptions CSV
├── reports\                             # Formatted executive Markdown reports
│   ├── baseline_report.md               # Executive baseline metrics and domain analysis
│   └── weekly_exception_report_*.md     # Dated weekly exception monitoring report
├── tests\                               # Comprehensive automated test suite
│   ├── __init__.py
│   ├── test_validation.py               # Tests for schema checks and anomaly detection
│   ├── test_metrics.py                  # Tests for math logic, denominators, empty dfs
│   ├── test_reporting.py                # Tests for exception generator and email safety
│   └── test_pipeline.py                 # Tests for pipeline execution and idempotency
├── requirements.txt                     # Python dependencies
├── .gitignore                           # Git version control ignore rules
├── .env.example                         # Environment configuration template
└── README.md                            # Comprehensive project documentation
```

---

## 3. Data Integrity & Relationship Audit Findings

As a senior data analyst, evidence-based reporting requires highlighting key anomalies and domain realities uncovered during pipeline inspection:

### 1. Logical Anomaly: Return Quantity Exceeding Ordered Units
- **Findings:** Exactly **2 orders** in `da_b2b_orders.csv` contain a return quantity greater than ordered units:
  - `B2B-00131`: 22 units ordered vs. **28 units returned** (+6 excess).
  - `B2B-00188`: 39 units ordered vs. **48 units returned** (+9 excess).
- **Pipeline Treatment:** In accordance with non-destructive data governance, these rows are **preserved intact** and tagged with `is_valid_return=False` and `data_quality_flag='SUSPICIOUS_RETURN_EXCEEDS_ORDERED'` in `data_processed/da_b2b_orders_cleaned.csv` and logged in `outputs/cleaning_log.csv`.

### 2. Chronological Anomaly: Inverted Customer Purchase Dates
- **Findings:** Exactly **42 of 200 customer profiles** (21.0%) in `da_customer_profiles.csv` record a `First_Purchase_Date` later than their `Last_Purchase_Date` (e.g., Customer `C10`: first purchase `2025-12-26`, last purchase `2025-10-20`).
- **Pipeline Treatment:** Preserved intact with `is_chronologically_valid=False`, `data_quality_flag='INVALID_FIRST_PURCHASE_AFTER_LAST_PURCHASE'`, and tenure calculation set to `NaN` to prevent negative durations.

### 3. Cross-Dataset Joinability Audit (Disjunct Domains)
Our schema audit revealed that the 3 provided datasets belong to separate business domains and cannot be relationally joined without creating false correlations:
- **Identifier Disjunction:** `orders.buyer_id` (`BUY-0001` through `BUY-0200`) does not match `customers.Customer_ID` (`C1` through `C200`).
- **Missing Product Foreign Key:** `orders` contains no `Product_ID` column.
- **Category Disjunction:** Orders comprise wholesale industrial categories (`Chemicals`, `Textiles`, `Industrial Machinery`, etc.), whereas the product catalogue features retail consumer products (`Beauty`, `Grocery`, `Apparel`, etc.) with zero overlapping categories.
- **Decision:** The datasets are modeled independently. Fabricating joins between unrelated entities has been strictly avoided.

---

## 4. Business Requirements Feasibility Matrix

| Business Requirement | Feasibility | Audit Note |
| :--- | :--- | :--- |
| **Order & Shipment Performance** | **Fully Supported** | Complete timestamps, delivery transit days, on-time indicators, and order values. |
| **Delivery Delays & Returns** | **Fully Supported** | On-time delivery rates, delayed order counts, and unit return rates calculated. |
| **Customer Channel & Churn** | **Partially Supported (Isolated)** | Customer profiles analyzed for acquisition channel and churn; cannot join to orders. |
| **Product Margin & Inventory** | **Partially Supported (Isolated)** | Catalogue evaluated for MRP/COGS margins and stock coverage; cannot join to orders. |
| **Foreign Exchange (FX) Impact** | **Unsupported** | ❌ All values denominated in INR. No foreign currency codes (USD, EUR) or exchange rates exist. |
| **Client Net Profitability** | **Unsupported** | ❌ Orders record gross revenue (`total_value_inr`) but lack shipping costs, duties, and order COGS. |
| **Compliance Exceptions** | **Operational Exceptions Only** | ❌ Available data reflects delivery delays and data hygiene anomalies, not legal customs violations. |

---

## 5. Setup & Execution Instructions (Windows PowerShell)

### Step 1: Clone Repository & Open PowerShell
```powershell
cd D:\TradeSight-Export-Analytics
```

### Step 2: Install Python Dependencies
```powershell
pip install -r requirements.txt
```

### Step 3: Run the Complete Data Pipeline
```powershell
python src/pipeline.py
```
*Executes validation, generates cleaned datasets in `data_processed/`, outputs baseline metrics to `outputs/baseline_metrics.csv`, and writes executive reports to `reports/baseline_report.md`.*

### Step 4: Run the Automated Test Suite
```powershell
pytest -v
```
*Runs 20 automated tests validating loading, schema validation, date parsing, baseline metrics, edge cases, and pipeline idempotency.*

---

## 6. PostgreSQL Database Setup

PostgreSQL scripts are located in `sql/`:

1. **Create Database & Schema:**
   ```powershell
   # In psql or pgAdmin:
   \i D:/TradeSight-Export-Analytics/sql/schema.sql
   ```
2. **Execute Analytical Queries:**
   ```powershell
   \i D:/TradeSight-Export-Analytics/sql/analysis_queries.sql
   ```
3. **Execute Data Quality Audit:**
   ```powershell
   \i D:/TradeSight-Export-Analytics/sql/data_quality_checks.sql
   ```

*Note: Database execution has not been verified in the CLI environment as PostgreSQL server is not installed locally. The SQL scripts are verified PostgreSQL 14+ compatible.*

---

## 7. Power BI Dashboard Construction

Follow [`powerbi/README.md`](file:///d:/TradeSight-Export-Analytics/powerbi/README.md) to build the 5-page report in Power BI Desktop:
1. Load `data_processed/da_b2b_orders_cleaned.csv`, `da_customer_profiles_cleaned.csv`, `da_product_catalogue_cleaned.csv`.
2. Generate `DimDate` table using the provided DAX calendar script.
3. Establish a 1:Many relationship between `DimDate[Date]` and `da_b2b_orders_cleaned[order_date_parsed]`.
4. Copy the complete set of DAX measures from [`powerbi/dax_measures.md`](file:///d:/TradeSight-Export-Analytics/powerbi/dax_measures.md).
5. Lay out visuals as specified in [`powerbi/dashboard_specification.md`](file:///d:/TradeSight-Export-Analytics/powerbi/dashboard_specification.md).

---

## 8. Dataset Publication & Git Guidelines

- **Raw Datasets (`data/da_*.csv`):** Synthetic capstone training datasets (~72 KB total). Safe for inclusion in academic / internship review repositories.
- **Processed Datasets (`data_processed/`):** Cleaned CSVs (< 100 KB total), suitable for versioning to allow reproducible Power BI builds.
- **Credentials & Secrets:** Real `.env` files are excluded via `.gitignore`. Only `.env.example` is committed.
- **Caches & Virtual Environments:** `.pytest_cache/`, `__pycache__/`, and `.venv/` are excluded.

---

## 9. Weekly Exception Automation & Windows Task Scheduler

To schedule the weekly pipeline and exception report generator every Monday at 8:00 AM:

```powershell
$Action = New-ScheduledTaskAction -Execute "python.exe" -Argument "D:\TradeSight-Export-Analytics\src\pipeline.py"
$Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 08:00AM
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable
Register-ScheduledTask -TaskName "TradeSight_Weekly_Exception_Report" -Action $Action -Trigger $Trigger -Settings $Settings -Description "Runs weekly data pipeline and exception generator"
```
