@echo off
echo ==========================================
echo    EduPlan SA - South African Education
echo ==========================================
echo.

REM Add node to PATH so everything works
set PATH=C:\Users\dihel\AppData\Local\Programs\kimi-desktop\resources\resources\runtime;%PATH%

REM Start backend in a new window
echo Starting backend server...
start "EduPlan SA Backend" cmd /k "cd /d C:\Users\dihel\Documents\kimi\workspace\edupulsa\backend && node server.js"

REM Wait 3 seconds for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in a new window
echo Starting frontend dev server...
start "EduPlan SA Frontend" cmd /k "cd /d C:\Users\dihel\Documents\kimi\workspace\edupulsa\frontend && npm run dev"

REM Wait 8 seconds for frontend to be ready
timeout /t 8 /nobreak >nul

REM Open browser
echo Opening browser...
start http://localhost:5173

echo.
echo ==========================================
echo    EduPlan SA is opening in your browser!
echo.
echo    Login with:
echo    Email: demo@teacherhub.com
echo    Password: demo123
echo ==========================================
echo.
echo Press any key to close this window...
pause >nul
