"""Visualization Generation Module for TradeSight Week 6 Deep-Dive.

Renders 6 high-resolution charts saved into week6_deep_dive/visualizations/
for integration into executive reports, presentations, and PDF deliverables.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import List

import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

logger = logging.getLogger("tradesight.week6.viz")

# Palette constants
PALETTE = {
    "Core Stable Accounts (High Fulfillment)": "#2A9D8F",  # Teal/Emerald
    "Active Growth Buyers (High Velocity)": "#264653",     # Deep Navy
    "Lapsed Accounts (Dormant)": "#E76F51",               # Coral/Orange
    "Operationally Vulnerable (High Friction)": "#E63946",# Crimson Red
}


def plot_elbow_and_silhouette(
    eval_df: pd.DataFrame,
    output_path: Path | str,
) -> None:
    """Plot Inertia (Elbow) and Silhouette Score on dual y-axes."""
    fig, ax1 = plt.subplots(figsize=(8, 5), dpi=300)

    color_inertia = "#264653"
    color_sil = "#E76F51"

    ax1.set_xlabel("Number of Clusters (k)", fontsize=11, fontweight="bold")
    ax1.set_ylabel("Inertia (Sum of Squared Distances)", color=color_inertia, fontsize=11, fontweight="bold")
    line1 = ax1.plot(
        eval_df["k"],
        eval_df["inertia"],
        marker="o",
        color=color_inertia,
        linewidth=2.5,
        markersize=8,
        label="Inertia (Elbow)",
    )
    ax1.tick_params(axis="y", labelcolor=color_inertia)
    ax1.grid(True, linestyle="--", alpha=0.5)

    ax2 = ax1.twinx()
    ax2.set_ylabel("Silhouette Score", color=color_sil, fontsize=11, fontweight="bold")
    line2 = ax2.plot(
        eval_df["k"],
        eval_df["silhouette_score"],
        marker="s",
        color=color_sil,
        linewidth=2.5,
        linestyle="--",
        markersize=8,
        label="Silhouette Score",
    )
    ax2.tick_params(axis="y", labelcolor=color_sil)

    # Highlight optimal k=4
    ax1.axvline(x=4, color="#FFB703", linestyle=":", linewidth=2, label="Selected k=4")

    lines = line1 + line2
    labels = [l.get_label() for l in lines]
    ax1.legend(lines + [plt.Line2D([0], [0], color="#FFB703", linestyle=":")], labels + ["Selected k=4"], loc="upper right")

    plt.title("Cluster Evaluation: Elbow Method & Silhouette Analysis", fontsize=13, fontweight="bold", pad=15)
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
    logger.info(f"Saved: {output_path}")


def plot_pca_clusters(
    segmented_df: pd.DataFrame,
    output_path: Path | str,
) -> None:
    """Plot 2D PCA scatter of segmented commercial buyers."""
    plt.figure(figsize=(9, 6), dpi=300)

    segments = segmented_df["segment_label"].unique()
    for seg in sorted(segments):
        sub = segmented_df[segmented_df["segment_label"] == seg]
        plt.scatter(
            sub["pca_x"],
            sub["pca_y"],
            label=f"{seg} (n={len(sub)})",
            color=PALETTE.get(seg, "#457B9D"),
            alpha=0.85,
            s=70,
            edgecolors="w",
            linewidth=0.8,
        )

    plt.axhline(0, color="gray", linestyle="--", alpha=0.4, linewidth=0.8)
    plt.axvline(0, color="gray", linestyle="--", alpha=0.4, linewidth=0.8)

    plt.title("2D Principal Component Projection of B2B Commercial Buyers", fontsize=13, fontweight="bold", pad=12)
    plt.xlabel("Principal Component 1 (Recency & Frequency Variance)", fontsize=11, fontweight="bold")
    plt.ylabel("Principal Component 2 (Monetary & Fulfillment Variance)", fontsize=11, fontweight="bold")
    plt.legend(title="Buyer Segments", loc="upper right", frameon=True, fontsize=9)
    plt.grid(True, linestyle="--", alpha=0.4)
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
    logger.info(f"Saved: {output_path}")


def plot_segment_profile_bars(
    summary_df: pd.DataFrame,
    output_path: Path | str,
) -> None:
    """Plot 4-panel comparison of segment characteristics."""
    fig, axes = plt.subplots(2, 2, figsize=(12, 8), dpi=300)

    # Sort consistent with palette
    df_sorted = summary_df.copy()
    labels = df_sorted["segment_label"]
    colors = [PALETTE.get(l, "#457B9D") for l in labels]

    # Panel 1: Revenue Share %
    axes[0, 0].barh(labels, df_sorted["revenue_share_pct"], color=colors, edgecolor="black", alpha=0.85)
    axes[0, 0].set_title("Share of Total B2B Revenue (%)", fontsize=11, fontweight="bold")
    axes[0, 0].set_xlabel("Revenue Share %")
    for i, v in enumerate(df_sorted["revenue_share_pct"]):
        axes[0, 0].text(v + 0.5, i, f"{v:.1f}%", va="center", fontsize=9, fontweight="bold")

    # Panel 2: Mean Spend in Millions INR
    spend_m = df_sorted["mean_spend_inr"] / 1e6
    axes[0, 1].barh(labels, spend_m, color=colors, edgecolor="black", alpha=0.85)
    axes[0, 1].set_title("Average Spend Per Buyer (₹ Millions INR)", fontsize=11, fontweight="bold")
    axes[0, 1].set_xlabel("Spend (₹ M)")
    for i, v in enumerate(spend_m):
        axes[0, 1].text(v + 0.3, i, f"₹{v:.1f}M", va="center", fontsize=9, fontweight="bold")

    # Panel 3: Mean Order Frequency
    axes[1, 0].barh(labels, df_sorted["mean_order_count"], color=colors, edgecolor="black", alpha=0.85)
    axes[1, 0].set_title("Average Order Frequency (Orders/Buyer)", fontsize=11, fontweight="bold")
    axes[1, 0].set_xlabel("Mean Orders")
    for i, v in enumerate(df_sorted["mean_order_count"]):
        axes[1, 0].text(v + 0.05, i, f"{v:.2f}", va="center", fontsize=9, fontweight="bold")

    # Panel 4: On-Time Delivery Rate %
    ontime_pct = df_sorted["mean_on_time_rate"] * 100.0
    axes[1, 1].barh(labels, ontime_pct, color=colors, edgecolor="black", alpha=0.85)
    axes[1, 1].axvline(80, color="red", linestyle=":", label="80% SLA Target")
    axes[1, 1].set_title("Fulfillment SLA (On-Time Delivery %)", fontsize=11, fontweight="bold")
    axes[1, 1].set_xlabel("On-Time Rate %")
    axes[1, 1].legend(loc="lower right")
    for i, v in enumerate(ontime_pct):
        axes[1, 1].text(v + 1.0, i, f"{v:.1f}%", va="center", fontsize=9, fontweight="bold")

    plt.suptitle("TradeSight Commercial Buyer Segment Profiles", fontsize=14, fontweight="bold", y=0.99)
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
    logger.info(f"Saved: {output_path}")


def plot_cohort_retention_heatmap(
    retention_matrix: pd.DataFrame,
    output_path: Path | str,
) -> None:
    """Plot monthly buyer cohort retention heatmap."""
    plt.figure(figsize=(14, 8), dpi=300)

    # Convert period index to string
    plot_df = retention_matrix.copy()
    plot_df.index = [str(idx) for idx in plot_df.index]

    # Limit to first 12 cohort indices for visual clarity
    cols = [c for c in plot_df.columns if c <= 12]
    plot_df = plot_df[cols]

    sns.heatmap(
        plot_df,
        annot=True,
        fmt=".1f",
        cmap="YlGnBu",
        cbar_kws={"label": "Buyer Retention Rate (%)"},
        linewidths=0.5,
        annot_kws={"size": 8},
    )

    plt.title("B2B Buyer Monthly Acquisition Cohort Retention (Months 0–12)", fontsize=13, fontweight="bold", pad=12)
    plt.xlabel("Cohort Period (Months Since First Order)", fontsize=11, fontweight="bold")
    plt.ylabel("Acquisition Cohort Month", fontsize=11, fontweight="bold")
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
    logger.info(f"Saved: {output_path}")


def plot_operational_risk_scatter(
    segmented_df: pd.DataFrame,
    output_path: Path | str,
) -> None:
    """Plot Commercial Spend vs On-Time Delivery Rate quadrant."""
    plt.figure(figsize=(10, 6), dpi=300)

    for seg in sorted(segmented_df["segment_label"].unique()):
        sub = segmented_df[segmented_df["segment_label"] == seg]
        plt.scatter(
            sub["total_spend_inr"] / 1e6,
            sub["on_time_rate"] * 100.0,
            label=seg,
            color=PALETTE.get(seg, "#457B9D"),
            alpha=0.8,
            s=sub["frequency"] * 30,
            edgecolors="w",
            linewidth=0.8,
        )

    # Reference threshold lines
    plt.axvline(20, color="gray", linestyle="--", alpha=0.6, label="₹20M High-Spend Threshold")
    plt.axhline(75, color="red", linestyle="--", alpha=0.6, label="75% Critical SLA Threshold")

    # Annotate risk quadrant
    plt.text(
        35, 30,
        "CRITICAL AT-RISK ZONE\n(High Spend + Low Delivery SLA)",
        fontsize=10,
        fontweight="bold",
        color="#E63946",
        bbox=dict(boxstyle="round,pad=0.5", facecolor="#FFE3E3", edgecolor="#E63946", alpha=0.9),
    )

    plt.title("Account Risk Quadrant: Total Spend vs Fulfillment Reliability", fontsize=13, fontweight="bold", pad=12)
    plt.xlabel("Total Commercial Spend (₹ Millions INR)", fontsize=11, fontweight="bold")
    plt.ylabel("On-Time Delivery Rate (%)", fontsize=11, fontweight="bold")
    plt.legend(title="Buyer Segment (bubble size = order count)", loc="lower left", frameon=True, fontsize=9)
    plt.grid(True, linestyle="--", alpha=0.4)
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
    logger.info(f"Saved: {output_path}")


def plot_payment_terms_by_segment(
    segmented_df: pd.DataFrame,
    orders_df: pd.DataFrame,
    output_path: Path | str,
) -> None:
    """Plot payment terms composition across buyer segments."""
    merged = orders_df.merge(segmented_df[["buyer_id", "segment_label"]], on="buyer_id")
    crosstab = pd.crosstab(merged["segment_label"], merged["payment_terms"], normalize="index") * 100.0

    plt.figure(figsize=(10, 6), dpi=300)
    crosstab.plot(
        kind="bar",
        stacked=True,
        figsize=(10, 6),
        colormap="Spectral",
        edgecolor="black",
        alpha=0.9,
    )

    plt.title("Contracted Payment Terms Composition by Buyer Segment", fontsize=13, fontweight="bold", pad=12)
    plt.xlabel("Buyer Segment", fontsize=11, fontweight="bold")
    plt.ylabel("Proportion of Orders (%)", fontsize=11, fontweight="bold")
    plt.legend(title="Payment Terms", bbox_to_anchor=(1.02, 1), loc="upper left")
    plt.xticks(rotation=20, ha="right")
    plt.grid(axis="y", linestyle="--", alpha=0.5)
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
    logger.info(f"Saved: {output_path}")
