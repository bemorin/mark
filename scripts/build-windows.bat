@echo off
setlocal
cd /d "%~dp0\.."

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js and npm are required: https://nodejs.org/
  pause
  exit /b 1
)

if exist package-lock.json (
  call npm ci
) else (
  call npm install
)
if errorlevel 1 pause & exit /b 1

call npm run check
if errorlevel 1 pause & exit /b 1

call npm run dist:win
if errorlevel 1 pause & exit /b 1

start "" release
