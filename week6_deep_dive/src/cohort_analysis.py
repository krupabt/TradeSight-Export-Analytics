"""B2B Buyer Cohort Retention Analysis Module.

Evaluates commercial account longevity and repeat purchasing dynamics by tracking
monthly acquisition cohorts across the 24-month horizon (Jan 2023 – Dec 2024).
"""

from __future__ import annotations

import logging
from typing import Tuple

import numpy as np
import pandas as pd

logger = logging.getLogger("tradesight.week6.cohort")


def compute_buyer_cohort_matrices(
    orders_df: pd.DataFrame,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Calculate buyer count, retention rate, and revenue cohort matrices."""
    df = orders_df.copy()
    if not np.issubdtype(df["order_date"].dtype, np.datetime64):
        df["order_date"] = pd.to_datetime(df["order_date"])

    df["order_period"] = df["order_date"].dt.to_period("M")

    # Determine initial acquisition cohort month for each buyer
    buyer_cohort = df.groupby("buyer_id")["order_period"].min().reset_index()
    buyer_cohort.columns = ["buyer_id", "cohort_month"]

    df = df.merge(buyer_cohort, on="buyer_id")
    df["cohort_index"] = (df["order_period"] - df["cohort_month"]).apply(lambda x: int(x.n))

    # 1. Buyer count matrix
    cohort_counts = (
        df.groupby(["cohort_month", "cohort_index"])["buyer_id"]
        .nunique()
        .unstack(fill_value=0)
    )

    # 2. Retention percentage matrix
    cohort_sizes = cohort_counts.iloc[:, 0]
    retention_matrix = cohort_counts.divide(cohort_sizes, axis=0) * 100.0
    retention_matrix = retention_matrix.round(2)

    # 3. Revenue retention matrix
    cohort_revenue = (
        df.groupby(["cohort_month", "cohort_index"])["total_value_inr"]
        .sum()
        .unstack(fill_value=0.0)
    )
    cohort_initial_rev = cohort_revenue.iloc[:, 0]
    revenue_retention_matrix = cohort_revenue.divide(cohort_initial_rev, axis=0) * 100.0
    revenue_retention_matrix = revenue_retention_matrix.round(2)

    return cohort_counts, retention_matrix, revenue_retention_matrix


def summarize_cohort_benchmarks(retention_matrix: pd.DataFrame) -> pd.DataFrame:
    """Summarize mean retention benchmarks across milestone horizons (M1, M3, M6, M9, M12)."""
    benchmarks = []
    milestones = [1, 3, 6, 9, 12]

    latest_cohort = retention_matrix.index.max()

    for m in milestones:
        if m in retention_matrix.columns:
            # A cohort is mature for milestone m if cohort_month + m <= latest_cohort
            mature_cohorts = [
                idx for idx in retention_matrix.index if (idx + m) <= latest_cohort
            ]
            if mature_cohorts:
                mature_vals = retention_matrix.loc[mature_cohorts, m].dropna()
                benchmarks.append(
                    {
                        "milestone": f"Month {m} Retention",
                        "eligible_cohorts_count": int(len(mature_vals)),
                        "mean_retention_rate_pct": round(float(mature_vals.mean()), 2),
                        "median_retention_rate_pct": round(float(mature_vals.median()), 2),
                        "min_retention_rate_pct": round(float(mature_vals.min()), 2),
                        "max_retention_rate_pct": round(float(mature_vals.max()), 2),
                    }
                )

    return pd.DataFrame(benchmarks)
