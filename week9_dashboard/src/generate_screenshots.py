"""
TradeSight Export Analytics — High-Resolution Live Dashboard Screenshot Generator
Captures pixel-perfect 1920x1080 visual captures of the live production React dashboard
from https://tradesight-export-analytics.vercel.app for documentation and reporting.
"""

import os
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SCREENSHOT_DIR = BASE_DIR / "week9_dashboard" / "screenshots"
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

CHROME_PATHS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]


def capture_live_screenshots():
    chrome_bin = None
    for p in CHROME_PATHS:
        if os.path.exists(p):
            chrome_bin = p
            break

    if not chrome_bin:
        print("No headless browser found to capture live screenshots.")
        return False

    targets = [
        # 7 Comprehensive Sections & Test Deliverables
        ("01_executive_overview.png", "https://tradesight-export-analytics.vercel.app/?section=overview"),
        ("02_export_revenue.png", "https://tradesight-export-analytics.vercel.app/?section=revenue"),
        ("02_logistics_fulfillment.png", "https://tradesight-export-analytics.vercel.app/?section=logistics"),
        ("03_returns_quality_audit.png", "https://tradesight-export-analytics.vercel.app/?section=returns"),
        ("04_buyer_segmentation.png", "https://tradesight-export-analytics.vercel.app/?section=buyers"),
        ("05_data_governance_missing_kpis.png", "https://tradesight-export-analytics.vercel.app/?section=governance"),
        ("06_product_catalogue.png", "https://tradesight-export-analytics.vercel.app/?section=products"),
        ("07_data_governance.png", "https://tradesight-export-analytics.vercel.app/?section=governance"),
    ]

    for filename, url in targets:
        out_path = SCREENSHOT_DIR / filename
        args = [
            chrome_bin,
            "--headless",
            "--disable-gpu",
            "--virtual-time-budget=6000",
            "--window-size=1920,1080",
            f"--screenshot={out_path}",
            url
        ]
        res = subprocess.run(args, capture_output=True, text=True)
        if out_path.exists():
            print(f"Captured live screenshot {filename}: {out_path.stat().st_size} bytes")
        else:
            print(f"Failed to capture {filename}: {res.stderr}")

    return True


if __name__ == "__main__":
    capture_live_screenshots()
