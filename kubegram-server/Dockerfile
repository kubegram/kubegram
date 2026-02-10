FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock .npmrc ./
ARG NODE_AUTH_TOKEN
RUN bun install

COPY . .

# Expose the port the app runs on
EXPOSE 8090

# Start the application in development mode
CMD ["bun", "run", "dev"]
