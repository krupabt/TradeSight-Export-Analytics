-- ============================================================================
-- TradeSight Export Analytics — PostgreSQL Database Schema
-- Milestone: Week 3 Data Pipeline & Analytical Modeling
-- Database Target: PostgreSQL 14+
-- ============================================================================

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS tradesight;
SET search_path TO tradesight, public;

-- Drop existing tables if re-running
DROP TABLE IF EXISTS da_b2b_orders CASCADE;
DROP TABLE IF EXISTS da_product_catalogue CASCADE;
DROP TABLE IF EXISTS da_customer_profiles CASCADE;

-- ============================================================================
-- Table: da_b2b_orders
-- Represents wholesale export orders fulfilled from Chennai logistics hub.
-- Note: Foreign keys to customers/products are intentionally omitted because
-- exploratory data analysis confirmed disjunct schemas across the 3 datasets.
-- ============================================================================
CREATE TABLE da_b2b_orders (
    order_id             VARCHAR(30) PRIMARY KEY,
    buyer_id             VARCHAR(30) NOT NULL,
    seller_id            VARCHAR(30) NOT NULL,
    category             VARCHAR(100) NOT NULL,
    order_date           DATE NOT NULL,
    quantity_units       INTEGER NOT NULL CHECK (quantity_units > 0),
    unit_price_inr       NUMERIC(15, 2) NOT NULL CHECK (unit_price_inr > 0),
    total_value_inr      NUMERIC(18, 2) NOT NULL CHECK (total_value_inr > 0),
    payment_terms        VARCHAR(50) NOT NULL,
    delivery_days        INTEGER NOT NULL CHECK (delivery_days >= 0),
    on_time_delivery     SMALLINT NOT NULL CHECK (on_time_delivery IN (0, 1)),
    return_qty           INTEGER NOT NULL CHECK (return_qty >= 0),
    repeat_buyer         SMALLINT NOT NULL CHECK (repeat_buyer IN (0, 1)),
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_order_date ON da_b2b_orders (order_date);
CREATE INDEX idx_orders_category ON da_b2b_orders (category);
CREATE INDEX idx_orders_buyer_id ON da_b2b_orders (buyer_id);
CREATE INDEX idx_orders_payment_terms ON da_b2b_orders (payment_terms);
CREATE INDEX idx_orders_on_time ON da_b2b_orders (on_time_delivery);

-- ============================================================================
-- Table: da_product_catalogue
-- Master catalogue of retail/consumer reference inventory.
-- ============================================================================
CREATE TABLE da_product_catalogue (
    product_id           VARCHAR(30) PRIMARY KEY,
    name                 VARCHAR(100) NOT NULL,
    category             VARCHAR(100) NOT NULL,
    mrp                  NUMERIC(12, 2) NOT NULL CHECK (mrp > 0),
    cogs                 NUMERIC(12, 2) NOT NULL CHECK (cogs >= 0),
    stock_units          INTEGER NOT NULL CHECK (stock_units >= 0),
    avg_monthly_sales    INTEGER NOT NULL CHECK (avg_monthly_sales >= 0),
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON da_product_catalogue (category);

-- ============================================================================
-- Table: da_customer_profiles
-- Master customer account profiles and CRM metrics.
-- ============================================================================
CREATE TABLE da_customer_profiles (
    customer_id          VARCHAR(30) PRIMARY KEY,
    city                 VARCHAR(100) NOT NULL,
    age_band             VARCHAR(20) NOT NULL,
    gender               CHAR(1) NOT NULL,
    acquisition_channel  VARCHAR(50) NOT NULL,
    first_purchase_date  DATE NOT NULL,
    total_orders         INTEGER NOT NULL CHECK (total_orders >= 0),
    total_revenue        NUMERIC(15, 2) NOT NULL CHECK (total_revenue >= 0),
    last_purchase_date   DATE NOT NULL,
    churned              SMALLINT NOT NULL CHECK (churned IN (0, 1)),
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_city ON da_customer_profiles (city);
CREATE INDEX idx_customers_channel ON da_customer_profiles (acquisition_channel);
CREATE INDEX idx_customers_churned ON da_customer_profiles (churned);

-- ============================================================================
-- Data Import Instructions (PostgreSQL psql CLI or pgAdmin)
-- ============================================================================
-- Option A: Using psql client \copy (Recommended on local client machine):
--
-- \copy tradesight.da_b2b_orders(order_id, buyer_id, seller_id, category, order_date, quantity_units, unit_price_inr, total_value_inr, payment_terms, delivery_days, on_time_delivery, return_qty, repeat_buyer) FROM 'D:/TradeSight-Export-Analytics/data/da_b2b_orders.csv' WITH (FORMAT csv, HEADER true);
--
-- \copy tradesight.da_product_catalogue(product_id, name, category, mrp, cogs, stock_units, avg_monthly_sales) FROM 'D:/TradeSight-Export-Analytics/data/da_product_catalogue.csv' WITH (FORMAT csv, HEADER true);
--
-- \copy tradesight.da_customer_profiles(customer_id, city, age_band, gender, acquisition_channel, first_purchase_date, total_orders, total_revenue, last_purchase_date, churned) FROM 'D:/TradeSight-Export-Analytics/data/da_customer_profiles.csv' WITH (FORMAT csv, HEADER true);
--
-- Option B: Server-side COPY (Requires PostgreSQL superuser / server file access):
-- COPY tradesight.da_b2b_orders FROM '/absolute/server/path/da_b2b_orders.csv' WITH (FORMAT csv, HEADER true);
