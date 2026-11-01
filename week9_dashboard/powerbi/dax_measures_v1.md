# TradeSight Export Analytics — Verified DAX Measures (V1)

**Milestone:** Cynaris Data Analyst Internship — Week 9 Capstone  
**Target Table:** `_Measures` in Power BI Desktop  
**Data Sources Referenced:** `da_b2b_orders_cleaned`, `buyer_rfm_segments`, `DimDate`  

---

## 1. Commercial Performance Measures

### Total Revenue INR
```dax
Total Revenue INR = 
SUM('da_b2b_orders_cleaned'[total_value_inr])
```

### Total Orders
```dax
Total Orders = 
COUNTROWS('da_b2b_orders_cleaned')
```

### Total Quantity Units
```dax
Total Quantity Units = 
SUM('da_b2b_orders_cleaned'[quantity_units])
```

### Average Order Value (AOV)
```dax
Average Order Value = 
DIVIDE([Total Revenue INR], [Total Orders], 0)
```

### Median Order Value
```dax
Median Order Value = 
MEDIAN('da_b2b_orders_cleaned'[total_value_inr])
```

### Total Revenue Formatted (Crores)
```dax
Total Revenue Formatted = 
VAR _Rev = [Total Revenue INR]
RETURN
    IF(
        _Rev >= 10000000,
        "₹" & FORMAT(_Rev / 10000000, "#,##0.00") & " Cr",
        "₹" & FORMAT(_Rev / 100000, "#,##0.00") & " Lakh"
    )
```

### Active Buyers Count
```dax
Active Buyers = 
DISTINCTCOUNT('da_b2b_orders_cleaned'[buyer_id])
```

### Repeat Buyer Order Share %
```dax
Repeat Buyer Share % = 
VAR _RepeatOrders = CALCULATE([Total Orders], 'da_b2b_orders_cleaned'[repeat_buyer] = 1)
RETURN
    DIVIDE(_RepeatOrders, [Total Orders], 0) * 100
```

---

## 2. Logistics & Fulfillment SLA Measures

### On-Time Orders
```dax
On-Time Orders = 
CALCULATE(
    COUNTROWS('da_b2b_orders_cleaned'),
    'da_b2b_orders_cleaned'[on_time_delivery] = 1
)
```

### Delayed Orders
```dax
Delayed Orders = 
CALCULATE(
    COUNTROWS('da_b2b_orders_cleaned'),
    'da_b2b_orders_cleaned'[is_delayed] = 1
)
```

### On-Time Delivery Rate %
```dax
On-Time Delivery Rate % = 
DIVIDE([On-Time Orders], [Total Orders], 0) * 100
```

### Delay Rate %
```dax
Delay Rate % = 
DIVIDE([Delayed Orders], [Total Orders], 0) * 100
```

### Target SLA % (80% Enterprise Target)
```dax
Target SLA % = 80.0
```

### SLA Variance %
```dax
SLA Variance % = 
[On-Time Delivery Rate %] - [Target SLA %]
```

### Average Delivery Days
```dax
Average Delivery Days = 
AVERAGE('da_b2b_orders_cleaned'[delivery_days])
```

### Median Delivery Days
```dax
Median Delivery Days = 
MEDIAN('da_b2b_orders_cleaned'[delivery_days])
```

---

## 3. Cargo Returns & Exception Audit Measures

### Total Returned Units
```dax
Total Returned Units = 
SUM('da_b2b_orders_cleaned'[return_qty])
```

### Unit Return Rate %
```dax
Unit Return Rate % = 
DIVIDE([Total Returned Units], [Total Quantity Units], 0) * 100
```

### Orders with Returns Count
```dax
Orders with Returns Count = 
CALCULATE(
    COUNTROWS('da_b2b_orders_cleaned'),
    'da_b2b_orders_cleaned'[return_qty] > 0
)
```

### Severe Return Overrun Anomalies Count
```dax
Severe Return Overrun Count = 
CALCULATE(
    COUNTROWS('da_b2b_orders_cleaned'),
    'da_b2b_orders_cleaned'[is_valid_return] = FALSE()
)
```

---

## 4. Week 6 Buyer Segmentation Measures

### Average Spend per Segment Buyer
```dax
Avg Spend per Segment Buyer = 
AVERAGE('buyer_rfm_segments'[total_spend_inr])
```

### Segment On-Time Rate %
```dax
Segment On-Time Rate % = 
AVERAGE('buyer_rfm_segments'[on_time_rate]) * 100
```

### Segment Return Rate %
```dax
Segment Return Rate % = 
AVERAGE('buyer_rfm_segments'[unit_return_rate]) * 100
```

### Core Stable Buyers Count
```dax
Core Stable Buyers Count = 
CALCULATE(
    COUNTROWS('buyer_rfm_segments'),
    'buyer_rfm_segments'[segment_label] = "Core Stable Accounts (High Fulfillment)"
)
```

### Active Growth Buyers Count
```dax
Active Growth Buyers Count = 
CALCULATE(
    COUNTROWS('buyer_rfm_segments'),
    'buyer_rfm_segments'[segment_label] = "Active Growth Buyers (High Velocity)"
)
```

### Operationally Vulnerable Buyers Count
```dax
Operationally Vulnerable Buyers Count = 
CALCULATE(
    COUNTROWS('buyer_rfm_segments'),
    'buyer_rfm_segments'[segment_label] = "Operationally Vulnerable (High Friction)"
)
```

### Lapsed Buyers Count
```dax
Lapsed Buyers Count = 
CALCULATE(
    COUNTROWS('buyer_rfm_segments'),
    'buyer_rfm_segments'[segment_label] = "Lapsed Accounts (Dormant)"
)
```
