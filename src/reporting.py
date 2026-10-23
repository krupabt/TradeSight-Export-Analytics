"""Weekly Exception Reporting Module for TradeSight Export Analytics.

Identifies operational delivery delays, return anomalies, and data quality issues.
Generates dated CSV and Markdown exception summaries, with optional SMTP alerting
and Windows Task Scheduler instructions.
"""

from __future__ import annotations

import datetime
import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd

logger = logging.getLogger("tradesight.reporting")


def generate_weekly_exceptions(
    orders_df: pd.DataFrame, customers_df: pd.DataFrame
) -> pd.DataFrame:
    """Identify all operational and data quality exceptions across datasets.

    Note: These are operational and data-quality anomalies, not legal compliance violations.
    """
    exceptions: List[Dict[str, Any]] = []

    # 1. Invalid Return Quantity Exceptions (Logical Anomaly)
    invalid_returns = orders_df[orders_df["return_qty"] > orders_df["quantity_units"]]
    for _, row in invalid_returns.iterrows():
        exceptions.append(
            {
                "exception_id": f"EXC-RET-{row['order_id']}",
                "exception_category": "Data Quality - Logical Inconsistency",
                "severity": "CRITICAL",
                "source_dataset": "da_b2b_orders",
                "record_id": row["order_id"],
                "buyer_or_entity": row["buyer_id"],
                "category": row["category"],
                "order_date": str(row["order_date"]),
                "metric_impacted": "return_qty vs quantity_units",
                "observed_value": f"Returned: {row['return_qty']} > Ordered: {row['quantity_units']}",
                "threshold_or_rule": "return_qty must be <= quantity_units",
                "recommended_action": "Audit warehouse return receipt against order manifest; adjust return_qty in source ERP.",
            }
        )

    # 2. Customer Profile Date Inversions (CRM Chronological Anomaly)
    fp = pd.to_datetime(customers_df["First_Purchase_Date"], errors="coerce")
    lp = pd.to_datetime(customers_df["Last_Purchase_Date"], errors="coerce")
    inverted_customers = customers_df[fp > lp]
    for _, row in inverted_customers.iterrows():
        exceptions.append(
            {
                "exception_id": f"EXC-DATE-{row['Customer_ID']}",
                "exception_category": "Data Quality - Chronological Inversion",
                "severity": "HIGH",
                "source_dataset": "da_customer_profiles",
                "record_id": row["Customer_ID"],
                "buyer_or_entity": f"City: {row['City']}, Channel: {row['Acquisition_Channel']}",
                "category": "Customer Profile",
                "order_date": str(row["First_Purchase_Date"]),
                "metric_impacted": "First_Purchase_Date vs Last_Purchase_Date",
                "observed_value": f"First: {row['First_Purchase_Date']} > Last: {row['Last_Purchase_Date']}",
                "threshold_or_rule": "First_Purchase_Date must be <= Last_Purchase_Date",
                "recommended_action": "Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp.",
            }
        )

    # 3. Delivery Delays on High-Risk Credit Terms (Working Capital Exposure)
    credit_delay = orders_df[
        (orders_df["payment_terms"] == "60 Days Net")
        & (orders_df["on_time_delivery"] == 0)
    ]
    for _, row in credit_delay.iterrows():
        exceptions.append(
            {
                "exception_id": f"EXC-CREDIT-{row['order_id']}",
                "exception_category": "Logistics - Credit Term Delay Risk",
                "severity": "MEDIUM",
                "source_dataset": "da_b2b_orders",
                "record_id": row["order_id"],
                "buyer_or_entity": row["buyer_id"],
                "category": row["category"],
                "order_date": str(row["order_date"]),
                "metric_impacted": "on_time_delivery on 60 Days Net",
                "observed_value": f"Transit: {row['delivery_days']} days, Value: INR {row['total_value_inr']:,.2f}",
                "threshold_or_rule": "on_time_delivery == 1 for deferred credit terms",
                "recommended_action": "Notify freight forwarder and credit control team; verify proof of delivery before 60-day invoice clock starts.",
            }
        )

    # 4. Severe Transit Delays (delivery_days >= 40)
    severe_transit = orders_df[orders_df["delivery_days"] >= 40]
    for _, row in severe_transit.iterrows():
        exceptions.append(
            {
                "exception_id": f"EXC-TRANSIT-{row['order_id']}",
                "exception_category": "Logistics - Extended Transit Exception",
                "severity": "LOW" if row["on_time_delivery"] == 1 else "MEDIUM",
                "source_dataset": "da_b2b_orders",
                "record_id": row["order_id"],
                "buyer_or_entity": row["buyer_id"],
                "category": row["category"],
                "order_date": str(row["order_date"]),
                "metric_impacted": "delivery_days",
                "observed_value": f"Transit: {row['delivery_days']} days, On-time Flag: {row['on_time_delivery']}",
                "threshold_or_rule": "delivery_days < 40 days standard threshold",
                "recommended_action": "Review shipping lane logistics, port congestion, and customs clearance lead times.",
            }
        )

    return pd.DataFrame(exceptions)


