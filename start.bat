@echo off
echo 🎮 Démarrage de 3online...

echo 🔨 Construction du package shared...
cd packages\shared
call npm run build
cd ..\..

echo 🚀 Démarrage des serveurs...
start "3online Server" cmd /k "cd packages\server && npm run dev"
timeout /t 3 /nobreak > nul
start "3online Client" cmd /k "cd packages\client && npm run dev"

echo ✅ Serveurs démarrés !
echo.
echo 🌐 Client: http://localhost:5173
echo 📡 Serveur: http://localhost:3001
echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause > nul