# TradeSight Export Analytics – DAX Measures Dictionary

This document details the production DAX measures implemented in the Microsoft Power BI data model for TradeSight Export Analytics.

---

## 1. Executive Revenue & Order Measures

| Measure Name | DAX Expression | Format | Verified Baseline Value | Business Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| **Total Export Revenue** | `SUM(Fact_Orders[total_value_inr])` | Currency (`₹#,##0.00`) | ₹3,968,829,214.20 (~₹396.88 Cr) | Gross realized export sales across 600 B2B commercial shipments. |
| **Total Revenue (Cr)** | `DIVIDE([Total Export Revenue], 10000000, 0)` | Decimal (`0.00 "Cr"`) | **396.88 Cr** | Executive reporting representation in Indian Crores. |
| **Total Orders** | `COUNTROWS(Fact_Orders)` | Whole Number (`#,##0`) | **600** | Total commercial export orders processed between Jan 2023 and Dec 2024. |
| **Average Order Value (AOV)** | `DIVIDE([Total Export Revenue], [Total Orders], 0)` | Currency (`₹#,##0`) | **₹6,614,715.36** | Average monetary gross value per export order manifest. |
| **AOV (Lakhs)** | `DIVIDE([Average Order Value (AOV)], 100000, 0)` | Decimal (`0.00 "L"`) | **66.15 L** | Executive scale representation in Indian Lakhs. |
| **Total Units Shipped** | `SUM(Fact_Orders[quantity_units])` | Whole Number (`#,##0`) | **1,509,070** | Total physical export volume dispatched across 10 categories. |
| **High-Value Orders Count** | `CALCULATE(COUNTROWS(Fact_Orders), Fact_Orders[total_value_inr] >= 10000000)` | Whole Number | **153 Orders** | Orders exceeding ₹1.00 Crore in invoice value. |
| **High-Value Revenue %** | `DIVIDE(CALCULATE([Total Export Revenue], Fact_Orders[total_value_inr] >= 10000000), [Total Export Revenue], 0) * 100` | Percentage (`0.0%`) | **48.2%** | Proportion of export earnings driven by ₹1+ Crore transactions. |

---

## 2. Logistics & Delivery Performance Measures

| Measure Name | DAX Expression | Format | Verified Baseline Value | Business Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| **On-Time Deliveries** | `CALCULATE(COUNTROWS(Fact_Orders), Fact_Orders[on_time_delivery] = 1)` | Whole Number | **465** | Shipments reaching port/client within committed delivery window. |
| **On-Time Delivery %** | `DIVIDE([On-Time Deliveries], [Total Orders], 0) * 100` | Percentage (`0.00%`) | **77.50%** | On-time delivery service level agreement rate (465 / 600). |
| **Delayed Shipments** | `CALCULATE(COUNTROWS(Fact_Orders), Fact_Orders[on_time_delivery] = 0)` | Whole Number | **135** | Shipments exceeding standard transit timeline. |
| **Delayed Shipment %** | `DIVIDE([Delayed Shipments], [Total Orders], 0) * 100` | Percentage (`0.00%`) | **22.50%** | Operational failure rate requiring logistics intervention. |
| **Average Transit Days** | `AVERAGE(Fact_Orders[delivery_days])` | Decimal (`0.0 "Days"`) | **23.5 Days** (23.49) | Arithmetic mean transit duration across all routes. |
| **Median Transit Days** | `MEDIAN(Fact_Orders[delivery_days])` | Decimal (`0.0 "Days"`) | **23.5 Days** | 50th percentile delivery duration. |
| **SLA Compliance Rate %** | `DIVIDE(CALCULATE(COUNTROWS(Fact_Orders), Fact_Orders[delivery_days] <= 20), [Total Orders], 0) * 100` | Percentage (`0.00%`) | **45.83%** | Orders fulfilled within strict 20-day transit threshold. |

---

## 3. Product Returns & Compliance Exception Measures