def build_weekly_markdown_report(
    exceptions_df: pd.DataFrame,
    report_date: str,
    orders_df: pd.DataFrame,
) -> str:
    """Generate Markdown report for weekly exception monitoring."""
    total_exceptions = len(exceptions_df)
    by_category = (
        exceptions_df["exception_category"].value_counts().to_dict()
        if total_exceptions > 0
        else {}
    )
    by_severity = (
        exceptions_df["severity"].value_counts().to_dict()
        if total_exceptions > 0
        else {}
    )

    total_orders = len(orders_df)
    delayed_orders_count = int((orders_df["on_time_delivery"] == 0).sum())
    delay_rate = (delayed_orders_count / total_orders * 100) if total_orders > 0 else 0.0

    lines = [
        f"# TradeSight Export Analytics — Weekly Operational Exception Report",
        f"**Report Generation Date:** {report_date}  ",
        f"**Target Audience:** Export Operations Director, Logistics Lead, Data Governance Team  ",
        f"**Scope:** Operational shipment performance and data quality exceptions  ",
        "",
        "> [!IMPORTANT]",
        "> Exceptions listed herein represent operational delivery delays, data hygiene anomalies, and logistics thresholds.",
        "> They do **not** represent proven legal, customs, or regulatory non-compliance violations.",
        "",
        "## 1. Executive Summary & Exception Counts",
        "",
        f"- **Total Monitored Orders:** {total_orders:,}",
        f"- **Total Delivery Delays:** {delayed_orders_count} ({delay_rate:.2f}% of orders)",
        f"- **Total Flagged Exception Records:** {total_exceptions}",
        "",
        "### Breakdown by Severity",
        "| Severity Level | Count | Action Required |",
        "| :--- | :--- | :--- |",
        f"| **CRITICAL** | {by_severity.get('CRITICAL', 0)} | Immediate ERP correction: return quantity exceeds ordered volume |",
        f"| **HIGH** | {by_severity.get('HIGH', 0)} | CRM data reconciliation: first purchase date after last purchase date |",
        f"| **MEDIUM** | {by_severity.get('MEDIUM', 0)} | Logistics & Credit review: delays on 60 Days Net or extended transit |",
        f"| **LOW** | {by_severity.get('LOW', 0)} | Informational monitoring: on-time shipments with extended transit |",
        "",
        "### Breakdown by Category",
        "| Exception Category | Count | Description |",
        "| :--- | :--- | :--- |",
    ]

    for cat_name, cnt in by_category.items():
        lines.append(f"| {cat_name} | {cnt} | Operational or data anomaly identified in pipeline |")

    lines.extend(
        [
            "",
            "## 2. Critical & High Priority Exceptions Detail",
            "",
            "| Exception ID | Dataset | Record ID | Entity | Category | Observed Value | Recommended Action |",
            "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
        ]
    )

    crit_high = exceptions_df[exceptions_df["severity"].isin(["CRITICAL", "HIGH"])]
    if len(crit_high) == 0:
        lines.append("| None | - | - | - | - | - | No critical exceptions detected. |")
    else:
        for _, r in crit_high.head(25).iterrows():
            lines.append(
                f"| `{r['exception_id']}` | `{r['source_dataset']}` | `{r['record_id']}` | {r['buyer_or_entity']} | {r['category']} | {r['observed_value']} | {r['recommended_action']} |"
            )

    if len(crit_high) > 25:
        lines.append(
            f"\n*Note: Displaying first 25 of {len(crit_high)} critical/high exceptions. Complete listing available in the accompanied CSV export.*"
        )

    lines.extend(
        [
            "",
            "## 3. Logistics Working Capital Exposure (Delays on 60 Days Net)",
            "",
            "When orders with deferred payment terms (`60 Days Net`) encounter delivery delays, working capital cash conversion cycles are significantly extended.",
            "",
            "| Order ID | Buyer ID | Category | Transit Days | Order Value (INR) |",
            "| :--- | :--- | :--- | :--- | :--- |",
        ]
    )

    credit_exceptions = exceptions_df[
        exceptions_df["exception_category"] == "Logistics - Credit Term Delay Risk"
    ]
    if len(credit_exceptions) == 0:
        lines.append("| None | - | - | - | - |")
    else:
        for _, r in credit_exceptions.iterrows():
            lines.append(
                f"| `{r['record_id']}` | {r['buyer_or_entity']} | {r['category']} | {r['observed_value']} | Follow up with buyer |"
            )

    lines.extend(
        [
            "",
            "## 4. Scheduling & Automated Distribution",
            "",
            "### Windows Task Scheduler Setup",
            "To execute this exception generator automatically every Monday at 08:00 AM:",
            "",
            "```powershell",
            "# In an elevated PowerShell terminal:",
            '$Action = New-ScheduledTaskAction -Execute "python.exe" -Argument "D:\\TradeSight-Export-Analytics\\src\\pipeline.py"',
            '$Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 08:00AM',
            '$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable',
            'Register-ScheduledTask -TaskName "TradeSight_Weekly_Exception_Report" -Action $Action -Trigger $Trigger -Settings $Settings -Description "Runs weekly data pipeline and exception generator"',
            "```",
            "",
            "### Safe SMTP Configuration",
            "To enable automated weekly email dispatch, configure `.env` with valid credentials:",
            "",
            "```ini",
            "SMTP_SERVER=smtp.gmail.com",
            "SMTP_PORT=587",
            "SMTP_USE_TLS=True",
            "SMTP_USER=alerts@tradesight-export.com",
            "SMTP_PASSWORD=your_secure_app_password",
            "ALERT_RECIPIENTS=operations@tradesight-export.com,management@tradesight-export.com",
            "APP_ENV=production",
            "```",
            "",
            "---",
            "*Report generated automatically by TradeSight Export Analytics Pipeline v1.0.0.*",
        ]
    )

    return "\n".join(lines)


