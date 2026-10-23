"""Unit tests for baseline metrics and calculation functions."""

import numpy as np
import pandas as pd
import pytest

from src.metrics import (
    calculate_baseline_metrics,
    calculate_category_performance,
    calculate_monthly_order_trends,
    calculate_payment_terms_breakdown,
    safe_divide,
)


def test_safe_divide():
    """Test safe division with zero denominators, NaNs, and normal values."""
    assert safe_divide(10, 2) == 5.0
    assert safe_divide(10, 0) == 0.0
    assert safe_divide(10, np.nan) == 0.0
    assert safe_divide(np.nan, 5) == 0.0
    assert safe_divide(1, 4, 100.0) == 25.0


def test_empty_datasets_metrics():
    """Test metrics calculation on empty datasets does not crash with ZeroDivisionError."""
    empty_orders = pd.DataFrame(
        columns=[
            "order_id",
            "buyer_id",
            "seller_id",
            "category",
            "order_date",
            "quantity_units",
            "unit_price_inr",
            "total_value_inr",
            "payment_terms",
            "delivery_days",
            "on_time_delivery",
            "return_qty",
            "repeat_buyer",
        ]
    )
    empty_products = pd.DataFrame(
        columns=["Product_ID", "Name", "Category", "MRP", "COGS", "Stock_Units", "Avg_Monthly_Sales"]
    )
    empty_customers = pd.DataFrame(
        columns=[
            "Customer_ID",
            "City",
            "Age_Band",
            "Gender",
            "Acquisition_Channel",
            "First_Purchase_Date",
            "Total_Orders",
            "Total_Revenue",
            "Last_Purchase_Date",
            "Churned",
        ]
    )

    metrics_df = calculate_baseline_metrics(empty_orders, empty_products, empty_customers)
    assert isinstance(metrics_df, pd.DataFrame)
    assert len(metrics_df) > 0
    # Values should be 0 or 0.00
    total_orders_val = metrics_df.loc[metrics_df["metric_name"] == "total_orders", "calculated_value"].iloc[0]
    assert total_orders_val == "0"


def test_calculate_baseline_metrics_synthetic():
    """Test metrics accuracy with controlled synthetic numbers."""
    orders = pd.DataFrame(
        {
            "order_id": ["O1", "O2", "O3", "O4"],
            "buyer_id": ["B1", "B2", "B1", "B3"],
            "seller_id": ["S1", "S2", "S1", "S1"],
            "category": ["Textiles", "Textiles", "Chemicals", "Chemicals"],
            "order_date": ["2024-01-01", "2024-01-15", "2024-02-01", "2024-02-15"],
            "quantity_units": [100, 200, 300, 400],  # sum = 1000
            "unit_price_inr": [10.0, 20.0, 30.0, 40.0],
            "total_value_inr": [1000.0, 4000.0, 9000.0, 16000.0],  # sum = 30000, aov = 7500
            "payment_terms": ["LC", "30 Days Net", "LC", "COD"],
            "delivery_days": [10, 20, 30, 40],  # mean = 25
            "on_time_delivery": [1, 1, 0, 1],  # 3 on-time, 1 delayed -> 75%
            "return_qty": [10, 0, 20, 10],  # sum = 40 -> 40/1000 = 4% unit return rate
            "repeat_buyer": [0, 0, 1, 0],  # 1 repeat order -> 25%
        }
    )
    products = pd.DataFrame(
        {
            "Product_ID": ["P1", "P2"],
            "Name": ["P1", "P2"],
            "Category": ["Beauty", "Home"],
            "MRP": [100, 200],  # avg = 150
            "COGS": [60, 100],  # avg = 80
            "Stock_Units": [50, 50],  # sum = 100
            "Avg_Monthly_Sales": [10, 20],
        }
    )
    customers = pd.DataFrame(
        {
            "Customer_ID": ["C1", "C2"],
            "City": ["Delhi", "Mumbai"],
            "Age_Band": ["18-24", "25-34"],
            "Gender": ["F", "M"],
            "Acquisition_Channel": ["App", "Web"],
            "First_Purchase_Date": ["2024-01-01", "2024-02-01"],
            "Total_Orders": [5, 10],
            "Total_Revenue": [10000, 20000],  # sum = 30000
            "Last_Purchase_Date": ["2024-06-01", "2024-08-01"],
            "Churned": [0, 1],  # 50% churn
        }
    )

    metrics_df = calculate_baseline_metrics(orders, products, customers)
    metric_dict = dict(zip(metrics_df["metric_name"], metrics_df["calculated_value"]))

    assert metric_dict["total_orders"] == "4"
    assert metric_dict["total_order_value_inr"] == "30000.00"
    assert metric_dict["average_order_value_inr"] == "7500.00"
    assert metric_dict["total_ordered_units"] == "1000"
    assert metric_dict["total_returned_units"] == "40"
    assert metric_dict["unit_return_rate_pct"] == "4.0000"
    assert metric_dict["on_time_delivery_rate_pct"] == "75.0000"
    assert metric_dict["delayed_delivery_rate_pct"] == "25.0000"
    assert metric_dict["average_delivery_days"] == "25.00"
    assert metric_dict["repeat_buyer_rate_pct"] == "25.0000"
    assert metric_dict["product_catalogue_count"] == "2"
    assert metric_dict["customer_profiles_count"] == "2"
    assert metric_dict["customer_churn_rate_pct"] == "50.0000"


