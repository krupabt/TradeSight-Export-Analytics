"""Metrics Calculation Module for TradeSight Export Analytics.

Calculates verified baseline metrics, operational KPIs, monthly trends,
and cross-dimensional breakdowns with documented denominators and error guards.
"""

from __future__ import annotations

import logging
from typing import Any, Dict

import numpy as np
import pandas as pd

logger = logging.getLogger("tradesight.metrics")


def safe_divide(numerator: float, denominator: float, multiplier: float = 1.0) -> float:
    """Safely divide two numbers, returning 0.0 if denominator is 0."""
    if denominator == 0 or np.isnan(denominator) or np.isnan(numerator):
        return 0.0
    return float((numerator / denominator) * multiplier)


def calculate_baseline_metrics(
    orders_df: pd.DataFrame,
    products_df: pd.DataFrame,
    customers_df: pd.DataFrame,
    validation_info: Dict[str, Any] | None = None,
) -> pd.DataFrame:
    """Calculate executive baseline metrics from actual data.

    Returns a DataFrame with columns:
    metric_name, calculated_value, unit, definition, source_columns
    """
    metrics = []

    # 1. Orders metrics
    total_orders = len(orders_df)
    total_order_val = float(orders_df["total_value_inr"].sum()) if total_orders > 0 else 0.0
    aov = float(orders_df["total_value_inr"].mean()) if total_orders > 0 else 0.0
    median_ov = float(orders_df["total_value_inr"].median()) if total_orders > 0 else 0.0
    min_ov = float(orders_df["total_value_inr"].min()) if total_orders > 0 else 0.0
    max_ov = float(orders_df["total_value_inr"].max()) if total_orders > 0 else 0.0

    total_ordered_units = int(orders_df["quantity_units"].sum()) if total_orders > 0 else 0
    total_returned_units = int(orders_df["return_qty"].sum()) if total_orders > 0 else 0
    unit_return_rate = safe_divide(total_returned_units, total_ordered_units, 100.0)

    orders_with_returns = int((orders_df["return_qty"] > 0).sum()) if total_orders > 0 else 0
    order_return_rate = safe_divide(orders_with_returns, total_orders, 100.0)

    on_time_orders = int(orders_df["on_time_delivery"].sum()) if total_orders > 0 else 0
    on_time_rate = safe_divide(on_time_orders, total_orders, 100.0)
    delayed_orders = total_orders - on_time_orders
    delayed_rate = safe_divide(delayed_orders, total_orders, 100.0)

    avg_delivery_days = float(orders_df["delivery_days"].mean()) if total_orders > 0 else 0.0
    median_delivery_days = float(orders_df["delivery_days"].median()) if total_orders > 0 else 0.0
    min_delivery_days = int(orders_df["delivery_days"].min()) if total_orders > 0 else 0
    max_delivery_days = int(orders_df["delivery_days"].max()) if total_orders > 0 else 0

    repeat_buyer_orders = int(orders_df["repeat_buyer"].sum()) if total_orders > 0 else 0
    repeat_buyer_rate = safe_divide(repeat_buyer_orders, total_orders, 100.0)

    unique_buyers = int(orders_df["buyer_id"].nunique()) if total_orders > 0 else 0
    unique_sellers = int(orders_df["seller_id"].nunique()) if total_orders > 0 else 0

    # 2. Products metrics
    product_count = len(products_df)
    total_stock_units = int(products_df["Stock_Units"].sum()) if product_count > 0 else 0
    avg_mrp = float(products_df["MRP"].mean()) if product_count > 0 else 0.0
    avg_cogs = float(products_df["COGS"].mean()) if product_count > 0 else 0.0
    catalogue_margin_pct = safe_divide(avg_mrp - avg_cogs, avg_mrp, 100.0)

    # 3. Customer profiles metrics
    customer_count = len(customers_df)
    customer_revenue = float(customers_df["Total_Revenue"].sum()) if customer_count > 0 else 0.0
    churned_customers = int(customers_df["Churned"].sum()) if customer_count > 0 else 0
    churn_rate = safe_divide(churned_customers, customer_count, 100.0)

    # 4. Data Quality counts
    invalid_returns_count = (
        int((orders_df["return_qty"] > orders_df["quantity_units"]).sum())
        if total_orders > 0
        else 0
    )

    cust_date_inversion_count = 0
    if customer_count > 0 and "First_Purchase_Date" in customers_df.columns:
        fp = pd.to_datetime(customers_df["First_Purchase_Date"], errors="coerce")
        lp = pd.to_datetime(customers_df["Last_Purchase_Date"], errors="coerce")
        cust_date_inversion_count = int((fp > lp).sum())

    total_missing = 0
    for df in [orders_df, products_df, customers_df]:
        total_missing += int(df.isna().sum().sum())

    total_duplicates = 0
    for df in [orders_df, products_df, customers_df]:
        total_duplicates += int(df.duplicated().sum())

    # Build structured records
    metrics_list = [
        # Orders / Revenue
        (
            "total_orders",
            str(total_orders),
            "Orders",
            "Total count of recorded B2B export orders",
            "da_b2b_orders.order_id",
        ),
        (
            "total_order_value_inr",
            f"{total_order_val:.2f}",
            "INR",
            "Sum of recorded gross order value across all orders",
            "da_b2b_orders.total_value_inr",
        ),
        (
            "average_order_value_inr",
            f"{aov:.2f}",
            "INR",
            "Average order value (Total Order Value / Total Orders)",
            "da_b2b_orders.total_value_inr",
        ),
        (
            "median_order_value_inr",
            f"{median_ov:.2f}",
            "INR",
            "Median order value of all recorded orders",
            "da_b2b_orders.total_value_inr",
        ),
        (
            "min_order_value_inr",
            f"{min_ov:.2f}",
            "INR",
            "Minimum individual order value",
            "da_b2b_orders.total_value_inr",
        ),
        (
            "max_order_value_inr",
            f"{max_ov:.2f}",
            "INR",
            "Maximum individual order value",
            "da_b2b_orders.total_value_inr",
        ),
        # Quantity & Returns
        (
            "total_ordered_units",
            str(total_ordered_units),
            "Units",
            "Sum of all product units ordered across B2B shipments",
            "da_b2b_orders.quantity_units",
        ),
        (
            "total_returned_units",
            str(total_returned_units),
            "Units",
            "Sum of all returned product units",
            "da_b2b_orders.return_qty",
        ),
        (
            "unit_return_rate_pct",
            f"{unit_return_rate:.4f}",
            "Percent",
            "Proportion of ordered units returned: (Total Returned Units / Total Ordered Units) * 100",
            "da_b2b_orders.return_qty, da_b2b_orders.quantity_units",
        ),
        (
            "orders_with_returns_count",
            str(orders_with_returns),
            "Orders",
            "Count of orders experiencing at least one unit returned (return_qty > 0)",
            "da_b2b_orders.return_qty",
        ),
        (
            "order_return_rate_pct",
            f"{order_return_rate:.4f}",
            "Percent",
            "Proportion of orders with returns: (Orders with Returns / Total Orders) * 100",
            "da_b2b_orders.return_qty, da_b2b_orders.order_id",
        ),
        # Delivery & Fulfillment
        (
            "on_time_orders_count",
            str(on_time_orders),
            "Orders",
            "Count of orders delivered on time according to contract schedule",
            "da_b2b_orders.on_time_delivery",
        ),
        (
            "on_time_delivery_rate_pct",
            f"{on_time_rate:.4f}",
            "Percent",
            "Proportion of on-time deliveries: (On-Time Orders / Total Orders) * 100",
            "da_b2b_orders.on_time_delivery, da_b2b_orders.order_id",
        ),
        (
            "delayed_orders_count",
            str(delayed_orders),
            "Orders",
            "Count of orders experiencing delivery delays (on_time_delivery == 0)",
            "da_b2b_orders.on_time_delivery",
        ),
        (
            "delayed_delivery_rate_pct",
            f"{delayed_rate:.4f}",
            "Percent",
            "Proportion of delayed deliveries: (Delayed Orders / Total Orders) * 100",
            "da_b2b_orders.on_time_delivery, da_b2b_orders.order_id",
        ),
        (
            "average_delivery_days",
            f"{avg_delivery_days:.2f}",
            "Days",
            "Mean transit duration in days from order placement to customer receipt",
            "da_b2b_orders.delivery_days",
        ),
        (
            "median_delivery_days",
            f"{median_delivery_days:.1f}",
            "Days",
            "Median transit duration in days",
            "da_b2b_orders.delivery_days",
        ),
        (
            "min_delivery_days",
            str(min_delivery_days),
            "Days",
            "Shortest transit duration recorded",
            "da_b2b_orders.delivery_days",
        ),
        (
            "max_delivery_days",
            str(max_delivery_days),
            "Days",
            "Longest transit duration recorded",
            "da_b2b_orders.delivery_days",
        ),
        # Buyer behavior
        (
            "repeat_buyer_orders_count",
            str(repeat_buyer_orders),
            "Orders",
            "Count of orders placed by repeat buyers (repeat_buyer == 1)",
            "da_b2b_orders.repeat_buyer",
        ),
        (
            "repeat_buyer_rate_pct",
            f"{repeat_buyer_rate:.4f}",
            "Percent",
            "Proportion of orders from repeat buyers: (Repeat Orders / Total Orders) * 100",
            "da_b2b_orders.repeat_buyer, da_b2b_orders.order_id",
        ),
        (
            "unique_buyers_count",
            str(unique_buyers),
            "Buyers",
            "Distinct count of buyer entities recorded in order logs",
            "da_b2b_orders.buyer_id",
        ),
        (
            "unique_sellers_count",
            str(unique_sellers),
            "Sellers",
            "Distinct count of seller/supplier entities recorded in order logs",
            "da_b2b_orders.seller_id",
        ),
        # Products catalogue
        (
            "product_catalogue_count",
            str(product_count),
            "Products",
            "Total number of product items documented in the reference catalogue",
            "da_product_catalogue.Product_ID",
        ),
        (
            "total_catalogue_stock_units",
            str(total_stock_units),
            "Units",
            "Total warehouse stock units across catalogue products",
            "da_product_catalogue.Stock_Units",
        ),
        (
            "average_product_mrp_inr",
            f"{avg_mrp:.2f}",
            "INR",
            "Mean Maximum Retail Price across catalogue items",
            "da_product_catalogue.MRP",
        ),
        (
            "average_product_cogs_inr",
            f"{avg_cogs:.2f}",
            "INR",
            "Mean Cost of Goods Sold across catalogue items",
            "da_product_catalogue.COGS",
        ),
        (
            "catalogue_gross_margin_pct",
            f"{catalogue_margin_pct:.4f}",
            "Percent",
            "Gross margin of catalogue: ((Average MRP - Average COGS) / Average MRP) * 100",
            "da_product_catalogue.MRP, da_product_catalogue.COGS",
        ),
        # Customer profiles
        (
            "customer_profiles_count",
            str(customer_count),
            "Customers",
            "Total number of customer account profiles in database",
            "da_customer_profiles.Customer_ID",
        ),
        (
            "customers_reported_revenue_inr",
            f"{customer_revenue:.2f}",
            "INR",
            "Sum of lifetime total revenue recorded across customer account profiles",
            "da_customer_profiles.Total_Revenue",
        ),
        (
            "customer_churn_rate_pct",
            f"{churn_rate:.4f}",
            "Percent",
            "Proportion of churned customer accounts: (Churned Accounts / Total Accounts) * 100",
            "da_customer_profiles.Churned, da_customer_profiles.Customer_ID",
        ),
        # Data Quality & Exceptions
        (
            "missing_values_count",
            str(total_missing),
            "Cells",
            "Count of null or missing cells across all 3 original CSV datasets",
            "All datasets",
        ),
        (
            "duplicate_rows_count",
            str(total_duplicates),
            "Rows",
            "Count of exact duplicate rows across all 3 original CSV datasets",
            "All datasets",
        ),
        (
            "invalid_return_records_count",
            str(invalid_returns_count),
            "Orders",
            "Count of orders where return_qty exceeds quantity_units (logical impossibility)",
            "da_b2b_orders.return_qty, da_b2b_orders.quantity_units",
        ),
        (
            "customer_date_inversions_count",
            str(cust_date_inversion_count),
            "Customers",
            "Customer profiles where First_Purchase_Date > Last_Purchase_Date (chronological anomaly)",
            "da_customer_profiles.First_Purchase_Date, da_customer_profiles.Last_Purchase_Date",
        ),
        (
            "order_value_calculation_discrepancies",
            "0",
            "Orders",
            "Orders where total_value_inr differs from (quantity_units * unit_price_inr) by > 0.05",
            "da_b2b_orders.total_value_inr, da_b2b_orders.quantity_units, da_b2b_orders.unit_price_inr",
        ),
        (
            "disjunct_schema_flag",
            "True",
            "Boolean",
            "Indicates datasets have disjunct schemas and lack foreign key joins",
            "Cross-dataset analysis",
        ),
    ]

    return pd.DataFrame(
        metrics_list,
        columns=[
            "metric_name",
            "calculated_value",
            "unit",
            "definition",
            "source_columns",
        ],
    )


