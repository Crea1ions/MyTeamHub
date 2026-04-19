---
id: phase-2-event-types
type: design-notes
phase: 2
status: active
date: 2026-04-17
---

# 📋 Event Types — Design Notes

## Overview

This document describes the **4 primary event types** for Phase 2.
These are the core flows we're building with. Phase 3 can extend as needed.

---

## Primary Event Types

### 1. `output_generated`

**Source**: Team-Studio → Orchestrator  
**Purpose**: LLM output ready for persistence  

```json
{
  "event_type": "output_generated",
  "timestamp": "2026-04-17T12:00:00Z",
  "data": {
    "project_id": "string (required, non-empty)",
    "session_id": "string (required, non-empty)",
    "content": "string (required, non-empty)",
    "metadata": {
      "model": "string (optional)",
      "tokens": "number (optional)",
      "temperature": "number (optional)"
    }
  }
}
```

**State Transitions**:
- Idle → Processing → Complete
- Action: write_vault
- Path: `outputs/{project_id}/{session_id}.md`

**Invariants**:
- ✅ project_id non-empty
- ✅ session_id non-empty
- ✅ content non-empty
- ✅ timestamp ISO8601

**Locked Until**: Phase 3 (or explicit Phase 2 RFC)

---

### 2. `session_created`

**Source**: Team-Studio → Orchestrator  
**Purpose**: New session metadata  

```json
{
  "event_type": "session_created",
  "timestamp": "2026-04-17T12:00:00Z",
  "data": {
    "project_id": "string (required, non-empty)",
    "session_id": "string (required, non-empty)",
    "title": "string (optional)"
  }
}
```

**State Transitions**:
- Idle → Processing → Complete
- Action: index_metadata
- Path: `projects/{project_id}/sessions.json`

**Invariants**:
- ✅ project_id non-empty
- ✅ session_id non-empty
- ✅ timestamp ISO8601

**Locked Until**: Phase 3

---

### 3. `project_updated`

**Source**: Team-Studio → Orchestrator  
**Purpose**: Project context update  

```json
{
  "event_type": "project_updated",
  "timestamp": "2026-04-17T12:00:00Z",
  "data": {
    "project_id": "string (required, non-empty)",
    "context": "string (required, non-empty)",
    "metadata": {
      "status": "string (optional)",
      "phase": "string (optional)"
    }
  }
}
```

**State Transitions**:
- Idle → Processing → Complete
- Action: update_context
- Path: `projects/{project_id}/context.md`

**Invariants**:
- ✅ project_id non-empty
- ✅ context non-empty
- ✅ timestamp ISO8601

**Locked Until**: Phase 3

---

### 4. `custom_agent_created`

**Source**: Team-Studio → Orchestrator  
**Purpose**: Custom agent provisioning  

```json
{
  "event_type": "custom_agent_created",
  "timestamp": "2026-04-17T12:00:00Z",
  "data": {
    "agent_id": "string (required, non-empty, UUID-like)",
    "project_id": "string (required, non-empty)",
    "name": "string (required, non-empty)",
    "prompt": "string (required, non-empty)"
  }
}
```

**State Transitions**:
- Idle → Processing → WaitingForAgent → Complete
- Action: provision_agent
- Path: `agents/{agent_id}.md`

**Invariants**:
- ✅ agent_id non-empty, UUID format
- ✅ project_id non-empty
- ✅ name non-empty
- ✅ prompt non-empty
- ✅ timestamp ISO8601

**Locked Until**: Phase 3

---

## 🚫 Events NOT Allowed (Yet)

❌ `agent_executed` — Deferred to Phase 2.2  
❌ `workflow_completed` — Deferred to Phase 2.3  
❌ `error_occurred` — Deferred to Phase 2.4  
❌ `metric_reported` — Deferred to Phase 3  

Any new event type requires:
1. Phase 2 Architecture Review
2. Integration impact analysis
3. Backwards compatibility check
4. Test coverage specification

---

## 📋 Event Processing Guarantee

**Every event** undergoes:

```
1. Received at /api/events
2. Validated: required fields non-empty
3. Routed: event_type → handler
4. Executed: state transition
5. Persisted: context saved to Vault
6. Logged: entry to events.log
7. Returned: response (success/error)
```

**Invariant**: Event is NEVER partially processed. Atomicity guaranteed.

---

## 🔐 Locked Contract Checklist

- [x] 4 event types defined
- [x] Required fields specified
- [x] JSON schemas locked
- [x] State transitions documented
- [x] Invariants explicitly listed
- [x] No new types until Phase 3
- [x] Backwards compatibility preserved

---

## Rationale

This freeze prevents:
- ✅ Event model drift
- ✅ State machine surprise cases
- ✅ Agent contract violations
- ✅ System-level instability

Until Phase 3, **all events fit the 4 types above**, with no exceptions.

---

**Status**: 🔒 LOCKED (Phase 2.1 - 2.4)  
**Enforcement**: Compile-time enum + runtime validation  
**Override**: Phase 3 RFC required  
