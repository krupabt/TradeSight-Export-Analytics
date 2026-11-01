# TradeSight Export Analytics — Power BI Dashboard Specification (V1)

**Milestone:** Cynaris Data Analyst Internship — Week 9 Capstone  
**Target Environment:** Power BI Desktop (May 2024+ release) & Power BI Service  
**Data Sources:**
- `data_processed/da_b2b_orders_cleaned.csv` (Fact Table: 600 Orders)
- `week6_deep_dive/outputs/buyer_rfm_segments.csv` (Dimension: 187 Commercial Buyer Accounts)
- `data_processed/da_product_catalogue_cleaned.csv` (Reference Dimension: 50 Retail Products)
- `data_processed/da_customer_profiles_cleaned.csv` (Reference Dimension: 50 Retail Customers)
- `DimDate` (Generated DAX Calendar: 2023-01-01 to 2024-12-31)

---

## 1. Executive Color Palette & Design System

* **Primary Dark (Canvas Header / Cards):** `#0F2027` (Deep Slate Charcoal)
* **Secondary Navy (Headers / Accents):** `#203A43` / `#2C5364`
* **Brand Primary Blue (Series 1):** `#1E3C72`
* **Brand Secondary Blue (Series 2):** `#2B6CB0`
* **Success Green (On-Time Fulfillment):** `#2F855A` / `#38A169`
* **Warning Amber (Operational Friction):** `#DD6B20` / `#D69E2E`
* **Critical Red (Delays & Quality Overruns):** `#E53E3E` / `#C53030`
* **Canvas Background:** `#F8FAFC` (Off-White Cool Gray)
* **Card Container Background:** `#FFFFFF` with `#E2E8F0` border (1px solid)

---

## 2. Page Architecture & Layout Specifications

The dashboard report comprises **5 dedicated analytical pages**:

### Page 1: Executive Overview & Commercial Performance
* **Visual 1.1 — Report Title Banner:** Full-width header (Height: 65px), Navy background (`#0F2027`), Title text: "TradeSight Export Analytics — Executive Overview".
* **Visual 1.2 — Slicers (Top Right / Sidebar):**
  - Date Range Slicer (Between: 2023-01-01 to 2024-12-31)
  - Category Dropdown (Industrial Machinery, Electronics, Chemical, Automotive Parts, Textiles)
  - Payment Terms Dropdown (30 days, 60 days, 90 days, Advance)
  - Buyer RFM Segment Dropdown (4 Clusters)
* **Visual 1.3 — Executive KPI Cards (Row 1):**
  - Card 1: `[Total Revenue Formatted]` (Label: Total Export Value | Value: ₹397.27 Cr)
  - Card 2: `[Total Orders]` (Label: Total B2B Orders | Value: 600)
  - Card 3: `[Average Order Value]` (Label: AOV | Value: ₹66.21 Lakh)
  - Card 4: `[On-Time Delivery Rate %]` (Label: On-Time SLA | Value: 78.67% | Target: 80%)
  - Card 5: `[Unit Return Rate %]` (Label: Unit Return Rate | Value: 5.00%)
  - Card 6: `[Active Buyers]` (Label: Active Buyers | Value: 187)
* **Visual 1.4 — Monthly Revenue & Order Volume Trend:** Line and Clustered Column Chart.
  - X-Axis: `DimDate[YearMonth]`
  - Column Y-Axis: `[Total Revenue INR]` (Bar color: `#1E3C72`)
  - Line Y-Axis: `[Total Orders]` (Line color: `#D69E2E`, width: 3px)
* **Visual 1.5 — Commodity Category Revenue:** Horizontal Clustered Bar Chart.
  - Y-Axis: `da_b2b_orders_cleaned[category]`
  - X-Axis: `[Total Revenue INR]`
* **Visual 1.6 — Commercial Payment Terms Share:** Donut Chart (`payment_terms`, `[Total Orders]`).
* **Visual 1.7 — Repeat Commercial Buyer Ratio:** Donut Chart (`repeat_buyer`, `[Total Orders]`).

---

### Page 2: Logistics & Fulfillment Diagnostics
* **Visual 2.1 — Summary KPI Cards:**
  - Card 1: `[Average Delivery Days]` (Value: 18.29 Days)
  - Card 2: `[Median Delivery Days]` (Value: 18.00 Days)
  - Card 3: `[On-Time Orders]` (Value: 472 Orders)
  - Card 4: `[Delayed Orders]` (Value: 128 Orders | Delay Rate: 21.33%)
* **Visual 2.2 — On-Time SLA by Product Category vs Target:** Clustered Bar Chart.
  - Y-Axis: `da_b2b_orders_cleaned[category]`
  - X-Axis: `[On-Time Delivery Rate %]`
  - Analytics Constant Line: `80.0%` (Red dashed line `#E53E3E`, labeled "Target SLA 80%")
