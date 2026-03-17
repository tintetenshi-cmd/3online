# 3online

Jeu de cartes en ligne inspiré de Trio (Cocktail Games), développé en temps réel avec une interface moderne au thème violet/noir rétro.

## 🎮 Fonctionnalités

- **Multijoueur en temps réel** : 2-6 joueurs via WebSocket
- **IA intégrée** : Jouez contre des bots intelligents avec 3 niveaux de difficulté
- **Interface moderne** : Thème violet/noir avec animations fluides
- **Règles Trio** : Implémentation fidèle du jeu original
- **Chat intégré** : Communication en temps réel entre joueurs
- **Reconnexion automatique** : Continuez votre partie après une déconnexion

## 🏗️ Architecture

```
3online/
├── packages/
│   ├── client/          # Frontend React + TypeScript
│   ├── server/          # Backend Node.js + Socket.IO
│   └── shared/          # Types et utilitaires partagés
├── docs/               # Documentation
└── .kiro/             # Spécifications et tâches
```

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ 
- npm 8+

### Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd 3online
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Construire le package shared**
```bash
npm run build --workspace=packages/shared
```

4. **Démarrer en développement**
```bash
npm run dev
```

Cela démarre :
- Le serveur sur http://localhost:3001
- Le client sur http://localhost:5173

### Démarrage avec le script

Sur Linux/Mac :
```bash
./start.sh
```

Sur Windows :
```bash
npm run dev
```

## 🎯 Comment jouer

### Règles de base

Le but est d'être le premier à réaliser l'une des conditions de victoire :
- **3 trios** de n'importe quels numéros
- **2 trios liés** (numéros consécutifs, ex: 5-6)
- **Le trio de 7** (victoire immédiate)

### Actions possibles

À votre tour, révélez des cartes pour former un trio :
1. **Révéler une carte du centre** - Cliquez sur une carte face cachée
2. **Révéler la plus petite carte d'un joueur** - Choisissez un joueur
3. **Révéler la plus grande carte d'un joueur** - Choisissez un joueur

### Fin du tour

- **Trio réussi** : 3 cartes identiques → vous gagnez le trio et continuez
- **Trio échoué** : 2 numéros différents → cartes remises face cachée, tour suivant

## 🤖 Intelligence Artificielle

Trois niveaux de difficulté :
- **Facile** : Choix sous-optimaux, mémoire limitée
- **Normal** : Jeu équilibré avec stratégies de base
- **Difficile** : Mémorisation complète, stratégies avancées

## 🛠️ Technologies

### Frontend
- **React 18** avec TypeScript
- **Vite** pour le bundling
- **Socket.io-client** pour le temps réel
- **CSS Modules** avec thème violet/noir

### Backend
- **Node.js** avec Express
- **Socket.IO** pour WebSocket
- **TypeScript** pour la sécurité des types
- **Architecture modulaire** (GameEngine, RoomManager, AIEngine)

### Shared
- **Types TypeScript** partagés
- **Utilitaires** de validation et helpers
- **Constantes** de jeu

## 📁 Structure détaillée

### Client (`packages/client/`)
```
src/
├── components/         # Composants React
│   ├── ui/            # Composants UI réutilisables
│   ├── MainMenu.tsx   # Menu principal
│   ├── GameLobby.tsx  # Lobby de jeu
│   ├── GameBoard.tsx  # Plateau de jeu
│   └── Rules.tsx      # Règles du jeu
├── contexts/          # Contextes React
│   └── GameContext.tsx # État global du jeu
└── styles/           # Styles CSS
```

### Serveur (`packages/server/`)
```
src/
├── game/             # Moteur de jeu
│   └── GameEngine.ts # Logique principale
├── room/             # Gestion des salles
│   └── RoomManager.ts # Création/jointure
├── ai/               # Intelligence artificielle
│   └── AIEngine.ts   # Décisions IA
├── websocket/        # Communication temps réel
│   └── WebSocketGateway.ts
└── index.ts         # Point d'entrée
```

### Shared (`packages/shared/`)
```
src/
├── types/           # Types TypeScript
│   └── core.ts     # Types principaux
├── utils/          # Utilitaires
│   ├── helpers.ts  # Fonctions utiles
│   └── validation.ts # Validation
└── constants/      # Constantes
    ├── game.ts     # Règles du jeu
    └── events.ts   # Événements WebSocket
```

## 🔧 Scripts disponibles

```bash
# Développement
npm run dev              # Démarre client + serveur
npm run dev:client       # Client uniquement
npm run dev:server       # Serveur uniquement

# Build
npm run build           # Build complet
npm run build:client    # Build client
npm run build:server    # Build serveur

# Tests
npm run test           # Tests tous packages
npm run type-check     # Vérification TypeScript

# Linting
npm run lint           # ESLint sur tous les packages
```

## 🌐 API et WebSocket

### Événements WebSocket

**Client → Serveur :**
- `createRoom` - Créer une salle
- `joinRoom` - Rejoindre une salle
- `startGame` - Démarrer la partie
- `playerAction` - Action de jeu
- `sendChatMessage` - Message de chat

**Serveur → Client :**
- `roomUpdated` - Mise à jour de salle
- `gameStarted` - Partie démarrée
- `gameStateUpdated` - État de jeu mis à jour
- `cardRevealed` - Carte révélée
- `trioFormed` - Trio formé
- `chatMessage` - Message de chat

### API REST

- `GET /health` - Santé du serveur
- `GET /stats` - Statistiques détaillées
- `GET /metrics` - Métriques (format Prometheus)

## 🔒 Sécurité

- **Validation côté serveur** : Toutes les actions sont validées
- **Anti-triche** : Aucune information sensible envoyée au client
- **Rate limiting** : Protection contre le spam
- **Sanitisation** : Nettoyage des entrées utilisateur

## 📊 Monitoring

Le serveur expose des métriques sur `/metrics` :
- Nombre de salles actives
- Joueurs connectés
- Utilisation mémoire
- Temps de réponse

## 🐛 Développement

### Debugging

1. **Logs serveur** : Consultez la console du serveur
2. **DevTools** : Utilisez les outils de développement du navigateur
3. **WebSocket** : Surveillez les événements dans l'onglet Network

### Tests

```bash
# Tests unitaires
npm run test

# Tests de propriétés (optionnel)
npm run test:properties

# Tests d'intégration
npm run test:integration
```

## 🚀 Déploiement

### Production

1. **Build du projet**
```bash
npm run build
```

2. **Variables d'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

3. **Démarrage**
```bash
npm start
```

### Docker (optionnel)

```dockerfile
# Dockerfile exemple
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🎮 Crédits

Inspiré du jeu **Trio** de Cocktail Games. Ce projet est une implémentation non officielle à des fins éducatives et de divertissement.

---

**Amusez-vous bien ! 🎉**