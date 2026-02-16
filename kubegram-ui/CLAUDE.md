## CLAUDE.md - Kubegram UI

Visual canvas interface for designing Kubernetes infrastructure and generating manifests via AI. Built with React 19, Konva.js for canvas rendering, Redux Toolkit for state, and Tailwind + shadcn/ui for styling.

## Tech Stack

- **Framework**: React 19 + TypeScript 5.9
- **Build**: Vite 7.2 with React Compiler
- **Canvas**: react-konva 19.2 (Konva.js 2D rendering)
- **State**: Redux Toolkit 2.11 + React Redux
- **Styling**: Tailwind CSS 4.1 + shadcn/ui (Radix UI primitives)
- **Router**: React Router DOM v7
- **Auth**: @openauthjs/openauth (OAuth 2.0 PKCE)
- **Icons**: Lucide React
- **API**: Axios + @kubegram/common-ts (GraphQL SDK)
- **Markdown**: react-markdown + mermaid diagrams

## Project Structure

```
src/
├── main.tsx                         # React entry point
├── App.tsx                          # Router + global layout
├── index.css                        # Global styles + CSS variables (light/dark)
│
├── pages/
│   ├── LandingPage.tsx              # Public landing
│   ├── HomePage.tsx                 # Authenticated home
│   ├── LoginPage.tsx                # Login page
│   ├── KonvaPage.tsx                # Konva canvas editor
│   ├── JsonCanvasPage.tsx           # JSON Canvas editor
│   ├── CodeViewPage.tsx             # Code view (70% graph / 30% code panel)
│   ├── CompareViewPage.tsx          # Compare view
│   ├── DocsPage.tsx                 # Documentation viewer
│   ├── BlogListPage.tsx             # Blog listing
│   ├── BlogPage.tsx                 # Blog post
│   ├── AboutPage.tsx                # About page
│   ├── ReportsPage.tsx              # Reports
│   ├── OAuthProviderInfo.tsx        # OAuth provider info
│   └── test/
│       ├── CodegenTestPage.tsx      # Codegen testing UI
│       └── PlanTestPage.tsx         # Planning testing UI
│
├── components/
│   ├── ui/                          # shadcn/ui components
│   │   ├── button.tsx, card.tsx, badge.tsx, input.tsx, label.tsx
│   │   ├── dropdown-menu.tsx, scroll-area.tsx, alert.tsx, progress.tsx
│   │   ├── button-variants.ts, badge-variants.ts
│   │   └── ...
│   ├── KonvaCanvas.tsx              # Main Konva canvas
│   ├── KonvaToolbar.tsx             # Canvas toolbar
│   ├── KonvaNodeToolbar.tsx         # Node-specific toolbar
│   ├── KubernetesToolbar.tsx        # K8s resource toolbar
│   ├── DraggableNode.tsx            # Draggable canvas nodes
│   ├── Arrow.tsx                    # Canvas arrows/connections
│   ├── ConnectionDot.tsx            # Connection points on nodes
│   ├── ResizeHandle.tsx             # Node resize handles
│   ├── SelectionBadge.tsx           # Selection indicator
│   ├── CanvasBackground.tsx         # Grid background
│   ├── CanvasSelection.tsx          # Selection rectangle
│   ├── CanvasGroupMovement.tsx      # Multi-select movement
│   ├── CanvasArrowDrawing.tsx       # Arrow drawing interaction
│   ├── CanvasDeleteButtons.tsx      # Delete controls
│   ├── CanvasContextMenu.tsx        # Right-click menu
│   ├── CanvasNavigation.tsx         # Pan/zoom controls
│   ├── CanvasAIAssistant.tsx        # AI assistant panel
│   ├── JsonCanvasEditor.tsx         # JSON Canvas format editor
│   ├── CollisionDebugOverlay.tsx    # Debug hitboxes
│   ├── Sidebar.tsx                  # App sidebar
│   ├── TopBar.tsx                   # Top navigation
│   ├── Header.tsx                   # Header
│   ├── Logo.tsx                     # Logo component
│   ├── LoginModal.tsx               # OAuth login modal
│   ├── OAuthCallback.tsx            # OAuth callback handler
│   ├── ProtectedRoute.tsx           # Auth-gated routes
│   ├── GraphSyncProvider.tsx        # Canvas ↔ backend sync
│   ├── CodePanel.tsx                # Code display panel
│   ├── CodeGenerationModal.tsx      # Codegen trigger modal
│   ├── CodeGenerationPanel.tsx      # Codegen status panel
│   ├── CodeGenerationComponent.tsx  # Codegen controls
│   ├── CodeGenerationStatus.tsx     # Status indicator
│   ├── GeneratedCodeDisplay.tsx     # Generated code viewer
│   ├── DocsNavigationTree.tsx       # Docs sidebar tree
│   ├── AvatarDropdown.tsx           # User avatar menu
│   ├── HelpModal.tsx                # Help dialog
│   ├── InfoTooltip.tsx              # Info tooltips
│   ├── Mermaid.tsx                  # Mermaid diagram renderer
│   └── test/                        # Test utilities
│       ├── CodegenTestControls.tsx
│       ├── CodegenMockData.tsx
│       └── CodegenTestScenarios.tsx
│
├── store/
│   ├── index.ts                     # Store config + middleware chain
│   ├── types.ts                     # RootState type
│   ├── hooks.ts                     # useAppSelector, useAppDispatch
│   ├── StoreProvider.tsx            # Redux provider
│   ├── actions/index.ts             # Shared actions
│   ├── slices/
│   │   ├── uiSlice.ts              # UI state (sidebar, modals)
│   │   ├── canvas/
│   │   │   ├── index.ts            # Canvas slice exports
│   │   │   ├── entitiesSlice.ts    # Nodes, arrows, groups
│   │   │   ├── activitySlice.ts    # Selection, drag, zoom
│   │   │   ├── configsSlice.ts     # Canvas settings
│   │   │   ├── dataSlice.ts        # Graph metadata, user, org, projects
│   │   │   ├── initialState.ts     # Default state
│   │   │   ├── constants.ts        # Canvas constants
│   │   │   ├── storage.ts          # localStorage persistence
│   │   │   ├── middleware.ts        # Canvas persistence middleware
│   │   │   ├── types.ts            # Canvas types (re-exports)
│   │   │   └── types/
│   │   │       ├── entities.ts     # Entity type definitions
│   │   │       ├── activity.ts     # Activity type definitions
│   │   │       ├── configs.ts      # Config type definitions
│   │   │       └── data.ts         # Data type definitions
│   │   ├── codegen/codegenSlice.ts  # Code generation state
│   │   ├── oauth/
│   │   │   ├── oauthSlice.ts       # Auth state
│   │   │   ├── oauthThunks.ts      # Auth async thunks
│   │   │   └── types.ts            # Auth types
│   │   ├── company/
│   │   │   ├── companySlice.ts
│   │   │   └── companyThunks.ts
│   │   ├── organization/
│   │   │   ├── organizationSlice.ts
│   │   │   └── organizationThunks.ts
│   │   ├── team/
│   │   │   ├── teamSlice.ts
│   │   │   └── teamThunks.ts
│   │   └── project/
│   │       ├── projectSlice.ts
│   │       └── projectThunks.ts
│   ├── api/
│   │   ├── index.ts
│   │   ├── codegen.ts               # Code generation API
│   │   ├── codegenUtils.ts          # Codegen utilities
│   │   ├── openauth.ts              # OAuth implementation
│   │   ├── oauthConfig.ts           # OAuth configuration
│   │   ├── providers.ts             # OAuth provider list
│   │   ├── plan.ts                  # Planning API
│   │   ├── companyApi.ts
│   │   ├── organizationApi.ts
│   │   ├── teamApi.ts
│   │   ├── projectApi.ts
│   │   └── userApi.ts
│   └── middleware/
│       ├── graphSyncMiddleware.ts    # Canvas ↔ GraphQL sync
│       └── authErrorMiddleware.ts    # Global 401 handling
│
├── hooks/
│   ├── canvas/
│   │   ├── index.ts                 # Canvas hooks exports
│   │   ├── useCanvasEvents.ts       # Mouse/keyboard events
│   │   ├── useCanvasCoordinates.ts  # Coordinate system
│   │   ├── useCanvasScroll.ts       # Pan/zoom
│   │   ├── useGroupSelection.ts     # Multi-select
│   │   ├── useArrowDrawing.ts       # Connection drawing
│   │   ├── useKonvaCanvasEvents.ts  # Konva-specific events
│   │   ├── useKonvaArrowAttachment.ts
│   │   ├── useKonvaElementDeletion.ts
│   │   ├── useKonvaElementDrop.ts
│   │   ├── useJsonCanvasEvents.ts   # JSON Canvas events
│   │   ├── useJsonCanvasState.ts    # JSON Canvas state
│   │   ├── useProjectSync.ts       # Backend sync
│   │   └── modelAdapters.ts        # Data model conversions
│   ├── useCodeGeneration.ts         # Code generation workflow
│   ├── usePlanning.ts               # Planning integration
│   ├── useGraphConversion-v2.ts     # Graph → code conversion
│   └── useReleaseStatus.ts          # Release tracking
│
├── layouts/
│   ├── DocsLayout.tsx               # Documentation layout
│   └── BlogLayout.tsx               # Blog layout
│
├── lib/
│   ├── utils.ts                     # Tailwind cn() helper
│   ├── providerUtils.ts             # OAuth provider utilities
│   ├── graphql-client.ts            # GraphQL client setup
│   └── api/
│       └── axiosClient.ts           # Axios instance
│
├── types/
│   ├── canvas.ts                    # Canvas element types
│   └── jsoncanvas.ts                # JSON Canvas format types
│
└── utils/
    ├── jsoncanvas.ts                # JSON Canvas utilities
    ├── jsoncanvas-conversion.ts     # Format conversion
    └── collision-detection.ts       # Visual collision detection
```

