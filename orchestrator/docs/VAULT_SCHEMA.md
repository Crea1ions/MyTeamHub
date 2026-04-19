---
id: vault-schema
type: data-model
status: locked
created: 2026-04-16
phase: 0.4
tags: [vault, data-model, schema, markdown, json, obsidian]
---

# Vault Data Schema & Storage Model

## Overview

Vault is the **source of truth** for all persistent data in MyTeamHub. It uses a **hybrid format**:
- **Markdown (.md)**: Human-readable content, linking, Obsidian compatibility
- **JSON**: Structured metadata, logs, session records

**Location**: `/vault/` directory (local-first, git-ignored for runtime data)

---

## Directory Structure

```
vault/
├── _index.json                    # Vault catalog (file registry)
├── projects/
│   └── {project_uuid}/
│       ├── context.md             # Project root + metadata (frontmatter)
│       ├── notes/
│       │   ├── 2026-04-16.md      # Daily notes
│       │   ├── architecture.md    # Topic notes
│       │   └── {note_id}.md       # User notes with wikilinks
│       ├── sessions.json          # Session metadata array
│       └── agents.json            # Agent execution logs
├── agents/
│   ├── {agent_id}.json            # Agent state + execution history
│   └── executor_log.json          # Orchestrator agent dispatch log
├── outputs/
│   └── {session_uuid}/
│       ├── {timestamp}.md         # Team-Studio output per session
│       └── metadata.json          # Output metadata
├── sync/
│   └── sync_log.json              # Sync transaction record (for offline recovery)
└── logs/
    ├── orchestrator.json          # System events
    ├── errors.json                # Error records
    └── performance.json           # Performance metrics
```

---

## Markdown Files (Content + Linking)

### context.md (Project Root)

**Purpose**: Central project document with metadata + narrative

**Format**:
```markdown
---
id: {project_uuid}
type: project
created: 2026-04-16T12:00:00Z
updated: 2026-04-16T14:30:00Z
title: APP-MyTeamHub Refactor
tags: [architecture, rust, multiplatform]
linked_files:
  - /vault/projects/{uuid}/notes/architecture.md
  - /vault/agents/collaborator.json
status: active
---

# APP-MyTeamHub Architecture Refactor

## Overview

This project transforms MyTeamHub from Node.js monolith to Rust-based multiplatform system.

## Key Decisions

- **Parallel Strategy**: Keep Team-Studio (Node.js), build Rust runtime
- **Data Flow**: Team-Studio → Orchestrator → Vault (no direct coupling)
- **Desktop First**: Tauri (Linux) priority, Flutter (Android) Phase 4

## References

- Architecture: [[architecture]]
- Phase Plan: [[phase-0-plan]]
- Agent Notes: [[agents-modal-system]]

---

## Status Timeline

- 2026-04-16: Architecture decision locked
- 2026-04-17: Rust project initialized
- 2026-04-24: Phase 1 kickoff (Vault I/O)
```

**Frontmatter Fields** (YAML):
- `id` (uuid): Unique identifier (auto-generated or user-specified)
- `type` (enum: project, note, output, decision): Document type
- `created` (ISO 8601): Creation timestamp
- `updated` (ISO 8601): Last update timestamp
- `title` (string): Human-readable title
- `tags` (array): Search/categorization tags
- `linked_files` (array): References to other vault files
- `status` (enum: active, archived, draft): Document state

### Topic Notes (notes/{note_id}.md)

**Format**:
```markdown
---
id: {note_uuid}
type: note
created: 2026-04-16T13:00:00Z
updated: 2026-04-16T13:45:00Z
title: Orchestrator Event Routing
project_id: {project_uuid}
linked_notes:
  - architecture
  - agents-modal-system
tags: [orchestrator, events, design]
---

# Orchestrator Event Routing Design

## Overview

Event-driven system where orchestrator routes to handlers based on event type.

## Event Types

- `file_created`: New file in Vault
- `file_updated`: File content changed
- `session_started`: User session begins
- `agent_executed`: Agent completed execution
- `sync_request`: Data sync triggered

## Routing Rules

| Event | Handler | Vault Write |
|-------|---------|-------------|
| file_created | Agent Selector | Log to agents.json |
| file_updated | Update Tracker | Update context.md |
| session_started | Session Creator | Add to sessions.json |
| agent_executed | Output Persister | Write to /outputs/ |

## Implementation

See `orchestrator/src/events/router.rs`

---

## Related

- [[architecture]] - Design decisions
- [[phase-0-plan]] - Implementation roadmap
```

### Daily Notes (notes/2026-04-16.md)

