@echo off
echo.
echo ======================================
echo   QuantumCraft Launcher - Demarrage
echo ======================================
echo.

REM Verifier si node_modules existe
if not exist "node_modules\" (
    echo [INFO] Installation des dependances...
    echo.
    call npm install
    echo.
    if errorlevel 1 (
        echo [ERREUR] Installation echouee!
        pause
        exit /b 1
    )
    echo [OK] Dependances installees avec succes!
    echo.
)

echo [INFO] Lancement de QuantumCraft...
echo.
call npm start

if errorlevel 1 (
    echo.
    echo [ERREUR] Le launcher n'a pas pu demarrer
    pause
    exit /b 1
)