* **Visual 2.3 — Transit Duration Distribution:** Clustered Column Histogram.
  - X-Axis: `da_b2b_orders_cleaned[delivery_days]` (binned in 5-day intervals)
  - Legend: `on_time_delivery` (Green: On-Time, Red: Delayed)
* **Visual 2.4 — Payment Terms vs Fulfillment SLA Matrix:** Table Visual.
  - Rows: `payment_terms`
  - Values: `[Total Orders]`, `[On-Time Orders]`, `[Delayed Orders]`, `[On-Time Delivery Rate %]`, `[Average Delivery Days]`.

---

### Page 3: Cargo Returns & Quality Exception Audit
* **Visual 3.1 — Summary KPI Cards:**
  - Card 1: `[Total Ordered Units]` (Value: 332,698 Units)
  - Card 2: `[Total Returned Units]` (Value: 16,634 Units)
  - Card 3: `[Unit Return Rate %]` (Value: 5.00%)
  - Card 4: `[Severe Return Overrun Flags]` (Value: 2 Orders)
* **Visual 3.2 — Category Return Rate (%) Profile:** Clustered Column Chart.
  - X-Axis: `da_b2b_orders_cleaned[category]`
  - Y-Axis: `[Unit Return Rate %]` (Red `#E53E3E`)
* **Visual 3.3 — Physical Volume Comparison:** Clustered Bar Chart.
  - X-Axis: `da_b2b_orders_cleaned[category]`
  - Series 1: `[Total Ordered Units]` (Gray `#4A5568`)
  - Series 2: `[Total Returned Units]` (Red `#E53E3E`)
* **Visual 3.4 — Critical Audit Alert Callout & Table Grid:**
  - Alert Banner: "CRITICAL AUDIT EXCEPTION: SUSPICIOUS RETURN OVERRUN ANOMALIES"
  - Filter: `data_quality_flag = "SUSPICIOUS_RETURN_EXCEEDS_ORDERED"`
  - Display Columns: `order_id`, `buyer_id`, `category`, `order_date`, `quantity_units`, `return_qty`, `unit_price_inr`, `total_value_inr`, `data_quality_flag`
  - Identified Records: `B2B-00131` (139 units returned vs 114 ordered) and `B2B-00188` (131 units returned vs 125 ordered).

---

### Page 4: Week 6 Buyer Segmentation & Commercial Intelligence
* **Visual 4.1 — Buyer RFM Cluster Summary Cards:**
  - Cluster 1: `Core Stable Accounts (High Fulfillment)` — 75 Buyers (40.1%)
  - Cluster 2: `Active Growth Buyers (High Velocity)` — 68 Buyers (36.4%)
  - Cluster 3: `Operationally Vulnerable (High Friction)` — 27 Buyers (14.4%)
  - Cluster 4: `Lapsed Accounts (Dormant)` — 17 Buyers (9.1%)
* **Visual 4.2 — 2D PCA Behavioral Projection:** Scatter Chart.
  - X-Axis: `buyer_rfm_segments[pca_x]` (Principal Component 1: Fulfillment & Volume)
  - Y-Axis: `buyer_rfm_segments[pca_y]` (Principal Component 2: Inactivity & Friction)
  - Legend: `buyer_rfm_segments[segment_label]` (4 Distinct Cluster Colors)
  - Tooltips: `buyer_id`, `frequency`, `total_spend_inr`, `on_time_rate`, `unit_return_rate`
* **Visual 4.3 — Commercial Spend by RFM Segment:** Clustered Horizontal Bar Chart.
  - Y-Axis: `buyer_rfm_segments[segment_label]`
  - X-Axis: `[Average Buyer Total Spend]`
* **Visual 4.4 — Commercial Buyer Account Explorer:** Detailed Table Visual.
  - Columns: `buyer_id`, `segment_label`, `frequency`, `total_spend_inr`, `avg_order_value_inr`, `recency_days`, `on_time_rate`, `unit_return_rate`, `primary_category`, `primary_payment_term`.

---

### Page 5: Data Quality, Governance & Missing Information Audit
* **Visual 5.1 — Unavailable Business Metrics Documentation Card (Left Column):**
  - Item 1: **Foreign Exchange (FX) Impact** — Missing currency code and spot exchange rates in source ERP data; all orders recorded in INR.
  - Item 2: **Client Profitability & COGS** — Missing unit production cost and shipping tariffs; master product catalogue lacks transactional order-line foreign keys.
  - Item 3: **Export Compliance & Regulatory Audit** — Zero customs clearance, shipping bills, or port inspection fields exist in provided files.
* **Visual 5.2 — Enterprise Verified Scorecard (Right Column):**
  - Comprehensive reference table listing all 12 verified baseline metrics, values, and audit statuses.
