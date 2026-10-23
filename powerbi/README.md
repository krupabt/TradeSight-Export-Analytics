# TradeSight Export Analytics — Power BI Desktop Implementation Guide

This guide provides end-to-end instructions to construct the verified executive Power BI report for the TradeSight Export Management solution.

> [!NOTE]
> Power BI Desktop (`.pbix`) files are binary files that require the Microsoft Power BI Desktop Windows application.
> Since Power BI Desktop is not installed in this CLI development container, no synthetic or unverified `.pbix` file has been fabricated.
> Follow the exact steps below to build the verified dashboard in Power BI Desktop using our pipeline outputs.

---

## Prerequisites

1. Run the Python data pipeline to generate the processed datasets:
   ```powershell
   python src/pipeline.py
   ```
2. Verify that the following files exist in `D:\TradeSight-Export-Analytics\data_processed\`:
   - `da_b2b_orders_cleaned.csv`
   - `da_customer_profiles_cleaned.csv`
   - `da_product_catalogue_cleaned.csv`
3. Launch **Power BI Desktop** (free download from Microsoft Store or powerbi.microsoft.com).

---

## Step-by-Step Implementation

### Step 1: Ingest Processed Data Files
1. Open Power BI Desktop and create a new blank report (`File -> New`).
2. Click **Get Data -> Text/CSV**.
3. Select `D:\TradeSight-Export-Analytics\data_processed\da_b2b_orders_cleaned.csv` and click **Load**.
4. Repeat for:
   - `D:\TradeSight-Export-Analytics\data_processed\da_customer_profiles_cleaned.csv`
   - `D:\TradeSight-Export-Analytics\data_processed\da_product_catalogue_cleaned.csv`

---

### Step 2: Create Date Dimension (`DimDate`)
In Power BI Desktop, click **Modeling -> New Table** and paste this DAX formula:

```dax
DimDate = 
VAR _MinDate = DATE(2023, 1, 1)
VAR _MaxDate = DATE(2024, 12, 31)
RETURN
    ADDCOLUMNS(
        CALENDAR(_MinDate, _MaxDate),
        "Year", YEAR([Date]),
        "MonthNumber", MONTH([Date]),
        "MonthName", FORMAT([Date], "MMM"),
        "YearMonth", FORMAT([Date], "YYYY-MM"),
        "Quarter", "Q" & FORMAT([Date], "Q"),
        "YearQuarter", FORMAT([Date], "YYYY") & "-Q" & FORMAT([Date], "Q")
    )
```

Mark `DimDate` as a Date Table (`Table Tools -> Mark as Date Table -> Date column: Date`).

---

### Step 3: Configure Data Model Relationships
1. Switch to the **Model View** tab (left sidebar).
2. Establish the following relationship:
   - Drag `DimDate[Date]` to `da_b2b_orders_cleaned[order_date_parsed]` (or `order_date`).
   - Cardinality: **One to Many (1:*)**
   - Cross filter direction: **Single**
3. Keep `da_customer_profiles_cleaned` and `da_product_catalogue_cleaned` as **independent master tables** (no relationships to orders), reflecting their disjunct domain schemas documented in our Week 3 pipeline audit.

---

### Step 4: Create the Measures Table
1. On the **Home** tab, click **Enter Data**.
2. Name the table `_Measures` and click **Load**.
3. Open [`powerbi/dax_measures.md`](file:///d:/TradeSight-Export-Analytics/powerbi/dax_measures.md) and copy each DAX measure into `_Measures` (`Modeling -> New Measure`).

Key measures to create first:
- `Total Orders`
- `Total Revenue INR`
- `Average Order Value`
- `On-Time Delivery Rate %`
- `Unit Return Rate %`
- `Average Delivery Days`
- `Delayed Orders`

---

### Step 5: Build Dashboard Pages

Follow the detailed visual positioning guide in [`powerbi/dashboard_specification.md`](file:///d:/TradeSight-Export-Analytics/powerbi/dashboard_specification.md):

#### Page 1: Executive Overview & Commercial Performance
1. **Title Banner:** "TradeSight Export Analytics — Executive Overview" (Navy Blue `#0F2027` background, white text).
2. **KPI Card Visuals:**
   - Card 1: `[Total Revenue Formatted]` (Label: Total Export Value)
   - Card 2: `[Total Orders]` (Label: Total Orders)
   - Card 3: `[Average Order Value]` (Label: AOV)
   - Card 4: `[On-Time Delivery Rate %]` (Label: On-Time Fulfillment)
   - Card 5: `[Unit Return Rate %]` (Label: Unit Return Rate)
3. **Monthly Trend Visual:** Line and Clustered Column Chart.
   - X-Axis: `DimDate[YearMonth]`
   - Column: `[Total Revenue INR]`
   - Line: `[Total Orders]`
4. **Category Breakdown:** Clustered Bar Chart.
   - Y-Axis: `da_b2b_orders_cleaned[category]`
   - X-Axis: `[Total Revenue INR]`
5. **Payment Terms:** Donut Chart (`da_b2b_orders_cleaned[payment_terms]`, `[Total Orders]`).

#### Page 2: Shipment & Logistics Fulfillment
1. **Cards:** On-Time Orders, Delayed Orders, Average Delivery Days, Median Delivery Days.
2. **Category On-Time SLA:** Clustered Bar Chart with constant target line at `80%`.
3. **Transit Days Histogram:** Group `delivery_days` in 5-day bins.
4. **Credit Risk Table:** Matrix of `payment_terms` by `on_time_delivery`.

#### Page 3: Returns & Data Quality Exception Audit
1. **Cards:** Total Returned Units, Unit Return Rate %, Orders with Returns Count, Return Overrun Anomalies Count.
2. **Category Return Profile:** Line and Column Chart of returned units and return rate %.
3. **Audit Exception Grid:** Table filtered by `data_quality_flag = "SUSPICIOUS_RETURN_EXCEEDS_ORDERED"` (displaying orders `B2B-00131` and `B2B-00188`).

#### Page 4: Master Reference Catalogues
1. **Product Catalogue Panel:** Margin % by category, stock units, and average MRP.
2. **Customer Profiles Panel:** Acquisition channels, city breakdown, and customer churn rate.

---

## Step 6: Save and Publish
1. Save the workbook as `D:\TradeSight-Export-Analytics\powerbi\TradeSight_Export_Analytics.pbix`.
2. (Optional) Publish to Power BI Service workspace if cloud sharing is required by your team lead.
