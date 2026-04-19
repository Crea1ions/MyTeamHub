---
id: backend-integration-layer
type: architecture
phase: 1.3
status: completed
created: 2026-04-16
---

# Phase 1.3: Backend Integration Layer

## Overview

Backend Integration Layer ensures **ZERO direct coupling** between Team-Studio (Node.js) and Vault (Rust). All data flows through the orchestrator via event routing.

---

## Architecture: Data Flow

```
┌─────────────────────────────────────┐
│ Team-Studio Express Backend         │
│ (Node.js port 3001)                 │
│                                     │
│ User creates content/output         │
│ → Express route handler             │
│ → POST /api/orchestrator/events     │
└──────────────┬──────────────────────┘
               │ HTTP Event
               ↓
┌─────────────────────────────────────┐
│ Orchestrator Event Router           │
│ (Rust Axum port 8001)               │
│                                     │
│ Receives event (Team-Studio output) │
│ → Validates event structure         │
│ → Routes to handler                 │
│ → Persists to Vault                 │
└──────────────┬──────────────────────┘
               │ Vault Write
               ↓
┌─────────────────────────────────────┐
│ Vault (source of truth)             │
│ Persists markdown + metadata        │
└─────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│ Desktop/Mobile Clients               │
│ Read from Vault API                  │
│ (no direct Team-Studio access)       │
└──────────────────────────────────────┘
```

---

## Event Types

Events sent FROM Team-Studio TO Orchestrator:

### 1. SessionCreated
```json
{
  "event_type": "session_created",
  "timestamp": "2026-04-16T14:30:00Z",
  "data": {
    "session_id": "uuid",
    "project_id": "uuid",
    "agent_id": "collaborator",
    "title": "Brainstorm Session"
  }
}
```

### 2. OutputGenerated
```json
{
  "event_type": "output_generated",
  "timestamp": "2026-04-16T14:35:00Z",
  "data": {
    "session_id": "uuid",
    "project_id": "uuid",
    "content": "# Generated output markdown",
    "agent_id": "collaborator",
    "metadata": {
      "model": "gpt-4",
      "tokens": 1245
    }
  }
}
```

### 3. ProjectUpdated
```json
{
  "event_type": "project_updated",
  "timestamp": "2026-04-16T14:40:00Z",
  "data": {
    "project_id": "uuid",
    "context": "# Updated project context",
    "tags": ["architecture", "rust"]
  }
}
```

### 4. CustomAgentCreated
```json
{
  "event_type": "custom_agent_created",
  "timestamp": "2026-04-16T14:45:00Z",
  "data": {
    "agent_id": "uuid",
    "project_id": "uuid",
    "name": "MyCustomAgent",
    "prompt": "You are a..."
  }
}
```

---

## Integration Steps for Team-Studio

### Step 1: Add Orchestrator Event Endpoint (Express)

In `server/routes/events.js`:

```javascript
router.post('/orchestrator/events', async (req, res) => {
  const event = req.body;
  
  try {
    // Send event to Orchestrator
    const response = await fetch('http://localhost:8001/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Orchestrator rejected event' 
      });
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Step 2: Emit Event on Session Output

In `server/services/chatting.js` (existing):

```javascript
// After LLM response generated
const event = {
  event_type: 'output_generated',
  timestamp: new Date().toISOString(),
  data: {
    session_id: sessionId,
    project_id: projectId,
    content: llmResponse,
    agent_id: agentId,
    metadata: {
      model: 'gpt-4',
      tokens: tokenCount
    }
  }
};

// Post to orchestrator
await fetch('http://localhost:3001/api/orchestrator/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(event)
});
```

### Step 3: NO Direct Vault Access

**DO NOT** add code like:
```javascript
// ❌ WRONG
const vaultPath = '/vault/projects/' + projectId;
fs.writeFileSync(vaultPath, content);
```

**MUST** use orchestrator event:
```javascript
// ✅ CORRECT
await fetch('http://localhost:3001/api/orchestrator/events', {
  method: 'POST',
  body: JSON.stringify({
    event_type: 'output_generated',
    data: { ... }
  })
});
```

---

## Orchestrator Event Handler (Rust)

**Endpoint**: `POST /api/events`

**Handler Logic**:
1. Parse event JSON
2. Validate event type + required fields
3. Extract data
4. Route to appropriate handler
5. Persist to Vault
6. Return success/error

**Implementation** (Rust):

```rust
pub async fn handle_event(
    State(state): State<Arc<AppState>>,
    Json(event): Json<Event>,
) -> Result<Json<EventResponse>, (StatusCode, Json<ErrorResponse>)> {
    match event.event_type.as_str() {
        "output_generated" => handle_output_generated(&state, event.data).await,
        "session_created" => handle_session_created(&state, event.data).await,
        "project_updated" => handle_project_updated(&state, event.data).await,
        _ => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new("Unknown event type".to_string())),
        )),
    }
}

