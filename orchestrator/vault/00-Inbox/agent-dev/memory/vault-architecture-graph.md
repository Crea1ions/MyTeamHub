---
id: vault-architecture-graph
type: note
title: "Vault Architecture & Navigation Graph"
status: active
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:00Z"
confidence: high
tags: [documentation, vault, architecture, graph, mermaid, overview]
lien: [ [[MOC]], [[MOC-Agent-Dev]] ]
---

# 🗺️ Vault Architecture & Navigation Graph

> Vue d'ensemble complète du Vault avec diagrammes Mermaid  
> 🧭 Navigation • 📊 Flux • 🔗 Relations

---

## 📊 1. VUE GÉNÉRALE DU VAULT (10 Directories)

```mermaid
graph TB
    MOC["🧠 MOC (Root)<br/>Master of Ceremonies"]
    
    MOC -->|"📋 Navigation"| A["<b>00-Inbox</b><br/>Entry Points"]
    MOC -->|"🧭 Contexte"| B["<b>10-Context</b><br/>System State"]
    MOC -->|"📦 Structure"| C["<b>20-Projects</b><br/>Planning"]
    MOC -->|"📚 Knowledge"| D["<b>30-Knowledge</b><br/>Stable Info"]
    MOC -->|"💾 Assets"| E["<b>40-Snippets</b><br/>Code Library"]
    MOC -->|"✅ Tasks"| F["<b>50-Tasks</b><br/>Todo"]
    MOC -->|"🔍 Status"| G["<b>60-State</b><br/>System State"]
    MOC -->|"📝 History"| H["<b>70-Logs</b><br/>History"]
    MOC -->|"🔐 Rules"| I["<b>80-Protocols</b><br/>Rules"]
    MOC -->|"🧩 Discovery"| J["<b>90-Indexes</b><br/>Navigation"]
    
    A -.-> A1["agent-dev<br/>(IDE workspace)"]
    A -.-> A2["agent-openclaw<br/>(Analysis)"]
    A -.-> A3["myteam-studio<br/>(UI workspace)"]
    
    B -.-> B1["architecture-global"]
    B -.-> B2["permanent-alignment"]
    B -.-> B3["system-runtime-state"]
    
    C -.-> C1["_template-project"]
    C -.-> C2["obs-orchestrator"]
    
    D -.-> D1["architecture/"]
    D -.-> D2["dev/"]
    D -.-> D3["llm/"]
    D -.-> D4["patterns/"]
    
    style MOC fill:#6366f1,stroke:#4f46e5,color:#fff
    style A fill:#3b82f6,stroke:#2563eb,color:#fff
    style B fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style C fill:#ec4899,stroke:#db2777,color:#fff
    style D fill:#14b8a6,stroke:#0d9488,color:#fff
    style E fill:#f59e0b,stroke:#d97706,color:#fff
    style F fill:#ef4444,stroke:#dc2626,color:#fff
    style G fill:#06b6d4,stroke:#0891b2,color:#fff
    style H fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style I fill:#6b7280,stroke:#4b5563,color:#fff
    style J fill:#10b981,stroke:#059669,color:#fff
```

---

## 🧭 2. ARCHITECTURE COGNITIVE (3 COUCHES)

```mermaid
graph LR
    IDE["🖥️ IDE<br/>(VS Code)"]
    
    IDE -->|"Write: agent-dev/"| DEV["🧪 Agent-Dev<br/>Workspace<br/><br/>sessions-dev/<br/>memory/<br/>missions/"]
    
    DEV -->|"Promote ↑"| PROJ["📦 Projects<br/>Structure<br/><br/>20-Projects/<br/>_template/<br/>concepts"]
    
    PROJ -->|"Capitalize ↑"| KNOW["📚 Knowledge<br/>Stable<br/><br/>30-Knowledge/<br/>architecture/<br/>patterns"]
    
    KNOW -->|"Vault"| VAULT["🧭 VAULT<br/>(Persistent)<br/>IndexManager"]
    
    VAULT -->|"Read"| IDE
    
    IDE -->|"Other: ❌ Read"| BLOCK["❌ BLOCKED<br/>Projects, Context,<br/>Protocols, Logs"]
    
    style IDE fill:#1f2937,stroke:#111827,color:#fff
    style DEV fill:#3b82f6,stroke:#2563eb,color:#fff
    style PROJ fill:#ec4899,stroke:#db2777,color:#fff
    style KNOW fill:#14b8a6,stroke:#0d9488,color:#fff
    style VAULT fill:#6366f1,stroke:#4f46e5,color:#fff
    style BLOCK fill:#dc2626,stroke:#991b1b,color:#fff
```

