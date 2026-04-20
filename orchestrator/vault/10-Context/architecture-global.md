---
id: architecture-global
type: context
title: "Global System Architecture"
status: active
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:00Z"
confidence: high
tags: [architecture, system, design, core]
lien: [[MOC]]
---

# 🏗️ Global Architecture

> The 5-block cognitive system  
> 🟦 Studio • 🧭 Vault • ⚙️ Orchestrator • 🔌 Dev Connector • 🟣 OpenClaw

---

## 📖 DEFINITION

MyTeamHub is not a monolithic application. It's a **distributed cognitive system** with strict separation of concerns.

---

## 🧱 THE 5 BLOCKS

### 🟦 Block 1: STUDIO (Interaction)
- User-facing interface and real-time interaction
- File editing, chat interface, context management
- Technology: React + TypeScript

### 🧭 Block 2: VAULT (Memory)
- Persistent structured memory
- Markdown + YAML + wikilinks
- Storage: File system (distributed)

### ⚙️ Block 3: ORCHESTRATOR (Validation + Events)
- System validation, security, event hub
- API gateway, path validation, rate limiting, audit logging
- Technology: Rust backend service

### 🔌 Block 4: DEV CONNECTOR (IDE Bridge)
- Bridge between IDE and Vault memory
- Read/write to `agent-dev/` only
- Technology: VS Code extension

### 🟣 Block 5: OPENCLAW (Read-Only Analysis)
- External intelligence and analysis
- Global read access (no writes)
- Analysis layer only

---

## 🔄 CANONICAL FLOW

```
User → Studio → LLM Proxy → Studio → Orchestrator → Vault → OpenClaw → Dev Connector
```

---

## 🔌 CONNECTOR RULES

### ✅ DEV CONNECTOR (IDE)

**Write Access**:
```
✓ 00-Inbox/agent-dev/sessions-dev/
✓ 00-Inbox/agent-dev/memory/
✓ 00-Inbox/agent-dev/missions/
```

### ✅ OPENCLAW (Analysis)

**Read Access**: Everything  
**Write Access**: Nothing (read-only)

---

## 🔐 SECURITY MODEL

- **Token-Based Access**: Scope, operations, expiry, rate limit per connector
- **Path Whitelisting**: Only agent-dev/ allows writes
- **Audit Logging**: All writes logged with timestamp, connector_id, path, operation

---

## 🔄 CURRENT PHASE: 5.4

| Block | Status | Details |
|-------|--------|---------|
| 🟦 Studio | ✅ MVP | React interface with chat + editor |
| 🧭 Vault | ✅ Functional | File-based with markdown structure |
| ⚙️ Orchestrator | 🟡 Partial | API layer exists, needs event broadcast |
| 🔌 Dev Connector | 🟡 In Dev | VS Code extension framework ready |
| 🟣 OpenClaw | 🟡 In Dev | Read-only analysis skeleton |

---

## 📚 REFERENCES

→ [[permanent-alignment]]  
→ [[MOC]]  
→ [[10-Context/system-runtime-state]]  
→ [[10-Context/vault-overview]]
