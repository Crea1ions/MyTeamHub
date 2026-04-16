# Runtime Structure Guide

## Overview

MyTeamHub separates code (version-controlled) from runtime data (generated during execution). This document describes the runtime system architecture.

## Mental Model

The runtime system is organized into logical components:

- **`system/`** — Infrastructure d'exécution (volatile, cache, process management)
  - `state/` — Session memory and transient state changes
  - `cache/` — Regenerable cache (can be safely deleted)
  - `pids/` — Process IDs and running service information

- **`data/`** — Données métier (business data, persistent across sessions)
  - `sessions/` — Chat session histories
  - `agents/` — Agent configurations created dynamically
  - `projects/` — Per-project execution data (sessions, execution logs)

- **`logs/`** — Audit trail and execution logs (immutable record)
  - Timestamped log files from all processes
  - Used for debugging and monitoring

- **`archive/`** — Historical reports and audits (versioned snapshots)
  - Time-stamped audit reports (`AUDIT_*.md`, `FIX_*.md`)
  - UI/UX audit snapshots
  - Deprecated agent configurations

- **`media/`** — Artefacts multimédia (generated during testing/execution)
  - `screenshots/` — Playwright test screenshots
  - `test-results/` — Test execution artifacts

## Directory Structure

```
runtime/
├── system/
│   ├── state/                  # Session memory, volatile state
│   ├── cache/                  # Regenerable cache files
│   └── pids/                   # Process identifiers
├── data/
│   ├── sessions/               # Chat session histories
│   ├── agents/                 # Custom agent definitions
│   └── projects/               # Per-project execution data
├── logs/                       # Audit trail (immutable)
├── archive/                    # Historical reports/audits
└── media/
    └── screenshots/            # Test screenshots, media files
```

## Configuration & Access

### Entry Point: `server/config/runtime.js`

All runtime path access goes through a centralized configuration module:

```javascript
const runtimeConfig = require('./config/runtime');

// Access paths
runtimeConfig.PATHS.sessions;     // runtime/data/sessions
runtimeConfig.PATHS.agents;       // runtime/data/agents
runtimeConfig.PATHS.logs;         // runtime/logs
runtimeConfig.PATHS.screenshots;  // runtime/media/screenshots
```

### Environment Variables

The runtime system supports multi-environment configuration:

- **`NODE_ENV`** — Node.js environment
  - `'development'` (default)
  - `'production'`

- **`RUNTIME_MODE`** — Runtime execution mode
  - `'local'` (default) — Local filesystem (development, single-user)
  - `'server'` — Remote backend (future: Tauri + Rust backend)

- **`RUNTIME_PATH`** — Override runtime base directory
  - Default: `<repo-root>/runtime`
  - Allows custom deployment locations

Example:
```bash
NODE_ENV=production RUNTIME_MODE=local RUNTIME_PATH=/var/myteam-runtime npm start
```

## Core Rules

### Rule 1: Nothing in `runtime/` is Ever Committed
- All runtime files are ignored by `.gitignore`
- `.gitkeep` files maintain directory structure in Git

### Rule 2: Sessions, Logs, Agents = Local Only
- User chat sessions remain on the user's machine
- Agent custom configurations are not synchronized globally
- Execution logs are device-specific

### Rule 3: Clean State on Fresh Clone
```bash
# After git clone <repo>, runtime structure is created automatically:
npm install  # This should initialize runtime directories

# Or manually:
node scripts/setup-runtime.js
```

### Rule 4: Future Vault Integration
- Long-term storage: A future "vault" service will be the destination for:
  - Exported sessions (user choice)
  - Shared agent templates
  - Analytics/monitoring data

## Data Flow

```
User Action (UI)
    ↓
Server API (server/index.js)
    ↓
Business Logic (services/)
    ↓
Runtime Paths (config/runtime.js)
    ↓
Filesystem (runtime/{system,data,logs,archive,media})
    ↓
[Optional] Vault Export (future)
```

## Migration from Legacy Structure

### Pre-Phase 1 (Legacy)
```
data/sessions-index.json          → runtime/system/sessions-index.json
data/agents/*.agent.md            → runtime/data/agents/
logs/                             → runtime/logs/
playwright-screenshots/           → runtime/media/screenshots/
test-results/                     → runtime/media/test-results/
data/projects/*/sessions/         → runtime/data/projects/{id}/sessions/
data/projects/*/execution.log     → runtime/data/projects/{id}/execution.log
```

### Code Remains in Git
```
data/prompts/                     ← STAYS in Git (system prompts)
data/projects/{id}/               ← Project code STAYS in Git
                                     (only sessions/* removed)
server/, ui/, tests/              ← All remain in Git
```

## Validation Checklist

After deployment, verify:

- [ ] Runtime structure exists locally: `ls -la runtime/`
- [ ] No runtime files tracked: `git ls-files | grep -E "runtime/|logs/|sessions-index"`
- [ ] `.gitkeep` files preserve structure: `find runtime -name .gitkeep | wc -l` ≥ 8
- [ ] Services use centralized config: `grep -r "require.*config/runtime" server/`
- [ ] No hardcoded paths: `grep -r "\.\.\/logs\|\.\.\/data\/sessions" server/ | grep -v config/runtime`

## See Also

- [README.md](../README.md) — Main project documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System architecture overview
- [server/config/runtime.js](../server/config/runtime.js) — Configuration module
