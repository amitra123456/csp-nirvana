"""
Default configuration and operational parameters for Kirsten + Erin SMC Options Engine.
"""

from pathlib import Path

CONFIG_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CONFIG_DIR.parent
TICKERS_FILE = CONFIG_DIR / "tickers.txt"
DATA_DIR = PROJECT_ROOT / "data" / "daily"

# Sector Breakdown (108 Quality Large Caps & Core Anchors)
CORE_TRIO = ["MRVL", "NVDA", "HOOD"]

MEGA_CAP_TECH = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "AVGO", "TSLA"]

SEMIS_AI_INFRA = [
    "AMD", "MU", "MRVL", "QCOM", "TXN", "ADI", "LRCX", "AMAT",
    "KLAC", "ARM", "TSM", "ASML", "INTC", "ON", "MPWR", "NXPI"
]

SOFTWARE_CLOUD = [
    "NOW", "CRM", "ORCL", "ADBE", "PANW", "CRWD", "DDOG", "SNOW",
    "MDB", "NET", "ZS", "TEAM", "WDAY", "INTU", "PLTR"
]

INTERNET_CONSUMER_TECH = [
    "NFLX", "UBER", "ABNB", "DASH", "SPOT", "BKNG", "PYPL", "SHOP",
    "RBLX", "PINS", "SNAP", "EA"
]

FINTECH_FINANCIALS = [
    "V", "MA", "JPM", "GS", "MS", "BAC", "SCHW", "AXP", "BLK", "SPGI", "HOOD"
]

HEALTHCARE = [
    "LLY", "UNH", "JNJ", "ABBV", "MRK", "PFE", "TMO", "ISRG", "VRTX", "AMGN", "BMY", "GILD"
]

CONSUMER = [
    "COST", "WMT", "HD", "NKE", "SBUX", "MCD", "PG", "KO", "PEP", "TGT", "LOW", "DIS", "CMG"
]

INDUSTRIALS_ENERGY_UTILITIES = [
    "CAT", "DE", "HON", "GE", "BA", "LMT", "RTX", "XOM", "CVX", "COP", "SLB", "NEE", "UNP", "UPS"
]

COMMUNICATIONS = ["TMUS", "CMCSA", "T", "VZ"]

BROAD_MARKET_ETFS = ["SPY", "QQQ", "IWM"]

# Combined 108 Quality Large Caps Universe
ALL_108_CANDIDATES = []
for _sec in [
    MEGA_CAP_TECH, SEMIS_AI_INFRA, SOFTWARE_CLOUD, INTERNET_CONSUMER_TECH,
    FINTECH_FINANCIALS, HEALTHCARE, CONSUMER, INDUSTRIALS_ENERGY_UTILITIES,
    COMMUNICATIONS, BROAD_MARKET_ETFS
]:
    for _t in _sec:
        if _t not in ALL_108_CANDIDATES:
            ALL_108_CANDIDATES.append(_t)

SECTOR_MAP = {
    "Core High-Conviction Trio (NVDA, HOOD, MRVL)": CORE_TRIO,
    "Mega-Cap Tech (AAPL, MSFT, NVDA...)": MEGA_CAP_TECH,
    "Semis & AI Infrastructure (AMD, MU, MRVL, TSM...)": SEMIS_AI_INFRA,
    "Software & Cloud (NOW, CRM, ORCL, PLTR...)": SOFTWARE_CLOUD,
    "Internet & Consumer Tech (NFLX, UBER, SHOP...)": INTERNET_CONSUMER_TECH,
    "Fintech & Financials (V, MA, JPM, HOOD...)": FINTECH_FINANCIALS,
    "Healthcare (LLY, UNH, JNJ, ISRG...)": HEALTHCARE,
    "Consumer & Retail (COST, WMT, HD, MCD...)": CONSUMER,
    "Industrials, Energy & Utilities (CAT, BA, XOM...)": INDUSTRIALS_ENERGY_UTILITIES,
    "Communications (TMUS, CMCSA, T, VZ)": COMMUNICATIONS,
    "Broad-Market ETFs (SPY, QQQ, IWM)": BROAD_MARKET_ETFS,
    "All 108 Institutional Quality Candidates": ALL_108_CANDIDATES
}

