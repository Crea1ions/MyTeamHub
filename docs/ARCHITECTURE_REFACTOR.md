---
id: architecture-refactor-plan
type: architecture
status: pending-approval
created: 2026-04-16
updated: 2026-04-16
phase: 0
confidence: very_high
tags: [architecture, refactor, parallel-strategy, rust, multiplatform, vault]
---

# Architecture Refactor: MyTeamHub Multiplatform Transformation

## Executive Summary

Transform APP-MyTeamHub from a 25%-complete Node.js monolith into a **production-ready multiplatform system** (Rust runtime + Tauri desktop + Flutter mobile + Vault memory layer) over **17 weeks**.

**Key Strategy**: Parallel development — preserve Team-Studio (Node.js creation UI), build new Rust runtime system independently.

---

## Current State Assessment

| Component | Status | Coverage |
|-----------|--------|----------|
| **Team-Studio Backend** | ✅ Working | 40% (Express API, basic orchestration) |
| **Agents System** | ✅ Partial | 60% (Analyste live, custom agents functional) |
| **Testing/CI** | ✅ Present | Jest + Playwright infrastructure |
| **Frontend UI** | ⚠️ Basic | 40% (Vanilla JS, not multiplatform) |
| **Vault Integration** | ❌ Missing | 0% |
| **Rust Orchestrator** | ❌ Missing | 0% |
| **Desktop App** | ❌ Missing | 0% |
| **Mobile App** | ❌ Missing | 0% |
| **Offline-First** | ❌ Missing | 0% |
| **Performance Optimization** | ❌ Missing | 0% |

**Overall Coverage**: ~25% architecturally incomplete

---

## Architecture Decisions (LOCKED)

### 1. Parallel Strategy: Two Independent Systems

```
Team-Studio (Node.js - PRESERVED)
├─ Express backend (port 3001)
├─ Vanilla JS frontend
├─ Agents system (Analyste, custom agents)
├─ Testing infrastructure
└─ Role: Content creation, brainstorming UI

MyTeamHub Runtime (Rust - NEW)
├─ Axum API server
├─ Event-driven orchestrator
├─ Vault integration
├─ Desktop client (Tauri, Linux priority)
├─ Mobile client (Flutter, Android)
└─ Role: Production runtime, multiplatform deployment
```

**Rationale**: 
- Aligns with mission design (Team-Studio ≠ MyTeamHub runtime)
- Enables parallel work streams (unblocked development)
- Reduces migration risk (Team-Studio stays stable)
- Cleaner separation of concerns

---

### 2. Data Flow Architecture (NO Direct Coupling)

```
┌─────────────────────────────────────────────────────────┐
│ Team-Studio (Creation)                                  │
│ User inputs → Express Backend → Events                  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ↓
        ┌─────────────────────────────┐
        │ Express API (Node.js)        │
        │ Sends events to Orchestrator │
        └────────────┬────────────────┘
                     │
                     ↓
    ┌────────────────────────────────────────┐
    │ Rust Orchestrator (System Engine)      │
    │ - Event routing (deterministic)        │
    │ - Rules engine                         │
    │ - NO cognitive logic                   │
    │ - Routes to Agent Selector             │
    └────────┬─────────────────┬─────────────┘
             │                 │
             ↓                 ↓
    ┌──────────────┐   ┌──────────────────────┐
    │ Vault        │   │ Agent Execution      │
    │ (Markdown+   │   │ (Cognitive Modes)    │
    │  JSON)       │   │ - Collaborator       │
    │              │   │ - Explorer           │
    │ Reads ←──────┼───┤ - Analyst            │
    │ Writes ←─────┼───┤ - Deconstructionist  │
    │              │   │ - Stress Tester      │
    │ Source of    │   │                      │
    │ Truth        │   │ Results → Vault      │
    └──────────────┘   └──────────────────────┘
             ↑
             │
    ┌────────┴──────────┐
    │ Desktop UI        │
    │ (Tauri, Linux)    │
    │                   │
    │ Mobile UI         │
    │ (Flutter, Android)│
    └───────────────────┘
```

**Critical Rules**:
- ❌ **Team-Studio NEVER reads from Vault directly**
- ❌ **Team-Studio NEVER writes to Vault directly**
- ✅ **All data flows through Orchestrator (event → Vault → UI)**
- ✅ **Vault is source of truth** (all clients read from it)
- ✅ **Agents are stateless** (read context → process → write results)

---

### 3. Vault Data Model (Markdown + JSON)

