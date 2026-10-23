-- ============================================================================
-- TradeSight Export Analytics — Analytical Queries
-- Milestone: Week 3 Baseline Metrics & Operational Analysis
-- ============================================================================

SET search_path TO tradesight, public;

-- ----------------------------------------------------------------------------
-- 1. Executive Headline KPIs
-- ----------------------------------------------------------------------------
SELECT
    COUNT(*) AS total_orders,
    SUM(total_value_inr) AS total_order_value_inr,
    ROUND(AVG(total_value_inr), 2) AS average_order_value_inr,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_value_inr)::NUMERIC, 2) AS median_order_value_inr,
    SUM(quantity_units) AS total_ordered_units,
    SUM(return_qty) AS total_returned_units,
    ROUND((SUM(return_qty)::NUMERIC / NULLIF(SUM(quantity_units), 0)) * 100, 4) AS unit_return_rate_pct,
    COUNT(CASE WHEN return_qty > 0 THEN 1 END) AS orders_with_returns_count,
    ROUND((COUNT(CASE WHEN return_qty > 0 THEN 1 END)::NUMERIC / COUNT(*)) * 100, 2) AS order_return_rate_pct,
    SUM(on_time_delivery) AS on_time_orders_count,
    ROUND((SUM(on_time_delivery)::NUMERIC / COUNT(*)) * 100, 2) AS on_time_delivery_rate_pct,
    COUNT(CASE WHEN on_time_delivery = 0 THEN 1 END) AS delayed_orders_count,
    ROUND((COUNT(CASE WHEN on_time_delivery = 0 THEN 1 END)::NUMERIC / COUNT(*)) * 100, 2) AS delayed_delivery_rate_pct,
    ROUND(AVG(delivery_days), 2) AS avg_delivery_days,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY delivery_days)::NUMERIC, 1) AS median_delivery_days,
    SUM(repeat_buyer) AS repeat_buyer_orders,
    ROUND((SUM(repeat_buyer)::NUMERIC / COUNT(*)) * 100, 2) AS repeat_buyer_rate_pct,
    COUNT(DISTINCT buyer_id) AS unique_buyers,
    COUNT(DISTINCT seller_id) AS unique_sellers
FROM da_b2b_orders;

-- ----------------------------------------------------------------------------
-- 2. Monthly Revenue & Fulfillment Trends (2023 - 2024)
-- ----------------------------------------------------------------------------
SELECT
    TO_CHAR(order_date, 'YYYY-MM') AS order_year_month,
    COUNT(*) AS monthly_orders,
    SUM(total_value_inr) AS monthly_revenue_inr,
    ROUND(AVG(total_value_inr), 2) AS monthly_aov_inr,
    SUM(quantity_units) AS monthly_ordered_units,
    SUM(return_qty) AS monthly_returned_units,
    ROUND((SUM(return_qty)::NUMERIC / NULLIF(SUM(quantity_units), 0)) * 100, 4) AS unit_return_rate_pct,
    SUM(on_time_delivery) AS on_time_orders,
    ROUND((SUM(on_time_delivery)::NUMERIC / COUNT(*)) * 100, 2) AS on_time_delivery_rate_pct,
    ROUND(AVG(delivery_days), 2) AS avg_delivery_days
FROM da_b2b_orders
GROUP BY TO_CHAR(order_date, 'YYYY-MM')
ORDER BY order_year_month ASC;

-- ----------------------------------------------------------------------------
-- 3. B2B Category Performance & Shipping Reliability
-- ----------------------------------------------------------------------------
SELECT
    category,
    COUNT(*) AS order_count,
    ROUND((COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM da_b2b_orders)) * 100, 2) AS order_share_pct,
    SUM(total_value_inr) AS total_value_inr,
    ROUND(AVG(total_value_inr), 2) AS aov_inr,
    SUM(quantity_units) AS ordered_units,
    SUM(return_qty) AS returned_units,
    ROUND((SUM(return_qty)::NUMERIC / NULLIF(SUM(quantity_units), 0)) * 100, 4) AS unit_return_rate_pct,
    SUM(on_time_delivery) AS on_time_orders,
    COUNT(CASE WHEN on_time_delivery = 0 THEN 1 END) AS delayed_orders,
    ROUND((SUM(on_time_delivery)::NUMERIC / COUNT(*)) * 100, 2) AS on_time_rate_pct,
    ROUND(AVG(delivery_days), 2) AS avg_transit_days
