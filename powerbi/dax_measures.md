# TradeSight Export Analytics — DAX Measures Library

This document contains production-grade DAX measures designed for the TradeSight Power BI report.  
All measures are organized into functional measure folders within a dedicated disconnected table `_Measures`.

---

## 1. Table Creation: Dedicated Measures Table

Create a blank table in Power BI to house all calculations:

```dax
_Measures = 
ROW("Description", "TradeSight Dedicated Central Measures Table")
```

---

## 2. Orders & Commercial Revenue Measures

### Total Orders
```dax
Total Orders = 
COUNTROWS('da_b2b_orders_cleaned')
```
*Format: Whole Number (`#,##0`)*

### Total Revenue (INR)
```dax
Total Revenue INR = 
SUM('da_b2b_orders_cleaned'[total_value_inr])
```
*Format: Currency (`₹#,##0.00`)*

### Total Revenue Formatted (Cr / L)
```dax
Total Revenue Formatted = 
VAR _Rev = [Total Revenue INR]
RETURN
    IF(
        _Rev >= 10000000,
        "₹" & FORMAT(_Rev / 10000000, "0.00") & " Cr",
        "₹" & FORMAT(_Rev / 100000, "0.00") & " L"
    )
```
*Format: Text (For Headline KPI Cards)*

### Average Order Value (AOV)
```dax
Average Order Value = 
DIVIDE(
    [Total Revenue INR],
    [Total Orders],
    0
)
```
*Format: Currency (`₹#,##0.00`)*

### Median Order Value
```dax
Median Order Value = 
MEDIAN('da_b2b_orders_cleaned'[total_value_inr])
```
*Format: Currency (`₹#,##0.00`)*

### Total Ordered Units
```dax
Total Ordered Units = 
SUM('da_b2b_orders_cleaned'[quantity_units])
```
*Format: Whole Number (`#,##0`)*

---

## 3. Shipment, Lead Time & Logistics Measures

### On-Time Orders Count
```dax
On-Time Orders = 
CALCULATE(
    COUNTROWS('da_b2b_orders_cleaned'),
    'da_b2b_orders_cleaned'[on_time_delivery] = 1
)
```
*Format: Whole Number (`#,##0`)*

### Delayed Orders Count
```dax
Delayed Orders = 
CALCULATE(
    COUNTROWS('da_b2b_orders_cleaned'),
    'da_b2b_orders_cleaned'[on_time_delivery] = 0
)
```
*Format: Whole Number (`#,##0`)*

### On-Time Delivery Rate %
```dax
On-Time Delivery Rate % = 
DIVIDE(
    [On-Time Orders],
    [Total Orders],
    0
)
```
*Format: Percentage (`0.00%`)*

### Delayed Delivery Rate %
```dax
Delayed Delivery Rate % = 
DIVIDE(
    [Delayed Orders],
    [Total Orders],
    0
)
```
*Format: Percentage (`0.00%`)*

### Average Delivery Days
```dax
Average Delivery Days = 
AVERAGE('da_b2b_orders_cleaned'[delivery_days])
```
*Format: Decimal (`0.00` Days)*

### Median Delivery Days
```dax
Median Delivery Days = 
MEDIAN('da_b2b_orders_cleaned'[delivery_days])
```
*Format: Decimal (`0.0` Days)*

---

## 4. Product Quality, Returns & Anomaly Measures

### Total Returned Units
```dax
Total Returned Units = 
SUM('da_b2b_orders_cleaned'[return_qty])
```
*Format: Whole Number (`#,##0`)*

### Unit Return Rate %
```dax
// Denominator: Total Ordered Units
Unit Return Rate % = 
DIVIDE(
    [Total Returned Units],
    [Total Ordered Units],
    0
)
```
*Format: Percentage (`0.0000%`)*

### Orders with Returns Count
```dax
Orders with Returns Count = 
CALCULATE(
    COUNTROWS('da_b2b_orders_cleaned'),
    'da_b2b_orders_cleaned'[return_qty] > 0
)
```
*Format: Whole Number (`#,##0`)*

### Order Return Rate %
```dax
// Denominator: Total Orders
Order Return Rate % = 
DIVIDE(
    [Orders with Returns Count],
    [Total Orders],
    0
)
```
*Format: Percentage (`0.00%`)*

