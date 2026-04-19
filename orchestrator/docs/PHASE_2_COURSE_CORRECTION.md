---
id: phase-2-course-correction
type: meta
phase: 2
date: 2026-04-17
status: active
---

# 🔄 Phase 2 — Course Correction

## Diagnostic: The Over-Engineering Drift

### What Happened
Yesterday I built 3 "frozen contracts" with intention to prevent Phase 2 chaos.

### The Problem
```
Simple MVP:
event → state machine → agents → vault ✓

What I started building:
event (schema-locked) 
→ state machine (5 formal guarantees)
→ agents (8 forbidden actions enforced)
→ sandbox (resource limits)
→ vault
```

This is **Phase 3-4 maturity level, not Phase 2**.

---

## Real Issues vs. Over-Corrections

### ✅ Real Issues (Worth Fixing)
- Event model needs consistent shape (YES)
- State machine needs to work (YES)
- Agents need clear boundaries (YES)
- Tests need to verify behavior (YES)

### ❌ Invented Issues (Over-Corrections)
- Events need "forever locked" schema ← premature
- State machine needs "5 formal guarantees" ← over-formalized
- Agents need "8 forbidden actions enforced at runtime" ← Phase 3 concern
- Sandboxing advanced resource limits ← Phase 3 security goal

**The delta**: Solving real problems turned into building a formal platform.

---

## The Honest Assessment

| Aspect | Status | Reality |
|--------|--------|---------|
| Architecture | ✅ Good | Core is sound |
| Event system | ✅ Works | No schema locking needed |
| State machine | ✅ Simple | Deterministic already |
| Agents | ✅ Clear | Interface is obvious |
| Vault | ✅ Reliable | Source of truth |
| Phase 2 simplicity | ❌ Degraded | Added 4 meta-layers |

---

## What Phase 2 Should Actually Be

```
Event-driven system:
- 4 event types (documented, not locked)
- State machine (5 states, works)
- Agent executor (runs functions, reports results)
- Vault persistence (atomic writes)
```

That's it. That's the MVP.

**Goal**: Simple enough to understand. Extensible enough to modify. Testable enough to validate.

**NOT**: Secure platform with formal invariants.

---

## Phase 2.2 Scope (REVISED)

### Doing Now (Simple)
1. `Agent` trait: `async fn execute(&self, ctx: AgentContext) -> AgentOutput`
2. `AgentRegistry`: store + lookup agents
3. 3 example agents: Echo, Analyzer, Indexer
4. Integration: agents run in OrchestratorEngine
5. Tests: happy path + error cases

### NOT Doing (Save for Phase 3)
- Sandbox/resource limits
- "8 forbidden actions" enforcement
- Schema validation gates
- Formal invariant checking

---

## What Changes

### Documents to Revise

#### 1. PHASE_2_EVENT_CONTRACT.md
**Old**: Events LOCKED, no additions until Phase 3
**New**: Events documented, schema guide, examples

**Why**: Locking is premature. Documentation is useful.

#### 2. STATE_MACHINE_GUARANTEES.md
**Old**: 5 formal guarantees, Phase 2 frozen
**New**: State machine design notes, known properties

**Why**: Formal guarantees are Phase 3. Design notes help Phase 2.2.

#### 3. AGENT_CONTRACT_STRICT.md
**Old**: 8 forbidden actions with runtime enforcement
**New**: Agent interface definition, design guidelines

**Why**: Runtime enforcement is Phase 3 security. Design guidelines help now.

#### 4. PHASE_2_STABILIZATION_STRATEGY.md
**Old**: Stabilization gates, contracts block Phase 2.2
**New**: (DELETE — this was the over-engineering artifact)

**Why**: If we're not doing formal gates, we don't need this meta-doc.

---

## The Right Level of Formality for Phase 2

### ✅ DO document:
- What events look like (JSON examples)
- What states do (transition table)
- What agents can call (public API)
- How vault reads/writes work

### ❌ DON'T enforce:
- Schema validation (Phase 3)
- Forbidden actions at runtime (Phase 3)
- Formal state invariants (Phase 3)
- Sandbox limits (Phase 3)

