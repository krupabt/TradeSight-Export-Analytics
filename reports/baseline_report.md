# TradeSight Export Analytics — Executive Baseline Metrics Report

**Client:** Chennai Export Management Enterprise  
**Milestone:** Week 3 — Data Pipeline & Baseline Metrics  
**Technology Stack:** Python 3.12, pandas, PostgreSQL, SQL, Power BI, Git  
**Report Generated:** 2026-10-23 16:33:10  

---

## 1. Executive Summary

This capstone report establishes the operational baseline for our Chennai-based export management partner. Over the two-year period spanning **January 2023 to December 2024**, the enterprise logged **600 B2B export orders** representing a cumulative gross order value of **₹3,968,829,214.20 INR** (~₹3.97 Billion INR) with an Average Order Value (AOV) of **₹6,614,715.36 INR**.

Operational fulfillment highlights:
- **On-Time Delivery Performance:** **77.5000%** of orders met committed delivery windows (465 on-time vs. 135 delayed orders).
- **Mean Transit Duration:** Average delivery duration is **23.49 days** (ranging between 3 and 45 days).
- **Product Quality & Returns:** Total returned volume was **15,242 units** against **1,509,070 ordered units**, yielding a low unit return rate of **1.0100%**.
- **Repeat Buyers:** 227 orders (**37.83%**) were initiated by repeat buyers across 200 distinct buyer organizations.

---

## 2. Baseline Metrics Reference Table

The following metrics are derived exclusively from verified dataset records. No synthetic values or ungrounded assumptions have been introduced.

