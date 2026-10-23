-- ============================================================================
-- TradeSight Export Analytics — Data Quality & Integrity Checks
-- Milestone: Week 3 Automated Database Validation Script
-- Target: PostgreSQL
-- ============================================================================

SET search_path TO tradesight, public;

-- ----------------------------------------------------------------------------
-- CHECK 1: Return Quantities Exceeding Ordered Quantities (Logical Impossibility)
-- Expected Result: Exactly 2 flagged orders (B2B-00131 and B2B-00188).
-- ----------------------------------------------------------------------------
SELECT
    'CRITICAL: Return Quantity Exceeds Ordered Units' AS check_name,
    order_id,
    buyer_id,
    category,
    quantity_units,
    return_qty,
    (return_qty - quantity_units) AS excess_returned_units,
    order_date
FROM da_b2b_orders
WHERE return_qty > quantity_units;

-- ----------------------------------------------------------------------------
-- CHECK 2: Order Total Value Consistency Check
-- Verifies: total_value_inr == quantity_units * unit_price_inr
-- Tolerance: > 0.05 INR
-- Expected Result: 0 rows (Passed with zero calculation error).
-- ----------------------------------------------------------------------------
SELECT
    'HIGH: Order Value Calculation Discrepancy' AS check_name,
    order_id,
    quantity_units,
    unit_price_inr,
    total_value_inr,
    ROUND(quantity_units * unit_price_inr, 2) AS expected_value_inr,
    ROUND(ABS(total_value_inr - (quantity_units * unit_price_inr)), 4) AS discrepancy_inr
FROM da_b2b_orders
WHERE ABS(total_value_inr - (quantity_units * unit_price_inr)) > 0.05;

-- ----------------------------------------------------------------------------
-- CHECK 3: Customer Profile Chronological Integrity Check
-- Verifies: first_purchase_date <= last_purchase_date
-- Expected Result: Exactly 42 flagged customer records with inverted dates.
-- ----------------------------------------------------------------------------
SELECT
    'HIGH: Customer First Purchase Date After Last Purchase Date' AS check_name,
    customer_id,
    city,
    acquisition_channel,
    first_purchase_date,
    last_purchase_date,
    (first_purchase_date - last_purchase_date) AS inversion_days
FROM da_customer_profiles
WHERE first_purchase_date > last_purchase_date
ORDER BY inversion_days DESC;

-- ----------------------------------------------------------------------------
-- CHECK 4: Unreasonable Delivery Transit Days
-- Flags delivery_days outside business tolerance [1, 60]
-- Expected Result: 0 rows (All orders lie strictly between 3 and 45 days).
-- ----------------------------------------------------------------------------
SELECT
    'MEDIUM: Out of Bounds Delivery Transit Duration' AS check_name,
    order_id,
    delivery_days,
    on_time_delivery,
    order_date
FROM da_b2b_orders
WHERE delivery_days < 1 OR delivery_days > 60;

-- ----------------------------------------------------------------------------
-- CHECK 5: Primary Key Duplication Audit
-- Verifies uniqueness of identifiers across all 3 tables
-- Expected Result: 0 duplicate rows across all tables.
-- ----------------------------------------------------------------------------
SELECT 'orders' AS table_name, order_id AS duplicate_id, COUNT(*) AS occurrences
FROM da_b2b_orders GROUP BY order_id HAVING COUNT(*) > 1
UNION ALL
SELECT 'products', product_id, COUNT(*)
FROM da_product_catalogue GROUP BY product_id HAVING COUNT(*) > 1
UNION ALL
SELECT 'customers', customer_id, COUNT(*)
FROM da_customer_profiles GROUP BY customer_id HAVING COUNT(*) > 1;

-- ----------------------------------------------------------------------------
-- CHECK 6: Null Cell Presence Audit
-- Verifies that critical business columns contain non-null values
-- Expected Result: 0 null occurrences.
-- ----------------------------------------------------------------------------
SELECT
    'Null Field Audit' AS check_name,
    SUM(CASE WHEN order_id IS NULL THEN 1 ELSE 0 END) AS null_order_ids,
    SUM(CASE WHEN buyer_id IS NULL THEN 1 ELSE 0 END) AS null_buyer_ids,
    SUM(CASE WHEN total_value_inr IS NULL THEN 1 ELSE 0 END) AS null_order_values,
    SUM(CASE WHEN order_date IS NULL THEN 1 ELSE 0 END) AS null_order_dates
FROM da_b2b_orders;

-- ----------------------------------------------------------------------------
-- CHECK 7: Cross-Dataset Referential Disjunction Audit
-- Demonstrates that da_b2b_orders.buyer_id has 0 direct foreign key matches
-- against da_customer_profiles.customer_id.
-- Expected Result: 0 matching records.
-- ----------------------------------------------------------------------------
SELECT
    'Cross-Dataset Foreign Key Match Check' AS audit_name,
    COUNT(o.order_id) AS total_orders_evaluated,
    COUNT(c.customer_id) AS matched_customers_count,
    ROUND((COUNT(c.customer_id)::NUMERIC / NULLIF(COUNT(o.order_id), 0)) * 100, 2) AS match_rate_pct
FROM da_b2b_orders o
LEFT JOIN da_customer_profiles c
    ON o.buyer_id = c.customer_id;
