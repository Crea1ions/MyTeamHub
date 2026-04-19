---
id: phase-2-sprint-2_1
type: sprint-plan
phase: 2
subphase: 2.1
status: in-progress
sprint: "Event-Driven System Engine"
date: 2026-04-17
---

# 🚀 Phase 2.1 — Event-Driven System Engine

## 🎯 Objectif

Transformer l'orchestrateur actuel (simple router d'événements) en un **système déterministe multi-étapes** capable d'orchestrer des workflows complexes sans être cognitif.

**Contrainte clé**: NON intelligent. Juste du routage de règles + gestion d'état.

---

## 📋 Architecture

### Couches

```
┌─────────────────────────────────────────┐
│     Team-Studio / External Sources      │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   Event Dispatcher (Phase 1.3 actuel)   │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   State Machine (NOUVEAU - Phase 2.1)   │  ← Orchestration déterministe
├─────────────────────────────────────────┤
│ - Workflow definition                   │
│ - State transitions                     │
│ - Rule engine                           │
│ - Context passing                       │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   Vault I/O (Phase 1.1)                 │
│   REST API (Phase 1.2)                  │
│   Event Logging (Phase 1.3)             │
└─────────────────────────────────────────┘
```

### Flow: Event → State Machine → Vault

```
1. Event arrives (output_generated, session_created, etc.)
2. Extract context (project_id, session_id, etc.)
3. Current state lookup in StateManager
4. Evaluate transition rules
5. Execute action (Vault write, agent trigger, etc.)
6. Update state
7. Log transition
```

---

## 🏗️ Composants à Créer

### 1. **state_machine.rs** (Core)

Définit les états, transitions, et règles déterministes.

```rust
// Workflow states
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum WorkflowState {
    Idle,
    Processing,
    WaitingForAgent,
    Complete,
    Error,
}

// Transition rules
#[derive(Debug, Clone)]
pub struct TransitionRule {
    from_state: WorkflowState,
    event_type: String,
    condition: Box<dyn Fn(&WorkflowContext) -> bool>, // Predicate
    to_state: WorkflowState,
    action: String, // "write_vault", "trigger_agent", "log_error"
}

// Workflow context (passed through system)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowContext {
    workflow_id: String,
    state: WorkflowState,
    event_data: serde_json::Value,
    vault_file_id: Option<String>,
    last_transition: chrono::DateTime<chrono::Utc>,
}

// State machine manager
pub struct StateMachine {
    rules: Vec<TransitionRule>,
    contexts: Arc<RwLock<HashMap<String, WorkflowContext>>>,
}

impl StateMachine {
    pub async fn process_event(
        &self,
        workflow_id: &str,
        event: &Event,
        vault: &VaultManager,
    ) -> Result<WorkflowContext, StateMachineError>;
    
    pub async fn get_context(&self, workflow_id: &str) -> Result<WorkflowContext>;
    
    pub async fn update_state(&self, workflow_id: &str, new_state: WorkflowState);
}
```

### 2. **workflow.rs** (Workflow Definitions)

Définit les workflows concrets (ex: "output_generation_workflow").

```rust
#[derive(Debug, Clone)]
pub struct WorkflowDefinition {
    id: String,
    name: String,
    initial_state: WorkflowState,
    rules: Vec<TransitionRule>,
}

// Pre-built workflows
pub mod workflows {
    pub fn output_generation_workflow() -> WorkflowDefinition {
        // State: Idle → Processing → Complete
        // Triggers: output_generated event
        // Action: Write to Vault + log
    }
    
    pub fn session_workflow() -> WorkflowDefinition {
        // Session creation flow
    }
    
    pub fn custom_agent_workflow() -> WorkflowDefinition {
        // Agent provisioning flow
    }
}
```

### 3. **rules_engine.rs** (Rule Evaluation)

Évalue les prédicats de transition de manière déterministe.

```rust
pub struct RulesEngine {
    rules: Vec<(String, Box<dyn Fn(&WorkflowContext) -> bool>)>,
}

impl RulesEngine {
    pub fn evaluate_rule(&self, rule_name: &str, context: &WorkflowContext) -> bool;
    
    pub fn find_valid_transition(
        &self,
        current_state: WorkflowState,
        event_type: &str,
        context: &WorkflowContext,
    ) -> Option<TransitionRule>;
}

// Example built-in rules
pub mod rules {
    pub fn has_project_id(ctx: &WorkflowContext) -> bool {
        ctx.event_data.get("project_id").is_some()
    }
    
    pub fn has_content(ctx: &WorkflowContext) -> bool {
        ctx.event_data.get("content").is_some() 
            && !ctx.event_data["content"].as_str().unwrap_or("").is_empty()
    }
}
```

### 4. **orchestrator_engine.rs** (Integration Point)

Intègre State Machine dans l'orchestrateur existant.

```rust
pub struct OrchestratorEngine {
    state_machine: Arc<StateMachine>,
    vault: Arc<VaultManager>,
    rules_engine: Arc<RulesEngine>,
}

impl OrchestratorEngine {
    pub async fn handle_event_with_state(
        &self,
        event: &Event,
    ) -> Result<EventResponse, OrchestratorError>;
    
    pub async fn get_workflow_status(&self, workflow_id: &str) -> Result<WorkflowContext>;
}
```

