# Stage 1: Build the UI
FROM oven/bun:1 AS ui-builder
WORKDIR /app/kubegram-ui

COPY kubegram-ui/package.json kubegram-ui/bun.lock kubegram-ui/.npmrc ./
ARG NODE_AUTH_TOKEN
RUN bun install

COPY kubegram-ui/ ./
ARG VITE_API_URL
RUN bun run build

# Stage 2: Server
FROM oven/bun:1
WORKDIR /app

COPY kubegram-server/package.json kubegram-server/bun.lock kubegram-server/.npmrc ./
ARG NODE_AUTH_TOKEN
RUN bun install --production

COPY kubegram-server/ .

# Copy UI build into public/ so serveStatic picks it up
COPY --from=ui-builder /app/kubegram-ui/dist ./public

EXPOSE 8090
CMD ["bun", "run", "start"]
