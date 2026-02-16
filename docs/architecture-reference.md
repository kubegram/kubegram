# Architecture Reference

## Overview

This is an outline for the Kubegram Architecture.

## Core Architecture

```mermaid
flowchart LR
    %% Core UI & RAG
    UI[UI]
    Backend[Backend Server]
    RAG[Agentic RAG]
    Dgraph[(Dgraph)]
    Redis[(Redis)]
    Postgres[(PostgreSQL)]

    %% Kubernetes / Control Plane
    Operator[Kubernetes Operator]
    MCP[Kubernetes MCP Server]
    Argo[Argo CD]
    K8s[(Kubernetes Resources)]

    %% Agent / Orchestration
    Agent[Agent Runtime]

    %% UI interactions
    UI -->|User interactions| Backend
    Backend --> RAG
    Backend -.->|Manages state| Redis

    Backend -.->|Stores Information| Postgres

    %% RAG storage
    RAG -->|Stores remote context| Dgraph
    RAG -.-> Redis

    %% Agent flow
    RAG --> Agent

    %% Operator control
    RAG -->|k8s operator| Operator
    Operator -->|Deploys and manages| MCP

    %% Agent → MCP
    Agent -->|Runs agent operations via MCP| MCP

    %% Argo CD flow
    Agent -->|Runs agent operations via MCP| Argo
    Argo -->|Manages k8s GitOps| K8s

    %% MCP → K8s
    MCP -->|Runs agent operations| K8s
```


## Tech Stack

- **TypeScript** - ES2023 modules with strict mode
- **Winston** - Structured logging with rotation
- **Jest** - Testing framework
- **ESLint + Prettier** - Code quality
- **Golang** - Kubernetes Operators & sidecars


