@echo off
title CYBERDECK COMPILER ENGINE
echo =======================================================
echo          COMPILING STANDALONE CYBERDECK CLIENT
echo =======================================================

echo [1/3] Compiling Next.js Control Panel...
cd /d c:\Users\Practicas\Desktop\jarvi\dashboard
call npm run build

echo [2/3] Syncing static web assets into Electron...
if exist c:\Users\Practicas\Desktop\jarvi\assistant\dashboard_dist (
    rmdir /s /q c:\Users\Practicas\Desktop\jarvi\assistant\dashboard_dist
)
mkdir c:\Users\Practicas\Desktop\jarvi\assistant\dashboard_dist
xcopy /s /e /y out c:\Users\Practicas\Desktop\jarvi\assistant\dashboard_dist\

echo [3/3] Packaging standalone Windows executable (Cyberdeck.exe)...
cd /d c:\Users\Practicas\Desktop\jarvi\assistant
call npm run package

echo =======================================================
echo          COMPILATION SUCCESSFUL!
echo =======================================================
echo The compiled desktop folder is located at:
echo c:\Users\Practicas\Desktop\jarvi\assistant\dist\Cyberdeck-win32-x64\
echo Double-click Cyberdeck.exe to run it!
echo =======================================================
pause
