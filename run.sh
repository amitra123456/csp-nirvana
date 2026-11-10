#!/usr/bin/env bash
# ==============================================================================
# CSP-Nirvana Quick Launcher (Linux / macOS)
# ==============================================================================

if [ "$1" == "--ui" ]; then
    echo "Launching CSP-Nirvana Streamlit Web Dashboard..."
    streamlit run app.py --server.port 8502
    exit 0
fi

if [ "$1" == "--cli" ]; then
    shift
    python3 screener.py "$@"
    exit 0
fi

echo "=============================================================================="
echo "  CSP-Nirvana: Institutional Cash-Secured Put Screener"
echo "=============================================================================="
echo "Usage:"
echo "  ./run.sh --ui              : Launch interactive Streamlit Web UI (Port 8502)"
echo "  ./run.sh --cli             : Run screener in terminal on default watchlist"
echo "  ./run.sh --cli --red-only  : Run screener on pullbacks/red days only"
echo "=============================================================================="
python3 screener.py
