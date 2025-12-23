@echo off
title Flight Plan Demo Server
cd /d "%~dp0"
echo =========================================
echo   Flight Plan Demo - Starting Server
echo =========================================
echo.
echo Opening:
echo   Presenter: http://localhost:8000/#/presenter
echo   Display:   http://localhost:8000/#/display
echo.
echo Press Ctrl+C to stop the server.
echo.
node server.js
pause