**Format** (lightweight, minimal metadata):
```markdown
---
id: daily-2026-04-16
type: daily-note
created: 2026-04-16T00:00:00Z
updated: 2026-04-16T18:00:00Z
date: 2026-04-16
tags: [daily, progress]
---

# 2026-04-16 — Development Log

## Morning

- ✓ Repository cloned
- ✓ Architecture document created
- ✓ Rust project initialized

## Afternoon

- ✓ Vault schema locked
- ⏳ Team approval on architecture
- → Phase 1 planning

## Blockers

- None

## Tomorrow

- [ ] npm install (Team-Studio deps)
- [ ] Vault I/O library skeleton
- [ ] Database schema validation
```

---

## JSON Files (Structured Data)

### _index.json (Vault Registry)

**Purpose**: Fast catalog of all files (for search, discovery)

**Format**:
```json
{
  "version": "1.0",
  "generated_at": "2026-04-16T14:30:00Z",
  "files": [
    {
      "id": "project-uuid-1",
      "path": "/vault/projects/project-uuid-1/context.md",
      "type": "project",
      "title": "APP-MyTeamHub Refactor",
      "tags": ["architecture", "rust"],
      "created": "2026-04-16T12:00:00Z",
      "updated": "2026-04-16T14:30:00Z",
      "links_to": ["note-uuid-1", "agent-uuid-1"],
      "linked_from": ["daily-2026-04-16"]
    },
    {
      "id": "note-uuid-1",
      "path": "/vault/projects/project-uuid-1/notes/architecture.md",
      "type": "note",
      "title": "Orchestrator Event Routing",
      "tags": ["orchestrator", "events"],
      "created": "2026-04-16T13:00:00Z",
      "updated": "2026-04-16T13:45:00Z",
      "links_to": ["project-uuid-1"],
      "linked_from": ["project-uuid-1"]
    }
  ],
  "graph_metadata": {
    "total_files": 42,
    "total_links": 127,
    "orphaned_files": 3,
    "cycles_detected": 0
  }
}
```

**Generation**: Auto-generated from Markdown frontmatter on each write. Used for fast searches.

### sessions.json (Project Session Records)

**Purpose**: Track chat sessions, metadata, outputs

**Format**:
```json
{
  "project_id": "{project_uuid}",
  "sessions": [
    {
      "id": "session-uuid-1",
      "created": "2026-04-16T12:15:00Z",
      "updated": "2026-04-16T14:30:00Z",
      "title": "Architecture Brainstorm",
      "agent_id": "collaborator",
      "status": "active",
      "message_count": 12,
      "output_files": ["2026-04-16T12-15-output.md"],
      "metadata": {
        "model": "gpt-4",
        "temperature": 0.7,
        "tokens_used": 2450
      }
    },
    {
      "id": "session-uuid-2",
      "created": "2026-04-16T13:00:00Z",
      "updated": "2026-04-16T13:45:00Z",
      "title": "Critical Analysis",
      "agent_id": "analyst",
      "status": "completed",
      "message_count": 8,
      "output_files": ["2026-04-16T13-00-output.md"],
      "metadata": {
        "model": "gpt-4",
        "temperature": 0.3,
        "tokens_used": 1200
      }
    }
  ]
}
```

**Schema**:
- `project_id` (uuid): Parent project
- `sessions` (array): Session records
  - `id` (uuid): Session identifier
  - `created` (ISO 8601): Session start
  - `updated` (ISO 8601): Last activity
  - `title` (string): User-provided or auto-generated
  - `agent_id` (string): Which agent was used
  - `status` (enum: active, completed, archived): Current state
  - `message_count` (int): Number of messages/turns
  - `output_files` (array): Markdown files generated
  - `metadata` (object): LLM call metadata (model, temperature, tokens)

### agents.json (Agent Execution Log)

**Purpose**: Track agent invocations, performance, errors

**Format**:
```json
{
  "project_id": "{project_uuid}",
  "executions": [
    {
      "id": "exec-uuid-1",
      "timestamp": "2026-04-16T12:30:00Z",
      "agent_id": "collaborator",
      "session_id": "session-uuid-1",
      "input": {
        "file_id": "context.md",
        "user_prompt": "Design the data layer",
        "context_size": 2048
      },
      "output": {
        "response": "...",
        "tokens": 450,
        "latency_ms": 2340
      },
      "status": "success",
      "error": null
    },
    {
      "id": "exec-uuid-2",
      "timestamp": "2026-04-16T13:15:00Z",
      "agent_id": "analyst",
      "session_id": "session-uuid-2",
      "input": {
        "file_id": "architecture.md",
        "user_prompt": "Find risks in this design",
        "context_size": 3500
      },
      "output": {
        "response": "...",
        "tokens": 620,
        "latency_ms": 2810
      },
      "status": "success",
      "error": null
    }
  ],
  "statistics": {
    "total_executions": 42,
    "successful": 40,
    "failed": 2,
    "avg_latency_ms": 2500,
    "total_tokens": 28540
  }
}
```

### sync_log.json (Offline Sync Recovery)

**Purpose**: Track sync transactions for offline recovery