## Key Commands

| Command | Purpose |
|---------|---------|
| `bun run dev` | Vite dev server with HMR |
| `bun run build` | TypeScript check + Vite production build |
| `bun run preview` | Preview production build |
| `bun run lint` | ESLint |
| `bun run typecheck` | TypeScript check (`tsc -b`) |

## Environment Variables

```
VITE_API_URL=http://localhost:8090      # Backend API URL
VITE_GRAPHQL_HTTP_URL=                  # GraphQL HTTP endpoint
VITE_GRAPHQL_WS_URL=                    # GraphQL WebSocket endpoint
VITE_OIDC_CLIENT_ID=                    # OIDC client ID (optional)
VITE_OIDC_ISSUER=                       # OIDC issuer URL (optional)
VITE_FORCE_REAUTH=false                 # Force re-authentication
```

Access in code: `import.meta.env.VITE_API_URL`

## Architecture

### State Management (Redux Toolkit)

```
RootState
├── canvas
│   ├── entities    # Nodes, arrows, groups
│   ├── activity    # Selection, drag state, zoom, pan
│   ├── configs     # Canvas settings
│   └── data        # Graph metadata, user, org, projects, LLM configs
├── ui              # Sidebar, modals, theme
├── oauth           # User, tokens, isAuthenticated
├── codegen         # Jobs, results, stats
├── company         # Company state + thunks
├── organization    # Organization state + thunks
├── team            # Team state + thunks
└── project         # Project state + thunks
```