| Measure Name | DAX Expression | Format | Verified Baseline Value | Business Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| **Total Units Returned** | `SUM(Fact_Orders[return_qty])` | Whole Number (`#,##0`) | **15,242** | Physical commodity units received back across all categories. |
| **Unit Return Rate %** | `DIVIDE([Total Units Returned], [Total Units Shipped], 0) * 100` | Percentage (`0.00%`) | **1.01%** | Physical rejection rate (15,242 / 1,509,070). |
| **Orders with Returns** | `CALCULATE(COUNTROWS(Fact_Orders), Fact_Orders[return_qty] > 0)` | Whole Number | **148** | Transactions with at least one defective/returned unit. |
| **Order Return Rate %** | `DIVIDE([Orders with Returns], [Total Orders], 0) * 100` | Percentage (`0.00%`) | **24.67%** | Incidence of orders affected by return events (148 / 600). |
| **Invalid Return Records** | `CALCULATE(COUNTROWS(Fact_Orders), Fact_Orders[return_qty] > Fact_Orders[quantity_units])` | Whole Number | **2 Records** | Critical data governance anomalies (`ORD_000102`, `ORD_000412`). |

---

## 4. Client & Buyer Analytics Measures

| Measure Name | DAX Expression | Format | Verified Baseline Value | Business Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| **Unique Active Buyers** | `DISTINCTCOUNT(Fact_Orders[buyer_id])` | Whole Number | **187** | Commercial buyer entities transacting in export dataset. |
| **Repeat Buyer Orders** | `CALCULATE(COUNTROWS(Fact_Orders), Fact_Orders[repeat_buyer] = 1)` | Whole Number | **227** | Orders placed by accounts with prior purchase history. |
| **Repeat Buyer Order Rate %** | `DIVIDE([Repeat Buyer Orders], [Total Orders], 0) * 100` | Percentage (`0.00%`) | **37.83%** | Repeat customer purchasing proportion (227 / 600). |
| **Total Customer Profiles** | `COUNTROWS(Dim_Customers)` | Whole Number | **200** | Master account profiles in `da_customer_profiles.csv`. |
| **Customer Churn Rate %** | `DIVIDE(CALCULATE(COUNTROWS(Dim_Customers), Dim_Customers[Churned] = 1), [Total Customer Profiles], 0) * 100` | Percentage (`0.00%`) | **34.00%** | Percentage of inactive/churned customer accounts (68 / 200). |

---

## 5. Product & Catalogue Margin Measures

| Measure Name | DAX Expression | Format | Verified Baseline Value | Business Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| **Total Catalogue SKUs** | `COUNTROWS(Dim_Products)` | Whole Number | **50** | Distinct commodity items in `da_product_catalogue.csv`. |
| **Average Product MRP** | `AVERAGE(Dim_Products[MRP])` | Currency (`₹#,##0.00`) | **₹2,262.94** | Unweighted average retail list price. |
| **Average Product COGS** | `AVERAGE(Dim_Products[COGS])` | Currency (`₹#,##0.00`) | **₹939.08** | Unweighted average cost of goods sold. |
| **Catalogue Gross Margin %** | `DIVIDE([Average Product MRP] - [Average Product COGS], [Average Product MRP], 0) * 100` | Percentage (`0.00%`) | **58.62%** | Catalogue mark-up margin (indicative retail, unlinked to order SKU). |
| **Total Warehouse Stock** | `SUM(Dim_Products[Stock_Units])` | Whole Number (`#,##0`) | **13,857** | Available warehouse physical inventory. |
| **Total Stock Value (COGS)** | `SUM(Dim_Products[Total_Inventory_Value_COGS])` | Currency (`₹#,##0`) | **₹13,012,850** | Balance sheet inventory value at cost. |

---

## 6. FX Sensitivity Measures

| Measure Name | DAX Expression | Format | Business Interpretation |
| :--- | :--- | :--- | :--- |
| **Selected FX Shock %** | `SELECTEDVALUE(FX_Parameter[Shock_Pct], 0.0)` | Percentage (`0.0%`) | User-selected rate fluctuation (+5%, -5%, etc.). |
| **Simulated Revenue (Cr)** | `DIVIDE([Total Export Revenue] * (1 + ([Selected FX Shock %] / 100)), 10000000, 0)` | Decimal (`0.00 "Cr"`) | Adjusted portfolio value under exchange rate shift. |
| **Estimated FX Gain/Loss (Cr)** | `[Simulated Revenue (Cr)] - [Total Revenue (Cr)]` | Decimal (`+0.00 / -0.00 "Cr"`) | Net portfolio gain or loss in Indian Crores. |
