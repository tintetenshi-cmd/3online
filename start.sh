#!/bin/bash

# Script de démarrage pour 3online
echo "🚀 Démarrage de 3online..."

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Construire le projet shared
echo "🔨 Construction du package shared..."
npm run build --workspace=packages/shared

# Démarrer en mode développement
echo "🎮 Démarrage du jeu..."
npm run dev