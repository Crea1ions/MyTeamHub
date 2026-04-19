---
id: phase-2-sprint-2_2
type: sprint-plan
phase: 2
subphase: 2.2
status: planning
sprint: "Agent Execution Engine"
date: 2026-04-17
---

# 🚀 Phase 2.2 — Agent Execution Engine

## 🎯 Objectif

Build the agent execution framework that runs on top of Phase 2.1's state machine. Agents execute with isolated contexts, interact with Vault, and report results back through state transitions.

**Core Constraint**: Agents are plugins to OrchestratorEngine, not standalone services.

---

## 📋 Architecture

### Integration with Phase 2.1

```
Event → State Machine (Phase 2.1)
  │
  └─→ Trigger Action: "execute_agent"
       │
       └─→ Agent Execution Engine (Phase 2.2) ← NEW
            │
            ├─ Load agent code
            ├─ Pass Vault context
            ├─ Execute in sandbox
            ├─ Write results to Vault
            │
            └─→ Return (success/error)
                 │
                 └─→ State Machine transition → Complete/Error
```

### Agent Interface

```rust
// Agent trait - all agents implement this
pub trait Agent: Send + Sync {
    fn id(&self) -> &str;
    fn name(&self) -> &str;
    fn version(&self) -> &str;
    
    async fn execute(
        &self,
        context: &AgentContext,
        vault: &VaultManager,
    ) -> Result<AgentOutput, AgentError>;
}

// Agent context (passed to agent)
pub struct AgentContext {
    pub workflow_id: String,
    pub event_data: serde_json::Value,
    pub vault_root: String,
    pub execution_id: String,
}

// Agent output
pub struct AgentOutput {
    pub success: bool,
    pub result: serde_json::Value,
    pub vault_writes: Vec<String>, // File IDs written
}
```

---

## 🏗️ Composants à Créer

### 1. **agent.rs** (Traits & Types) - 60 lines

```rust
pub trait Agent: Send + Sync {
    fn id(&self) -> &str;
    fn name(&self) -> &str;
    fn version(&self) -> &str;
    
    async fn execute(
        &self,
        context: &AgentContext,
        vault: &VaultManager,
    ) -> Result<AgentOutput, AgentError>;
}

pub struct AgentContext {
    pub workflow_id: String,
    pub event_data: serde_json::Value,
    pub vault_root: String,
    pub execution_id: String,
}

pub struct AgentOutput {
    pub success: bool,
    pub result: serde_json::Value,
    pub vault_writes: Vec<String>,
}

#[derive(Debug)]
pub enum AgentError {
    ExecutionFailed(String),
    ContextError(String),
    VaultError(String),
    Timeout,
    ResourceExhausted,
}
```

### 2. **execution_engine.rs** (Agent Execution) - 150 lines

```rust
pub struct AgentExecutionEngine {
    vault: Arc<VaultManager>,
    timeout_secs: u64,
    max_memory_mb: u64,
}

impl AgentExecutionEngine {
    pub async fn execute_agent(
        &self,
        agent: &dyn Agent,
        context: &AgentContext,
    ) -> Result<AgentOutput, AgentError>;
    
    pub async fn execute_agent_with_timeout(
        &self,
        agent: &dyn Agent,
        context: &AgentContext,
        timeout_secs: u64,
    ) -> Result<AgentOutput, AgentError>;
}
```

### 3. **builtin_agents.rs** (Pre-built Agents) - 120 lines

Example agents that work with Phase 2.1:

```rust
// Agent 1: EchoAgent - simple test agent
pub struct EchoAgent;

impl Agent for EchoAgent {
    async fn execute(&self, context: &AgentContext, vault: &VaultManager)
        -> Result<AgentOutput, AgentError> {
        // Echo back the input
    }
}

// Agent 2: AnalyzerAgent - analyze event data
pub struct AnalyzerAgent;

impl Agent for AnalyzerAgent {
    async fn execute(&self, context: &AgentContext, vault: &VaultManager)
        -> Result<AgentOutput, AgentError> {
        // Analyze event_data and write summary to Vault
    }
}

// Agent 3: IndexerAgent - index Vault content
pub struct IndexerAgent;

impl Agent for IndexerAgent {
    async fn execute(&self, context: &AgentContext, vault: &VaultManager)
        -> Result<AgentOutput, AgentError> {
        // Scan Vault and update indices
    }
}
```

### 4. **agent_registry.rs** (Agent Management) - 100 lines

```rust
pub struct AgentRegistry {
    agents: HashMap<String, Arc<dyn Agent>>,
}

impl AgentRegistry {
    pub fn new() -> Self;
    
    pub fn register(&mut self, agent: Arc<dyn Agent>);
    
    pub fn get(&self, agent_id: &str) -> Option<Arc<dyn Agent>>;
    
    pub fn list_agents(&self) -> Vec<String>;
}
```

### 5. **agent_state_tracker.rs** (Execution State) - 80 lines

```rust
pub struct AgentExecutionState {
    pub agent_id: String,
    pub workflow_id: String,
    pub status: ExecutionStatus, // Running, Success, Failed, Timeout
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub memory_used_mb: f64,
    pub cpu_time_ms: u64,
}

pub struct ExecutionTracker {
    executions: Arc<RwLock<HashMap<String, AgentExecutionState>>>,
}
```

### 6. **integration.rs** (OrchestratorEngine Integration) - 100 lines

