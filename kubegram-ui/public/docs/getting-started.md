## Getting Started

### Installation

#### Kubernetes Helm based installation

```bash
helm install kubegram kubegram/kubegram
```

Optionally, you can install only what you need:

```bash
helm install kubegram-ui kubegram/kubegram-server
helm install kubegram-agent kubegram/kubegram-agent
helm install kubegram-argocd kubegram/kuberag
```

#### Docker based installation

Copy this docker-compose.yml file to your docker host and run:

```yaml
version: '3'
services:
  kubegram-server:
    image: kubegram/kubegram-server:latest
    ports:
      - "8090:8090"
    environment:
      - KUBECONFIG=/root/.kube/config
    volumes:
      - /root/.kube:/root/.kube
    networks:
      - host

  kubegram-agent:
    image: kubegram/kubegram-agent:latest
    ports:
      - "8081:8081"
    environment:
      - KUBECONFIG=/root/.kube/config
    volumes:
      - /root/.kube:/root/.kube
    networks:
      - host

  kubegram-argocd:
    image: kubegram/kubegram-argocd:latest
    ports:
      - "8082:8082"
    environment:
      - KUBECONFIG=/root/.kube/config
    volumes:
      - /root/.kube:/root/.kube
    networks:
      - host

networks:
  host:
    external: true
```

```bash
docker-compose up -d
```

### Connect your on agent

You can use your own LLM Agent with Kubegram, to do so you can:

#### Kubernetes

In Kubernetes load your secrets onto kubegram with the following setup:
```yaml
```

#### Terraform


#### API Call


Learn more about monitoring Kubegram here:  [Monitoring](/docs/monitoring) 