| Metric Name | Calculated Value | Unit | Definition | Source Column(s) |
| :--- | :--- | :--- | :--- | :--- |
| `total_orders` | **600** | Orders | Total count of recorded B2B export orders | `da_b2b_orders.order_id` |
| `total_order_value_inr` | **₹3,968,829,214.20** | INR | Sum of recorded gross order value across all orders | `da_b2b_orders.total_value_inr` |
| `average_order_value_inr` | **₹6,614,715.36** | INR | Average order value (Total Order Value / Total Orders) | `da_b2b_orders.total_value_inr` |
| `median_order_value_inr` | **₹4,817,483.05** | INR | Median order value of all recorded orders | `da_b2b_orders.total_value_inr` |
| `min_order_value_inr` | **₹28,360.80** | INR | Minimum individual order value | `da_b2b_orders.total_value_inr` |
| `max_order_value_inr` | **₹24,380,230.92** | INR | Maximum individual order value | `da_b2b_orders.total_value_inr` |
| `total_ordered_units` | **1,509,070** | Units | Sum of all product units ordered across B2B shipments | `da_b2b_orders.quantity_units` |
| `total_returned_units` | **15,242** | Units | Sum of all returned product units | `da_b2b_orders.return_qty` |
| `unit_return_rate_pct` | **1.0100%** | Percent | Proportion of ordered units returned: (Total Returned Units / Total Ordered Units) * 100 | `da_b2b_orders.return_qty, da_b2b_orders.quantity_units` |
| `orders_with_returns_count` | **591** | Orders | Count of orders experiencing at least one unit returned (return_qty > 0) | `da_b2b_orders.return_qty` |
| `order_return_rate_pct` | **98.5000%** | Percent | Proportion of orders with returns: (Orders with Returns / Total Orders) * 100 | `da_b2b_orders.return_qty, da_b2b_orders.order_id` |
| `on_time_orders_count` | **465** | Orders | Count of orders delivered on time according to contract schedule | `da_b2b_orders.on_time_delivery` |
| `on_time_delivery_rate_pct` | **77.5000%** | Percent | Proportion of on-time deliveries: (On-Time Orders / Total Orders) * 100 | `da_b2b_orders.on_time_delivery, da_b2b_orders.order_id` |
| `delayed_orders_count` | **135** | Orders | Count of orders experiencing delivery delays (on_time_delivery == 0) | `da_b2b_orders.on_time_delivery` |
| `delayed_delivery_rate_pct` | **22.5000%** | Percent | Proportion of delayed deliveries: (Delayed Orders / Total Orders) * 100 | `da_b2b_orders.on_time_delivery, da_b2b_orders.order_id` |
| `average_delivery_days` | **23.49** | Days | Mean transit duration in days from order placement to customer receipt | `da_b2b_orders.delivery_days` |
| `median_delivery_days` | **23.5** | Days | Median transit duration in days | `da_b2b_orders.delivery_days` |
| `min_delivery_days` | **3** | Days | Shortest transit duration recorded | `da_b2b_orders.delivery_days` |
| `max_delivery_days` | **45** | Days | Longest transit duration recorded | `da_b2b_orders.delivery_days` |
| `repeat_buyer_orders_count` | **227** | Orders | Count of orders placed by repeat buyers (repeat_buyer == 1) | `da_b2b_orders.repeat_buyer` |
| `repeat_buyer_rate_pct` | **37.8333%** | Percent | Proportion of orders from repeat buyers: (Repeat Orders / Total Orders) * 100 | `da_b2b_orders.repeat_buyer, da_b2b_orders.order_id` |
| `unique_buyers_count` | **187** | Buyers | Distinct count of buyer entities recorded in order logs | `da_b2b_orders.buyer_id` |
| `unique_sellers_count` | **80** | Sellers | Distinct count of seller/supplier entities recorded in order logs | `da_b2b_orders.seller_id` |
| `product_catalogue_count` | **50** | Products | Total number of product items documented in the reference catalogue | `da_product_catalogue.Product_ID` |
| `total_catalogue_stock_units` | **13,857** | Units | Total warehouse stock units across catalogue products | `da_product_catalogue.Stock_Units` |
| `average_product_mrp_inr` | **₹2,262.94** | INR | Mean Maximum Retail Price across catalogue items | `da_product_catalogue.MRP` |
| `average_product_cogs_inr` | **₹939.08** | INR | Mean Cost of Goods Sold across catalogue items | `da_product_catalogue.COGS` |
| `catalogue_gross_margin_pct` | **58.5018%** | Percent | Gross margin of catalogue: ((Average MRP - Average COGS) / Average MRP) * 100 | `da_product_catalogue.MRP, da_product_catalogue.COGS` |
| `customer_profiles_count` | **200** | Customers | Total number of customer account profiles in database | `da_customer_profiles.Customer_ID` |
| `customers_reported_revenue_inr` | **₹4,992,621.00** | INR | Sum of lifetime total revenue recorded across customer account profiles | `da_customer_profiles.Total_Revenue` |
| `customer_churn_rate_pct` | **3.0000%** | Percent | Proportion of churned customer accounts: (Churned Accounts / Total Accounts) * 100 | `da_customer_profiles.Churned, da_customer_profiles.Customer_ID` |
| `missing_values_count` | **0** | Cells | Count of null or missing cells across all 3 original CSV datasets | `All datasets` |
| `duplicate_rows_count` | **0** | Rows | Count of exact duplicate rows across all 3 original CSV datasets | `All datasets` |
| `invalid_return_records_count` | **2** | Orders | Count of orders where return_qty exceeds quantity_units (logical impossibility) | `da_b2b_orders.return_qty, da_b2b_orders.quantity_units` |
| `customer_date_inversions_count` | **42** | Customers | Customer profiles where First_Purchase_Date > Last_Purchase_Date (chronological anomaly) | `da_customer_profiles.First_Purchase_Date, da_customer_profiles.Last_Purchase_Date` |
| `order_value_calculation_discrepancies` | **0** | Orders | Orders where total_value_inr differs from (quantity_units * unit_price_inr) by > 0.05 | `da_b2b_orders.total_value_inr, da_b2b_orders.quantity_units, da_b2b_orders.unit_price_inr` |
| `disjunct_schema_flag` | **True** | Boolean | Indicates datasets have disjunct schemas and lack foreign key joins | `Cross-dataset analysis` |