**Format**:
```json
{
  "sync_records": [
    {
      "sync_id": "sync-uuid-1",
      "timestamp": "2026-04-16T14:30:00Z",
      "status": "synced",
      "changes": [
        {
          "operation": "write",
          "file_path": "/vault/projects/uuid/context.md",
          "size_bytes": 2450,
          "checksum": "sha256:abc123..."
        },
        {
          "operation": "update",
          "file_path": "/vault/projects/uuid/sessions.json",
          "size_bytes": 5600,
          "checksum": "sha256:def456..."
        }
      ],
      "device_id": "desktop-linux-001",
      "error": null
    }
  ],
  "pending_syncs": [],
  "last_successful_sync": "2026-04-16T14:30:00Z"
}
```

**Use Case**: When desktop/mobile reconnects after offline, replay sync records to catch up.

---

## Wikilink Format (Markdown)

**Internal Links** (within Vault):
```markdown
[[architecture]]                    # Link to /vault/projects/uuid/notes/architecture.md
[[2026-04-16]]                      # Link to daily note
[[../outputs/session-1-output]]     # Explicit path
```

**Resolved at Runtime** by Vault library (search frontmatter + index.json for target).

---

## File Lifecycle

### Creation
1. User creates file (Team-Studio or Desktop UI)
2. Orchestrator receives event (file_created)
3. Vault writes file (Markdown + JSON metadata)
4. Index regenerated (add entry to _index.json)
5. UI reflects update (reads from Vault)

### Update
1. File modified (content or metadata)
2. Orchestrator sends update event
3. Vault updates file + frontmatter
4. Index updated (timestamp, links)
5. Sync log recorded (for offline recovery)

### Deletion
1. Delete request sent
2. Orchestrator validates (no broken links?)
3. File moved to archive/ (soft delete initially)
4. Hard delete after 30 days (configurable)
5. Index cleaned up

---

## Storage Constraints

| Aspect | Limit | Rationale |
|--------|-------|-----------|
| **File size** | <10MB per .md | Performance on weak machines |
| **Project size** | <500MB | Cache locally on mobile |
| **Total Vault** | <2GB | Reasonable for offline sync |
| **Index entries** | <50k files | Search performance |
| **Concurrent writes** | 5 max | Prevent race conditions |

---

## Consistency Guarantees

**Atomic Writes**: Each Vault operation (write/update/delete) is atomic (all-or-nothing)

**Last-Write-Wins**: For conflict resolution (if offline device syncs conflicting changes)

**Transaction Log**: sync_log.json provides recovery point (can replay from last successful sync)

**Checksum Verification**: Each synced file includes SHA256 hash (detect corruption)

---

## Migration Path (From Existing JSON to Vault)

**Input** (Current Team-Studio data):
```
data/projects/
├── {project_id}.json (session list)
└── {session_id}_output.md (LLM output)
```

**Output** (Vault format):
```
vault/
├── projects/{project_uuid}/
│   ├── context.md (from project.json + frontmatter)
│   ├── sessions.json (from existing sessions)
│   └── notes/ (if user notes exist)
└── outputs/
    └── {session_uuid}/ (from output.md files)
```

**Script**: `orchestrator/migrations/migrate_team_studio_to_vault.rs` (Phase 1.4)

---

## API Endpoints (Vault Access)

**Read**:
- `GET /api/vault/files` — List all files
- `GET /api/vault/file/{id}` — Read file content + frontmatter
- `GET /api/vault/search?q={query}` — Full-text search
- `GET /api/vault/graph` — Link graph (nodes + edges)

**Write**:
- `POST /api/vault/file` — Create file
- `PUT /api/vault/file/{id}` — Update file
- `DELETE /api/vault/file/{id}` — Delete file

**Admin**:
- `POST /api/vault/sync` — Trigger sync (for offline recovery)
- `GET /api/vault/index` — Rebuild search index
- `GET /api/vault/health` — Vault integrity check

---

## Implementation Checklist (Phase 1)

- [ ] Directory structure created (`vault/projects/`, `vault/agents/`, etc.)
- [ ] Markdown I/O library (read/write .md files)
- [ ] JSON serialization (serde integration)
- [ ] Frontmatter parser (YAML ↔ Rust struct)
- [ ] Index generation (auto-build _index.json)
- [ ] Wikilink resolver (find targets by name)
- [ ] File migration script (Team-Studio → Vault)
- [ ] API endpoints (Axum routes)
- [ ] Sync log transaction tracking
- [ ] Tests (CRUD operations, edge cases)

---

## Notes

- **Obsidian Compatibility**: Vault structure works with Obsidian if user opens `/vault/` directly
- **No Binary**: Everything is text-based (Markdown + JSON), git-friendly for version control
- **Future Enhancements**: Graph view (Phase 5+), full-text search optimization, compression for mobile

---

**Status**: ✅ **LOCKED** (ready for Phase 1 implementation)  
**Last Updated**: 2026-04-16  
**Next Review**: Phase 1 completion (Week 4)
