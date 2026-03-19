# Multi-stage build pour 3online
FROM node:18-alpine AS builder

# Dépendances système
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Installer les dépendances (dev incluses pour tsc/build)
COPY package*.json ./
COPY packages/client/package*.json ./packages/client/
COPY packages/server/package*.json ./packages/server/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci

# Installer les deps de chaque package (pas de workspaces ici)
RUN cd packages/shared && npm ci
RUN cd packages/server && npm ci
RUN cd packages/client && npm ci

# Copier le code source (sans node_modules grâce au .dockerignore)
COPY . .

# Build (shared d'abord, puis server + client comme en local)
RUN npm run build:shared
RUN npm run build:server
RUN cd packages/client && npm run build

# === DEBUG : où sont les dist ? ===  ← AJOUTE ÇA
RUN echo "=== LS packages/server ===" && ls -la /app/packages/server/
RUN echo "=== FIND server JS files ===" && find /app/packages/server -name "*.js" -o -name "*.d.ts" | head -10 || echo "NO JS/DTS FOUND"
RUN echo "=== CURRENT DIR ===" && pwd && ls -la /app/

# Ne garder que les deps de prod pour le runner
RUN npm prune --omit=dev

# Stage de production
FROM node:18-alpine AS runner
WORKDIR /app

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copie SÉCURISÉE (fonctionne toujours)
COPY --from=builder /app/packages/server ./server
COPY --from=builder /app/packages/client/dist ./client
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Changer les permissions
USER nextjs

# Exposer le port
EXPOSE 3001

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3001

# Commande de démarrage
CMD ["node", "server/index.js"]