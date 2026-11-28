"""Unit tests for Foreign Exchange (FX) Analytics Module.

Covers:
- Positive exchange rate appreciation scenarios
- Negative exchange rate depreciation scenarios
- Zero percentage shock / neutral scenarios
- Zero invoice value scenarios
- Invalid negative inputs and zero exchange rate guards
- Scenario matrix generation and portfolio consistency
"""

import pytest
from src.fx_analytics import (
    calculate_fx_impact,
    calculate_portfolio_impact,
    simulate_portfolio_fx,
    generate_scenario_matrix,
    BENCHMARK_RATES_INR,
)


def test_user_requested_verification_example():
    """Verify exact user prompt example:

    Invoice amount: 100,000 USD
    Base exchange rate: 83.50
    Revised exchange rate: 87.00

    Expected results:
    - Original Booking Value: 83,50,000 INR
    - Revised Converted Value: 87,00,000 INR
    - Estimated FX Gain: 3,50,000 INR
    - Percentage Impact: approximately 4.19%
    """
    res = calculate_fx_impact(
        foreign_amount=100000.0,
        base_rate=83.50,
        revised_rate=87.00,
        currency="USD",
    )
    assert res.is_valid is True
    assert res.original_inr == 8350000.0
    assert res.revised_inr == 8700000.0
    assert res.gain_loss_inr == 350000.0
    assert pytest.approx(res.percentage_impact, 0.01) == 4.1916167
    assert res.scenario_type == "appreciation"


def test_portfolio_impact_calculation():
    """Test portfolio impact with partial exposure."""
    total_rev = 100000000.0  # ₹10 Cr
    exposure_pct = 40.0      # 40%
    base_rate = 80.0
    revised_rate = 84.0      # +5%

    res = calculate_portfolio_impact(
        total_revenue_inr=total_rev,
        exposure_pct=exposure_pct,
        base_rate=base_rate,
        revised_rate=revised_rate,
        currency="USD",
    )
    assert res["is_valid"] is True
    assert res["exposed_portfolio_value"] == 40000000.0   # ₹4 Cr
    assert res["foreign_currency_exposure"] == 500000.0   # $500,000 USD
    assert res["revised_exposure_value"] == 42000000.0    # ₹4.2 Cr
    assert res["gain_loss_inr"] == 2000000.0              # +₹20 Lakh
    assert res["revised_total_portfolio_value"] == 102000000.0 # ₹10.2 Cr
    assert res["percentage_impact"] == 5.0
    assert res["scenario_type"] == "appreciation"


def test_portfolio_impact_invalid_bounds():
    """Test exposure outside 0-100% raises ValueError."""
    with pytest.raises(ValueError, match="Exposure percentage must be between 0 and 100"):
        calculate_portfolio_impact(1000000.0, -5.0, 80.0, 84.0)

    with pytest.raises(ValueError, match="Exposure percentage must be between 0 and 100"):
        calculate_portfolio_impact(1000000.0, 105.0, 80.0, 84.0)


def test_positive_fx_appreciation():
    """Test 5% USD appreciation against INR on $100,000 invoice."""
    # Base rate = 80.0, Revised rate = 84.0 (+5%)
    res = calculate_fx_impact(
        foreign_amount=100000.0,
        base_rate=80.0,
        revised_rate=84.0,
        currency="USD",
    )
    assert res.is_valid is True
    assert res.original_inr == 8000000.0  # 80 Lakh
    assert res.revised_inr == 8400000.0   # 84 Lakh
    assert res.gain_loss_inr == 400000.0   # +4 Lakh gain
    assert pytest.approx(res.percentage_impact, 0.01) == 5.0
    assert res.scenario_type == "appreciation"