---

## 🔄 3. FLUX DE DONNÉES (Session → Project → Knowledge)

```mermaid
graph TD
    A["🧪 Session<br/>(Agent-Dev)"]
    B["👤 Developer<br/>Working"]
    C["🧠 Memory<br/>(Notes)"]
    D["✅ Decision:<br/>Promote?"]
    E["📦 Project<br/>(20-Projects)"]
    F["✅ Decision:<br/>Complete?"]
    G["📚 Knowledge<br/>(30-Knowledge)"]
    H["🧭 Vault<br/>(Persistent)"]
    I["🔄 Cycles<br/>Repeat"]
    
    B -->|"Write"| A
    A -->|"Capture"| C
    C -->|"When Ready"| D
    D -->|"Yes"| E
    D -->|"No"| I
    E -->|"Execute & Track"| F
    F -->|"Yes"| G
    F -->|"No"| I
    G -->|"Index & Link"| H
    H -->|"Reference"| I
    I -->|"New Session"| B
    
    style A fill:#3b82f6,stroke:#2563eb,color:#fff
    style B fill:#1f2937,stroke:#111827,color:#fff
    style C fill:#f59e0b,stroke:#d97706,color:#fff
    style E fill:#ec4899,stroke:#db2777,color:#fff
    style G fill:#14b8a6,stroke:#0d9488,color:#fff
    style H fill:#6366f1,stroke:#4f46e5,color:#fff
```

---

## 🧭 4. MOC NAVIGATION STRUCTURE

```mermaid
graph TB
    ROOT["🧠 MOC<br/>(Root)"]
    
    ROOT -->|"Dev Workspace"| MOC1["MOC-Agent-Dev<br/><br/>sessions-dev/<br/>memory/<br/>missions/"]
    
    ROOT -->|"Projects"| MOC2["MOC-Projects<br/><br/>_template-project/<br/>obs-orchestrator/"]
    
    ROOT -->|"Knowledge"| MOC3["MOC-Knowledge<br/><br/>architecture/<br/>dev/<br/>llm/<br/>patterns/"]
    
    ROOT -->|"Analysis"| MOC4["MOC-Agent-Openclaw<br/><br/>Read-Only<br/>External Analysis"]
    
    MOC1 -->|"Sessions"| S1["00-Inbox/agent-dev/sessions-dev/"]
    MOC1 -->|"Memory"| S2["00-Inbox/agent-dev/memory/"]
    MOC1 -->|"Missions"| S3["00-Inbox/agent-dev/missions/"]
    
    MOC2 -->|"Concept"| P1["concept.md"]
    MOC2 -->|"Planning"| P2["plan-resume.md<br/>plan-complet.md"]
    MOC2 -->|"Tracking"| P3["tracking.md"]
    MOC2 -->|"Alignment"| P4["realignement_permanent.md"]
    
    MOC3 -->|"Architecture"| K1["agent-model<br/>vault-system"]
    MOC3 -->|"Development"| K2["offline-first<br/>performance"]
    MOC3 -->|"LLM"| K3["mistral-integration<br/>prompt-engineering"]
    MOC3 -->|"Patterns"| K4["cognition-model<br/>session-flow"]
    
    style ROOT fill:#6366f1,stroke:#4f46e5,color:#fff
    style MOC1 fill:#3b82f6,stroke:#2563eb,color:#fff
    style MOC2 fill:#ec4899,stroke:#db2777,color:#fff
    style MOC3 fill:#14b8a6,stroke:#0d9488,color:#fff
    style MOC4 fill:#8b5cf6,stroke:#7c3aed,color:#fff
```

---

## 🔌 5. CONNECTEURS EXTERNES

