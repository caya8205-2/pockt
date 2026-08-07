FROM node:22-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/web ./apps/web

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @pockt/web build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=builder /app/apps/web/build ./build
COPY --from=builder /app/apps/web/package.json ./package.json

RUN npm install -g pnpm@9 && pnpm install --prod --no-frozen-lockfile

EXPOSE 3000
CMD ["node", "build"]
