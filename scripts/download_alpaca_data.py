"""
Alpaca Historical Data Ingestion for CSP-Nirvana
================================================
Downloads daily OHLCV bars from Alpaca Data API for all 108 institutional
quality candidate stocks and saves them to csp_nirvana/data/daily/.
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime, timedelta
import pandas as pd
from dotenv import load_dotenv

# Path setup
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "data" / "daily"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Load environment
for env_path in [PROJECT_ROOT.parent / ".env", PROJECT_ROOT / ".env"]:
    if env_path.exists():
        load_dotenv(env_path)

from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame

# 108 Quality Large Caps by Sector
SECTOR_UNIVERSES = {
    "mega_cap_tech": ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "AVGO", "TSLA"],
    "semis_ai_infra": ["AMD", "MU", "MRVL", "QCOM", "TXN", "ADI", "LRCX", "AMAT", "KLAC", "ARM", "TSM", "ASML", "INTC", "ON", "MPWR", "NXPI"],
    "software_cloud": ["NOW", "CRM", "ORCL", "ADBE", "PANW", "CRWD", "DDOG", "SNOW", "MDB", "NET", "ZS", "TEAM", "WDAY", "INTU", "PLTR"],
    "internet_consumer_tech": ["NFLX", "UBER", "ABNB", "DASH", "SPOT", "BKNG", "PYPL", "SHOP", "RBLX", "PINS", "SNAP", "EA"],
    "fintech_financials": ["V", "MA", "JPM", "GS", "MS", "BAC", "SCHW", "AXP", "BLK", "SPGI", "HOOD"],
    "healthcare": ["LLY", "UNH", "JNJ", "ABBV", "MRK", "PFE", "TMO", "ISRG", "VRTX", "AMGN", "BMY", "GILD"],
    "consumer": ["COST", "WMT", "HD", "NKE", "SBUX", "MCD", "PG", "KO", "PEP", "TGT", "LOW", "DIS", "CMG"],
    "industrials_energy_utilities": ["CAT", "DE", "HON", "GE", "BA", "LMT", "RTX", "XOM", "CVX", "COP", "SLB", "NEE", "UNP", "UPS"],
    "communications": ["TMUS", "CMCSA", "T", "VZ"],
    "broad_market_etfs": ["SPY", "QQQ", "IWM"]
}

ALL_TICKERS = []
for sec, t_list in SECTOR_UNIVERSES.items():
    for t in t_list:
        if t not in ALL_TICKERS:
            ALL_TICKERS.append(t)

def main():
    print(f"================================================================")
    print(f"  ALPACA DATA INGESTION: {len(ALL_TICKERS)} QUALITY LARGE CAPS")
    print(f"================================================================")

    key = os.getenv("ALPACA_API_KEY") or os.getenv("APCA_API_KEY_ID")
    sec = os.getenv("ALPACA_SECRET_KEY") or os.getenv("APCA_API_SECRET_KEY")

    if not key or not sec:
        print("ERROR: Alpaca credentials missing in .env")
        sys.exit(1)

    client = StockHistoricalDataClient(api_key=key, secret_key=sec)
    start_date = datetime.now() - timedelta(days=730)  # 2 years

    batch_size = 35
    total_saved = 0
    metadata = {}

    for i in range(0, len(ALL_TICKERS), batch_size):
        batch = ALL_TICKERS[i:i+batch_size]
        print(f"Downloading batch {i//batch_size + 1}/{(len(ALL_TICKERS) + batch_size - 1)//batch_size} ({len(batch)} symbols)...")
        
        try:
            req = StockBarsRequest(
                symbol_or_symbols=batch,
                timeframe=TimeFrame.Day,
                start=start_date
            )
            bars = client.get_stock_bars(req)
            df_all = bars.df

            if df_all.empty:
                print(f"  Warning: No data returned for batch: {batch}")
                continue

            # Process each symbol in the multi-index dataframe
            for sym in batch:
                if sym in df_all.index.levels[0]:
                    df_sym = df_all.loc[sym].copy()
                    # Standardize columns to standard Open, High, Low, Close, Volume
                    df_sym.rename(columns={
                        "open": "Open",
                        "high": "High",
                        "low": "Low",
                        "close": "Close",
                        "volume": "Volume",
                        "vwap": "VWAP"
                    }, inplace=True)
                    
                    df_sym.sort_index(inplace=True)
                    csv_path = DATA_DIR / f"{sym}.csv"
                    df_sym.to_csv(csv_path)

                    last_row = df_sym.iloc[-1]
                    metadata[sym] = {
                        "latest_date": str(df_sym.index[-1].date()),
                        "close": float(last_row["Close"]),
                        "volume": float(last_row["Volume"]),
                        "bars_count": len(df_sym)
                    }
                    total_saved += 1
                else:
                    print(f"  Notice: Symbol {sym} not found in Alpaca bars")

        except Exception as e:
            print(f"  Batch download error: {e}")

    # Write metadata summary
    meta_path = PROJECT_ROOT / "data" / "universe_metadata.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nIngestion Complete: Successfully saved {total_saved}/{len(ALL_TICKERS)} symbols to {DATA_DIR}")
    print(f"Metadata index written to {meta_path}\n")

if __name__ == "__main__":
    main()