FROM da_b2b_orders
GROUP BY category
ORDER BY total_value_inr DESC;

-- ----------------------------------------------------------------------------
-- 4. Payment Terms & Working Capital Credit Exposure
-- ----------------------------------------------------------------------------
SELECT
    payment_terms,
    COUNT(*) AS order_count,
    ROUND((COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM da_b2b_orders)) * 100, 2) AS order_share_pct,
    SUM(total_value_inr) AS total_value_inr,
    ROUND(AVG(total_value_inr), 2) AS aov_inr,
    SUM(on_time_delivery) AS on_time_orders,
    COUNT(CASE WHEN on_time_delivery = 0 THEN 1 END) AS delayed_orders,
    ROUND((SUM(on_time_delivery)::NUMERIC / COUNT(*)) * 100, 2) AS on_time_rate_pct,
    ROUND(AVG(delivery_days), 2) AS avg_transit_days
FROM da_b2b_orders
GROUP BY payment_terms
ORDER BY order_count DESC;

-- ----------------------------------------------------------------------------
-- 5. Repeat Buyer Loyalty & Concentration Analysis
-- ----------------------------------------------------------------------------
SELECT
    buyer_id,
    COUNT(*) AS order_count,
    SUM(total_value_inr) AS total_spend_inr,
    ROUND(AVG(total_value_inr), 2) AS avg_order_spend_inr,
    SUM(repeat_buyer) AS repeat_buyer_flag_sum,
    MIN(order_date) AS first_order_date,
    MAX(order_date) AS latest_order_date,
    SUM(return_qty) AS total_returned_units,
    ROUND((SUM(return_qty)::NUMERIC / NULLIF(SUM(quantity_units), 0)) * 100, 4) AS return_rate_pct
FROM da_b2b_orders
GROUP BY buyer_id
ORDER BY total_spend_inr DESC
LIMIT 15;

-- ----------------------------------------------------------------------------
-- 6. Product Catalogue Margin & Stock Turnover (Standalone Master Domain)
-- Note: Evaluated independently because da_b2b_orders lacks Product_ID FK.
-- ----------------------------------------------------------------------------
SELECT
    category,
    COUNT(*) AS product_count,
    ROUND(AVG(mrp), 2) AS avg_mrp_inr,
    ROUND(AVG(cogs), 2) AS avg_cogs_inr,
    ROUND(AVG(mrp - cogs), 2) AS avg_gross_margin_inr,
    ROUND((AVG(mrp - cogs) / NULLIF(AVG(mrp), 0)) * 100, 2) AS avg_margin_pct,
    SUM(stock_units) AS total_stock_units,
    SUM(stock_units * mrp) AS total_inventory_value_mrp_inr,
    ROUND(AVG(stock_units::NUMERIC / NULLIF(avg_monthly_sales, 0)), 2) AS avg_stock_coverage_months
FROM da_product_catalogue
GROUP BY category
ORDER BY total_inventory_value_mrp_inr DESC;

-- ----------------------------------------------------------------------------
-- 7. Customer Profiles Channel & Churn Analysis (Standalone Master Domain)
-- Note: Evaluated independently because Customer_ID does not match Buyer_ID.
-- ----------------------------------------------------------------------------
SELECT
    acquisition_channel,
    city,
    COUNT(*) AS customer_count,
    SUM(total_revenue) AS reported_channel_revenue_inr,
    ROUND(AVG(total_revenue), 2) AS avg_revenue_per_customer_inr,
    ROUND(AVG(total_orders), 1) AS avg_orders_per_customer,
    SUM(churned) AS churned_count,
    ROUND((SUM(churned)::NUMERIC / COUNT(*)) * 100, 2) AS churn_rate_pct
FROM da_customer_profiles
GROUP BY acquisition_channel, city
ORDER BY customer_count DESC;
