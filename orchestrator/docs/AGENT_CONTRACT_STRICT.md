---
id: agent-interface-design
type: design-notes
phase: 2.2
status: active
date: 2026-04-17
---

# 📋 Agent Interface — Design Guide (Phase 2.2)

## Overview

This describes how agents interact with the orchestrator.
Agents are execution plugins: receive input, do work, return output.

---

## Agent Input Structure

```rust
pub struct AgentContext {
    pub workflow_id: String,           // Unique workflow ID
    pub task: String,                  // What to execute
    pub event_data: serde_json::Value, // Immutable event data
    pub vault_root: String,            // Vault root path (read/write root)
    pub execution_id: String,          // Unique execution ID
    pub timeout_secs: u64,             // Execution timeout
}
```

### Guarantees

✅ **immutable**: Context cannot be modified by agent  
✅ **isolated**: Each agent execution gets fresh context  
✅ **bounded**: timeout_secs enforced by runtime  
✅ **scoped**: vault_root limits file access  

### Example

```json
{
  "workflow_id": "wf_abc123",
  "task": "analyze_output",
  "event_data": {
    "project_id": "proj1",
    "session_id": "sess1",
    "content": "The quick brown fox..."
  },
  "vault_root": "/vault",
  "execution_id": "exec_xyz789",
  "timeout_secs": 30
}
```

---

## 📤 Agent Output (REQUIRED)

### AgentOutput Structure

```rust
pub struct AgentOutput {
    pub success: bool,                          // Execution successful?
    pub result: serde_json::Value,              // Execution result
    pub metadata: AgentMetadata,                // Execution metrics
    pub vault_writes: Vec<VaultWriteRecord>,   // Files written
    pub logs: Option<Vec<String>>,              // Optional logs
}

pub struct AgentMetadata {
    pub duration_ms: u64,
    pub status: String,        // "success", "error", "timeout"
    pub error_message: Option<String>,
}

pub struct VaultWriteRecord {
    pub path: String,
    pub file_id: String,
    pub size_bytes: usize,
}
```

### Requirements

✅ **result**: Valid JSON (can be any structure)  
✅ **metadata**: Must include duration_ms, status  
✅ **vault_writes**: List of files written (for audit)  
✅ **logs**: Optional, for debugging only  

### Example

```json
{
  "success": true,
  "result": {
    "analysis": "Positive sentiment",
    "confidence": 0.87,
    "keywords": ["fox", "quick", "brown"]
  },
  "metadata": {
    "duration_ms": 245,
    "status": "success",
    "error_message": null
  },
  "vault_writes": [
    {
      "path": "outputs/proj1/analysis.md",
      "file_id": "file_abc123",
      "size_bytes": 1024
    }
  ],
  "logs": [
    "Starting analysis...",
    "Processed 100 tokens",
    "Complete"
  ]
}
```

---

## ⚠️ Agent Design Considerations

### Key Design Principles

These are not hard blocks at Phase 2 — they're design principles to keep agents simple, isolated, and maintainable.

---

### 1. Keep State Transitions Orchestrator-Owned

```rust
// Good: Agent returns result
Ok(AgentOutput { success: true, result: json!(...) })

// Anti-pattern: Agent tries to modify state
context.current_state = WorkflowState::Complete;  // Don't do this
```

**Why**: State machine logic lives in orchestrator, not agents. Agents are workers, not controllers.

---

### 2. Agents Are Isolated Executors

```rust
// Good: Single agent does its job
agent.execute(&context).await?

// Anti-pattern: Agent tries to call other agents
agent_registry.get("other").execute(...)?  // Don't coordinate agents
```

**Why**: Coordination happens in orchestrator via events, not agent chaining.

---

### 3. Vault Access Is Sandboxed to vault_root

```rust
// Good: Write within vault_root
vault.write_file("outputs/proj1/result.md", ...)?

// Anti-pattern: Write anywhere on filesystem
std::fs::write("/etc/config", "...");  // Don't escape sandbox
```

**Why**: Vault is the source of truth. Everything goes through it.

---

### 4. Secrets/Credentials Not Accessible

```rust
// Good: Work with data passed in AgentContext
let project_id = context.event_data["project_id"].as_str();

// Anti-pattern: Try to read credentials
std::env::var("DATABASE_PASSWORD");  // Don't do this
```

