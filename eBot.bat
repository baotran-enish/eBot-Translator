@echo off
title eBot Translator Launcher
color 0B

echo ===================================================
echo             eBOT TRANSLATOR LAUNCHER
echo ===================================================
echo.

:: Check Node.js installation
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js chua duoc cai dat tren may tinh nay!
    echo Vui long tai va cai dat Node.js tai: https://nodejs.org/
    echo Sau khi cai dat, vui long mo lai file nay.
    echo.
    pause
    exit /b
)

:: Check if node_modules already exists, if not run npm install
if not exist "node_modules\" (
    echo [INFO] Phat hien day la lan dau chay, dang thuc hien cai dat thu vien...
    echo Vui long cho trong giay lat...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Nhiem vu cai dat thu vien gap loi. Vui long kiem tra ket noi mang.
        pause
        exit /b
    )
)

:: Check if .env file exists, ask or remind
if not exist ".env" (
    echo [WARNING] File .env chua ton tai!
    echo Vui long tao file .env luu khoa API Key: GEMINI_API_KEY="KEY_CUA_BAN"
    echo de co the su dung tinh nang dich bang tri thue nhan tao.
    echo.
)

echo [INFO] Dang khoi dong may chu eBot...
echo [INFO] Trinh duyet se tu dong mo trang http://localhost:3000 trong giay lat...
echo [INFO] De dung ung dung: Hay dong cua so Terminal den nay lai.
echo.

:: Open Browser automatically in 3 seconds
start "" "http://localhost:3000"

:: Start the application in Node.js
call npm run dev

pause
