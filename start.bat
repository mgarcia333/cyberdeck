@echo off
title JARVIS LAUNCH ENGINE
echo =======================================================
echo          INITIALIZING NEURAL JARVIS CORES
echo =======================================================

echo Starting Next.js Control Panel...
start cmd /k "cd /d c:\Users\Practicas\Desktop\jarvi\dashboard && npm run dev"

echo Starting Electron Desktop Client...
start cmd /k "cd /d c:\Users\Practicas\Desktop\jarvi\assistant && npm start"

echo =======================================================
echo          JARVIS ENGINE RUNNING CONCURRENTLY!
echo =======================================================
exit