---

## Phase 2.2 Start (Simplified)

### Entry Criteria (Much Simpler)
- [ ] Read agent interface (1 page)
- [ ] Design 3 example agents (paper sketch)
- [ ] Run basic tests (happy path)
- [ ] Integrate with OrchestratorEngine

### No Blockers
- No contract verification meetings
- No boundary enforcement tests
- No formal review gates
- Just: build → test → integrate

---

## Principle: When to Formalize

```
Phase 2: MVP works
Phase 3: Desktop integration + real usage feedback
Phase 4: Formal security + compliance gates
```

**We're in Phase 2.**

MVP > perfection.

---

## What Stays Good

### Core Architecture (Unchanged)
- ✅ Event-driven router
- ✅ Deterministic state machine
- ✅ Vault as source of truth
- ✅ Agents as isolated executors

### Phase 2.1 (Unchanged)
- ✅ 5 modules (state_machine, workflow, rules_engine, state_manager, orchestrator_engine)
- ✅ 20/20 tests
- ✅ <500ms events
- ✅ Backwards compatible

### What Was Good About Contracts
- ✅ Thinking through agent boundaries (keep this thinking)
- ✅ Considering state machine shape (keep this design)
- ✅ Event model consistency (keep this discipline)
- ❌ Locking them formally (drop this premature enforcement)

---

## Specific Actions

### 1. Reframe Documents (Don't Delete)

**PHASE_2_EVENT_CONTRACT.md**
- Becomes: "Event Types — Design Notes"
- Keep: JSON schemas, examples, rationale
- Remove: "LOCKED", "no additions", "phase 3 RFC"

**STATE_MACHINE_GUARANTEES.md**
- Becomes: "State Machine — Design Notes"
- Keep: 5 states, 4 workflows, 7 rules
- Remove: "FROZEN", "phase 3 extension", "formal guarantees"

**AGENT_CONTRACT_STRICT.md**
- Becomes: "Agent Interface — Design Guide"
- Keep: Input/output structure, design guidelines
- Remove: "8 forbidden actions", "runtime enforcement", "sandbox"

**PHASE_2_STABILIZATION_STRATEGY.md**
- DELETE: This was the over-engineering artifact

### 2. Dashboard Update

Change:
```
🛑 Phase 2 — STABILIZATION GATES
to:
✅ Phase 2 — DESIGN DOCUMENTED
```

---

## The Real Contract (Super Simple)

### What Phase 2.2 Agents Must Do

1. **Input**: `AgentContext` (read-only state)
2. **Work**: Execute logic (calculation, search, generation)
3. **Output**: `AgentResult` (success/failure, data)
4. **Side Effect**: Optional vault write (atomic)

That's the contract. That's all.

---

## Timeline Impact

- Phase 2.1: ✅ Complete (no change)
- Phase 2.2: NOW → ~3 days (was 1 week)
- Phase 2.3: Slides by 4 days (not 1 week)
- Phase 2.4: Slides by 4 days (not 1 week)
- **Total**: Back on track, still 17 weeks ✓

---

## Why This Correction Matters

### Old Pattern (Wrong)
```
Build big framework → Lock it → Add agents → Discover problems → Redesign gates
= Expensive pivot in Phase 3
```

### New Pattern (Right)
```
Build simple runtime → Add agents → Gather feedback → Formalize in Phase 3
= Natural iteration
```

---

## Principle

**MVP philosophy**: 
- Make it work
- Make it clear
- Make it extensible
- Then make it perfect (Phase 3+)

We're on step 1-3. Not 4.

---

## Green Light for Phase 2.2

✅ Go simple
✅ No gate blockers
✅ Agents are functions, not mini-systems
✅ Tests are pragmatic (not formal)
✅ Phase 3 gets the formality

**Start Phase 2.2 now with fresh mindset: MVP execution, not platform building.**

---

**Status**: 🔄 Corrected course  
**Reframe**: Contracts → Design Notes (useful but non-blocking)  
**Timeline**: Back to 17 weeks  
**Next**: Delete stabilization doc, reframe others, start Phase 2.2 simple
