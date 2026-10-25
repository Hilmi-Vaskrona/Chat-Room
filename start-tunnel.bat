@echo off
title Cloudflare Tunnel - Chat Room Backend
echo ===================================================
echo  Menghubungkan Backend (Port 3001) ke Internet...
echo  Cloudflare Tunnel akan menghasilkan URL publik HTTPS
echo ===================================================
echo.
"%~dp0cloudflared.exe" tunnel --url http://localhost:3001
pause
