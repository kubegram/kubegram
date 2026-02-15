# Getting Started with Kubegram

Transform your ideas into production Kubernetes infrastructure in minutes. This guide walks you through setting up Kubegram and deploying your first application using our visual designer and AI-powered code generation.

## What You'll Build

In this guide, you'll:
1. Set up Kubegram locally using Docker or using Bunx.
2. Design a microservice architecture visually
3. Generate production-ready Kubernetes manifests using AI
4. Deploy to a local cluster with GitOps automation
5. Monitor and heal your application automatically
6. Deploy Kubegram to any Kubernetes Cluster

## Prerequisites

### Required Tools
#### Docker Setup
- **Docker & Docker Compose** (Latest versions recommended)
- **kubectl** - Kubernetes command-line tool
- **Git** - For GitOps workflows
- **A Kubernetes cluster** (local options below)
#### Bunx
- **Bun** - Nodejs Runtime.
- **kubectl** - Kubernetes command-line tool
- **Git** - For GitOps workflows
- **A Kubernetes cluster** (local options below)
#### Kubernetes
- **kubectl** - Kubernetes command-line tool
- **Git** - For GitOps workflows
- **A Kubernetes cluster** (local options below)

### Optional: Local Kubernetes Cluster
If you don't have a cluster, choose one:
```bash
# Option 1: Minikube
minikube start --cpus=4 --memory=8192

# Option 2: Kind (Kubernetes in Docker)
kind create cluster --config=- <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 30000
    hostPort: 80
EOF

# Option 3: Docker Desktop (Kubernetes enabled)
# Enable Kubernetes in Docker Desktop settings
```

### Verify Prerequisites
```bash
# Check Docker
docker --version && docker-compose --version

# Check kubectl
kubectl cluster-info

# Check Git
git --version
```

## 🚀 Quick Start: Docker Compose Setup

### 1. Clone Kubegram Repository

```bash
git clone https://github.com/kubegram/kubegram.git
cd kubegram
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
# Copy template
cp .env.example .env

# Edit with your preferences
nano .env
```

**Key Environment Variables:**
```env
# Core Configuration
NODE_ENV=development
CORS_ORIGIN=http://localhost

# AI Provider (Choose one or more)
ANTHROPIC_API_KEY=your_anthropic_key      # Claude (Recommended)
OPENAI_API_KEY=your_openai_key              # GPT-4
GOOGLE_API_KEY=your_google_key              # Gemini
DEEPSEEK_API_KEY=your_deepseek_key         # DeepSeek
OLLAMA_BASE_URL=http://localhost:11434      # Local models

# OAuth Providers (Optional for authentication)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Git Configuration
GIT_REPO_URL=https://github.com/your-username/kubegram-infra.git
GIT_BRANCH=main
```

### 3. Start All Services

```bash
# Start everything with make (recommended)
make up

# Or use docker-compose directly
docker-compose up -d
```

This starts:
- **Kubegram Server** (Port 8090) - Main API and authentication
- **KubeRAG** (Port 8665) - AI and GraphQL services  
- **PostgreSQL** (Port 5432) - Application database
- **Redis** (Port 6379) - Caching and job queues
- **Dgraph** (Port 8080) - Graph database for infrastructure models

### 4. Verify Installation

```bash
# Check all services
make health-check

# Manual verification
curl http://localhost:8090/api/public/v1/healthz/live    # Kubegram Server
curl http://localhost:8665/health                       # KubeRAG
curl http://localhost:8080/admin                        # Dgraph Console
```

### 5. Access Services

- **Kubegram UI**: http://localhost:3000 (if running UI)
- **API Server**: http://localhost:8090
- **GraphQL Playground**: http://localhost:8665/graphql
- **Dgraph Console**: http://localhost:8080

## 🎨 Your First Infrastructure Design

### 1. Open the Visual Designer

Navigate to http://localhost:3000 and click "Create New Project".

### 2. Design a Microservice Architecture

