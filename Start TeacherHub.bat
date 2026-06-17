@echo off
echo ==========================================
echo    TeacherHub - South African CAPS Edition
echo ==========================================
echo.

REM Add node to PATH so everything works
set PATH=C:\Users\dihel\AppData\Local\Programs\kimi-desktop\resources\resources\runtime;%PATH%

REM Start backend in a new window
echo Starting backend server...
start "TeacherHub Backend" cmd /k "cd /d C:\Users\dihel\Documents\kimi\workspace\teacherhub\backend && node server.js"

REM Wait 3 seconds for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in a new window
echo Starting frontend server...
start "TeacherHub Frontend" cmd /k "cd /d C:\Users\dihel\Documents\kimi\workspace\teacherhub\frontend && npm run dev"

REM Wait 8 seconds for frontend to be ready
timeout /t 8 /nobreak >nul

REM Open browser
echo Opening browser...
start http://localhost:5173

echo.
echo ==========================================
echo    TeacherHub SA is opening in your browser!
echo.
echo    Login with:
echo    Email: demo@teacherhub.com
echo    Password: demo123
echo ==========================================
echo.
echo Press any key to close this window...
pause >nul
