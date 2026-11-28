"""Foreign Exchange (FX) Analytics Module for TradeSight Export Analytics.

Provides mathematically verified currency impact calculations, exchange rate
sensitivity simulations, and input validation guards for export financial analysis.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd


# Benchmark Indicative Exchange Rates against INR (Hypothetical / Illustrative)
BENCHMARK_RATES_INR: Dict[str, float] = {
    "USD": 83.50,
    "EUR": 90.20,
    "GBP": 105.40,
    "AED": 22.75,
    "SGD": 61.80,
    "JPY": 0.55,
}


@dataclass
class FXSimulationResult:
    """Structured result of an FX sensitivity simulation."""
    currency: str
    foreign_amount: float
    base_rate: float
    revised_rate: float
    original_inr: float
    revised_inr: float
    gain_loss_inr: float
    percentage_impact: float
    scenario_type: str  # "appreciation", "depreciation", "neutral"
    is_valid: bool = True
    error_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "currency": self.currency,
            "foreign_amount": self.foreign_amount,
            "base_rate": self.base_rate,
            "revised_rate": self.revised_rate,
            "original_inr": round(self.original_inr, 2),
            "revised_inr": round(self.revised_inr, 2),
            "gain_loss_inr": round(self.gain_loss_inr, 2),
            "percentage_impact": round(self.percentage_impact, 2),
            "scenario_type": self.scenario_type,
            "is_valid": self.is_valid,
            "error_message": self.error_message,
        }


def calculate_fx_impact(
    foreign_amount: float,
    base_rate: float,
    revised_rate: float,
    currency: str = "USD",
) -> FXSimulationResult:
    """Calculate the currency impact when exchange rates fluctuate.

    Parameters
    ----------
    foreign_amount : float
        The foreign currency invoice value (e.g., $100,000 USD).
    base_rate : float
        The booking exchange rate in INR (e.g., 83.50 INR/USD).
    revised_rate : float
        The revised settlement or spot rate in INR (e.g., 87.675 INR/USD).
    currency : str
        ISO 4217 Currency code.

    Returns
    -------
    FXSimulationResult
        Contains original INR, revised INR, net gain/loss, and percentage variance.

    Raises
    ------
    ValueError
        If rates are non-positive or amount is negative.
    """
    # 1. Validation Guards
    if foreign_amount < 0:
        raise ValueError(f"Foreign currency amount cannot be negative: {foreign_amount}")
    if base_rate <= 0:
        raise ValueError(f"Base exchange rate must be strictly positive: {base_rate}")
    if revised_rate <= 0:
        raise ValueError(f"Revised exchange rate must be strictly positive: {revised_rate}")

    # 2. Converted Values in INR
    original_inr = float(foreign_amount * base_rate)
    revised_inr = float(foreign_amount * revised_rate)
    gain_loss_inr = float(revised_inr - original_inr)

    # 3. Percentage Impact
    if original_inr > 0:
        pct_impact = float((gain_loss_inr / original_inr) * 100.0)
    else:
        # Zero invoice amount
        pct_impact = float(((revised_rate - base_rate) / base_rate) * 100.0)

    # 4. Scenario Classification
    if gain_loss_inr > 1e-6:
        scenario = "appreciation"  # Foreign currency appreciated vs INR -> export gain
    elif gain_loss_inr < -1e-6:
        scenario = "depreciation"  # Foreign currency depreciated vs INR -> export loss
    else:
        scenario = "neutral"

    return FXSimulationResult(
        currency=currency.upper(),
        foreign_amount=foreign_amount,
        base_rate=base_rate,
        revised_rate=revised_rate,
        original_inr=original_inr,
        revised_inr=revised_inr,
        gain_loss_inr=gain_loss_inr,
        percentage_impact=pct_impact,
        scenario_type=scenario,
        is_valid=True,
    )


def simulate_portfolio_fx(
    total_revenue_inr: float,
    shock_pct: float,
    currency: str = "USD",
    base_rate: Optional[float] = None,
) -> Dict[str, Any]:
    """Simulate currency shock across the aggregate export revenue portfolio.

    Parameters
    ----------
    total_revenue_inr : float
        Total export portfolio value in INR (e.g. ₹396.88 Cr).
    shock_pct : float
        Percentage exchange rate shift (e.g., +5.0 for 5% appreciation, -5.0 for depreciation).
    currency : str
        Target billing currency.
    base_rate : float, optional
        Benchmark rate. Defaults to standard indicative benchmark.
    """
    if total_revenue_inr < 0:
        raise ValueError("Total revenue cannot be negative.")

    rate = base_rate or BENCHMARK_RATES_INR.get(currency.upper(), 83.50)
    if rate <= 0:
        raise ValueError("Exchange rate must be positive.")

    # Converted baseline foreign currency equivalent
    foreign_equiv = total_revenue_inr / rate
    revised_rate = rate * (1.0 + (shock_pct / 100.0))

    result = calculate_fx_impact(
        foreign_amount=foreign_equiv,
        base_rate=rate,
        revised_rate=revised_rate,
        currency=currency,
    )
    return result.to_dict()


def generate_scenario_matrix(
    base_amount_inr: float,
    currencies: Optional[List[str]] = None,
    shock_range: Optional[List[float]] = None,
) -> pd.DataFrame:
    """Generate a multi-currency sensitivity matrix for C-suite risk assessment."""
    if currencies is None:
        currencies = ["USD", "EUR", "GBP", "AED"]
    if shock_range is None:
        shock_range = [-10.0, -5.0, -2.0, 0.0, 2.0, 5.0, 10.0]

    rows = []
    for c in currencies:
        base_rate = BENCHMARK_RATES_INR.get(c, 83.50)
        for shock in shock_range:
            sim = simulate_portfolio_fx(base_amount_inr, shock, currency=c, base_rate=base_rate)
            rows.append({
                "currency": c,
                "base_rate": base_rate,
                "shock_percentage": shock,
                "revised_rate": sim["revised_rate"],
                "simulated_revenue_cr": round(sim["revised_inr"] / 1e7, 4),
                "gain_loss_cr": round(sim["gain_loss_inr"] / 1e7, 4),
                "scenario_type": sim["scenario_type"],
            })

    return pd.DataFrame(rows)