async fn handle_output_generated(
    state: &AppState,
    data: serde_json::Value,
) -> Result<Json<EventResponse>, (StatusCode, Json<ErrorResponse>)> {
    let session_id = data.get("session_id")
        .and_then(|v| v.as_str())
        .ok_or((StatusCode::BAD_REQUEST, Json(ErrorResponse::new("Missing session_id".into()))))?;

    let project_id = data.get("project_id")
        .and_then(|v| v.as_str())
        .ok_or((StatusCode::BAD_REQUEST, Json(ErrorResponse::new("Missing project_id".into()))))?;

    let content = data.get("content")
        .and_then(|v| v.as_str())
        .ok_or((StatusCode::BAD_REQUEST, Json(ErrorResponse::new("Missing content".into()))))?;

    // Write to Vault
    let vault_path = format!("outputs/{}/{}.md", project_id, session_id);
    
    match state.vault.write_file(
        &vault_path,
        content,
        "output".to_string(),
        Some("Team-Studio Output".to_string()),
    ).await {
        Ok(file_id) => Ok(Json(EventResponse {
            success: true,
            file_id: Some(file_id),
            message: "Output persisted".to_string(),
        })),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new(e.to_string())),
        )),
    }
}
```

---

## Vault Directory Structure After Integration

```
vault/
├── projects/
│   └── {project_uuid}/
│       ├── context.md (from Team-Studio project)
│       ├── sessions.json (session metadata)
│       └── notes/
├── outputs/
│   └── {project_uuid}/
│       └── {session_uuid}.md (generated by Team-Studio)
└── logs/
    └── events.json (event log)
```

---

## Testing the Integration

### 1. Start Orchestrator
```bash
cd /home/devdipper/dev/APP/001-APP-MyTeamHub/orchestrator
cargo run
# Listening on http://127.0.0.1:8001
```

### 2. Test Event POST (curl)
```bash
curl -X POST http://localhost:8001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "output_generated",
    "timestamp": "2026-04-16T14:30:00Z",
    "data": {
      "session_id": "sess-123",
      "project_id": "proj-456",
      "content": "# Test Output",
      "agent_id": "collaborator",
      "metadata": { "model": "gpt-4", "tokens": 100 }
    }
  }'
```

### 3. Verify Vault File Created
```bash
cat vault/outputs/proj-456/sess-123.md
```

### 4. Read via Vault API
```bash
curl http://localhost:8001/api/vault/file/outputs/proj-456/sess-123.md
```

---

## Minimal Safeguards (Post Phase 1.3)

### 1. Input Validation

Each event handler validates required fields before Vault writes:

```rust
// Minimal validation: ensure non-empty
if !validate_not_empty(&session_id, "session_id")
    || !validate_not_empty(&project_id, "project_id")
    || !validate_not_empty(&content, "content") {
    return Err((
        StatusCode::BAD_REQUEST,
        Json(ErrorResponse::new("Fields cannot be empty".to_string())),
    ));
}
```

**Policy**: 
- ✅ No empty project_id, session_id, content, agent_id
- ✅ Basic string trimming check
- ❌ No complex validation schemas (MVP)

### 2. Event Logging

All events logged to `/vault/system/events.log`:

**Format**: `timestamp | event_type | status | details`

```
2026-04-16T14:30:00Z | output_generated | success | 
2026-04-16T14:35:00Z | session_created | success | 
2026-04-16T14:40:00Z | unknown_event | error | Unknown event type
```

**Implementation**:
- Append-only file in Vault
- Simple timestamped entries
- Purpose: debug and audit trail

### 3. Dispatcher Security

Main `handle_event()` rejects unknown event types:

```rust
_ => {
    log_event(&state, &event.event_type, "error", "Unknown event type").await;
    return Err((
        StatusCode::BAD_REQUEST,
        Json(ErrorResponse::new(format!("Unknown event type: {}", event.event_type))),
    ));
}
```

**Known event types**:
- ✅ output_generated
- ✅ session_created  
- ✅ project_updated
- ✅ custom_agent_created
- ❌ Any other type → 400 Bad Request

---

## Critical Rules (DO NOT BREAK)

- ❌ Team-Studio writes directly to Vault
- ❌ Team-Studio reads vault file system
- ❌ Vault API calls from Team-Studio frontend
- ✅ Team-Studio → Events → Orchestrator → Vault
- ✅ Clients (Desktop/Mobile) → Read from Vault API
- ✅ All data flows through orchestrator

---

## Next Steps

1. **Phase 1.4**: Data Migration Tools
   - Script to migrate existing Team-Studio JSON → Vault format
   - Preserve session history + outputs

2. **Phase 2**: Orchestrator Core
   - Complete event-driven orchestrator
   - Multi-step workflows
   - Agent selection + execution

3. **Phase 3**: Desktop UI
   - Tauri application
   - Connects to Vault API
   - Reads orchestrator events

---

**Status**: ✅ Documented and architecture-locked  
**Next Review**: Phase 1.4 completion
