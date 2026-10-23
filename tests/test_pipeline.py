"""Integration tests for TradeSight pipeline execution and idempotency."""

from pathlib import Path
import pandas as pd
import pytest

from src.pipeline import PROJECT_ROOT, run_pipeline


def test_pipeline_execution_and_output_generation():
    """Test full pipeline runs successfully and generates all required outputs."""
    exit_code = run_pipeline()
    assert exit_code == 0

    # Required output files
    expected_outputs = [
        PROJECT_ROOT / "outputs" / "data_inventory.csv",
        PROJECT_ROOT / "outputs" / "baseline_metrics.csv",
        PROJECT_ROOT / "outputs" / "data_quality_report.json",
        PROJECT_ROOT / "outputs" / "cleaning_log.csv",
        PROJECT_ROOT / "reports" / "baseline_report.md",
        PROJECT_ROOT / "data_processed" / "da_b2b_orders_cleaned.csv",
        PROJECT_ROOT / "data_processed" / "da_customer_profiles_cleaned.csv",
        PROJECT_ROOT / "data_processed" / "da_product_catalogue_cleaned.csv",
    ]

    for out_file in expected_outputs:
        assert out_file.is_file(), f"Expected output missing: {out_file}"
        assert out_file.stat().st_size > 0, f"Output file is empty: {out_file}"


def test_pipeline_idempotency():
    """Test that running the pipeline multiple times yields identical results."""
    # First execution
    assert run_pipeline() == 0
    metrics_path = PROJECT_ROOT / "outputs" / "baseline_metrics.csv"
    first_metrics = pd.read_csv(metrics_path)

    # Second execution
    assert run_pipeline() == 0
    second_metrics = pd.read_csv(metrics_path)

    # Verify byte/value equality
    pd.testing.assert_frame_equal(first_metrics, second_metrics)


def test_processed_data_integrity():
    """Verify that processed data preserves original rows and correctly appends flags."""
    raw_orders = pd.read_csv(PROJECT_ROOT / "data" / "da_b2b_orders.csv")
    cleaned_orders = pd.read_csv(PROJECT_ROOT / "data_processed" / "da_b2b_orders_cleaned.csv")

    assert len(raw_orders) == len(cleaned_orders)
    assert "data_quality_flag" in cleaned_orders.columns
    assert "is_valid_return" in cleaned_orders.columns

    # Verify the 2 known suspicious records are preserved
    bad_returns = cleaned_orders[cleaned_orders["is_valid_return"] == False]
    assert len(bad_returns) == 2
    assert set(bad_returns["order_id"]) == {"B2B-00131", "B2B-00188"}
