"""Automated unit and integration test suite for Week 6 Deep-Dive Analysis."""

from pathlib import Path
import pandas as pd
import pytest

from week6_deep_dive.src.buyer_segmentation import (
    compute_buyer_rfmv_features,
    evaluate_cluster_k,
    perform_buyer_clustering,
)
from week6_deep_dive.src.cohort_analysis import (
    compute_buyer_cohort_matrices,
    summarize_cohort_benchmarks,
)
from week6_deep_dive.src.predictive_evaluation import evaluate_delay_predictability
from week6_deep_dive.src.statistical_testing import run_comprehensive_statistical_tests

PROJECT_ROOT = Path(__file__).resolve().parent.parent
WEEK6_ROOT = PROJECT_ROOT / "week6_deep_dive"


@pytest.fixture
def sample_orders_df() -> pd.DataFrame:
    """Fixture providing cleaned B2B orders dataset."""
    orders_path = PROJECT_ROOT / "data_processed" / "da_b2b_orders_cleaned.csv"
    if not orders_path.is_file():
        orders_path = PROJECT_ROOT / "data" / "da_b2b_orders.csv"
    return pd.read_csv(orders_path)


def test_compute_buyer_rfmv_features(sample_orders_df: pd.DataFrame):
    """Test calculation of buyer-level RFM-V features."""
    rfmv = compute_buyer_rfmv_features(sample_orders_df)

    assert len(rfmv) == sample_orders_df["buyer_id"].nunique()
    assert len(rfmv) == 187
    assert (rfmv["frequency"] >= 1).all()
    assert (rfmv["total_spend_inr"] > 0).all()
    assert (rfmv["recency_days"] >= 0).all()
    assert (rfmv["on_time_rate"] >= 0.0).all() and (rfmv["on_time_rate"] <= 1.0).all()
    assert (rfmv["unit_return_rate"] >= 0.0).all()


def test_evaluate_cluster_k(sample_orders_df: pd.DataFrame):
    """Test clustering evaluation across range of k values."""
    rfmv = compute_buyer_rfmv_features(sample_orders_df)
    eval_df = evaluate_cluster_k(
        rfmv,
        features=["recency_days", "frequency", "total_spend_inr", "on_time_rate"],
        k_range=range(2, 6),
    )

    assert len(eval_df) == 4
    assert list(eval_df["k"]) == [2, 3, 4, 5]
    # Inertia must decrease monotonically as k increases
    assert eval_df["inertia"].is_monotonic_decreasing
    # Silhouette score must be valid [-1, 1]
    assert (eval_df["silhouette_score"] > 0.0).all()


def test_perform_buyer_clustering(sample_orders_df: pd.DataFrame):
    """Test K-Means buyer clustering and profile generation."""
    rfmv = compute_buyer_rfmv_features(sample_orders_df)
    segmented, summary, meta = perform_buyer_clustering(rfmv, n_clusters=4)

    assert len(segmented) == 187
    assert "cluster" in segmented.columns
    assert "segment_label" in segmented.columns
    assert "pca_x" in segmented.columns
    assert "pca_y" in segmented.columns
    assert segmented["segment_label"].isna().sum() == 0

    assert len(summary) == 4
    assert summary["buyer_count"].sum() == 187
    assert round(summary["revenue_share_pct"].sum(), 1) == 100.0

    assert meta["n_clusters"] == 4
    assert meta["silhouette_score"] > 0.20


