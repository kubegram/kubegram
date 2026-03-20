# Multi-stage build for production
FROM oven/bun:1 AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# Build the application
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TypeScript
RUN bun build src/app.ts --outfile dist/app.js --target bun

# Production image
FROM oven/bun:1-slim AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 githubapp

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=deps --chown=githubapp:nodejs /app/node_modules ./node_modules
COPY --chown=githubapp:nodejs package.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER githubapp

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "const r=await fetch('http://localhost:3000/health/live');process.exit(r.ok?0:1)"

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "dist/app.js"]
