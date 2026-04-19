---
id: state-machine-design
type: design-notes
phase: 2
status: active
date: 2026-04-17
---

# 📋 State Machine — Design Notes

## Overview

This document describes the **Phase 2.1 state machine** foundation.
These patterns work well. Phase 3 can extend if needed.

---

## State Machine Design (Phase 2.1)

### States (Immutable)

```rust
pub enum WorkflowState {
    Idle,              // Initial state
    Processing,        // Executing action
    WaitingForAgent,   // Waiting for external result
    Complete,          // Successful completion
    Error,             // Failed or error state
}
```

**Invariant**: Only these 5 states exist. No additions until Phase 3.

---

### Transitions (Baseline)

#### Workflow 1: Output Generation

```
Idle → (output_generated) → Processing → (process_complete) → Complete
       ↓
       Error (on process_error)
```

**Action**: `write_vault`  
**Target**: `outputs/{project_id}/{session_id}.md`  
**Atomic**: Yes (or full rollback)

---

#### Workflow 2: Session Creation

```
Idle → (session_created) → Processing → (index_complete) → Complete
       ↓
       Error (on index_error)
```

**Action**: `index_metadata`  
**Target**: `projects/{project_id}/sessions.json`  
**Atomic**: Yes (or full rollback)

---

#### Workflow 3: Project Update

```
Idle → (project_updated) → Processing → (update_complete) → Complete
       ↓
       Error (on update_error)
```

**Action**: `update_context`  
**Target**: `projects/{project_id}/context.md`  
**Atomic**: Yes (or full rollback)

---

#### Workflow 4: Custom Agent Creation

```
Idle → (custom_agent_created) → Processing
       ↓                        (agent_ready) ↓
       Error                    WaitingForAgent
                                (initialization_complete) ↓
                                Complete
```

**Action**: `provision_agent`  
**Target**: `agents/{agent_id}.md`  
**Atomic**: No (multi-step, stateful)

---

## 🔐 Guarantees (MUST HOLD)

### 1. Determinism

**Guarantee**: Same (workflow_id, event_type, current_state) → Same transition

```rust
// MUST be deterministic
if current_state == Idle && event_type == "output_generated" {
    // ALWAYS transition to Processing
    // ALWAYS execute write_vault action
}
```

**Verification**: No randomness, no time-dependent behavior, no network calls

---

### 2. Atomicity

**Guarantee**: State transition + Vault write = atomic operation

```
1. Find transition rule (in-memory)
2. Validate predicates (in-memory)
3. Execute action (Vault write)
4. Persist new state (Vault write)
5. Log transition (Vault append)
[All succeed or all fail]
```

**If failure**: Rollback = return error, state unchanged

---

### 3. Idempotence

**Guarantee**: Processing same event twice = same result

```rust
// Scenario: Event processed, then replayed by accident
process_event(workflow_1, output_generated)  // First time
// ... Later: replay
process_event(workflow_1, output_generated)  // Second time
// Result: SAME state, no duplicate writes
```

**Mechanism**: Workflow ID + event type + current state = primary key

---

### 4. No Cross-Workflow Contamination

**Guarantee**: Each workflow's state is isolated

```rust
// No shared state between workflows
workflow_1.state ≠ workflow_2.state  // Always
// No side effects
process_event(workflow_1, ...) → no change to workflow_2
```

---

### 5. Persistence Durability

**Guarantee**: State persisted to Vault survives crashes

```
State Update Sequence:
1. Write to Vault: `system/workflows/{id}.json`
2. Sync to disk: `sync_all()`
3. Return success
[If 1 or 2 fails → return error, no update]
```

---

## 📋 Rule Engine Baseline

### Built-in Rules (Locked)

```rust
has_project_id()           // Non-empty project_id
has_content()              // Non-empty content
has_session_id()           // Non-empty session_id
has_agent_id()             // Non-empty agent_id
has_title()                // Non-empty title
is_valid_json()            // Pre-validated (always true)
transition_count_ok()      // < 100 (loop prevention)
```

**Invariant**: No new rules until Phase 3. Use existing rules.

---

### Rule Evaluation (Deterministic)

```rust
// MUST be deterministic
pub fn evaluate_rule(rule_name: &str, context: &WorkflowContext) -> bool {
    // Same input → Same output
    // No side effects
    // <10ms execution
}
```

---

## 🚫 What is FORBIDDEN (Phase 2.1 - 2.4)

❌ Adding new states (Phase 3+)  
❌ Adding new transitions (Phase 3+)  
❌ Modifying rule evaluation logic (Phase 3+)  
❌ Changing atomic boundaries (Phase 3+)  
❌ Introducing shared state (Phase 3+)  

---

## ✅ What CAN Change (Within Phase 2)

✅ Add new workflows using existing states + transitions  
✅ Add new events if they fit existing 4 types  
✅ Optimize performance (no behavior change)  
✅ Improve logging (no logic change)  
✅ Bug fixes (critical only, with tests)  

---

## 🔍 Verification Checklist

- [x] 5 states locked
- [x] 4 workflows locked
- [x] 7 rules locked
- [x] Determinism guaranteed
- [x] Atomicity guaranteed
- [x] Idempotence guaranteed
- [x] Isolation guaranteed
- [x] Durability guaranteed

---

## Phase 2.2 Implication (Critical)

Phase 2.2 (Agent Execution) **must work WITH these guarantees**, not against them:

✅ Agents cannot change state machine  
✅ Agents cannot add new transitions  
✅ Agents cannot modify rules  
✅ Agents are plugins to state machine, not equal partners  

---

## Phase 2.3 Implication

Phase 2.3 (Modal Cognitive Layer) **uses this baseline**:

✅ Selects agents based on state + rules  
✅ Routes results through existing transitions  
✅ Maintains all 5 guarantees  

---

## Rationale

This baseline prevents:
- ✅ System-level instability
- ✅ Hidden dependencies
- ✅ Complex edge cases
- ✅ Uncontrolled state explosion

Until Phase 3, state machine is a **stable foundation**, not a moving target.

---

**Status**: 🔒 LOCKED (Phase 2.1 - 2.4)  
**Enforcement**: Code review + architectural review  
**Override**: Phase 3 RFC + security review required  