Let's create a simple web application with database:

1. **Add Components from Palette**:
   - Drag `Load Balancer` to canvas
   - Drag `Web Service` below load balancer
   - Drag `Database` below web service
   - Drag `Cache` next to database

2. **Connect Components**:
   - Click arrow tool, connect Load Balancer → Web Service
   - Connect Web Service → Database
   - Connect Web Service → Cache

3. **Configure Properties**:
   - Select Web Service, set replicas: 3
   - Select Database, set storage: 20Gi
   - Select Cache, set memory: 512Mi

Your canvas should look like:
```
[Load Balancer] → [Web Service] → [Database]
                         ↘ [Cache]
```

### 3. Generate Kubernetes Code

1. **Configure AI Provider**:
   - In the right panel, select your preferred AI provider
   - Choose model (e.g., Claude 3.5 Sonnet)

2. **Add Context**:
   - Deployment target: "Production with high availability"
   - Special requirements: "Include monitoring and auto-scaling"

3. **Generate**:
   - Click "Generate Kubernetes Manifests"
   - Watch real-time generation progress
   - Review generated code in the panel

### 4. Review and Customize

The AI will generate multiple files:
```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  selector:
    app: web-service
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer

# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-service
  template:
    metadata:
      labels:
        app: web-service
    spec:
      containers:
      - name: web-app
        image: your-app:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

## 🚀 Deploy to Kubernetes

### 1. Configure GitOps Repository

```bash
# Create infrastructure repository
git clone https://github.com/your-username/kubegram-infra.git
cd kubegram-infra

# Initialize repository structure
mkdir -p clusters/local/manifests
echo "# Kubegram Infrastructure" > README.md
git add .
git commit -m "Initial setup"
git push origin main
```

### 2. Connect Kubegram to Your Cluster

```bash
# Ensure kubectl is configured for your target cluster
kubectl config current-context

# Create namespace for Kubegram
kubectl create namespace kubegram-system

# Apply generated manifests
kubectl apply -f generated-manifests/
```

### 3. Set up ArgoCD (Optional but Recommended)

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Access ArgoCD UI
kubectl port-forward svc/argocd-server 8080:443 -n argocd
```

### 4. Deploy with GitOps

1. **Commit Generated Code**:
   ```bash
   # Copy generated files to your repo
   cp -r generated-manifests/* kubegram-infra/clusters/local/
   
   # Commit and push
   cd kubegram-infra
   git add .
   git commit -m "Add web application infrastructure"
   git push origin main
   ```

2. **Create ArgoCD Application**:
   ```yaml
   # argocd-app.yaml
   apiVersion: argoproj.io/v1alpha1
   kind: Application
   metadata:
     name: web-app
     namespace: argocd
   spec:
     project: default
     source:
       repoURL: https://github.com/your-username/kubegram-infra.git
       targetRevision: HEAD
       path: clusters/local
     destination:
       server: https://kubernetes.default.svc
       namespace: default
     syncPolicy:
       automated:
         prune: true
         selfHeal: true
   ```

   ```bash
   kubectl apply -f argocd-app.yaml
   ```

### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -w

# Check services
kubectl get services

# Check application
kubectl port-forward svc/web-service 8080:80
curl http://localhost:8080
```

## 🔧 Connect Your Own AI Agent

Kubegram supports custom AI agents via the Model Context Protocol (MCP):

### Using Your Own LLM

```bash
# Set custom AI endpoint
export CUSTOM_LLM_ENDPOINT=https://your-llm-endpoint.com
export CUSTOM_LLM_API_KEY=your_api_key

