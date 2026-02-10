# syntax=docker/dockerfile:1

FROM oven/bun:1.1.34 AS build
WORKDIR /app

COPY package.json bun.lock tsconfig.json ./
RUN bun install --frozen-lockfile

COPY src ./src
COPY scripts ./scripts
RUN bun build src/index.ts --outdir dist --target bun --sourcemap=linked

FROM oven/bun:1.1.34 AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json /app/bun.lock ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["bun", "dist/index.js"]