### Middleware Chain

1. **canvasPersistenceMiddleware** - Debounced save to localStorage
2. **graphSyncMiddleware** - Syncs canvas state with GraphQL backend
3. **authErrorMiddleware** - Catches 401 errors, triggers re-auth

### Canvas Systems

Two canvas implementations:
- **KonvaPage** (`pages/KonvaPage.tsx`) - Konva.js 2D canvas with full interaction
- **JsonCanvasPage** (`pages/JsonCanvasPage.tsx`) - JSON Canvas format support

Canvas hooks in `hooks/canvas/` handle: events, coordinates, scroll/zoom, selection, arrow drawing, element deletion/dropping, project sync.

### Auth Flow

1. `LoginModal` triggers OAuth via `@openauthjs/openauth`
2. User redirects to provider (GitHub, Google, GitLab, Okta)
3. `OAuthCallback` handles redirect, stores tokens
4. `ProtectedRoute` guards authenticated pages
5. `authErrorMiddleware` catches 401s globally

Tokens stored in localStorage as `kubegram_auth`.

### Code Generation

1. User triggers codegen from canvas
2. `useCodeGeneration` hook calls `POST /api/public/v1/graph/codegen`
3. Polls status with exponential backoff (`store/api/codegen.ts`)
4. Results stored in Redux `codegen` slice + localStorage
5. `CodeViewPage` displays results in 70/30 split (graph | code panel)

## Conventions

- **Path alias**: `@/*` → `./src/*` (configured in tsconfig + vite)
- **Pages**: PascalCase with `Page` suffix (`KonvaPage.tsx`)
- **Components**: PascalCase (`DraggableNode.tsx`)
- **Hooks**: camelCase with `use` prefix (`useCanvasEvents.ts`)
- **Slices**: `xxxSlice.ts` + `xxxThunks.ts` pattern
- **shadcn/ui**: Components in `src/components/ui/`, add via `npx shadcn@latest add [component]`
- **CSS**: Tailwind utilities + `cn()` helper from `src/lib/utils.ts`
- **Dark mode**: CSS variables in `src/index.css` with `.dark` class

## Build Configuration

- **Vite**: React plugin with React Compiler enabled, Tailwind plugin
- **TypeScript**: Strict mode, ES2022 target, ESNext modules, `react-jsx`
- **ESLint**: Flat config (v9+), TypeScript ESLint, React Hooks, React Refresh
- **shadcn/ui**: New York style, Lucide icons, neutral base color

## Documentation

- [docs/state-management.md](docs/state-management.md) - Redux architecture
- [docs/oauth_flow.md](docs/oauth_flow.md) - Auth flow details
- [docs/codegen-polling.md](docs/codegen-polling.md) - Polling with backoff
- [docs/enhanced-codegen.md](docs/enhanced-codegen.md) - Codegen results & storage
- [docs/enhanced-codeviewpage.md](docs/enhanced-codeviewpage.md) - Code view layout
- [SETUP.md](SETUP.md) - Setup guide

## Troubleshooting

- **`@kubegram/common-ts` install fails**: Set `NODE_AUTH_TOKEN` for GitHub Packages
- **Canvas not rendering**: Ensure Konva stage has width/height from container
- **Auth redirect loop**: Check `VITE_API_URL` matches server, clear `kubegram_auth` from localStorage
- **Build fails on types**: Run `bun run typecheck` to see all errors
- **Stale canvas state**: Clear localStorage (`kubegram_canvas_*` keys)
- **GraphQL sync errors**: Ensure backend is running and `VITE_GRAPHQL_HTTP_URL` is correct