```mermaid
graph LR
    ORCH["⚙️ Orchestrator<br/>(Event System)"]
    
    IDE["🖥️ IDE<br/>VS Code"]
    OPENCLAW["🟣 OpenClaw<br/>Analysis"]
    
    ORCH -->|"IDE Token<br/>Scoped"| IDE
    ORCH -->|"OpenClaw Token<br/>Read-Only"| OPENCLAW
    
    IDE -->|"✅ Can: Read/Write<br/>agent-dev/"| DEVBOX["📦 agent-dev/<br/>Sandbox"]
    IDE -->|"❌ Cannot:<br/>Projects, Knowledge"| BLOCKED["🚫 Blocked"]
    
    OPENCLAW -->|"✅ Can: Read All<br/>Zero Write"| VAULT["🧭 Vault<br/>(Full)"]
    OPENCLAW -->|"Reports"| LOGS["📝 Reports<br/>00-Inbox/agent-openclaw/logs/"]
    
    style ORCH fill:#6b7280,stroke:#4b5563,color:#fff
    style IDE fill:#1f2937,stroke:#111827,color:#fff
    style OPENCLAW fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style DEVBOX fill:#3b82f6,stroke:#2563eb,color:#fff
    style VAULT fill:#6366f1,stroke:#4f46e5,color:#fff
    style BLOCKED fill:#dc2626,stroke:#991b1b,color:#fff
    style LOGS fill:#f59e0b,stroke:#d97706,color:#fff
```

---

## 📊 6. FILE TYPES & DISTRIBUTION

```mermaid
graph TB
    subgraph Type1["🧠 MOC (5)"]
        M1["MOC.md"]
        M2["MOC-Agent-Dev"]
        M3["MOC-Projects"]
        M4["MOC-Knowledge"]
        M5["MOC-Agent-Openclaw"]
    end
    
    subgraph Type2["📝 Context (6)"]
        C1["architecture-global"]
        C2["permanent-alignment"]
        C3["system-runtime-state"]
        C4["vault-overview"]
        C5["myteamhub-vision"]
        C6["system-dev-environment"]
    end
    
    subgraph Type3["📦 Project (5)"]
        P1["concept"]
        P2["plan-resume"]
        P3["plan-complet"]
        P4["tracking"]
        P5["realignement"]
    end
    
    subgraph Type4["📚 Knowledge (12)"]
        K1["agent-model"]
        K2["vault-system"]
        K3["offline-first"]
        K4["performance"]
    end
    
    subgraph Type5["📝 Log (6)"]
        L1["agent-rules"]
        L2["context-rules"]
        L3["connector-rules"]
        L4["parsing-rules"]
        L5["openclaw-log"]
        L6["vault-state"]
    end
    
    subgraph Type6["🧩 Index (8)"]
        I1["active-projects"]
        I2["knowledge-map"]
        I3["task-queue"]
        I4["vault-health"]
    end
    
    style Type1 fill:#6366f1,stroke:#4f46e5,color:#fff
    style Type2 fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style Type3 fill:#ec4899,stroke:#db2777,color:#fff
    style Type4 fill:#14b8a6,stroke:#0d9488,color:#fff
    style Type5 fill:#f59e0b,stroke:#d97706,color:#fff
    style Type6 fill:#10b981,stroke:#059669,color:#fff
```

---

## 🔒 7. SECURITY & ACCESS CONTROL

```mermaid
graph TB
    USER["👤 User"]
    
    IDE["🖥️ IDE<br/>(Local)"]
    STUDIO["🖥️ Studio<br/>(Astro)"]
    SYSTEM["⚙️ Orchestrator<br/>(Rust)"]
    
    VAULT["🧭 Vault<br/>(File System)"]
    
    IDE -->|"Token: agent-dev<br/>Scope: 00-Inbox/agent-dev/"| SYSTEM
    STUDIO -->|"Token: session<br/>Read Vault"| SYSTEM
    
    SYSTEM -->|"Validates<br/>Path, Scope, TTL"| VAULT
    
    USER -->|"Use"| IDE
    USER -->|"Use"| STUDIO
    
    VAULT -->|"Returns"| SYSTEM
    SYSTEM -->|"Responds"| IDE
    SYSTEM -->|"Responds"| STUDIO
    
    BLOCKED["❌ Direct Access<br/>Forbidden"]
    IDE -.->|"Denied"| BLOCKED
    
    style USER fill:#1f2937,stroke:#111827,color:#fff
    style IDE fill:#3b82f6,stroke:#2563eb,color:#fff
    style STUDIO fill:#ec4899,stroke:#db2777,color:#fff
    style SYSTEM fill:#6b7280,stroke:#4b5563,color:#fff
    style VAULT fill:#6366f1,stroke:#4f46e5,color:#fff
    style BLOCKED fill:#dc2626,stroke:#991b1b,color:#fff
```

