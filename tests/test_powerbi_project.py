"""Unit tests for Power BI Project validation and asset integrity."""

from pathlib import Path
import pytest
from src.validate_powerbi import (
    validate_pbip_entry,
    validate_model_bim,
    validate_report_json,
    validate_dax_measures,
    validate_theme_json,
    run_all_validations,
    PROJECT_ROOT,
    POWERBI_DIR,
)


def test_powerbi_pbip_entry_validity():
    """Verify entry file TradeSight_Analytics.pbip exists and parses."""
    is_valid, msg = validate_pbip_entry()
    assert is_valid, msg


def test_powerbi_model_bim_schema():
    """Verify semantic model tabular object model schema and backing datasets."""
    is_valid, errors, model_data = validate_model_bim()
    assert is_valid, f"Model schema validation failed: {errors}"
    assert len(model_data["model"]["tables"]) == 5


def test_powerbi_report_json_pages_and_visuals():
    """Verify 5-page report canvas and visual field projections."""
    _, _, model_data = validate_model_bim()
    is_valid, errors, meta = validate_report_json(model_data)
    assert is_valid, f"Report canvas validation failed: {errors}"
    assert meta["page_count"] == 5
    assert meta["visual_count"] >= 25


def test_powerbi_dax_measures():
    """Verify DAX measures library contains core calculations."""
    is_valid, errors, count = validate_dax_measures()
    assert is_valid, f"DAX measures validation failed: {errors}"
    assert count >= 20


def test_powerbi_theme():
    """Verify corporate color theme configuration."""
    is_valid, msg = validate_theme_json()
    assert is_valid, msg


def test_powerbi_full_validation_and_packaging():
    """Verify end-to-end Power BI validation and bundle creation."""
    results = run_all_validations()
    assert results["all_validations_passed"] is True
    assert (PROJECT_ROOT / "frontend" / "public" / "powerbi" / "TradeSight_PowerBI_Project_Bundle.zip").is_file()
    assert "powerbi_desktop_installed" in results
    assert "pbip_entry" in results
