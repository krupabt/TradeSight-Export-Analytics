"""Unit tests for data validation module."""

from pathlib import Path
import pandas as pd
import pytest

from src.data_validation import (
    check_cross_dataset_integrity,
    check_file_exists,
    inspect_missing_and_duplicates,
    load_csv_safely,
    safe_parse_dates,
    validate_customer_purchase_dates,
    validate_order_value_calculations,
    validate_required_columns,
    validate_return_quantities,
)


def test_check_file_exists_and_load_csv(tmp_path: Path):
    """Test safe file check and loading."""
    csv_file = tmp_path / "sample.csv"
    csv_file.write_text("col_a,col_b\n1,2\n3,4", encoding="utf-8")

    assert check_file_exists(csv_file) is True
    assert check_file_exists(tmp_path / "non_existent.csv") is False

    df = load_csv_safely(csv_file)
    assert len(df) == 2
    assert list(df.columns) == ["col_a", "col_b"]

    with pytest.raises(FileNotFoundError):
        load_csv_safely(tmp_path / "missing.csv")


def test_validate_required_columns():
    """Test schema column validation."""
    valid_orders_df = pd.DataFrame(
        {
            "order_id": ["B2B-1"],
            "buyer_id": ["BUY-1"],
            "seller_id": ["SEL-1"],
            "category": ["Textiles"],
            "order_date": ["2024-01-01"],
            "quantity_units": [100],
            "unit_price_inr": [50.0],
            "total_value_inr": [5000.0],
            "payment_terms": ["LC"],
            "delivery_days": [10],
            "on_time_delivery": [1],
            "return_qty": [2],
            "repeat_buyer": [0],
        }
    )
    is_valid, missing = validate_required_columns(valid_orders_df, "da_b2b_orders")
    assert is_valid is True
    assert missing == []

    # Incomplete orders
    incomplete_df = valid_orders_df.drop(columns=["return_qty", "unit_price_inr"])
    is_valid, missing = validate_required_columns(incomplete_df, "da_b2b_orders")
    assert is_valid is False
    assert "return_qty" in missing
    assert "unit_price_inr" in missing


def test_safe_parse_dates():
    """Test date parsing and anomaly detection."""
    df = pd.DataFrame(
        {
            "date_col": ["2024-01-15", "invalid-date", "2024-12-31", None],
        }
    )
    parsed_df, errs = safe_parse_dates(df, ["date_col"])
    assert errs["date_col"] == 1  # Exactly 1 unparseable string
    assert pd.notna(parsed_df.loc[0, "date_col"])
    assert pd.isna(parsed_df.loc[1, "date_col"])
    assert pd.notna(parsed_df.loc[2, "date_col"])
    assert pd.isna(parsed_df.loc[3, "date_col"])


def test_validate_return_quantities():
    """Test identifying return quantities exceeding ordered units."""
    df = pd.DataFrame(
        {
            "order_id": ["O1", "O2", "O3"],
            "quantity_units": [100, 25, 50],
            "return_qty": [5, 30, -2],  # O2: 30 > 25, O3: -2 < 0
        }
    )
    invalid = validate_return_quantities(df)
    assert len(invalid) == 2
    assert set(invalid["order_id"]) == {"O2", "O3"}


def test_validate_customer_purchase_dates():
    """Test detecting customer profiles with inverted purchase dates."""
    df = pd.DataFrame(
        {
            "Customer_ID": ["C1", "C2", "C3"],
            "First_Purchase_Date": ["2024-01-01", "2026-05-01", "2025-06-15"],
            "Last_Purchase_Date": ["2024-12-01", "2025-01-01", "2025-06-15"],
        }
    )
    invalid = validate_customer_purchase_dates(df)
    # C2 has First_Purchase_Date (2026-05-01) > Last_Purchase_Date (2025-01-01)
    assert len(invalid) == 1
    assert invalid.iloc[0]["Customer_ID"] == "C2"


def test_validate_order_value_calculations():
    """Test detecting discrepancies between recorded and calculated order value."""
    df = pd.DataFrame(
        {
            "order_id": ["O1", "O2"],
            "quantity_units": [10, 20],
            "unit_price_inr": [100.0, 50.0],
            "total_value_inr": [1000.0, 1500.0],  # O2 expected 1000, recorded 1500
        }
    )
    discrepant = validate_order_value_calculations(df, tolerance=0.05)
    assert len(discrepant) == 1
    assert discrepant.iloc[0]["order_id"] == "O2"


def test_inspect_missing_and_duplicates():
    """Test null cells and duplicate rows detection."""
    df = pd.DataFrame(
        {
            "id": ["1", "2", "2"],
            "val": [10, None, 20],
        }
    )
    res = inspect_missing_and_duplicates(df, "test", primary_key="id")
    assert res["total_null_cells"] == 1
    assert res["primary_key_duplicates"] == 1
    assert res["row_count"] == 3


def test_check_cross_dataset_integrity():
    """Test cross dataset integrity logic verifies disjoint relationships."""
    orders = pd.DataFrame(
        {
            "order_id": ["B2B-1"],
            "buyer_id": ["BUY-0010"],
            "category": ["Textiles"],
            "order_date": ["2024-01-01"],
            "total_value_inr": [100000.0],
        }
    )
    products = pd.DataFrame(
        {
            "Product_ID": ["P1"],
            "Category": ["Beauty"],
        }
    )
    customers = pd.DataFrame(
        {
            "Customer_ID": ["C1"],
            "First_Purchase_Date": ["2025-01-01"],
            "Last_Purchase_Date": ["2025-05-01"],
            "Total_Revenue": [5000],
        }
    )
    res = check_cross_dataset_integrity(orders, products, customers)
    assert res["is_relational_schema"] is False
    assert res["direct_buyer_match_count"] == 0
    assert len(res["category_overlap"]) == 0
    assert res["has_product_id_in_orders"] is False
