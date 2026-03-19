FROM node:18-alpine AS builder

RUN apk add --no-cache libc6-compat
WORKDIR /app

# ── Dépendances ───────────────────────────────────────────────────
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/server/package*.json ./packages/server/
COPY packages/client/package*.json ./packages/client/

RUN npm ci

# Install explicite dans chaque package
RUN cd packages/shared && npm install
RUN cd packages/server && npm install
RUN cd packages/client && npm install

# ── Code source ───────────────────────────────────────────────────
COPY . .

# ── Build shared ──────────────────────────────────────────────────
RUN cd packages/shared && npm run build

# Injecter shared compilé dans node_modules server
RUN rm -rf /app/packages/server/node_modules/@3online/shared && \
    mkdir -p /app/packages/server/node_modules/@3online/shared && \
    cp -r /app/packages/shared/dist /app/packages/server/node_modules/@3online/shared/ && \
    cp /app/packages/shared/package.json /app/packages/server/node_modules/@3online/shared/ && \
    cp -r /app/packages/shared/node_modules /app/packages/server/node_modules/@3online/shared/ 2>/dev/null || true

# ── Build server ──────────────────────────────────────────────────
RUN cd packages/server && npm run build

# ── Build client ──────────────────────────────────────────────────
RUN cd packages/client && npm run build


# ── Stage production ──────────────────────────────────────────────
FROM node:18-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=builder /app/packages/server/dist ./server/dist
COPY --from=builder /app/packages/server/node_modules ./server/node_modules
COPY --from=builder /app/packages/shared/dist ./server/node_modules/@3online/shared/dist
COPY --from=builder /app/packages/shared/package.json ./server/node_modules/@3online/shared/package.json
COPY --from=builder /app/packages/client/dist ./client
COPY --from=builder /app/packages/server/package.json ./server/

USER appuser

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "server/dist/index.js"]
