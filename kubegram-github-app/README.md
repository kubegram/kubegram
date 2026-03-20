# Kubegram GitHub App

A GitHub App that acts as an event listener for GitHub events and publishes them to the Kubegram deployment event system using the existing `@kubegram/common-events` library.

## Overview

This TypeScript application serves as the bridge between GitHub events and the Kubegram ecosystem. It:

1. **Receives GitHub webhooks** for push, pull requests, releases, and check runs
2. **Validates webhook signatures** for security
3. **Transforms GitHub events** into standardized Kubegram events
4. **Publishes events** to the Kubegram event bus for downstream processing

## Features

- **GitHub App Authentication**: JWT-based authentication with fine-grained permissions
- **Webhook Security**: SHA-256 signature verification
- **Event Processing**: Handlers for push, pull request, release, and check run events
- **Kubegram Integration**: Seamless event publishing via `@kubegram/common-events`
- **Enterprise Ready**: Security hardening, health checks, monitoring
- **Containerized**: Multi-stage Docker builds with security best practices
- **Kubernetes Native**: Complete K8s deployment manifests with HPA

## Architecture

```
┌─────────────────┐    Webhooks    ┌─────────────────────┐    Events    ┌─────────────────┐
│   GitHub.com    │ ──────────────► │  kubegram-github-app│ ─────────────► │  Kubegram Events │
│                 │                │   (TypeScript)      │                │    System       │
└─────────────────┘                └─────────────────────┘                └─────────────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │  Auth & Config  │
                                   │  (JWT + Secrets)│
                                   └─────────────────┘
```

## Supported Events

- **Push Events**: Code commits and branch updates
- **Pull Request Events**: PR lifecycle (opened, closed, merged, updated)
- **Release Events**: New releases and tag operations
- **Check Run Events**: CI/CD pipeline status and results

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Kubernetes (for production deployment)
- GitHub App configuration

### Development Setup

1. **Clone and install dependencies**:
   ```bash
   cd kubegram-github-app
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your GitHub App credentials
   ```

3. **Run in development**:
   ```bash
   npm run dev
   ```

4. **Run tests**:
   ```bash
   npm test
   ```

### Environment Variables

```bash
# Required
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Optional
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
KUBEGRAM_EVENT_BUS_URL=http://localhost:8090
CORS_ORIGINS=https://github.com
```

### GitHub App Setup

1. **Create a GitHub App** in your organization settings
2. **Configure permissions**:
   - Repository permissions: `Read: metadata`, `Read: contents`, `Read: pull requests`
   - Subscribe to events: `Pushes`, `Pull requests`, `Releases`, `Check runs`
3. **Generate a private key** and download it
4. **Set webhook URL**: `https://your-domain.com/api/github/webhooks`
5. **Set webhook secret** and add it to your environment variables

## Deployment

### Docker

```bash
# Build
npm run docker:build

# Run
npm run docker:run
```

### Kubernetes

1. **Create secrets**:
   ```bash
   kubectl create secret generic github-app-secrets \
     --from-literal=app-id=$(echo -n 'your_app_id' | base64) \
     --from-literal=private-key=$(cat private-key.pem | base64 -w 0) \
     --from-literal=webhook-secret=$(echo -n 'your_webhook_secret' | base64) \
     --namespace=kubegram
   ```

2. **Deploy**:
   ```bash
   kubectl apply -f k8s/
   ```

3. **Setup ingress** for external access:
   ```bash
   # Update k8s/ingress.yaml with your domain
   kubectl apply -f k8s/ingress.yaml
   ```

## API Endpoints

### Health Checks

- `GET /health` - Overall health status
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### Webhooks

- `POST /api/github/webhooks` - GitHub webhook endpoint

## Development

### Project Structure

```
src/
├── config/          # App and GitHub configuration
├── handlers/        # Event handlers for different GitHub events
├── middleware/      # Express middleware (webhook validation, health)
├── services/        # Business logic (event publishing)
├── types/          # TypeScript type definitions
├── utils/          # Utility functions (logging)
└── app.ts          # Application entry point
```

### Scripts

- `npm run dev` - Development with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm test` - Run tests
- `npm run test:coverage` - Run with coverage
- `npm run lint` - Lint code
- `npm run type-check` - Type checking

### Testing

The application uses Vitest for testing:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Monitoring

### Health Checks

The application provides comprehensive health checks:

- `/health` - Overall status with memory usage and uptime
- `/health/ready` - Readiness probe for K8s
- `/health/live` - Liveness probe for K8s

### Logging

Structured logging with Winston:
- JSON format in production
- Human-readable in development
- Configurable log levels

### Metrics

- Memory usage tracking
- Event processing statistics
- Webhook delivery tracking
- Error rate monitoring

## Security

- **Webhook Signature Validation**: SHA-256 HMAC verification
- **GitHub App Authentication**: JWT-based with short-lived tokens
- **Input Validation**: All inputs validated and sanitized
- **CORS Protection**: Configurable origin allowlist
- **Rate Limiting**: Built-in rate limiting protection
- **Container Security**: Non-root user, read-only filesystem

## Performance

- **Async Event Processing**: Non-blocking event handling
- **Event Caching**: Built-in event history with TTL
- **Batch Processing**: Support for batch event publishing
- **Resource Limits**: Configurable memory and CPU limits
- **Auto-scaling**: HPA configuration for Kubernetes

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm run check-all`
6. Submit a pull request

## License

BUSL-1.1 License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` directory
- Review the existing issues and discussions