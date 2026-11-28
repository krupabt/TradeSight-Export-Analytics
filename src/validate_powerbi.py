"""Validation and Packaging Utility for TradeSight Power BI Project.

Validates semantic model schema (model.bim), 5-page report canvas (report.json),
star-schema datasets, DAX measures, and theme consistency.
Packages validated assets into distributable artifacts.
"""

from __future__ import annotations

import json
import logging
import zipfile
from pathlib import Path
from typing import Any, Dict, List, Tuple

import pandas as pd

logger = logging.getLogger("tradesight.powerbi")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
POWERBI_DIR = PROJECT_ROOT / "powerbi"


def validate_pbip_entry() -> Tuple[bool, str]:
    """Validate entry file TradeSight_Analytics.pbip."""
    pbip_file = POWERBI_DIR / "TradeSight_Analytics.pbip"
    if not pbip_file.exists():
        return False, "TradeSight_Analytics.pbip missing"
    try:
        with open(pbip_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        if "artifacts" not in data or not data["artifacts"]:
            return False, "pbip missing artifacts array"
        return True, "TradeSight_Analytics.pbip is valid"
    except Exception as e:
        return False, f"Error parsing pbip: {e}"


def validate_model_bim() -> Tuple[bool, List[str], Dict[str, Any]]:
    """Validate semantic model Tabular Object Model (TOM) schema in model.bim."""
    bim_file = POWERBI_DIR / "TradeSight_Analytics.Dataset" / "model.bim"
    errors: List[str] = []
    if not bim_file.exists():
        return False, ["model.bim missing"], {}

    try:
        with open(bim_file, "r", encoding="utf-8") as f:
            model_data = json.load(f)
    except Exception as e:
        return False, [f"JSON syntax error in model.bim: {e}"], {}

    model = model_data.get("model", {})
    tables = {t["name"]: t for t in model.get("tables", [])}

    expected_tables = [
        "Fact_Orders",
        "Dim_Products",
        "Dim_Customers",
        "Dim_Date",
        "Dim_Proposed_Markets",
    ]

    for expected in expected_tables:
        if expected not in tables:
            errors.append(f"Expected table '{expected}' missing from model.bim")

    # Validate table columns against CSV files in powerbi/data/
    for table_name, table_obj in tables.items():
        csv_path = POWERBI_DIR / "data" / f"{table_name}.csv"
        if not csv_path.exists():
            errors.append(f"Backing CSV missing for table '{table_name}': {csv_path}")
            continue

        try:
            df = pd.read_csv(csv_path, nrows=5)
            csv_cols = set(df.columns)
            bim_cols = {c["sourceColumn"] for c in table_obj.get("columns", [])}
            missing_in_csv = bim_cols - csv_cols
            if missing_in_csv:
                errors.append(
                    f"Columns in model.bim missing from {table_name}.csv: {missing_in_csv}"
                )
        except Exception as e:
            errors.append(f"Failed to inspect CSV for {table_name}: {e}")

    # Validate relationships
    relationships = model.get("relationships", [])
    if not relationships:
        errors.append("No relationships defined in model.bim")

    is_valid = len(errors) == 0
    return is_valid, errors, model_data


def validate_report_json(model_data: Dict[str, Any]) -> Tuple[bool, List[str], Dict[str, Any]]:
    """Validate 5-page report layout and field queryRefs against model.bim."""
    report_file = POWERBI_DIR / "TradeSight_Analytics.Report" / "report.json"
    errors: List[str] = []
    if not report_file.exists():
        return False, ["report.json missing"], {}

    try:
        with open(report_file, "r", encoding="utf-8") as f:
            report_data = json.load(f)
    except Exception as e:
        return False, [f"JSON syntax error in report.json: {e}"], {}

    sections = report_data.get("sections", [])
    if len(sections) < 5:
        errors.append(f"Expected at least 5 report pages, found {len(sections)}")

    expected_pages = [
        "Page1_ExecutiveOverview",
        "Page2_ShipmentAndCompliance",
        "Page3_ClientAndProductAnalytics",
        "Page4_ReturnsAndDataQuality",
        "Page5_GeographyAndFXAnalytics",
    ]

    found_page_names = [s.get("name") for s in sections]
    for exp_page in expected_pages:
        if exp_page not in found_page_names:
            errors.append(f"Expected report page '{exp_page}' missing from report.json")

    # Build known model fields: Table.Column and Table.Measure
    known_fields = set()
    model = model_data.get("model", {})
    for table in model.get("tables", []):
        tname = table["name"]
        for col in table.get("columns", []):
            known_fields.add(f"{tname}.{col['name']}")
        for measure in table.get("measures", []):
            known_fields.add(f"{tname}.{measure['name']}")

    # Check queryRefs in visuals
    total_visuals = 0
    for section in sections:
        containers = section.get("visualContainers", [])
        total_visuals += len(containers)
        for container in containers:
            cfg_str = container.get("config", "{}")
            try:
                cfg = json.loads(cfg_str)
                single_visual = cfg.get("singleVisual", {})
                projections = single_visual.get("projections", {})
                for proj_key, proj_list in projections.items():
                    for item in proj_list:
                        qref = item.get("queryRef")
                        if qref and qref not in known_fields:
                            # Allow calculated/wildcard if needed, else flag
                            errors.append(
                                f"Unknown queryRef '{qref}' in visual on page {section.get('name')}"
                            )
            except Exception:
                pass

    is_valid = len(errors) == 0
    return is_valid, errors, {"page_count": len(sections), "visual_count": total_visuals}


def validate_dax_measures() -> Tuple[bool, List[str], int]:
    """Validate DAX measures file exists and contains core formulas."""
    dax_file = POWERBI_DIR / "dax" / "TradeSight_DAX_Measures.dax"
    if not dax_file.exists():
        return False, ["TradeSight_DAX_Measures.dax missing"], 0

    with open(dax_file, "r", encoding="utf-8") as f:
        content = f.read()

    core_measures = [
        "Total Export Revenue",
        "Total Orders",
        "Average Order Value (AOV)",
        "Total Units Shipped",
        "Total Units Returned",
        "Unit Return Rate %",
        "On-Time Deliveries",
        "On-Time Delivery %",
        "Unique Active Buyers",
        "Catalogue Gross Margin %",
    ]

    missing = [m for m in core_measures if m not in content]
    if missing:
        return False, [f"Missing DAX measures: {missing}"], 0

    return True, [], content.count(" = ")


def validate_theme_json() -> Tuple[bool, str]:
    """Validate Power BI corporate theme JSON."""
    theme_file = POWERBI_DIR / "theme" / "tradesight_powerbi_theme.json"
    if not theme_file.exists():
        return False, "Theme JSON missing"
    try:
        with open(theme_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        if "dataColors" not in data or not data["dataColors"]:
            return False, "dataColors missing in theme"
        return True, "Corporate theme is valid"
    except Exception as e:
        return False, f"Theme error: {e}"


def package_powerbi_bundle() -> Path:
    """Create a clean distribution zip bundle of all Power BI assets."""
    dest_dir = PROJECT_ROOT / "frontend" / "public" / "powerbi"
    dest_dir.mkdir(parents=True, exist_ok=True)
    zip_path = dest_dir / "TradeSight_PowerBI_Project_Bundle.zip"

    # Also keep a copy directly in powerbi/
    local_zip = POWERBI_DIR / "TradeSight_PowerBI_Project_Bundle.zip"

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for file_path in POWERBI_DIR.rglob("*"):
            if file_path.is_file() and not file_path.name.endswith(".zip"):
                arcname = file_path.relative_to(POWERBI_DIR)
                zipf.write(file_path, arcname)

    # Copy to powerbi directory as well
    with open(zip_path, "rb") as src, open(local_zip, "wb") as dst:
        dst.write(src.read())

    # Also copy key individual files into frontend/public/powerbi/ for direct download
    for fname in ["TradeSight_Analytics.pbip", "POWERBI_SETUP_GUIDE.md"]:
        src_f = POWERBI_DIR / fname
        if src_f.exists():
            dst_f = dest_dir / fname
            with open(src_f, "rb") as s, open(dst_f, "wb") as d:
                d.write(s.read())

    # Copy DAX library and model.bim
    dax_src = POWERBI_DIR / "dax" / "TradeSight_DAX_Measures.dax"
    if dax_src.exists():
        with open(dax_src, "rb") as s, open(dest_dir / "TradeSight_DAX_Measures.dax", "wb") as d:
            d.write(s.read())

    bim_src = POWERBI_DIR / "TradeSight_Analytics.Dataset" / "model.bim"
    if bim_src.exists():
        with open(bim_src, "rb") as s, open(dest_dir / "model.bim", "wb") as d:
            d.write(s.read())

    return zip_path


def create_starter_pbix_package() -> Path:
    """Create a structured TradeSight_Analytics.pbix container.
    
    Contains standard OPC manifests, Version, Settings, and Report Layout.
    Power BI Desktop will open this or the native PBIP project.
    """
    pbix_paths = [
        POWERBI_DIR / "TradeSight_Analytics.pbix",
        PROJECT_ROOT / "frontend" / "public" / "powerbi" / "TradeSight_Analytics.pbix",
    ]

    report_json_path = POWERBI_DIR / "TradeSight_Analytics.Report" / "report.json"
    with open(report_json_path, "r", encoding="utf-8") as f:
        report_content = f.read()

    content_types_xml = (
        '<?xml version="1.0" encoding="utf-8"?>\r\n'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\r\n'
        '  <Default Extension="json" ContentType="application/json" />\r\n'
        '  <Default Extension="xml" ContentType="application/xml" />\r\n'
        '  <Override PartName="/Report/Layout" ContentType="application/json" />\r\n'
        '  <Override PartName="/Settings" ContentType="application/json" />\r\n'
        '  <Override PartName="/Version" ContentType="application/json" />\r\n'
        '</Types>'
    )

    settings_json = json.dumps({"version": "5.48", "locale": "en-US", "isReportAccessible": True})
    version_str = "1.28"

    for dest in pbix_paths:
        dest.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("[Content_Types].xml", content_types_xml.encode("utf-8"))
            z.writestr("Version", version_str.encode("utf-16le"))
            z.writestr("Settings", settings_json.encode("utf-16le"))
            z.writestr("Report/Layout", report_content.encode("utf-16le"))

    return pbix_paths[0]


def run_all_validations() -> Dict[str, Any]:
    """Execute all Power BI validations and output summary."""
    pbip_ok, pbip_msg = validate_pbip_entry()
    bim_ok, bim_errs, model_data = validate_model_bim()
    report_ok, report_errs, report_meta = (
        validate_report_json(model_data) if bim_ok else (False, ["Skipped due to model error"], {})
    )
    dax_ok, dax_errs, dax_count = validate_dax_measures()
    theme_ok, theme_msg = validate_theme_json()

    all_passed = pbip_ok and bim_ok and report_ok and dax_ok and theme_ok

    bundle_path = package_powerbi_bundle()
    pbix_path = create_starter_pbix_package()

    summary = {
        "all_validations_passed": all_passed,
        "pbip_entry": {"valid": pbip_ok, "message": pbip_msg},
        "semantic_model": {
            "valid": bim_ok,
            "errors": bim_errs,
            "tables_count": len(model_data.get("model", {}).get("tables", [])),
        },
        "report_canvas": {
            "valid": report_ok,
            "errors": report_errs,
            "pages_count": report_meta.get("page_count", 0),
            "visuals_count": report_meta.get("visual_count", 0),
        },
        "dax_measures": {"valid": dax_ok, "errors": dax_errs, "measures_count": dax_count},
        "theme": {"valid": theme_ok, "message": theme_msg},
        "artifacts_packaged": {
            "bundle_zip": str(bundle_path.relative_to(PROJECT_ROOT)),
            "pbix_file": str(pbix_path.relative_to(PROJECT_ROOT)),
        },
    }

    return summary


if __name__ == "__main__":
    results = run_all_validations()
    print(json.dumps(results, indent=2))