def send_smtp_alert(
    subject: str,
    body_markdown: str,
    recipient_list: List[str] | None = None,
) -> bool:
    """Send an email alert via SMTP if explicitly configured and permitted.

    Safely guards against sending emails in development mode or without credentials.
    """
    app_env = os.getenv("APP_ENV", "development").lower()
    if app_env != "production":
        logger.info(
            f"SMTP email dispatch skipped: APP_ENV is '{app_env}' (requires 'production')."
        )
        return False

    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    use_tls = os.getenv("SMTP_USE_TLS", "True").lower() == "true"
    sender = os.getenv("REPORT_SENDER", smtp_user)

    if not smtp_server or not smtp_user or not smtp_password:
        logger.warning(
            "SMTP credentials not fully configured in environment. Email alert skipped."
        )
        return False

    if not recipient_list:
        recipients_env = os.getenv("ALERT_RECIPIENTS", "")
        recipient_list = [r.strip() for r in recipients_env.split(",") if r.strip()]

    if not recipient_list:
        logger.warning("No recipient email addresses provided. Email alert skipped.")
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = sender
        msg["To"] = ", ".join(recipient_list)
        msg["Subject"] = subject
        msg.attach(MIMEText(body_markdown, "plain"))

        with smtplib.SMTP(smtp_server, smtp_port, timeout=15) as server:
            if use_tls:
                server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(sender, recipient_list, msg.as_string())

        logger.info(f"Weekly exception alert email sent successfully to {recipient_list}")
        return True
    except Exception as e:
        logger.error(f"Failed to send SMTP email: {e}")
        return False