def test_run_comprehensive_statistical_tests(sample_orders_df: pd.DataFrame):
    """Test that all 8 statistical hypothesis tests execute cleanly."""
    rfmv = compute_buyer_rfmv_features(sample_orders_df)
    segmented, _, _ = perform_buyer_clustering(rfmv, n_clusters=4)

    stat_results = run_comprehensive_statistical_tests(sample_orders_df, segmented)

    assert len(stat_results) == 8
    assert "test_statistic" in stat_results.columns
    assert "p_value" in stat_results.columns
    assert (stat_results["p_value"] >= 0.0).all()
    assert (stat_results["p_value"] <= 1.0).all()

    # Recency and On-time differentiation must be statistically significant
    recency_test = stat_results[stat_results["test_id"] == "STAT-01"].iloc[0]
    assert recency_test["is_significant_at_05"] is True or recency_test["p_value"] < 0.05

    ontime_test = stat_results[stat_results["test_id"] == "STAT-03"].iloc[0]
    assert ontime_test["is_significant_at_05"] is True or ontime_test["p_value"] < 0.05


def test_cohort_matrices(sample_orders_df: pd.DataFrame):
    """Test buyer acquisition cohort matrix computation."""
    counts, retention, rev_retention = compute_buyer_cohort_matrices(sample_orders_df)

    # Initial cohort index 0 must be 100% retention
    assert (retention[0] == 100.0).all()
    assert len(counts) == 24  # 24 months (Jan 2023 - Dec 2024)

    benchmarks = summarize_cohort_benchmarks(retention)
    assert len(benchmarks) > 0
    assert (benchmarks["mean_retention_rate_pct"] >= 0.0).all()


def test_predictive_modeling_evaluation(sample_orders_df: pd.DataFrame):
    """Test predictive delay model evaluation outputs valid metrics."""
    metrics_df, feat_importance, stats = evaluate_delay_predictability(sample_orders_df)

    assert len(metrics_df) == 3
    assert (metrics_df["test_roc_auc"] >= 0.40).all() and (metrics_df["test_roc_auc"] <= 0.70).all()
    assert len(feat_importance) > 0
    assert stats["delayed_class_prevalence"] > 0.15


def test_week6_output_deliverables_exist():
    """Verify all Week 6 deliverable files exist, are non-empty, and PDF is under 10 MB."""
    required_csvs = [
        WEEK6_ROOT / "outputs" / "cluster_k_evaluation.csv",
        WEEK6_ROOT / "outputs" / "buyer_rfm_segments.csv",
        WEEK6_ROOT / "outputs" / "segment_profile_summary.csv",
        WEEK6_ROOT / "outputs" / "statistical_test_results.csv",
        WEEK6_ROOT / "outputs" / "cohort_retention_matrix.csv",
        WEEK6_ROOT / "outputs" / "cohort_benchmarks.csv",
        WEEK6_ROOT / "outputs" / "predictive_model_metrics.csv",
        WEEK6_ROOT / "outputs" / "predictive_feature_importance.csv",
    ]
    for csv_file in required_csvs:
        assert csv_file.is_file(), f"Missing CSV: {csv_file}"
        assert csv_file.stat().st_size > 0, f"Empty CSV: {csv_file}"

    required_viz = [
        WEEK6_ROOT / "visualizations" / "elbow_silhouette_analysis.png",
        WEEK6_ROOT / "visualizations" / "pca_cluster_scatter.png",
        WEEK6_ROOT / "visualizations" / "segment_profiles_bar.png",
        WEEK6_ROOT / "visualizations" / "cohort_retention_heatmap.png",
        WEEK6_ROOT / "visualizations" / "operational_risk_scatter.png",
        WEEK6_ROOT / "visualizations" / "payment_terms_distribution.png",
    ]
    for viz_file in required_viz:
        assert viz_file.is_file(), f"Missing visualization: {viz_file}"
        assert viz_file.stat().st_size > 0, f"Empty visualization: {viz_file}"

    md_report = WEEK6_ROOT / "deep_dive_report.md"
    assert md_report.is_file() and md_report.stat().st_size > 1000

    pdf_report = WEEK6_ROOT / "deep_dive_report.pdf"
    assert pdf_report.is_file()
    pdf_size_mb = pdf_report.stat().st_size / (1024 * 1024)
    assert 0.05 < pdf_size_mb < 10.0, f"PDF file size out of bounds: {pdf_size_mb:.2f} MB"
