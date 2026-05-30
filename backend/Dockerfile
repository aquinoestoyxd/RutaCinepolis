FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci --only=production && npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src/
RUN npm run build

# ──────────────────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S cinepolis -u 1001

COPY --from=builder --chown=cinepolis:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=cinepolis:nodejs /app/dist ./dist
COPY --from=builder --chown=cinepolis:nodejs /app/prisma ./prisma
COPY --chown=cinepolis:nodejs package*.json ./

USER cinepolis

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