def test_calculate_monthly_order_trends():
    """Test monthly aggregation calculation."""
    orders = pd.DataFrame(
        {
            "order_id": ["O1", "O2", "O3"],
            "order_date": ["2024-01-10", "2024-01-20", "2024-02-05"],
            "total_value_inr": [1000.0, 2000.0, 5000.0],
            "quantity_units": [10, 20, 50],
            "return_qty": [1, 2, 0],
            "on_time_delivery": [1, 0, 1],
            "repeat_buyer": [0, 1, 0],
            "delivery_days": [5, 15, 8],
        }
    )
    monthly = calculate_monthly_order_trends(orders)
    assert len(monthly) == 2
    jan = monthly[monthly["year_month"] == "2024-01"].iloc[0]
    assert jan["order_count"] == 2
    assert jan["total_value_inr"] == 3000.0
    assert jan["total_ordered_units"] == 30
    assert jan["total_returned_units"] == 3
    assert jan["unit_return_rate_pct"] == 10.0
    assert jan["on_time_delivery_rate_pct"] == 50.0


def test_calculate_category_performance():
    """Test category performance aggregation."""
    orders = pd.DataFrame(
        {
            "order_id": ["O1", "O2"],
            "category": ["Chemicals", "Chemicals"],
            "total_value_inr": [1000.0, 3000.0],
            "quantity_units": [10, 30],
            "return_qty": [1, 2],
            "on_time_delivery": [1, 1],
            "delivery_days": [10, 20],
        }
    )
    cat = calculate_category_performance(orders)
    assert len(cat) == 1
    assert cat.iloc[0]["category"] == "Chemicals"
    assert cat.iloc[0]["total_value_inr"] == 4000.0
    assert cat.iloc[0]["on_time_delivery_rate_pct"] == 100.0


def test_calculate_payment_terms_breakdown():
    """Test payment terms breakdown."""
    orders = pd.DataFrame(
        {
            "order_id": ["O1", "O2"],
            "payment_terms": ["LC", "30 Days Net"],
            "total_value_inr": [5000.0, 10000.0],
            "on_time_delivery": [1, 0],
            "delivery_days": [15, 25],
        }
    )
    pay = calculate_payment_terms_breakdown(orders)
    assert len(pay) == 2
    assert set(pay["payment_terms"]) == {"LC", "30 Days Net"}
