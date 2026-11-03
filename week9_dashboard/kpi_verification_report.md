# TradeSight Export Analytics — Comprehensive KPI Verification Report

**Project:** TradeSight Export Analytics  
**Milestone:** Cynaris Data Analyst Internship — Week 9 Capstone  
**Target Application:** Enterprise React + Vite Dashboard  
**Live Production URL:** [https://tradesight-export-analytics.vercel.app](https://tradesight-export-analytics.vercel.app)  
**Audit Date:** 2026-11-03  
**Lead Analyst:** Krupa B T  
**Source Datasets Inspected:**
1. `data/da_b2b_orders.csv` (600 rows, 13 columns)
2. `data/da_product_catalogue.csv` (50 rows, 7 columns)
3. `data/da_customer_profiles.csv` (200 rows, 7 columns)

---

## 1. Executive Audit Summary

Every metric presented in the TradeSight Export Analytics live dashboard was audited against the three original CSV files. Calculations were executed via Python (pandas 3.1.0) and compared against the values rendered in the production React frontend.

* **Total Metrics Audited:** 24 quantitative metrics + 4 data quality integrity checks + 4 unsupported metric indicators.
* **Calculation Accuracy:** **100%** (zero discrepancies between python raw data aggregations and dashboard live values).
* **Synthetic Data / Joins:** **0** (strictly zero fabricated records, simulated exchange rates, or unverified foreign keys).
* **Live Dashboard Status:** Verified operating over HTTPS on Vercel at [https://tradesight-export-analytics.vercel.app](https://tradesight-export-analytics.vercel.app).

---

## 2. Comprehensive KPI Verification Matrix

### 2.1 B2B Orders Domain (`data/da_b2b_orders.csv`)

| KPI Name | Source Column(s) | Mathematical Formula | Calculated Value (Python / Raw Data) | Dashboard Value (Live Web UI) | Verification Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Total Export Revenue** | `total_value_inr` | $\sum \text{total\_value\_inr}$ | ₹3,968,829,214.20 | ₹396.88 Cr (₹3,968,829,214.20) | **VERIFIED (100%)** |
| **Total Orders** | `order_id` | $\text{COUNT}(\text{order\_id})$ | 600 Orders | 600 Orders | **VERIFIED (100%)** |
| **Average Order Value (AOV)** | `total_value_inr`, `order_id` | $\frac{\text{Total Revenue}}{\text{Total Orders}}$ | ₹6,614,715.36 | ₹66.15 L | **VERIFIED (100%)** |
| **Median Order Value** | `total_value_inr` | $\text{MEDIAN}(\text{total\_value\_inr})$ | ₹4,817,483.05 | ₹48.17 L | **VERIFIED (100%)** |
| **Minimum Order Value** | `total_value_inr` | $\min(\text{total\_value\_inr})$ | ₹28,360.80 | ₹28,360.80 | **VERIFIED (100%)** |
| **Maximum Order Value** | `total_value_inr` | $\max(\text{total\_value\_inr})$ | ₹24,380,230.92 | ₹2.44 Cr | **VERIFIED (100%)** |
| **Total Shipped Units** | `quantity_units` | $\sum \text{quantity\_units}$ | 1,509,070 Units | 1,509,070 Units | **VERIFIED (100%)** |
| **Total Returned Units** | `return_qty` | $\sum \text{return\_qty}$ | 15,242 Units | 15,242 Units | **VERIFIED (100%)** |
| **Unit Return Rate** | `return_qty`, `quantity_units` | $\frac{\sum \text{return\_qty}}{\sum \text{quantity\_units}} \times 100$ | 1.010026% | 1.01% (1.0100% exact) | **VERIFIED (100%)** |
| **Orders with Returns** | `return_qty` | $\text{COUNT}(\text{return\_qty} > 0)$ | 591 Orders | 591 Orders (98.50%) | **VERIFIED (100%)** |
| **On-Time Deliveries Count** | `on_time_delivery` | $\text{COUNT}(\text{on\_time\_delivery} = 1)$ | 465 Orders | 465 Orders | **VERIFIED (100%)** |
| **On-Time Delivery SLA %** | `on_time_delivery` | $\frac{465}{600} \times 100$ | 77.5000% | 77.50% | **VERIFIED (100%)** |
| **Delayed Shipments Count** | `on_time_delivery` | $\text{COUNT}(\text{on\_time\_delivery} = 0)$ | 135 Orders | 135 Orders | **VERIFIED (100%)** |
| **Delayed Delivery Rate %** | `on_time_delivery` | $\frac{135}{600} \times 100$ | 22.5000% | 22.50% | **VERIFIED (100%)** |
| **Mean Transit Duration** | `delivery_days` | $\frac{1}{N}\sum \text{delivery\_days}$ | 23.4933 Days | 23.49 Days | **VERIFIED (100%)** |
| **Median Transit Duration** | `delivery_days` | $\text{MEDIAN}(\text{delivery\_days})$ | 23.5000 Days | 23.5 Days | **VERIFIED (100%)** |
| **Transit Duration Range** | `delivery_days` | $[\min, \max]$ | [3, 45] Days | 3 to 45 Days | **VERIFIED (100%)** |
| **Unique Commercial Buyers** | `buyer_id` | $\text{DISTINCTCOUNT}(\text{buyer\_id})$ | 187 Buyers | 187 Buyers | **VERIFIED (100%)** |
| **Unique Sellers / Suppliers** | `seller_id` | $\text{DISTINCTCOUNT}(\text{seller\_id})$ | 80 Sellers | 80 Sellers | **VERIFIED (100%)** |
| **Repeat Buyer Orders** | `repeat_buyer` | $\text{COUNT}(\text{repeat\_buyer} = 1)$ | 227 Orders | 227 Orders | **VERIFIED (100%)** |
| **Repeat Buyer Order Rate** | `repeat_buyer` | $\frac{227}{600} \times 100$ | 37.8333% | 37.83% | **VERIFIED (100%)** |
| **Return Overrun Anomalies** | `return_qty`, `quantity_units` | $\text{WHERE } \text{return\_qty} > \text{quantity\_units}$ | 2 Records | 2 Records (B2B-00131/188) | **FLAGGED & PRESERVED** |

---

### 2.2 Product Catalogue Domain (`data/da_product_catalogue.csv`)

| KPI Name | Source Column(s) | Mathematical Formula | Calculated Value (Python / Raw Data) | Dashboard Value (Live Web UI) | Verification Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Documented SKUs** | `Product_ID` | $\text{COUNT}(\text{Product\_ID})$ | 50 SKUs | 50 Items | **VERIFIED (100%)** |
| **Warehouse Stock Units** | `Stock_Units` | $\sum \text{Stock\_Units}$ | 13,857 Units | 13,857 Units | **VERIFIED (100%)** |
| **Average MRP** | `MRP` | $\text{MEAN}(\text{MRP})$ | ₹2,262.94 | ₹2,262.94 | **VERIFIED (100%)** |
| **Average COGS** | `COGS` | $\text{MEAN}(\text{COGS})$ | ₹939.08 | ₹939.08 | **VERIFIED (100%)** |
| **Mean Product Margin %** | `MRP`, `COGS` | $\text{MEAN}\left(\frac{\text{MRP} - \text{COGS}}{\text{MRP}}\right) \times 100$ | 58.62% | 58.62% | **VERIFIED (100%)** |
| **Aggregate Catalogue Margin %** | `MRP`, `COGS` | $\frac{\sum \text{MRP} - \sum \text{COGS}}{\sum \text{MRP}} \times 100$ | 58.50% | 58.50% | **VERIFIED (100%)** |

---

### 2.3 Customer Profiles Domain (`data/da_customer_profiles.csv`)

| KPI Name | Source Column(s) | Mathematical Formula | Calculated Value (Python / Raw Data) | Dashboard Value (Live Web UI) | Verification Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Customer Accounts Count** | `Customer_ID` | $\text{COUNT}(\text{Customer\_ID})$ | 200 Profiles | 200 Profiles | **VERIFIED (100%)** |
| **Reported Customer Revenue** | `Total_Revenue` | $\sum \text{Total\_Revenue}$ | ₹4,992,621.00 | ₹49.93 L | **VERIFIED (100%)** |
| **Average Customer Revenue** | `Total_Revenue` | $\text{MEAN}(\text{Total\_Revenue})$ | ₹24,963.11 | ₹24,963.11 | **VERIFIED (100%)** |
| **Customer Churn Rate %** | `Churned` | $\frac{\text{COUNT}(\text{Churned} = 1)}{\text{COUNT}(\text{Customer\_ID})} \times 100$ | 3.00% (6/200) | 3.00% | **VERIFIED (100%)** |
| **Chronological Date Inversions** | `First_Purchase_Date`, `Last_Purchase_Date` | $\text{WHERE } \text{First} > \text{Last}$ | 42 Profiles | 42 Profiles | **FLAGGED & PRESERVED** |

---

## 3. Audit of Unsupported Metrics (Separated & Labeled "Not Available")

In accordance with strict data integrity standards, the following business metrics cannot be calculated from the source datasets. The live dashboard explicitly flags each as **`NOT AVAILABLE`** with transparent engineering justifications:

```
┌───────────────────────────────────────┬───────────────┬─────────────────────────────────────────────────────────────┐
│ Business Requirement                  │ Status        │ Underlying Dataset Limitation                               │
├───────────────────────────────────────┼───────────────┼─────────────────────────────────────────────────────────────┤
│ 1. Foreign Exchange (FX) Gain/Loss    │ NOT AVAILABLE │ da_b2b_orders.csv transactions are purely in INR.           │
│                                       │               │ Zero foreign currency codes, spot rates, or country tags.   │
├───────────────────────────────────────┼───────────────┼─────────────────────────────────────────────────────────────┤
│ 2. B2B Order Gross & Net Margins      │ NOT AVAILABLE │ Orders dataset records selling price but lacks COGS.        │
│                                       │               │ da_product_catalogue.csv lacks order-line foreign keys.     │
├───────────────────────────────────────┼───────────────┼─────────────────────────────────────────────────────────────┤
│ 3. Customs / Export Compliance Logs   │ NOT AVAILABLE │ No Shipping Bill IDs, Port of Loading, HS codes,            │
│                                       │               │ or customs clearance inspection timestamps exist.           │
├───────────────────────────────────────┼───────────────┼─────────────────────────────────────────────────────────────┤
│ 4. Order-to-Customer Joins            │ NOT SUPPORTED │ da_customer_profiles represents retail consumers (C1-C200), │
│                                       │               │ while orders represent B2B wholesale buyers (BUY-0001).     │
└───────────────────────────────────────┴───────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 4. Physical Anomaly Records Audit

1. **`B2B-00131`**: Shipped Quantity = 22 units, Reported Returned Quantity = 28 units.
2. **`B2B-00188`**: Shipped Quantity = 39 units, Reported Returned Quantity = 48 units.

*Action Taken:* Both records are preserved intact to maintain compliance audit trails. They are displayed in the dashboard's dedicated **Returns & Exception Audit** view with badge `SUSPICIOUS_RETURN_OVERRUN`.

---

## 5. Peer Review & Feedback Protocol Alignment

* **Peer Feedback Log Status:** Initialized and formatted in [`week9_dashboard/peer_feedback_log.md`](file:///d:/TradeSight-Export-Analytics/week9_dashboard/peer_feedback_log.md).
* **Current Review Status:** **Awaiting Actual Peer Feedback Entry**. In accordance with guidelines, no peer feedback is simulated or marked complete until actual reviewer evaluation is provided by the user.
* **Revision List:** Maintained in [`week9_dashboard/revision_list.md`](file:///d:/TradeSight-Export-Analytics/week9_dashboard/revision_list.md) with prioritized issues (REV-001 through REV-010).
