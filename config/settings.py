"""
Default configuration and operational parameters for Kirsten + Erin SMC Options Engine.
"""

from pathlib import Path

CONFIG_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CONFIG_DIR.parent
TICKERS_FILE = CONFIG_DIR / "tickers.txt"

# Default Watchlists
CORE_TRIO = ["MRVL", "NVDA", "HOOD"]
TIER_1_BLUE_CHIPS = ["AAPL", "MSFT", "AMZN", "GOOGL", "META", "NVDA", "TSLA", "QQQ"]
TIER_2_HIGH_BETA = ["HOOD", "NOW", "PLTR", "NFLX", "COIN", "MU", "MRVL", "SOXL", "APP", "INTC", "CRWV", "AVGO"]
DEFAULT_UNIVERSE = TIER_1_BLUE_CHIPS + TIER_2_HIGH_BETA

# Core Strategy Defaults (Calibrated from Kirsten's 2024-2026 Live Execution Logs)
DEFAULTS = {
    "target_dte": 35,          # Sweet spot for theta decay (window: 28-42 DTE)
    "dte_min": 25,
    "dte_max": 45,
    "cushion_pct": 12.0,       # Strike must sit 12% to 20% below spot
    "min_premium": 1.50,       # Minimum bid credit ($150 per contract)
    "min_roc_pct": 1.20,       # Minimum Return on Cash Collateral per cycle
    "risk_free_rate": 0.045,   # 4.5% annual risk-free rate
    "take_profit_pcts": (50.0, 60.0), # Standard buyback targets (50% and 60% profit)
}

BANNER_CREED = """
================================================================================
  KIRSTEN'S OPERATIONAL CREED: ONLY SELL PUTS ON STOCKS YOU WANT TO OWN.
  
  1. Full cash collateral allocated (NEVER sell puts on margin).
  2. Plan for deep ITM assignment; assignment is a strategic discount buy, not a loss.
  3. Anchor strikes behind SMC order blocks, Anchored VWAP, and OTE discount zones.
  4. Take profit at 50%-75% gain; roll out in time for net credits if tested.
================================================================================
"""