### Return Overrun Anomalies Count
```dax
// Audits orders where return_qty strictly exceeds quantity_units
Return Overrun Anomalies Count = 
CALCULATE(
    COUNTROWS('da_b2b_orders_cleaned'),
    'da_b2b_orders_cleaned'[is_valid_return] = FALSE
)
```
*Format: Whole Number (`#,##0`)*

---

## 5. Buyer Loyalty & Credit Risk Measures

### Repeat Buyer Orders Count
```dax
Repeat Buyer Orders = 
CALCULATE(
    COUNTROWS('da_b2b_orders_cleaned'),
    'da_b2b_orders_cleaned'[repeat_buyer] = 1
)
```
*Format: Whole Number (`#,##0`)*

### Repeat Buyer Rate %
```dax
Repeat Buyer Rate % = 
DIVIDE(
    [Repeat Buyer Orders],
    [Total Orders],
    0
)
```
*Format: Percentage (`0.00%`)*

### Delayed Revenue on 60 Days Net (Working Capital At Risk)
```dax
Delayed Revenue 60D Net = 
CALCULATE(
    [Total Revenue INR],
    'da_b2b_orders_cleaned'[payment_terms] = "60 Days Net",
    'da_b2b_orders_cleaned'[on_time_delivery] = 0
)
```
*Format: Currency (`₹#,##0.00`)*

---

## 6. Time Intelligence Measures (Requiring `DimDate`)

### Revenue Prior Month (PM)
```dax
Revenue PM = 
CALCULATE(
    [Total Revenue INR],
    PREVIOUSMONTH('DimDate'[Date])
)
```
*Format: Currency (`₹#,##0.00`)*

### Revenue MoM Growth %
```dax
Revenue MoM Growth % = 
VAR _Current = [Total Revenue INR]
VAR _Prior = [Revenue PM]
RETURN
    IF(
        NOT ISBLANK(_Prior),
        DIVIDE(_Current - _Prior, _Prior, 0),
        BLANK()
    )
```
*Format: Percentage (`0.00%`)*

### Orders Prior Month (PM)
```dax
Orders PM = 
CALCULATE(
    [Total Orders],
    PREVIOUSMONTH('DimDate'[Date])
)
```
*Format: Whole Number (`#,##0`)*

### Orders MoM Growth %
```dax
Orders MoM Growth % = 
VAR _Current = [Total Orders]
VAR _Prior = [Orders PM]
RETURN
    IF(
        NOT ISBLANK(_Prior),
        DIVIDE(_Current - _Prior, _Prior, 0),
        BLANK()
    )
```
*Format: Percentage (`0.00%`)*

---

## 7. Standalone Master Catalogue & Customer Measures

### Total Catalogue Inventory Value (MRP)
```dax
Total Inventory Value MRP = 
SUM('da_product_catalogue_cleaned'[inventory_value_mrp_inr])
```
*Format: Currency (`₹#,##0.00`)*

### Average Catalogue Margin %
```dax
Average Catalogue Margin % = 
AVERAGE('da_product_catalogue_cleaned'[gross_margin_pct])
```
*Format: Percentage (`0.00%`)*

### Customer Profiles Count
```dax
Customer Profiles Count = 
COUNTROWS('da_customer_profiles_cleaned')
```
*Format: Whole Number (`#,##0`)*

### Customer Churn Rate %
```dax
Customer Churn Rate % = 
DIVIDE(
    CALCULATE(COUNTROWS('da_customer_profiles_cleaned'), 'da_customer_profiles_cleaned'[Churned] = 1),
    [Customer Profiles Count],
    0
)
```
*Format: Percentage (`0.00%`)*

---

## 8. Unsupported Measures (Explicitly Documented as Unavailable)

The following measures were requested by enterprise stakeholders but **cannot be implemented** due to missing fields in the raw data files:

1. `[Foreign Exchange Hedging Gain/Loss]`  
   *Reason:* All transactions are recorded exclusively in `total_value_inr`. No invoice currency, spot exchange rate, or forward contract reference exists.
2. `[Client Net Profit]` & `[Net Margin %]`  
   *Reason:* `da_b2b_orders` contains gross revenue but lacks freight forwarding costs, insurance premiums, customs duties, port handling charges, or order-level supplier procurement costs.
3. `[Customs Compliance Clearance SLA]`  
   *Reason:* No customs filing dates, shipping bill numbers, bill of entry records, or regulatory audit status columns exist in the provided datasets.