**Format**:
- **Markdown (.md)**: Content files, enables linking, Obsidian compatibility, graph navigation
- **JSON**: Session metadata, logs, structured data (arrays, nested objects)

**Structure**:
```
vault/
├── projects/
│   └── {project_id}/
│       ├── context.md (frontmatter + content)
│       ├── notes/
│       │   └── *.md (individual notes with wikilinks)
│       └── sessions.json (session metadata)
├── agents/
│   └── {agent_id}.json (agent execution logs + results)
├── outputs/
│   └── *.md (Team-Studio outputs)
└── logs/
    └── *.json (system events, sync records)
```

**Frontmatter Example** (context.md):
```yaml
---
id: project-uuid
type: project
created: 2026-04-16
tags: [myteamhub, rust, multiplatform]
linked_agents: [collaborator, explorer]
---

# Project: MyTeamHub Refactor

Content here...
```

**Rationale**:
- Markdown ensures Obsidian compatibility
- JSON for structured queries (session lookup, agent logs)
- Supports graph visualization (Phase 5+)
- Local-first, human-readable
- No vendor lock-in

---

### 4. Orchestrator Role (System Layer, NOT Cognitive)

**Orchestrator Responsibilities**:
- ✅ Event routing (file_created, file_updated, agent_executed, sync_request)
- ✅ Deterministic rule-based dispatch
- ✅ State machine for multi-step workflows
- ✅ Vault read/write coordination
- ✅ Agent selector (route to appropriate cognitive mode)
- ✅ Concurrency management (safe parallel execution)

**Orchestrator NOT Responsible For**:
- ❌ Cognitive logic (intelligence belongs to agents)
- ❌ LLM calls (agent responsibility)
- ❌ Agent-to-agent sequencing (agents are independent modes)
- ❌ Decision-making (agents decide, orchestrator executes)

**Design Pattern**: Event-driven + async (Tokio) for weak machine performance

---

### 5. Agent Architecture (Modal, Non-Linear)

**Agent Models** (Cognitive Modes):
1. **Collaborator** — Brainstorming, co-creation
2. **Explorer** — Discovery, analysis, context gathering
3. **Analyst Critique** — Critical evaluation, risk assessment
4. **Deconstructionist** — Breaking down complexity
5. **Stress Tester** — Edge cases, robustness testing

**Key Properties**:
- **Modal Selection**: User/system chooses agent based on context (file type, intent, session state)
- **Instant Switching** (<500ms): User can swap agents mid-session without restart
- **Non-Linear**: Agents don't form pipeline; each is independent mode
- **Non-Blocking**: Orchestrator selects agent, agent executes, results → Vault
- **Context Isolated**: Each agent reads relevant Vault context; no agent-to-agent coupling
- **System-Defined**: Agents defined in config/prompts (NOT sourced from Vault)
- **Vault as Memory**: Agents read file context from Vault, write results back

**Agent Execution Flow**:
1. User/system triggers agent selection
2. Orchestrator identifies appropriate agent (context-aware)
3. Agent reads file context from Vault
4. Agent processes (via LLM or logic)
5. Agent writes results back to Vault
6. UI reflects new Vault state

---

### 6. Team-Studio Integration Layer

**What Changes in Team-Studio**:
- ✅ Express API sends events to Orchestrator (via HTTP webhook or message queue)
- ✅ Team-Studio outputs routed → Orchestrator → Vault (not direct)
- ✅ Team-Studio can READ from Vault indirectly (via orchestrator API, not direct file access)
- ❌ Team-Studio never reads Vault file structure directly

**API Contract Preserved**:
- Existing `/api/chat`, `/api/agents`, `/api/projects` routes remain stable
- New event routing added: Team-Studio backend → Orchestrator events

**Communication Pattern**:
```
Team-Studio Express Backend
    ↓
Sends: POST /api/events (to Orchestrator)
{
  "event_type": "session_created",
  "data": {
    "file_id": "uuid",
    "content": "...",
    "metadata": {...}
  }
}
    ↓
Orchestrator processes → Vault persists
    ↓
Desktop/Mobile clients read from Vault UI
```

---

### 7. Desktop Priority (Tauri, Linux Strategic Focus)

**Phase 3 Focus**: Linux desktop application (Tauri)

**Why Desktop First**:
- Developer machine priority (Linux dev environment)
- Easier to test/debug than mobile
- Establishes UI patterns for mobile later
- Performance optimization critical (i3/16GB target)

**Why Tauri** (not Electron):
- Lightweight (100MB vs 500MB+)
- Rust integration (orchestrator lives here)
- Native OS integration (better file access)
- Performance on weak machines

