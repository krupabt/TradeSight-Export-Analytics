# TradeSight Export Analytics — Comprehensive KPI Verification Report

**Project:** TradeSight Export Analytics  
**Milestone:** Cynaris Data Analyst Internship — Week 9 Capstone  
**Target Application:** Enterprise React + Vite Dashboard  
**Live Production URL:** [https://tradesight-export-analytics.vercel.app](https://tradesight-export-analytics.vercel.app)  
**Audit Date:** 2026-11-05  
**Lead Analyst:** Krupa B T  
**Source Datasets Inspected:**
1. `data/da_b2b_orders.csv` (600 rows, 13 columns)
2. `data/da_product_catalogue.csv` (50 rows, 7 columns)
3. `data/da_customer_profiles.csv` (200 rows, 10 columns)

---

## 1. Executive Audit Summary

Every metric presented in the TradeSight Export Analytics live dashboard was audited against the three original CSV files. Calculations were executed via Python (pandas 3.1.0) and compared against the values rendered in the production React frontend.

* **Total Metrics Audited:** 24 quantitative metrics + 4 data quality integrity checks + 4 unsupported metric indicators.
* **Calculation Accuracy:** **100%** (zero discrepancies between python raw data aggregations and dashboard live values).
* **Synthetic Data / Joins:** **0** (strictly zero fabricated records, simulated exchange rates, or unverified foreign keys).
* **Live Dashboard Status:** Verified operating over HTTPS on Vercel at [https://tradesight-export-analytics.vercel.app](https://tradesight-export-analytics.vercel.app).
* **Visual Verification Evidence:** Real headless 1920x1080 screenshots captured from the live deployment and archived in `week9_dashboard/screenshots/`.

---

## 2. KPI Verification Table (Calculated vs Dashboard Live Values)

| KPI Name | Calculation | Expected Value | Dashboard Value | Status | Evidence / Notes |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Total Export Revenue** | $\sum \text{total\_value\_inr}$ | ₹3,968,829,214.20 | ₹396.88 Cr | **Verified** | Exact match. Formatted as ₹396.88 Cr in executive card. |
| **Total Orders** | $\text{COUNT}(\text{order\_id})$ | 600 Orders | 600 Orders | **Verified** | Exact match across 2023–2024 orders log. |
| **Average Order Value (AOV)** | $\frac{\text{Total Revenue}}{\text{Total Orders}}$ | ₹6,614,715.36 | ₹66.15 L | **Verified** | Exact match. Sub-label displays median: ₹48.17 L. |
| **Median Order Value** | $\text{MEDIAN}(\text{total\_value\_inr})$ | ₹4,817,483.05 | ₹48.17 L | **Verified** | Exact match. |
| **Minimum Order Value** | $\min(\text{total\_value\_inr})$ | ₹28,360.80 | ₹28,360.80 | **Verified** | Exact match in revenue analytics breakdown. |
| **Maximum Order Value** | $\max(\text{total\_value\_inr})$ | ₹24,380,230.92 | ₹2.44 Cr | **Verified** | Exact match in revenue analytics breakdown. |
| **Total Shipped Units** | $\sum \text{quantity\_units}$ | 1,509,070 Units | 1,509,070 Units | **Verified** | Exact sum across all bulk export commodity consignments. |
| **Total Returned Units** | $\sum \text{return\_qty}$ | 15,242 Units | 15,242 Units | **Verified** | Exact sum across all reported customer return quantities. |
| **Unit Return Rate** | $\frac{\sum \text{return\_qty}}{\sum \text{quantity\_units}} \times 100$ | 1.010026% | 1.01% | **Verified** | Exact match (1.0100% exact benchmark). |
| **Orders with Returns Count** | $\text{COUNT}(\text{return\_qty} > 0)$ | 591 Orders | 591 Orders (98.50%) | **Verified** | Exact match in quick preset filter and quality audit tab. |
| **On-Time Fulfillment Count** | $\text{COUNT}(\text{on\_time\_delivery} = 1)$ | 465 Orders | 465 Orders | **Verified** | Exact match in fulfillment tracking. |
| **On-Time Delivery SLA %** | $\frac{465}{600} \times 100$ | 77.5000% | 77.50% | **Verified** | Exact match (missing 80.0% target by 2.50%). |
| **Delayed Shipments Count** | $\text{COUNT}(\text{on\_time\_delivery} = 0)$ | 135 Orders | 135 Orders | **Verified** | Exact match in quick preset filter and logistics tab. |
| **Delayed Delivery Rate %** | $\frac{135}{600} \times 100$ | 22.5000% | 22.50% | **Verified** | Exact match. |
| **Mean Transit Duration** | $\frac{1}{N}\sum \text{delivery\_days}$ | 23.4933 Days | 23.49 Days | **Verified** | Exact arithmetic mean (Std Dev: 7.97 days). |
| **Median Transit Duration** | $\text{MEDIAN}(\text{delivery\_days})$ | 23.5000 Days | 23.5 Days | **Verified** | Exact median transit days. Range: 3 to 45 days. |
| **Unique Commercial Buyers** | $\text{DISTINCTCOUNT}(\text{buyer\_id})$ | 187 Buyers | 187 Buyers | **Verified** | BUY-0001 to BUY-0187 distinct institutional accounts. |
| **Unique Sellers / Suppliers** | $\text{DISTINCTCOUNT}(\text{seller\_id})$ | 80 Sellers | 80 Sellers | **Verified** | Distinct supplier entities recorded in order logs. |
| **Repeat Buyer Orders Count** | $\text{COUNT}(\text{repeat\_buyer} = 1)$ | 227 Orders | 227 Orders | **Verified** | Verified recurring institutional procurement orders. |
| **Repeat Buyer Order Rate %** | $\frac{227}{600} \times 100$ | 37.8333% | 37.83% | **Verified** | Exact match. |
| **Return Overrun Anomalies** | $\text{WHERE } \text{return\_qty} > \text{quantity\_units}$ | 2 Orders | 2 Orders | **Verified (Audit)** | Records B2B-00131 (28>22) and B2B-00188 (48>39) isolated. |
| **Documented SKUs** | $\text{COUNT}(\text{Product\_ID})$ | 50 SKUs | 50 Items | **Verified** | Master product items P1 to P50 in catalogue. |
| **Warehouse Stock Units** | $\sum \text{Stock\_Units}$ | 13,857 Units | 13,857 Units | **Verified** | Sum of warehouse inventory stock in catalogue. |
| **Average Retail MRP** | $\text{MEAN}(\text{MRP})$ | ₹2,262.94 | ₹2,262.94 | **Verified** | Mean catalogue retail price. |
| **Average Wholesale COGS** | $\text{MEAN}(\text{COGS})$ | ₹939.08 | ₹939.08 | **Verified** | Mean catalogue wholesale production cost. |
| **Average Gross Margin %** | $\text{MEAN}\left(\frac{\text{MRP} - \text{COGS}}{\text{MRP}}\right) \times 100$ | 58.62% | 58.62% | **Verified** | Mean unit gross margin in product catalogue tab. |
| **Customer Accounts Count** | $\text{COUNT}(\text{Customer\_ID})$ | 200 Profiles | 200 Profiles | **Verified** | Retail customer profiles C1 to C200. |
| **Reported Customer Revenue** | $\sum \text{Total\_Revenue}$ | ₹4,992,621.00 | ₹49.93 L | **Verified** | Sum of lifetime revenue across customer accounts. |
| **Customer Churn Rate %** | $\frac{6}{200} \times 100$ | 3.00% | 3.00% | **Verified** | 6 churned profiles out of 200 total accounts. |
| **Customer Date Inversions** | $\text{WHERE } \text{First} > \text{Last}$ | 42 Profiles | 42 Profiles | **Verified (Audit)** | Flagged as DATE_INVERSION; tenure days set to NaN. |

---

## 3. Audit of Unsupported Metrics (Documented Dataset Limitations)

| Business Requirement | Status | Underlying Dataset Limitation | Recommended Upstream Schema Fix |
| :--- | :---: | :--- | :--- |
| **Foreign Exchange (FX) Impact** | **Not Available** | All 600 orders in `da_b2b_orders.csv` are denominated exclusively in INR. Zero foreign currency codes, spot exchange rates, or country destination tags exist. | Extend ERP schema with `currency_code`, `booking_spot_rate`, and `country_iso`. |
| **B2B Order Gross/Net Margins** | **Not Available** | Orders record selling price (`unit_price_inr`) but lack landed production costs, freight tariffs, or export duties. `da_product_catalogue.csv` lacks order-line foreign keys. | Implement relational `order_line_items` schema linking `order_id` to product SKUs with landed costs. |
| **Export Compliance Tracking** | **Not Available** | Zero regulatory attributes (Shipping Bill numbers, Port of Loading, GST Export invoicing, or inspection flags) exist in the datasets. | Deploy customs documentation tracking module capturing Port of Loading clearance milestones. |
| **Order-to-Customer Joins** | **Not Supported** | `da_customer_profiles.csv` represents retail consumers (C1–C200), whereas orders represent wholesale B2B institutional buyers (BUY-0001). | Maintain strict domain separation; do not force synthetic joins between disparate entities. |

---

## 4. Visual Evidence from Live Production Deployment

High-resolution visual evidence was captured directly from the live Vercel production dashboard ([https://tradesight-export-analytics.vercel.app](https://tradesight-export-analytics.vercel.app)) using headless browser automation at 1920x1080 resolution:

1. **Executive Overview (`01_executive_overview.png`):** Validates all 8 executive KPI cards, 24-month revenue/volume trends, category revenue bars, and payment terms breakdown.
2. **Logistics & Fulfillment (`02_logistics_fulfillment.png`):** Validates the 77.50% On-Time SLA metric, 23.49 days mean transit, transit duration histogram, and payment terms logistics table.
3. **Returns & Quality Audit (`03_returns_quality_audit.png`):** Validates the 15,242 units returned (1.01%), the isolated `B2B-00131` & `B2B-00188` overrun table, and 42 customer profile date inversions.
4. **Buyer Analytics (`04_buyer_segmentation.png`):** Validates the 187 unique buyers, 37.83% repeat buyer share, top buyers ranking, and searchable buyer directory.
5. **Data Governance (`05_data_governance_missing_kpis.png`):** Validates the transparent disclosure of unsupported metrics (*FX*, *Margins*, *Compliance*), schema boundaries, and verified scorecard.
