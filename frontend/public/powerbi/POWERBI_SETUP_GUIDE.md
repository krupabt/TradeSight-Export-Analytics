# TradeSight Export Analytics – Microsoft Power BI Setup & Implementation Guide

This guide provides instructions to open, inspect, and save the official **TradeSight_Analytics.pbix** report for the college internship and client project evaluation.

---

## 1. Directory Structure Overview

All Power BI assets are organized in the `powerbi/` directory:

```
powerbi/
├── TradeSight_Analytics.pbip            <-- Power BI Project entry file (double-click to open)
├── TradeSight_Analytics.Dataset/        <-- Semantic model, tables, relationships & DAX measures
│   ├── definition.pbidataset
│   └── model.bim                        <-- Microsoft Tabular Object Model (TOM) schema
├── TradeSight_Analytics.Report/         <-- 5-Page visual canvas definitions
│   ├── definition.pbir
│   └── report.json                      <-- Layout, visual containers, and formatting
├── data/                                <-- Modeled and enriched star-schema datasets
│   ├── Fact_Orders.csv                  (600 orders with OrderDateKey, SLA_Status, Value_Category)
│   ├── Dim_Products.csv                 (50 SKUs with Margins, Markup, Stock Value)
│   ├── Dim_Customers.csv                (200 accounts with Churn Status and City)
│   ├── Dim_Date.csv                     (Calendar dimension 2023–2024 with Quarters and Months)
│   └── Dim_Proposed_Markets.csv         (12-Country target export market specification)
├── power_query/                         <-- Power Query M transformation scripts
│   ├── Fact_Orders.m
│   ├── Dim_Products.m
│   ├── Dim_Customers.m
│   ├── Dim_Date.m
│   └── Dim_Proposed_Markets.m
├── dax/                                 <-- Production DAX measures library
│   ├── TradeSight_DAX_Measures.dax      (30+ production formulas)
│   └── DAX_DICTIONARY.md                (Complete definitions, formats & expected baselines)
└── theme/                               <-- Corporate theme
    └── tradesight_powerbi_theme.json    (Exact Navy & Light branding)
```

---

## 2. Opening via Power BI Project (Recommended Method)

If Microsoft Power BI Desktop is installed on your Windows machine:

1. Navigate to the `powerbi/` folder in Windows File Explorer:
   `D:\TradeSight-Export-Analytics\powerbi`
2. Double-click **`TradeSight_Analytics.pbip`**.
3. Power BI Desktop will automatically load the model, load the theme, and render all 5 interactive pages:
   - **Page 1: Executive Overview** (8 KPI cards, Monthly Area Chart, SLA Donut, Category & Terms Bar Charts)
   - **Page 2: Shipment and Compliance** (Transit Days Histogram, Category SLA, Exception Table)
   - **Page 3: Client and Product Analytics** (Top Buyers, Margin Distribution, Stock Inventory Table)
   - **Page 4: Returns and Data Quality** (Return Rates, Defect Overview, Flagged Anomalies)
   - **Page 5: Geography and FX Analytics** (Customer Distribution, 12-Market Specification, FX Audit)
4. Click **File -> Save As...**
5. Select format **Power BI File (*.pbix)** and save as:
   `TradeSight_Analytics.pbix` inside the `powerbi/` folder.

---

## 3. Alternative 5-Minute Manual Build Method

If you are creating a fresh `.pbix` from Power BI Desktop:

### Step 1: Ingest Data
1. Open Power BI Desktop.
2. Click **Get Data -> Text/CSV**.
3. Ingest each CSV from `powerbi/data/`:
   - `Fact_Orders.csv`
   - `Dim_Products.csv`
   - `Dim_Customers.csv`
   - `Dim_Date.csv`
   - `Dim_Proposed_Markets.csv`
4. Click **Load**.

### Step 2: Establish Model Relationships
1. Open the **Model View** (left sidebar icon).
2. Create a relationship between:
   - `Fact_Orders[OrderDateKey]` (Many) to `Dim_Date[DateKey]` (One) — Single direction.
   - `Fact_Orders[buyer_id]` (Many) to `Dim_Customers[Customer_ID]` (One) — Inactive/Active.

### Step 3: Apply the TradeSight Theme
1. Open the **View** ribbon at the top.
2. In the Themes dropdown, click **Browse for themes...**
3. Select `powerbi/theme/tradesight_powerbi_theme.json`.
4. All visuals will immediately adopt the `#172B4D` navy and `#3674B5` blue corporate color palette.

### Step 4: Add DAX Measures
1. Open `powerbi/dax/TradeSight_DAX_Measures.dax`.
2. Click **New Measure** on `Fact_Orders` and paste each measure (e.g., `Total Export Revenue`, `Total Orders`, `AOV (Lakhs)`, `On-Time Delivery %`, `Unit Return Rate %`, etc.).

### Step 5: Save Report
Save the final report as `TradeSight_Analytics.pbix` in `powerbi/`.
