# 🧘‍♂️ CSP-Nirvana
### Institutional Smart Money Concepts (SMC) Cash-Secured Put & Wheel Engine

[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Streamlit](https://img.shields.io/badge/UI-Streamlit-FF4B4B.svg)](https://streamlit.io/)

> **Pure Trading Peace of Mind (Nirvana)**: Sells cash-secured options on high-conviction large caps sitting at higher-timeframe technical support, anchoring short strikes and post-credit acquisition bases behind institutional **ICT OTE (0.618–0.786) Discount Pockets**, **Anchored VWAP**, and **50-day SMAs**.

---

## ⚡ The Nirvana Creed & Edge

Retail traders buy calls at market peaks and panic-buy puts after deep red days. **CSP-Nirvana inverts this behavior**:

1. **The Market Maker Posture**: ~70% of retail options expire worthless. By selling short options into institutional demand zones, you capture elevated volatility at peaks of retail fear.
2. **Zero Margin Anxiety (100% Cash-Secured)**: Every put contract is fully funded in cash ($\text{Strike} \times 100$). Margin is strictly prohibited, completely eliminating liquidation or margin call risk.
3. **The Dual-Outcome Win Structure**:
   * **Outcome A (Decay)**: The underlying stabilizes or bounces $\rightarrow$ Buy back early for **50%–75% profit**.
   * **Outcome B (Assignment)**: The underlying breaches the strike $\rightarrow$ Acquire high-conviction shares at a massive discount (having been paid to wait), then run the **Wheel** (write covered calls).
4. **The Rolling Defense**: If tested, roll out in time for **additional net credits** ($+\$1.50\text{ to }+\$4.80/\text{share}$), driving the effective cost basis far below initial market support.

---

## 🏗️ Architecture & Structure

```text
csp-nirvana/
├── app.py                      # Standalone Streamlit Web Dashboard
├── screener.py                 # CLI & Python API screener entrypoint
├── requirements.txt            # Lightweight dependencies (streamlit, yfinance, plotly, scipy)
├── run.bat / run.sh            # Quick-launch scripts for UI and CLI
├── config/
│   ├── settings.py             # Default strategy parameters (35 DTE, 12% cushion, min premium)
│   └── tickers.txt             # Tier 1 Blue-Chips & Tier 2 High-Beta Growth watchlists
├── core/
│   ├── smc_engine.py           # SMC Dealing Ranges, 50% Equilibrium, OTE, AVWAP, 50/200 SMA, FVGs
│   ├── probability_amplitude.py# Structural SMC PoS, Probability of 50% TP, Implied 1σ Move
│   └── options_scanner.py      # Live yfinance option chains, ROC, and cushion matching
└── docs/
    ├── RULES.md                # Kirsten's Short Options Best-Practice Guide (Foundational rules)
    └── TRADE_LOG_2026.md       # 100% Complete 2026 Trade Ledger (Decoded from 96 diagrams)
```

---

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/your-username/csp-nirvana.git
cd csp-nirvana
pip install -r requirements.txt
```

### 2. Launch the Interactive Web Dashboard

```bash
# Windows
run.bat --ui

# Linux / macOS
./run.sh --ui

# Or directly via Streamlit:
streamlit run app.py
```

### 3. Run the Command-Line Screener

```bash
# Run on default 20-name universe (35 DTE, 12% cushion)
python screener.py

# Run on specific tickers
python screener.py --tickers HOOD,NVDA,PLTR,AMZN,COIN --dte 35 --cushion 12

# Screen only red days (pullbacks into support)
python screener.py --red-only
```

---

## 📊 Quantitative Metrics & Gauges

* **Structural SMC PoS (%)**: Probability of expiring out of the money, adjusted for institutional support floors (Anchored VWAP, 50 SMA, and 0.618–0.786 OTE).
* **Probability of 50% TP Early (%)**: Probability of touching the 50% profit target prior to expiration due to theta decay and mean reversion.
* **Market-Implied $1\sigma$ Expected Move**: Market-implied volatility range ($\text{Spot} \times \text{IV} \times \sqrt{T}$). Short strikes are verified to sit at or below this lower floor.
* **Return on Collateral (ROC %)**: Return on cash collateral per ~35-day cycle (typically **1.5%–4.0%**, or **18%–45% annualized**).

---

## 📜 Empirical Track Record

See [docs/TRADE_LOG_2026.md](docs/TRADE_LOG_2026.md) for the verified 2026 trade ledger decoded across 96 real-world trade alert diagrams:
* **Win Rate on Closed Trades**: **100%**
* **Average Early Exit Gain**: **60%–75% profit** (typically booked within 4 to 14 days)
* **Zero Panic Cuts**: When tested, trades were rolled forward for substantial net credits or transitioned into the Wheel.

---

## 📄 License
MIT License. Free for research, quantitative development, and personal trading.
