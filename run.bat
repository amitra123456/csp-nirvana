@echo off
REM ==============================================================================
REM CSP-Nirvana Quick Launcher (Windows)
REM ==============================================================================

if "%1"=="--ui" (
    echo Launching CSP-Nirvana Streamlit Web Dashboard...
    streamlit run app.py --server.port 8502
    goto end
)

if "%1"=="--cli" (
    python screener.py %2 %3 %4 %5
    goto end
)

echo ==============================================================================
echo   CSP-Nirvana: Institutional Cash-Secured Put Screener
echo ==============================================================================
echo Usage:
echo   run.bat --ui              ^: Launch interactive Streamlit Web UI (Port 8502)
echo   run.bat --cli             ^: Run screener in terminal on default watchlist
echo   run.bat --cli --red-only  ^: Run screener on pullbacks/red days only
echo ==============================================================================
python screener.py

:end
