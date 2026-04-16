# MyTeamHub Architecture

## System Overview

MyTeamHub is a local-first orchestrator for AI agents with a clear separation between code (version-controlled) and runtime data (local-only).

## Three-Layer Model

```
┌─────────────────────────────────────────────┐
│        User Interface (Static)              │
│    ui/index.html + ui/studio.html          │
│    (HTML5 + vanilla JS)                    │
└────────────┬────────────────────────────────┘
             │ HTTP/WebSocket
             ↓
┌─────────────────────────────────────────────┐
│     Backend API (Node.js + Express)        │
│  server/index.js → server/routes/*          │
│  • Chat orchestration                       │
│  • Agent management                         │
│  • Project execution                        │
│  • File operations                          │
└────────────┬────────────────────────────────┘
             │ HTTP
             ↓
┌─────────────────────────────────────────────┐
│  Mistral Proxy (rate-limiting)             │
│     proxy-myteam:3006                      │
└────────────┬────────────────────────────────┘
             │ HTTP
             ↓
┌─────────────────────────────────────────────┐
│       Mistral AI Models API                 │
│    (External service)                       │
└─────────────────────────────────────────────┘
```

## Component Architecture

### Frontend (`ui/`)
- **index.html** — Main project browser interface
- **studio.html** — MyTeamHub Studio (agent creation/editing)
- **js/** — Frontend application logic
- **css/** — Styling and responsive design

### Backend (`server/`)

#### API Routes
- **routes/chat.js** — Chat/orchestration endpoints
- **routes/agents.js** — Agent CRUD operations
- **routes/projects.js** — Project management
- **routes/sessions.js** — Session history
- **routes/files.js** — File operations
- **routes/analyser.js** — Analyzer service
- **routes/health.js** — Health checks

#### Services
- **services/callModel.js** — Mistral API client (with circuit breaker)
- **services/agentOrchestrator.js** — Multi-agent orchestration
- **services/agentValidator.js** — Agent validation and parsing
- **services/chatBuilder.js** — Chat message construction
- **services/sessionManager.js** — Session persistence
- **services/projectFileManager.js** — Project file operations

#### Middleware
- **middleware/auth.js** — Authentication (basic for now)
- **middleware/rateLimit.js** — Rate limiting
- **middleware/validateProjectId.js** — Project validation
- **middleware/validateMyTeamHubApiKey.js** — API key validation

#### Configuration
- **config/runtime.js** — Runtime paths and environment
- **config/endpoints.js** — API endpoint configuration
- **config/paths.js** — File system paths
- **config/analyzerWhitelist.json** — Analyzer permissions

### Data & Templates (`data/`)

#### Prompts (System)
- **data/prompts/rêveur.md** — Creative thinking agent
- **data/prompts/ingénieur.md** — Technical engineer agent
- **data/prompts/diablotin.md** — Devil's advocate agent
- **data/prompts/artisan.md** — Craft/detail specialist agent
- **data/prompts/analyste.md** — Analysis specialist agent

These are **version-controlled templates**.

#### Projects (Code Only)
- **data/projects/{project-name}/** — Project source files
  - Project configuration and context
  - Source code to analyze
  - **Note**: sessions/* and execution.log are runtime data (not tracked)

## Data Separation Model

```
┌──────────────────────────┐
│    Git Repository        │
│  (Version Controlled)    │
├──────────────────────────┤
│ ✅ server/ (backend)     │
│ ✅ ui/ (frontend)        │
│ ✅ tests/ (test suites)  │
│ ✅ data/prompts/         │
│    (system templates)    │
│ ✅ Documentation         │
│ ✅ Configuration files   │
└──────────────────────────┘
         │
         │ (local clone)
         ↓
┌──────────────────────────┐
│   Runtime Directory      │
│  (Local Machine Only)    │
├──────────────────────────┤
│ ❌ runtime/system/       │
│    (volatile state)      │
│ ❌ runtime/data/         │
│    (sessions, agents)    │
│ ❌ runtime/logs/         │
│    (audit trail)         │
│ ❌ runtime/archive/      │
│    (audit reports)       │
│ ❌ runtime/media/        │
│    (screenshots, etc.)   │
└──────────────────────────┘
```

**Key Principle**: Code goes in Git. Runtime data stays local.

## Execution Flow: Chat Message

```
1. User sends message in UI
   ↓
2. Frontend: POST /api/chat/studio
   { projectId, agent, message, history }
   ↓
3. Backend: routes/chat.js
   ↓
4. Service: chatBuilder.js
   - Load agent definition
   - Prepare message context
   - Build prompt
   ↓
5. Service: callModel.js
   - Check circuit breaker status
   - Call Mistral API via proxy
   - Handle timeouts/retries
   ↓
6. Response: Return to UI
   - Update chat history
   - Save session (runtime/data/sessions/)
   ↓
7. Done
```

## Execution Flow: Orchestration

```
1. User initiates orchestration
   ↓
2. POST /api/chat/orchestrate
   { projectId, message }
   ↓
3. agentOrchestrator.js
   - Sequential agent activation
   - Each agent: rêveur → ingénieur → diablotin → artisan
   - Context passing between agents
   - Response aggregation
   ↓
4. Response: Combined insights
   ↓
5. Save orchestration session (runtime/)
```

## Agent Types

### System Agents (in Git)
- **Rêveur** (Dreamer) — Creative ideation, brainstorming
- **Ingénieur** (Engineer) — Technical analysis, implementation
- **Diablotin** (Devil's Advocate) — Critical thinking, risk identification
- **Artisan** (Craftsman) — Detail-oriented execution planning
- **Analyste** (Analyst) — Deep file analysis (Phase 1)

### Custom Agents (Runtime)
- Created via MyTeamHub Studio
- Stored in `runtime/data/agents/*.agent.md`
- User-specific, not shared globally (yet)

## Security Model

### Current (Local Tunnel)
- Designed to run behind Wireguard tunnel
- API key validation per request
- Rate limiting per IP/key
- No persistent authentication

### Environment Separation
- `.env` files for sensitive configuration (never committed)
- Circuit breaker protects against Mistral API failures
- Validator middleware prevents invalid project/agent access

## Configuration Hierarchy

```
1. Code Defaults (server/config/*.js)
   ↓
2. Environment Variables (.env)
   ↓
3. Runtime Configuration (config/runtime.js)
   ↓
4. Runtime Paths (runtime/)
```

## Deployment Targets

### Supported
- **Local Development** — Single machine, npm start
- **Linux Server** — systemd service or process manager
- **Wireguard Network** — Behind VPN tunnel

### Planned
- **Tauri Desktop App** — Packaged client (RUNTIME_MODE='local')
- **Rust Backend** — Production server (RUNTIME_MODE='server')
- **Cloud Vault** — Shared session/agent storage (Phase 2+)

## Testing Strategy

- **Unit Tests** — `__tests__/` (Jest)
- **Integration Tests** — `tests/` (API endpoints)
- **Playwright Tests** — `playwright-tests/` (E2E UI)
- **Artifacts** — `test-results/`, `playwright-screenshots/` (runtime)

## Performance Considerations

1. **Circuit Breaker** — Protects against cascading failures
2. **Rate Limiting** — Per-client rate limiting
3. **Caching** — Agent definitions cached in `runtime/system/cache/`
4. **Session Storage** — File-based for simplicity (scales to ~1000s of sessions)

## Future Roadmap

- **Phase 2** — Vault integration for shared agents/sessions
- **Phase 3** — Multi-user support with proper authentication
- **Phase 4** — Rust backend for production scaling
- **Phase 5** — Desktop app (Tauri) with offline capability

## See Also

- [README.md](../README.md) — Quick start and API reference
- [RUNTIME_STRUCTURE.md](./RUNTIME_STRUCTURE.md) — Runtime directory guide
- [server/index.js](../server/index.js) — Backend entry point
- [PLAN.md](../PLAN.md) — Design documentation
