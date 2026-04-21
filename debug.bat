@echo off
chcp 65001 >nul
title Digital Attendance Debug

echo Starting Electron with DevTools enabled...
echo.

"C:\workTimer\node_modules\electron\dist\electron.exe" "C:\workTimer" --disable-gpu --enable-logging

pause