```rust
// Extend OrchestratorEngine to include agent execution

impl OrchestratorEngine {
    pub async fn execute_agent_action(
        &self,
        workflow_id: &str,
        agent_id: &str,
        action: &str,
    ) -> Result<AgentOutput, OrchestratorEngineError>;
}
```

---

## 📝 Implementation Plan

### Step 1: Define Agent Traits (60 lines)
- [ ] Create `agent.rs`
- [ ] Define `Agent` trait
- [ ] Define `AgentContext` struct
- [ ] Define `AgentOutput` struct
- [ ] Define `AgentError` enum

**File**: `src/agents/agent.rs`

### Step 2: Create Execution Engine (150 lines)
- [ ] Create `execution_engine.rs`
- [ ] Implement `AgentExecutionEngine` struct
- [ ] Implement `execute_agent()` with timeout
- [ ] Implement resource tracking
- [ ] Handle errors gracefully

**File**: `src/agents/execution_engine.rs`

### Step 3: Build Pre-built Agents (120 lines)
- [ ] Create `builtin_agents.rs`
- [ ] Implement `EchoAgent`
- [ ] Implement `AnalyzerAgent`
- [ ] Implement `IndexerAgent`
- [ ] Tests for each agent

**File**: `src/agents/builtin_agents.rs`

### Step 4: Create Agent Registry (100 lines)
- [ ] Create `agent_registry.rs`
- [ ] Implement `AgentRegistry` struct
- [ ] Register/retrieve agents
- [ ] List available agents

**File**: `src/agents/agent_registry.rs`

### Step 5: Track Execution State (80 lines)
- [ ] Create `agent_state_tracker.rs`
- [ ] Implement `AgentExecutionState`
- [ ] Implement `ExecutionTracker`
- [ ] Log execution metrics

**File**: `src/agents/agent_state_tracker.rs`

### Step 6: Integrate with OrchestratorEngine (100 lines)
- [ ] Update `orchestrator_engine.rs`
- [ ] Add `execute_agent_action()` method
- [ ] Connect to AgentRegistry
- [ ] Handle state transitions

### Step 7: Create Module Exports
- [ ] Create `src/agents/mod.rs`
- [ ] Export all public types
- [ ] Update `src/lib.rs` to include agents module

### Step 8: Add Tests
- [ ] Unit tests for Agent trait
- [ ] Integration tests for ExecutionEngine
- [ ] Built-in agent tests
- [ ] Registry tests
- [ ] State tracker tests

**File**: `src/agents/tests.rs`

### Step 9: Build & Verify
- [ ] `cargo check` clean
- [ ] `cargo build` successful
- [ ] `cargo test` all passing
- [ ] Release build optimized

---

## 🎯 Success Criteria

✅ **Agent trait**: Clean interface for all agents  
✅ **Execution**: Agents run with isolated context  
✅ **Vault integration**: Agents can read/write Vault  
✅ **Timeout**: Execution respects timeout limits  
✅ **Registry**: Central agent management  
✅ **Tests**: 25+ tests covering all agent operations  
✅ **Build**: Release build clean, no warnings  
✅ **Performance**: <500ms per agent execution  

---

## 🔍 Key Design Decisions

### 1. **Trait-Based Agents**
- Any type implementing `Agent` trait can be registered
- Extensible: new agents added via plugin registration
- Type-safe: compile-time trait enforcement

### 2. **Context Isolation**
- Each agent execution gets unique `AgentContext`
- No shared state between agents
- Vault context passed explicitly (no global state)

### 3. **Timeout Protection**
- Execution Engine enforces timeouts
- Long-running agents can't block system
- Graceful degradation on timeout

### 4. **Resource Tracking**
- CPU time measured
- Memory usage tracked
- Metrics persisted for analysis

---

## 📚 Related Components

**Depends On**:
- `src/orchestrator/state_machine.rs` (Phase 2.1)
- `src/vault/` (Phase 1.1)

**Integrates With**:
- `src/orchestrator/orchestrator_engine.rs` (extend)
- Event system (Phase 1.3)

**Used By**:
- Phase 2.3 Modal Cognitive Layer

---

## ⏱️ Timeline Estimate

| Task | Est. Time | Status |
|------|-----------|--------|
| Agent traits | 20 min | ⏳ |
| Execution engine | 40 min | ⏳ |
| Built-in agents | 30 min | ⏳ |
| Registry | 20 min | ⏳ |
| State tracker | 20 min | ⏳ |
| Integration | 30 min | ⏳ |
| Tests | 40 min | ⏳ |
| Build + verify | 20 min | ⏳ |
| **Total** | **~3 hours** | ⏳ |

---

## ✅ Handoff Requirements

At end of Phase 2.2, deliver:

1. ✅ **Code**: 6 new modules + 2 updated modules
2. ✅ **Tests**: 25+ test cases (unit + integration)
3. ✅ **Documentation**: PHASE_2_2_COMPLETION.md
4. ✅ **Build**: Clean release build
5. ✅ **Verification**: Agent execution demo with state machine

---

## 🔗 Phase 2.2 → 2.3 Bridge

Phase 2.3 (Modal Cognitive Layer) will:
- Use Agent registry to select agents by mode
- Switch agents dynamically (<500ms)
- Isolate cognitive context per agent
- Route results back through state machine

---

**Phase 2.2 Dependency**: Agent Execution = foundation for Phase 2.3 modal switching

**Next Phase**: Phase 2.3 will add non-linear agent selection on top of this execution engine.

