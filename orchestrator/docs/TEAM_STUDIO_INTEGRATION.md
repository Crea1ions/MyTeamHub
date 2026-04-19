---
id: team-studio-integration
type: architecture
phase: 1.4
status: in-progress
created: 2026-04-17
---

# Phase 1.4: Team-Studio Integration

## Overview

Phase 1.4 connects Team-Studio (Node.js Express backend) to the Rust Orchestrator via event forwarding middleware. All Team-Studio events flow through the orchestrator to Vault without direct coupling.

---

## Architecture

```
┌──────────────────────────────┐
│ Team-Studio Services         │
│ (chat, context, projects)    │
│                              │
│ const events = require(      │
│   './middleware/...events'   │
│ );                           │
│ events.emit_event({...})     │
└────────────┬─────────────────┘
             │ Emit event
             ↓
┌──────────────────────────────┐
│ Express Middleware           │
│ (/api/orchestrator/events)   │
│                              │
│ Forward to Orchestrator      │
└────────────┬─────────────────┘
             │ HTTP POST
             ↓
┌──────────────────────────────┐
│ Rust Orchestrator            │
│ (port 8001)                  │
│                              │
│ Validate + Route + Persist   │
└────────────┬─────────────────┘
             │ Write
             ↓
┌──────────────────────────────┐
│ Vault (Source of Truth)      │
│                              │
│ Markdown + JSON format       │
└──────────────────────────────┘
```

---

## Implementation

### 1. Middleware: `/server/middleware/orchestrator-events.js`

Exposes two functions for emitting events:

#### Callback-based
```javascript
const { emit_event } = require('./middleware/orchestrator-events');

emit_event({
  event_type: 'output_generated',
  data: {
    project_id: 'proj-123',
    session_id: 'sess-456',
    content: '# Output'
  }
}, (err, response) => {
  if (err) console.error('Event failed:', err);
  else console.log('Event persisted:', response.file_id);
});
```

#### Promise-based
```javascript
const { emit_event_async } = require('./middleware/orchestrator-events');

const response = await emit_event_async({
  event_type: 'session_created',
  data: { ... }
});
```

**Features**:
- Automatic timestamp generation (ISO8601)
- Connection error handling
- Configurable orchestrator host/port (env vars)
- Validates event structure before sending

**Configuration** (via .env):
```
ORCHESTRATOR_HOST=127.0.0.1
ORCHESTRATOR_PORT=8001
```

---

### 2. Route: `/server/routes/orchestrator.js`

Exposes Express endpoint:

```
POST /api/orchestrator/events
```

**Request**:
```json
{
  "event_type": "output_generated",
  "data": {
    "project_id": "proj-123",
    "session_id": "sess-456",
    "content": "# LLM Output",
    "agent_id": "collaborator"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "file_id": "uuid",
  "message": "Output persisted to Vault: outputs/proj-123/sess-456.md"
}
```

**Error Response** (4xx/5xx):
```json
{
  "success": false,
  "error": "Description of error"
}
```

**Status Codes**:
- `200 OK` - Event persisted successfully
- `400 Bad Request` - Invalid event structure or missing fields
- `503 Service Unavailable` - Cannot reach Orchestrator

---

### 3. Integration in Express App

Added route to `/server/index.js`:

```javascript
app.use('/api/orchestrator', require('./routes/orchestrator'));
```

Now available at:
```
POST http://127.0.0.1:3001/api/orchestrator/events
```

---

## Using in Team-Studio Services

### Example: Emit event after chat completion

In `/server/routes/chat.js` or any service:

```javascript
const { emit_event_async } = require('../middleware/orchestrator-events');

// After LLM generates output
const output = await callModel(prompt);

// Emit to Orchestrator
try {
  const result = await emit_event_async({
    event_type: 'output_generated',
    data: {
      project_id: projectId,
      session_id: sessionId,
      content: output,
      agent_id: agentName
    }
  });
  console.log('Output persisted:', result.file_id);
} catch (err) {
  console.error('Failed to emit event:', err.message);
  // Optionally fallback to local storage or queue
}
```

---

## Supported Event Types

### 1. `output_generated`
LLM or agent generated content

