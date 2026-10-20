@echo off
cd /d "%~dp0"
set PY=python
where py >nul 2>nul && set PY=py
if not exist .venv\Scripts\python.exe (
  echo Setting up for first run...
  %PY% -m venv .venv
)
.venv\Scripts\python.exe -m pip install -q -r requirements.txt
.venv\Scripts\python.exe app.py
pause
