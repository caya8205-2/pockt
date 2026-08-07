FROM node:22-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/backend ./apps/backend

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @pockt/backend build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json

RUN pnpm install --prod --no-frozen-lockfile

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

EXPOSE 3001
CMD ["node", "apps/backend/dist/index.js"]
