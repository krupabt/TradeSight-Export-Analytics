# TradeSight Export Analytics — Power BI Dashboard Specification

**Client:** Chennai Export Management Enterprise  
**Project:** Cynaris Data Analyst Internship Capstone — Week 3  
**Status:** Dashboard Specification & Data Model Architecture  
**Canvas Resolution:** 16:9 Widescreen (1920 × 1080 px)  
**Primary Color Palette:** Executive Navy (`#0F2027`), Deep Teal (`#203A43`), Slate Gray (`#2C5364`), Alert Red (`#E63946`), Accent Gold (`#FFB703`), Success Emerald (`#2A9D8F`)

---

## 1. Executive Data Model & Relationship Strategy

### Relationship Architecture Note
During Week 3 pipeline validation, cross-dataset referential integrity was analyzed:
- `da_b2b_orders.buyer_id` (`BUY-0001` to `BUY-0200`) does **not** match `da_customer_profiles.Customer_ID` (`C1` to `C200`).
- `da_b2b_orders` contains no `Product_ID` foreign key.
- Order categories (industrial B2B materials) and Product Catalogue categories (retail consumer goods) are disjunct.

**Power BI Modeling Decision:**
Instead of constructing synthetic relationships that produce cross-filtering artifacts, Power BI uses a **Multi-Fact Independent Model** with a shared Calendar Date Dimension (`DimDate`) linked to `da_b2b_orders[order_date]`. Customer and Product catalogue tables are treated as independent master reference domains.

```mermaid
classDiagram
    class DimDate {
        +Date Date PK
        +String YearMonth
        +Integer Year
        +Integer MonthNumber
        +String MonthName
        +String Quarter
    }
    class Fact_B2B_Orders {
        +String order_id PK
        +String buyer_id
        +String seller_id
        +String category
        +Date order_date FK
        +Integer quantity_units
        +Double unit_price_inr
        +Double total_value_inr
        +String payment_terms
        +Integer delivery_days
        +Integer on_time_delivery
        +Integer return_qty
        +Integer repeat_buyer
        +String data_quality_flag
    }
    class Master_Product_Catalogue {
        +String Product_ID PK
        +String Name
        +String Category
        +Double MRP
        +Double COGS
        +Integer Stock_Units
        +Integer Avg_Monthly_Sales
    }
    class Master_Customer_Profiles {
        +String Customer_ID PK
        +String City
        +String Age_Band
        +String Gender
        +String Acquisition_Channel
        +Date First_Purchase_Date
        +Integer Total_Orders
        +Double Total_Revenue
        +Date Last_Purchase_Date
        +Integer Churned
    }

    DimDate "1" --> "*" Fact_B2B_Orders : 1:Many (Single Direction)
```

---

## 2. Dashboard Page Structure

### Page 1: Executive Overview & Commercial Performance
**Objective:** Provide C-suite leaders with high-level revenue, volume, and operational health metrics.

1. **Top KPI Card Deck (5 Cards across the top):**
   - **Total Export Value:** `₹3.97B` (`[Total Revenue INR]`)
   - **Total Export Orders:** `600` (`[Total Orders]`)
   - **Average Order Value (AOV):** `₹6.61M` (`[Average Order Value]`)
   - **On-Time Delivery Rate:** `77.5%` (`[On-Time Delivery Rate %]` with green/red conditional alert)
   - **Unit Return Rate:** `1.01%` (`[Unit Return Rate %]`)

2. **Visual 1 (Main Canvas - Left): Monthly Revenue & Order Volume Trend**
   - **Visual Type:** Line and Clustered Column Chart
   - **Shared Axis:** `DimDate[YearMonth]` (Jan 2023 – Dec 2024)
   - **Column Values:** `[Total Revenue INR]` (Denominated in Millions/Billions)
   - **Line Values:** `[Total Orders]`
   - **Tooltip:** AOV, On-Time Delivery Rate %

3. **Visual 2 (Right Top): Revenue & Order Volume by B2B Category**
   - **Visual Type:** Clustered Bar Chart / Treemap
   - **Category Axis:** `da_b2b_orders[category]` (10 B2B categories)
   - **Values:** `[Total Revenue INR]`
   - **Data Labels:** Formatted in Crores (₹ Cr) or Millions (₹ M)

4. **Visual 3 (Right Bottom): Payment Terms Distribution & Commercial Share**
   - **Visual Type:** Donut Chart
   - **Legend:** `da_b2b_orders[payment_terms]` (LC, 30 Days Net, 60 Days Net, Advance, COD)
   - **Values:** `[Total Orders]`
   - **Detail Labels:** Category & Percent of Total

5. **Slicer Panel (Left sidebar / top banner):**
   - Year Slicer (2023, 2024)
   - Category Multi-select dropdown
   - Payment Terms multi-select
   - Repeat Buyer toggle (All, Repeat Buyers, New Buyers)

---

### Page 2: Shipment & Logistics Fulfillment
**Objective:** Enable the Operations Director to track lead times, on-time delivery percentages, and carrier bottlenecks.

1. **Top KPI Card Deck:**
   - **On-Time Orders:** `465` (`[On-Time Orders]`)
   - **Delayed Orders:** `135` (`[Delayed Orders]`)
   - **Average Transit Duration:** `23.49 Days` (`[Average Delivery Days]`)
   - **Median Transit Duration:** `23.5 Days` (`[Median Delivery Days]`)