**Why**: Agents are untrusted executables. No access to system secrets.

---

### 5. Event Model Is Immutable

```rust
// Good: Read from event_data
let content = context.event_data["content"].as_str();

// Anti-pattern: Try to modify event
event.data.insert("injected", "data");  // Event is read-only
```

**Why**: Event integrity is crucial. Modifications happen via new events, not mutation.

---

### 6. Runtime Configuration Is Locked

```rust
// Good: Respect timeout_secs
if elapsed > context.timeout_secs {
    return Err("Timeout");
}

// Anti-pattern: Change runtime limits
timeout_secs = 3600;  // Don't override
```

**Why**: Orchestrator manages execution resources.

---

### 7. Network Calls Optional, Must Be Declared

```rust
// Good: Explicitly declare if needed
// In agent definition: network_enabled = true
// Then HTTP calls are OK

// Anti-pattern: Make network calls without declaration
reqwest::Client::new().get("http://...").await;  // Declare first
```

**Why**: Network access is a system capability, not implicit.

---

### 8. Subprocesses Not Available

```rust
// Good: Do work in Rust
let result = process_data(input);

// Anti-pattern: Spawn external processes
std::process::Command::new("rm").spawn();  // Don't do this
```

**Why**: Prevents system-level accidents and security issues.

---

### What Agents CAN Do

```rust
// ✅ Read context (immutable)
let workflow_id = context.workflow_id.clone();
let data = &context.event_data;

// ✅ Return structured result
Ok(AgentOutput {
    success: true,
    result: json!({ ... }),
    ...
})

// ✅ Write logs
output.logs.push("Debug info".into());
```

---

## 🏗️ Agent Implementation Pattern

### Basic Trait

```rust
pub trait Agent: Send + Sync {
    async fn execute(&self, context: AgentContext) -> Result<AgentOutput, AgentError>;
}
```

### Example: Simple Analysis Agent

```rust
pub struct AnalysisAgent;

#[async_trait]
impl Agent for AnalysisAgent {
    async fn execute(
        &self,
        context: AgentContext,
    ) -> Result<AgentOutput, AgentError> {
        let start = std::time::Instant::now();
        
        // ✅ Read context (immutable)
        let content = context.event_data["content"]
            .as_str()
            .ok_or(AgentError::MissingField)?;
        
        // ✅ Perform analysis
        let analysis = format!("Analyzed: {} chars", content.len());
        
        // ✅ Return structured output
        Ok(AgentOutput {
            success: true,
            result: json!({
                "analysis": analysis,
                "confidence": 0.85
            }),
            metadata: AgentMetadata {
                duration_ms: start.elapsed().as_millis() as u64,
                status: "success".into(),
                error_message: None,
            },
            vault_writes: vec![],
            logs: Some(vec!["Analysis complete".into()]),
        })
    }
}
```

---

## Testing Checklist

Every agent should pass:

- [ ] Happy path execution
- [ ] Error handling
- [ ] Timeout behavior
- [ ] Vault isolation (can't write outside vault_root)
- [ ] State isolation (doesn't modify orchestrator state)
- [ ] No credential access
- [ ] Logs/metrics working

---

## Integration

Agents integrate into OrchestratorEngine like this:

```
Event
  → OrchestratorEngine.handle_event()
    → StateMachine.process_event()
      → AgentRegistry.get(agent_id)
        → Agent.execute(context)
          → AgentOutput
    → StateManager.save_context()
    → Vault.write_file() (if agent wrote files)
```

---

## Why This Design

### Simple
- 1 trait
- 2 structs (AgentContext, AgentOutput)
- Clear input/output

### Clear
- Immutable input
- Structured output
- Explicit dependencies

### Extensible
- Phase 2: Basic execution
- Phase 3: Signing, versioning, formal enforcement
- Phase 4: Network/process capabilities

---

**Status**: 📋 Design Guide (pragmatic, non-blocking)  
**Implementation**: Phase 2.2 starts with this pattern  
**Extension**: Phase 3 RFC for additional capabilities  
**Enforcement**: Code review for now, formal runtime checks in Phase 3+  
