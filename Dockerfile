# Multi-stage build pour 3online
FROM node:18-alpine AS base

# Installer les dépendances système
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY packages/client/package*.json ./packages/client/
COPY packages/server/package*.json ./packages/server/
COPY packages/shared/package*.json ./packages/shared/

# Installer les dépendances
RUN npm ci --only=production

# Stage de build
FROM base AS builder
WORKDIR /app

# Copier le code source
COPY . .

# Build du projet
RUN npm run build

# Stage de production
FROM node:18-alpine AS runner
WORKDIR /app

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires
COPY --from=builder /app/packages/server/dist ./server
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