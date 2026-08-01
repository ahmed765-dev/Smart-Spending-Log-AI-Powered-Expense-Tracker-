@echo off
title Smart Spending Log - Local Server
echo ===================================================
echo   Starting Smart Spending Log Expense Tracker...
echo ===================================================
echo.
echo Opening browser at http://localhost:3000 ...
start http://localhost:3000
echo.
echo Server is running. (Do not close this window while using the app)
echo Press Ctrl+C in this window to stop the app anytime.
echo.
npm run dev