### 5. **state_manager.rs** (Persistence)

Persiste les états de workflows dans Vault.

```rust
pub struct StateManager {
    vault: Arc<VaultManager>,
}

impl StateManager {
    pub async fn save_context(&self, context: &WorkflowContext) -> Result<()>;
    pub async fn load_context(&self, workflow_id: &str) -> Result<WorkflowContext>;
    pub async fn list_active_workflows(&self) -> Result<Vec<WorkflowContext>>;
}
```

---

## 📝 Implementation Plan

### Step 1: Create Core State Machine (80 lines)
- [ ] Define `WorkflowState` enum
- [ ] Define `TransitionRule` struct
- [ ] Define `WorkflowContext` struct
- [ ] Implement `StateMachine` struct with state tracking

**File**: `src/orchestrator/state_machine.rs`

### Step 2: Create Workflow Definitions (100 lines)
- [ ] Define `WorkflowDefinition` struct
- [ ] Create `output_generation_workflow()`
- [ ] Create `session_workflow()`
- [ ] Create `custom_agent_workflow()`

**File**: `src/orchestrator/workflow.rs`

### Step 3: Create Rules Engine (70 lines)
- [ ] Define `RulesEngine` struct
- [ ] Implement `evaluate_rule()` method
- [ ] Implement `find_valid_transition()` method
- [ ] Create built-in rules module (has_project_id, has_content, etc.)

**File**: `src/orchestrator/rules_engine.rs`

### Step 4: Create State Manager (60 lines)
- [ ] Define `StateManager` struct
- [ ] Implement Vault persistence
- [ ] Load/save context methods

**File**: `src/orchestrator/state_manager.rs`

### Step 5: Integrate into Orchestrator Engine (120 lines)
- [ ] Create `OrchestratorEngine` wrapper
- [ ] Update event handlers to use State Machine
- [ ] Add workflow status endpoint
- [ ] Update event routing logic

**File**: `src/orchestrator/orchestrator_engine.rs`

### Step 6: Add Module Exports
- [ ] Update `src/orchestrator/mod.rs`
- [ ] Export all public types and functions

### Step 7: Create Tests
- [ ] Unit tests for state transitions
- [ ] Integration tests for full workflows
- [ ] Rule engine tests

**File**: `src/orchestrator/tests.rs`

### Step 8: Build & Verify
- [ ] `cargo check` clean
- [ ] `cargo build` successful
- [ ] `cargo test` all passing
- [ ] Release build optimized

---

## 🎯 Success Criteria

✅ **Compilation**: `cargo build --release` clean, no warnings  
✅ **Tests**: All new tests passing (target: 95%+ coverage)  
✅ **Transitions**: State machine correctly routes 4 event types  
✅ **Persistence**: Workflow contexts saved/loaded from Vault  
✅ **Performance**: State lookup <50ms, transition <100ms  
✅ **Deterministic**: No randomness, all rules evaluated consistently  

---

## 🔍 Key Design Decisions

### 1. **NOT Cognitive**
- No LLM calls
- No dynamic decision-making
- Pure rule-based routing

### 2. **Deterministic**
- Same input = same output always
- Reproducible state transitions
- Audit trail in event log

### 3. **Stateful**
- Workflows persist state in Vault
- Can resume interrupted workflows
- Can inspect workflow history

### 4. **Extensible**
- New workflows via `WorkflowDefinition`
- New rules via `RulesEngine`
- New actions via handlers

---

## 📚 Related Files

**Existing** (unchanged):
- `src/orchestrator/events.rs` — Event struct
- `src/orchestrator/handlers.rs` — Event handlers (will be enhanced)
- `src/vault/` — Vault I/O (used for state persistence)
- `src/api/` — REST endpoints (will add status endpoint)

**To Create** (this sprint):
- `src/orchestrator/state_machine.rs`
- `src/orchestrator/workflow.rs`
- `src/orchestrator/rules_engine.rs`
- `src/orchestrator/state_manager.rs`
- `src/orchestrator/orchestrator_engine.rs`

---

## ⏱️ Timeline Estimate

| Task | Est. Time | Status |
|------|-----------|--------|
| State Machine core | 30 min | ⏳ |
| Workflow definitions | 20 min | ⏳ |
| Rules engine | 25 min | ⏳ |
| State manager | 20 min | ⏳ |
| Integration | 30 min | ⏳ |
| Tests | 30 min | ⏳ |
| Build + verification | 15 min | ⏳ |
| **Total** | **~2.5 hours** | ⏳ |

---

## ✅ Handoff Requirements

At end of Phase 2.1, deliver:

1. ✅ **Code**: 5 new modules + 1 updated mod.rs
2. ✅ **Tests**: 20+ test cases (unit + integration)
3. ✅ **Documentation**: PHASE_2_1_COMPLETION.md with full runbook
4. ✅ **Build**: Clean release build, <2s startup time
5. ✅ **Verification**: Integration test showing state machine in action

---

**Phase 2.1 Sponsor**: Event-driven system = foundation for Phase 2.2 (Agent Execution) and 2.3 (Modal Layer)

**Next**: Phase 2.2 builds agent execution on top of this state machine.

