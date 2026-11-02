"""
TradeSight Export Analytics — Streamlit Community Cloud Root Entrypoint
Delegates execution directly to week9_dashboard/app.py.
Enables instant deployment on Streamlit Community Cloud whether the entry point is
specified as 'week9_dashboard/app.py' or left as default 'streamlit_app.py'.
"""

import runpy
from pathlib import Path

target_app = Path(__file__).resolve().parent / "week9_dashboard" / "app.py"
if not target_app.exists():
    raise FileNotFoundError(f"Dashboard entrypoint not found at: {target_app}")

runpy.run_path(str(target_app), run_name="__main__")
