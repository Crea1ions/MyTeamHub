---
id: moc-agent-openclaw
type: moc
title: "OpenClaw Read-Only Analysis Agent"
status: active
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:00Z"
confidence: high
tags: [moc, agent-openclaw, analysis, external, read-only]
lien: [[MOC]]
---

# 🟣 MOC — Agent OpenClaw (Analysis)

> Espace de memoire et d'analyse externe en lecture seule  
> 📊 Insights • 🔍 Deep Analysis • 📈 Patterns

---

## 🎯 1. OPENCLAW MISSION

OpenClaw est un agent **d'analyse externe** à **lecture seule**:

- 📊 Analyse globale du Vault
- 🔍 Détection de patterns complexes
- 📈 Recommandations strategiques
- 🚫 JAMAIS d'écriture directe

---

## 🧠 2. RÔLE & RESPONSABILITÉS

### Lecture Seule
- ✅ Accès complet au Vault (lecture)
- ✅ Analyse de tous les documents
- ✅ Extraction de patterns
- ✅ Génération de rapports
- ❌ Écriture INTERDITE
- ❌ Modification INTERDITE
- ❌ Suppression INTERDITE

### Cas d'Usage
1. **Audit de Cohérence** — Vérifier liens, métadata, structure
2. **Pattern Detection** — Identifier tendances, connections
3. **Risk Analysis** — Détecter blockers, dépendances
4. **Knowledge Synthesis** — Assembler insights distribués
5. **Quality Metrics** — Mesurer santé système

---

## 📋 3. STRUCTURE COGNITIVE

├── agent-openclaw
│   │   ├── 00-memory
│   │   │   ├── learned-patterns.md
│   │   │   ├── mental-model.md
│   │   │   └── vault-understanding.md
│   │   ├── 01-analyses
│   │   │   ├── agents
│   │   │   ├── projects
│   │   │   ├── system
│   │   │   └── vault
│   │   ├── 02-insights
│   │   │   ├── anomalies.md
│   │   │   ├── optimization-opportunities.md
│   │   │   └── weak-signals.md
│   │   ├── 03-reports
│   │   │   └── analysis-reports.md
│   │   ├── 04-logs
│   │   │   └── openclaw-log.md
│   │   └── MOC-Agent-Openclaw.md


### 00-memory/ — Internal Model
- `mental-model.md` — Self-concept & operating principles
- `vault-understanding.md` — System architecture comprehension
- `learned-patterns.md` — Emergent rules & observations

→ **Purpose**: Avoid re-analyzing everything each time

### 01-analyses/ — Raw Analysis
Scoped by domain:
- `vault/` — Structure, metadata, compliance
- `projects/` — Project coherence, dependencies
- `agents/` — Agent behaviors & interactions  
- `system/` — Protocols, logs, infrastructure

→ **Purpose**: Organized working space (not output)

### 02-insights/ — Strategic Intelligence
- `index.md` — Quick navigation dashboard 🎯
- `weak-signals.md` — Early indicators of drift
- `anomalies.md` — Deviations from expected patterns
- `optimization-opportunities.md` — Improvement ideas

→ **Purpose**: System self-improvement engine
→ **Entry Point**: [[02-insights/index]] (prevents insight cemetery!)

### 03-reports/ — Formal Output
- `analysis-reports.md` — Index of all reports
- Individual reports: audits, assessments, recommendations

→ **Purpose**: Exploitable, actionable findings

### 04-logs/ — Traçabilité
- `openclaw-log.md` — Activity journal

→ **Purpose**: Historical record & debugging

---

## 🧠 4. ANALYSE TYPES

### Structure Analysis
- Vérifier respect 10-directory system
- Contrôler nommage fichiers (kebab-case)
- Valider metadata frontmatter
- Détecter orphans, duplicates

### Content Analysis
- Parser tous les fichiers
- Extraire concepts clés
- Mapper relationships
- Identifier gaps

