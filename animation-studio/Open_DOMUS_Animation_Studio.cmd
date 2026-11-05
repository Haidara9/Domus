@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto :failed
call npm.cmd ci --ignore-scripts
if errorlevel 1 goto :failed
call npm.cmd run prepare:assets
if errorlevel 1 goto :failed
call npm.cmd run commands
if errorlevel 1 goto :failed
call npm.cmd run typecheck
if errorlevel 1 goto :failed
call npm.cmd run doctor
if errorlevel 1 goto :failed
call npx.cmd remotion studio src/index.ts --port=3106
if errorlevel 1 goto :failed
exit /b 0
:failed
echo Setup or preview failed. Read the error above. Node 22.18+ required.
pause
exit /b 1
