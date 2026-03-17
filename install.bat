@echo off
echo 🚀 Installation de 3online...

echo 📦 Installation des dépendances racine...
call npm install

echo 📦 Installation des dépendances shared...
cd packages\shared
call npm install
cd ..\..

echo 📦 Installation des dépendances server...
cd packages\server
call npm install
cd ..\..

echo 📦 Installation des dépendances client...
cd packages\client
call npm install
cd ..\..

echo 🔨 Construction du package shared...
cd packages\shared
call npm run build
cd ..\..

echo ✅ Installation terminée !
echo.
echo Pour démarrer le projet :
echo   npm run dev
echo.
echo Ou manuellement :
echo   Terminal 1: npm run dev:server
echo   Terminal 2: npm run dev:client
pause