---

## 3. Monthly Order & Revenue Trends (2023 – 2024)

The enterprise maintained consistent monthly ordering frequency throughout the 24-month horizon, averaging ~25 orders per month.

| Month | Orders | Total Value (INR) | AOV (INR) | Ordered Units | Returned Units | Unit Return Rate | On-Time Rate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 2023-01 | 22 | ₹141,317,422.75 | ₹6,423,519.22 | 56,588 | 488 | 0.8624% | 50.0% |
| 2023-02 | 32 | ₹191,889,750.30 | ₹5,996,554.70 | 73,610 | 955 | 1.2974% | 75.0% |
| 2023-03 | 24 | ₹143,581,492.23 | ₹5,982,562.18 | 58,380 | 742 | 1.2710% | 54.2% |
| 2023-04 | 31 | ₹211,900,517.93 | ₹6,835,500.58 | 78,616 | 666 | 0.8472% | 74.2% |
| 2023-05 | 29 | ₹172,173,549.39 | ₹5,937,018.94 | 71,825 | 866 | 1.2057% | 82.8% |
| 2023-06 | 24 | ₹181,838,930.38 | ₹7,576,622.10 | 59,670 | 588 | 0.9854% | 66.7% |
| 2023-07 | 31 | ₹214,836,773.71 | ₹6,930,218.51 | 84,151 | 917 | 1.0897% | 90.3% |
| 2023-08 | 16 | ₹95,343,721.92 | ₹5,958,982.62 | 38,290 | 429 | 1.1204% | 87.5% |
| 2023-09 | 29 | ₹240,364,123.13 | ₹8,288,418.04 | 83,721 | 718 | 0.8576% | 82.8% |
| 2023-10 | 29 | ₹211,227,747.01 | ₹7,283,715.41 | 68,620 | 652 | 0.9502% | 82.8% |
| 2023-11 | 16 | ₹102,618,044.45 | ₹6,413,627.78 | 41,284 | 464 | 1.1239% | 81.2% |
| 2023-12 | 28 | ₹187,567,544.39 | ₹6,698,840.87 | 68,741 | 697 | 1.0140% | 67.9% |
| 2024-01 | 28 | ₹191,045,451.79 | ₹6,823,051.85 | 67,152 | 778 | 1.1586% | 82.1% |
| 2024-02 | 22 | ₹108,092,659.66 | ₹4,913,302.71 | 48,857 | 515 | 1.0541% | 95.5% |
| 2024-03 | 15 | ₹99,333,532.47 | ₹6,622,235.50 | 38,288 | 292 | 0.7626% | 73.3% |
| 2024-04 | 24 | ₹180,729,792.63 | ₹7,530,408.03 | 67,650 | 632 | 0.9342% | 79.2% |
| 2024-05 | 26 | ₹155,668,006.10 | ₹5,987,231.00 | 61,152 | 676 | 1.1054% | 84.6% |
| 2024-06 | 19 | ₹120,112,960.79 | ₹6,321,734.78 | 49,711 | 497 | 0.9998% | 89.5% |
| 2024-07 | 24 | ₹160,117,681.86 | ₹6,671,570.08 | 57,091 | 699 | 1.2244% | 79.2% |
| 2024-08 | 24 | ₹116,761,064.61 | ₹4,865,044.36 | 51,237 | 487 | 0.9505% | 83.3% |
| 2024-09 | 23 | ₹142,454,812.77 | ₹6,193,687.51 | 62,541 | 559 | 0.8938% | 69.6% |
| 2024-10 | 24 | ₹198,456,084.47 | ₹8,269,003.52 | 67,736 | 581 | 0.8577% | 83.3% |
| 2024-11 | 29 | ₹223,216,116.82 | ₹7,697,107.48 | 80,926 | 565 | 0.6982% | 75.9% |
| 2024-12 | 31 | ₹178,181,432.64 | ₹5,747,788.15 | 73,233 | 779 | 1.0637% | 71.0% |

