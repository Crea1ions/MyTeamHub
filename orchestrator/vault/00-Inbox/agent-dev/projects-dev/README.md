---
id: projects-dev-readme
type: project
title: "Projects-Dev: Quick Start Guide"
status: active
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:20Z"
confidence: high
tags: [project, readme, guide, navigation, template]
lien: [[00-Inbox/agent-dev/MOC-Agent-Dev], [MOC], [20-Projects/MOC-Projects]]
---

# 🚀 Projects-Dev: Quick Start

> Structured project workspace for MyTeamHub development and IDE integration

---

## ✨ WHAT IS PROJECTS-DEV?

**projects-dev/** is a scalable project container for structured, reusable project work.

- **📦 Single Model**: One template, many projects  
- **🧹 Organized**: Clear 8-section structure per project  
- **🔌 IDE-Ready**: Dev Connector writes directly to projects  
- **🧠 Persistent**: Long-term project tracking (vs ephemeral sessions)

---

## 📂 DIRECTORY STRUCTURE

```
projects-dev/
│
├── _template-project/        ← Single source of truth
│   ├── MOC-Project.md        (Navigation hub)
│   ├── 00-overview/          (Concept, alignment, summary)
│   ├── 01-planning/          (Plans, roadmap)
│   ├── 02-architecture/      (Design, decisions)
│   ├── 03-features/          (Feature specs)
│   ├── 04-phases/            (Phase tracking)
│   ├── 05-sessions/          (Work sessions)
│   ├── 06-decisions/         (Tech decisions)
│   ├── 07-tracking/          (Progress, blockers)
│   └── 08-logs/              (Event history)
│
└── [your-project]/           ← Add new projects here
    ├── 00-overview/
    ├── 01-planning/
    ├── ...
    └── MOC-Project.md
```

---

## 🎯 8 PROJECT SECTIONS EXPLAINED

| # | Section | Purpose | Files |
|---|---------|---------|-------|
| **00** | **Overview** | Define & align project | concept, alignment, summary |
| **01** | **Planning** | Plan execution | plan-resume, plan-complet, roadmap |
| **02** | **Architecture** | Document design | architecture, system-design |
| **03** | **Features** | Track features | FEATURE_TEMPLATE.md |
| **04** | **Phases** | Organize by phases | PHASE_TEMPLATE.md |
| **05** | **Sessions** | Capture work | session-template.md |
| **06** | **Decisions** | Document choices | DECISION_TEMPLATE.md |
| **07** | **Tracking** | Monitor progress | tracking, blockers |
| **08** | **Logs** | Record history | log-template.md |

---

## 🚀 CREATING A NEW PROJECT

### Step 1: Create Directory
```bash
mkdir -p projects-dev/your-project
```

### Step 2: Copy Structure (Manual)
Copy all 8 subdirectories from `_template-project/`:
```bash
cp -r projects-dev/_template-project/0* projects-dev/your-project/
```

### Step 3: Create MOC-Project.md
```bash
cp projects-dev/_template-project/MOC-Project.md \
   projects-dev/your-project/MOC-Project.md
```

### Step 4: Customize
Edit `projects-dev/your-project/MOC-Project.md`:
- Update title, status, description
- Add project-specific links
- Update frontmatter metadata

### Step 5: Fill Sections
1. **00-overview/** — Define what you're building
2. **01-planning/** — Create your plan
3. **02-architecture/** — Document design
4. **Rest** — Fill as project progresses

---

## 📖 USAGE PATTERNS

### Workflow: Planning Phase
```
1. Create project directory
2. Fill 00-overview/ (concept, alignment)
3. Create plan in 01-planning/
4. Document initial architecture in 02-architecture/
```

### Workflow: Development Phase
```
1. Break down features in 03-features/
2. Organize work into phases in 04-phases/
3. Capture sessions in 05-sessions/
4. Log decisions in 06-decisions/
5. Track progress in 07-tracking/
```

### Workflow: Monitoring
```
1. Check 07-tracking/tracking.md for status
2. Review 07-tracking/blockers.md for issues
3. Read 08-logs/ for historical context
4. Consult 06-decisions/ for past choices
```

---

## 🔌 IDE CONNECTOR INTEGRATION

### IDE Can Write To:
✅ `projects-dev/{project}/**`  
✅ `sessions-dev/**`  
✅ `memory/**`  

### IDE CANNOT Write To:
❌ `_template-project/` (read-only reference)  
❌ Vault layer (20-Projects, 30-Knowledge, etc.)  

### Usage from IDE:
```python
# IDE Connector writes session outputs to:
projects-dev/myteamhub/05-sessions/session-2026-04-19.md

# Or to tracking:
projects-dev/myteamhub/07-tracking/tracking.md
```

---

## 🧩 REFERENCE STRUCTURE

Each project's **MOC-Project.md** contains:
- Project overview
- 8-section reference guide
- Quick links to all sections
- Status & metrics table
- Relevant project references

**Example**: [[myteamhub/MOC-Project]]

---
See `_template-project/MOC-Project.md` for structure
## 🔗 INTEGRATION WITH VAULT

### Inside Vault
Projects accessible via:
```
[[projects-dev/myteamhub/MOC-Project]]
[[projects-dev/myteamhub/00-overview/concept]]
[[projects-dev/myteamhub/07-tracking/tracking]]
```

### From Sessions-Dev
Reference your project:
```
Working on: [[../../projects-dev/myteamhub/]]
Feature: [[../../projects-dev/myteamhub/03-features/FEATURE_TEMPLATE]]
```

---

## ✅ PROJECT LIFECYCLE

### 📋 Planning Phase (Week 1-2)
- Sections: 00-overview/, 01-planning/
- Files: concept, alignment, plan-resume

### 🏗️ Design Phase (Week 2-3)
- Sections: 02-architecture/, 03-features/
- Files: architecture, feature specs

### ⚙️ Development Phase (Week 3+)
- Sections: 04-phases/, 05-sessions/, 06-decisions/
- Files: phase tracking, sessions, decisions

### 📊 Monitoring Phase (Ongoing)
- Sections: 07-tracking/, 08-logs/
- Files: tracking.md, blockers.md, logs

---

## 🎯 BEST PRACTICES

✅ **Do**:
- Use template as single source of truth
- Keep _template-project/ unchanged
- Fill sections as project progresses
- Update MOC-Project.md regularly
- Link between projects when related

❌ **Don't**:
- Modify _template-project/ structure
- Create files outside the 8 sections
- Leave MOC-Project.md unstated
- Duplicate template files elsewhere
- Ignore blocking issues

---

## 🔗 QUICK LINKS

### Template
👉 [[_template-project/MOC-Project]] — Template reference & structure

### Vault Integration
👉 [[../MOC-Agent-Dev]] — Agent-dev workspace  
👉 [[../../MOC]] — Root navigation  

---

## 📞 NEED HELP?

**Questions about structure?** See [[_template-project/MOC-Project]]  
**Want to add a project?** Follow "Creating a New Project" steps above  
**Issue with tracking?** Check [[myteamhub/07-tracking/tracking]]  

---

**Template Version**: 1.0  
**Last Updated**: 2026-04-19  
**Status**: Production-Ready  
