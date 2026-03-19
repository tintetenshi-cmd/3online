FROM node:18-alpine AS builder

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copier tous les package.json pour profiter du cache Docker
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/server/package*.json ./packages/server/
COPY packages/client/package*.json ./packages/client/

# Install racine (workspaces ou non)
RUN npm ci

# Copier le code source
COPY . .

# 1. Build shared EN PREMIER → génère dist/ + index.d.ts
RUN cd packages/shared && npm ci && npm run build

# 2. Copier le dist de shared directement dans node_modules du server
#    → Évite npm link et ses problèmes de symlinks
RUN cp -r /app/packages/shared /app/packages/server/node_modules/@3online/shared

# 3. Build server (shared est maintenant résolu correctement)
RUN cd packages/server && npm ci && npm run build

# 4. Build client
RUN cd packages/client && npm ci && npm run build


# ── Stage de production ──────────────────────────────────────────
FROM node:18-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Uniquement le dist compilé du server
COPY --from=builder /app/packages/server/dist ./server/dist

# node_modules de PROD uniquement (depuis server, pas la racine)
COPY --from=builder /app/packages/server/node_modules ./server/node_modules

# Le shared compilé doit aussi être accessible en runtime
COPY --from=builder /app/packages/shared/dist ./server/node_modules/@3online/shared/dist
COPY --from=builder /app/packages/shared/package.json ./server/node_modules/@3online/shared/package.json

# Client buildé (servi en statique)
COPY --from=builder /app/packages/client/dist ./client

COPY --from=builder /app/packages/server/package.json ./server/

USER appuser

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001

# Lance depuis dist/
CMD ["node", "server/dist/index.js"]
