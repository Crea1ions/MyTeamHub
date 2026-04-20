---
id: openclaw-vault-understanding
type: note
title: "OpenClaw Vault Understanding"
status: active
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:00Z"
confidence: high
tags: [openclaw, memory, vault, structure]
lien: [[MOC-Agent-Openclaw]]
---

# 📦 OpenClaw Vault Understanding

## System Architecture

### The 10-Directory System
```
00-Inbox      → Entry points, agent sandboxes
10-Context    → Global state, alignment
20-Projects   → Project index/cockpit
30-Knowledge  → Stable knowledge base
40-Snippets   → Code libraries
50-Tasks      → Task tracking
60-State      → Component state
70-Logs       → Logging templates
80-Protocols  → System rules
90-Indexes    → Navigation, reports
```

### Metadata Schema (v2.2)
Required fields in all frontmatters:
- `id` - unique identifier (kebab-case)
- `type` - enum: moc|context|project|task|state|log|session|output|note|snippet|index|protocol
- `title` - human readable
- `status` - enum: active|draft|template|completed|archived
- `created` - ISO timestamp
- `updated` - ISO timestamp
- `tags` - array of classifications
- `lien` - array of backlinks

---

## Core Patterns

### Navigation Pattern
- MOCs are entry points
- Wikilinks create bidirectional connections
- "lien" field maintains backlinks
- Files organized by function, not by project

### Execution Pattern
- Ideas originate in 00-Inbox
- agent-dev drives active projects
- Results flow back to 20-Projects as index
- Knowledge distills to 30-Knowledge

### Observation Pattern
- All changes discoverable via git
- Timestamps show evolution
- Status fields track lifecycle
- Tags enable cross-cutting queries

---

## Critical Rules

✅ **Agent-dev/projects-dev/** = ONLY place for active execution
✅ **20-Projects/** = Index/cockpit, not execution
✅ **30-Knowledge/** = Stable, versioned knowledge
✅ **Read-only** = OpenClaw never modifies

---

*Last updated: 2026-04-19*