# Restart services with new configuration
docker-compose restart kubegram-server kuberag
```

### Using Bolt or Lollipop

1. **Configure API Integration**:
   ```bash
   # Add to .env file
   BOLT_API_KEY=your_bolt_key
   LOVABLE_API_KEY=your_lovable_key
   ```

2. **Enable Integration in UI**:
   - Go to Settings → Integrations
   - Enable "AI Tool Synchronization"
   - Configure webhook endpoints

## 📊 Monitor and Scale

### 1. Enable MCP Monitoring

```bash
# Install Kubegram Operator for advanced monitoring
helm install kubegram-operator kubegram/kubegram-operator \
  --namespace kubegram-system \
  --set llm.websocketUrl=ws://kubegram-server:8665
```

### 2. Set Up Auto-scaling

The generated manifests include HPA configuration:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 3. View Real-time Metrics

- Access Grafana dashboard: http://localhost:3001
- View cluster metrics in Kubegram UI
- Monitor AI agent activity logs

## 🛠️ Advanced Configuration

### Production Deployment

For production, modify your configuration:

```env
# Production settings
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
GLOBAL_ENCRYPTION_KEY=your_encryption_key
JWT_SECRET=your_jwt_secret

# Database scaling
DATABASE_URL=postgresql://prod-host:5432/kubegram_prod
REDIS_HOST=redis-cluster.prod.com

# Security settings
ENABLE_HA=true
RATE_LIMIT_ENABLED=true
SSL_CERT_PATH=/etc/ssl/certs/kubegram.crt
SSL_KEY_PATH=/etc/ssl/private/kubegram.key
```

### Multi-Cluster Setup

```yaml
# clusters.yaml
clusters:
  - name: production
    endpoint: https://prod-k8s.example.com
    kubeconfig: /etc/kubeconfig/prod
  - name: staging  
    endpoint: https://staging-k8s.example.com
    kubeconfig: /etc/kubeconfig/staging
```

### Custom Node Types

Add your own infrastructure components:

```typescript
// custom-node-types.ts
export const customNodes = {
  'message-queue': {
    icon: 'message-square',
    color: '#8B5CF6',
    defaultConfig: {
      type: 'RabbitMQ',
      replicas: 3,
      storage: '10Gi'
    }
  }
};
```

## 🔍 Troubleshooting

### Common Issues

**Service Won't Start**:
```bash
# Check logs
make logs-kubegram
make logs-kuberag

# Check port conflicts
lsof -i :8090
lsof -i :8665
```

**AI Generation Fails**:
```bash
# Verify API keys
curl -H "Authorization: Bearer $ANTHROPIC_API_KEY" \
     https://api.anthropic.com/v1/messages

# Check KubeRAG health
curl http://localhost:8665/health
```

**Deployment Fails**:
```bash
# Check cluster connectivity
kubectl cluster-info

# Verify RBAC
kubectl auth can-i create deployments --namespace=default
```

### Get Help

- **Documentation**: [Kubegram Docs](/docs)
- **Community**: [GitHub Discussions](https://github.com/kubegram/kubegram/discussions)
- **Issues**: [GitHub Issues](https://github.com/kubegram/kubegram/issues)
- **Discord**: [Kubegram Community](https://discord.gg/kubegram)

## 🎉 What's Next?

Congratulations! You've successfully:
- ✅ Set up Kubegram locally
- ✅ Designed infrastructure visually  
- ✅ Generated Kubernetes manifests with AI
- ✅ Deployed with GitOps automation
- ✅ Enabled monitoring and auto-scaling

### Next Steps

1. **Explore Advanced Features**:
   - [Learn about MCP Integration](/docs/mcp-integration)
   - [Configure Enterprise Features](/docs/enterprise-features)
   - [Custom AI Workflows](/docs/ai-orchestration/workflow-automation)

2. **Production Deployment**:
   - [Production Deployment Guide](/docs/deployment/production-deploy)
   - [Security Best Practices](/docs/enterprise-features/security)
   - [Monitoring Setup](/docs/deployment/monitoring)

3. **Community Contribution**:
   - [Contributing Guide](/docs/contributing)
   - [Development Setup](/docs/deployment/local-setup)
   - [Architecture Deep Dive](/docs/architecture)

**Welcome to the future of Kubernetes management!** 🚀