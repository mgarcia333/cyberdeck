@echo off
title CYBERDECK LAUNCH ENGINE
echo =======================================================
echo          INITIALIZING NEURAL CYBERDECK CORES
echo =======================================================

echo Starting Next.js Control Panel...
start cmd /k "cd /d c:\Users\Practicas\Desktop\jarvi\dashboard && npm run dev"

echo Starting Electron Desktop Client...
start cmd /k "cd /d c:\Users\Practicas\Desktop\jarvi\assistant && npm start"

echo =======================================================
echo          CYBERDECK ENGINE RUNNING CONCURRENTLY!
echo =======================================================
exit