### Quality Analysis
- Mesurer coverage tags
- Auditer linking integrity
- Vérifier date freshness
- Contrôler taille fichiers

### Risk Analysis
- Identifier single points of failure
- Détecter circular references
- Mesurer coupling
- Analyser complexity

---

## 🔌 4. INTÉGRATION AVEC ORCHESTRATOR

### Flow
```
Orchestrator (API)
    ↓
OpenClaw Service (read-only token)
    ↓
Vault (read-only)
    ↓
Report Generation
    ↓
Orchestrator (result callback)
```

### Limitations
- Token scope: READ ONLY
- Max file size: 10 MB
- Max query time: 30s
- Rate limit: 10 req/min

---

## 📊 5. AUDIT REPORTS

### Stored in `00-Inbox/agent-openclaw/logs/`

#### 📌 Regular Audits
- `vault-structure-audit.md` — Structure validation
- `metadata-audit.md` — Frontmatter compliance
- `content-audit.md` — Content quality
- `relationship-audit.md` — Link graph analysis

#### 🔍 Ad-hoc Analyses
- `pattern-analysis.md` — Custom pattern detection
- `risk-assessment.md` — Potential issues
- `opportunity-analysis.md` — Improvement suggestions

---

## 🧩 6. OPENCLAW-ORCHESTRATOR PROTOCOL

### Periodic Tasks
```
Every 24 hours:
1. Full vault structure audit
2. Metadata compliance check
3. Link integrity verification
4. Generate health report
```

### On-Demand Tasks
```
When requested:
1. Analyze specific pattern
2. Generate custom report
3. Compare snapshots
4. Audit specific section
```

### Report Format
```yaml
---
report_id: uuid
analysis_type: [structure|content|relationship|quality|risk]
timestamp: ISO-8601
confidence: high|medium|low
findings: [...]
recommendations: [...]
---
```

---

## 🚫 7. RULES (IMMUTABLE)

### Ce que OpenClaw PEUT faire ✅
- Lire tous les fichiers du Vault
- Analyser metadata
- Générer rapports
- Identifier patterns
- Donner recommandations

### Ce que OpenClaw NE PEUT PAS faire ❌
- Écrire fichiers (jamais)
- Modifier metadata
- Supprimer fichiers
- Exécuter code
- Accéder credentials
- Modifier structure

---

## 📈 8. METRICS TRACKED

### Health Metrics
- Files with valid frontmatter: %
- Links with valid targets: %
- Orphan files: count
- Files updated this month: count

### Quality Metrics
- Avg file size: bytes
- Avg tags per file: count
- Avg links per file: count
- Coverage by type: %

### Timing Metrics
- Last audit: timestamp
- Avg audit duration: ms
- Last major change: timestamp
- Files changed this week: count

---

## 🔗 9. OPENCLAW WORKSPACE

### Directories
- `00-Inbox/agent-openclaw/` — OpenClaw workspace
  - `logs/` — Analysis reports
  - `external-analysis/` — Raw analysis data
  - `MOC-Agent-Openclaw.md` — This file

### Key Files
- `logs/openclaw-log.md` — Session log
- `external-analysis/` — Analysis results storage

---

## 🎯 10. SUCCESS CRITERIA

OpenClaw is successful if:
- ✅ Detects 100% of orphan files
- ✅ Validates metadata in <5s
- ✅ Generates comprehensive reports
- ✅ Zero write attempts
- ✅ Useful recommendations

---

## 📚 11. REFERENCES

→ [[MOC]]  
→ [[10-Context/architecture-global]]  
→ [[80-Protocols/external-connector-rules]]  
→ [[10-Context/permanent-alignment]]

---

## 🔒 12. SECURITY NOTES

- OpenClaw token: READ ONLY sempre
- No API keys in reports
- No sensitive data exposure
- Audit log: All read operations (optional)
- Access control: Orchestrator managed

---

**Next Review**: 2026-04-25  
**Status**: Production Ready ✅