---

## 4. Product Category & Payment Terms Breakdown

### B2B Orders by Category

| Category | Orders | Total Value (INR) | AOV (INR) | Ordered Units | Returned Units | On-Time Rate | Avg Transit Days |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **IT Hardware** | 66 | ₹510,430,591.87 | ₹7,733,796.85 | 186,691 | 1,792 | 74.2% | 22.5 days |
| **Industrial Machinery** | 63 | ₹464,181,408.54 | ₹7,367,958.87 | 157,247 | 1,607 | 71.4% | 23.8 days |
| **Packaging** | 74 | ₹459,045,706.68 | ₹6,203,320.36 | 193,727 | 1,899 | 75.7% | 24.1 days |
| **Food Ingredients** | 67 | ₹415,939,547.42 | ₹6,208,052.95 | 169,053 | 1,506 | 80.6% | 23.7 days |
| **Electronic Components** | 64 | ₹413,510,060.89 | ₹6,461,094.70 | 158,046 | 1,726 | 71.9% | 25.3 days |
| **Office Supplies** | 55 | ₹405,099,703.62 | ₹7,365,449.16 | 130,994 | 1,396 | 80.0% | 21.0 days |
| **Pharmaceuticals** | 52 | ₹390,349,720.51 | ₹7,506,725.39 | 131,923 | 1,371 | 78.8% | 21.7 days |
| **Chemicals** | 57 | ₹342,763,348.14 | ₹6,013,392.07 | 131,246 | 1,451 | 86.0% | 21.1 days |
| **Textiles** | 49 | ₹286,645,201.55 | ₹5,849,902.07 | 130,975 | 1,280 | 85.7% | 26.1 days |
| **Raw Materials** | 53 | ₹280,863,924.98 | ₹5,299,319.34 | 119,168 | 1,214 | 73.6% | 25.6 days |

### Orders by Payment Terms

| Payment Terms | Orders | Share | Total Value (INR) | On-Time Rate | Delayed Orders | Avg Transit Days |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Advance** | 141 | 23.5% | ₹867,233,080.44 | 75.2% | 35 | 24.4 days |
| **30 Days Net** | 126 | 21.0% | ₹817,587,191.96 | 76.2% | 30 | 23.3 days |
| **COD** | 113 | 18.8% | ₹701,150,573.43 | 77.9% | 25 | 23.2 days |
| **LC** | 112 | 18.7% | ₹836,834,584.55 | 77.7% | 25 | 23.2 days |
| **60 Days Net** | 108 | 18.0% | ₹746,023,783.82 | 81.5% | 20 | 23.1 days |

---

## 5. Data Quality, Anomaly Detection & Cross-Dataset Relationship Findings

As a Senior Data Analyst and Governance Lead, strict adherence to evidence-based reporting requires highlighting key anomalies and schema limitations discovered in the datasets.

### Anomaly 1: Return Quantity Exceeding Ordered Volume (Logical Anomaly)
Exactly **2 records** in `da_b2b_orders.csv` contain a return quantity strictly greater than the quantity ordered. An entity cannot return more units than originally fulfilled.

| Order ID | Buyer ID | Seller ID | Category | Ordered Units | Returned Units | Discrepancy Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `B2B-00131` | `BUY-0095` | `SEL-0014` | Office Supplies | **22** | **28** | Excess return of +6 units |
| `B2B-00188` | `BUY-0151` | `SEL-0049` | IT Hardware | **39** | **48** | Excess return of +9 units |

> **Pipeline Handling:** These records have been preserved intact in `data_processed/da_b2b_orders_cleaned.csv` with `is_valid_return=False` and `data_quality_flag='SUSPICIOUS_RETURN_EXCEEDS_ORDERED'`, avoiding silent data deletion.

