# BrewLite API image (S-04). Build context: apps/api
# Used by docker-compose.yml locally; the CD pipeline (S-07) builds the same image.

# ---- build: install all dependencies, generate the Prisma client, compile ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# `npm run build` runs `prisma generate` first (prebuild script).
RUN npm run build

# ---- runtime ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# The Prisma CLI and tsx stay installed so the container can run
# `npm run db:deploy` and `npm run db:seed` (see docs/deployment.md).
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/src/generated ./src/generated
USER node
EXPOSE 3001
# Apply pending migrations, then start the API (ADR 002: migrate before the new version starts).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