2. **Visual 1: On-Time Delivery Rate by Category vs. 80% SLA Target**
   - **Visual Type:** Bar Chart with Analytics Target Constant Line at 80.0%
   - **Axis:** `da_b2b_orders[category]`
   - **Value:** `[On-Time Delivery Rate %]`
   - **Conditional Formatting:** Bars colored Red if `< 75%`, Gold if `75% - 85%`, Teal if `> 85%`.

3. **Visual 2: Delivery Transit Days Distribution**
   - **Visual Type:** Column Chart / Histogram
   - **X-Axis:** `da_b2b_orders[delivery_days]` (Grouped in 5-day bins: 1-5, 6-10, ..., 41-45)
   - **Y-Axis:** Count of Orders
   - **Highlight:** Color overlay for delayed orders (`on_time_delivery == 0`)

4. **Visual 3: Working Capital Risk Matrix (Delays on 60 Days Net)**
   - **Visual Type:** Matrix
   - **Rows:** `da_b2b_orders[payment_terms]`
   - **Columns:** `da_b2b_orders[on_time_delivery]` (0 = Delayed, 1 = On-Time)
   - **Values:** Count of Orders, Sum of `total_value_inr`, Avg `delivery_days`
   - **Business Impact:** Highlighting delayed orders on `60 Days Net` where accounts receivable collection is deferred.

---

### Page 3: Returns & Data Quality Exception Audit
**Objective:** Provide Quality Assurance and Master Data Governance leads with visibility into product returns and record-level anomalies.

1. **Top KPI Card Deck:**
   - **Total Returned Units:** `15,242 Units` (`[Total Returned Units]`)
   - **Unit Return Rate:** `1.01%` (`[Unit Return Rate %]`)
   - **Orders Affected by Returns:** `591 Orders (98.5%)` (`[Orders with Returns Count]`)
   - **Critical Return Overrun Anomalies:** `2 Orders` (`[Return Overrun Anomalies Count]`)

2. **Visual 1: Units Returned vs. Return Rate % by Category**
   - **Visual Type:** Line and Stacked Column Chart
   - **Axis:** `da_b2b_orders[category]`
   - **Column Value:** `[Total Returned Units]`
   - **Line Value:** `[Unit Return Rate %]`

3. **Visual 2: Critical Data Quality Exceptions Table**
   - **Visual Type:** Grid Table
   - **Filter:** `da_b2b_orders[data_quality_flag] == "SUSPICIOUS_RETURN_EXCEEDS_ORDERED"`
   - **Columns:** `order_id`, `buyer_id`, `category`, `order_date`, `quantity_units`, `return_qty`, `unit_price_inr`, `total_value_inr`
   - **Alert Callout:** Orders `B2B-00131` (28 returned vs 22 ordered) and `B2B-00188` (48 returned vs 39 ordered).

---

### Page 4: Master Reference Catalogues (Product & Customer Domains)
**Objective:** Provide reference insights for the product catalogue and CRM customer segments as standalone master data domains.

1. **Panel A: Master Product Catalogue**
   - **Card:** Total Catalogue Items (`50`), Total Stock (`13,857 Units`), Avg Catalogue Margin (`58.5%`)
   - **Bar Chart:** Average Gross Margin % by Catalogue Category (`Beauty`, `Home`, `Electronics`, `Apparel`, `Grocery`)
   - **Scatter Chart:** Inventory Units in Stock vs. Average Monthly Sales (Inventory Turn health)

2. **Panel B: Master Customer Profiles**
   - **Card:** Total Profiles (`200`), Reported Revenue (`₹4.99M`), Churn Rate (`3.0%`)
   - **Bar Chart:** Customer Count and Revenue by City (`Delhi`, `Mumbai`, `Hyderabad`, `Bangalore`, `Pune`, `Chennai`)
   - **Donut Chart:** Acquisition Channel Distribution (`Marketplace`, `App`, `Website`, `Offline`)
   - **Audit Notice:** Highlights that 42 profiles exhibit `First_Purchase_Date > Last_Purchase_Date`.

---

## 3. Business Requirement Feasibility Audit

| Business Requirement | Feasibility | Status in Power BI |
| :--- | :--- | :--- |
| **Order & Shipment Performance** | **Fully Supported** | Rendered across Pages 1 & 2 using actual timestamps, values, and flags. |
| **Delivery Delays & Lead Times** | **Fully Supported** | Rendered on Page 2 with bin distributions and SLA targets. |
| **Returns & Defect Monitoring** | **Fully Supported** | Rendered on Page 3 with unit and order return rates. |
| **Data Quality Exception Auditing** | **Fully Supported** | Rendered on Page 3 with flagged return overruns. |
| **Customer Channel & City Analysis** | **Partially Supported (Isolated)** | Rendered on Page 4 as standalone CRM master data. |
| **Product Margin & Stock Analysis** | **Partially Supported (Isolated)** | Rendered on Page 4 as standalone catalogue master data. |
| **Foreign Exchange (FX) Impact** | **Unsupported** | ❌ Marked unsupported; orders only contain INR values without foreign currency codes or exchange rate tables. |
| **Client Net Profitability** | **Unsupported** | ❌ Marked unsupported; order records contain revenue but no carrier freight expenses or supplier purchase costs. |
| **Customs & Legal Compliance** | **Unsupported** | ❌ Marked unsupported; no export HS codes, customs declarations, or regulatory filings exist in raw datasets. |