**Required fields**:
- `project_id`: UUID of project
- `session_id`: UUID of session
- `content`: Markdown content string
- `agent_id` (optional): Agent name or ID

**Persists to**: `vault/outputs/{project_id}/{session_id}.md`

### 2. `session_created`
New session created

**Required fields**:
- `project_id`: UUID
- `session_id`: UUID
- `title` (optional): Session title

**Persists to**: `vault/projects/{project_id}/sessions.json` (logged)

### 3. `project_updated`
Project context or metadata changed

**Required fields**:
- `project_id`: UUID
- `context`: Markdown content

**Persists to**: `vault/projects/{project_id}/context.md`

### 4. `custom_agent_created`
Custom LLM agent defined in project

**Required fields**:
- `agent_id`: Unique agent ID
- `project_id`: UUID
- `name`: Display name
- `prompt`: System prompt for agent

**Persists to**: `vault/agents/{agent_id}.md`

---

## Data Flow Example

### Scenario: User generates chat output in Team-Studio

```
1. User clicks "Generate" in UI
   ↓
2. Team-Studio chat.js calls LLM
   ↓
3. LLM returns output
   ↓
4. chat.js emits event:
   emit_event_async({
     event_type: 'output_generated',
     data: {
       project_id: req.body.projectId,
       session_id: req.body.sessionId,
       content: llmOutput
     }
   })
   ↓
5. Orchestrator middleware POST to Rust
   ↓
6. Rust validates + writes to Vault
   ↓
7. Response returned:
   { success: true, file_id: "..." }
   ↓
8. Desktop client later reads from Vault API:
   GET /vault/file/outputs/{project_id}/{session_id}.md
```

---

## Error Handling Strategy

### Soft Failures (Log & Continue)

If Orchestrator is unreachable:
```javascript
try {
  await emit_event_async(event);
} catch (err) {
  console.error('Orchestrator offline:', err.message);
  // Optionally store event locally for replay
}
```

### Critical Events

For events essential to data integrity (session creation), consider:
```javascript
const result = await emit_event_async(event);
if (!result.success) {
  // Save to local queue for retry
  saveEventToQueue(event);
}
```

---

## Testing

### Prerequisites
- Rust Orchestrator running: `cd orchestrator && cargo run`
- Team-Studio Express server running: `cd server && npm start`

### Test 1: Direct Orchestrator Call (curl)

```bash
curl -X POST http://localhost:8001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "output_generated",
    "timestamp": "2026-04-17T10:00:00Z",
    "data": {
      "session_id": "test-sess-001",
      "project_id": "test-proj-001",
      "content": "# Test Output"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Output persisted to Vault: outputs/test-proj-001/test-sess-001.md"
}
```

### Test 2: Via Team-Studio Express

```bash
curl -X POST http://localhost:3001/api/orchestrator/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "output_generated",
    "data": {
      "project_id": "test-proj-001",
      "session_id": "test-sess-002",
      "content": "# Via Team-Studio"
    }
  }'
```

### Test 3: Verify Vault File Created

```bash
cat orchestrator/vault/outputs/test-proj-001/test-sess-002.md
```

Expected output (Markdown with frontmatter):
```markdown
---
id: 550e8400-e29b-41d4-a716-446655440000
type: output
created: 2026-04-17T10:05:00Z
updated: 2026-04-17T10:05:00Z
title: Team-Studio LLM Output
---

# Via Team-Studio
```

---

## Critical Rules (Enforce)

✅ **ALLOWED**:
- Team-Studio → Express endpoint → Orchestrator
- Orchestrator → Vault writes (deterministic routing)
- Vault API ← Desktop/Mobile clients (read-only)
- Event logging to `/vault/system/events.log`

❌ **FORBIDDEN**:
- Team-Studio directly writes Vault files
- Team-Studio reads Vault filesystem
- Orchestrator makes decisions (LLM calls, agent selection)
- Agents sourced from Vault (static config only)

---

## Status

**Phase 1.4**: In Progress
- ✅ Middleware created (`orchestrator-events.js`)
- ✅ Route created (`orchestrator.js`)
- ✅ Integration in Express app
- 🔄 Next: Data migration tools (Phase 1.4 continued)
- 🔄 Then: End-to-end testing

**Next Review**: Phase 1.4 completion + Phase 1 verification