DEFAULT_UNIVERSE = ALL_108_CANDIDATES

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

# Company Name Mapping for Display
COMPANY_NAMES = {
    "ADBE": "Adobe Inc.",
    "DASH": "DoorDash Inc.",
    "CRM": "Salesforce Inc.",
    "TSM": "Taiwan Semi",
    "INTU": "Intuit Inc.",
    "TEAM": "Atlassian Corp",
    "HOOD": "Robinhood Mkts",
    "QCOM": "Qualcomm Inc.",
    "ZS": "Zscaler Inc.",
    "MU": "Micron Tech",
    "MDB": "MongoDB Inc.",
    "SNOW": "Snowflake Inc.",
    "MRVL": "Marvell Tech",
    "DDOG": "Datadog Inc.",
    "LRCX": "Lam Research",
    "AVGO": "Broadcom Inc.",
    "PANW": "Palo Alto Networks",
    "AMAT": "Applied Materials",
    "KLAC": "KLA Corp",
    "NET": "Cloudflare Inc.",
    "ARM": "Arm Holdings",
    "ADI": "Analog Devices",
    "ORCL": "Oracle Corp",
    "INTC": "Intel Corp",
    "CRWD": "CrowdStrike",
    "AMD": "AMD",
    "NVDA": "NVIDIA Corp",
    "TXN": "Texas Instruments",
    "ASML": "ASML Holding",
    "CAT": "Caterpillar Inc.",
    "SHOP": "Shopify Inc.",
    "PLTR": "Palantir Tech",
    "TSLA": "Tesla Inc.",
    "AAPL": "Apple Inc.",
    "MSFT": "Microsoft Corp",
    "GOOGL": "Alphabet Inc.",
    "AMZN": "Amazon.com Inc.",
    "META": "Meta Platforms",
    "NOW": "ServiceNow Inc.",
    "NFLX": "Netflix Inc.",
    "UBER": "Uber Technologies",
    "ABNB": "Airbnb Inc.",
    "SPOT": "Spotify Tech",
    "BKNG": "Booking Holdings",
    "PYPL": "PayPal Holdings",
    "V": "Visa Inc.",
    "MA": "Mastercard Inc.",
    "JPM": "JPMorgan Chase",
    "GS": "Goldman Sachs",
    "MS": "Morgan Stanley",
    "BAC": "Bank of America",
    "SCHW": "Charles Schwab",
    "AXP": "American Express",
    "BLK": "BlackRock Inc.",
    "SPGI": "S&P Global",
    "LLY": "Eli Lilly & Co.",
    "UNH": "UnitedHealth Group",
    "JNJ": "Johnson & Johnson",
    "ABBV": "AbbVie Inc.",
    "MRK": "Merck & Co.",
    "PFE": "Pfizer Inc.",
    "COST": "Costco Wholesale",
    "WMT": "Walmart Inc.",
    "HD": "Home Depot",
    "NKE": "Nike Inc.",
    "DIS": "Walt Disney Co.",
    "XOM": "Exxon Mobil Corp",
    "CVX": "Chevron Corp",
    "SPY": "SPDR S&P 500 ETF",
    "QQQ": "Invesco QQQ Trust",
    "IWM": "iShares Russell 2000",
}

def get_company_name(ticker: str) -> str:
    """Returns canonical company name for display."""
    return COMPANY_NAMES.get(ticker.upper(), ticker)

BANNER_CREED = """
================================================================================
  KIRSTEN'S OPERATIONAL CREED: ONLY SELL PUTS ON STOCKS YOU WANT TO OWN.
  
  1. Full cash collateral allocated (NEVER sell puts on margin).
  2. Plan for deep ITM assignment; assignment is a strategic discount buy, not a loss.
  3. Anchor strikes behind SMC order blocks, Anchored VWAP, and OTE discount zones.
  4. Take profit at 50%-75% gain; roll out in time for net credits if tested.
================================================================================
"""