**Phase 4+**: Mobile (Flutter, Android) as extension

---

### 8. Offline-First Strategy

**Desktop + Mobile**:
- Local cache: Store recent files via file system (Desktop Tauri) or Hive (Flutter mobile)
- Sync queue: Queue events when offline
- Reconnect: Background sync when network detected
- Conflict resolution: Last-write-wins (simple, deterministic)

**Orchestrator Role**:
- Coordinate sync operations
- Track sync state (pending, synced, failed)
- Retry logic for failed syncs

---

### 9. Performance Targets

**Application Launch**: <2 seconds (cold start on i3/16GB)
**File Open**: <500ms
**Agent Switching**: <500ms
**Search Query**: <1 second (for 1000+ files)
**Desktop Binary**: <100MB (AppImage)

**Optimization Strategy**:
- Async/await (Tokio) for all I/O
- LRU caching for frequently accessed files
- Lazy loading (UI components, data)
- Profiling early and often

---

## Phase Breakdown (17 Weeks)

| Phase | Weeks | Focus | Output |
|-------|-------|-------|--------|
| **0** | 1 | Setup, decisions, Rust project | Repo ready, architecture locked |
| **1** | 3 | Vault I/O, API, migration | Files persist, Team-Studio syncs through orchestrator |
| **2** | 4 | Orchestrator core, agents | Event routing, agent execution, modal switching |
| **3** | 4 | Desktop MVP (Tauri Linux) | AppImage, file explorer, search, chat, offline |
| **4** | 3 | Mobile MVP (Flutter Android) | APK, basic UI, offline cache, sync |
| **5** | 2 | Integration, optimization, release | v0.1.0 shipped, performance targets met |

---

## Critical Success Criteria

✅ **Architectural Separation** — Team-Studio ↔ Orchestrator ↔ Vault (no direct coupling)  
✅ **Vault as Source of Truth** — All clients read from Vault, no local state  
✅ **Deterministic Orchestrator** — System layer, no cognitive logic, event-driven  
✅ **Modal Agents** — Non-linear, contextual selection, instant switching  
✅ **Performance** — Targets met on weak machines (i3/16GB)  
✅ **Offline-First** — Desktop/mobile functional without network  
✅ **Zero Data Loss** — Sync strategy tested, no corruption  
✅ **Multiplatform** — Desktop + mobile deployable  

---

## Decision Approval Checklist

Before proceeding to Phase 0.3 (Rust project init), validate:

- [ ] **Parallel strategy approved** — Keep Node.js Team-Studio, build Rust runtime separately
- [ ] **Data flow understood** — Team-Studio → Orchestrator → Vault (no direct coupling)
- [ ] **Vault format agreed** — Markdown (.md) + JSON, Obsidian-compatible
- [ ] **Orchestrator scope clear** — System layer (deterministic), agents are cognitive layer
- [ ] **Agent architecture confirmed** — Modal, non-linear, context-isolated
- [ ] **Desktop priority confirmed** — Tauri Linux Phase 3, Flutter Android Phase 4
- [ ] **Performance targets acceptable** — <2s startup, <500ms file open on i3/16GB
- [ ] **Timeline realistic** — 17 weeks for full MVP (Phase 0-5)

---

## Implementation Constraints

🔒 **Never**:
- Couple Team-Studio directly to Vault
- Put cognitive logic in orchestrator
- Create agent-to-agent pipelines
- Ignore deterministic architecture
- Violate offline-first design

🔓 **Always**:
- Route data through orchestrator
- Keep agents as independent modes
- Test sync + offline scenarios
- Profile performance early
- Document data flow decisions

---

## Next Steps

1. **Approval**: User validates all decisions above
2. **Rust Setup**: Initialize Cargo project, lock dependencies (Phase 0.3)
3. **Vault Schema**: Define data models, directory structure (Phase 0.4)
4. **Phase 1 Kickoff**: Vault I/O library + API wrapper

---

## Appendix: Team Communication

This document is the **single source of truth** for architectural decisions during implementation.

**For Developers**:
- Ref this doc when ambiguity arises
- Escalate deviations immediately
- Keep decisions locked (no ad-hoc changes)

**For Users/Stakeholders**:
- Decisions here are binding until formally updated
- Changes require approval checkpoint
- Suggest improvements → update this doc before coding

---

**Created**: 2026-04-16  
**Status**: ⏳ **PENDING USER APPROVAL**  
**Next Review**: After Rust project initialization (Phase 0.3)
