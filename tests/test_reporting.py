"""Unit tests for reporting and exception handling."""

import os
import pandas as pd
import pytest

from src.reporting import (
    build_weekly_markdown_report,
    generate_weekly_exceptions,
    send_smtp_alert,
)


def test_generate_weekly_exceptions():
    """Test weekly exception detection on return overruns and date inversions."""
    orders = pd.DataFrame(
        {
            "order_id": ["O1", "O2", "O3"],
            "buyer_id": ["B1", "B2", "B3"],
            "category": ["Textiles", "Packaging", "Raw Materials"],
            "order_date": ["2024-01-01", "2024-02-01", "2024-03-01"],
            "quantity_units": [10, 50, 100],
            "return_qty": [25, 5, 0],  # O1 is return overrun (25 > 10)
            "payment_terms": ["LC", "60 Days Net", "Advance"],
            "delivery_days": [10, 42, 20],  # O2 is 60 Days Net delay and >= 40 days
            "on_time_delivery": [1, 0, 1],  # O2 is delayed
            "total_value_inr": [1000, 5000, 2000],
        }
    )
    customers = pd.DataFrame(
        {
            "Customer_ID": ["C1", "C2"],
            "City": ["Chennai", "Delhi"],
            "Acquisition_Channel": ["App", "Web"],
            "First_Purchase_Date": ["2026-01-01", "2024-01-01"],
            "Last_Purchase_Date": ["2025-01-01", "2025-01-01"],  # C1 is inverted
        }
    )

    exceptions = generate_weekly_exceptions(orders, customers)
    assert len(exceptions) >= 2

    # Check that O1 is flagged as critical return overrun
    ret_exc = exceptions[exceptions["record_id"] == "O1"]
    assert len(ret_exc) == 1
    assert ret_exc.iloc[0]["severity"] == "CRITICAL"

    # Check that C1 is flagged as chronological inversion
    date_exc = exceptions[exceptions["record_id"] == "C1"]
    assert len(date_exc) == 1
    assert date_exc.iloc[0]["severity"] == "HIGH"


def test_build_weekly_markdown_report():
    """Test building markdown report produces well-formed string."""
    exceptions = pd.DataFrame(
        [
            {
                "exception_id": "EXC-1",
                "exception_category": "Data Quality",
                "severity": "CRITICAL",
                "source_dataset": "orders",
                "record_id": "O1",
                "buyer_or_entity": "B1",
                "category": "Textiles",
                "order_date": "2024-01-01",
                "metric_impacted": "return_qty",
                "observed_value": "25 > 10",
                "threshold_or_rule": "<=",
                "recommended_action": "Audit",
            }
        ]
    )
    orders = pd.DataFrame(
        {
            "order_id": ["O1"],
            "on_time_delivery": [1],
        }
    )

    md = build_weekly_markdown_report(exceptions, "2024-10-23", orders)
    assert "# TradeSight Export Analytics" in md
    assert "CRITICAL" in md
    assert "EXC-1" in md
    assert "Windows Task Scheduler Setup" in md


def test_send_smtp_alert_safety(monkeypatch):
    """Test SMTP alert refuses to send email when APP_ENV is development."""
    monkeypatch.setenv("APP_ENV", "development")
    result = send_smtp_alert("Test Subject", "Test Body", ["test@example.com"])
    assert result is False


def test_send_smtp_alert_missing_credentials(monkeypatch):
    """Test SMTP alert returns False when credentials are not configured."""
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("SMTP_SERVER", raising=False)
    monkeypatch.delenv("SMTP_USER", raising=False)
    monkeypatch.delenv("SMTP_PASSWORD", raising=False)
    result = send_smtp_alert("Test Subject", "Test Body", ["test@example.com"])
    assert result is False


def test_send_smtp_alert_with_attachment_mocked(monkeypatch, tmp_path):
    """Test SMTP alert dispatches with attachments when properly configured."""
    from unittest.mock import MagicMock

    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("SMTP_SERVER", "smtp.testserver.com")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_USER", "alert@tradesight.com")
    monkeypatch.setenv("SMTP_PASSWORD", "secret123")
    monkeypatch.setenv("SMTP_USE_TLS", "True")

    # Create dummy attachment
    att_file = tmp_path / "test_exception.csv"
    att_file.write_text("exception_id,severity\nEXC-1,CRITICAL\n")

    mock_smtp_instance = MagicMock()
    mock_smtp_class = MagicMock(return_value=mock_smtp_instance)
    mock_smtp_instance.__enter__.return_value = mock_smtp_instance

    monkeypatch.setattr("smtplib.SMTP", mock_smtp_class)

    result = send_smtp_alert(
        subject="Weekly Exception Alert",
        body_markdown="# Exception Report",
        recipient_list=["manager@tradesight.com"],
        attachments=[att_file],
    )

    assert result is True
    assert mock_smtp_instance.starttls.called
    mock_smtp_instance.login.assert_called_once_with("alert@tradesight.com", "secret123")
    assert mock_smtp_instance.sendmail.called

