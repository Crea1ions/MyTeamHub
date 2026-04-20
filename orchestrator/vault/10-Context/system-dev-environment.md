---
id: system-dev-environment
type: context
title: "Dev Environment Setup"
status: active
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:00Z"
confidence: medium
tags: [dev, environment, setup, engineering]
lien: [[MOC]]
---

# ⚙️ System: Dev Environment

> Development workspace and setup requirements  
> **Phase 5.4**: In development

---

## 📖 DEFINITION

The dev environment is the **workspace where development happens**:

* **Where**: `00-Inbox/agent-dev/`
* **Who**: Developers writing and thinking
* **How**: IDE + agent-dev connector
* **Status**: Active, evolving

---

## 🧱 DEVELOPMENT WORKSPACE STRUCTURE

```
00-Inbox/agent-dev/
├── sessions-dev/          (Session tracking)
│   ├── YYYYMMDD-name.md   (Active session)
│   ├── tracking.md        (Meta-tracking)
│   └── missions/          (Task subfolder)
│
├── memory/                (Personal context)
│   ├── recent-context.md  (Last active context)
│   └── notes.md           (Quick notes)
│
├── missions/              (Task management)
│   ├── active/
│   ├── backlog/
│   └── completed/
│
├── agent-conversations/   (Chat history)
│   └── [conversation].md
│
└── MOC-Agent-Dev.md       (Navigation)
```

---

## 🔌 IDE CONNECTOR (VS Code Extension)

### Purpose

Bridge IDE to Vault memory with **write scope limited to agent-dev/**

### Capabilities

**✅ WRITE to**:
- 00-Inbox/agent-dev/sessions-dev/
- 00-Inbox/agent-dev/memory/
- 00-Inbox/agent-dev/missions/

**❌ CANNOT write to**:
- Projects, Knowledge, Context, Protocols, Logs

---

### IDE Commands

| Command | Action | Target |
|---------|--------|--------|
| `MyTeam: Start Session` | Create session file | sessions-dev/ |
| `MyTeam: Save to Memory` | Append note | memory/notes.md |
| `MyTeam: Create Mission` | New task file | missions/active/ |

---

## 🖥️ LOCAL SETUP

### Requirements
- Node.js 18+
- TypeScript 5+
- Rust (orchestrator) — optional
- Git

### Configuration

Create `.env.local`:

```
VSCODE_VAULT_PATH=/path/to/vault
ORCHESTRATOR_HOST=localhost:8080
ORCHESTRATOR_TOKEN=dev-token-123
LLM_API_KEY=your-mistral-key
```

---

## 🚀 RUNNING LOCALLY

**Terminal 1** — Orchestrator:
```bash
cd orchestrator && cargo run
```

**Terminal 2** — IDE Extension:
```bash
cd ide-connector && npm run dev
```

**Terminal 3** — Studio:
```bash
cd studio && npm run dev
# http://localhost:3000
```

---

## 📊 CURRENT STATUS: Phase 5.4

### Completed ✅

| Component | Status |
|-----------|--------|
| Vault Structure | ✅ |
| MOC System | ✅ |
| Context Docs | ✅ |
| Studio MVP | ✅ |
| LLM Integration | ✅ |
| Orchestrator API | ✅ |

### In Development 🟡

| Component | Status |
|-----------|--------|
| IDE Connector | 🟡 |
| Event System | 🟡 |
| OpenClaw Analysis | 🟡 |
| Rate Limiting | 🟡 |

---

## 📚 DEVELOPMENT REFERENCES

→ [[10-Context/architecture-global]]  
→ [[permanent-alignment]]  
→ [[MOC-Agent-Dev]]  
→ [[30-Knowledge/dev/]]

---

## ✅ KEY POINTS

* **Dev workspace** = agent-dev/ (IDE write scope only)
* **Status** = MVP complete, IDE connector in dev
* **Testing** = End-to-end flow working
* **Next** = Event system + OpenClaw