def test_negative_fx_depreciation():
    """Test 5% EUR depreciation against INR on €50,000 invoice."""
    # Base rate = 90.0, Revised rate = 85.5 (-5%)
    res = calculate_fx_impact(
        foreign_amount=50000.0,
        base_rate=90.0,
        revised_rate=85.5,
        currency="EUR",
    )
    assert res.is_valid is True
    assert res.original_inr == 4500000.0  # 45 Lakh
    assert res.revised_inr == 4275000.0   # 42.75 Lakh
    assert res.gain_loss_inr == -225000.0  # -2.25 Lakh loss
    assert pytest.approx(res.percentage_impact, 0.01) == -5.0
    assert res.scenario_type == "depreciation"


def test_zero_fx_shock():
    """Test zero rate fluctuation returns neutral impact and 0.0 variance."""
    res = calculate_fx_impact(
        foreign_amount=250000.0,
        base_rate=83.50,
        revised_rate=83.50,
        currency="USD",
    )
    assert res.is_valid is True
    assert res.gain_loss_inr == 0.0
    assert res.percentage_impact == 0.0
    assert res.scenario_type == "neutral"


def test_zero_foreign_amount():
    """Test zero invoice amount behaves safely without division by zero."""
    res = calculate_fx_impact(
        foreign_amount=0.0,
        base_rate=80.0,
        revised_rate=88.0,
        currency="USD",
    )
    assert res.is_valid is True
    assert res.original_inr == 0.0
    assert res.revised_inr == 0.0
    assert res.gain_loss_inr == 0.0
    assert pytest.approx(res.percentage_impact, 0.01) == 10.0


def test_invalid_negative_amount_raises_error():
    """Test negative foreign amount raises ValueError."""
    with pytest.raises(ValueError, match="cannot be negative"):
        calculate_fx_impact(
            foreign_amount=-5000.0,
            base_rate=83.50,
            revised_rate=85.0,
        )


def test_invalid_zero_or_negative_rates_raise_error():
    """Test zero or negative exchange rates raise ValueError."""
    with pytest.raises(ValueError, match="strictly positive"):
        calculate_fx_impact(foreign_amount=1000.0, base_rate=0.0, revised_rate=85.0)

    with pytest.raises(ValueError, match="strictly positive"):
        calculate_fx_impact(foreign_amount=1000.0, base_rate=-80.0, revised_rate=85.0)

    with pytest.raises(ValueError, match="strictly positive"):
        calculate_fx_impact(foreign_amount=1000.0, base_rate=80.0, revised_rate=0.0)

    with pytest.raises(ValueError, match="strictly positive"):
        calculate_fx_impact(foreign_amount=1000.0, base_rate=80.0, revised_rate=-10.0)


def test_portfolio_simulation_consistency():
    """Test portfolio simulation on TradeSight baseline revenue (₹396.88 Cr)."""
    total_rev = 3968829214.2
    sim_plus_5 = simulate_portfolio_fx(total_rev, shock_pct=5.0, currency="USD")
    assert sim_plus_5["percentage_impact"] == 5.0
    assert sim_plus_5["gain_loss_inr"] > 0
    # Expected gain is approx 396.88 * 0.05 = ~19.84 Cr
    assert pytest.approx(sim_plus_5["gain_loss_inr"] / 1e7, 0.1) == 19.84

    sim_minus_5 = simulate_portfolio_fx(total_rev, shock_pct=-5.0, currency="USD")
    assert sim_minus_5["percentage_impact"] == -5.0
    assert sim_minus_5["gain_loss_inr"] < 0
    assert pytest.approx(sim_minus_5["gain_loss_inr"] / 1e7, 0.1) == -19.84


def test_scenario_matrix_generation():
    """Test scenario matrix generates all requested currency/shock combinations."""
    total_rev = 3968829214.2
    df = generate_scenario_matrix(
        base_amount_inr=total_rev,
        currencies=["USD", "EUR"],
        shock_range=[-5.0, 0.0, 5.0],
    )
    assert len(df) == 6  # 2 currencies * 3 shocks
    assert set(df["currency"].unique()) == {"USD", "EUR"}
    assert set(df["shock_percentage"].unique()) == {-5.0, 0.0, 5.0}
    assert "simulated_revenue_cr" in df.columns
    assert "gain_loss_cr" in df.columns