### Anomaly 2: Customer Profile Date Inversions (Chronological Anomaly)
In `da_customer_profiles.csv`, exactly **42 of 200 customer profiles** (21.0%) feature a `First_Purchase_Date` that postdates `Last_Purchase_Date`.
- Example: Customer `C10` records `First_Purchase_Date = 2025-12-26` but `Last_Purchase_Date = 2025-10-20`.
- **Pipeline Handling:** These profiles are flagged with `is_chronologically_valid=False` and `data_quality_flag='INVALID_FIRST_PURCHASE_AFTER_LAST_PURCHASE'`, and tenure calculation is guarded to prevent negative customer lifespans.

### Anomaly 3: Cross-Dataset Disjunction (Lack of Relational Foreign Keys)
Our investigation into cross-dataset joinability uncovered critical schema barriers:
1. **Disjoint Identifiers:** `da_b2b_orders.buyer_id` (`BUY-0001` through `BUY-0200`) does not match `da_customer_profiles.Customer_ID` (`C1` through `C200`).
2. **Missing Product Key:** `da_b2b_orders` contains no `Product_ID` foreign key column.
3. **Disjoint Categories:** Order categories comprise B2B raw inputs (`Chemicals`, `Textiles`, `Industrial Machinery`, etc.), whereas the product catalogue contains retail consumer goods (`Beauty`, `Grocery`, `Apparel`, etc.) with zero overlapping categories.
4. **Temporal & Scale Incompatibility:** Orders span wholesale amounts (₹3.97B across 2023–2024), whereas customer profiles reflect retail spend (₹4.99M across 2024–2026).

> [!WARNING]
> **Analytical Integrity Decision:** Relational joins between `orders`, `products`, and `customer profiles` have **not** been synthesized. Creating synthetic joins between unrelated entities would generate misleading corporate insights.

---

## 6. Business Requirements vs. Available Dataset Scope

The client requested analytics on Foreign Exchange Impact, Client Profitability, and Compliance Exceptions. Here is an honest audit of what the data supports:

| Business Requirement | Feasibility in Current Data | Evidence & Missing Data Audit |
| :--- | :--- | :--- |
| **Order & Shipment Performance** | **Fully Supported** | `order_date`, `delivery_days`, `on_time_delivery`, and order values are complete. |
| **Delivery Delays & Returns** | **Fully Supported** | On-time delivery flags and return quantities are present. Two return overruns flagged. |
| **Customer Performance** | **Partially Supported (Isolated)** | Customer profiles can be analyzed for acquisition channel and churn, but cannot join to orders. |
| **Product Performance** | **Partially Supported (Isolated)** | Catalogue items can be evaluated for MRP/COGS margin and stock turnover, but cannot join to orders. |
| **Foreign Exchange (FX) Impact** | **Unsupported** | All amounts are denominated strictly in `total_value_inr`. No foreign currencies (USD, EUR) or exchange rate benchmarks exist. |
| **Client Net Profitability** | **Unsupported** | Orders record gross revenue (`total_value_inr`), but lack shipping costs, duties, carrier surcharges, and order-level COGS. |
| **Compliance Exception Audit** | **Operational Exceptions Only** | Available data reflects delivery delays and data anomalies, not legal customs filings or regulatory infractions. |

---

## 7. Strategic Recommendations for Week 4

1. **ERP / Warehouse Integration:** Remediate the warehouse return intake process to prevent return receipts from exceeding original dispatch manifests (orders `B2B-00131` and `B2B-00188`).
2. **CRM System Timestamp Audit:** Re-sync customer onboarding timestamps to ensure initial registration pre-dates transaction history.
3. **Data Model Normalization:** Work with the engineering team to introduce a standardized `product_id` foreign key and unified `client_id` entity model across all export pipelines.
4. **Currency & FX Tracking:** Ingest daily RBI exchange rates (USD/INR, EUR/INR) and capture invoice billing currency to enable foreign exchange hedging analytics.

---
*Report prepared for Cynaris Internship Evaluation — TradeSight Export Analytics.*