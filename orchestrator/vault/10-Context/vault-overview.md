---
id: vault-overview
type: context
title: "Vault System Overview"
status: active
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:00Z"
confidence: high
tags: [vault, organization, structure, memory]
lien: [[MOC]]
---

# 🧭 Vault: Overview

> The file-based persistent memory system  
> **Organization Principle**: Numbered folders (00-99)

---

## 📖 DEFINITION

The Vault is the **persistent, structured memory** of Orchestrator:

* **What**: File-based knowledge store
* **How**: Markdown + YAML + wikilinks
* **Where**: `~/dev/APP/001-APP-Orchestrator/orchestrator/vault/`
* **Why**: Single source of truth, human readable, version controllable

---

## 🧱 THE 11-FOLDER SYSTEM

The Vault uses a **numbered folder scheme** (00-99) for clear organization:

```
00 — Inbox (ephemeral)
10 — Context (definitions)
20 — Projects (structures)
30 — Knowledge (stable)
40 — Snippets (reusable code)
50 — Tasks (work items)
60 — State (runtime status)
70 — Logs (events and traces)
80 — Protocols (rules)
90 — Indexes (navigation)
```

### Principle

> **Lower numbers = Higher change frequency**  
> **Higher numbers = More stable**

---

## 📂 DETAILED FOLDER ROLES

### 00-Inbox (Ephemeral)

**Purpose**: Capture ephemeral thoughts and sessions

**Lifespan**: Minutes to hours  
**IDE Write**: ✅ YES  
**Archive**: Manually (old sessions → 70-Logs)

**Key Files**:
- `agent-dev/MOC-Agent-Dev.md` → Navigation
- `agent-dev/sessions-dev/tracking.md` → Meta-tracking
- `agent-dev/memory/recent-context.md` → Current context

---

### 10-Context (Definitions)

**Purpose**: System-wide definitions and current state

**Lifespan**: Months (stable unless updated)  
**IDE Write**: ❌ NO (read-only)  
**Archive**: Never (reference material)

**Key Points**:
- ✅ Immutable reference
- ✅ Current state included
- ✅ Links to external sources

---

### 20-Projects (Structures)

**Purpose**: Formalized projects with plans and tracking

**Lifespan**: Weeks to months  
**IDE Write**: ❌ NO (read-only)  
**Archive**: Completed → 70-Logs/projects/

**Rule**: Every project = 5 files (always)

---

### 30-Knowledge (Stable)

**Purpose**: Reusable, validated knowledge

**Lifespan**: Years (permanent)  
**IDE Write**: ❌ NO (read-only)  
**Archive**: Never (gold source)

**Quality Gate**: Only promoted from Projects

---

### 40-Snippets (Reusable)

**Purpose**: Code and configuration snippets

**Lifespan**: Months (reference)  
**IDE Write**: ❌ NO  
**Archive**: Deprecated → 70-Logs/snippets/

**Note**: Curated, not auto-generated

---

### 50-Tasks (Work)

**Purpose**: Work items and task tracking

**Lifespan**: Days to weeks (active) → archived  
**IDE Write**: ❌ NO  
**Archive**: Completed → 70-Logs/tasks/

---

### 60-State (Runtime)

**Purpose**: Component and system state tracking

**Lifespan**: Hours to days (real-time)  
**IDE Write**: ❌ NO (Orchestrator writes)  
**Archive**: Old states → 70-Logs/state/

**Auto-Updated**: Orchestrator updates on events

---

### 70-Logs (Archive)

**Purpose**: Historical logs and completed items

**Lifespan**: Permanent archive  
**IDE Write**: ❌ NO  
**Archive**: Never (permanent history)

**Note**: Auto-populated from 00-Inbox archival

---

### 80-Protocols (Rules)

**Purpose**: System rules and constraints

**Lifespan**: Months (stable unless updated)  
**IDE Write**: ❌ NO (read-only)  
**Archive**: Never (governance)

**Enforcement**: Orchestrator validates against these

---

### 90-Indexes (Navigation)

**Purpose**: Search indexes and navigation aids

**Lifespan**: Hours (frequently updated)  
**IDE Write**: ❌ NO (auto-generated)  
**Archive**: Old indexes → 70-Logs/indexes/

**Generation**: OpenClaw generates these

---

## 🔗 LINKING CONVENTION

### Wikilink Format

```markdown
[[path/file]]          → Link to file
[[path/file#section]]  → Link to section
[[path/]]              → Link to folder
```

### Backlinks

Files are automatically backlinked:

```
If: document-a.md contains [[document-b]]
Then: document-b.md shows backlink to document-a
```

---

## 🔒 ACCESS CONTROL

### Write Permissions

```
✅ IDE can write to:
   • 00-Inbox/agent-dev/sessions-dev/
   • 00-Inbox/agent-dev/memory/
   • 00-Inbox/agent-dev/missions/

❌ IDE cannot write to:
   • Everything else
```

### Read Permissions

```
✅ IDE can read:
   • 00-Inbox/agent-dev/
   • 10-Context/
   • 30-Knowledge/
   • 60-State/
   • 70-Logs/
   • 80-Protocols/
   • 90-Indexes/

🟣 OpenClaw can read:
   • Everything (global read)
```

---

## 📚 REFERENCES

→ [[MOC]]  
→ [[10-Context/architecture-global]]  
→ [[10-Context/system-dev-environment]]  
→ [[10-Context/system-runtime-state]]  
→ [[permanent-alignment]]

---

## ✅ KEY PRINCIPLES

**Numbered Organization**
* 00-99 scheme → Natural ordering
* Lower = More dynamic
* Higher = More stable

**Single Source of Truth**
* Everything in files
* Version controllable
* Human readable

**Strict Write Scope**
* IDE: agent-dev/ only
* Orchestrator: validated writes
* OpenClaw: read-only
