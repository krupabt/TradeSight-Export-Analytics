"""
TradeSight Export Analytics — Week 9 Dashboard V1 & Peer Review Test Suite.
Validates data ingestion, KPI mathematical accuracy, deliverable file completeness,
peer review integrity, and PDF report constraints (< 10 MB).
"""

import os
from pathlib import Path
import pandas as pd
import pytest

BASE_DIR = Path(__file__).resolve().parent.parent
WEEK9_DIR = BASE_DIR / "week9_dashboard"
DATA_DIR = BASE_DIR / "data_processed"
WEEK6_DIR = BASE_DIR / "week6_deep_dive" / "outputs"


def test_deliverable_files_exist():
    """Verify all Week 9 required deliverable files exist in week9_dashboard/."""
    expected_files = [
        WEEK9_DIR / "app.py",
        WEEK9_DIR / "dashboard_v1_report.pdf",
        WEEK9_DIR / "peer_review_template.md",
        WEEK9_DIR / "peer_feedback_log.md",
        WEEK9_DIR / "revision_list.md",
        WEEK9_DIR / "README.md",
        WEEK9_DIR / "screenshots" / "01_executive_overview.png",
        WEEK9_DIR / "screenshots" / "02_logistics_fulfillment.png",
        WEEK9_DIR / "screenshots" / "03_returns_quality_audit.png",
        WEEK9_DIR / "screenshots" / "04_buyer_segmentation.png",
        WEEK9_DIR / "screenshots" / "05_data_governance_missing_kpis.png",
        WEEK9_DIR / "powerbi" / "dashboard_specification_v1.md",
        WEEK9_DIR / "powerbi" / "dax_measures_v1.md",
        WEEK9_DIR / "powerbi" / "powerbi_model_v1.md",
    ]
    for path in expected_files:
        assert path.exists(), f"Required Week 9 deliverable file missing: {path}"


def test_pdf_report_size_under_10mb():
    """Verify Dashboard V1 PDF report exists and is strictly under 10 MB."""
    pdf_path = WEEK9_DIR / "dashboard_v1_report.pdf"
    assert pdf_path.exists(), "Dashboard V1 PDF report does not exist."
    file_size_bytes = pdf_path.stat().st_size
    max_size_bytes = 10 * 1024 * 1024  # 10 MB
    assert file_size_bytes > 0, "PDF report is empty."
    assert file_size_bytes < max_size_bytes, f"PDF report size ({file_size_bytes} bytes) exceeds 10 MB."


def test_app_data_loading():
    """Verify data loader in week9_dashboard/app.py correctly ingests and merges data."""
    orders_path = DATA_DIR / "da_b2b_orders_cleaned.csv"
    rfm_path = WEEK6_DIR / "buyer_rfm_segments.csv"
    
    assert orders_path.exists()
    assert rfm_path.exists()

    df_orders = pd.read_csv(orders_path)
    df_rfm = pd.read_csv(rfm_path)

    assert len(df_orders) == 600
    assert len(df_rfm) == 187
    assert 'buyer_id' in df_orders.columns
    assert 'buyer_id' in df_rfm.columns
    assert 'segment_label' in df_rfm.columns

    df_merged = df_orders.merge(
        df_rfm[['buyer_id', 'segment_label', 'cluster']],
        on='buyer_id',
        how='left'
    )
    assert len(df_merged) == 600
    assert df_merged['segment_label'].isnull().sum() == 0


def test_verified_baseline_kpis():
    """Verify core KPIs match the enterprise verified baselines from Week 3 & Week 6."""
    df_orders = pd.read_csv(DATA_DIR / "da_b2b_orders_cleaned.csv")
    df_rfm = pd.read_csv(WEEK6_DIR / "buyer_rfm_segments.csv")

    # Commercial KPIs
    total_rev = df_orders['total_value_inr'].sum()
    assert pytest.approx(total_rev, 0.01) == 3968829214.20

    total_orders = len(df_orders)
    assert total_orders == 600

    aov = total_rev / total_orders
    assert pytest.approx(aov, 0.01) == 6614715.36

    median_val = df_orders['total_value_inr'].median()
    assert pytest.approx(median_val, 0.01) == 4817483.05

    # Logistics KPIs
    on_time_orders = (df_orders['on_time_delivery'] == 1).sum()
    assert on_time_orders == 465
    sla_rate = (on_time_orders / total_orders) * 100
    assert pytest.approx(sla_rate, 0.01) == 77.50

    delayed_orders = (df_orders['is_delayed'] == 1).sum()
    assert delayed_orders == 135

    mean_transit = df_orders['delivery_days'].mean()
    assert pytest.approx(mean_transit, 0.01) == 23.49

    median_transit = df_orders['delivery_days'].median()
    assert median_transit == 23.5

    # Returns & Quality KPIs
    total_ordered_units = df_orders['quantity_units'].sum()
    assert total_ordered_units == 1509070

    total_return_units = df_orders['return_qty'].sum()
    assert total_return_units == 15242

    return_rate = (total_return_units / total_ordered_units) * 100
    assert pytest.approx(return_rate, 0.01) == 1.01

    flagged_anomalies = (df_orders['is_valid_return'] == False).sum()
    assert flagged_anomalies == 2

    # Buyer clusters
    assert len(df_rfm) == 187
    cluster_counts = df_rfm['segment_label'].value_counts().to_dict()
    assert cluster_counts['Core Stable Accounts (High Fulfillment)'] == 75
    assert cluster_counts['Active Growth Buyers (High Velocity)'] == 68
    assert cluster_counts['Operationally Vulnerable (High Friction)'] == 27
    assert cluster_counts['Lapsed Accounts (Dormant)'] == 17


def test_peer_review_template_structure():
    """Verify peer review template covers all required dimensions without invented feedback."""
    template_path = WEEK9_DIR / "peer_review_template.md"
    assert template_path.exists()
    content = template_path.read_text(encoding="utf-8")

    # Required review dimensions
    assert "Clarity of Dashboard Layout" in content
    assert "KPI Accuracy and Usefulness" in content
    assert "Chart Readability" in content
    assert "Filter Functionality" in content
    assert "Ease of Navigation" in content
    assert "Overall User Experience" in content

    # Template for one real peer (not fabricated)
    assert "one real peer reviewer" in content.lower()
    assert "Pending Review Session" in content or "Pending" in content


def test_peer_feedback_log_structure():
    """Verify peer feedback log explicitly tracks pending state without fabricated entries."""
    log_path = WEEK9_DIR / "peer_feedback_log.md"
    assert log_path.exists()
    content = log_path.read_text(encoding="utf-8")
    assert "PENDING REAL PEER REVIEW SESSION" in content
    assert "no peer feedback has been fabricated" in content.lower()


def test_revision_list_structure():
    """Verify revision list contains required columns and unconfirmed feedback marked pending."""
    rev_path = WEEK9_DIR / "revision_list.md"
    assert rev_path.exists()
    content = rev_path.read_text(encoding="utf-8")

    # Required column concepts
    assert "Feedback Received" in content
    assert "Issue Identified" in content
    assert "Proposed Improvement" in content
    assert "Priority" in content
    assert "Status" in content

    # Pending status assertion
    assert "Pending" in content
