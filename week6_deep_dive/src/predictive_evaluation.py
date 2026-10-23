"""Predictive Modeling Feasibility & Evaluation Module.

Scientifically evaluates whether predictive machine learning models can accurately forecast
export delivery delays from order-time attributes, documenting empirical model metrics
(ROC-AUC, Precision, Recall, F1) to substantiate method selection.
"""

from __future__ import annotations

import logging
from typing import Dict, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger("tradesight.week6.predictive")


def evaluate_delay_predictability(
    orders_df: pd.DataFrame,
    random_state: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, float]]:
    """Train and evaluate baseline ML models to test predictive power on delivery delays."""
    df = orders_df.copy()

    # Target: 1 = Delayed, 0 = On-Time
    df["target_delay"] = (df["on_time_delivery"] == 0).astype(int)

    # Order-time feature engineering (avoiding post-fulfillment data leakage like delivery_days)
    feature_cols = [
        "quantity_units",
        "unit_price_inr",
        "total_value_inr",
        "repeat_buyer",
    ]

    # One-hot encode categorical features
    X_num = df[feature_cols].copy()
    X_cat = pd.get_dummies(df[["category", "payment_terms"]], drop_first=True)
    X = pd.concat([X_num, X_cat], axis=1)
    y = df["target_delay"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=random_state, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    models = {
        "Logistic Regression (L2)": LogisticRegression(
            random_state=random_state, max_iter=1000
        ),
        "Random Forest Classifier": RandomForestClassifier(
            n_estimators=100, max_depth=5, random_state=random_state
        ),
        "Gradient Boosting Classifier": GradientBoostingClassifier(
            n_estimators=100, max_depth=3, random_state=random_state
        ),
    }

    results = []
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)

    for name, model in models.items():
        if "Logistic" in name:
            model.fit(X_train_scaled, y_train)
            preds = model.predict(X_test_scaled)
            probs = model.predict_proba(X_test_scaled)[:, 1]
            cv_scores = cross_val_score(
                model, X_train_scaled, y_train, cv=cv, scoring="roc_auc"
            )
        else:
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            probs = model.predict_proba(X_test)[:, 1]
            cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="roc_auc")

        acc = accuracy_score(y_test, preds)
        prec = precision_score(y_test, preds, zero_division=0)
        rec = recall_score(y_test, preds, zero_division=0)
        f1 = f1_score(y_test, preds, zero_division=0)
        auc = roc_auc_score(y_test, probs)

        results.append(
            {
                "model_name": name,
                "test_accuracy": round(float(acc), 4),
                "test_precision": round(float(prec), 4),
                "test_recall": round(float(rec), 4),
                "test_f1_score": round(float(f1), 4),
                "test_roc_auc": round(float(auc), 4),
                "cv_mean_roc_auc": round(float(cv_scores.mean()), 4),
                "cv_std_roc_auc": round(float(cv_scores.std()), 4),
            }
        )

    model_metrics_df = pd.DataFrame(results)

    # Feature importance from Random Forest
    rf_model = models["Random Forest Classifier"]
    feature_importance_df = pd.DataFrame(
        {
            "feature": X.columns,
            "importance": rf_model.feature_importances_,
        }
    ).sort_values("importance", ascending=False).reset_index(drop=True)
    feature_importance_df["importance"] = feature_importance_df["importance"].round(4)

    summary_stats = {
        "delayed_class_prevalence": round(float(y.mean()), 4),
        "best_cv_auc": round(float(model_metrics_df["cv_mean_roc_auc"].max()), 4),
    }

    return model_metrics_df, feature_importance_df, summary_stats