---

## 🧠 8. CONTEXT LAYERS

```mermaid
graph LR
    subgraph Session["🧪 Session<br/>(Ephemeral)"]
        SE["Location: Studio RAM<br/>Duration: 1 session<br/>Access: Current user"]
    end
    
    subgraph DevMem["🧠 Dev Memory<br/>(Personal)"]
        DM["Location: agent-dev/<br/>Duration: Persistent<br/>Access: IDE only"]
    end
    
    subgraph Vault["🧭 Vault<br/>(Global)"]
        VT["Location: File System<br/>Duration: Forever<br/>Access: All (read)"]
    end
    
    Session -->|"Promote"| DevMem
    DevMem -->|"Promote"| Vault
    Vault -->|"Reference"| Session
    
    style Session fill:#3b82f6,stroke:#2563eb,color:#fff
    style DevMem fill:#f59e0b,stroke:#d97706,color:#fff
    style Vault fill:#6366f1,stroke:#4f46e5,color:#fff
```

---

## 🚀 9. QUICK REFERENCE: WHERE TO FIND THINGS

```mermaid
graph TB
    Q["❓ What I Need"]
    
    Q -->|"Dev Session"| A["👉 [[MOC-Agent-Dev]]<br/>00-Inbox/agent-dev/"]
    Q -->|"Project Info"| B["👉 [[MOC-Projects]]<br/>20-Projects/"]
    Q -->|"Knowledge/Pattern"| C["👉 [[MOC-Knowledge]]<br/>30-Knowledge/"]
    Q -->|"System Rules"| D["👉 [[80-Protocols/]]"]
    Q -->|"Current Status"| E["👉 [[90-Indexes/]]"]
    Q -->|"Architecture"| F["👉 [[10-Context/]]"]
    
    style Q fill:#6366f1,stroke:#4f46e5,color:#fff
    style A fill:#3b82f6,stroke:#2563eb,color:#fff
    style B fill:#ec4899,stroke:#db2777,color:#fff
    style C fill:#14b8a6,stroke:#0d9488,color:#fff
    style D fill:#6b7280,stroke:#4b5563,color:#fff
    style E fill:#10b981,stroke:#059669,color:#fff
    style F fill:#8b5cf6,stroke:#7c3aed,color:#fff
```

---

## 📋 10. FILE ORGANIZATION SUMMARY

| Directory | Purpose | Type | Access |
|-----------|---------|------|--------|
| **00-Inbox** | Entry points | Temporary | IDE write |
| **10-Context** | System state | Context | Read-only |
| **20-Projects** | Planning | Structure | Manual |
| **30-Knowledge** | Stable info | Permanent | Reference |
| **40-Snippets** | Code library | Assets | Reference |
| **50-Tasks** | Todo tracking | Tasks | Manual |
| **60-State** | Runtime state | Logs | Event-based |
| **70-Logs** | History | Logs | Event-based |
| **80-Protocols** | System rules | Documentation | Reference |
| **90-Indexes** | Navigation | Discovery | Auto-generated |

---

## 🎯 KEY PRINCIPLES

✅ **Separation of Concerns**
- Each directory has one responsibility
- Clear boundaries between layers
- No circular dependencies

✅ **Single Context Model**
- One active editor context at a time
- Session state = Editor content
- No global implicit state

✅ **Explicit Promotion**
- Nothing auto-migrates
- Session → Project → Knowledge via manual promotion
- Clear versioning at each step

✅ **Read-Only Safety**
- IDE restricted to agent-dev/
- External analyzers (OpenClaw) read-only
- All access validated by Orchestrator

✅ **Persistence Model**
- Session = RAM (ephemeral)
- Dev Memory = agent-dev/ (personal)
- Vault = File System (permanent)
- No duplication between layers

---

## 🔗 REFERENCES

👉 [[MOC]] — Master entry point  
👉 [[00-Inbox/agent-dev/MOC-Agent-Dev]] — Dev workspace guide  
👉 [[20-Projects/MOC-Projects]] — Project structure guide  
👉 [[30-Knowledge/MOC-Knowledge]] — Knowledge base guide  
👉 [[10-Context/permanent-alignment]] — Design principles  
👉 [[80-Protocols/parsing-rules]] — File format rules  

---

**Generated**: 2026-04-19  
**Status**: Production Reference  
**Audience**: Future users & developers