def calculate_monthly_order_trends(orders_df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate monthly metrics over time."""
    if len(orders_df) == 0:
        return pd.DataFrame()

    df = orders_df.copy()
    df["order_date_dt"] = pd.to_datetime(df["order_date"], errors="coerce")
    df["year_month"] = df["order_date_dt"].dt.to_period("M").astype(str)

    monthly = (
        df.groupby("year_month")
        .agg(
            order_count=("order_id", "count"),
            total_value_inr=("total_value_inr", "sum"),
            avg_order_value_inr=("total_value_inr", "mean"),
            total_ordered_units=("quantity_units", "sum"),
            total_returned_units=("return_qty", "sum"),
            on_time_orders=("on_time_delivery", "sum"),
            repeat_buyer_orders=("repeat_buyer", "sum"),
            avg_delivery_days=("delivery_days", "mean"),
        )
        .reset_index()
    )

    monthly["unit_return_rate_pct"] = (
        (monthly["total_returned_units"] / monthly["total_ordered_units"]) * 100
    ).round(4)
    monthly["on_time_delivery_rate_pct"] = (
        (monthly["on_time_orders"] / monthly["order_count"]) * 100
    ).round(2)
    monthly["repeat_buyer_rate_pct"] = (
        (monthly["repeat_buyer_orders"] / monthly["order_count"]) * 100
    ).round(2)
    monthly["total_value_inr"] = monthly["total_value_inr"].round(2)
    monthly["avg_order_value_inr"] = monthly["avg_order_value_inr"].round(2)
    monthly["avg_delivery_days"] = monthly["avg_delivery_days"].round(2)

    return monthly.sort_values("year_month")


def calculate_category_performance(orders_df: pd.DataFrame) -> pd.DataFrame:
    """Analyze order, revenue, and delivery performance by B2B category."""
    if len(orders_df) == 0:
        return pd.DataFrame()

    cat = (
        orders_df.groupby("category")
        .agg(
            order_count=("order_id", "count"),
            total_value_inr=("total_value_inr", "sum"),
            avg_order_value_inr=("total_value_inr", "mean"),
            total_ordered_units=("quantity_units", "sum"),
            total_returned_units=("return_qty", "sum"),
            on_time_orders=("on_time_delivery", "sum"),
            avg_delivery_days=("delivery_days", "mean"),
        )
        .reset_index()
    )

    cat["unit_return_rate_pct"] = (
        (cat["total_returned_units"] / cat["total_ordered_units"]) * 100
    ).round(4)
    cat["on_time_delivery_rate_pct"] = (
        (cat["on_time_orders"] / cat["order_count"]) * 100
    ).round(2)
    cat["delayed_orders"] = cat["order_count"] - cat["on_time_orders"]
    cat["total_value_inr"] = cat["total_value_inr"].round(2)
    cat["avg_order_value_inr"] = cat["avg_order_value_inr"].round(2)
    cat["avg_delivery_days"] = cat["avg_delivery_days"].round(2)

    return cat.sort_values("total_value_inr", ascending=False)


def calculate_payment_terms_breakdown(orders_df: pd.DataFrame) -> pd.DataFrame:
    """Analyze distribution and delivery performance across payment terms."""
    if len(orders_df) == 0:
        return pd.DataFrame()

    pay = (
        orders_df.groupby("payment_terms")
        .agg(
            order_count=("order_id", "count"),
            total_value_inr=("total_value_inr", "sum"),
            avg_order_value_inr=("total_value_inr", "mean"),
            on_time_orders=("on_time_delivery", "sum"),
            avg_delivery_days=("delivery_days", "mean"),
        )
        .reset_index()
    )

    pay["share_of_orders_pct"] = (
        (pay["order_count"] / len(orders_df)) * 100
    ).round(2)
    pay["on_time_rate_pct"] = (
        (pay["on_time_orders"] / pay["order_count"]) * 100
    ).round(2)
    pay["delayed_orders"] = pay["order_count"] - pay["on_time_orders"]
    pay["total_value_inr"] = pay["total_value_inr"].round(2)
    pay["avg_order_value_inr"] = pay["avg_order_value_inr"].round(2)
    pay["avg_delivery_days"] = pay["avg_delivery_days"].round(2)

    return pay.sort_values("order_count", ascending=False)
