---
id: project-template-moc
type: moc
title: "Project MOC Template"
status: template
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:19Z"
confidence: high
tags: [moc, project, template, navigation]
lien: [[00-Inbox/agent-dev/MOC-Agent-Dev], [00-Inbox/agent-dev/projects-dev/README], [20-Projects/MOC-Projects]]
---

# 🧭 MOC — Project Template

> Navigation et structure unique pour chaque projet  
> 📋 Vue d'ensemble • 🎯 Planning • 🏗️ Architecture • 📊 Tracking

---

## 📂 PROJECT STRUCTURE

```
project-name/
├── 00-overview/
│   ├── concept.md
│   ├── alignment.md
│   └── executive-summary.md
├── 01-planning/
│   ├── plan-complet.md
│   ├── plan-resume.md
│   └── roadmap.md
├── 02-architecture/
│   ├── architecture.md
│   └── system-design.md
├── 03-features/
│   └── FEATURE_TEMPLATE.md
├── 04-phases/
│   └── PHASE_TEMPLATE.md
├── 05-sessions/
│   └── session-template.md
├── 06-decisions/
│   └── DECISION_TEMPLATE.md
├── 07-tracking/
│   ├── tracking.md
│   └── blockers.md
├── 08-logs/
│   └── log-template.md
└── MOC-Project.md (this file)
```

---

## 🧠 1. 00-OVERVIEW

**Purpose**: Define and align the project

- `concept.md` — Vision, objectives, scope
- `alignment.md` — Strategic alignment, principles
- `executive-summary.md` — High-level summary

👉 **When to use**: Project kickoff, stakeholder alignment

---

## 📋 2. 01-PLANNING

**Purpose**: Plan execution and roadmap

- `plan-complet.md` — Detailed tasks, timeline, resources
- `plan-resume.md` — Condensed version, milestones
- `roadmap.md` — Phases, deliverables, timeline

👉 **When to use**: Sprint planning, milestone tracking

---

## 🏗️ 3. 02-ARCHITECTURE

**Purpose**: Document system design

- `architecture.md` — Overall architecture, components
- `system-design.md` — Technical design decisions

👉 **When to use**: Technical discussions, implementation

---

## 🎯 4. 03-FEATURES

**Purpose**: Track individual features

- `FEATURE_TEMPLATE.md` — Template for new features
  - Feature name, description, acceptance criteria
  - Implementation notes, blockers, status

👉 **When to use**: Feature breakdown, detailed implementation

---

## ⚡ 5. 04-PHASES

**Purpose**: Organize by project phases

- `PHASE_TEMPLATE.md` — Template for each phase
  - Phase name, goals, deliverables
  - Timeline, dependencies, risks

👉 **When to use**: Phase tracking, milestone management

---

## 🧪 6. 05-SESSIONS

**Purpose**: Record working sessions

- `session-template.md` — Template for session captures
  - Session date, context, work done
  - Decisions, blockers, next steps

👉 **When to use**: Daily/weekly work capture

---

## 🤝 7. 06-DECISIONS

**Purpose**: Document important decisions

- `DECISION_TEMPLATE.md` — Template for decisions
  - Decision, rationale, alternatives considered
  - Impact, reversibility, stakeholders

👉 **When to use**: Major decisions, alternatives analysis

---

## 📊 8. 07-TRACKING

**Purpose**: Monitor project progress

- `tracking.md` — Current status, progress %, timeline
- `blockers.md` — Active blockers, risks, solutions

👉 **When to use**: Standups, progress reviews, blocker management

---

## 📝 9. 08-LOGS

**Purpose**: Record project history

- `log-template.md` — Template for log entries
  - Date, event type, description
  - Impact, resolution

👉 **When to use**: Audit trail, historical reference

---

## 🧩 USAGE PATTERN

```
1. Copy entire _template-project/ → your-project/
2. Update MOC-Project.md with project name
3. Fill 00-overview/ (concept, alignment)
4. Plan in 01-planning/
5. Document architecture in 02-architecture/
6. Add features in 03-features/
7. Organize by phases in 04-phases/
8. Capture sessions in 05-sessions/
9. Document decisions in 06-decisions/
10. Track progress in 07-tracking/
11. Log events in 08-logs/
```

---

## 🔗 INTEGRATION

### Within Agent-Dev
```
projects-dev/
├── _template-project/
│   └── MOC-Project.md (this file)
└── [your-project]/
    ├── 00-overview/
    ├── 01-planning/
    ├── ...
    └── MOC-Project.md → links to all sections
```

### From IDE
IDE Connector can write to:
- `projects-dev/{project}/**` (read/write)
- `sessions-dev/` (read/write)

### From Studio
Reference via:
- `[[projects-dev/project-name/]]`
- `[[projects-dev/project-name/02-architecture/]]`

---

## ✅ STRUCTURE BENEFITS

✅ **Reusable** — One template, many projects  
✅ **Scalable** — Easy to add new projects  
✅ **Organized** — Clear structure per project  
✅ **Discoverable** — Logical hierarchy  
✅ **Flexible** — Adapt sections as needed

---

## 📌 REFERENCES

👉 [[MOC-Agent-Dev]] — Agent-Dev workspace  
👉 [[../memory/]] — Shared memory  
👉 [[../missions/]] — Mission tracking  

---

**Template Version**: 1.0  
**Status**: Production Template  
**Last Updated**: 2026-04-19
