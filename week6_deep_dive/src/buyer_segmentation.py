"""B2B Commercial Buyer Segmentation & Behavioral Value Profiling Module.

Applies RFM-V (Recency, Frequency, Monetary Value, Volume, and Operational Risk)
feature engineering and K-Means clustering to segment the 187 commercial buyers
into actionable strategic tiers for export management.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger("tradesight.week6.segmentation")


def compute_buyer_rfmv_features(orders_df: pd.DataFrame) -> pd.DataFrame:
    """Compute Recency, Frequency, Monetary, Volume, and Operational Risk features per buyer."""
    df = orders_df.copy()
    if not np.issubdtype(df["order_date"].dtype, np.datetime64):
        df["order_date"] = pd.to_datetime(df["order_date"])

    ref_date = df["order_date"].max()

    def get_mode(series: pd.Series) -> str:
        m = series.mode()
        return str(m.iloc[0]) if len(m) > 0 else "Unknown"

    buyer_grp = df.groupby("buyer_id")

    buyer_metrics = buyer_grp.agg(
        recency_days=("order_date", lambda x: int((ref_date - x.max()).days)),
        first_order_date=("order_date", "min"),
        latest_order_date=("order_date", "max"),
        frequency=("order_id", "count"),
        total_spend_inr=("total_value_inr", "sum"),
        avg_order_value_inr=("total_value_inr", "mean"),
        total_ordered_units=("quantity_units", "sum"),
        total_returned_units=("return_qty", "sum"),
        avg_delivery_days=("delivery_days", "mean"),
        on_time_orders=("on_time_delivery", "sum"),
        credit_60d_orders=("payment_terms", lambda x: int((x == "60 Days Net").sum())),
        primary_category=("category", get_mode),
        primary_payment_term=("payment_terms", get_mode),
    ).reset_index()

    buyer_metrics["on_time_rate"] = (
        buyer_metrics["on_time_orders"] / buyer_metrics["frequency"]
    ).round(4)
    buyer_metrics["delay_rate"] = (1.0 - buyer_metrics["on_time_rate"]).round(4)
    buyer_metrics["unit_return_rate"] = np.where(
        buyer_metrics["total_ordered_units"] > 0,
        (buyer_metrics["total_returned_units"] / buyer_metrics["total_ordered_units"]).round(6),
        0.0,
    )
    buyer_metrics["pct_60d_net"] = (
        buyer_metrics["credit_60d_orders"] / buyer_metrics["frequency"]
    ).round(4)
    buyer_metrics["tenure_days"] = (
        buyer_metrics["latest_order_date"] - buyer_metrics["first_order_date"]
    ).dt.days

    return buyer_metrics


def evaluate_cluster_k(
    buyer_df: pd.DataFrame,
    features: List[str],
    k_range: range = range(2, 7),
    random_state: int = 42,
) -> pd.DataFrame:
    """Evaluate Inertia (Elbow) and Silhouette scores across a range of k values."""
    X = buyer_df[features].copy()
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    results = []
    for k in k_range:
        km = KMeans(n_clusters=k, random_state=random_state, n_init=10)
        labels = km.fit_predict(X_scaled)
        sil = silhouette_score(X_scaled, labels)
        results.append(
            {
                "k": k,
                "inertia": round(float(km.inertia_), 2),
                "silhouette_score": round(float(sil), 4),
            }
        )

    return pd.DataFrame(results)


def perform_buyer_clustering(
    buyer_df: pd.DataFrame,
    n_clusters: int = 4,
    random_state: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
    """Execute K-Means clustering, assign interpretable segment labels, and summarize profiles."""
    df = buyer_df.copy()

    # Log transform right-skewed monetary variables to stabilize variance
    df["log_total_spend"] = np.log1p(df["total_spend_inr"])
    df["log_aov"] = np.log1p(df["avg_order_value_inr"])

    cluster_features = [
        "recency_days",
        "frequency",
        "log_total_spend",
        "on_time_rate",
    ]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df[cluster_features])

    km = KMeans(n_clusters=n_clusters, random_state=random_state, n_init=15)
    cluster_labels = km.fit_predict(X_scaled)
    df["cluster"] = cluster_labels

    # Compute 2D PCA projection for visualization
    pca = PCA(n_components=2, random_state=random_state)
    pca_coords = pca.fit_transform(X_scaled)
    df["pca_x"] = pca_coords[:, 0].round(4)
    df["pca_y"] = pca_coords[:, 1].round(4)

    explained_var = [round(float(v), 4) for v in pca.explained_variance_ratio_]

    # Map raw cluster numbers to business segment labels based on behavioral attributes
    segment_profiles = df.groupby("cluster").agg(
        buyer_count=("buyer_id", "count"),
        mean_recency=("recency_days", "mean"),
        mean_freq=("frequency", "mean"),
        mean_spend=("total_spend_inr", "mean"),
        total_spend=("total_spend_inr", "sum"),
        mean_on_time=("on_time_rate", "mean"),
        mean_return_rate=("unit_return_rate", "mean"),
        mean_delivery_days=("avg_delivery_days", "mean"),
    )

    # Dynamic labeling based on cluster center characteristics
    label_map = {}
    for c_id, row in segment_profiles.iterrows():
        if row["mean_on_time"] < 0.50:
            label_map[c_id] = "Operationally Vulnerable (High Friction)"
        elif row["mean_recency"] > 400:
            label_map[c_id] = "Lapsed Accounts (Dormant)"
        elif row["mean_recency"] < 150 and row["mean_freq"] >= 3.0:
            label_map[c_id] = "Active Growth Buyers (High Velocity)"
        else:
            label_map[c_id] = "Core Stable Accounts (High Fulfillment)"

    df["segment_label"] = df["cluster"].map(label_map)

    # Create detailed summary table
    summary = df.groupby(["cluster", "segment_label"]).agg(
        buyer_count=("buyer_id", "count"),
        total_revenue_inr=("total_spend_inr", "sum"),
        mean_spend_inr=("total_spend_inr", "mean"),
        median_spend_inr=("total_spend_inr", "median"),
        mean_order_count=("frequency", "mean"),
        mean_recency_days=("recency_days", "mean"),
        mean_on_time_rate=("on_time_rate", "mean"),
        mean_return_rate=("unit_return_rate", "mean"),
        mean_delivery_days=("avg_delivery_days", "mean"),
        pct_60d_net_exposure=("pct_60d_net", "mean"),
    ).reset_index()

    summary["revenue_share_pct"] = (
        (summary["total_revenue_inr"] / df["total_spend_inr"].sum()) * 100
    ).round(2)
    summary["buyer_share_pct"] = (
        (summary["buyer_count"] / len(df)) * 100
    ).round(2)

    meta = {
        "n_clusters": n_clusters,
        "features_used": cluster_features,
        "silhouette_score": round(float(silhouette_score(X_scaled, cluster_labels)), 4),
        "inertia": round(float(km.inertia_), 2),
        "pca_variance_ratio": explained_var,
    }

    return df, summary, meta
