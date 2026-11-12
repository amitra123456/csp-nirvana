"""
CSP-Nirvana: Quiet Desk Options Terminal
========================================
Single Source of Truth Dashboard: Next-Gen Rebuild matching Quiet Desk Design System.
Reads strictly from data/snapshots/latest.json. Formats only, never recalculates metrics.
"""

from __future__ import annotations

import os
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ---------------------------------------------------------
# Page Configuration
# ---------------------------------------------------------
st.set_page_config(
    page_title="CSP-Nirvana // Quiet Desk",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ---------------------------------------------------------
# HTML Helper to avoid Markdown indented code-block rendering
# ---------------------------------------------------------
def render_html(html_str: str) -> None:
    """Renders HTML cleanly in Streamlit, stripping leading whitespace so markdown never creates code blocks."""
    lines = [line.lstrip() for line in html_str.strip().splitlines()]
    st.markdown("\n".join(lines), unsafe_allow_html=True)

# ---------------------------------------------------------
# Quiet Desk Design System CSS
# Palette: #0B0E13 (bg), #0E1218 (header), #121821 (card),
# #18202B (raised), #1E2733 (border), #253041 (borderStrong),
# #E8ECF1 (text), #A3AEBC (secondary), #8792A2 (muted),
# #6CB4FF (favorable blue), #F2B24C (caution amber), #FF8B5C (risk orange).
# ---------------------------------------------------------
render_html(
    """
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

        /* Root Application Background */
        .stApp {
            background-color: #0B0E13 !important;
            color: #E8ECF1 !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* Top Header Container */
        .block-container {
            padding-top: 1rem !important;
            padding-bottom: 2rem !important;
            max-width: 1360px !important;
        }

        /* Mono font for figures and financial data */
        .font-mono {
            font-family: 'JetBrains Mono', monospace !important;
            font-feature-settings: 'tnum' on, 'zero' on;
        }

        /* Quiet Desk Cards */
        .desk-card {
            background-color: #121821;
            border: 1px solid #1E2733;
            border-radius: 12px;
            padding: 1.25rem;
            margin-bottom: 1rem;
        }

        .desk-card-raised {
            background-color: #18202B;
            border: 1px solid #253041;
            border-radius: 8px;
            padding: 1rem;
        }

        /* Header Bar */
        .top-navbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.85rem 1.25rem;
            background-color: #0E1218;
            border: 1px solid #1E2733;
            border-radius: 12px;
            margin-bottom: 1.5rem;
        }

        /* Status Dot */
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 6px;
        }
        .dot-green { background-color: #6CB4FF; box-shadow: 0 0 8px #6CB4FF88; }
        .dot-amber { background-color: #F2B24C; box-shadow: 0 0 8px #F2B24C88; }
        .dot-orange { background-color: #FF8B5C; box-shadow: 0 0 8px #FF8B5C88; }

        /* Badges */
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 0.2rem 0.55rem;
            border-radius: 4px;
            font-size: 0.72rem;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .badge-blue { background-color: rgba(108, 180, 255, 0.12); color: #6CB4FF; border: 1px solid rgba(108, 180, 255, 0.25); }
        .badge-amber { background-color: rgba(242, 178, 76, 0.12); color: #F2B24C; border: 1px solid rgba(242, 178, 76, 0.25); }
        .badge-orange { background-color: rgba(255, 139, 92, 0.12); color: #FF8B5C; border: 1px solid rgba(255, 139, 92, 0.25); }
        .badge-subtle { background-color: #18202B; color: #8792A2; border: 1px solid #253041; }

        /* KPI Card */
        .kpi-title {
            font-size: 0.72rem;
            color: #8792A2;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin-bottom: 0.25rem;
            font-family: 'JetBrains Mono', monospace;
        }
        .kpi-value {
            font-size: 1.55rem;
            font-weight: 700;
            color: #E8ECF1;
            font-family: 'JetBrains Mono', monospace;
        }
        .kpi-sub {
            font-size: 0.75rem;
            color: #8792A2;
            margin-top: 0.2rem;
        }

        /* Custom Table */
        .table-wrap {
            overflow-x: auto;
            background-color: #121821;
            border: 1px solid #1E2733;
            border-radius: 12px;
            margin-top: 0.75rem;
            margin-bottom: 1.25rem;
        }
        table.quiet-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.84rem;
            color: #E8ECF1;
        }
        table.quiet-table th {
            background-color: #0E1218;
            color: #8792A2;
            padding: 10px 14px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.72rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #253041;
            text-align: left;
            white-space: nowrap;
        }
        table.quiet-table td {
            padding: 11px 14px;
            border-bottom: 1px solid #1E2733;
            white-space: nowrap;
        }
        table.quiet-table tr:hover td {
            background-color: #18202B;
        }
        table.quiet-table tr:last-child td {
            border-bottom: none;
        }

        /* Streamlit Native Overrides */
        div[data-testid="stToolbar"] { visibility: hidden; height: 0%; position: fixed; }
        header[data-testid="stHeader"] { background-color: transparent !important; }
        .stTabs [data-baseweb="tab-list"] {
            background-color: #0E1218;
            border-radius: 8px;
            padding: 4px;
            border: 1px solid #1E2733;
            gap: 4px;
        }
        .stTabs [data-baseweb="tab"] {
            border-radius: 6px;
            color: #8792A2;
            padding: 8px 16px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .stTabs [aria-selected="true"] {
            background-color: #18202B !important;
            color: #6CB4FF !important;
            border: 1px solid #253041 !important;
        }
        button[kind="primary"] {
            background-color: #6CB4FF !important;
            color: #0B0E13 !important;
            font-weight: 600 !important;
            border: none !important;
        }
        button[kind="secondary"] {
            background-color: #18202B !important;
            color: #E8ECF1 !important;
            border: 1px solid #253041 !important;
        }
    </style>
    """
)

# ---------------------------------------------------------
# Snapshot Loader (One Source of Truth)
# ---------------------------------------------------------
def load_snapshot() -> Optional[Dict[str, Any]]:
    snap_path = PROJECT_ROOT / "data" / "snapshots" / "latest.json"
    if not snap_path.exists():
        snap_path = PROJECT_ROOT.parent / "data" / "snapshots" / "latest.json"
    if snap_path.exists():
        try:
            with open(snap_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None
    return None

load_latest_snapshot = load_snapshot

def load_daily_metadata() -> Optional[Dict[str, Any]]:
    """Loads 3:35 PM daily pipeline metadata. Never fabricates data if missing."""
    snap = load_latest_snapshot()
    if snap and "run" in snap:
        run_data = snap["run"]
        as_of = run_data.get("as_of_et", "")
        return {
            "last_updated": as_of.replace("T", " ")[:19] + " ET" if as_of else "—",
            "as_of_raw": as_of,
            "status": run_data.get("status", "ok").upper(),
            "total_population": len(snap.get("setups", [])) + len(snap.get("held_back", [])),
            "qualified_setups_count": len(snap.get("setups", [])),
            "active_positions_count": len(snap.get("positions", [])),
            "closed_trades_count": snap.get("backtest", {}).get("trades", 0),
            "next_scheduled_run": "3:35 PM ET on open market days"
        }
    return None

def format_curr(val: Optional[float]) -> str:
    if val is None or pd.isna(val):
        return "—"
    return f"${val:,.2f}"

def format_pct(val: Optional[float], plus: bool = True) -> str:
    if val is None or pd.isna(val):
        return "—"
    prefix = "+" if plus and val > 0 else ""
    return f"{prefix}{val:.1f}%"

def get_freshness_badge(as_of_str: str) -> tuple[str, str, str]:
    if not as_of_str:
        return "NO DATA", "dot-orange", "Snapshot missing"
    try:
        as_of_dt = datetime.fromisoformat(as_of_str.replace("Z", "+00:00"))
        now = datetime.now(as_of_dt.tzinfo)
        diff_hours = (now - as_of_dt).total_seconds() / 3600.0
        if diff_hours <= 24:
            return "LIVE / FRESH", "dot-green", "Under 24h old"
        elif diff_hours <= 48:
            return "STALE > 1 DAY", "dot-amber", "1-2 days old"
        else:
            return "STALE > 2 DAYS", "dot-orange", "Older than 48 hours"
    except Exception:
        return "TIMESTAMP UNKNOWN", "dot-amber", ""

def execute_pipeline_refresh():
    with st.spinner("Executing 3:35 PM ET screener pipeline..."):
        try:
            from scripts.daily_335pm_update import run_daily_pipeline
            run_daily_pipeline()
            st.success("Pipeline refreshed successfully!")
            st.rerun()
        except Exception as e:
            st.error(f"Pipeline error: {e}")

# Load Snapshot
snapshot = load_snapshot()

# ---------------------------------------------------------
# Global Header
# ---------------------------------------------------------
if snapshot:
    run_meta = snapshot.get("run", {})
    as_of = run_meta.get("as_of_et", "")
    as_of_disp = as_of.replace("T", " ")[:19] + " ET" if as_of else "—"
    fresh_label, dot_class, _ = get_freshness_badge(as_of)
    positions = snapshot.get("positions", [])
    itm_count = len([p for p in positions if p.get("status") == "itm"])
else:
    as_of_disp = "—"
    fresh_label, dot_class = "NO DATA", "dot-orange"
    itm_count = 0
    positions = []

render_html(
    f"""
    <div class="top-navbar">
        <div style="display: flex; align-items: center; gap: 14px;">
            <div style="font-weight: 700; font-size: 1.15rem; letter-spacing: -0.02em;">
                CSP<span style="color: #6CB4FF;">-NIRVANA</span>
            </div>
            <span class="badge badge-subtle">
                <span class="status-dot {dot_class}"></span>{fresh_label}
            </span>
            <span style="font-size: 0.78rem; color: #8792A2; font-family: 'JetBrains Mono', monospace;">
                As of: <strong style="color: #E8ECF1;">{as_of_disp}</strong>
            </span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
            {f'<span class="badge badge-orange">🚨 {itm_count} ITM Positions</span>' if itm_count > 0 else '<span class="badge badge-blue">✓ 0 ITM</span>'}
            <a href="http://localhost:3000" target="_blank" style="text-decoration: none;">
                <span class="badge badge-blue" style="cursor: pointer;">Open Next.js App (Port 3000) ↗</span>
            </a>
        </div>
    </div>
    """
)

if not snapshot:
    st.error("No snapshot found at data/snapshots/latest.json. Click below to trigger the 3:35 PM pipeline.")
    if st.button("⚡ Run Pipeline Now", type="primary"):
        execute_pipeline_refresh()
    st.stop()

# ---------------------------------------------------------
# Screen Navigation Tabs
# ---------------------------------------------------------
tab_today, tab_ticket, tab_positions, tab_evidence, tab_rules = st.tabs([
    "1. Today (Setups)",
    "2. Trade Ticket",
    "3. Positions Book",
    "4. Evidence (Backtest)",
    "5. Strategy Rules"
])

# =========================================================
# SCREEN 1: TODAY (Setups)
# =========================================================
with tab_today:
    setups = snapshot.get("setups", [])
    held_back = snapshot.get("held_back", [])
    rules = snapshot.get("rules", {})

    # Top Controls Bar
    col_ctrl1, col_ctrl2 = st.columns([2, 1])
    with col_ctrl1:
        st.markdown(f"### Today's Qualified Setups &middot; {len(setups)}")
        render_html(
            f"<div style='font-size: 0.82rem; color: #8792A2;'>Target DTE: <strong>{rules.get('target_dte', 35)}d</strong> &middot; Min Cushion: <strong>{rules.get('cushion_min_pct', 12)}%</strong> &middot; Min ROC: <strong>{rules.get('min_roc_pct', 1.2)}%</strong></div>"
        )
    with col_ctrl2:
        c1, c2 = st.columns(2)
        with c1:
            if st.button("⚡ Run Scan Now", use_container_width=True):
                execute_pipeline_refresh()
        with c2:
            st.link_button("Next.js UI ↗", "http://localhost:3000", use_container_width=True)

    # ITM Alert Warning Banner
    if itm_count > 0:
        render_html(
            f"""
            <div class="desk-card" style="border-color: rgba(255, 139, 92, 0.4); background-color: rgba(255, 139, 92, 0.05); margin-top: 0.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: 600; color: #FF8B5C; font-size: 0.88rem;">
                        ⚠️ {itm_count} active position(s) are currently IN-THE-MONEY. Action required before next expiry.
                    </div>
                    <span class="badge badge-orange">Check Positions Tab</span>
                </div>
            </div>
            """
        )

    # Setups Table
    if setups:
        rows_html = []
        tot_collateral = sum(s.get("collateral", 0) for s in setups)
        tot_credit = sum(s.get("credit", 0) for s in setups)

        for i, s in enumerate(setups):
            ticker = s.get("ticker", "")
            name = s.get("name", ticker)
            spot = s.get("spot", 0.0)
            strike = s.get("strike", 0.0)
            cushion = s.get("cushion_pct", 0.0)
            bid = s.get("bid", 0.0)
            roc_cycle = s.get("roc_cycle_pct", 0.0)
            roc_ann = s.get("roc_annual_pct", 0.0)
            odds = s.get("odds_otm_market_pct", 0.0)
            score = s.get("score", 0.0)
            dte = s.get("dte", 0)
            expiry = s.get("expiry", "")

            # Trend badge
            trend = s.get("trend", "pullback")
            trend_badge = f'<span class="badge badge-blue">{trend.upper()}</span>'

            rows_html.append(f"""
<tr>
<td class="font-mono" style="color: #8792A2;">#{i+1}</td>
<td>
<strong style="font-size: 0.95rem; color: #E8ECF1;">{ticker}</strong>
<div style="font-size: 0.72rem; color: #8792A2;">{name}</div>
</td>
<td class="font-mono">${spot:.2f}</td>
<td class="font-mono"><strong style="color: #6CB4FF;">${strike:.1f}P</strong></td>
<td class="font-mono" style="color: #6CB4FF; font-weight: 600;">+{cushion:.1f}%</td>
<td class="font-mono" style="color: #E8ECF1;">${bid:.2f}</td>
<td class="font-mono" style="color: #6CB4FF; font-weight: 600;">{roc_cycle:.2f}%</td>
<td class="font-mono" style="color: #8792A2;">{roc_ann:.1f}%</td>
<td class="font-mono">{odds:.1f}%</td>
<td class="font-mono" style="color: #8792A2;">{expiry} ({dte}d)</td>
<td>{trend_badge}</td>
<td class="font-mono" style="font-weight: 700; color: #6CB4FF; font-size: 0.95rem;">{score:.1f}</td>
</tr>
""")

        render_html(
            f"""
            <div class="table-wrap">
                <table class="quiet-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Ticker</th>
                            <th>Spot</th>
                            <th>Put Strike</th>
                            <th>Cushion</th>
                            <th>Bid Credit</th>
                            <th>ROC/Cyc</th>
                            <th>ROC/Ann</th>
                            <th>Odds OTM</th>
                            <th>Expiry</th>
                            <th>Trend</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {''.join(rows_html)}
                    </tbody>
                </table>
            </div>
            """
        )

        # "If you take all N" Card
        avg_cushion = sum(s.get("cushion_pct", 0) for s in setups) / len(setups) if setups else 0
        avg_roc = sum(s.get("roc_cycle_pct", 0) for s in setups) / len(setups) if setups else 0
        render_html(
            f"""
            <div class="desk-card-raised">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <div class="kpi-title">PORTFOLIO DEPLOYMENT IF ALL {len(setups)} TAKEN</div>
                        <div style="font-size: 1.15rem; font-weight: 700; color: #E8ECF1; font-family: 'JetBrains Mono', monospace;">
                            Total Collateral: <span style="color: #6CB4FF;">${tot_collateral:,.0f}</span> &middot; 
                            Premium Captured: <span style="color: #6CB4FF;">${tot_credit:,.0f}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 1.5rem; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem;">
                        <div>Avg Cushion: <strong style="color: #6CB4FF;">+{avg_cushion:.1f}%</strong></div>
                        <div>Avg ROC / Cycle: <strong style="color: #6CB4FF;">+{avg_roc:.2f}%</strong></div>
                    </div>
                </div>
            </div>
            """
        )
    else:
        st.info("No candidates qualified in current snapshot under active parameters.")

    # Held Back Candidates
    if held_back:
        st.markdown(f"#### Held Back by Validation Gates &middot; {len(held_back)}")
        hb_rows = "".join([
            f"<tr><td class='font-mono'><strong>{hb.get('ticker')}</strong></td><td style='color: #8792A2;'>{hb.get('reason')}</td></tr>"
            for hb in held_back
        ])
        render_html(
            f"""
            <div class="table-wrap">
                <table class="quiet-table">
                    <thead><tr><th style="width: 120px;">Ticker</th><th>Gate Rejection Reason</th></tr></thead>
                    <tbody>{hb_rows}</tbody>
                </table>
            </div>
            """
        )

# =========================================================
# SCREEN 2: TRADE TICKET
# =========================================================
with tab_ticket:
    if setups:
        tickers = [s.get("ticker") for s in setups]
        selected_ticker = st.selectbox("Select Trade Setup Candidate", tickers, index=0)
        setup = next((s for s in setups if s.get("ticker") == selected_ticker), setups[0])

        render_html(
            f"""
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 0.5rem; margin-bottom: 1rem;">
                <div>
                    <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700;">{setup.get('ticker')} &middot; {setup.get('name')}</h2>
                    <span style="font-size: 0.8rem; color: #8792A2; font-family: 'JetBrains Mono', monospace;">
                        Spot: ${setup.get('spot', 0.0):.2f} &middot; Volatility IV: {(setup.get('iv', 0.0)*100):.1f}% &middot; Delta: {setup.get('delta', 0.0):.3f}
                    </span>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.72rem; color: #8792A2; font-family: 'JetBrains Mono', monospace;">COMPOSITE SCORE</div>
                    <div style="font-size: 1.75rem; font-weight: 800; color: #6CB4FF; font-family: 'JetBrains Mono', monospace;">
                        {setup.get('score', 0.0):.1f}
                    </div>
                </div>
            </div>
            """
        )

        # Primary Execution Card
        render_html(
            f"""
            <div class="desk-card" style="border: 2px solid #253041; background: linear-gradient(180deg, #18202B 0%, #121821 100%);">
                <div style="font-size: 0.72rem; color: #6CB4FF; font-family: 'JetBrains Mono', monospace; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">
                    SYSTEMATIC EXECUTION ORDER
                </div>
                <div style="font-size: 1.35rem; font-weight: 700; color: #E8ECF1; margin: 0.35rem 0; font-family: 'JetBrains Mono', monospace;">
                    SELL 1 <span style="color: #6CB4FF;">{setup.get('ticker')}</span> {setup.get('expiry')} <span style="color: #6CB4FF;">${setup.get('strike'):.1f} PUT</span> @ <span style="color: #6CB4FF;">${setup.get('bid', 0.0):.2f}</span>
                </div>
                <div style="font-size: 0.82rem; color: #8792A2; font-family: 'JetBrains Mono', monospace;">
                    Collateral: <strong>${setup.get('collateral', 0):,.0f}</strong> &middot; 
                    Immediate Credit: <strong>${setup.get('credit', 0):,.0f}</strong> &middot; 
                    Break-even: <strong>${setup.get('cost_basis', 0.0):.2f}</strong>
                </div>
            </div>
            """
        )

        # 4 Key Metrics
        k1, k2, k3, k4 = st.columns(4)
        with k1:
            render_html(
                f"""<div class="desk-card"><div class="kpi-title">ANNUALIZED ROC</div><div class="kpi-value" style="color: #6CB4FF;">{setup.get('roc_annual_pct', 0.0):.1f}%</div><div class="kpi-sub">{setup.get('roc_cycle_pct', 0.0):.2f}% per {setup.get('dte')}d cycle</div></div>"""
            )
        with k2:
            render_html(
                f"""<div class="desk-card"><div class="kpi-title">NET COST BASIS</div><div class="kpi-value">${setup.get('cost_basis', 0.0):.2f}</div><div class="kpi-sub">-{setup.get('cushion_pct', 0.0):.1f}% below spot</div></div>"""
            )
        with k3:
            render_html(
                f"""<div class="desk-card"><div class="kpi-title">STRIKE CUSHION</div><div class="kpi-value" style="color: #6CB4FF;">+{setup.get('cushion_pct', 0.0):.1f}%</div><div class="kpi-sub">1σ low: ${setup.get('one_sigma_low', 0.0):.2f}</div></div>"""
            )
        with k4:
            render_html(
                f"""<div class="desk-card"><div class="kpi-title">MARKET ODDS OTM</div><div class="kpi-value">{setup.get('odds_otm_market_pct', 0.0):.1f}%</div><div class="kpi-sub">Touch probability: {setup.get('odds_touch_market_pct', 0.0):.1f}%</div></div>"""
            )

        # Systematic Trade Plan
        plan = setup.get("plan", {})
        render_html(
            f"""
            <div class="desk-card">
                <div class="kpi-title">SYSTEMATIC LIFECYCLE MANAGEMENT PLAN</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-top: 0.5rem; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem;">
                    <div class="desk-card-raised">
                        <div style="color: #8792A2; font-size: 0.72rem;">TAKE PROFIT (TP 50)</div>
                        <div style="font-size: 1.15rem; font-weight: 700; color: #6CB4FF;">${plan.get('tp50', 0.0):.2f}</div>
                        <div style="color: #8792A2; font-size: 0.72rem;">Close to capture 50% credit</div>
                    </div>
                    <div class="desk-card-raised">
                        <div style="color: #8792A2; font-size: 0.72rem;">ROLL TRIGGER LEVEL</div>
                        <div style="font-size: 1.15rem; font-weight: 700; color: #F2B24C;">${plan.get('roll_trigger_price', 0.0):.2f}</div>
                        <div style="color: #8792A2; font-size: 0.72rem;">Roll down/out if spot touches</div>
                    </div>
                    <div class="desk-card-raised">
                        <div style="color: #8792A2; font-size: 0.72rem;">STRESS TEST (-30% DROP)</div>
                        <div style="font-size: 1.15rem; font-weight: 700; color: #FF8B5C;">-${abs(plan.get('stress_loss', 0)):,.0f}</div>
                        <div style="color: #8792A2; font-size: 0.72rem;">Worst-case assignment loss</div>
                    </div>
                </div>
            </div>
            """
        )

        # 7-Part Scoring Breakdown
        score_parts = setup.get("score_parts", {})
        if score_parts:
            st.markdown("#### Institutional 7-Factor Model Attribution")
            sp_cols = st.columns(len(score_parts))
            for col, (part_name, vals) in zip(sp_cols, score_parts.items()):
                with col:
                    earned, total = vals[0], vals[1]
                    pct = (earned / total) * 100 if total > 0 else 0
                    render_html(
                        f"""
                        <div class="desk-card-raised" style="text-align: center; padding: 0.75rem 0.5rem;">
                            <div style="font-size: 0.68rem; color: #8792A2; text-transform: uppercase; font-family: 'JetBrains Mono', monospace;">{part_name}</div>
                            <div style="font-size: 1.1rem; font-weight: 700; color: #6CB4FF; font-family: 'JetBrains Mono', monospace;">{earned:.1f} <span style="font-size: 0.75rem; color: #8792A2;">/ {total}</span></div>
                            <div style="background-color: #253041; border-radius: 4px; height: 4px; width: 100%; margin-top: 6px; overflow: hidden;">
                                <div style="background-color: #6CB4FF; height: 100%; width: {pct}%;"></div>
                            </div>
                        </div>
                        """
                    )
    else:
        st.info("No candidate available for trade ticket.")

# =========================================================
# SCREEN 3: POSITIONS BOOK
# =========================================================
with tab_positions:
    portfolio = snapshot.get("portfolio", {})
    pos_list = snapshot.get("positions", [])

    # 5 KPI Strip
    p1, p2, p3, p4, p5 = st.columns(5)
    with p1:
        render_html(
            f"""<div class="desk-card"><div class="kpi-title">ACTIVE CONTRACTS</div><div class="kpi-value">{portfolio.get('open_count', len(pos_list))}</div><div class="kpi-sub">Cash-secured puts</div></div>"""
        )
    with p2:
        render_html(
            f"""<div class="desk-card"><div class="kpi-title">TOTAL COLLATERAL</div><div class="kpi-value">${portfolio.get('collateral', 0):,.0f}</div><div class="kpi-sub">Reserved cash</div></div>"""
        )
    with p3:
        render_html(
            f"""<div class="desk-card"><div class="kpi-title">CREDIT COLLECTED</div><div class="kpi-value" style="color: #6CB4FF;">${portfolio.get('credit_collected', 0):,.0f}</div><div class="kpi-sub">Immediate premium</div></div>"""
        )
    with p4:
        unrealized = portfolio.get('unrealized', 0)
        u_color = "#6CB4FF" if unrealized >= 0 else "#FF8B5C"
        render_html(
            f"""<div class="desk-card"><div class="kpi-title">UNREALIZED P&L</div><div class="kpi-value" style="color: {u_color};">${unrealized:,.0f}</div><div class="kpi-sub">Mark-to-market</div></div>"""
        )
    with p5:
        render_html(
            f"""<div class="desk-card"><div class="kpi-title">ITM EXPOSURE</div><div class="kpi-value" style="color: #FF8B5C;">${portfolio.get('itm_assignment_value', 0):,.0f}</div><div class="kpi-sub">{portfolio.get('out_of_rolls', 0)} out of rolls</div></div>"""
        )

    # Urgent Action Required (ITM)
    itm_positions = [p for p in pos_list if p.get("status") == "itm"]
    if itm_positions:
        st.markdown(f"#### 🚨 Urgent: Action Required Before Next Expiry ({len(itm_positions)})")
        itm_rows = []
        for p in itm_positions:
            pnl = p.get('pnl', 0)
            pnl_color = "#6CB4FF" if pnl >= 0 else "#FF8B5C"
            step = p.get("next_step", "decide").upper()
            itm_rows.append(f"""
<tr>
<td class="font-mono"><strong>{p.get('ticker')}</strong></td>
<td class="font-mono">${p.get('strike'):.1f}P</td>
<td class="font-mono" style="color: #FF8B5C;">{p.get('expiry')} ({p.get('dte')}d)</td>
<td class="font-mono">${p.get('spot', 0.0):.2f}</td>
<td class="font-mono" style="color: #FF8B5C;">{p.get('spot_vs_strike_pct', 0.0):.1f}%</td>
<td class="font-mono" style="color: {pnl_color}; font-weight: 700;">${pnl:,.0f}</td>
<td class="font-mono">{p.get('rolls', 0)} / {p.get('rolls_max', 2)}</td>
<td><span class="badge badge-orange">{step}</span></td>
</tr>
""")
        render_html(
            f"""
            <div class="table-wrap">
                <table class="quiet-table">
                    <thead>
                        <tr>
                            <th>Ticker</th>
                            <th>Strike</th>
                            <th>Expiry</th>
                            <th>Current Spot</th>
                            <th>ITM Depth</th>
                            <th>Unrealized P&L</th>
                            <th>Rolls Used</th>
                            <th>Protocol Action</th>
                        </tr>
                    </thead>
                    <tbody>{''.join(itm_rows)}</tbody>
                </table>
            </div>
            """
        )

    # All Positions Ledger
    st.markdown("#### Complete Positions Ledger")
    if pos_list:
        all_rows = []
        for p in pos_list:
            status = p.get("status", "otm").upper()
            badge_type = "badge-blue" if status == "OTM" else ("badge-amber" if status == "NEAR" else "badge-orange")
            pnl = p.get("pnl", 0)
            pnl_col = "#6CB4FF" if pnl >= 0 else "#FF8B5C"
            all_rows.append(f"""
<tr>
<td class="font-mono"><strong>{p.get('ticker')}</strong></td>
<td class="font-mono">${p.get('strike'):.1f}P</td>
<td class="font-mono">{p.get('expiry')} ({p.get('dte')}d)</td>
<td class="font-mono">${p.get('open_credit', 0.0):.2f}</td>
<td class="font-mono">${p.get('mark_mid', 0.0):.2f}</td>
<td class="font-mono">${p.get('spot', 0.0):.2f}</td>
<td class="font-mono" style="color: {pnl_col}; font-weight: 700;">${pnl:,.0f}</td>
<td><span class="badge {badge_type}">{status}</span></td>
<td class="font-mono" style="color: #8792A2;">{p.get('next_step', 'hold')}</td>
</tr>
""")
        render_html(
            f"""
            <div class="table-wrap">
                <table class="quiet-table">
                    <thead>
                        <tr>
                            <th>Ticker</th>
                            <th>Strike</th>
                            <th>Expiry</th>
                            <th>Open Credit</th>
                            <th>Mark Mid</th>
                            <th>Spot Price</th>
                            <th>Unrealized P&L</th>
                            <th>Status</th>
                            <th>Next Step</th>
                        </tr>
                    </thead>
                    <tbody>{''.join(all_rows)}</tbody>
                </table>
            </div>
            """
        )

# =========================================================
# SCREEN 4: EVIDENCE (Backtest)
# =========================================================
with tab_evidence:
    backtest = snapshot.get("backtest", {})
    render_html(
        f"""
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem;">
            <div>
                <h3 style="margin: 0; display: inline-block;">Evidence &middot; Historical Simulation</h3>
                <span class="badge badge-amber" style="margin-left: 10px;">{backtest.get('label', 'SIMULATED')}</span>
                <div style="font-size: 0.8rem; color: #8792A2; margin-top: 4px;">
                    Daily close marks with mechanical 50% profit taking and assignment modeling.
                </div>
            </div>
            <div style="font-size: 0.75rem; color: #8792A2; font-family: 'JetBrains Mono', monospace;">
                Model As Of: {backtest.get('as_of', '—')[:10]}
            </div>
        </div>
        """
    )

    # 4 KPI Cards
    b1, b2, b3, b4 = st.columns(4)
    with b1:
        render_html(
            f"""<div class="desk-card"><div class="kpi-title">TOTAL TRADES</div><div class="kpi-value">{backtest.get('trades', 0):,}</div><div class="kpi-sub">Simulated cycles</div></div>"""
        )
    with b2:
        render_html(
            f"""<div class="desk-card"><div class="kpi-title">WIN RATE</div><div class="kpi-value" style="color: #6CB4FF;">{backtest.get('win_rate', 0.0):.1f}%</div><div class="kpi-sub">BE hurdle: {backtest.get('breakeven_win_rate', 0.0):.1f}%</div></div>"""
        )
    with b3:
        avg_w = backtest.get('avg_win', 0)
        avg_l = backtest.get('avg_loss', 0)
        ratio = abs(avg_l / avg_w) if avg_w != 0 else 0
        render_html(
            f"""<div class="desk-card"><div class="kpi-title">AVG WIN / AVG LOSS</div><div class="kpi-value"><span style="color: #6CB4FF;">${avg_w:,.0f}</span> / <span style="color: #FF8B5C;">-${abs(avg_l):,.0f}</span></div><div class="kpi-sub">Payoff ratio 1 : {ratio:.1f}</div></div>"""
        )
    with b4:
        render_html(
            f"""<div class="desk-card"><div class="kpi-title">NET REALIZED P&L</div><div class="kpi-value" style="color: #6CB4FF;">${backtest.get('net_pnl', 0):,.0f}</div><div class="kpi-sub">Compounded simulation</div></div>"""
        )

    # Win Rate vs Breakeven Visual Bar
    win_rate = backtest.get("win_rate", 95.0)
    be_rate = backtest.get("breakeven_win_rate", 87.0)
    render_html(
        f"""
        <div class="desk-card">
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-family: 'JetBrains Mono', monospace; margin-bottom: 6px;">
                <span>Win Rate: <strong style="color: #6CB4FF;">{win_rate:.1f}%</strong></span>
                <span>Breakeven Hurdle: <strong style="color: #FF8B5C;">{be_rate:.1f}%</strong></span>
            </div>
            <div style="background-color: #18202B; height: 16px; border-radius: 8px; border: 1px solid #253041; position: relative; overflow: hidden;">
                <div style="background-color: #6CB4FF; height: 100%; width: {win_rate}%; border-radius: 8px;"></div>
                <div style="position: absolute; left: {be_rate}%; top: 0; bottom: 0; width: 2px; background-color: #FF8B5C;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #8792A2; margin-top: 4px; font-family: 'JetBrains Mono', monospace;">
                <span>0%</span>
                <span style="color: #6CB4FF;">Edge Over Breakeven: +{(win_rate - be_rate):.1f}%</span>
                <span>100%</span>
            </div>
        </div>
        """
    )

    # Monthly Bar Chart
    monthly = backtest.get("monthly_pnl", [])
    if monthly:
        m_df = pd.DataFrame(monthly)
        fig = go.Figure()
        colors = ['#6CB4FF' if p >= 0 else '#FF8B5C' for p in m_df['pnl']]
        fig.add_trace(go.Bar(
            x=m_df['month'],
            y=m_df['pnl'],
            marker_color=colors,
            name="Monthly P&L ($)"
        ))
        fig.update_layout(
            paper_bgcolor="#121821",
            plot_bgcolor="#121821",
            margin=dict(l=20, r=20, t=30, b=20),
            height=280,
            font=dict(color="#8792A2", family="JetBrains Mono"),
            xaxis=dict(showgrid=False, linecolor="#253041"),
            yaxis=dict(showgrid=True, gridcolor="#1E2733", linecolor="#253041"),
        )
        st.markdown("#### Monthly Realized Net P&L")
        st.plotly_chart(fig, use_container_width=True)

# =========================================================
# SCREEN 5: STRATEGY RULES
# =========================================================
with tab_rules:
    st.markdown("### Institutional Strategy Rules & Risk Parameters")
    r1, r2 = st.columns(2)
    with r1:
        render_html(
            """
            <div class="desk-card">
                <div class="kpi-title" style="color: #6CB4FF;">1. RED DAY PULLBACK TRIGGER</div>
                <p style="font-size: 0.84rem; color: #E8ECF1; line-height: 1.6;">
                    Never sell cash-secured puts on green expansion days when implied volatility is compressed. Candidates must establish a constructive pullback into institutional support:
                </p>
                <ul style="font-size: 0.78rem; color: #8792A2; font-family: 'JetBrains Mono', monospace; line-height: 1.8;">
                    <li>&bull; Daily close &lt; open or daily return &lt; -0.75%</li>
                    <li>&bull; Candlestick confirmation: hammer wicks, dojis, absorption volume</li>
                    <li>&bull; Optimal trade entry (OTE 61.8% &ndash; 78.6% Fibonacci retracement)</li>
                </ul>
            </div>
            <div class="desk-card">
                <div class="kpi-title" style="color: #F2B24C;">2. THE 7 STRICT VALIDATION GATES</div>
                <p style="font-size: 0.84rem; color: #E8ECF1; line-height: 1.6;">
                    Any candidate failing any gate is rejected and recorded under <em>Held Back</em>:
                </p>
                <ul style="font-size: 0.78rem; color: #8792A2; font-family: 'JetBrains Mono', monospace; line-height: 1.8;">
                    <li>&bull; Quote age &le; 15 minutes during market hours</li>
                    <li>&bull; Bid &gt; $0, Ask &ge; Bid, Spread &le; 25% of mid, Open Interest &ge; 100</li>
                    <li>&bull; Cushion between 12% and 30%</li>
                    <li>&bull; IV between 5% and 300%</li>
                </ul>
            </div>
            """
        )
    with r2:
        render_html(
            """
            <div class="desk-card">
                <div class="kpi-title" style="color: #FF8B5C;">3. EARNINGS BLACKOUT PROTOCOL</div>
                <p style="font-size: 0.84rem; color: #E8ECF1; line-height: 1.6;">
                    Earnings surprises create binary tail risks that invalidate technical support:
                </p>
                <ul style="font-size: 0.78rem; color: #8792A2; font-family: 'JetBrains Mono', monospace; line-height: 1.8;">
                    <li>&bull; <strong>Hard Lockout:</strong> Never sell options expiring within 1 week of earnings</li>
                    <li>&bull; <strong>UI Blackout Window:</strong> Signals generated within 2 weeks prior or 1 week post are flagged with a prominent blackout tag</li>
                </ul>
            </div>
            <div class="desk-card">
                <div class="kpi-title" style="color: #6CB4FF;">4. SYSTEMATIC POSITION LIFECYCLE</div>
                <p style="font-size: 0.84rem; color: #E8ECF1; line-height: 1.6;">
                    Discretion is replaced with mathematical exit triggers:
                </p>
                <ul style="font-size: 0.78rem; color: #8792A2; font-family: 'JetBrains Mono', monospace; line-height: 1.8;">
                    <li>&bull; <strong>TP 50:</strong> Close candidate when 50% of original credit is captured</li>
                    <li>&bull; <strong>Roll Trigger:</strong> If spot drops within 2% of strike, initiate roll down/out</li>
                    <li>&bull; <strong>Roll Limit:</strong> Max 2 rolls per position; if exceeded, take physical delivery</li>
                </ul>
            </div>
            """
        )
