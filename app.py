"""
CSP-Nirvana: Streamlit Web Dashboard
====================================
Interactive Institutional Cash-Secured Put Screener, SMC Dealing Ranges,
and Move Amplitude Terminal.
"""

from __future__ import annotations

import sys
import math
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from config.settings import (
    TIER_1_BLUE_CHIPS,
    TIER_2_HIGH_BETA,
    DEFAULT_UNIVERSE,
    DEFAULTS
)
from core.options_scanner import run_screener

st.set_page_config(
    page_title="CSP-Nirvana // Institutional Options Terminal",
    page_icon="🧘‍♂️",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
        .stApp {
            background-color: #0B0E14;
            color: #F1F5F9;
        }
        .block-container {
            padding-top: 1rem !important;
            padding-bottom: 2rem !important;
            padding-left: 1.5rem !important;
            padding-right: 1.5rem !important;
            max-width: 100% !important;
        }
        .metric-card {
            background: linear-gradient(135deg, #131823 0%, #1A2234 100%);
            border: 1px solid #2A364F;
            border-radius: 8px;
            padding: 14px 18px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }
        .metric-label {
            font-size: 0.75rem;
            color: #94A3B8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 2px;
        }
        .metric-val {
            font-size: 1.5rem;
            font-weight: 700;
            color: #38BDF8;
        }
        .rule-box {
            background-color: #111827;
            border-left: 4px solid #10B981;
            padding: 12px 18px;
            border-radius: 4px;
            margin-bottom: 15px;
            font-size: 0.88rem;
            color: #E2E8F0;
        }
    </style>
    """,
    unsafe_allow_html=True,
)

st.markdown("## 🧘‍♂️ CSP-Nirvana // Institutional Cash-Secured Put Screener")
st.markdown(
    "<span style='color: #94A3B8;'>Pure Trading Peace of Mind · SMC Dealing Ranges · Anchored VWAP · S/R Cushions · 100% Cash Collateral</span>",
    unsafe_allow_html=True
)

with st.expander("📖 The Nirvana Creed (Kirsten's Operational Rules)", expanded=False):
    st.markdown("""
    <div class="rule-box">
        <strong>1. STRICTLY CASH-SECURED (ZERO MARGIN)</strong>: Full collateral is allocated in cash ($Strike × 100$). Never sell puts on margin.<br>
        <strong>2. THE ASSIGNMENT DISCIPLINE</strong>: Only sell puts on stocks you genuinely want to own for the next 1–2 years. Assignment is a planned accumulation at a discount, not a loss.<br>
        <strong>3. SMC & S/R ANCHORING</strong>: Strikes are placed <strong>12%–20% below spot</strong>, anchoring the net cost basis inside the <strong>ICT OTE (61.8%–78.6%) Discount Pocket</strong> or beneath 50 SMA / Anchored VWAP.<br>
        <strong>4. EXPIRATION SWEET SPOT</strong>: Targeting <strong>28 to 42 DTE (~35 DTE)</strong> for maximum theta decay velocity.<br>
        <strong>5. SYSTEMATIC EXITS</strong>: Take profit at <strong>50%–75% gain</strong>. If breached, roll out in time for additional net credits to continually lower the effective breakeven.
    </div>
    """, unsafe_allow_html=True)

# ---------------------------------------------------------
# Sidebar Controls
# ---------------------------------------------------------
with st.sidebar:
    st.markdown("### ⚙️ Screener Controls")
    
    preset_choice = st.selectbox(
        "Watchlist Universe",
        [
            "Combined Full Universe (20 Names)",
            "Tier 1: Core Blue Chips (AAPL, MSFT, NVDA...)",
            "Tier 2: High-Beta Growth (HOOD, NOW, PLTR...)",
            "Custom Watchlist"
        ],
        index=0
    )
    
    if preset_choice == "Tier 1: Core Blue Chips (AAPL, MSFT, NVDA...)":
        symbols_to_run = TIER_1_BLUE_CHIPS
    elif preset_choice == "Tier 2: High-Beta Growth (HOOD, NOW, PLTR...)":
        symbols_to_run = TIER_2_HIGH_BETA
    elif preset_choice == "Combined Full Universe (20 Names)":
        symbols_to_run = DEFAULT_UNIVERSE
    else:
        custom_input = st.text_area("Custom Tickers (comma separated)", "HOOD, NVDA, PLTR, AMZN, NOW, GOOGL")
        symbols_to_run = [s.strip().upper() for s in custom_input.split(",") if s.strip()]

    st.markdown("---")
    st.markdown("### 🎛️ Parameters")
    
    target_dte = st.slider("Target DTE", 21, 60, DEFAULTS["target_dte"], step=1)
    cushion_pct = st.slider("Strike Cushion Below Spot (%)", 5.0, 25.0, DEFAULTS["cushion_pct"], step=0.5)
    min_premium = st.slider("Min Bid Premium ($)", 0.50, 5.00, DEFAULTS["min_premium"], step=0.10)
    min_roc_pct = st.slider("Min ROC per Cycle (%)", 0.5, 5.0, DEFAULTS["min_roc_pct"], step=0.1)
    red_only = st.checkbox("Only Red Days (Pullbacks)", value=False)
    
    st.markdown("---")
    run_btn = st.button("⚡ Run Live Scan", type="primary", use_container_width=True)

# ---------------------------------------------------------
# Execution & Caching
# ---------------------------------------------------------
@st.cache_data(ttl=900, show_spinner=False)
def execute_scan(tickers_list, dte, cushion, min_prem, min_roc, red_flg):
    return run_screener(
        tickers=tickers_list,
        target_dte=dte,
        cushion_pct=cushion,
        min_premium=min_prem,
        min_roc_pct=min_roc,
        red_only=red_flg
    )

if "csp_results" not in st.session_state or run_btn:
    with st.spinner(f"Scanning {len(symbols_to_run)} high-conviction tickers..."):
        results, ohlcv_cache = execute_scan(
            symbols_to_run, target_dte, cushion_pct, min_premium, min_roc_pct, red_only
        )
        st.session_state["csp_results"] = results
        st.session_state["csp_cache"] = ohlcv_cache
else:
    results = st.session_state.get("csp_results", [])
    ohlcv_cache = st.session_state.get("csp_cache", {})

# ---------------------------------------------------------
# Top Metrics Bar
# ---------------------------------------------------------
col1, col2, col3, col4, col5 = st.columns(5)
total_scanned = len(symbols_to_run)
total_qualified = len(results)
avg_roc = np.mean([r['roc_cycle_pct'] for r in results]) if results else 0.0
avg_ann = np.mean([r['annualized_roc_pct'] for r in results]) if results else 0.0
top_pick = results[0]['ticker'] if results else "None"

def render_kpi(label, val, sub="", color="#38BDF8"):
    return f"""
    <div class="metric-card">
        <div class="metric-label">{label}</div>
        <div class="metric-val" style="color: {color};">{val}</div>
        <div style="font-size: 0.72rem; color: #64748B;">{sub}</div>
    </div>
    """

with col1: st.markdown(render_kpi("Universe Scanned", str(total_scanned), "Large-Cap Watchlist"), unsafe_allow_html=True)
with col2: st.markdown(render_kpi("Qualified Setups", str(total_qualified), "Passing Cushion & ROC", "#10B981"), unsafe_allow_html=True)
with col3: st.markdown(render_kpi("Avg ROC / Cycle", f"{avg_roc:.2f}%", f"In ~{target_dte} DTE window"), unsafe_allow_html=True)
with col4: st.markdown(render_kpi("Avg Annualized Yield", f"{avg_ann:.1f}%", "Cash-Secured ROC", "#F59E0B"), unsafe_allow_html=True)
with col5: st.markdown(render_kpi("Top Ranked Pick", top_pick, "Highest ROC/safety ratio", "#A855F7"), unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# ---------------------------------------------------------
# Primary Results Table
# ---------------------------------------------------------
if not results:
    st.warning("No candidates currently pass the strict screening filters. Try loosening the cushion % or minimum premium.")
else:
    st.markdown("### 📋 Screened Candidates Ranked by ROC & Probability")
    table_rows = []
    for r in results:
        pa = r.get('prob_amp', {})
        pos_smc_str = f"{pa.get('empirical_pos_otm', 0.0):.1f}%" if pa else "-"
        pos_50_str = f"{pa.get('prob_50_tp', 0.0):.1f}%" if pa else "-"
        move_str = f"±{pa.get('implied_move_pct', 0.0):.1f}%" if pa else "-"

        table_rows.append({
            "Ticker": r['ticker'],
            "Spot": f"${r['spot']:.2f}",
            "Day %": f"{r['day_change_pct']:+.2f}%",
            "Strike": f"${r['strike']:.2f}",
            "Cushion": f"{r['cushion_pct']:.1f}% OTM",
            "Expiry": r['expiry'],
            "DTE": r['dte'],
            "Bid": f"${r['bid']:.2f}",
            "Cash Collateral": f"${r['collateral']:,.0f}",
            "Net Cost Basis": f"${r['cost_basis']:.2f}",
            "ROC %": f"{r['roc_cycle_pct']:.2f}%",
            "Ann. Yield": f"{r['annualized_roc_pct']:.1f}%",
            "PoS (SMC)": pos_smc_str,
            "PoS (50% TP)": pos_50_str,
            "1σ Move": move_str,
            "50% TP": f"${r['tp_50_price']:.2f}",
            "SMC OTE Zone": "✅ In OTE Discount" if r['ote_in_range'] else "Below 50% Eq"
        })
    st.dataframe(pd.DataFrame(table_rows), use_container_width=True, hide_index=True)

    # ---------------------------------------------------------
    # Candidate Deep Dive
    # ---------------------------------------------------------
    st.markdown("---")
    st.markdown("### 🔍 Technical Chart, Probability & Strike Ladder Deep-Dive")
    selected_ticker = st.selectbox(
        "Select Candidate for Deep-Dive Analysis:",
        [r['ticker'] for r in results],
        index=0
    )

    cand = next(r for r in results if r['ticker'] == selected_ticker)
    df_ohlcv = ohlcv_cache.get(selected_ticker)
    pa = cand.get('prob_amp', {})

    if pa:
        g1, g2, g3, g4, g5 = st.columns(5)
        with g1: st.markdown(render_kpi("Prob. of 50% TP Early", f"{pa.get('prob_50_tp', 0.0):.1f}%", "Theta + mean reversion", "#10B981"), unsafe_allow_html=True)
        with g2: st.markdown(render_kpi("Structural SMC PoS", f"{pa.get('empirical_pos_otm', 0.0):.1f}%", f"B-S Delta: {pa.get('bs_delta', 0.0):.2f}Δ", "#38BDF8"), unsafe_allow_html=True)
        with g3: st.markdown(render_kpi("Implied 1σ Move", f"±{pa.get('implied_move_pct', 0.0):.1f}%", f"Floor: ${pa.get('one_sigma_lower', 0.0):.2f}", "#F59E0B"), unsafe_allow_html=True)
        with g4:
            ema20 = pa.get('upside_targets', {}).get('ema20', {})
            st.markdown(render_kpi("Bounce to 20 EMA", f"+{ema20.get('amp_pct', 0.0):.1f}%", f"Target: ${ema20.get('price', 0.0):.2f}", "#A855F7"), unsafe_allow_html=True)
        with g5: st.markdown(render_kpi("Est. Days to 50% TP", f"~{pa.get('est_days_to_50tp', 0)} Days", f"Limit: ${cand['tp_50_price']:.2f}", "#38BDF8"), unsafe_allow_html=True)
        st.markdown("<br>", unsafe_allow_html=True)

    col_chart, col_ladder = st.columns([7, 5])
    with col_chart:
        st.markdown(f"#### {selected_ticker} Daily Candlesticks · Anchored VWAP · SMC OTE")
        if df_ohlcv is not None and not df_ohlcv.empty:
            chart_df = df_ohlcv.iloc[-100:].copy()
            chart_df['SMA50'] = chart_df['Close'].rolling(50).mean()
            chart_df['SMA200'] = chart_df['Close'].rolling(200).mean()

            fig = go.Figure()
            fig.add_trace(go.Candlestick(
                x=chart_df.index,
                open=chart_df['Open'],
                high=chart_df['High'],
                low=chart_df['Low'],
                close=chart_df['Close'],
                name="OHLC",
                increasing_line_color='#10B981',
                decreasing_line_color='#EF4444'
            ))
            fig.add_trace(go.Scatter(x=chart_df.index, y=chart_df['SMA50'], line=dict(color='#38BDF8', width=1.5), name="50 SMA"))
            fig.add_trace(go.Scatter(x=chart_df.index, y=chart_df['SMA200'], line=dict(color='#A855F7', width=1.5, dash='dot'), name="200 SMA"))
            fig.add_hrect(
                y0=cand['ote_786'],
                y1=cand['ote_618'],
                line_width=0,
                fillcolor="#10B981",
                opacity=0.15,
                annotation_text="ICT OTE Discount Pocket (0.618 - 0.786)",
                annotation_position="bottom right"
            )
            fig.add_hline(
                y=cand['strike'],
                line_dash="dash",
                line_color="#F59E0B",
                line_width=2,
                annotation_text=f"Strike: ${cand['strike']:.2f} ({cand['cushion_pct']:.1f}% OTM)",
                annotation_position="top left"
            )
            fig.add_hline(
                y=cand['cost_basis'],
                line_dash="solid",
                line_color="#EAB308",
                line_width=2,
                annotation_text=f"Net Basis: ${cand['cost_basis']:.2f}",
                annotation_position="bottom left"
            )
            fig.update_layout(
                template="plotly_dark",
                paper_bgcolor="#0B0E14",
                plot_bgcolor="#111827",
                height=480,
                margin=dict(l=20, r=20, t=30, b=20),
                xaxis_rangeslider_visible=False,
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
            )
            st.plotly_chart(fig, use_container_width=True)

    with col_ladder:
        st.markdown(f"#### Strike Ladder for {selected_ticker} ({cand['expiry']} · {cand['dte']} DTE)")
        ladder = cand.get('all_ladder_strikes', [])
        if ladder:
            ladder_rows = []
            for l in ladder:
                is_selected = l['strike'] == cand['strike']
                ladder_rows.append({
                    "Pick": "👉 TARGET" if is_selected else "",
                    "Strike": f"${l['strike']:.2f}",
                    "Cushion": f"{l['cushion_pct']:.1f}%",
                    "Bid": f"${l['bid']:.2f}",
                    "Basis": f"${l['cost_basis']:.2f}",
                    "ROC %": f"{l['roc_cycle_pct']:.2f}%",
                    "Ann. %": f"{l['annualized_roc_pct']:.1f}%"
                })
            st.dataframe(pd.DataFrame(ladder_rows), use_container_width=True, hide_index=True)

        st.markdown("""
        <div class="rule-box" style="margin-top: 15px;">
            <strong>Kirsten's Execution Checklist</strong>:
            <ul style="margin-top: 6px; margin-bottom: 0px; padding-left: 20px;">
                <li>Full cash collateral allocated? (No margin used)</li>
                <li>Net basis sits at/below major institutional liquidity?</li>
                <li>Comfortable owning 100 shares at the assigned basis?</li>
                <li>Set GTC limit buyback orders at 50% & 60% profit immediately upon fill.</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)
